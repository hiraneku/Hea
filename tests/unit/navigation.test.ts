import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import {
  BossNavigator,
  NavGraph,
  pathLength,
  segmentCrossesRect,
  type NavContext,
  type NavRect,
} from '../../src/game/BossNavigation';
import { ARENA } from '../../src/game/config';
import type { Obstacle } from '../../src/game/math';

const rect = (minX: number, maxX: number, minZ: number, maxZ: number): NavRect => ({
  minX,
  maxX,
  minZ,
  maxZ,
});
const box = (minX: number, maxX: number, minZ: number, maxZ: number, top: number): Obstacle => ({
  minX,
  maxX,
  minZ,
  maxZ,
  bottom: 0,
  top,
});
/** Straight 3D segment against boxes (sampled), enough to stand in for Game.trace in tests. */
function fakeContext(boxes: Obstacle[]): NavContext {
  const hit = (start: Vector3, end: Vector3, radius = 0) => {
    const steps = Math.max(2, Math.ceil(start.distanceTo(end) / 0.5));
    for (let i = 0; i <= steps; i++) {
      const p = start.clone().lerp(end, i / steps);
      for (const b of boxes)
        if (
          p.x > b.minX - radius &&
          p.x < b.maxX + radius &&
          p.z > b.minZ - radius &&
          p.z < b.maxZ + radius &&
          p.y < b.top + radius
        )
          return { t: i / steps, obstacle: b };
    }
    return null;
  };
  return {
    trace: hit,
    lane: (from, target) => (hit(from, target, 0.3) ? 'blocked' : 'clear'),
    bounds: () => boxes,
  };
}

describe('segment / rectangle overlap', () => {
  const r = rect(-5, 5, -5, 5);
  it('detects crossings, misses, and segments that start inside', () => {
    expect(segmentCrossesRect({ x: -10, z: 0 }, { x: 10, z: 0 }, r)).toBe(true);
    expect(segmentCrossesRect({ x: -10, z: 6 }, { x: 10, z: 6 }, r)).toBe(false);
    expect(segmentCrossesRect({ x: -10, z: -10 }, { x: 10, z: 10 }, r)).toBe(true);
    expect(segmentCrossesRect({ x: -10, z: -10 }, { x: -6, z: -6 }, r)).toBe(false);
    expect(segmentCrossesRect({ x: 0, z: 0 }, { x: 20, z: 20 }, r)).toBe(true);
    expect(segmentCrossesRect({ x: 6, z: 6 }, { x: 6, z: 6 }, r)).toBe(false);
  });
});

describe('visibility graph with A*', () => {
  it('flies straight when nothing is in the way and routes around a wall otherwise', () => {
    const graph = new NavGraph([rect(-10, 10, -2, 2)]);
    expect(graph.path({ x: -30, z: 20 }, { x: 30, z: 20 })).toHaveLength(2);
    const path = graph.path({ x: 0, z: -20 }, { x: 0, z: 20 })!;
    expect(path.length).toBeGreaterThan(2);
    expect(path[0]).toEqual({ x: 0, z: -20 });
    expect(path[path.length - 1]).toEqual({ x: 0, z: 20 });
    // Every leg is clear of the wall, and the detour is close to the ideal corner route.
    for (let i = 1; i < path.length; i++) expect(graph.visible(path[i - 1], path[i])).toBe(true);
    expect(pathLength(path)).toBeLessThan(40 + 2 * 14);
  });
  it('finds the gap between two slabs and gives up on a sealed goal', () => {
    const graph = new NavGraph([rect(-40, -4, -2, 2), rect(4, 40, -2, 2)]);
    const path = graph.path({ x: 0, z: -20 }, { x: 0, z: 20 })!;
    expect(path).not.toBeNull();
    expect(pathLength(path)).toBeLessThan(42);
    const sealed = new NavGraph([
      rect(-10, 10, 8, 12),
      rect(-10, 10, -12, -8),
      rect(-12, -8, -12, 12),
      rect(8, 12, -12, 12),
    ]);
    expect(sealed.path({ x: 0, z: 0 }, { x: 30, z: 30 })).toBeNull();
  });
  it('still routes when the start sits inside the clearance band of a wall', () => {
    const graph = new NavGraph([rect(-10, 10, -2, 2)]);
    const path = graph.path({ x: 0, z: -3.2 }, { x: 0, z: 20 });
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(2);
    // Relaxing the band never means cutting through the wall itself.
    expect(graph.path({ x: 0, z: -3.2 }, { x: 0, z: 3.2 })!.length).toBeGreaterThan(2);
  });
  it('drops corner nodes that fall outside the arena', () => {
    const graph = new NavGraph([rect(ARENA.halfSize - 6, ARENA.halfSize + 10, -5, 5)]);
    expect(graph.nodes.every((n) => Math.abs(n.x) <= ARENA.halfSize - 4)).toBe(true);
  });
});

describe('boss navigator', () => {
  it('returns the goal itself when the straight flight is clear', () => {
    const nav = new BossNavigator(fakeContext([box(-10, 10, -2, 2, 20)]));
    const goal = new Vector3(30, 5, 30);
    expect(nav.routeTo(new Vector3(-30, 5, 30), goal)).toEqual(goal);
    expect(nav.route).toHaveLength(0);
  });
  it('routes around a tall wall via a waypoint that is visible from the start', () => {
    const ctx = fakeContext([box(-30, 30, -2, 2, 30)]),
      nav = new BossNavigator(ctx);
    const from = new Vector3(0, 5, -25),
      to = new Vector3(0, 5, 25);
    const waypoint = nav.routeTo(from, to);
    expect(nav.overTop).toBe(false);
    expect(waypoint.equals(to)).toBe(false);
    expect(ctx.trace(from, waypoint, 1.2)).toBeNull();
    expect(Math.abs(waypoint.x)).toBeGreaterThan(30);
  });
  it('climbs over a low slab instead of walking all the way round', () => {
    const ctx = fakeContext([box(-60, 60, -2, 2, 4)]),
      nav = new BossNavigator(ctx);
    const waypoint = nav.routeTo(new Vector3(0, 5, -25), new Vector3(0, 5, 25));
    expect(nav.overTop).toBe(true);
    expect(waypoint.y).toBeGreaterThan(7);
  });
  it('flies over buildings lower than its altitude: they leave the graph', () => {
    const nav = new BossNavigator(fakeContext([box(-30, 30, -2, 2, 3), box(50, 60, 50, 60, 40)]));
    expect(nav.graphFor(12).nodes).toHaveLength(4);
    expect(nav.graphFor(3).nodes).toHaveLength(8);
  });
  it('keeps one vantage until it is reached or stale, then picks a fresh one', () => {
    const player = new Vector3(0, 1, 0),
      target = player.clone().setY(1.9);
    const nav = new BossNavigator(fakeContext([]));
    const boss = new Vector3(40, 6, 0);
    nav.seek(boss, player, target, 0, 0);
    const first = nav.vantage!.point.clone();
    nav.seek(boss, player, target, 1, 0);
    expect(nav.vantage!.point).toEqual(first);
    const until = nav.vantage!.until;
    nav.seek(first.clone(), player, target, 2, 0);
    expect(nav.vantage!.until).toBeGreaterThan(until);
    nav.seek(boss, player, target, 100, 0);
    expect(nav.vantage!.until).toBe(104);
  });
  it('commits to a side-step for 0.8 s when the motor presses into a wall', () => {
    const ctx = fakeContext([box(-30, 30, 5, 9, 30)]),
      nav = new BossNavigator(ctx);
    const boss = new Vector3(0, 5, 0),
      motor = new Vector3(0, 0, 12);
    nav.steer(boss, motor, new Vector3(0, 5, 30), new Vector3(0, 1, 30), 1);
    expect(nav.detour).not.toBeNull();
    expect(Math.abs(motor.x) + motor.y).toBeGreaterThan(5);
    const committed = motor.clone();
    nav.steer(boss, new Vector3(0, 0, 12), new Vector3(0, 5, 30), new Vector3(0, 1, 30), 1.5);
    expect(nav.detour!.motion).toEqual(committed);
  });
});
