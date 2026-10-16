import { ARENA } from './config';

export interface Obstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  top: number;
  bottom?: number;
  owner?: number;
}
export interface Point3 {
  x: number;
  y: number;
  z: number;
}

export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export const damp = (current: number, target: number, speed: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-speed * dt));

export function seededRandom(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Resolve a vertical capsule's horizontal footprint against solid blockouts. */
export function resolveCircle(
  x: number,
  z: number,
  feet: number,
  radius: number,
  obstacles: Obstacle[],
  height = 1.65,
): { x: number; z: number } {
  for (let pass = 0; pass < 3; pass++) {
    for (const b of obstacles) {
      if (feet >= b.top - 0.06 || feet + height <= (b.bottom ?? 0) + 0.02) continue;
      const nx = clamp(x, b.minX, b.maxX);
      const nz = clamp(z, b.minZ, b.maxZ);
      const dx = x - nx,
        dz = z - nz;
      const d2 = dx * dx + dz * dz;
      if (d2 >= radius * radius) continue;
      if (d2 > 0.000001) {
        const d = Math.sqrt(d2);
        x = nx + (dx / d) * radius;
        z = nz + (dz / d) * radius;
      } else {
        const distances = [x - b.minX, b.maxX - x, z - b.minZ, b.maxZ - z];
        const side = distances.indexOf(Math.min(...distances));
        if (side === 0) x = b.minX - radius;
        else if (side === 1) x = b.maxX + radius;
        else if (side === 2) z = b.minZ - radius;
        else z = b.maxZ + radius;
      }
    }
  }
  return {
    x: clamp(x, -ARENA.halfSize, ARENA.halfSize),
    z: clamp(z, -ARENA.halfSize, ARENA.halfSize),
  };
}

export function groundHeight(
  x: number,
  z: number,
  feet: number,
  obstacles: Obstacle[],
  base = 0,
): number {
  let y = base;
  for (const b of obstacles) {
    if (
      x > b.minX - 0.2 &&
      x < b.maxX + 0.2 &&
      z > b.minZ - 0.2 &&
      z < b.maxZ + 0.2 &&
      feet >= b.top - 0.25
    )
      y = Math.max(y, b.top);
  }
  return y;
}

/** Earliest intersection on a segment, including fast projectiles that cross a target in one tick. */
export function segmentSphere(
  start: Point3,
  end: Point3,
  center: Point3,
  radius: number,
): number | null {
  const dx = end.x - start.x,
    dy = end.y - start.y,
    dz = end.z - start.z;
  const ox = start.x - center.x,
    oy = start.y - center.y,
    oz = start.z - center.z;
  const a = dx * dx + dy * dy + dz * dz;
  const c = ox * ox + oy * oy + oz * oz - radius * radius;
  if (c <= 0) return 0;
  if (a < 1e-10) return null;
  const b = 2 * (ox * dx + oy * dy + oz * dz);
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  const t = (-b - Math.sqrt(discriminant)) / (2 * a);
  return t >= 0 && t <= 1 ? t : null;
}

/**
 * How close two segments pass each other, in metres — the least distance between any point of
 * `a` and any point of `b`. Used for the beams: a shot is caught if the path it flew this
 * frame came within reach of the lance, so a fast bolt cannot slip through between frames.
 */
export function segmentDistance(a1: Point3, a2: Point3, b1: Point3, b2: Point3): number {
  const ux = a2.x - a1.x,
    uy = a2.y - a1.y,
    uz = a2.z - a1.z,
    vx = b2.x - b1.x,
    vy = b2.y - b1.y,
    vz = b2.z - b1.z,
    wx = a1.x - b1.x,
    wy = a1.y - b1.y,
    wz = a1.z - b1.z;
  const a = ux * ux + uy * uy + uz * uz,
    b = ux * vx + uy * vy + uz * vz,
    c = vx * vx + vy * vy + vz * vz,
    d = ux * wx + uy * wy + uz * wz,
    e = vx * wx + vy * wy + vz * wz,
    denom = a * c - b * b;
  // Closest parameters along each segment, clamped so a degenerate (point) segment still works.
  let s = denom > 1e-9 ? clamp((b * e - c * d) / denom, 0, 1) : 0;
  let t = c > 1e-9 ? (b * s + e) / c : 0;
  if (t < 0) {
    t = 0;
    s = a > 1e-9 ? clamp(-d / a, 0, 1) : 0;
  } else if (t > 1) {
    t = 1;
    s = a > 1e-9 ? clamp((b - d) / a, 0, 1) : 0;
  }
  const dx = wx + ux * s - vx * t,
    dy = wy + uy * s - vy * t,
    dz = wz + uz * s - vz * t;
  return Math.hypot(dx, dy, dz);
}

export function segmentBox(start: Point3, end: Point3, b: Obstacle, padding = 0): number | null {
  let near = 0,
    far = 1;
  const axes = [
    [start.x, end.x - start.x, b.minX - padding, b.maxX + padding],
    [start.y, end.y - start.y, (b.bottom ?? 0) - padding, b.top + padding],
    [start.z, end.z - start.z, b.minZ - padding, b.maxZ + padding],
  ];
  for (const [origin, direction, min, max] of axes) {
    if (Math.abs(direction) < 1e-9) {
      if (origin < min || origin > max) return null;
      continue;
    }
    let a = (min - origin) / direction,
      z = (max - origin) / direction;
    if (a > z) [a, z] = [z, a];
    near = Math.max(near, a);
    far = Math.min(far, z);
    if (near > far) return null;
  }
  return near >= 0 && near <= 1 ? near : null;
}

/** A ray's entry/exit distances through an AABB, measured in world metres. */
export function rayBoxSpan(
  origin: Point3,
  direction: Point3,
  box: Obstacle,
  limit = 250,
): { enter: number; exit: number } | null {
  let enter = 0,
    exit = limit;
  for (const [p, d, min, max] of [
    [origin.x, direction.x, box.minX, box.maxX],
    [origin.y, direction.y, box.bottom ?? 0, box.top],
    [origin.z, direction.z, box.minZ, box.maxZ],
  ]) {
    if (Math.abs(d) < 1e-9) {
      if (p < min || p > max) return null;
      continue;
    }
    let a = (min - p) / d,
      b = (max - p) / d;
    if (a > b) [a, b] = [b, a];
    enter = Math.max(enter, a);
    exit = Math.min(exit, b);
    if (enter > exit) return null;
  }
  return { enter, exit };
}

/** Merge touching cells first: a thick fractured wall is NOT a set of penetrable thin voxels. */
export function firstSolidSpan(origin: Point3, direction: Point3, boxes: Obstacle[]) {
  const spans = boxes
    .map((b) => rayBoxSpan(origin, direction, b))
    .filter((s): s is { enter: number; exit: number } => s !== null)
    .sort((a, b) => a.enter - b.enter);
  if (!spans.length) return null;
  const first = { ...spans[0] };
  for (let i = 1; i < spans.length; i++) {
    if (spans[i].enter > first.exit + 0.04) break;
    first.exit = Math.max(first.exit, spans[i].exit);
  }
  return first;
}
