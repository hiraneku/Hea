import { ARENA } from './config';
import { seededRandom } from './math';

/**
 * The greybox city, in world metres. v0.12 opens a clear plaza (about 39 m in radius) at the
 * centre: the fight starts on open ground, and the monoliths stand in three loose rings
 * around it. The inner ring is placed by hand (test fixtures lean on these walls by name);
 * the two outer rings are seeded. Heights are unchanged from v0.11; footprints grew again.
 */
export type Tone = 'stone' | 'dark' | 'light';
export interface Monolith {
  /** Stable handle for fixtures and tests; outer-ring blocks are unnamed. */
  name?: string;
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  tone: Tone;
  /** Rotation about Z in radians: the one deliberately leaning block. */
  lean?: number;
  /** Thin slabs (≤ 3.2 m) can be pierced by the solar sphere; everything else is solid. */
  thin?: boolean;
}

/** Radius of the open plaza: no monolith face lies closer to the centre than this. */
export const PLAZA_RADIUS = 39;

/** Footprint box of a monolith on the ground (leaning blocks widen with their height). */
export function footprint(m: Monolith) {
  const lean = Math.abs(m.lean ?? 0),
    ex = (m.w * Math.cos(lean) + m.h * Math.sin(lean)) / 2,
    ez = m.d / 2;
  return { minX: m.x - ex, maxX: m.x + ex, minZ: m.z - ez, maxZ: m.z + ez, top: m.h };
}

const INNER: Monolith[] = [
  { name: 'east', x: 62, z: 16, w: 40, h: 44.2, d: 28, tone: 'stone' },
  { name: 'south', x: 16, z: 62, w: 44, h: 46.8, d: 26, tone: 'dark', lean: -0.1 },
  // The low, thick block the "cover" and "sight" fixtures hide behind.
  { name: 'cover', x: -44, z: 44, w: 36, h: 20.8, d: 30, tone: 'dark' },
  { name: 'west', x: -60, z: -16, w: 38, h: 31.2, d: 30, tone: 'stone' },
  // The thin slab on its floor plate: solar piercing, and the test-site label on its face.
  { name: 'slab', x: -16, z: -60, w: 23, h: 24.7, d: 2.4, tone: 'dark', thin: true },
  { name: 'plate', x: -16, z: -60, w: 25, h: 0.3, d: 10.5, tone: 'light' },
  { name: 'north', x: 44, z: -44, w: 42, h: 52, d: 24, tone: 'light' },
];

/** Shortest ground distance between two footprints (0 when they overlap). */
export function footprintGap(a: ReturnType<typeof footprint>, b: ReturnType<typeof footprint>) {
  const dx = Math.max(a.minX - b.maxX, b.minX - a.maxX, 0),
    dz = Math.max(a.minZ - b.maxZ, b.minZ - a.maxZ, 0);
  return Math.hypot(dx, dz);
}

/** Narrowest corridor the layout guarantees between any two monoliths. */
export const MIN_CORRIDOR = 14;
const extentOf = (f: ReturnType<typeof footprint>) =>
  Math.max(Math.abs(f.minX), f.maxX, Math.abs(f.minZ), f.maxZ);

/**
 * A seeded ring of `count` blocks around `radius`. Boxes are axis-aligned, so each one slides
 * outwards along its spoke until it leaves at least `MIN_CORRIDOR` to everything already
 * placed, and shrinks if that would push it past the arena rim.
 */
function ring(
  placed: readonly Monolith[],
  count: number,
  radius: number,
  phase: number,
  seed: number,
  size: [number, number],
  depth: [number, number],
): Monolith[] {
  const random = seededRandom(seed),
    tones: Tone[] = ['dark', 'light', 'stone'];
  const out: Monolith[] = [];
  for (let i = 0; i < count; i++) {
    const angle = ((i + phase) / count) * Math.PI * 2 + (random() - 0.5) * 0.1,
      thin = i % 5 === 0,
      h = Math.round((24 + random() * 22) * 1.3 * 10) / 10,
      tone = tones[i % 3],
      lean = i % 9 === 0 ? 0.065 : undefined;
    let w = Math.round(size[0] + random() * (size[1] - size[0])),
      d = thin ? 2.6 : Math.round(depth[0] + random() * (depth[1] - depth[0]));
    for (let r = radius - 4; r < radius + 60; r += 1) {
      const m: Monolith = {
        x: Math.round(Math.cos(angle) * r * 10) / 10,
        z: Math.round(Math.sin(angle) * r * 10) / 10,
        w,
        h,
        d,
        tone,
        lean,
        thin,
      };
      const f = footprint(m);
      if (extentOf(f) > ARENA.halfSize - 8) {
        // Out of room along this spoke: slim the block down and try again a little closer.
        w = Math.round(w * 0.88);
        if (!thin) d = Math.max(depth[0], Math.round(d * 0.9));
        if (w < size[0] * 0.6) break;
        r -= 6;
        continue;
      }
      if ([...placed, ...out].every((o) => footprintGap(f, footprint(o)) >= MIN_CORRIDOR)) {
        out.push(m);
        break;
      }
    }
  }
  return out;
}

/** Every destructible monolith, inner ring first (the label building is `slab`). */
const middle = ring(INNER, 8, 108, 0.35, 714, [44, 58], [24, 38]);
const outer = ring([...INNER, ...middle], 10, 152, 0.1, 9152, [42, 60], [21, 34]);
export const MONOLITHS: readonly Monolith[] = [...INNER, ...middle, ...outer];

export const monolith = (name: string): Monolith => {
  const found = MONOLITHS.find((m) => m.name === name);
  if (!found) throw new Error(`no monolith named ${name}`);
  return found;
};

export type Side = 'east' | 'west' | 'north' | 'south';
/**
 * A world position `gap` metres outside one face of a named monolith, `along` metres from the
 * centre of that face (east = +x, south = +z). Fixtures use this instead of raw coordinates
 * so they follow the layout.
 */
export function beside(
  name: string,
  side: Side,
  gap: number,
  y: number,
  along = 0,
): [number, number, number] {
  const m = monolith(name),
    f = footprint(m);
  switch (side) {
    case 'east':
      return [f.maxX + gap, y, m.z + along];
    case 'west':
      return [f.minX - gap, y, m.z + along];
    case 'south':
      return [m.x + along, y, f.maxZ + gap];
    default:
      return [m.x + along, y, f.minZ - gap];
  }
}

/** The tilted prism near the plaza rim (a fixed, indestructible obstacle). */
export const WEDGE = { x: -24, z: -40, radius: 7.8, height: 7.4 } as const;

/**
 * Low cover bands: ring radius and count. Each wall is nudged outwards until it sits well
 * clear of the monoliths (so it never narrows a corridor below what the boss can walk), and
 * bands never reach into the plaza.
 */
export const LOW_COVER_BANDS: readonly { radius: number; count: number; phase: number }[] = [
  { radius: PLAZA_RADIUS + 12, count: 8, phase: 0.21 },
  { radius: 104, count: 10, phase: 0.7 },
  { radius: 146, count: 8, phase: 0.33 },
];
/** Ground clearance a low cover keeps from every other obstacle. */
export const LOW_COVER_CLEARANCE = 7;

/** Sanity: the arena must hold the outer ring with margin for the boundary line. */
export const LAYOUT_EXTENT = Math.max(
  ...MONOLITHS.map((m) => {
    const f = footprint(m);
    return Math.max(Math.abs(f.minX), f.maxX, Math.abs(f.minZ), f.maxZ);
  }),
);
if (LAYOUT_EXTENT > ARENA.halfSize - 6)
  throw new Error(`layout extent ${LAYOUT_EXTENT} exceeds the arena`);
