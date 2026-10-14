/**
 * Adaptive terrain grid: one PlaneGeometry whose vertices are pushed outwards by an odd,
 * monotone warp so cells are ~1 m wide where the duel happens (craters, skids, feet) and
 * ~3.7 m at the rim where nothing ever lands. 120 segments warped this way cost 60 % fewer
 * triangles than the 190-segment regular grid they replace.
 */
export const TERRAIN_WARP = 0.45;

/** Uniform parameter u ∈ [-1, 1] → normalised world coordinate; slope `a` at the centre. */
export function warpAxis(u: number, a = TERRAIN_WARP): number {
  const m = Math.min(1, Math.abs(u));
  return Math.sign(u) * m * (a + (1 - a) * m);
}
/** Inverse of `warpAxis`. */
export function unwarpAxis(w: number, a = TERRAIN_WARP): number {
  const m = Math.min(1, Math.abs(w));
  return (Math.sign(w) * (-a + Math.sqrt(a * a + 4 * (1 - a) * m))) / (2 * (1 - a));
}
/** World coordinate of grid line `index` (0..segments) along one axis. */
export function gridLine(index: number, half: number, segments: number): number {
  return warpAxis((index / segments) * 2 - 1) * half;
}
/** Cell index and the fraction across that cell (in world distance) for a world coordinate. */
export function gridCell(
  value: number,
  half: number,
  segments: number,
): { index: number; fraction: number } {
  const u = unwarpAxis(value / half),
    g = Math.min(segments - 1e-9, Math.max(0, ((u + 1) / 2) * segments)),
    index = Math.min(segments - 1, Math.floor(g)),
    x0 = gridLine(index, half, segments),
    x1 = gridLine(index + 1, half, segments);
  return { index, fraction: Math.min(1, Math.max(0, (value - x0) / (x1 - x0))) };
}
/** Cell width at a given world coordinate (diagnostics). */
export function cellWidth(value: number, half: number, segments: number): number {
  const { index } = gridCell(value, half, segments);
  return gridLine(index + 1, half, segments) - gridLine(index, half, segments);
}
