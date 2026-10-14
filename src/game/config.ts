/** A 200 × 200 m playable square, with margin for the camera and crater geometry. */
export const ARENA = {
  halfSize: 100,
  terrainHalf: 112,
  terrainSegments: 160,
  ceiling: 42,
} as const;
export const FLIGHT = {
  speed: 12.5,
  verticalSpeed: 9,
  acceleration: 6.5,
  braking: 4.2,
  hoverHeight: 0.85,
  dashSpeed: 43,
} as const;
