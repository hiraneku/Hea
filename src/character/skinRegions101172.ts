import type * as THREE from 'three';

/** Separate hanging arms from legs by mesh connectivity below the shoulder.
 * Spatial X/Y masks alone mistake the outer upper thigh for a hand on this model.
 * Weld coincident vertices for UV/normal seams; never change the source geometry.
 */
export function armRegions101172(geometry: THREE.BufferGeometry): Uint8Array {
  const positions = geometry.getAttribute('position');
  const parent = Int32Array.from({ length: positions.count }, (_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const join = (a: number, b: number) => {
    parent[find(a)] = find(b);
  };
  const below = (i: number) => positions.getY(i) < 1.4;
  const welded = new Map<string, number>();
  for (let i = 0; i < positions.count; i++) {
    if (!below(i)) continue;
    const key = [positions.getX(i), positions.getY(i), positions.getZ(i)]
      .map((v) => Math.round(v * 1e5))
      .join(',');
    const previous = welded.get(key);
    if (previous !== undefined) join(i, previous);
    else welded.set(key, i);
  }
  const index = geometry.index;
  const vertex = (i: number) => (index ? index.getX(i) : i);
  for (let i = 0; i < (index?.count ?? positions.count); i += 3) {
    const tri = [vertex(i), vertex(i + 1), vertex(i + 2)].filter(below);
    for (let j = 1; j < tri.length; j++) join(tri[0], tri[j]);
  }
  const minimum = new Map<number, number>();
  for (let i = 0; i < positions.count; i++)
    if (below(i)) {
      const root = find(i);
      minimum.set(root, Math.min(minimum.get(root) ?? Infinity, positions.getY(i)));
    }
  const regions = new Uint8Array(positions.count);
  for (let i = 0; i < positions.count; i++)
    if (below(i) && minimum.get(find(i))! > 0.72) regions[i] = 1;
  return regions;
}
