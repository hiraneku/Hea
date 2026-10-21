import * as THREE from 'three';

/** Final pose constraint shared by gameplay, the motor and clip inspection.
 * Clamp, never add: repeated/paused frames cannot accumulate an outward offset.
 * Preserve the authored swing and larger abduction, including flight poses.
 */
export class CharacterArmSpace {
  private readonly arms: { upper: THREE.Object3D; elbow: THREE.Object3D; sign: number }[];
  constructor(model: THREE.Object3D) {
    this.arms = ['Left', 'Right'].map((side) => ({
      upper: model.getObjectByName(side + 'UpperArm')!,
      elbow: model.getObjectByName(side + 'ForeArm')!,
      sign: side === 'Left' ? 1 : -1,
    }));
  }
  apply() {
    for (const { upper, elbow, sign } of this.arms) {
      upper.rotation.z = sign * Math.max(0.1, sign * upper.rotation.z);
      elbow.rotation.x = Math.min(elbow.rotation.x, -0.12);
    }
  }
}
