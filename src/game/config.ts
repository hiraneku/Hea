/**
 * A 380 × 380 m playable square, with margin for the camera and crater geometry. The terrain
 * grid is warped (see terrainGrid.ts): 168 segments give ~1.2 m cells at the centre and ~4 m
 * at the rim.
 */
export const ARENA = {
  halfSize: 190,
  terrainHalf: 204,
  terrainSegments: 168,
  ceiling: 70,
  /** The sun's shadow map follows the player and covers this half-span around them. */
  shadowSpan: 80,
} as const;
/**
 * The greybox plan is drawn from the v0.8 drawing at three scales: block positions (and the
 * test fixtures that lean on particular walls) spread by `WORLD_SCALE`, block footprints
 * (width and depth) grow by `FOOTPRINT_SCALE`, heights by `HEIGHT_SCALE`. Footprints grow
 * faster than positions, so the monoliths read as broad masses while the corridors between
 * them keep roughly their v0.10 width.
 */
export const WORLD_SCALE = 1.5;
export const FOOTPRINT_SCALE = 1.69;
export const HEIGHT_SCALE = 1.3;
/**
 * The boss construct, relative to its v0.10 model: visual scale, swept-collision radius, the
 * drop from its centre to the lowest point when upright, and the lowest hover altitude.
 */
export const BOSS = {
  scale: 1.45,
  radius: 1.48 * 1.45,
  extent: 2.05 * 1.45,
  hover: 2.05 * 1.45 + 0.7,
} as const;
export const FLIGHT = {
  speed: 14.5,
  verticalSpeed: 10,
  acceleration: 10.5,
  braking: 7,
  hoverHeight: 0.85,
  dashSpeed: 48.5,
} as const;

export const GROUND = { speed: 8.5, gravity: 25, jump: 9.6, airJump: 8.6 } as const;
export const HEAVY = {
  thinDepth: 3.2,
  tunnelRadius: 1.8,
  gravity: 27,
  impactSpeed: 12,
} as const;
