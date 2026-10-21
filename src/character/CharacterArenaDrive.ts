import * as THREE from 'three';
import { CharacterArmSpace } from './CharacterArmSpace';
import { CharacterFacing, GROUND_PACES, directionalSpeed, angleDelta } from './CharacterFacing';
import { CharacterLocomotion } from './CharacterLocomotion';
import { CharacterLook } from './CharacterLook';
import type { CharacterPlayback } from './CharacterPlayback';

/** Test motor using the same facing, directional gait, look and pace rules as Game.
 * Only this motor supplies flat-floor physics; the arena retains its own physics. */
export class CharacterArenaDrive {
  pace = 0;
  locked = false;
  private lockView = 0;
  private lastView = 0;
  readonly facing = new CharacterFacing();
  private readonly gait: CharacterLocomotion;
  private readonly look: CharacterLook;
  private readonly armSpace: CharacterArmSpace;
  private readonly lastDirection = new THREE.Vector3(0, 0, 1);
  private speed = 0;
  constructor(
    readonly body: THREE.Object3D,
    readonly playback: CharacterPlayback,
  ) {
    playback.rootMotionEnabled = true;
    this.gait = new CharacterLocomotion(playback.model);
    this.look = new CharacterLook(playback.model);
    this.armSpace = new CharacterArmSpace(playback.model);
  }
  cyclePace() {
    this.pace = (this.pace + 1) % 3;
  }
  toggleLock() {
    this.locked = !this.locked;
    this.lockView = this.lastView;
  }
  resetMotion() {
    this.look.clear();
    this.gait.reset();
    this.playback.setMode('bind', true);
    this.playback.consumeRootMotion();
    this.speed = 0;
    this.locked = false;
    this.facing.reset(this.body.rotation.y);
  }
  requestFlight() {
    this.look.clear();
    return this.playback.isFlying ? this.playback.land() : this.playback.fly(0);
  }
  update(dt: number, x: number, forward: number, camera: THREE.Camera) {
    this.look.clear();
    const before = this.body.position.clone();
    const view = camera.getWorldDirection(new THREE.Vector3());
    const viewYaw = Math.atan2(view.x, view.z);
    this.lastView = viewYaw;
    if (this.locked && Math.abs(angleDelta(viewYaw, this.lockView)) > 0.65) this.locked = false;
    const horizontal = new THREE.Vector3(view.x, 0, view.z).normalize();
    const right = horizontal.clone().cross(new THREE.Vector3(0, 1, 0));
    const direction = horizontal
      .clone()
      .multiplyScalar(forward)
      .addScaledVector(right, x)
      .clampLength(0, 1);
    const magnitude = direction.length();
    const moving = magnitude > 0.01;
    const flying = this.playback.isFlying;
    const desiredSpeed = moving
      ? GROUND_PACES[this.pace] *
        magnitude *
        directionalSpeed(forward / Math.max(0.001, Math.hypot(x, forward)))
      : 0;
    this.speed += (desiredSpeed - this.speed) * (1 - Math.exp(-8 * dt));
    const travel = moving ? Math.atan2(direction.x, direction.z) : this.facing.yaw;
    this.facing.update(dt, viewYaw, moving, travel, this.locked);
    this.body.rotation.set(0, this.facing.yaw, 0);
    this.playback.playing = true;
    if (moving)
      this.playback.speed = Math.max(
        0.65,
        desiredSpeed / (this.playback.authoredWalkSpeed * this.body.scale.x),
      );
    this.playback.setMode(moving ? 'walk' : 'bind');
    this.playback.update(dt);
    const root = this.playback.consumeRootMotion().multiply(this.body.scale);
    this.body.position.y += root.y;
    if (moving) this.lastDirection.copy(direction).normalize();
    // Same ownership as the arena: root X/Z never add an extra launch/strafe boost.
    if (!moving && this.speed < 0.02) this.speed = 0;
    this.body.position.addScaledVector(this.lastDirection, this.speed * dt);
    const local = this.lastDirection
      .clone()
      .multiplyScalar(this.speed / this.body.scale.x)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), -this.facing.yaw);
    this.gait.apply(dt, {
      x: local.x,
      forward: local.z,
      pace: this.pace,
      airborne: flying,
      turnRate: this.facing.turnRate,
    });
    this.body.quaternion.multiply(this.gait.flightLean(dt, local.x, local.z, flying));
    this.armSpace.apply();
    this.look.apply(this.facing.headYaw, -Math.asin(THREE.MathUtils.clamp(view.y, -1, 1)));
    this.body.position.x = THREE.MathUtils.clamp(this.body.position.x, -5, 5);
    this.body.position.z = THREE.MathUtils.clamp(this.body.position.z, -5, 5);
    return this.body.position.clone().sub(before);
  }
}
