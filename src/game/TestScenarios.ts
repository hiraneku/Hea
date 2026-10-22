import type { ProjectileKind } from './combat';
import { beside } from './layout';

export interface ScenarioShot {
  /** World position, or chest-relative (player + 0.9 m up) when `relative` is set. */
  at: [number, number, number];
  velocity: [number, number, number];
  kind: ProjectileKind;
  damage: number;
  relative?: boolean;
}
export type IncomingSide = 'front' | 'back' | 'left' | 'right';
/** A deterministic starting state for the `?test` harness and the end-to-end suite. */
export interface Scenario {
  note?: string;
  player?: [number, number, number];
  boss?: [number, number, number];
  /** Aegis auto-shield on (default) or off, so hits land on the body. */
  aegis?: boolean;
  /** Walk mode instead of flight. */
  flight?: boolean;
  spell?: 0 | 1 | 2;
  lockOn?: boolean;
  /** The boss holds still unless told to act (default true); live boss otherwise. */
  idleBoss?: boolean;
  invulnerable?: boolean;
  bossHealth?: number;
  health?: number;
  /** Explicit yaw/pitch after the automatic aim at the boss. */
  orient?: [number, number];
  shots?: ScenarioShot[];
  /** Bolts spawned a few metres out on the given sides, flying at the chest. */
  incoming?: [IncomingSide, ProjectileKind][];
}
// Fixtures that lean on scenery are placed relative to named monoliths (see layout.ts), so
// they follow the city when it is re-laid.
const hammer = (
  at: [number, number, number],
  velocity: [number, number, number],
  relative = false,
): ScenarioShot => ({ at, velocity, kind: 'hammer', damage: 29, relative });
const fire = (
  at: [number, number, number],
  velocity: [number, number, number],
  relative = false,
): ScenarioShot => ({ at, velocity, kind: 'fire', damage: 9, relative });

export const SCENARIOS: Record<string, Scenario> = {
  flight: { orient: [0, 0] },
  walk: { player: [0, 0, 24], flight: false, orient: [0, 0] },
  shield: {
    incoming: [
      ['front', 'fire'],
      ['left', 'fire'],
      ['right', 'fire'],
    ],
  },
  'shield-large': { incoming: [['front', 'hammer']] },
  'shield-line': {
    note: 'Three bolts on one lane, 2.6 m apart: the first patch must stop all of them.',
    orient: [0, 0],
    shots: [-3, -5.6, -8.2].map((z) => fire([0.4, 0.2, z], [0, 0, 30], true)),
  },
  'shield-scatter': {
    orient: [0, 0],
    shots: (
      [
        [-1.1, 0],
        [1.1, 0.5],
        [0, 1.25],
        [3.6, 0],
      ] as const
    ).map(([x, y]) => fire([x, y, -3], [0, 0, 30], true)),
  },
  'shield-volley': {
    note: 'Eleven bolts on one lane: ten hits shatter the patch and the eleventh leaks through.',
    orient: [0, 0],
    shots: Array.from({ length: 11 }, (_, i) => fire([0.4, 0.2, -3 - i * 2.6], [0, 0, 30], true)),
  },
  wall: {
    note: 'Thrown west into the low, thick "cover" block from 1.3 m off its east face.',
    player: beside('cover', 'east', 1.3, 1.5),
    aegis: false,
    shots: [hammer(beside('cover', 'east', 6.4, 2.4), [-38, 0, 0])],
  },
  ground: { player: [0, 8, 24], aegis: false, shots: [hammer([0, 13, 24], [0, -34, 0])] },
  'ground-skid': {
    player: [10, 5, -30],
    aegis: false,
    shots: [hammer([10, 12, -35], [0, -28, 20])],
  },
  contact: { player: [0, 4, 24], aegis: false, shots: [fire([0, 0, 1.7], [0, 0, -30], true)] },
  ragdoll: { player: [0, 12, 24], aegis: false, shots: [hammer([0, 12.9, 30], [0, 0, -34])] },
  'missile-near': {
    player: [0, 5, 24],
    aegis: false,
    shots: [
      { at: [2.4, 0, 0], velocity: [-15, 0, 0], kind: 'missile', damage: 16, relative: true },
    ],
  },
  'player-air': {
    player: [0, 32, 24],
    aegis: false,
    shots: [hammer([0, 0, 2.1], [0, 0, -31], true)],
  },
  'air-recover': {
    note: 'Struck from below in open sky: the body must right itself before it ever lands.',
    player: [0, 30, -12],
    aegis: false,
    shots: [hammer([0, 21, -12], [0, 31, 0])],
  },
  'pierce-player': {
    note: 'The sphere bores through the thin slab and reaches the player behind it.',
    player: beside('slab', 'north', 6.3, 6),
    aegis: false,
    shots: [hammer(beside('slab', 'south', 6.3, 6.9), [0, 0, -31])],
  },
  'pierce-ground': {
    player: [0, 8, 24],
    aegis: false,
    shots: [hammer(beside('slab', 'south', 6.3, 3), [0, -8, -31])],
  },
  'thick-cover': {
    note: 'The same sphere against the 36 m "cover" block: it must stop inside it.',
    player: beside('cover', 'west', 5, 2.1),
    aegis: false,
    shots: [hammer(beside('cover', 'east', 16, 3), [-31, 0, 0])],
  },
  cover: {
    player: beside('cover', 'east', 2, 0),
    shots: [fire(beside('cover', 'west', 2, 0.95), [30, 0, 0])],
  },
  scorch: {
    note: 'A spread of bolts and one orb slam into the open ground ahead: soot marks must remain.',
    player: [0, 1.8, 30],
    boss: [0, 5, 0],
    aegis: false,
    shots: [
      fire([-3.5, 7, 20], [1, -24, -4]),
      fire([-1, 7, 17], [-2, -24, 2]),
      fire([2, 7, 21], [0, -24, -3]),
      fire([4, 7, 16], [-1, -24, 1]),
      fire([0.5, 7, 23], [2, -24, -2]),
      { at: [-2, 8, 13], velocity: [0, -16, -4], kind: 'missile', damage: 16, relative: false },
    ],
  },
  // Nova throws the boss north: 13 m behind it stands the thin slab for it to crash through.
  nova: {
    player: beside('slab', 'south', 23, 2, 6),
    boss: beside('slab', 'south', 13, 5, 6),
    spell: 2,
    lockOn: true,
  },
  'nova-finish': {
    player: beside('slab', 'south', 23, 2, 6),
    boss: beside('slab', 'south', 13, 5, 6),
    spell: 2,
    lockOn: true,
    bossHealth: 1,
  },
  'nova-air': { player: [0, 34, 15], boss: [0, 37, 4], spell: 2, lockOn: true },
  victory: { bossHealth: 1, lockOn: true, spell: 1 },
  defeat: { aegis: false, health: 1, shots: [fire([0, 0.05, -3], [0, 0, 28], true)] },
  'sight-thick': { player: beside('cover', 'east', 6, 6), boss: beside('cover', 'west', 6, 6) },
  'sight-thin': {
    player: beside('slab', 'north', 9, 7, 6),
    boss: beside('slab', 'south', 11, 7, 6),
  },
  'sight-live': {
    player: beside('cover', 'east', 6, 6),
    boss: beside('cover', 'west', 6, 6),
    idleBoss: false,
    invulnerable: true,
  },
  patterns: { player: [0, 35, 24], boss: [0, 39, 1.5], idleBoss: false, invulnerable: true },
  'far-cover': {
    note: 'Boss far away beyond the north-west rings; it must work its way back to the plaza.',
    player: [-10, 1.8, 18],
    boss: [-140, 5, -140],
    idleBoss: false,
    invulnerable: true,
  },
  'far-north': {
    note: 'Same chase from the opposite diagonal, through the ring gaps and low cover.',
    player: [12, 1.8, -10],
    boss: [136, 4, 144],
    idleBoss: false,
    invulnerable: true,
  },
  live: {
    note: 'A real duel from the start positions with a vulnerable, idle player (balance checks).',
    idleBoss: false,
  },
  'ragdoll-ground': {
    note: 'A grounded player thrown along the open lane west of the start: the jointed body.',
    player: [-14, 0, 30],
    flight: false,
    aegis: false,
    orient: [-Math.PI / 2, 0],
    shots: [hammer([-21, 2.2, 30], [34, -1, 0])],
  },
  splash: {
    note: "A grounded player beside the solar sphere's point of impact: the blast must reach them.",
    player: [0, 0, 24],
    flight: false,
    aegis: false,
    orient: [0, 0],
    shots: [hammer([2.3, 6, 24], [0, -30, 0])],
  },
  'walk-live': {
    note: 'The same duel on foot: the boss must keep attacking a grounded player.',
    player: [0, 0, 24],
    flight: false,
    idleBoss: false,
    invulnerable: true,
  },
};
