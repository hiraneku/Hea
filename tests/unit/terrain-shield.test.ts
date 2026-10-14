import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { ARENA } from '../../src/game/config';
import {
  TERRAIN_WARP,
  cellWidth,
  gridCell,
  gridLine,
  unwarpAxis,
  warpAxis,
} from '../../src/game/terrainGrid';
import { ShieldPatchRegistry } from '../../src/game/ShieldPatches';
import { DUEL, patchRadius, type ShieldPatch } from '../../src/game/combat';

describe('adaptive terrain grid', () => {
  const half = ARENA.terrainHalf,
    segments = ARENA.terrainSegments;
  it('warp and unwarp are exact inverses and monotone', () => {
    for (let u = -1; u <= 1.0001; u += 0.05) {
      expect(unwarpAxis(warpAxis(u))).toBeCloseTo(u, 9);
      if (u > -1) expect(warpAxis(u)).toBeGreaterThan(warpAxis(u - 0.05));
    }
    expect(warpAxis(1)).toBe(1);
    expect(warpAxis(-1)).toBe(-1);
    expect(warpAxis(0)).toBe(0);
    expect(TERRAIN_WARP).toBeCloseTo(0.45);
  });
  it('spans the terrain exactly, dense at the centre and coarse at the rim', () => {
    expect(gridLine(0, half, segments)).toBeCloseTo(-half);
    expect(gridLine(segments, half, segments)).toBeCloseTo(half);
    const centre = cellWidth(0, half, segments),
      rim = cellWidth(half - 0.1, half, segments),
      mid = cellWidth(60, half, segments);
    expect(centre).toBeLessThan(1.1);
    expect(rim).toBeGreaterThan(3.5);
    expect(mid).toBeGreaterThan(centre);
    expect(mid).toBeLessThan(rim);
  });
  it('costs about 60 % fewer triangles than the old regular 190-segment grid', () => {
    const triangles = 2 * segments * segments,
      before = 2 * 190 * 190;
    expect(triangles).toBeLessThan(before * 0.41);
    expect(triangles).toBe(28800);
  });
  it('maps world coordinates to a cell and a continuous fraction across it', () => {
    for (const x of [-120, -33.3, -1, 0, 0.4, 17.25, 99, 141.9]) {
      const cell = gridCell(x, half, segments),
        x0 = gridLine(cell.index, half, segments),
        x1 = gridLine(cell.index + 1, half, segments);
      expect(x).toBeGreaterThanOrEqual(x0 - 1e-9);
      expect(x).toBeLessThanOrEqual(x1 + 1e-9);
      expect(x0 + cell.fraction * (x1 - x0)).toBeCloseTo(x, 9);
    }
    const line = gridLine(70, half, segments);
    expect(gridCell(line - 1e-6, half, segments).fraction).toBeGreaterThan(0.999);
    expect(gridCell(line + 1e-6, half, segments).fraction).toBeLessThan(0.001);
  });
});

describe('shield patch registry', () => {
  const makePatch = (offset: [number, number, number], serial = 1): ShieldPatch => ({
    position: offset,
    offset,
    normal: [0, 0, -1],
    radius: patchRadius(1),
    life: DUEL.shieldPatchLife,
    serial,
    hits: 1,
  });
  it('sweeps standing patches on the front face only and re-uses same-lane footprints', () => {
    const registry = new ShieldPatchRegistry(),
      patch = makePatch([0, 0, -3]);
    registry.add(patch);
    const hit = registry.sweep(
      new Vector3(0.2, 0.1, -6),
      new Vector3(0.2, 0.1, -1),
      new Vector3(0, 0, 30),
      0.3,
    );
    expect(hit?.patch).toBe(patch);
    expect(hit!.at.z).toBeLessThan(-3);
    expect(hit!.at.z).toBeGreaterThan(-5);
    expect(
      registry.sweep(
        new Vector3(0.2, 0.1, -1),
        new Vector3(0.2, 0.1, -6),
        new Vector3(0, 0, -30),
        0.3,
      ),
    ).toBeNull();
    expect(registry.overlapping(new Vector3(0.3, 0, -3), new Vector3(0, 0, -1), 0.8)).toBe(patch);
    expect(registry.overlapping(new Vector3(3, 0, -3), new Vector3(0, 0, -1), 0.8)).toBeUndefined();
    expect(
      registry.overlapping(new Vector3(0.3, 0, -3), new Vector3(0, 0, 1), 0.8),
    ).toBeUndefined();
  });
  it('holds a limited number of hits, then shatters and leaves a hole in that direction', () => {
    const registry = new ShieldPatchRegistry(),
      patch = makePatch([0, 0, -3]);
    registry.add(patch);
    patch.life = 0.2;
    expect(registry.absorb(patch, 1)).toBe('held');
    expect(patch.hits).toBe(2);
    expect(patch.life).toBeCloseTo(DUEL.shieldPatchLife);
    expect(registry.absorb(patch, 1)).toBe('shattered');
    expect(patch.hits).toBe(DUEL.shieldPatchHits);
    expect(registry.patches).toHaveLength(0);
    expect(registry.shatters).toBe(1);
    expect(registry.reuses).toBe(2);
    expect(registry.openGaps).toBe(1);
    expect(registry.gapAt(new Vector3(0.4, 0.2, -3))).toBe(true);
    expect(registry.gapAt(new Vector3(0, 0, 3))).toBe(false);
    const edge = (DUEL.shieldGapDegrees * Math.PI) / 180;
    expect(
      registry.gapAt(new Vector3(Math.sin(edge - 0.05) * 3, 0, -Math.cos(edge - 0.05) * 3)),
    ).toBe(true);
    expect(
      registry.gapAt(new Vector3(Math.sin(edge + 0.05) * 3, 0, -Math.cos(edge + 0.05) * 3)),
    ).toBe(false);
    expect(registry.leaks).toBe(2);
    registry.age(DUEL.shieldGap + 0.01);
    expect(registry.openGaps).toBe(0);
    expect(registry.gapAt(new Vector3(0, 0, -3))).toBe(false);
  });
  it('ages patches away and never keeps more than 24', () => {
    const registry = new ShieldPatchRegistry();
    for (let i = 0; i < 30; i++) registry.add(makePatch([i, 0, -3], i));
    expect(registry.patches).toHaveLength(24);
    registry.age(DUEL.shieldPatchLife + 0.01);
    expect(registry.patches).toHaveLength(0);
    registry.reset();
    expect(registry.reuses + registry.shatters + registry.leaks).toBe(0);
  });
  it('large patches renew to their longer life', () => {
    const registry = new ShieldPatchRegistry(),
      patch = makePatch([0, 0, -3]);
    registry.add(patch);
    patch.life = 0.1;
    registry.absorb(patch, 2.6);
    expect(patch.life).toBeCloseTo(DUEL.shieldPatchLifeLarge);
    expect(patch.radius).toBeCloseTo(patchRadius(2.6));
  });
});
