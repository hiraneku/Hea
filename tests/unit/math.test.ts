import { describe, expect, it } from 'vitest';
import {
  clamp,
  damp,
  groundHeight,
  resolveCircle,
  seededRandom,
  segmentBox,
  segmentDistance,
  segmentSphere,
  type Obstacle,
} from '../../src/game/math';

import { ARENA } from '../../src/game/config';

const box: Obstacle = { minX: -1, maxX: 1, minZ: -1, maxZ: 1, top: 3 };

describe('movement and blockout collision', () => {
  it('keeps a capsule outside a wall', () => {
    const p = resolveCircle(1.1, 0, 0, 0.4, [box]);
    expect(p.x).toBeCloseTo(1.4);
    expect(p.z).toBe(0);
  });
  it('resolves a point inside a solid without NaN', () => {
    const p = resolveCircle(0, 0, 0, 0.4, [box]);
    expect(Number.isFinite(p.x) && Number.isFinite(p.z)).toBe(true);
    expect(Math.max(Math.abs(p.x), Math.abs(p.z))).toBeCloseTo(1.4);
  });
  it('handles diagonal corners', () => {
    const p = resolveCircle(1.1, 1.1, 0, 0.4, [box]);
    expect(Math.hypot(p.x - 1, p.z - 1)).toBeCloseTo(0.4);
  });
  it('allows walking over a block when above its top', () => {
    expect(resolveCircle(0, 0, 3.1, 0.4, [box])).toEqual({ x: 0, z: 0 });
    expect(groundHeight(0, 0, 3.1, [box])).toBe(3);
  });
  it('does not teleport a player below a block to its roof', () => {
    expect(groundHeight(0, 0, 0, [box])).toBe(0);
  });
  it('bounds the arena in both directions', () => {
    // Whatever the arena measures, a body past the line is put back on it.
    const outside = ARENA.halfSize + 20;
    expect(resolveCircle(outside, -outside - 10, 0, 0.4, [])).toEqual({
      x: ARENA.halfSize,
      z: -ARENA.halfSize,
    });
  });
  it('selects the highest valid landing surface', () => {
    expect(groundHeight(0, 0, 7, [box, { ...box, top: 6 }])).toBe(6);
  });
});

describe('continuous projectile collision', () => {
  it('detects targets crossed between frames', () => {
    expect(
      segmentSphere({ x: -10, y: 0, z: 0 }, { x: 10, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 1),
    ).toBeCloseTo(0.45);
  });
  it('ignores a target behind the shot', () => {
    expect(
      segmentSphere({ x: 2, y: 0, z: 0 }, { x: 10, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 1),
    ).toBeNull();
  });
  it('ignores a near miss and a stationary point outside the target', () => {
    expect(
      segmentSphere({ x: -3, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 0, y: 0, z: 0 }, 1),
    ).toBeNull();
    expect(
      segmentSphere({ x: 3, y: 0, z: 0 }, { x: 3, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 1),
    ).toBeNull();
  });
  it('handles a projectile starting within a target', () => {
    expect(segmentSphere({ x: 0, y: 0, z: 0 }, { x: 3, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, 1)).toBe(
      0,
    );
  });
  it('stops a projectile at the first face of a wall', () => {
    expect(segmentBox({ x: 0, y: 1, z: 5 }, { x: 0, y: 1, z: -5 }, box)).toBeCloseTo(0.4);
  });
  it('supports rays above and parallel to walls', () => {
    expect(segmentBox({ x: 0, y: 4, z: 5 }, { x: 0, y: 4, z: -5 }, box)).toBeNull();
    expect(segmentBox({ x: 4, y: 1, z: 5 }, { x: 4, y: 1, z: -5 }, box)).toBeNull();
  });
  it('hits the expanded box for a projectile with radius', () => {
    expect(segmentBox({ x: 1.1, y: 1, z: 5 }, { x: 1.1, y: 1, z: -5 }, box, 0.2)).toBeCloseTo(0.38);
  });
});

describe('the gap between two segments', () => {
  const v = (x: number, y: number, z: number) => ({ x, y, z });
  it('measures a straight miss, and a clean intersection as nothing', () => {
    // Two parallel rails a metre apart.
    expect(segmentDistance(v(-5, 0, 0), v(5, 0, 0), v(-5, 1, 0), v(5, 1, 0))).toBeCloseTo(1, 6);
    // Crossing in plan but at different heights: the gap is the height.
    expect(segmentDistance(v(-5, 0, 0), v(5, 0, 0), v(0, 2, -5), v(0, 2, 5))).toBeCloseTo(2, 6);
    // And a clean crossing is zero however far along each segment it falls.
    expect(segmentDistance(v(-5, 0, 0), v(5, 0, 0), v(2, -3, 0), v(2, 3, 0))).toBeCloseTo(0, 6);
  });
  it('clamps to the ends: a short segment measures to the nearest point of the other', () => {
    // A point segment beside the middle of a rail.
    expect(segmentDistance(v(0, 3, 0), v(0, 3, 0), v(-4, 0, 0), v(4, 0, 0))).toBeCloseTo(3, 6);
    // A rail that stops short of the crossing still measures to its own end.
    expect(segmentDistance(v(-5, 0, 0), v(5, 0, 0), v(9, -2, 0), v(9, 2, 0))).toBeCloseTo(4, 6);
  });
  it('is symmetric, and finds a bolt that crossed the beam inside one frame', () => {
    const beamA = v(0, 0, 0),
      beamB = v(0, 0, 30),
      boltA = v(6, 0, 20),
      boltB = v(-6, 0, 12);
    expect(segmentDistance(beamA, beamB, boltA, boltB)).toBeCloseTo(
      segmentDistance(boltA, boltB, beamA, beamB),
      9,
    );
    // The bolt's path passes within a metre of the beam: a corridor of that width catches it.
    expect(segmentDistance(beamA, beamB, boltA, boltB)).toBeLessThan(1);
  });
});

describe('simulation utilities', () => {
  it('uses deterministic scenery without modifying global randomness', () => {
    const a = seededRandom(71),
      b = seededRandom(71);
    for (let i = 0; i < 30; i++) {
      const value = a();
      expect(value).toBe(b());
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
  it('damping is independent of frame segmentation', () => {
    const single = damp(0, 10, 9, 1 / 30);
    const split = damp(damp(0, 10, 9, 1 / 60), 10, 9, 1 / 60);
    expect(single).toBeCloseTo(split);
    expect(clamp(105, 0, 100)).toBe(100);
    expect(clamp(-8, 0, 100)).toBe(0);
  });
});
