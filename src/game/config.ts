/** A 200 × 200 m playable square, with margin for the camera and crater geometry. */
export const ARENA = {
  halfSize: 100,
  terrainHalf: 112,
  terrainSegments: 160,
  ceiling: 42,
} as const;
export const FLIGHT = {
  speed: 14.5,
  verticalSpeed: 10,
  acceleration: 10.5,
  braking: 7,
  hoverHeight: 0.85,
  dashSpeed: 48.5,
} as const;
