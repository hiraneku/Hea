import * as THREE from 'three';

/** Additive, bounded Neck/Head control usable after any ordinary AnimationMixer.
 * clear BEFORE advancing the mixer, apply AFTER, so offsets never accumulate.
 */
export class CharacterLook {
  private readonly joints: { bone: THREE.Object3D; base: THREE.Quaternion; share: number }[];
  private applied = false;
  constructor(private readonly model: THREE.Object3D) {
    this.joints = [
      ['Neck', 0.65],
      ['Head', 0.35],
    ].map(([name, share]) => {
      const bone = model.getObjectByName(String(name));
      if (!bone) throw new Error(`Missing look joint: ${name}`);
      return { bone, base: bone.quaternion.clone(), share: Number(share) };
    });
  }
  clear() {
    if (this.applied) for (const j of this.joints) j.bone.quaternion.copy(j.base);
    this.applied = false;
  }
  /** Angles in radians, relative to the character's body, not the camera. */
  apply(yaw: number, pitch: number) {
    this.clear();
    yaw = THREE.MathUtils.clamp(yaw, (-60 * Math.PI) / 180, (60 * Math.PI) / 180);
    pitch = THREE.MathUtils.clamp(pitch, (-35 * Math.PI) / 180, (45 * Math.PI) / 180);
    for (const j of this.joints) {
      j.base.copy(j.bone.quaternion);
      j.bone.quaternion.multiply(
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(pitch * j.share, yaw * j.share, 0, 'YXZ'),
        ),
      );
    }
    this.applied = true;
    this.model.updateMatrixWorld(true);
  }
}
