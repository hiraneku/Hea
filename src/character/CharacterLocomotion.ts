import * as THREE from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { solveLeg } from './legIK';
import type { CharacterAnatomy } from './anatomy101172';

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
    this.phase = this.weight = this.pace = this.leanX = this.leanZ = 0;
    this.smoothed.clear();
    this.smoothedHip = undefined;
  }
  apply(dt: number, frame: LocomotionFrame) {
    const speed = Math.hypot(frame.x, frame.forward);
    const moving = speed > 0.08;
    const turning = !moving && Math.abs(frame.turnRate) > 0.15;
    // Preserve the established forward Walking and its authored start/stop.
    const directional = moving && (Math.abs(frame.x) > speed * 0.12 || frame.forward < 0);
    const target =
      !frame.airborne && ((moving && (frame.pace > 0 || directional)) || turning) ? 1 : 0;
    const alpha = 1 - Math.exp(-12 * dt);
    this.weight += (target - this.weight) * alpha;
    this.pace += (frame.pace - this.pace) * (1 - Math.exp(-6 * dt));
    if (this.weight < 0.001) return;
    const run = THREE.MathUtils.clamp(this.pace, 0, 1);
    const sprint = THREE.MathUtils.clamp(this.pace - 1, 0, 1);
    const cadence = turning
      ? THREE.MathUtils.clamp(Math.abs(frame.turnRate), 0.7, 2)
      : THREE.MathUtils.clamp(speed / (1.05 + run * 0.65 + sprint * 0.2), 0.55, 3.2);
    this.phase = (this.phase + dt * cadence) % 1;
    for (const [name, bone] of this.bones) {
      bone.position.copy(this.rest.get(name)!.p);
      bone.quaternion.copy(this.rest.get(name)!.q);
    }
    const root = this.bones.get('Root')!;
    root.position.set(0, 0, 0);
    const hips = this.bones.get('Hips')!;
    const cycle = this.phase * Math.PI * 2;
    const stance = THREE.MathUtils.lerp(0.6, 0.38 - sprint * 0.04, run);
    const stride = turning ? 0.045 : Math.min(0.8, (speed * stance) / cadence);
    const direction = moving
      ? new THREE.Vector3(frame.x / speed, 0, frame.forward / speed)
      : new THREE.Vector3(0, 0, 1);
    hips.position.set(
      Math.sin(cycle) * (0.012 + run * 0.008),
      1.025 - run * 0.01 + Math.cos(cycle * 2) * (0.008 + run * 0.018),
      this.anatomy.pelvis[2],
    );
    hips.rotation.set(
      0.025 + run * 0.055 + sprint * 0.035,
      Math.sin(cycle) * (0.035 + run * 0.035),
      -Math.sin(cycle) * 0.018,
    );
    for (const [side, offset] of [
      ['Left', 0],
      ['Right', 0.5],
    ] as const) {
      const sign = side === 'Left' ? 1 : -1;
      const phase = (this.phase + offset) % 1;
      let travel: number, lift: number, pitch: number;
      if (phase < stance) {
        const u = phase / stance;
        travel = stride * (0.5 - u);
        // Late stance rolls the sole into toe-off, never reverses the foot.
        pitch = -Math.max(0, (u - 0.72) / 0.28) * (0.12 + run * 0.18);
        lift = Math.max(0, (u - 0.8) / 0.2) * 0.025;
      } else {
        const u = (phase - stance) / (1 - stance);
        const blend = THREE.MathUtils.smootherstep(u, 0, 1);
        travel = stride * (-0.5 + blend);
        lift = Math.sin(Math.PI * u) ** 2 * (turning ? 0.035 : 0.08 + run * 0.18 + sprint * 0.04);
        pitch = Math.sin(Math.PI * u) * (0.08 + run * 0.18);
      }
      const ankle = new THREE.Vector3(sign * 0.14, 0.194 + lift, -0.035).addScaledVector(
        direction,
        travel,
      );
      // Separate foot lanes during lateral motion instead of crossing through the other leg.
      ankle.x += sign * Math.abs(direction.x) * 0.025;
      ankle.x = sign * Math.max(0.075, sign * ankle.x);
      const footQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, 0, 0));
      const normal = new THREE.Vector3(0, 1, 0).applyQuaternion(footQ.clone().invert());
      let low = Infinity;
      for (const point of this.soles[side]) low = Math.min(low, point.dot(normal));
      ankle.y = 0.007 - low + lift;
      solveLeg(side, ankle, this.bones, this.rig);
      this.rig.updateMatrixWorld(true);
      const foot = this.bones.get(side + 'Foot')!;
      foot.quaternion
        .copy(foot.parent!.getWorldQuaternion(new THREE.Quaternion()).invert())
        .multiply(footQ);
      const swing = Math.sin(cycle + offset * Math.PI * 2);
      this.bones
        .get(side + 'UpperArm')!
        .rotation.set(-swing * (0.2 + run * 0.35 + sprint * 0.12), 0, -sign * 0.13);
      this.bones
        .get(side + 'ForeArm')!
        .rotation.set(-0.18 - run * 0.85 - sprint * 0.15 - swing * 0.12, 0, 0);
    }
    this.bones
      .get('Spine')!
      .rotation.set(0.015 + run * 0.045, -Math.sin(cycle) * (0.025 + run * 0.035), 0);
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
