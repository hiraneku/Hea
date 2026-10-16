import { describe, it, expect } from 'vitest';
import { fractalNoise, gridLines, mean, normalFromHeight, stack } from '../../src/game/pattern';

const SIZE = 64;

/** The biggest jump between neighbours, including the wrap around the tile edge. */
function worstSeam(field: Float32Array, size: number) {
  let worst = 0;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const here = field[y * size + x];
      worst = Math.max(
        worst,
        Math.abs(here - field[y * size + ((x + 1) % size)]),
        Math.abs(here - field[((y + 1) % size) * size + x]),
      );
    }
  return worst;
}

describe('procedural surfaces', () => {
  it('builds deterministic, tileable noise', () => {
    const a = fractalNoise(SIZE, { cells: 4, seed: 7, octaves: 3 }),
      b = fractalNoise(SIZE, { cells: 4, seed: 7, octaves: 3 }),
      c = fractalNoise(SIZE, { cells: 4, seed: 8, octaves: 3 });
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    expect(a.length).toBe(SIZE * SIZE);
    // Values are centred on zero and stay inside ±1, so a field reads as a height in metres
    // once it is multiplied by an amplitude.
    expect(Math.min(...a)).toBeGreaterThanOrEqual(-1);
    expect(Math.max(...a)).toBeLessThanOrEqual(1);
    expect(Math.abs(mean(a))).toBeLessThan(0.35);
  });

  it('wraps at the tile edge: the seam is no rougher than the surface itself', () => {
    const field = fractalNoise(SIZE, { cells: 4, seed: 3, octaves: 4 });
    // A seam would show up as a jump several times the ordinary neighbour difference.
    let interior = 0,
      count = 0;
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE - 1; x++) {
        interior += Math.abs(field[y * SIZE + x] - field[y * SIZE + x + 1]);
        count++;
      }
    expect(worstSeam(field, SIZE)).toBeLessThan((interior / count) * 8 + 0.05);
  });

  it('carves survey lines along the cell borders, and leaves the slabs between them flat', () => {
    const lines = gridLines(SIZE, 8, 1, 3),
      step = SIZE / 8,
      slab = (step / 2) * SIZE + step / 2,
      border = (step / 2) * SIZE + step / 2 + step / 2;
    // The middle of a slab is untouched; the border between two is at full weight.
    expect(lines[slab]).toBe(0);
    expect(lines[border]).toBeCloseTo(1, 5);
    // And the line has a slope rather than a cliff, so a normal map can carry it.
    expect(lines[slab + step / 2 - 1]).toBeGreaterThan(0);
    expect(lines[slab + step / 2 - 1]).toBeLessThan(1);
    expect(mean(lines)).toBeGreaterThan(0);
    expect(mean(lines)).toBeLessThan(0.5);
  });

  it('stacks layers at their own amplitudes', () => {
    const a = fractalNoise(SIZE, { cells: 3, seed: 11 }),
      b = fractalNoise(SIZE, { cells: 6, seed: 12 }),
      stacked = stack(SIZE, [
        { field: a, amplitude: 1 },
        { field: b, amplitude: 0.5 },
      ]);
    for (let i = 0; i < 40; i++) expect(stacked[i]).toBeCloseTo(a[i] + b[i] * 0.5, 6);
  });

  it('turns a height field into unit normals that face out of the surface', () => {
    const height = stack(SIZE, [
      { field: gridLines(SIZE, 4, 1, 3), amplitude: -0.01 },
      { field: fractalNoise(SIZE, { cells: 8, seed: 21 }), amplitude: 0.004 },
    ]);
    const normals = normalFromHeight(height, SIZE, 0.01);
    expect(normals.length).toBe(SIZE * SIZE * 3);
    let tilted = 0;
    for (let i = 0; i < normals.length; i += 3) {
      const length = Math.hypot(normals[i], normals[i + 1], normals[i + 2]);
      expect(length).toBeCloseTo(1, 5);
      expect(normals[i + 2]).toBeGreaterThan(0);
      if (Math.abs(normals[i]) + Math.abs(normals[i + 1]) > 0.2) tilted++;
    }
    // The groove walls really are tilted, otherwise the map is decoration with no relief.
    expect(tilted).toBeGreaterThan(SIZE);
  });

  it('reports the mean of a field, and survives an empty one', () => {
    expect(mean(new Float32Array([0, 1, 0.5, 0.5]))).toBeCloseTo(0.5, 6);
    expect(mean(new Float32Array(0))).toBe(0);
  });
});
