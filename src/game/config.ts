/**
 * A 600 × 600 m playable square, with margin for the camera and crater geometry. The terrain
 * grid is warped (see terrainGrid.ts): 224 segments give ~1.4 m cells at the centre and ~3.4 m
 * at the rim. The ceiling clears the tallest monolith with room to spare, so flight can still
 * pass over the skyline.
 */
export const ARENA = {
  halfSize: 300,
  terrainHalf: 316,
  terrainSegments: 256,
  ceiling: 120,
  /** The sun's shadow map follows the player and covers this half-span around them. */
  shadowSpan: 80,
} as const;
/**
 * The city layout itself lives in layout.ts (world metres). These scales only size the
 * decorative skyline outside the arena, relative to the v0.8 drawing.
 */
export const FOOTPRINT_SCALE = 1.69;
export const HEIGHT_SCALE = 1.3;
/**
 * The boss construct, relative to its v0.10 model: visual scale, swept-collision radius, the
 * drop from its centre to the lowest point when upright, and the lowest hover altitude.
 */
export const BOSS = {
  scale: 1.75,
  radius: 1.48 * 1.75,
  extent: 2.05 * 1.75,
  hover: 2.05 * 1.75 + 0.7,
} as const;
/**
 * Flight tuned against the first reference clip: a brisk 21 m/s cruise that answers the stick
 * almost at once (the motor is a critically damped spring — `acceleration` is its frequency, so
 * thrust reaches three quarters of the target in about 0.15 s), with a short glide when the
 * stick is released rather than a dead stop.
 */
export const FLIGHT = {
  speed: 21,
  verticalSpeed: 13,
  acceleration: 19,
  braking: 10,
  hoverHeight: 0.85,
  /** After a dash the motor runs this much faster: held for `boostHold` s, then eased out. */
  boost: 0.6,
  boostHold: 0.5,
  boostDuration: 1.7,
  /** How far the body leans into lateral and forward speed, in radians. */
  bankRoll: 0.48,
  bankPitch: 0.2,
} as const;

export const GROUND = { speed: 8.5, gravity: 25, jump: 9.6, airJump: 8.6 } as const;
export const HEAVY = {
  thinDepth: 3.2,
  tunnelRadius: 1.8,
  gravity: 27,
  impactSpeed: 12,
} as const;
