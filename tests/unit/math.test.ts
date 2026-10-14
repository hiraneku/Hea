import { describe, expect, it } from 'vitest';
import {
  clamp,
  damp,
  groundHeight,
  resolveCircle,
  seededRandom,
  segmentBox,
  segmentSphere,
  waveConfig,
  type Obstacle,
} from '../../src/game/math';

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
    expect(resolveCircle(80, -90, 0, 0.4, [])).toEqual({ x: 47, z: -47 });
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

describe('simulation utilities', () => {
  it('keeps difficulty and enemy counts bounded', () => {
    expect(waveConfig(1).count).toBe(3);
    expect(waveConfig(0)).toEqual(waveConfig(1));
    expect(waveConfig(1000).count).toBe(7);
    expect(waveConfig(1000).attackInterval).toBeGreaterThanOrEqual(1.6);
    expect(waveConfig(1000).health).toBeLessThan(250);
  });
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
