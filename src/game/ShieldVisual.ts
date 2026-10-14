import * as THREE from 'three';
import { seededRandom } from './math';

export interface HexCell {
  q: number;
  r: number;
}
export const HEX_COUNTS = [6, 8, 7, 5, 9, 10] as const;
export const HEX_NEIGHBORS = [
  [1, 0],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [0, -1],
  [1, -1],
] as const;

/** Connected polyhex pieces: different cell counts/layouts, always the same hexagonal prism. */
export function shieldLayout(serial: number): HexCell[] {
  const random = seededRandom(7411 + serial * 127),
    count = HEX_COUNTS[serial % HEX_COUNTS.length];
  const cells: HexCell[] = [{ q: 0, r: 0 }],
    occupied = new Set(['0,0']);
  while (cells.length < count) {
    const candidates = new Map<string, { q: number; r: number; score: number }>();
    for (const cell of cells)
      for (const [dq, dr] of HEX_NEIGHBORS) {
        const q = cell.q + dq,
          r = cell.r + dr,
          key = `${q},${r}`;
        if (occupied.has(key) || Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) > 2) continue;
        const neighbors = HEX_NEIGHBORS.filter(([x, y]) =>
          occupied.has(`${q + x},${r + y}`),
        ).length;
        candidates.set(key, { q, r, score: neighbors * 0.55 + random() * 1.5 });
      }
    const next = [...candidates.values()].sort((a, b) => b.score - a.score)[0];
    cells.push({ q: next.q, r: next.r });
    occupied.add(`${next.q},${next.r}`);
  }
  return cells;
}
export function shieldPattern(serial: number) {
  return `hex-${shieldLayout(serial).length}`;
}

export function makeShieldPatch(serial: number): THREE.Group {
  const cells = shieldLayout(serial),
    radius = 0.29,
    depth = 0.05,
    centers = cells.map(
      (c) => new THREE.Vector2(Math.sqrt(3) * radius * (c.q + c.r / 2), 1.5 * radius * c.r),
    );
  const center = centers.reduce((a, b) => a.add(b), new THREE.Vector2()).divideScalar(cells.length);
  const fill: number[] = [],
    wires: number[] = [],
    glow: number[] = [],
    edges = new Set<string>();
  const edge = (ax: number, ay: number, bx: number, by: number) => {
    const a = `${ax.toFixed(4)},${ay.toFixed(4)}`,
      b = `${bx.toFixed(4)},${by.toFixed(4)}`,
      key = [a, b].sort().join('|');
    if (edges.has(key)) return;
    edges.add(key);
    wires.push(ax, ay, depth, bx, by, depth, ax, ay, -depth, bx, by, -depth);
    const length = Math.hypot(bx - ax, by - ay),
      dx = (-(by - ay) / length) * 0.012,
      dy = ((bx - ax) / length) * 0.012;
    glow.push(
      ax + dx,
      ay + dy,
      depth,
      bx + dx,
      by + dy,
      depth,
      bx - dx,
      by - dy,
      depth,
      ax + dx,
      ay + dy,
      depth,
      bx - dx,
      by - dy,
      depth,
      ax - dx,
      ay - dy,
      depth,
    );
  };
  for (const raw of centers) {
    const c = raw.clone().sub(center);
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + (i * Math.PI) / 3,
        b = a + Math.PI / 3,
        ax = c.x + Math.cos(a) * radius,
        ay = c.y + Math.sin(a) * radius,
        bx = c.x + Math.cos(b) * radius,
        by = c.y + Math.sin(b) * radius;
      edge(ax, ay, bx, by);
      fill.push(
        c.x,
        c.y,
        depth,
        ax,
        ay,
        depth,
        bx,
        by,
        depth,
        c.x,
        c.y,
        -depth,
        bx,
        by,
        -depth,
        ax,
        ay,
        -depth,
      );
      fill.push(
        ax,
        ay,
        depth,
        ax,
        ay,
        -depth,
        bx,
        by,
        depth,
        bx,
        by,
        depth,
        ax,
        ay,
        -depth,
        bx,
        by,
        -depth,
      );
    }
  }
  const geometry = (vertices: number[]) =>
    new THREE.BufferGeometry().setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3),
    );
  const group = new THREE.Group();
  group.add(
    new THREE.Mesh(
      geometry(fill),
      new THREE.MeshBasicMaterial({
        color: '#76e5ed',
        transparent: true,
        opacity: 0.075,
        side: THREE.DoubleSide,
        forceSinglePass: true,
        depthWrite: false,
        toneMapped: false,
      }),
    ),
  );
  const glowMesh = new THREE.Mesh(
    geometry(glow),
    new THREE.MeshBasicMaterial({
      color: '#66efff',
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      forceSinglePass: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  glowMesh.userData.glow = true;
  group.add(glowMesh);
  group.add(
    new THREE.LineSegments(
      geometry(wires),
      new THREE.LineBasicMaterial({
        color: '#d1ffff',
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        toneMapped: false,
      }),
    ),
  );
  group.userData.pattern = shieldPattern(serial);
  group.userData.cells = cells;
  group.userData.count = cells.length;
  group.userData.serial = serial;
  group.userData.kind = 'shield-echo';
  return group;
}
