import * as THREE from 'three';
import { clamp, damp } from './math';
import { landingDip, springVector } from './motion';
import { FLIGHT, GROUND } from './config';
import type { Settings } from './types';

const UP = new THREE.Vector3(0, 1, 0);

/** The narrowest world query the rig needs: how far along a segment the way is blocked. */
export type CameraTrace = (
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
) => { t: number } | null;

/**
 * Everything the camera needs to know about the body it watches, gathered once per frame by
 * the game. The rig owns no game state beyond the camera itself, so it can be driven (and
 * tested) without a duel running.
 */
export interface CameraRigFrame {
  dt: number;
  snap?: boolean;
  /** Wall-clock seconds, for the parts that keep playing while the simulation is frozen. */
  realDt?: number;
  /** The view in use this frame: from the eyes, or the chase framing behind the body. */
  first: boolean;
  yaw: number;
  pitch: number;
  roll: number;
  time: number;
  player: THREE.Vector3;
  velocity: THREE.Vector3;
  impulse: THREE.Vector3;
  dashVelocity: THREE.Vector3;
  dashStrength: number;
  dashActive: boolean;
  /** The body's sideways lean, which the eye rides a little in first person. */
  bankZ: number;
  flightEnabled: boolean;
  knockTime: number;
  settings: Settings;
  trace: CameraTrace;
}

/**
 * The camera as a physical thing: a sprung chase follow (or a tight eye), a kick spring that
 * shoves the whole view when the body is hit and pulls it back with a little overshoot, a
 * landing dip, a speed-driven field of view and the heavy-hit zoom punch. Extracted from
 * `Game` unchanged in behaviour; the game gathers a {@link CameraRigFrame} and the rig moves
 * the camera it was given.
 */
export class CameraRig {
  /**
   * A shove of the whole view, in world metres: the body is hit from somewhere and the eye
   * should learn the direction the same way the body does. Springs back to nothing in
   * `update`; `kickRate` is the spring's velocity.
   */
  readonly kickOffset = new THREE.Vector3();
  /** How many landings have shoved the view since the duel began, for the tests. */
  landings = 0;
  /** 1 right after a heavy contact, decaying in real time: drives the camera zoom punch. */
  punch = 0;
  /** The resting field of view the speed/dash widening eases around. */
  shake = 0;
  private readonly kickRate = new THREE.Vector3();
  private readonly kickZero = new THREE.Vector3();
  private springVelocity = new THREE.Vector3();
  private wasFirst = false;
  private headBob = 0;
  private castKick = 0;
  private fovBase = 74;
  private punchClock = 0;

  constructor(private readonly camera: THREE.PerspectiveCamera) {}

  /** Back to a resting view: no shove, no punch, no remembered follow velocity. */
  reset() {
    this.springVelocity.set(0, 0, 0);
    this.kickOffset.set(0, 0, 0);
    this.kickRate.set(0, 0, 0);
    this.landings = 0;
    this.shake = 0;
    this.punch = 0;
  }

  /** A cast from the eyes nudges the view up by a fraction of a degree. */
  noteCast() {
    this.castKick = 1;
  }

  /**
   * Shove the view along `direction` by `metres`, capped so no single blow can throw the
   * frame. The first-person eye is nudged less than the chase camera: it sits inside the
   * body, where a centimetre of travel already reads as a lot. The cap follows the view the
   * player is about to see, which is why a hammer — which throws the body and so steps the
   * camera back out — is sized for the chase camera even when the blow lands in first person.
   */
  kick(direction: THREE.Vector3, metres: number, first: boolean, reducedEffects: boolean) {
    if (reducedEffects || metres <= 0) return;
    if (direction.lengthSq() < 1e-6) return;
    const cap = first ? 0.035 : 0.06;
    this.kickOffset.addScaledVector(direction.clone().normalize(), metres).clampLength(0, cap);
  }

  /**
   * Touching down drops the view by the weight of the fall: nothing for a hop, up to eight
   * centimetres off a long drop. The spring in `update` lifts it back with a little
   * overshoot, which is how a body actually arrives.
   */
  land(fall: number, first: boolean, reducedEffects: boolean) {
    if (reducedEffects) return;
    const dip = landingDip(fall, first ? 0.04 : 0.08);
    if (dip <= 0) return;
    this.kickOffset.y = Math.max(-0.08, this.kickOffset.y - dip);
    this.landings++;
  }

  update(frame: CameraRigFrame) {
    const { dt, snap = false, realDt = 0, settings } = frame;
    if (dt <= 0 && !snap) {
      this.applyPunch(realDt, settings.reducedEffects);
      return;
    }
    const quaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(frame.pitch, frame.yaw, 0, 'YXZ'),
    );
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion),
      right = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);
    const first = frame.first;
    const pivot = frame.player.clone().add(new THREE.Vector3(0, 1.25, 0));
    let desired: THREE.Vector3;
    if (first) {
      // From the eyes: the head rides the body's lean a little, bobs on foot, and sits at the
      // avatar's eye line in either movement mode.
      const grounded = !frame.flightEnabled;
      const stride = grounded ? Math.min(1, frame.velocity.length() / GROUND.speed) : 0;
      this.headBob += frame.dt * (6 + stride * 8);
      const bob = grounded
        ? Math.sin(this.headBob) * 0.028 * stride
        : Math.sin(frame.time * 2.2) *
          0.02 *
          (1 - Math.min(1, frame.velocity.length() / FLIGHT.speed));
      desired = frame.player
        .clone()
        // The visor, not the chin: the avatar's `Head` bone sits 0.94 m up a 1.52 m body, so
        // the eye line is about 1.30 — measured off the rig, not guessed. Flying keeps the
        // higher eye it always had.
        .addScaledVector(UP, (frame.flightEnabled ? 1.36 : 1.3) + bob)
        .addScaledVector(right, -frame.bankZ * 0.12)
        .addScaledVector(forward, 0.12);
    } else {
      // The chase spring is loose, so the camera is fed the body's velocity to cancel most of
      // the steady-state lag: cruising keeps the avatar close while every change of heading
      // still swings it across the frame before the camera settles behind it again.
      const motion = frame.velocity.clone().add(frame.dashVelocity);
      desired = pivot
        .clone()
        .addScaledVector(forward, -settings.cameraDistance)
        .addScaledVector(right, 0.65)
        .addScaledVector(UP, 0.95)
        .addScaledVector(motion, 0.075);
      const wall = frame.trace(pivot, desired, 0.02);
      if (wall) desired.lerpVectors(pivot, desired, Math.max(0.1, wall.t - 0.06));
    }
    if (snap || first !== this.wasFirst) {
      // A view change (or a reset) cuts rather than flies the camera through the body.
      this.camera.position.copy(desired);
      this.springVelocity.set(0, 0, 0);
      this.wasFirst = first;
      this.kickOffset.set(0, 0, 0);
      this.kickRate.set(0, 0, 0);
    } else if (first) {
      // The eye follows the body tightly; only a whisper of lag so launches still read.
      springVector(this.camera.position, this.springVelocity, desired, 60, frame.dt);
    } else {
      // A looser chase follow than before: the body drifts across the frame through turns and
      // the camera settles behind it, instead of being bolted to the avatar.
      springVector(
        this.camera.position,
        this.springVelocity,
        desired,
        frame.knockTime > 0 ? 14 : 18,
        frame.dt,
      );
      // ...but never so loose that the avatar leaves the frame: cap the lateral drift.
      const offset = this.camera.position.clone().sub(desired),
        side = offset.dot(right),
        limit = 2.2;
      if (Math.abs(side) > limit)
        this.camera.position.addScaledVector(right, Math.sign(side) * limit - side);
      // Keep a backwards launch from pushing the avatar through the chase camera.
      const behind = this.camera.position.clone().sub(pivot).dot(forward.clone().negate()),
        nearest = settings.cameraDistance * 0.61;
      if (behind < nearest) {
        this.camera.position.addScaledVector(forward, behind - nearest);
        this.springVelocity.copy(frame.velocity).add(frame.impulse).add(frame.dashVelocity);
      }
      const obstruction = frame.trace(pivot, this.camera.position, 0.12);
      if (obstruction) {
        this.camera.position.lerpVectors(
          pivot,
          this.camera.position,
          Math.max(0.08, obstruction.t - 0.03),
        );
        this.springVelocity.multiplyScalar(0.2);
      }
    }
    // The shove springs back with a little overshoot, so a hit reads as a body absorbing it
    // rather than a frame being nudged. Applied after the follow, so the chase spring never
    // fights it; re-traced, because a view that moves must still not enter a wall.
    springVector(this.kickOffset, this.kickRate, this.kickZero, 15, frame.dt);
    if (this.kickOffset.lengthSq() > 1e-8) {
      this.camera.position.add(this.kickOffset);
      const escape = frame.trace(pivot, this.camera.position, 0.1);
      if (escape)
        this.camera.position.lerpVectors(
          pivot,
          this.camera.position,
          Math.max(0.08, escape.t - 0.03),
        );
    }
    this.shake = damp(this.shake, 0, 11, frame.dt);
    const shake = settings.reducedEffects ? 0 : this.shake;
    // A cast nudges the first-person view up by a fraction of a degree and settles back.
    this.castKick = damp(this.castKick, 0, 14, frame.dt);
    const kick = first && !settings.reducedEffects ? this.castKick * 0.012 : 0;
    const targetRotation = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        frame.pitch + Math.sin(frame.time * 49) * shake * 0.4 + kick,
        frame.yaw + Math.sin(frame.time * 37 + 1.3) * shake * 0.4,
        first ? frame.roll * 0.55 : frame.roll,
        'YXZ',
      ),
    );
    if (snap || first !== this.wasFirst) this.camera.quaternion.copy(targetRotation);
    else this.camera.quaternion.slerp(targetRotation, 1 - Math.exp(-frame.dt * (first ? 40 : 22)));
    const speed = frame.velocity.clone().add(frame.impulse).add(frame.dashVelocity).length();
    // Speed widens the view; a dash kicks it wider still for its first instants. The
    // first-person view starts wider, as eyes do.
    const base = first ? settings.fovFirst : settings.fovThird;
    this.fovBase = damp(
      this.fovBase,
      settings.reducedEffects
        ? base
        : base +
            clamp((speed - FLIGHT.speed * 0.65) * 0.28, 0, 11) +
            frame.dashStrength * (first ? 9 : 7),
      frame.dashActive ? 16 : 8,
      frame.dt,
    );
    this.applyPunch(0, settings.reducedEffects);
    this.camera.updateMatrixWorld();
  }

  /** The menu/demo framing: an orbiting showcase, or the fixed menu tableau. */
  showcase(
    mode: 'menu' | 'demo' | string,
    dt: number,
    player: THREE.Vector3,
    boss: THREE.Vector3,
    time: number,
  ) {
    const portrait = this.camera.aspect < 0.85;
    if (mode === 'demo') {
      const center = player.clone().lerp(boss, 0.45);
      const desired = center
        .clone()
        .add(new THREE.Vector3(Math.sin(time * 0.13) * 12 + 5, 5.8, 17));
      this.camera.position.lerp(desired, 1 - Math.exp(-dt * 3));
      this.camera.lookAt(center);
      this.camera.fov = 67;
    } else {
      this.camera.position.set(
        (portrait ? 8 : 12.5) + Math.sin(time * 0.08) * 2,
        7.0,
        portrait ? 28 : 23,
      );
      this.camera.lookAt(-1, 3.3, -0.5);
      this.camera.fov = portrait ? 60 : 57;
    }
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }

  /**
   * Zoom punch on heavy contact: the field of view snaps in by a few degrees and eases back
   * while the slow-motion tail plays, with a short rotational jolt in real time.
   */
  applyPunch(realDt: number, reducedEffects: boolean) {
    const punch = reducedEffects ? 0 : this.punch;
    this.camera.fov = this.fovBase - punch * 7.5;
    if (realDt > 0 && punch > 0.02) {
      const jolt = punch * punch * 0.012;
      this.camera.quaternion.multiply(
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(
            Math.sin(this.punchClock * 61) * jolt,
            Math.sin(this.punchClock * 47) * jolt,
            0,
          ),
        ),
      );
      this.punchClock += realDt;
    }
    this.camera.updateProjectionMatrix();
  }
}
