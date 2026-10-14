/** A 260 × 260 m playable square, with margin for the camera and crater geometry. */
export const ARENA = {
  halfSize: 130,
  terrainHalf: 142,
  terrainSegments: 190,
  ceiling: 56,
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
