import * as THREE from 'three';

/** Full bind/posed hinge-frame IK, in the normalized asset's +Z-forward authoring space. */
export function solveLeg(
  side: string,
  ankle: THREE.Vector3,
  bones: Map<string, THREE.Bone>,
  scene: THREE.Object3D,
  poleYaw = 0,
) {
  const thigh = bones.get(side + 'Thigh')!,
    shin = bones.get(side + 'Shin')!,
    foot = bones.get(side + 'Foot')!;
  scene.updateMatrixWorld(true);
  const hip = thigh.getWorldPosition(new THREE.Vector3());
  const l1 = shin.position.length(),
    l2 = foot.position.length();
  const direction = ankle.clone().sub(hip);
  const distance = THREE.MathUtils.clamp(direction.length(), 0.001, l1 + l2 - 0.002);
  direction.normalize();
  const along = (l1 * l1 + distance * distance - l2 * l2) / (2 * distance);
  const bend = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  const pole = new THREE.Vector3(Math.sin(poleYaw), 0, Math.cos(poleYaw));
  pole.addScaledVector(direction, -pole.dot(direction)).normalize();
  const knee = hip.clone().addScaledVector(direction, along).addScaledVector(pole, bend);
  const upper = knee.clone().sub(hip).normalize(),
    lower = ankle.clone().sub(knee).normalize();
  const hinge = upper.clone().cross(lower).normalize();
  const bindHinge = shin.position.clone().cross(foot.position).normalize();
  function frame(d: THREE.Vector3, h: THREE.Vector3) {
    const y = d.clone().normalize(),
      z = h.clone().cross(y).normalize(),
      x = y.clone().cross(z).normalize();
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  }
  const parentInverse = thigh.parent!.getWorldQuaternion(new THREE.Quaternion()).invert();
  thigh.quaternion
    .copy(
      frame(
        upper.clone().applyQuaternion(parentInverse),
        hinge.clone().applyQuaternion(parentInverse),
      ),
    )
    .multiply(frame(shin.position, bindHinge).invert());
  scene.updateMatrixWorld(true);
  const thighInverse = thigh.getWorldQuaternion(new THREE.Quaternion()).invert();
  shin.quaternion
    .copy(
      frame(
        lower.clone().applyQuaternion(thighInverse),
        hinge.clone().applyQuaternion(thighInverse),
      ),
    )
    .multiply(frame(foot.position, bindHinge).invert());
}
