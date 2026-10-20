import * as THREE from 'three';
import type { CharacterPlayback } from './CharacterPlayback';

/** Camera-relative flat-floor motor, with exclusive authored root motion while
 * closing the last two steps. The controller must not damp/slide planted feet. */
export class CharacterTestDrive {
  resetMotion() {
    this.playback.setMode('bind', true);
    this.playback.consumeRootMotion();
  }
  constructor(
    readonly body: THREE.Object3D,
    readonly playback: CharacterPlayback,
    readonly walkSpeed: number,
  ) {
    playback.rootMotionEnabled = true;
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
    if (direction.lengthSq() > 0) {
      this.body.position.addScaledVector(direction, this.walkSpeed * dt);
      const target = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        Math.atan2(direction.x, direction.z),
      );
      this.body.quaternion.slerp(target, 1 - Math.exp(-14 * dt));
      this.playback.locomotion(dt, this.walkSpeed * direction.length(), true, this.walkSpeed);
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
    return this.body.position.clone().sub(old);
  }
}
