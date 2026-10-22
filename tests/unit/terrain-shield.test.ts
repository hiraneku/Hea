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
import { Quaternion } from 'three';
import { ShieldPatchRegistry, frameFor } from '../../src/game/ShieldPatches';
import {
  DUEL,
  PROJECTILES,
  patchBlocks,
  patchRadius,
  projectileNose,
  shieldScale,
  type ShieldPatch,
} from '../../src/game/combat';
import { HEX_RADIUS, shieldLayout } from '../../src/game/ShieldVisual';

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
    expect(centre).toBeLessThan(1.15);
    expect(rim).toBeGreaterThan(3.5);
    expect(mid).toBeGreaterThan(centre);
    expect(mid).toBeLessThan(rim);
  });
  it('costs far fewer triangles than a regular grid with the same centre resolution', () => {
    const triangles = 2 * segments * segments,
      regular = Math.ceil((half * 2) / cellWidth(0, half, segments)),
      before = 2 * regular * regular;
    expect(triangles).toBeLessThan(before * 0.25);
    // The grid grew with the arena in v0.19 (600 m instead of 400), keeping the same ~1.1 m
    // cells where the fight happens.
    expect(triangles).toBe(2 * 256 * 256);
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
    hits: 0,
    scale: 1,
    cluster: 0,
    anchor: { q: 0, r: 0 },
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
    // Hits are counted when a shot actually connects; the first contact is not a "reuse".
    expect(registry.absorb(patch, 1)).toBe('held');
    expect(patch.hits).toBe(1);
    expect(registry.reuses).toBe(0);
    expect(patch.life).toBeCloseTo(DUEL.shieldPatchLife);
    for (let n = 2; n < DUEL.shieldPatchHits; n++) {
      expect(registry.absorb(patch, 1)).toBe('held');
      expect(patch.hits).toBe(n);
    }
    expect(DUEL.shieldPatchHits).toBe(10);
    expect(registry.absorb(patch, 1)).toBe('shattered');
    expect(patch.hits).toBe(DUEL.shieldPatchHits);
    expect(registry.patches).toHaveLength(0);
    expect(registry.shatters).toBe(1);
    expect(registry.reuses).toBe(DUEL.shieldPatchHits - 1);
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
    // The hole test itself is pure; the game counts a leak once per shot that flies through.
    expect(registry.leaks).toBe(0);
    registry.noteLeak();
    expect(registry.leaks).toBe(1);
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
  it('fits neighbouring patches onto one hex lattice, edge to edge, never overlapping', () => {
    const registry = new ShieldPatchRegistry(),
      normal = new Vector3(0, 0, -1),
      scale = 1;
    const first = registry.place(new Vector3(0, 1, -3), normal, scale, 1);
    expect(first.position.distanceTo(new Vector3(0, 1, -3))).toBeLessThan(1e-6);
    expect(first.joined).toBe(false);
    registry.add({
      position: first.position.toArray(),
      offset: first.position.toArray(),
      normal: normal.toArray(),
      radius: patchRadius(scale),
      life: 1,
      serial: 1,
      hits: 0,
      scale,
      cluster: first.cluster,
      anchor: first.anchor,
    });
    // A second shot a little to the side would have piled onto the first piece before; now it
    // snaps onto the same lattice at a free anchor touching the first one.
    const desired = new Vector3(0.9, 1.1, -3);
    const second = registry.place(desired, normal, scale, 2);
    expect(second.cluster).toBe(first.cluster);
    expect(second.joined).toBe(true);
    expect(second.anchor).not.toEqual(first.anchor);
    expect(second.position.distanceTo(desired)).toBeLessThanOrEqual(
      0.7 * patchRadius(scale) + 1e-6,
    );
    expect(second.quaternion.angleTo(first.quaternion)).toBeLessThan(1e-6);
    registry.add({
      position: second.position.toArray(),
      offset: second.position.toArray(),
      normal: normal.toArray(),
      radius: patchRadius(scale),
      life: 1,
      serial: 2,
      hits: 0,
      scale,
      cluster: second.cluster,
      anchor: second.anchor,
    });
    expect(registry.overlaps).toBe(0);
    expect(registry.joined).toBe(1);
    expect(registry.clusterCount).toBe(1);
    // No cell of the second piece coincides with a cell of the first: puzzle pieces, not a heap.
    const cellsOf = (serial: number, anchor: { q: number; r: number }) =>
      shieldLayout(serial, scale).map((c) => `${c.q + anchor.q},${c.r + anchor.r}`);
    const a = new Set(cellsOf(1, first.anchor));
    for (const key of cellsOf(2, second.anchor)) expect(a.has(key)).toBe(false);
    // A shot on a different lane founds its own lattice instead of warping onto this one.
    const other = registry.place(new Vector3(3, 1, 0), new Vector3(-1, 0, 0), scale, 3);
    expect(other.cluster).not.toBe(first.cluster);
    expect(other.position.distanceTo(new Vector3(3, 1, 0))).toBeLessThan(1e-6);
    expect(other.quaternion.angleTo(frameFor(new Vector3(-1, 0, 0)))).toBeLessThan(1e-6);
    expect(HEX_RADIUS).toBeGreaterThan(0);
  });
  it('stops a shot where its head meets the disc of the patch, not millimetres early', () => {
    const patch = makePatch([0, 1, -3]),
      radius = PROJECTILES.fire.radius,
      nose = projectileNose('fire'),
      velocity = new Vector3(0, 0, 30);
    const start = new Vector3(0.3, 1.1, -6),
      end = new Vector3(0.3, 1.1, -1);
    const t = patchBlocks(patch, start, end, velocity, radius, nose);
    expect(t).not.toBeNull();
    const at = start.clone().lerp(end, t!);
    // The centre of the bolt stops one nose-length in front of the plane: the tip touches it.
    expect(at.z).toBeCloseTo(-3 - nose, 5);
    // Beyond the disc's rim the same shot passes.
    const wide = patchBlocks(
      patch,
      new Vector3(patch.radius + radius + 0.05, 1, -6),
      new Vector3(patch.radius + radius + 0.05, 1, -1),
      velocity,
      radius,
      nose,
    );
    expect(wide).toBeNull();
    // Coming from behind the plane there is no contact.
    expect(patchBlocks(patch, end, start, velocity.clone().negate(), radius, nose)).toBeNull();
    expect(shieldScale(PROJECTILES.hammer.radius)).toBeGreaterThan(shieldScale(radius));
    expect(new Quaternion().angleTo(frameFor(new Vector3(0, 0, 1)))).toBeLessThan(1e-6);
  });
});
