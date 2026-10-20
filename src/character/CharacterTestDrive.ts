import * as THREE from 'three';
import type { CharacterPlayback } from './CharacterPlayback';

/** Flat-floor, camera-relative locomotion harness. No collision/terrain simulation.
 * Uses the SAME exported Walking clip and speed contract as gameplay.
 */
export class CharacterTestDrive {
  private readonly velocity = new THREE.Vector3();
  resetMotion() {
    this.velocity.set(0, 0, 0);
  }
  constructor(
    readonly body: THREE.Object3D,
    readonly playback: CharacterPlayback,
    readonly walkSpeed: number,
  ) {}
  update(dt: number, x: number, forward: number, camera: THREE.Camera) {
    const old = this.body.position.clone();
    const heading = camera.getWorldDirection(new THREE.Vector3());
    heading.y = 0;
    if (heading.lengthSq() < 1e-6) heading.set(0, 0, -1);
    heading.normalize();
    const right = heading.clone().cross(new THREE.Vector3(0, 1, 0));
    const direction = heading.multiplyScalar(forward).addScaledVector(right, x);
    if (direction.length() > 1) direction.normalize();
    // Match the playback contract's minimum walk rate for small analogue input.
    if (direction.length() > 0 && direction.length() < 0.35) direction.setLength(0.35);
    if (direction.lengthSq() > 0) this.velocity.copy(direction).multiplyScalar(this.walkSpeed);
    else this.velocity.multiplyScalar(Math.exp(-10 * dt));
    if (this.velocity.length() < 0.01) this.velocity.set(0, 0, 0);
    this.body.position.addScaledVector(this.velocity, dt);
    this.body.position.x = THREE.MathUtils.clamp(this.body.position.x, -5, 5);
    this.body.position.z = THREE.MathUtils.clamp(this.body.position.z, -5, 5);
    const delta = this.body.position.clone().sub(old);
    const speed = dt > 0 ? delta.length() / dt : 0;
    if (speed > 0.001) {
      const target = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        Math.atan2(delta.x, delta.z),
      );
      this.body.quaternion.slerp(target, 1 - Math.exp(-14 * dt));
    }
    this.playback.playing = true;
    this.playback.locomotion(dt, speed, true, this.walkSpeed);
    return delta;
  }
}
