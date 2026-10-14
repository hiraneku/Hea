import { Matrix4, Quaternion, Vector2, Vector3 } from 'three';
import {
  DUEL,
  patchBlocks,
  patchRadius,
  projectileNose,
  type ProjectileKind,
  type ShieldPatch,
} from './combat';
import {
  HEX_NEIGHBORS,
  cellPoint,
  layoutCentroid,
  nearestCell,
  shieldLayout,
  type HexCell,
} from './ShieldVisual';

export interface PatchSweep {
  patch: ShieldPatch;
  at: Vector3;
  t: number;
}
export interface PatchPlacement {
  position: Vector3;
  quaternion: Quaternion;
  cluster: number;
  anchor: HexCell;
  /** True when the piece was fitted edge-to-edge against standing pieces of the same lattice. */
  joined: boolean;
}
/** A shared hex lattice: every patch raised near it snaps onto the same grid of cells. */
interface Cluster {
  id: number;
  origin: Vector3;
  quaternion: Quaternion;
  inverse: Quaternion;
  scale: number;
  /** Centroid of the founding patch's layout: its group origin is offset from cell (0, 0). */
  centroid: Vector2;
}
const UP = new Vector3(0, 1, 0);
const cellKey = (q: number, r: number) => `${q},${r}`;

/**
 * The standing Aegis patches as world-space colliders. A patch keeps stopping shots on its
 * lane while its echo lives, absorbs a limited number of hits, and when it shatters the lane
 * stays open for a short gap before a fresh patch may form there — sustained fire on one line
 * eventually gets through, which is what keeps the auto-shield from being a wall.
 *
 * Patches raised next to each other do not pile up: they are fitted onto one shared hex
 * lattice, cell against cell like puzzle pieces, so a fan of bolts builds a tiled shell
 * instead of a heap of overlapping polyhexes.
 */
export class ShieldPatchRegistry {
  readonly patches: ShieldPatch[] = [];
  reuses = 0;
  shatters = 0;
  /** Shots that flew through an open hole instead of raising a patch. */
  leaks = 0;
  /** Pieces that were fitted against standing neighbours on their lattice. */
  joined = 0;
  private gaps: { direction: Vector3; remaining: number }[] = [];
  private clusters = new Map<number, Cluster>();
  private nextCluster = 1;
  reset() {
    this.patches.length = 0;
    this.gaps.length = 0;
    this.clusters.clear();
    this.reuses = this.shatters = this.leaks = this.joined = 0;
  }
  get openGaps() {
    return this.gaps.length;
  }
  get clusterCount() {
    return this.clusters.size;
  }
  /** Standing cells that share a lattice position — should always be zero. */
  get overlaps() {
    let count = 0;
    for (const cluster of this.clusters.values()) {
      const seen = new Set<string>();
      for (const patch of this.patches) {
        if (patch.cluster !== cluster.id) continue;
        for (const c of shieldLayout(patch.serial)) {
          const key = cellKey(patch.anchor.q + c.q, patch.anchor.r + c.r);
          if (seen.has(key)) count++;
          seen.add(key);
        }
      }
    }
    return count;
  }
  age(dt: number) {
    for (let i = this.patches.length - 1; i >= 0; i--) {
      this.patches[i].life -= dt;
      if (this.patches[i].life <= 0) this.patches.splice(i, 1);
    }
    for (let i = this.gaps.length - 1; i >= 0; i--) {
      this.gaps[i].remaining -= dt;
      if (this.gaps[i].remaining <= 0) this.gaps.splice(i, 1);
    }
    this.prune();
  }
  private prune() {
    for (const id of [...this.clusters.keys()])
      if (!this.patches.some((p) => p.cluster === id)) this.clusters.delete(id);
  }
  find(serial: number): ShieldPatch | undefined {
    return this.patches.find((p) => p.serial === serial);
  }
  /** First standing patch whose surface this projectile's head reaches during the step. */
  sweep(
    start: Vector3,
    end: Vector3,
    velocity: Vector3,
    radius: number,
    kind: ProjectileKind = 'fire',
  ): PatchSweep | null {
    let best: PatchSweep | null = null;
    for (const patch of this.patches) {
      const t = patchBlocks(patch, start, end, velocity, radius, projectileNose(kind));
      if (t === null || (best && t >= best.t)) continue;
      best = { patch, at: start.clone().lerp(end, t), t };
    }
    return best;
  }
  /** An existing patch whose footprint already covers a predicted intercept on the same lane. */
  overlapping(intercept: Vector3, normal: Vector3, radius: number): ShieldPatch | undefined {
    return this.patches.find(
      (q) =>
        intercept.distanceTo(new Vector3().fromArray(q.position)) <
          Math.max(q.radius, radius) * 0.95 && normal.dot(new Vector3().fromArray(q.normal)) > 0.55,
    );
  }
  /**
   * True while a shattered patch leaves a hole in the shell around that direction (`offset`
   * is the would-be patch position relative to the body); no new patch may form inside it.
   */
  gapAt(offset: Vector3): boolean {
    if (!this.gaps.length) return false;
    const direction = offset.clone().normalize(),
      limit = Math.cos((DUEL.shieldGapDegrees * Math.PI) / 180);
    return this.gaps.some((g) => g.direction.dot(direction) > limit);
  }
  /** A shot has been let through an open hole (counted once per shot by the caller). */
  noteLeak() {
    this.leaks++;
  }
  /**
   * Where a new patch for `serial` should stand so that it tiles with its neighbours. Near a
   * standing cluster of the same size and facing, the piece snaps onto that lattice at the
   * closest free anchor (preferring one that touches an existing piece); otherwise it founds
   * a new lattice at the requested point. The snap never moves the piece further than 70 % of
   * its blocking radius, so the shot it was raised for still lands on it.
   */
  place(desired: Vector3, normal: Vector3, scale: number, serial: number): PatchPlacement {
    const cells = shieldLayout(serial),
      centroid = layoutCentroid(cells);
    const near = this.patches
      .filter(
        (p) =>
          Math.abs(p.scale - scale) < 0.05 &&
          normal.dot(new Vector3().fromArray(p.normal)) > 0.72 &&
          desired.distanceTo(new Vector3().fromArray(p.position)) < 2.8 * scale,
      )
      .sort(
        (a, b) =>
          desired.distanceTo(new Vector3().fromArray(a.position)) -
          desired.distanceTo(new Vector3().fromArray(b.position)),
      );
    for (const neighbour of near) {
      const cluster = this.clusters.get(neighbour.cluster);
      if (!cluster) continue;
      const fit = this.fit(cluster, cells, centroid, desired, scale);
      if (fit) return fit;
    }
    const quaternion = frameFor(normal);
    const cluster: Cluster = {
      id: this.nextCluster++,
      origin: desired.clone(),
      quaternion,
      inverse: quaternion.clone().invert(),
      scale,
      centroid,
    };
    this.clusters.set(cluster.id, cluster);
    return {
      position: desired.clone(),
      quaternion: quaternion.clone(),
      cluster: cluster.id,
      anchor: { q: 0, r: 0 },
      joined: false,
    };
  }
  private fit(
    cluster: Cluster,
    cells: HexCell[],
    centroid: Vector2,
    desired: Vector3,
    scale: number,
  ): PatchPlacement | null {
    const occupied = new Set<string>();
    for (const patch of this.patches) {
      if (patch.cluster !== cluster.id) continue;
      for (const c of shieldLayout(patch.serial))
        occupied.add(cellKey(patch.anchor.q + c.q, patch.anchor.r + c.r));
    }
    const local = desired.clone().sub(cluster.origin).applyQuaternion(cluster.inverse),
      target = new Vector2(local.x, local.y);
    // Group origin for anchor (Q, R): (cellPoint(Q, R) − c0 + c1) · scale, so invert for a seed.
    const seedPoint = target.clone().divideScalar(scale).add(cluster.centroid).sub(centroid);
    const seed = nearestCell(seedPoint.x, seedPoint.y),
      limit = patchRadius(scale) * 0.7;
    let best: { score: number; anchor: HexCell; origin: Vector2; joined: boolean } | null = null;
    for (let dq = -4; dq <= 4; dq++)
      for (let dr = -4; dr <= 4; dr++) {
        if (Math.abs(dq + dr) > 4) continue;
        const Q = seed.q + dq,
          R = seed.r + dr;
        let joined = false,
          free = true;
        for (const c of cells) {
          if (occupied.has(cellKey(Q + c.q, R + c.r))) {
            free = false;
            break;
          }
          if (!joined)
            joined = HEX_NEIGHBORS.some(([x, y]) =>
              occupied.has(cellKey(Q + c.q + x, R + c.r + y)),
            );
        }
        if (!free) continue;
        const origin = cellPoint(Q, R).sub(cluster.centroid).add(centroid).multiplyScalar(scale),
          distance = origin.distanceTo(target);
        if (distance > limit) continue;
        const score = distance - (joined ? 0.18 * scale : 0);
        if (!best || score < best.score) best = { score, anchor: { q: Q, r: R }, origin, joined };
      }
    if (!best) return null;
    const position = new Vector3(best.origin.x, best.origin.y, 0)
      .applyQuaternion(cluster.quaternion)
      .add(cluster.origin);
    if (best.joined) this.joined++;
    return {
      position,
      quaternion: cluster.quaternion.clone(),
      cluster: cluster.id,
      anchor: best.anchor,
      joined: best.joined,
    };
  }
  add(patch: ShieldPatch) {
    this.patches.push(patch);
    if (this.patches.length > 24) this.patches.shift();
  }
  /**
   * A shot connects with a standing patch: count the hit and renew the patch. Returns
   * 'shattered' when this hit was the last it could take; the lane then stays open for a gap.
   */
  absorb(patch: ShieldPatch, scale: number): 'held' | 'shattered' {
    patch.hits++;
    if (patch.hits > 1) this.reuses++;
    if (patch.hits >= DUEL.shieldPatchHits) {
      const index = this.patches.indexOf(patch);
      if (index >= 0) this.patches.splice(index, 1);
      this.gaps.push({
        direction: new Vector3().fromArray(patch.offset).normalize(),
        remaining: DUEL.shieldGap,
      });
      this.shatters++;
      this.prune();
      return 'shattered';
    }
    patch.life = Math.max(patch.life, scale > 2 ? DUEL.shieldPatchLifeLarge : DUEL.shieldPatchLife);
    patch.radius = Math.max(patch.radius, patchRadius(scale));
    return 'held';
  }
}

/** Orientation whose +Z is `normal`, with a level X axis where possible. */
export function frameFor(normal: Vector3): Quaternion {
  const z = normal.clone().normalize();
  let x = new Vector3().crossVectors(UP, z);
  if (x.lengthSq() < 1e-6) x = new Vector3(1, 0, 0);
  x.normalize();
  const y = new Vector3().crossVectors(z, x);
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, y, z));
}
