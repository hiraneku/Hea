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

/** Harmonic shoulder transition on the actual welded surface. A horizontal
 * classifier cut used to assign neighbouring armpit vertices to unrelated bones,
 * producing triangular fins when the arms moved. Keep shaft labels, diffuse only
 * across the connected shoulder surface, and weld UV seams during diffusion. */
export function armInfluence101172(geometry: THREE.BufferGeometry): Float32Array {
  const labels = armRegions101172(geometry);
  const p = geometry.getAttribute('position');
  const canonical = new Int32Array(p.count);
  const welded = new Map<string, number>();
  for (let i = 0; i < p.count; i++) {
    const key = [p.getX(i), p.getY(i), p.getZ(i)].map((v) => Math.round(v * 1e5)).join(',');
    const found = welded.get(key);
    canonical[i] = found ?? i;
    if (found === undefined) welded.set(key, i);
  }
  const neighbours = new Map<number, Set<number>>();
  const active = (i: number) => p.getY(i) > 1.36 && p.getY(i) < 1.59;
  const index = geometry.index;
  const vertex = (i: number) => canonical[index ? index.getX(i) : i];
  for (let i = 0; i < (index?.count ?? p.count); i += 3) {
    const tri = [vertex(i), vertex(i + 1), vertex(i + 2)];
    for (const a of tri)
      if (active(a)) {
        let set = neighbours.get(a);
        if (!set) neighbours.set(a, (set = new Set()));
        for (const b of tri) if (b !== a) set.add(b);
      }
  }
  const weights = Float32Array.from(labels);
  const entries = [...neighbours].map(([i, ns]) => [i, [...ns]] as const);
  // Fixed body above the shoulder and fixed connected shafts below the armpit.
  for (let iteration = 0; iteration < 300; iteration++)
    for (const [i, ns] of entries)
      weights[i] = ns.reduce((sum, j) => sum + weights[j], 0) / ns.length;
  for (let i = 0; i < p.count; i++) weights[i] = weights[canonical[i]];
  return weights;
}
