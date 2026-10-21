import * as THREE from 'three';

/** Final pose constraint shared by gameplay, the motor and clip inspection.
 * A narrow near-bind envelope, not a mandatory outward abduction. Clamp, never
 * add: repeated/paused frames cannot accumulate an outward offset. Preserve swing.
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
      upper.rotation.z = sign * THREE.MathUtils.clamp(sign * upper.rotation.z, -0.07, 0.015);
      elbow.rotation.x = Math.min(elbow.rotation.x, -0.1);
    }
  }
}
