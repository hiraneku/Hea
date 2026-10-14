import { Vector3 } from 'three';
import { DUEL, patchBlocks, patchRadius, type ShieldPatch } from './combat';

export interface PatchSweep {
  patch: ShieldPatch;
  at: Vector3;
}
/**
 * The standing Aegis patches as world-space colliders. A patch keeps stopping shots on its
 * lane while its echo lives, absorbs a limited number of hits, and when it shatters the lane
 * stays open for a short gap before a fresh patch may form there — sustained fire on one line
 * eventually gets through, which is what keeps the auto-shield from being a wall.
 */
export class ShieldPatchRegistry {
  readonly patches: ShieldPatch[] = [];
  reuses = 0;
  shatters = 0;
  /** Shots that flew through an open hole instead of raising a patch. */
  leaks = 0;
  private gaps: { direction: Vector3; remaining: number }[] = [];
  reset() {
    this.patches.length = 0;
    this.gaps.length = 0;
    this.reuses = this.shatters = this.leaks = 0;
  }
  get openGaps() {
    return this.gaps.length;
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
  }
  /** First standing patch swept through by this projectile step, front face only. */
  sweep(start: Vector3, end: Vector3, velocity: Vector3, radius: number): PatchSweep | null {
    for (const patch of this.patches) {
      const t = patchBlocks(patch, start, end, velocity, radius);
      if (t === null) continue;
      return { patch, at: start.clone().lerp(end, t) };
    }
    return null;
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
    const open = this.gaps.some((g) => g.direction.dot(direction) > limit);
    if (open) this.leaks++;
    return open;
  }
  add(patch: ShieldPatch) {
    this.patches.push(patch);
    if (this.patches.length > 24) this.patches.shift();
  }
  /**
   * A standing patch absorbs another shot on its lane: renew it rather than stack a new one.
   * Returns 'shattered' when this hit was the last it could take.
   */
  absorb(patch: ShieldPatch, scale: number): 'held' | 'shattered' {
    patch.hits++;
    this.reuses++;
    if (patch.hits >= DUEL.shieldPatchHits) {
      const index = this.patches.indexOf(patch);
      if (index >= 0) this.patches.splice(index, 1);
      this.gaps.push({
        direction: new Vector3().fromArray(patch.offset).normalize(),
        remaining: DUEL.shieldGap,
      });
      this.shatters++;
      return 'shattered';
    }
    patch.life = Math.max(patch.life, scale > 2 ? DUEL.shieldPatchLifeLarge : DUEL.shieldPatchLife);
    patch.radius = Math.max(patch.radius, patchRadius(scale));
    return 'held';
  }
}
