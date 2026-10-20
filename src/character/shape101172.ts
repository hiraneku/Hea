import * as THREE from 'three';
import type { CharacterAnatomy } from './anatomy101172';
import { armRegions101172 } from './skinRegions101172';

/** Requested derivative-only forearm taper. Source mesh, vertex order and UVs stay intact. */
export function taperForearms101172(geometry: THREE.BufferGeometry, anatomy: CharacterAnatomy) {
  const regions = armRegions101172(geometry);
  const p = geometry.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    if (!regions[i]) continue;
    const y = p.getY(i);
    const arm = anatomy.arms[p.getX(i) > 0 ? 'left' : 'right'];
    const taper =
      0.12 *
      THREE.MathUtils.smoothstep(y, 0.91, 1.0) *
      (1 - THREE.MathUtils.smoothstep(y, 1.19, arm.elbow[1] - 0.015));
    if (!taper) continue;
    const samples = [{ y: arm.wrist[1], x: arm.wrist[0], z: arm.wrist[2] }, ...arm.profile];
    let lower = samples[0],
      upper = samples[samples.length - 1];
    for (const sample of samples) {
      if (sample.y <= y) lower = sample;
      if (sample.y >= y) {
        upper = sample;
        break;
      }
    }
    const t =
      upper.y === lower.y ? 0 : THREE.MathUtils.clamp((y - lower.y) / (upper.y - lower.y), 0, 1);
    const x = THREE.MathUtils.lerp(lower.x, upper.x, t),
      z = THREE.MathUtils.lerp(lower.z, upper.z, t);
    p.setXYZ(i, x + (p.getX(i) - x) * (1 - taper), y, z + (p.getZ(i) - z) * (1 - taper));
  }
  p.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}
