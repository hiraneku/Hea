import * as THREE from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { solveLeg } from './legIK';
import { CharacterPivot } from './CharacterPivot';
import type { CharacterAnatomy } from './anatomy101172';

/** Continuous procedural foot target. Phase is per foot, in [0, 1].
 * Match stance velocity and zero acceleration at lift-off/contact; rolling
 * changes ankle height through the measured sole, never a 25 mm lift reset. */
export function sampleLocomotionStep(
  phase: number,
  stance: number,
  stride: number,
  clearance: number,
  roll: number,
) {
  if (phase < stance)
    return {
      travel: stride * (0.5 - phase / stance),
      lift: 0,
      pitch: roll * THREE.MathUtils.smootherstep(phase / stance, 0.72, 1),
    };
  const u = (phase - stance) / (1 - stance);
  const m = (-stride * (1 - stance)) / stance;
  const liftPhase = u + 0.12 * Math.sin(2 * Math.PI * u);
  return {
    travel: -stride * 0.5 + m * u + (stride - m) * THREE.MathUtils.smootherstep(u, 0, 1),
    lift: clearance * Math.sin(Math.PI * liftPhase) ** 3,
    pitch:
      roll * (1 - THREE.MathUtils.smootherstep(u, 0, 0.55)) - 0.04 * Math.sin(Math.PI * u) ** 3,
  };
}

export interface LocomotionFrame {
  /** Actual velocity in normalized character +Z-forward space, metres/second. */
  x: number;
  forward: number;
  pace: number;
  airborne: boolean;
  turnRate: number;
}

/** Shared directional gait overlay, authored in normalized metres on a private rig.
 * Never modifies geometry or world/root translation. Hinge IK places the knee;
 * an explicit stance/swing curve supplies foot contact, toe-off and flight phase.
 */
export class CharacterLocomotion {
  private readonly rig: THREE.Object3D;
  private readonly pivot: CharacterPivot;
  private readonly bones = new Map<string, THREE.Bone>();
  private readonly actual = new Map<string, THREE.Bone>();
  private readonly rest = new Map<string, { p: THREE.Vector3; q: THREE.Quaternion }>();
  private readonly anatomy: CharacterAnatomy;
  private readonly soles = { Left: [] as THREE.Vector3[], Right: [] as THREE.Vector3[] };
  private phase = 0;
  private weight = 0;
  private pace = 0;
  private leanX = 0;
  private leanZ = 0;
  private smoothedHip?: THREE.Vector3;
  private readonly smoothed = new Map<string, THREE.Quaternion>();
  constructor(model: THREE.Object3D) {
    this.pivot = new CharacterPivot(model);
    this.rig = clone(model);
    this.rig.position.set(0, 0, 0);
    this.rig.quaternion.identity();
    this.rig.scale.setScalar(1);
    this.anatomy = this.rig.getObjectByName('HEA_101172')!.userData.heaCharacter.anatomy;
    model.traverse((object) => {
      if (!(object instanceof THREE.SkinnedMesh)) return;
      const positions = object.geometry.getAttribute('position');
      for (let i = 0; i < positions.count; i++)
        if (positions.getY(i) < 0.1) {
          const side = positions.getX(i) > 0 ? 'Left' : 'Right';
          const limb = side === 'Left' ? this.anatomy.left : this.anatomy.right;
          this.soles[side].push(
            new THREE.Vector3()
              .fromBufferAttribute(positions, i)
              .sub(new THREE.Vector3(...limb.ankle)),
          );
        }
    });
    this.rig.traverse((o) => {
      if (o instanceof THREE.Bone) {
        this.bones.set(o.name, o);
        this.rest.set(o.name, { p: o.position.clone(), q: o.quaternion.clone() });
      }
    });
    model.traverse((o) => {
      if (o instanceof THREE.Bone) this.actual.set(o.name, o);
    });
  }
  reset() {
    this.pivot.reset();
    this.phase = this.weight = this.pace = this.leanX = this.leanZ = 0;
    this.smoothed.clear();
    this.smoothedHip = undefined;
  }
  apply(dt: number, frame: LocomotionFrame) {
    const speed = Math.hypot(frame.x, frame.forward);
    const moving = speed > 0.08;
    // Idle pivots have their own support-foot controller, never the walking bob.
    if (!moving && !frame.airborne && this.pivot.apply(dt, frame.turnRate)) {
      this.weight = 0;
      this.smoothed.clear();
      this.smoothedHip = undefined;
      return;
    }
    if (moving || frame.airborne) this.pivot.reset();
    // Small heading corrections must not switch between two different poses
    // at a binary 12% lateral threshold every few frames.
    const directional = moving
      ? Math.max(
          THREE.MathUtils.smoothstep(Math.abs(frame.x) / speed, 0.08, 0.22),
          frame.forward < 0 ? 1 : 0,
        )
      : 0;
    const target = !frame.airborne && moving ? (frame.pace > 0 ? 1 : directional) : 0;
    const alpha = 1 - Math.exp(-12 * dt);
    this.weight += (target - this.weight) * alpha;
    this.pace += (frame.pace - this.pace) * (1 - Math.exp(-6 * dt));
    if (this.weight < 0.001) return;
    const run = THREE.MathUtils.clamp(this.pace, 0, 1);
    const sprint = THREE.MathUtils.clamp(this.pace - 1, 0, 1);
    const lateral = speed > 0 ? Math.abs(frame.x) / speed : 0;
    const stance = THREE.MathUtils.lerp(0.62, 0.42 - sprint * 0.055, run);
    const nominalStride = THREE.MathUtils.lerp(
      0.42 + run * 0.29 + sprint * 0.06,
      0.3 + run * 0.04,
      lateral,
    );
    const cadence = THREE.MathUtils.clamp((speed * stance) / nominalStride, 0.6, 2.9);
    this.phase = (this.phase + dt * cadence) % 1;
    for (const [name, bone] of this.bones) {
      bone.position.copy(this.rest.get(name)!.p);
      bone.quaternion.copy(this.rest.get(name)!.q);
    }
    const root = this.bones.get('Root')!;
    root.position.set(0, 0, 0);
    const hips = this.bones.get('Hips')!;
    const cycle = this.phase * Math.PI * 2;
    const stride = Math.min(nominalStride, (speed * stance) / cadence);
    const direction = moving
      ? new THREE.Vector3(frame.x / speed, 0, frame.forward / speed)
      : new THREE.Vector3(0, 0, 1);
    hips.position.set(
      Math.sin(cycle) * (0.012 + run * 0.008),
      1.105 + sprint * 0.005 - Math.cos(cycle * 2 - 2.2) * (0.004 + run * 0.012),
      this.anatomy.pelvis[2],
    );
    hips.rotation.set(
      0.012 + run * 0.045 + sprint * 0.025,
      Math.sin(cycle) * (0.035 + run * 0.035) * (1 - lateral) * Math.max(0, direction.z),
      -Math.sin(cycle) * 0.018,
    );
    const targets: {
      side: 'Left' | 'Right';
      ankle: THREE.Vector3;
      q: THREE.Quaternion;
      phase: number;
      offset: number;
    }[] = [];
    for (const [side, offset] of [
      ['Left', 0],
      ['Right', 0.5],
    ] as const) {
      const sign = side === 'Left' ? 1 : -1;
      const phase = (this.phase + offset) % 1;
      const step = sampleLocomotionStep(
        phase,
        stance,
        stride,
        0.055 + run * 0.105 + sprint * 0.035,
        0.12 + run * 0.18,
      );
      const travel = step.travel;
      let lift = step.lift,
        pitch = step.pitch;
      const ankle = new THREE.Vector3(sign * 0.14, 0.194 + lift, -0.035).addScaledVector(
        direction,
        travel,
      );
      // Duel walk: an ordinary stance/toe-off/swing rhythm, travelling sideways
      // with modest sole yaw. Keep the knee pole forward instead of twisting
      // the entire leg into the lateral direction. Never grapevine.
      const sidePhase = phase;
      const reach = 0.043 + run * 0.009;
      const sideStep = sampleLocomotionStep(
        sidePhase,
        stance,
        2 * reach,
        0.026 + run * 0.019 + sprint * 0.01,
        0,
      );
      const sideTravel = sideStep.travel,
        sideLift = sideStep.lift;
      const sideAnkle = new THREE.Vector3(
        sign * 0.13 + Math.sign(direction.x) * sideTravel,
        0.194,
        -0.035 + direction.z * travel,
      );
      ankle.lerp(sideAnkle, lateral);
      ankle.x = sign * THREE.MathUtils.clamp(sign * ankle.x, 0.085, 0.235);
      lift = THREE.MathUtils.lerp(lift, sideLift, lateral);
      pitch *= 1 - lateral;
      const footQ = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(pitch, direction.x * lateral * 0.28, 0, 'YXZ'),
      );
      const normal = new THREE.Vector3(0, 1, 0).applyQuaternion(footQ.clone().invert());
      let low = Infinity;
      for (const point of this.soles[side]) low = Math.min(low, point.dot(normal));
      ankle.y = 0.007 - low + lift;
      targets.push({
        side,
        ankle,
        q: footQ,
        phase: THREE.MathUtils.lerp(phase, sidePhase, lateral),
        offset,
      });
    }
    // Raise the pelvis towards neutral extension, only lowering as far as the
    // planted foot's reach requires. No permanent bent-knee run/strafe stance.
    for (const target of targets) {
      const thigh = this.bones.get(target.side + 'Thigh')!;
      const length =
        this.bones.get(target.side + 'Shin')!.position.length() +
        this.bones.get(target.side + 'Foot')!.position.length() -
        0.004;
      const dx = target.ankle.x - hips.position.x - thigh.position.x;
      const dz = target.ankle.z - hips.position.z - thigh.position.z;
      // Release after lift-off AND re-engage before landing. Switching a
      // binding height cap at either boundary stamps the pelvis down abruptly.
      const swing = (target.phase - stance) / (1 - stance);
      const release =
        target.phase < stance
          ? 0
          : 0.15 *
            THREE.MathUtils.smootherstep(swing, 0, 0.15) *
            (1 - THREE.MathUtils.smootherstep(swing, 0.65, 1));
      const cap =
        target.ankle.y +
        Math.sqrt(Math.max(0.1, length * length - dx * dx - dz * dz)) -
        thigh.position.y +
        release;
      const difference = hips.position.y - cap;
      hips.position.y =
        (hips.position.y + cap - Math.sqrt(difference * difference + 0.002 ** 2)) / 2;
    }
    for (const { side, ankle, q, offset } of targets) {
      const sign = side === 'Left' ? 1 : -1;
      solveLeg(side, ankle, this.bones, this.rig);
      this.rig.updateMatrixWorld(true);
      const foot = this.bones.get(side + 'Foot')!;
      foot.quaternion
        .copy(foot.parent!.getWorldQuaternion(new THREE.Quaternion()).invert())
        .multiply(q);
      const swing = Math.sin(cycle + offset * Math.PI * 2);
      this.bones
        .get(side + 'UpperArm')!
        .rotation.set(
          -swing * (0.18 + run * 0.28 + sprint * 0.1) * (1 - lateral) ** 2,
          0,
          -sign * 0.045 + lateral * Math.sin(cycle) * 0.015,
        );
      this.bones
        .get(side + 'ForeArm')!
        .rotation.set(-0.18 - (run * 0.9 + sprint * 0.12 + swing * 0.1) * (1 - lateral), 0, 0);
    }
    this.bones
      .get('Spine')!
      .rotation.set(
        0.015 + run * 0.045 * (1 - lateral),
        -Math.sin(cycle) * (0.025 + run * 0.035) * (1 - lateral) * Math.max(0, direction.z),
        lateral * Math.sin(cycle) * 0.012,
      );
    for (const [name, bone] of this.actual) {
      if (/Root|Neck|Head|End/.test(name)) continue;
      const desired = this.bones.get(name)!.quaternion;
      const smooth = this.smoothed.get(name) ?? bone.quaternion.clone();
      smooth.slerp(desired, 1 - Math.exp(-28 * dt));
      this.smoothed.set(name, smooth);
      bone.quaternion.slerp(smooth, this.weight);
      if (name === 'Hips') {
        this.smoothedHip ??= bone.position.clone();
        this.smoothedHip.lerp(hips.position, 1 - Math.exp(-28 * dt));
        bone.position.lerp(this.smoothedHip, this.weight);
      }
    }
  }
  /** Additive small flight bank, independent of camera pitch. */
  flightLean(dt: number, x: number, forward: number, airborne: boolean) {
    const a = 1 - Math.exp(-5 * dt);
    this.leanX +=
      ((airborne ? THREE.MathUtils.clamp(forward * 0.018, -0.12, 0.12) : 0) - this.leanX) * a;
    this.leanZ += ((airborne ? THREE.MathUtils.clamp(-x * 0.018, -0.1, 0.1) : 0) - this.leanZ) * a;
    return new THREE.Quaternion().setFromEuler(new THREE.Euler(this.leanX, 0, this.leanZ));
  }
}
