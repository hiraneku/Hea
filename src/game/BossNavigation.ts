import { Vector3 } from 'three';
import { ARENA, BOSS } from './config';
import { DUEL } from './combat';
import { clamp, type Obstacle } from './math';

export interface NavPoint {
  x: number;
  z: number;
}
export interface NavRect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Liang–Barsky: does the segment a→b overlap the axis-aligned rectangle (touching counts)? */
export function segmentCrossesRect(a: NavPoint, b: NavPoint, r: NavRect): boolean {
  const dx = b.x - a.x,
    dz = b.z - a.z;
  let t0 = 0,
    t1 = 1;
  const edges: [number, number][] = [
    [-dx, a.x - r.minX],
    [dx, r.maxX - a.x],
    [-dz, a.z - r.minZ],
    [dz, r.maxZ - a.z],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const t = q / p;
    if (p < 0) {
      if (t > t1) return false;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return false;
      if (t < t1) t1 = t;
    }
  }
  return t0 <= t1;
}
function inflate(r: NavRect, by: number): NavRect {
  return { minX: r.minX - by, maxX: r.maxX + by, minZ: r.minZ - by, maxZ: r.maxZ + by };
}
function contains(r: NavRect, p: NavPoint): boolean {
  return p.x > r.minX && p.x < r.maxX && p.z > r.minZ && p.z < r.maxZ;
}
const distance = (a: NavPoint, b: NavPoint) => Math.hypot(a.x - b.x, a.z - b.z);

/**
 * Visibility graph over the inflated corners of every blocking footprint, searched with A*.
 * Small enough (a few hundred nodes) to rebuild per altitude band and query every AI tick.
 */
export class NavGraph {
  readonly nodes: NavPoint[] = [];
  private readonly adjacency: { to: number; cost: number }[][] = [];
  private readonly blockers: NavRect[];
  private readonly solids: NavRect[];
  /** Corner nodes sit `margin` out from the footprints; edges keep 0.6 m less clearance. */
  constructor(
    rects: NavRect[],
    readonly margin = 2.8,
    readonly limit = ARENA.halfSize - 4,
  ) {
    this.solids = rects.map((r) => ({ ...r }));
    this.blockers = rects.map((r) => inflate(r, margin - 0.6));
    for (const r of rects) {
      const wide = inflate(r, margin);
      for (const corner of [
        { x: wide.minX, z: wide.minZ },
        { x: wide.maxX, z: wide.minZ },
        { x: wide.minX, z: wide.maxZ },
        { x: wide.maxX, z: wide.maxZ },
      ])
        if (this.free(corner)) this.nodes.push(corner);
    }
    for (let i = 0; i < this.nodes.length; i++) this.adjacency.push([]);
    for (let i = 0; i < this.nodes.length; i++)
      for (let j = i + 1; j < this.nodes.length; j++)
        if (this.visible(this.nodes[i], this.nodes[j])) {
          const cost = distance(this.nodes[i], this.nodes[j]);
          this.adjacency[i].push({ to: j, cost });
          this.adjacency[j].push({ to: i, cost });
        }
  }
  get edgeCount() {
    return this.adjacency.reduce((n, list) => n + list.length, 0) / 2;
  }
  free(p: NavPoint): boolean {
    return (
      Math.abs(p.x) <= this.limit &&
      Math.abs(p.z) <= this.limit &&
      !this.blockers.some((b) => contains(b, p))
    );
  }
  /**
   * Clear line between two points. Footprints listed in `relaxed` (those whose clearance band
   * contains an endpoint) are tested against the actual wall instead of the band.
   */
  visible(a: NavPoint, b: NavPoint, relaxed?: NavRect[]): boolean {
    return !this.blockers.some((r, i) =>
      segmentCrossesRect(a, b, relaxed && relaxed.includes(r) ? this.solids[i] : r),
    );
  }
  /** Shortest clear polyline from→to, or null when the goal is sealed off. */
  path(from: NavPoint, to: NavPoint): NavPoint[] | null {
    const leaveFrom = this.blockers.filter((r) => contains(r, from)),
      enterTo = this.blockers.filter((r) => contains(r, to));
    const ignore = [...leaveFrom, ...enterTo];
    if (this.visible(from, to, ignore)) return [from, to];
    const n = this.nodes.length,
      start = n,
      goal = n + 1,
      points = [...this.nodes, from, to];
    const links = (index: number): { to: number; cost: number }[] => {
      if (index < n) {
        const list = [...this.adjacency[index]];
        if (this.visible(this.nodes[index], to, enterTo))
          list.push({ to: goal, cost: distance(this.nodes[index], to) });
        return list;
      }
      if (index === start)
        return this.nodes
          .map((node, i) => ({ to: i, cost: distance(from, node) }))
          .filter((link) => this.visible(from, this.nodes[link.to], leaveFrom));
      return [];
    };
    const best = new Array<number>(n + 2).fill(Infinity),
      previous = new Array<number>(n + 2).fill(-1),
      closed = new Array<boolean>(n + 2).fill(false),
      open: number[] = [start];
    best[start] = 0;
    while (open.length) {
      let pick = 0;
      for (let i = 1; i < open.length; i++) {
        const a = open[i],
          b = open[pick];
        if (best[a] + distance(points[a], to) < best[b] + distance(points[b], to)) pick = i;
      }
      const current = open.splice(pick, 1)[0];
      if (current === goal) break;
      if (closed[current]) continue;
      closed[current] = true;
      for (const link of links(current)) {
        if (closed[link.to]) continue;
        const cost = best[current] + link.cost;
        if (cost < best[link.to]) {
          best[link.to] = cost;
          previous[link.to] = current;
          open.push(link.to);
        }
      }
    }
    if (best[goal] === Infinity) return null;
    const route: NavPoint[] = [];
    for (let index = goal; index !== -1; index = previous[index]) route.unshift(points[index]);
    return route;
  }
}
export function pathLength(path: NavPoint[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) total += distance(path[i - 1], path[i]);
  return total;
}

export interface NavTrace {
  t: number;
  obstacle?: Obstacle;
}
export interface NavContext {
  /** World-only sweep (obstacles and ground), never the boss itself. */
  trace(start: Vector3, end: Vector3, radius?: number): NavTrace | null;
  /** Firing-lane verdict for the fire salvo from a candidate position. */
  lane(from: Vector3, target: Vector3): 'clear' | 'breach' | 'blocked';
  /** Whole-building footprints (never the per-voxel colliders). */
  bounds(): Obstacle[];
}

/**
 * Where the boss goes when it cannot see the player: a stable vantage with a clear lane, an
 * A* route around whatever stands in between (or a climb over low cover), and short committed
 * side-steps for the last few metres. Pure navigation; Game owns the resulting motion.
 */
export class BossNavigator {
  vantage: { point: Vector3; until: number } | null = null;
  detour: { motion: Vector3; until: number } | null = null;
  route: Vector3[] = [];
  overTop = false;
  private lastDetourSide = 0;
  private graphs = new Map<string, NavGraph>();
  constructor(private readonly ctx: NavContext) {}
  reset() {
    this.vantage = null;
    this.detour = null;
    this.route = [];
    this.overTop = false;
    this.lastDetourSide = 0;
  }
  /** Buildings lower than the flight level are simply flown over, so they leave the graph. */
  graphFor(level: number): NavGraph {
    const bounds = this.ctx.bounds(),
      included = bounds.filter((b) => b.top > level - 2),
      key = included.map((b) => bounds.indexOf(b)).join(',');
    let graph = this.graphs.get(key);
    if (!graph) {
      graph = new NavGraph(included, BOSS.radius + 1.2);
      this.graphs.set(key, graph);
      if (this.graphs.size > 8) this.graphs.delete(this.graphs.keys().next().value!);
    }
    return graph;
  }
  /**
   * Keep one vantage until it is reached, stale, or no longer sees the player — a destination
   * that changes every tick dithers — then return the next waypoint of the route towards it.
   */
  seek(
    boss: Vector3,
    player: Vector3,
    target: Vector3,
    time: number,
    blockedTime: number,
  ): Vector3 {
    let vantage = this.vantage;
    if (
      !vantage ||
      time > vantage.until ||
      vantage.point.distanceTo(boss) < 3 ||
      this.ctx.lane(vantage.point, target) !== 'clear'
    )
      vantage = this.vantage = {
        point: this.findVantage(boss, player, target, blockedTime),
        until: time + 4,
      };
    return this.routeTo(boss, vantage.point);
  }
  /**
   * Searches several rings around the player, in every direction and at several heights, for a
   * spot with a clear lane; reachable spots score better. Long blockades bias towards closing
   * in. When nothing qualifies the boss climbs above the obstruction while approaching, so it
   * never hovers idle behind cover or at the far side of the arena.
   */
  findVantage(boss: Vector3, player: Vector3, target: Vector3, blockedTime: number): Vector3 {
    const delta = boss.clone().sub(player),
      angle = Math.atan2(delta.z, delta.x),
      obstruction = this.ctx.trace(boss, target)?.obstacle,
      pressing = blockedTime > 3;
    const ranges = pressing
      ? [DUEL.nearRange + 1, DUEL.preferredRange]
      : [DUEL.preferredRange, DUEL.nearRange + 2, DUEL.farRange];
    const heights = [
      boss.y,
      Math.max(BOSS.hover, player.y + 0.9),
      Math.min(ARENA.ceiling, (obstruction?.top ?? boss.y) + 4),
      Math.min(ARENA.ceiling, player.y + 14),
    ];
    const turns = [0, -0.45, 0.45, -0.9, 0.9, -1.4, 1.4, -2, 2, -2.6, 2.6, Math.PI];
    let best: Vector3 | null = null,
      cost = Infinity;
    for (const range of ranges)
      for (const height of heights)
        for (const turn of turns) {
          const candidate = new Vector3(
            player.x + Math.cos(angle + turn) * range,
            height,
            player.z + Math.sin(angle + turn) * range,
          );
          if (
            Math.abs(candidate.x) > ARENA.halfSize - 5 ||
            Math.abs(candidate.z) > ARENA.halfSize - 5
          )
            continue;
          if (
            this.ctx.trace(candidate, candidate, BOSS.radius) ||
            this.ctx.lane(candidate, target) !== 'clear'
          )
            continue;
          const reachable = !this.ctx.trace(boss, candidate, BOSS.radius * 0.85);
          const score =
            candidate.distanceTo(boss) +
            Math.abs(height - boss.y) * 1.2 +
            Math.abs(turn) * 3 +
            (reachable ? 0 : 28);
          if (score < cost) {
            cost = score;
            best = candidate;
          }
        }
    if (best) return best;
    const toward = player.clone().sub(boss).setY(0),
      length = toward.length();
    const keep = Math.max(DUEL.nearRange + 1, Math.min(length, DUEL.preferredRange));
    const vantage =
      length > 0.01
        ? player.clone().addScaledVector(toward.divideScalar(length), -keep)
        : boss.clone();
    vantage.x = clamp(vantage.x, -ARENA.halfSize + 8, ARENA.halfSize - 8);
    vantage.z = clamp(vantage.z, -ARENA.halfSize + 8, ARENA.halfSize - 8);
    vantage.y = clamp(Math.max((obstruction?.top ?? boss.y) + 5, player.y + 6), 3, ARENA.ceiling);
    return vantage;
  }
  /**
   * Next waypoint towards `to`: the straight flight when it is clear, otherwise the first
   * corner of the A* route around the footprints at this altitude — or a climb over the
   * blocking slab when that is cheaper than walking around it.
   */
  routeTo(from: Vector3, to: Vector3): Vector3 {
    this.route = [];
    this.overTop = false;
    const hit = this.ctx.trace(from, to, 1.4);
    if (!hit?.obstacle) return to;
    const level = Math.min(from.y, to.y),
      graph = this.graphFor(level),
      path = graph.path({ x: from.x, z: from.z }, { x: to.x, z: to.z });
    const o = hit.obstacle,
      bounds = (o.owner !== undefined && this.ctx.bounds()[o.owner]) || o,
      over = bounds.top + 4.5,
      climb = over - from.y;
    const walkCost = path ? pathLength(path) + Math.abs(to.y - from.y) : Infinity,
      direct = from.distanceTo(to);
    // Climbing over is worth it for low slabs, or whenever walking around is a long detour.
    const overCost =
      over <= ARENA.ceiling && (climb < 14 || walkCost > direct * 1.8)
        ? direct + Math.max(0, climb) * 2.5 + 6
        : Infinity;
    if (overCost < walkCost) {
      this.overTop = true;
      const above = new Vector3(
        clamp((bounds.minX + bounds.maxX) / 2, -ARENA.halfSize + 6, ARENA.halfSize - 6),
        Math.min(ARENA.ceiling, over),
        clamp((bounds.minZ + bounds.maxZ) / 2, -ARENA.halfSize + 6, ARENA.halfSize - 6),
      );
      // Climb in place first when the diagonal would clip the near edge of the slab.
      return this.ctx.trace(from, above, BOSS.radius * 0.85)
        ? new Vector3(from.x, above.y, from.z)
        : above;
    }
    if (!path || path.length < 2) return this.corner(from, to, bounds);
    const total = Math.max(1e-6, pathLength(path));
    let travelled = 0;
    for (let i = 1; i < path.length; i++) {
      travelled += Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z);
      this.route.push(
        new Vector3(
          path[i].x,
          Math.max(BOSS.hover, from.y + (to.y - from.y) * (travelled / total)),
          path[i].z,
        ),
      );
    }
    // A waypoint hidden behind terrain or a slab lip falls back to single-corner routing.
    const first = this.route[0];
    if (this.ctx.trace(from, first, BOSS.radius * 0.85)) return this.corner(from, to, bounds);
    // Intermediate corners get a carrot 10 m beyond them, so the arrive-damping of the motor
    // does not slow the boss at every corner of a long route.
    if (this.route.length > 1) {
      const heading = first.clone().sub(from),
        length = heading.length();
      if (length > 0.01) {
        const carrot = first.clone().addScaledVector(heading.divideScalar(length), 10);
        if (
          Math.abs(carrot.x) <= ARENA.halfSize - 4 &&
          Math.abs(carrot.z) <= ARENA.halfSize - 4 &&
          carrot.y >= BOSS.hover &&
          carrot.y <= ARENA.ceiling &&
          !this.ctx.trace(from, carrot, BOSS.radius * 0.85)
        )
          return carrot;
      }
    }
    return first;
  }
  /** One-corner fallback: a corner of the blocking footprint from which `to` is visible. */
  private corner(from: Vector3, to: Vector3, bounds: Obstacle): Vector3 {
    const margin = 4.5,
      points: Vector3[] = [];
    for (const y of new Set([from.y, to.y]))
      for (const [x, z] of [
        [bounds.minX - margin, bounds.minZ - margin],
        [bounds.maxX + margin, bounds.minZ - margin],
        [bounds.minX - margin, bounds.maxZ + margin],
        [bounds.maxX + margin, bounds.maxZ + margin],
      ])
        points.push(new Vector3(x, y, z));
    let best: Vector3 | null = null,
      cost = Infinity,
      partial: Vector3 | null = null,
      partialCost = Infinity;
    for (const point of points) {
      if (
        Math.abs(point.x) > ARENA.halfSize - 4 ||
        Math.abs(point.z) > ARENA.halfSize - 4 ||
        point.y < BOSS.hover ||
        point.y > ARENA.ceiling ||
        this.ctx.trace(point, point, BOSS.radius + 0.1) ||
        this.ctx.trace(from, point, BOSS.radius * 0.9)
      )
        continue;
      const leg = from.distanceTo(point),
        rest = point.distanceTo(to);
      if (!this.ctx.trace(point, to, 1.4)) {
        if (leg + rest < cost) {
          cost = leg + rest;
          best = point;
        }
      } else if (rest + leg * 0.5 < partialCost) {
        partialCost = rest + leg * 0.5;
        partial = point;
      }
    }
    return best ?? partial ?? to;
  }
  /**
   * Commits to one detour (a side-step or a climb over the blocking slab) for 0.8 s instead of
   * re-deciding every physics step, favouring the side already chosen and the side that opens
   * a straight line to the goal, so wide monoliths cannot trap the boss.
   */
  steer(boss: Vector3, motor: Vector3, goal: Vector3, player: Vector3, time: number) {
    if (this.detour) {
      const live = time < this.detour.until,
        clear =
          live &&
          !this.ctx.trace(boss, boss.clone().addScaledVector(this.detour.motion, 0.5), 0.5)
            ?.obstacle;
      if (clear) {
        motor.copy(this.detour.motion);
        return;
      }
      this.detour = null;
    }
    const blocked = this.ctx.trace(boss, boss.clone().addScaledVector(motor, 0.65), 0.55);
    if (!blocked?.obstacle) return;
    const speed = Math.max(9, motor.length()),
      heading = motor.clone().setY(0);
    if (heading.lengthSq() < 0.01) heading.copy(player).sub(boss).setY(0);
    heading.normalize();
    const side = new Vector3(-heading.z, 0, heading.x),
      options: Vector3[] = [];
    for (const reach of [8, 14, 22])
      for (const sign of [1, -1]) options.push(side.clone().multiplyScalar(sign * reach));
    const over = blocked.obstacle.top + 3.5;
    if (over < ARENA.ceiling)
      options.push(new Vector3(0, Math.max(0, over - boss.y), 0).addScaledVector(heading, 4));
    let best: Vector3 | null = null,
      cost = Infinity;
    for (const option of options) {
      const point = boss.clone().add(option);
      if (
        Math.abs(point.x) > ARENA.halfSize - 4 ||
        Math.abs(point.z) > ARENA.halfSize - 4 ||
        point.y < BOSS.hover - 0.6 ||
        point.y > ARENA.ceiling
      )
        continue;
      if (this.ctx.trace(boss, point, 0.5)) continue;
      const onward = !this.ctx.trace(point, goal, 0.5),
        sameSide = this.lastDetourSide !== 0 && Math.sign(option.dot(side)) === this.lastDetourSide;
      // Climbing counts half as much again as flying round: slipping past a monolith's corner
      // beats a forty-metre ascent, while hopping low cover stays cheap.
      const effort = Math.hypot(option.x, option.z) + Math.abs(option.y) * 1.5;
      const score = effort + point.distanceTo(goal) * 0.6 + (onward ? 0 : 14) + (sameSide ? -8 : 0);
      if (score < cost) {
        cost = score;
        best = option;
      }
    }
    const chosen = best ?? new Vector3(0, 10, 0),
      motion = chosen.clone().normalize().multiplyScalar(speed);
    this.lastDetourSide = Math.sign(chosen.dot(side));
    this.detour = { motion, until: time + 0.8 };
    motor.copy(motion);
  }
}
