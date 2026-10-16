/**
 * The pure half of the procedural surfaces: tileable value noise, survey lines, and the
 * height-to-normal conversion. No canvas, no DOM — the arena's stone and concrete are built from
 * these, and being pure they can be measured in tests (a seam that does not wrap, or a normal that
 * is not unit length, shows up there rather than as a stripe on a wall).
 *
 * Heights are in metres and texels are in metres, so the normals these produce are the real slopes
 * of the surface rather than an arbitrary bump strength.
 */
import { seededRandom } from './math';

/** A wrapping lattice of random values: `cells` points per axis, sampled in [0, 1). */
function lattice(cells: number, random: () => number): Float32Array {
  const values = new Float32Array(cells * cells);
  for (let i = 0; i < values.length; i++) values[i] = random();
  return values;
}

/** Smooth interpolation (Perlin's quintic) so the lattice has no visible grid corners. */
function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** One octave of tileable value noise at `(x, y)` in [0, 1): the lattice wraps at the edges. */
function octave(
  values: Float32Array,
  cells: number,
  x: number,
  y: number,
  smooth: boolean,
): number {
  const px = x * cells,
    py = y * cells,
    x0 = Math.floor(px),
    y0 = Math.floor(py),
    tx = px - x0,
    ty = py - y0,
    sx = smooth ? fade(tx) : tx,
    sy = smooth ? fade(ty) : ty,
    i0 = ((x0 % cells) + cells) % cells,
    j0 = ((y0 % cells) + cells) % cells,
    i1 = (i0 + 1) % cells,
    j1 = (j0 + 1) % cells,
    a = values[j0 * cells + i0],
    b = values[j0 * cells + i1],
    c = values[j1 * cells + i0],
    d = values[j1 * cells + i1],
    top = a + (b - a) * sx,
    bottom = c + (d - c) * sx;
  return top + (bottom - top) * sy;
}

export interface NoiseOptions {
  /** Lattice points across the whole tile at the first octave. */
  cells: number;
  seed: number;
  octaves?: number;
  /** How much each octave keeps of the one before. */
  gain?: number;
  /** Whether the first octave is interpolated smoothly or linearly (chipping reads sharper). */
  smooth?: boolean;
}

/**
 * Fractal value noise, tileable in both axes: the odd octaves double the lattice, so a tile
 * repeated across a plaza never shows a seam. Values are centred on zero, so a field is easier to
 * read as a height in metres around a mean.
 */
export function fractalNoise(size: number, options: NoiseOptions): Float32Array {
  const { cells, seed, octaves = 3, gain = 0.5, smooth = true } = options;
  const random = seededRandom(seed);
  const layers: { values: Float32Array; cells: number; amplitude: number }[] = [];
  let amplitude = 1,
    total = 0;
  for (let o = 0; o < octaves; o++) {
    const c = Math.max(1, Math.round(cells * 2 ** o));
    layers.push({ values: lattice(c, random), cells: c, amplitude });
    total += amplitude;
    amplitude *= gain;
  }
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let sum = 0;
      for (const layer of layers)
        sum += layer.amplitude * octave(layer.values, layer.cells, x / size, y / size, smooth);
      out[y * size + x] = (sum / total) * 2 - 1;
    }
  return out;
}

/**
 * A height field from any number of stacked layers: each is added at its own amplitude in metres,
 * so the caller can keep the relief of a joint and the relief of weathering on their own scales.
 */
export function stack(
  size: number,
  layers: { field: Float32Array; amplitude: number }[],
): Float32Array {
  const out = new Float32Array(size * size);
  for (const { field, amplitude } of layers)
    for (let i = 0; i < out.length; i++) out[i] += field[i] * amplitude;
  return out;
}

/**
 * Tileable normals from a height field in metres, by central differences on the wrapped neighbour.
 * `texelMetres` is how much ground one texel covers, which is what turns a height difference into
 * a slope. Returns interleaved (x, y, z) in tangent space with z out of the surface.
 */
export function normalFromHeight(
  height: Float32Array,
  size: number,
  texelMetres: number,
): Float32Array {
  const out = new Float32Array(size * size * 3),
    at = (x: number, y: number) =>
      height[(((y % size) + size) % size) * size + (((x % size) + size) % size)];
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) / (2 * texelMetres),
        dy = (at(x, y + 1) - at(x, y - 1)) / (2 * texelMetres),
        n = Math.hypot(-dx, -dy, 1),
        i = (y * size + x) * 3;
      out[i] = -dx / n;
      out[i + 1] = -dy / n;
      out[i + 2] = 1 / n;
    }
  return out;
}

/** The mean of a field, for balancing a map so a texture does not shift the overall value. */
export function mean(field: Float32Array): number {
  let sum = 0;
  for (const v of field) sum += v;
  return sum / Math.max(1, field.length);
}

/**
 * A survey grid: raised lines along the *borders* of every cell, `weight` at the line and 0 away
 * from it, fading over `width` texels so the height field has a slope a normal map can carry
 * rather than a cliff. Used for plaza slabs, board joints and storey bands.
 */
export function gridLines(size: number, cells: number, weight: number, width = 3): Float32Array {
  const out = new Float32Array(size * size),
    step = size / cells,
    half = Math.max(0.5, width * 0.5);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const across = Math.abs(((((x / step) % 1) + 1) % 1) - 0.5),
        down = Math.abs(((((y / step) % 1) + 1) % 1) - 0.5),
        // Distance to the nearest cell border, in texels.
        distance = Math.min(0.5 - across, 0.5 - down) * step;
      out[y * size + x] = distance >= half ? 0 : weight * (1 - distance / half);
    }
  return out;
}
