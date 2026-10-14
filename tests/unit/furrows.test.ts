import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { FurrowTrail } from '../../src/game/Furrows';

const trail = () => {
  const t = new FurrowTrail(64);
  t.setGroundSampler(() => 0);
  return t;
};
const positions = (t: FurrowTrail) =>
  t.mesh.geometry.getAttribute('position').array as Float32Array;
const drawn = (t: FurrowTrail) => t.mesh.geometry.drawRange.count;

describe('drag furrows', () => {
  it('lays a straight strip along the drag with raised ridges left and right of a trough', () => {
    const t = trail();
    for (let i = 0; i <= 10; i++)
      t.extend('player', new Vector3(i * 0.4, 0, 2), new Vector3(12, 0, 0), 1, 0.8, i * 0.03);
    t.update(1 / 60);
    expect(t.furrows).toBe(1);
    expect(t.count).toBeGreaterThanOrEqual(10);
    expect(drawn(t)).toBeGreaterThan(0);
    const p = positions(t);
    // Every live section is a 7-vertex cross-section perpendicular to +X at its own x.
    const ring = 7;
    let ridges = 0;
    for (let i = 0; i < 64; i++) {
      const base = i * ring * 3;
      if (p[base + 1] < -100) continue;
      const xs = Array.from({ length: ring }, (_, j) => p[base + j * 3]),
        ys = Array.from({ length: ring }, (_, j) => p[base + j * 3 + 1]),
        zs = Array.from({ length: ring }, (_, j) => p[base + j * 3 + 2]);
      expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(1e-4);
      expect(zs[0]).toBeLessThan(zs[ring - 1]);
      // Ridge vertices (1 and 5) stand above the trough centre (3) and the outer edges (0, 6).
      if (ys[1] > ys[3] + 0.05 && ys[5] > ys[3] + 0.05 && ys[1] > ys[0] && ys[5] > ys[6]) ridges++;
      expect(Math.abs(ys[1] - ys[5])).toBeLessThan(1e-4);
    }
    expect(ridges).toBeGreaterThanOrEqual(8);
  });
  it('starts a new furrow after a pause or a jump, and settles away over its life', () => {
    const t = trail();
    t.extend('player', new Vector3(0, 0, 0), new Vector3(10, 0, 0), 1, 1, 0);
    t.extend('player', new Vector3(0.5, 0, 0), new Vector3(10, 0, 0), 1, 1, 0.05);
    t.extend('player', new Vector3(1, 0, 0), new Vector3(10, 0, 0), 1, 1, 0.1);
    // A body that flew 5 m before touching down again does not bridge the gap.
    t.extend('player', new Vector3(6, 0, 0), new Vector3(10, 0, 0), 1, 1, 0.15);
    t.extend('player', new Vector3(6.5, 0, 0), new Vector3(10, 0, 0), 1, 1, 0.2);
    // Another actor ploughs its own furrow.
    t.extend('boss', new Vector3(0, 0, 5), new Vector3(0, 0, 10), 1.8, 1, 0.2);
    t.extend('boss', new Vector3(0, 0, 5.8), new Vector3(0, 0, 10), 1.8, 1, 0.25);
    t.update(0.016);
    expect(t.furrows).toBe(3);
    const before = t.count;
    t.update(11);
    expect(t.count).toBe(0);
    expect(t.furrows).toBe(0);
    expect(before).toBeGreaterThan(0);
    expect(drawn(t)).toBe(0);
    t.extend('player', new Vector3(0, 0, 0), new Vector3(10, 0, 0), 1, 1, 12);
    t.clear();
    expect(t.count).toBe(0);
    t.dispose();
  });
  it('ignores a body that is not moving horizontally', () => {
    const t = trail();
    t.extend('player', new Vector3(0, 0, 0), new Vector3(0, -5, 0), 1, 1, 0);
    t.update(0.016);
    expect(t.count).toBe(0);
  });
});
