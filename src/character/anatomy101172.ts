import * as THREE from 'three';

export type Point3 = [number, number, number];
export interface Section {
  y: number;
  x: number;
  z: number;
  width: number;
  depth: number;
}
export interface LegAnatomy {
  hip: Point3;
  knee: Point3;
  ankle: Point3;
  ball: Point3;
  tip: Point3;
  profile: Section[];
}
export interface CharacterAnatomy {
  pelvis: Point3;
  crotch: number;
  left: LegAnatomy;
  right: LegAnatomy;
  forward: '+Z';
  method: string;
}

/** Horizontal triangle/plane intersections of the ORIGINAL normalized mesh.
 * Connected contour bounding centres avoid the bias of nonuniform vertex density.
 * 101172 contains an inner and outer shell; choose the larger coincident contour.
 * This is asset-specific measurement, not a generic anatomical auto-rigger.
 */
export function crossSections(geometry: THREE.BufferGeometry, y: number): Section[] {
  const p = geometry.getAttribute('position');
  const index = geometry.index;
  const count = index?.count ?? p.count;
  const graph = new Map<string, Set<string>>();
  const coordinates = new Map<string, [number, number]>();
  const key = (x: number, z: number) => `${Math.round(x * 1e5)},${Math.round(z * 1e5)}`;
  for (let i = 0; i < count; i += 3) {
    const ids = [
      index ? index.getX(i) : i,
      index ? index.getX(i + 1) : i + 1,
      index ? index.getX(i + 2) : i + 2,
    ];
    const ys = ids.map((id) => p.getY(id));
    if (Math.min(...ys) >= y || Math.max(...ys) <= y) continue;
    const points: [number, number][] = [];
    for (let edge = 0; edge < 3; edge++) {
      const next = (edge + 1) % 3;
      if ((ys[edge] - y) * (ys[next] - y) >= 0) continue;
      const t = (y - ys[edge]) / (ys[next] - ys[edge]);
      points.push([
        THREE.MathUtils.lerp(p.getX(ids[edge]), p.getX(ids[next]), t),
        THREE.MathUtils.lerp(p.getZ(ids[edge]), p.getZ(ids[next]), t),
      ]);
    }
    if (points.length !== 2) continue;
    const [a, b] = points.map(([x, z]) => key(x, z));
    if (a === b) continue;
    for (const [from, to, point] of [
      [a, b, points[0]],
      [b, a, points[1]],
    ] as const) {
      if (!graph.has(from)) graph.set(from, new Set());
      graph.get(from)!.add(to);
      coordinates.set(from, point);
    }
  }
  const seen = new Set<string>();
  const result: Section[] = [];
  for (const start of graph.keys()) {
    if (seen.has(start)) continue;
    const stack = [start];
    let minX = Infinity,
      maxX = -Infinity,
      minZ = Infinity,
      maxZ = -Infinity,
      vertices = 0;
    while (stack.length) {
      const k = stack.pop()!;
      if (seen.has(k)) continue;
      seen.add(k);
      const [x, z] = coordinates.get(k)!;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
      vertices++;
      for (const neighbor of graph.get(k)!) if (!seen.has(neighbor)) stack.push(neighbor);
    }
    if (vertices < 8) continue;
    result.push({
      y,
      x: (minX + maxX) / 2,
      z: (minZ + maxZ) / 2,
      width: maxX - minX,
      depth: maxZ - minZ,
    });
  }
  return result;
}

function fit(samples: Section[], field: 'x' | 'z'): [number, number] {
  const n = samples.length;
  const sumY = samples.reduce((s, p) => s + p.y, 0);
  const sumV = samples.reduce((s, p) => s + p[field], 0);
  const sumYY = samples.reduce((s, p) => s + p.y * p.y, 0);
  const sumYV = samples.reduce((s, p) => s + p.y * p[field], 0);
  const slope = (n * sumYV - sumY * sumV) / (n * sumYY - sumY * sumY);
  return [slope, (sumV - slope * sumY) / n];
}
const at = (line: [number, number], y: number) => line[0] * y + line[1];
const largest = (sections: Section[]) =>
  [...sections].sort((a, b) => b.width * b.depth - a.width * a.depth)[0];

/** Derive hip sockets from the actual crotch/leg junction, knees from the two
 * fitted branches of the curved leg centreline, and ankles from the foot-to-shin
 * cross-section transition. No rotation or mesh reshaping is used to fake a fit.
 */
export function measure101172(geometry: THREE.BufferGeometry): CharacterAnatomy {
  const cache = new Map<number, Section[]>();
  const section = (y: number) => {
    const rounded = Math.round(y * 1e5) / 1e5;
    if (!cache.has(rounded)) cache.set(rounded, crossSections(geometry, rounded));
    return cache.get(rounded)!;
  };
  let crotch = 0;
  for (let step = 0; step <= 30; step++) {
    const y = 1 + step * 0.005;
    if (section(y).some((s) => Math.abs(s.x) < 0.01 && s.width > 0.16)) {
      crotch = y;
      break;
    }
  }
  if (crotch < 1.04 || crotch > 1.09)
    throw new Error('101172 crotch topology no longer matches the source.');
  const pelvisY = crotch + 0.055;
  const body = largest(section(pelvisY).filter((s) => Math.abs(s.x) < 0.01));
  if (!body) throw new Error('Missing pelvis contour.');
  function leg(sign: number): LegAnatomy {
    const profile: Section[] = [];
    let previousX = sign * 0.22;
    for (let step = 0; step <= 42; step++) {
      const y = 0.2 + step * 0.02;
      if (y >= crotch) break;
      const candidates = section(y).filter(
        (s) => s.x * sign > 0.015 && Math.abs(s.x - previousX) < 0.03 && s.width > 0.075,
      );
      const contour = largest(candidates);
      if (!contour) throw new Error(`Missing leg contour at ${y}.`);
      profile.push(contour);
      previousX = contour.x;
    }
    let best = { error: Infinity, y: 0, z: 0 };
    for (let split = 7; split < profile.length - 7; split++) {
      const lower = profile.slice(0, split),
        upper = profile.slice(split);
      const lowFit = fit(lower, 'z'),
        upFit = fit(upper, 'z');
      const y = (upFit[1] - lowFit[1]) / (lowFit[0] - upFit[0]);
      if (y < 0.5 || y > 0.75) continue;
      const error =
        lower.reduce((s, p) => s + (at(lowFit, p.y) - p.z) ** 2, 0) +
        upper.reduce((s, p) => s + (at(upFit, p.y) - p.z) ** 2, 0);
      if (error < best.error) best = { error, y, z: at(lowFit, y) };
    }
    if (!Number.isFinite(best.error)) throw new Error('Could not fit the knee bend.');
    const upper = profile.slice(-6);
    const hipY = crotch + 0.025;
    const hip: Point3 = [at(fit(upper, 'x'), hipY), hipY, at(fit(upper, 'z'), hipY)];
    const knee: Point3 = [at(fit(profile, 'x'), best.y), best.y, best.z];
    let ankleSection: Section | undefined;
    for (let step = 0; step <= 16; step++) {
      const y = 0.1 + step * 0.01;
      const candidate = largest(section(y).filter((s) => s.x * sign > 0.1));
      if (candidate && candidate.depth <= candidate.width) {
        ankleSection = candidate;
        break;
      }
    }
    if (!ankleSection) throw new Error('Could not locate the foot/shin transition.');
    const ankle: Point3 = [ankleSection.x, ankleSection.y, ankleSection.z];
    const foot = largest(section(0.045).filter((s) => s.x * sign > 0.1));
    if (!foot) throw new Error('Missing foot contour.');
    // Forward is established by BOTH the source knee bulge and the forefoot
    // relative to the ankle, not by the absolute min/max Z of the whole foot.
    const lineZ = THREE.MathUtils.lerp(
      ankle[2],
      hip[2],
      (knee[1] - ankle[1]) / (hip[1] - ankle[1]),
    );
    if (knee[2] <= lineZ + 0.02 || foot.z + foot.depth / 2 <= ankle[2] + 0.1)
      throw new Error(
        'Source knee/forefoot do not face +Z. Reinspect instead of flipping the feet.',
      );
    return {
      hip,
      knee,
      ankle,
      ball: [foot.x, 0.045, foot.z + foot.depth * 0.22],
      tip: [foot.x, 0.035, foot.z + foot.depth * 0.46],
      profile,
    };
  }
  return {
    pelvis: [body.x, pelvisY, body.z],
    crotch,
    left: leg(1),
    right: leg(-1),
    forward: '+Z',
    method:
      'triangle-plane contours; paired centreline least-squares hinge; foot/shin aspect transition',
  };
}
