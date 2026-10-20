import * as THREE from 'three';
import type { CharacterPlayback } from './CharacterPlayback';

/** Camera-relative flat-floor motor, with exclusive authored root motion while
 * launching the first step or closing the last two steps. The controller must not damp/slide planted feet. */
export class CharacterTestDrive {
  private lastSpeed = 0;
  requestJump() {
    return this.playback.jump(this.lastSpeed);
  }
  resetMotion() {
    this.lastSpeed = 0;
    this.playback.setMode('bind', true);
    this.playback.consumeRootMotion();
  }
  constructor(
    readonly body: THREE.Object3D,
    readonly playback: CharacterPlayback,
    private readonly requestedWalkSpeed?: number,
  ) {
    playback.rootMotionEnabled = true;
  }
  /** Default follows a newly replaced clip; optional override is a world-speed request. */
  get walkSpeed() {
    return this.requestedWalkSpeed ?? this.playback.authoredWalkSpeed * this.body.scale.x;
  }
  update(dt: number, x: number, forward: number, camera: THREE.Camera) {
    const old = this.body.position.clone();
    const heading = camera.getWorldDirection(new THREE.Vector3());
    heading.y = 0;
    if (heading.lengthSq() < 1e-6) heading.set(0, 0, -1);
    heading.normalize();
    const right = heading.clone().cross(new THREE.Vector3(0, 1, 0));
    const direction = heading.multiplyScalar(forward).addScaledVector(right, x);
    if (direction.length() > 1) direction.normalize();
    if (direction.length() > 0 && direction.length() < 0.35) direction.setLength(0.35);
    this.playback.playing = true;
    const jumping = this.playback.isJumping;
    if (jumping) {
      this.playback.setMode(direction.lengthSq() > 0 ? 'walk' : 'bind');
      this.playback.update(dt);
    } else if (direction.lengthSq() > 0) {
      const initiating = this.playback.mode === 'bind';
      const target = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        Math.atan2(direction.x, direction.z),
      );
      // Commit the launch heading before the weight transfer, then hold it
      // until first contact: yawing a planted sole would invalidate its lock.
      if (initiating && !this.playback.isStopping) this.body.quaternion.copy(target);
      else if (!this.playback.isStarting)
        this.body.quaternion.slerp(target, 1 - Math.exp(-14 * dt));
      this.playback.setMode('walk');
      const authoredLaunch = this.playback.isStarting;
      const authoredWorldSpeed = this.playback.authoredWalkSpeed * this.body.scale.x;
      this.playback.locomotion(dt, this.walkSpeed * direction.length(), true, authoredWorldSpeed);
      if (!authoredLaunch)
        this.body.position.addScaledVector(
          direction.clone().normalize(),
          authoredWorldSpeed * this.playback.speed * dt,
        );
    } else {
      this.playback.setMode('bind');
      this.playback.update(dt);
    }
    const rootDelta = this.playback
      .consumeRootMotion()
      .multiply(this.body.scale)
      .applyQuaternion(this.body.quaternion);
    this.body.position.add(rootDelta);
    this.body.position.x = THREE.MathUtils.clamp(this.body.position.x, -5, 5);
    this.body.position.z = THREE.MathUtils.clamp(this.body.position.z, -5, 5);
    const delta = this.body.position.clone().sub(old);
    if (dt > 0)
      this.lastSpeed = Math.hypot(delta.x, delta.z) / dt / Math.max(0.001, this.body.scale.x);
    return delta;
  }
}
