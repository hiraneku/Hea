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

/** Circumradius of one hex cell (unscaled) and the prism's half thickness. */
export const HEX_RADIUS = 0.29;
export const HEX_DEPTH = 0.05;
/** Centre of axial cell (q, r) in the patch plane, pointy-top orientation. */
export function cellPoint(q: number, r: number, radius = HEX_RADIUS): THREE.Vector2 {
  return new THREE.Vector2(Math.sqrt(3) * radius * (q + r / 2), 1.5 * radius * r);
}
/** Mean of the cell centres: the group origin of a patch sits here, not on cell (0, 0). */
export function layoutCentroid(cells: HexCell[], radius = HEX_RADIUS): THREE.Vector2 {
  const sum = cells.reduce((a, c) => a.add(cellPoint(c.q, c.r, radius)), new THREE.Vector2());
  return sum.divideScalar(Math.max(1, cells.length));
}
/** Axial cell nearest to a point in the patch plane (pointy-top axial rounding). */
export function nearestCell(x: number, y: number, radius = HEX_RADIUS): HexCell {
  const q = ((Math.sqrt(3) / 3) * x - y / 3) / radius,
    r = ((2 / 3) * y) / radius;
  let rq = Math.round(q),
    rr = Math.round(r);
  const rs = Math.round(-q - r),
    dq = Math.abs(rq - q),
    dr = Math.abs(rr - r),
    ds = Math.abs(rs + q + r);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return { q: rq, r: rr };
}

/** One hexagonal prism (pointy-top, matching the patch cells) for shards and tiles. */
export function hexPrismGeometry(radius = HEX_RADIUS, depth = HEX_DEPTH): THREE.BufferGeometry {
  const geometry = new THREE.CylinderGeometry(radius, radius, depth * 2, 6, 1, false);
  // CylinderGeometry stands along Y; laid into the XY plane its corners fall on ±30°, ±90°,
  // ±150° — exactly the pointy-top cells of the patch.
  geometry.rotateX(Math.PI / 2);
  return geometry;
}
/** Jagged crack lines radiating from a strike point, in patch-local coordinates. */
export function crackSegments(x: number, y: number, reach: number, seed: number): number[] {
  const random = seededRandom(seed),
    out: number[] = [],
    branches = 3 + Math.floor(random() * 2);
  for (let b = 0; b < branches; b++) {
    let ax = x,
      ay = y,
      angle = random() * Math.PI * 2;
    const steps = 2 + Math.floor(random() * 2);
    for (let i = 0; i < steps; i++) {
      const length = (reach / steps) * (0.6 + random() * 0.8);
      angle += (random() - 0.5) * 1.1;
      const bx = ax + Math.cos(angle) * length,
        by = ay + Math.sin(angle) * length;
      out.push(ax, ay, HEX_DEPTH + 0.004, bx, by, HEX_DEPTH + 0.004);
      ax = bx;
      ay = by;
    }
  }
  return out;
}

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
    radius = HEX_RADIUS,
    depth = HEX_DEPTH,
    centers = cells.map((c) => cellPoint(c.q, c.r, radius));
  const center = layoutCentroid(cells, radius);
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
  group.userData.centroid = [center.x, center.y];
  group.userData.count = cells.length;
  group.userData.serial = serial;
  group.userData.kind = 'shield-echo';
  return group;
}
