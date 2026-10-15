/**
 * A 340 × 340 m playable square, with margin for the camera and crater geometry. The terrain
 * grid is warped (see terrainGrid.ts): 152 segments give ~1.1 m cells at the centre and ~3.8 m
 * at the rim.
 */
export const ARENA = {
  halfSize: 170,
  terrainHalf: 184,
  terrainSegments: 152,
  ceiling: 70,
  /** The sun's shadow map follows the player and covers this half-span around them. */
  shadowSpan: 80,
} as const;
/**
 * The greybox plan (block positions and sizes, the low-cover bands, the wedge, the test
 * fixtures that lean on particular walls) is drawn at this scale.
 */
export const WORLD_SCALE = 1.3;
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
