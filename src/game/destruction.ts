import { clamp, type Obstacle, type Point3 } from './math';

export interface Cell {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  alive: boolean;
  ix: number;
  iy: number;
  iz: number;
}

/** Lazy fractured geometry uses these same cells for rendering AND collision. */
export class DestructibleVolume {
  readonly cells: Cell[] = [];
  readonly nx: number;
  readonly ny: number;
  readonly nz: number;
  damaged = false;
  constructor(
    readonly bounds: Obstacle,
    readonly owner: number,
    cellSize = 1.35,
  ) {
    const width = bounds.maxX - bounds.minX,
      height = bounds.top - (bounds.bottom ?? 0),
      depth = bounds.maxZ - bounds.minZ;
    this.nx = Math.ceil(width / cellSize);
    this.ny = Math.ceil(height / cellSize);
    this.nz = Math.ceil(depth / cellSize);
    const w = width / this.nx,
      h = height / this.ny,
      d = depth / this.nz;
    for (let x = 0; x < this.nx; x++)
      for (let z = 0; z < this.nz; z++)
        for (let y = 0; y < this.ny; y++) {
          this.cells.push({
            x: bounds.minX + (x + 0.5) * w,
            y: (bounds.bottom ?? 0) + (y + 0.5) * h,
            z: bounds.minZ + (z + 0.5) * d,
            w,
            h,
            d,
            alive: true,
            ix: x,
            iy: y,
            iz: z,
          });
        }
  }
  reset() {
    this.damaged = false;
    this.cells.forEach((c) => {
      c.alive = true;
    });
  }
  breakAt(point: Point3, radius: number): Cell[] {
    const removed: Cell[] = [];
    for (const cell of this.cells) {
      if (!cell.alive) continue;
      const dx = point.x - clamp(point.x, cell.x - cell.w / 2, cell.x + cell.w / 2);
      const dy = point.y - clamp(point.y, cell.y - cell.h / 2, cell.y + cell.h / 2);
      const dz = point.z - clamp(point.z, cell.z - cell.d / 2, cell.z + cell.d / 2);
      if (dx * dx + dy * dy + dz * dz <= radius * radius) {
        cell.alive = false;
        removed.push(cell);
      }
    }
    this.damaged ||= removed.length > 0;
    return removed;
  }
  colliders(): Obstacle[] {
    if (!this.damaged) return [{ ...this.bounds, owner: this.owner }];
    const result: Obstacle[] = [];
    // Merge intact vertical runs. A hole keeps its actual opening, including its ceiling.
    for (let x = 0; x < this.nx; x++)
      for (let z = 0; z < this.nz; z++) {
        let run: Obstacle | null = null;
        for (let y = 0; y < this.ny; y++) {
          const c = this.cells[(x * this.nz + z) * this.ny + y];
          if (!c.alive) {
            if (run) result.push(run);
            run = null;
            continue;
          }
          if (!run)
            run = {
              minX: c.x - c.w / 2,
              maxX: c.x + c.w / 2,
              minZ: c.z - c.d / 2,
              maxZ: c.z + c.d / 2,
              bottom: c.y - c.h / 2,
              top: c.y + c.h / 2,
              owner: this.owner,
            };
          else run.top = c.y + c.h / 2;
        }
        if (run) result.push(run);
      }
    return result;
  }
}

export interface Crater {
  x: number;
  z: number;
  radius: number;
  depth: number;
}
export class TerrainDeformation {
  readonly craters: Crater[] = [];
  reset() {
    this.craters.length = 0;
  }
  add(x: number, z: number, radius: number, depth: number) {
    const nearby = this.craters.find((c) => Math.hypot(c.x - x, c.z - z) < 0.8);
    if (nearby) {
      nearby.radius = Math.max(nearby.radius, radius);
      nearby.depth = Math.max(nearby.depth, depth);
      return;
    }
    if (this.craters.length >= 24) return; // Never heal older terrain unexpectedly under the player.
    this.craters.push({ x, z, radius: clamp(radius, 0.6, 5), depth: clamp(depth, 0.1, 1.5) });
  }
  heightAt(x: number, z: number): number {
    let depression = 0,
      rim = 0;
    for (const c of this.craters) {
      const d = Math.hypot(x - c.x, z - c.z) / c.radius;
      if (d < 1) depression = Math.min(depression, -c.depth * (1 - d * d) ** 2);
      if (d >= 0.85 && d < 1.35)
        rim = Math.max(rim, Math.sin(((d - 0.85) / 0.5) * Math.PI) * c.depth * 0.17);
    }
    return depression < -0.025 ? depression : rim + depression;
  }
}
