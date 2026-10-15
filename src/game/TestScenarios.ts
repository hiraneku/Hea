import type { ProjectileKind } from './combat';
import { WORLD_SCALE } from './config';

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
/** Ground-plan coordinates of the v0.8 greybox, scaled with the world (heights untouched). */
const at = (x: number, y: number, z: number): [number, number, number] => [
  x * WORLD_SCALE,
  y,
  z * WORLD_SCALE,
];
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
    note: 'A sustained burst on one lane: the patch shatters after its hit budget, then leaks.',
    orient: [0, 0],
    shots: [-3, -5.6, -8.2, -10.8, -13.4, -16].map((z) => fire([0.4, 0.2, z], [0, 0, 30], true)),
  },
  wall: {
    player: at(-7, 1.5, 12),
    aegis: false,
    shots: [hammer(at(-3, 2.4, 12), [-38, 0, 0])],
  },
  ground: { player: [0, 8, 24], aegis: false, shots: [hammer([0, 13, 24], [0, -34, 0])] },
  'ground-skid': {
    player: [0, 5, 65],
    aegis: false,
    shots: [hammer([0, 12, 70], [0, -28, -20])],
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
    player: [0, 30, 60],
    aegis: false,
    shots: [hammer([0, 21, 60], [0, 31, 0])],
  },
  'pierce-player': {
    player: at(-2, 6, -15),
    aegis: false,
    shots: [hammer(at(-2, 6.9, -5), [0, 0, -31])],
  },
  'pierce-ground': {
    player: at(60, 8, 60),
    aegis: false,
    shots: [hammer(at(-2, 3, -5), [0, -8, -31])],
  },
  'thick-cover': {
    player: at(-24, 2.1, 12),
    aegis: false,
    shots: [hammer(at(-3, 3, 12), [-31, 0, 0])],
  },
  cover: { player: at(-6.5, 0, 12), shots: [fire(at(-25, 0.95, 12), [30, 0, 0])] },
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
  nova: { player: [0, 2, 10], boss: [0, 5, 0], spell: 2, lockOn: true },
  'nova-finish': { player: [0, 2, 10], boss: [0, 5, 0], spell: 2, lockOn: true, bossHealth: 1 },
  'nova-air': { player: [0, 34, 15], boss: [0, 37, 4], spell: 2, lockOn: true },
  victory: { bossHealth: 1, lockOn: true, spell: 1 },
  defeat: { aegis: false, health: 1, shots: [fire([0, 0.05, -3], [0, 0, 28], true)] },
  'sight-thick': { player: at(-4, 6, 12), boss: at(-27, 6, 12) },
  'sight-thin': { player: at(-2, 7, -18), boss: at(-2, 7, -3) },
  'sight-live': {
    player: at(-4, 6, 12),
    boss: at(-27, 6, 12),
    idleBoss: false,
    invulnerable: true,
  },
  patterns: { player: [0, 35, 24], boss: [0, 39, 1.5], idleBoss: false, invulnerable: true },
  'far-cover': {
    note: 'Boss far away behind the thick south-west monoliths; it must work its way back.',
    player: at(-6.5, 1.8, 12),
    boss: at(-96, 5, -96),
    idleBoss: false,
    invulnerable: true,
  },
  'far-north': {
    note: 'Same chase from the opposite diagonal, through the low-cover band.',
    player: at(8, 1.8, -7),
    boss: at(92, 4, 98),
    idleBoss: false,
    invulnerable: true,
  },
  live: {
    note: 'A real duel from the start positions with a vulnerable, idle player (balance checks).',
    idleBoss: false,
  },
};
