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
/** Whether a patch-plane point (centroid-relative) lies on one of the patch's cells. */
export function onCells(x: number, y: number, cells: HexCell[], centroid: number[]): boolean {
  const near = nearestCell(x + centroid[0], y + centroid[1]);
  return cells.some((c) => c.q === near.q && c.r === near.r);
}

/**
 * Impact cracks as glass sees them: a spiderweb of tapered ribbons (bright and wide at the
 * strike, hair-thin and dim at the tips) with forks, one or two partial concentric arcs, and a
 * small frosted bruise at the centre. Built in patch-local coordinates on both faces of the
 * plate, and clipped to the patch's own cells so nothing hangs in the air beside it. Vertex
 * colours carry the brightness; the mesh is drawn additively.
 */
export function crackGeometry(
  x: number,
  y: number,
  reach: number,
  seed: number,
  cells: HexCell[],
  centroid: number[],
): THREE.BufferGeometry {
  const random = seededRandom(seed),
    positions: number[] = [],
    colors: number[] = [],
    z = HEX_DEPTH + 0.004,
    inside = (px: number, py: number) => !cells.length || onCells(px, py, cells, centroid);
  const tint = (k: number): [number, number, number] => [k, k * 0.98 + 0.02, 1.0 * k + 0.0];
  // A ribbon along a polyline, width and brightness interpolated per point, on both faces.
  const ribbon = (points: [number, number][], widths: number[], bright: number[]) => {
    if (points.length < 2) return;
    for (let i = 0; i + 1 < points.length; i++) {
      const [ax, ay] = points[i],
        [bx, by] = points[i + 1],
        length = Math.hypot(bx - ax, by - ay) || 1e-6,
        nx = (-(by - ay) / length) * 0.5,
        ny = ((bx - ax) / length) * 0.5,
        wa = widths[i],
        wb = widths[i + 1],
        ca = tint(bright[i]),
        cb = tint(bright[i + 1]);
      for (const face of [z, -z]) {
        positions.push(
          ax + nx * wa,
          ay + ny * wa,
          face,
          ax - nx * wa,
          ay - ny * wa,
          face,
          bx + nx * wb,
          by + ny * wb,
          face,
          ax - nx * wa,
          ay - ny * wa,
          face,
          bx - nx * wb,
          by - ny * wb,
          face,
          bx + nx * wb,
          by + ny * wb,
          face,
        );
        colors.push(...ca, ...ca, ...cb, ...ca, ...cb, ...cb);
      }
    }
  };
  // Walk a jagged line, clipping the last step at the rim of the cells.
  const walk = (
    sx: number,
    sy: number,
    angle: number,
    length: number,
    steps: number,
    wobble: number,
  ): [number, number][] => {
    const out: [number, number][] = [[sx, sy]];
    let px = sx,
      py = sy,
      a = angle;
    for (let i = 0; i < steps; i++) {
      a += (random() - 0.5) * wobble;
      const step = (length / steps) * (0.65 + random() * 0.7);
      let qx = px + Math.cos(a) * step,
        qy = py + Math.sin(a) * step;
      if (!inside(qx, qy)) {
        // Bisect towards the rim so the crack ends exactly at the edge of the glass.
        let lo = 0,
          hi = 1;
        for (let k = 0; k < 7; k++) {
          const mid = (lo + hi) / 2;
          if (inside(px + (qx - px) * mid, py + (qy - py) * mid)) lo = mid;
          else hi = mid;
        }
        qx = px + (qx - px) * lo;
        qy = py + (qy - py) * lo;
        if (lo > 0.05) out.push([qx, qy]);
        break;
      }
      out.push([qx, qy]);
      px = qx;
      py = qy;
    }
    return out;
  };
  const taper = (points: [number, number][], root: number, tip: number, glow: number) => {
    const n = points.length - 1;
    ribbon(
      points,
      points.map((_, i) => root + (tip - root) * (i / Math.max(1, n))),
      points.map((_, i) => glow * (1 - 0.85 * (i / Math.max(1, n)))),
    );
  };
  const rootWidth = 0.02 + reach * 0.012;
  const spokes = 5 + Math.floor(random() * 3),
    base = random() * Math.PI * 2;
  for (let i = 0; i < spokes; i++) {
    const angle = base + (i / spokes) * Math.PI * 2 + (random() - 0.5) * 0.7,
      length = reach * (0.55 + random() * 0.6),
      spine = walk(x, y, angle, length, 6, 0.9);
    taper(spine, rootWidth, 0.004, 1);
    // Forks part-way out: shorter, thinner, dimmer.
    const forks = random() < 0.75 ? 1 + Math.floor(random() * 2) : 0;
    for (let f = 0; f < forks && spine.length > 2; f++) {
      const at = 1 + Math.floor(random() * (spine.length - 2)),
        [fx, fy] = spine[at],
        side = random() < 0.5 ? -1 : 1,
        branch = walk(fx, fy, angle + side * (0.5 + random() * 0.6), length * 0.45, 4, 1);
      taper(branch, rootWidth * 0.55, 0.003, 0.65);
    }
  }
  // Partial concentric rings where the glass buckled, broken into jagged arcs.
  const arcs = 1 + Math.floor(random() * 2);
  for (let i = 0; i < arcs; i++) {
    const r = reach * (0.3 + i * 0.3 + random() * 0.12),
      start = random() * Math.PI * 2,
      span = 0.7 + random() * 1.3,
      steps = 8,
      points: [number, number][] = [];
    for (let k = 0; k <= steps; k++) {
      const a = start + (k / steps) * span,
        rr = r * (1 + (random() - 0.5) * 0.14),
        px = x + Math.cos(a) * rr,
        py = y + Math.sin(a) * rr;
      if (!inside(px, py)) {
        if (points.length > 1) taper(points, rootWidth * 0.45, 0.004, 0.55);
        points.length = 0;
        continue;
      }
      points.push([px, py]);
    }
    if (points.length > 1)
      ribbon(
        points,
        points.map((_, k) => rootWidth * 0.45 * Math.sin((k / points.length) * Math.PI) + 0.003),
        points.map(() => 0.5),
      );
  }
  // The frosted bruise: a soft 12-gon disc, bright at the strike and fading to nothing.
  const bruise = reach * 0.22;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2,
      b = ((i + 1) / 12) * Math.PI * 2,
      ra = bruise * (0.8 + random() * 0.4),
      rb = bruise * (0.8 + random() * 0.4);
    for (const face of [z, -z]) {
      positions.push(
        x,
        y,
        face,
        x + Math.cos(a) * ra,
        y + Math.sin(a) * ra,
        face,
        x + Math.cos(b) * rb,
        y + Math.sin(b) * rb,
        face,
      );
      colors.push(0.55, 0.57, 0.6, 0, 0, 0, 0, 0, 0);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
}

/** Connected polyhex pieces: different cell counts/layouts, always the same hexagonal prism. */
export function shieldLayout(serial: number, scale?: number): HexCell[] {
  // Large incoming shots need a broad, multi-cell catch surface; fine bolts use a compact
  // three/four-cell sigil. Unscaled calls preserve the historic default layout for diagnostics.
  const counts =
    scale === undefined
      ? HEX_COUNTS
      : scale < 1.45
        ? ([3, 4, 5, 3, 5, 4] as const)
        : scale < 2.1
          ? ([5, 6, 7, 6, 5, 7] as const)
          : ([9, 10, 11, 12, 10, 11] as const);
  const random = seededRandom(7411 + serial * 127),
    count = counts[serial % counts.length];
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
export function shieldPattern(serial: number, scale?: number) {
  return `hex-${shieldLayout(serial, scale).length}`;
}

/** Per-patch reveal state shared by the three materials of a patch (0 hidden … 1 standing). */
export interface ShieldReveal {
  value: number;
}

/**
 * The materialise/dissolve of a patch, cell by cell, in the vertex shader: each hex scales
 * about its own centre, first to a faint dot and then popping out to full size, in the sweep
 * order baked into the geometry; played backwards the cells shrink to dots and wink out.
 * Interior lattice edges are drawn lighter than the rim through `edgeWeight`.
 */
function revealMaterial<M extends THREE.Material>(material: M, reveal: ShieldReveal): M {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uReveal = reveal;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        attribute vec2 cellCenter;
        attribute float cellOrder;
        attribute float edgeWeight;
        uniform float uReveal;
        varying float vCell;
        varying float vWeight;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float local = clamp(uReveal * 1.6 - cellOrder * 0.6, 0.0, 1.0);
        float pop = 1.0 - pow(1.0 - clamp((local - 0.3) / 0.7, 0.0, 1.0), 3.0);
        float s = local <= 0.001 ? 0.0 : (local < 0.3 ? 0.14 : 0.14 + 0.86 * pop);
        transformed.xy = cellCenter + (transformed.xy - cellCenter) * s;
        vCell = s;
        vWeight = edgeWeight;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying float vCell;
        varying float vWeight;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        if (vCell < 0.02) discard;
        diffuseColor.a *= vWeight;`,
      );
  };
  material.customProgramCacheKey = () => 'hea-shield-reveal';
  return material;
}

export function makeShieldPatch(serial: number, scale?: number): THREE.Group {
  const cells = shieldLayout(serial, scale),
    radius = HEX_RADIUS,
    depth = HEX_DEPTH,
    centers = cells.map((c) => cellPoint(c.q, c.r, radius));
  const center = layoutCentroid(cells, radius);
  // The sweep: cells materialise outwards from the strike (the patch origin), with a slight
  // sideways bias so the bloom reads as a sweep across the cluster rather than a pure ring.
  const bias = (serial % 7) * 0.9;
  const ranked = centers
    .map((raw, i) => ({
      i,
      key:
        raw.distanceTo(center) +
        0.12 * Math.cos(Math.atan2(raw.y - center.y, raw.x - center.x) - bias),
    }))
    .sort((a, b) => a.key - b.key);
  const order = new Array<number>(cells.length);
  ranked.forEach((entry, rank) => {
    order[entry.i] = cells.length > 1 ? rank / (cells.length - 1) : 0;
  });
  const has = (q: number, r: number) => cells.some((c) => c.q === q && c.r === r);
  const fill: number[] = [],
    wires: number[] = [],
    glow: number[] = [],
    fillAttr: number[] = [],
    wireAttr: number[] = [],
    glowAttr: number[] = [];
  const stamp = (target: number[], count: number, cx: number, cy: number, o: number, w: number) => {
    for (let i = 0; i < count; i++) target.push(cx, cy, o, w);
  };
  centers.forEach((raw, index) => {
    const c = raw.clone().sub(center),
      cell = cells[index],
      o = order[index];
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + (i * Math.PI) / 3,
        b = a + Math.PI / 3,
        ax = c.x + Math.cos(a) * radius,
        ay = c.y + Math.sin(a) * radius,
        bx = c.x + Math.cos(b) * radius,
        by = c.y + Math.sin(b) * radius;
      // The neighbour across this edge sits at the next axial step in the edge's direction.
      const mid = ((i + 1) * Math.PI) / 3,
        probe = nearestCell(
          raw.x + Math.cos(mid) * radius * Math.sqrt(3),
          raw.y + Math.sin(mid) * radius * Math.sqrt(3),
        ),
        shared = has(probe.q, probe.r) && !(probe.q === cell.q && probe.r === cell.r),
        weight = shared ? 0.5 : 1;
      wires.push(ax, ay, depth, bx, by, depth, ax, ay, -depth, bx, by, -depth);
      stamp(wireAttr, 4, c.x, c.y, o, weight);
      const length = Math.hypot(bx - ax, by - ay),
        dx = (-(by - ay) / length) * 0.018,
        dy = ((bx - ax) / length) * 0.018;
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
      stamp(glowAttr, 6, c.x, c.y, o, weight);
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
      stamp(fillAttr, 12, c.x, c.y, o, 1);
    }
  });
  const geometry = (vertices: number[], attributes: number[]) => {
    const g = new THREE.BufferGeometry().setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    const n = attributes.length / 4,
      centersAttr = new Float32Array(n * 2),
      orders = new Float32Array(n),
      weights = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      centersAttr[i * 2] = attributes[i * 4];
      centersAttr[i * 2 + 1] = attributes[i * 4 + 1];
      orders[i] = attributes[i * 4 + 2];
      weights[i] = attributes[i * 4 + 3];
    }
    g.setAttribute('cellCenter', new THREE.BufferAttribute(centersAttr, 2));
    g.setAttribute('cellOrder', new THREE.BufferAttribute(orders, 1));
    g.setAttribute('edgeWeight', new THREE.BufferAttribute(weights, 1));
    return g;
  };
  const reveal: ShieldReveal = { value: 0 };
  const group = new THREE.Group();
  group.add(
    new THREE.Mesh(
      geometry(fill, fillAttr),
      revealMaterial(
        new THREE.MeshBasicMaterial({
          color: '#9eeff5',
          transparent: true,
          opacity: 0.13,
          side: THREE.DoubleSide,
          forceSinglePass: true,
          depthWrite: false,
          toneMapped: false,
        }),
        reveal,
      ),
    ),
  );
  const glowMesh = new THREE.Mesh(
    geometry(glow, glowAttr),
    revealMaterial(
      new THREE.MeshBasicMaterial({
        color: '#5fe9ff',
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        forceSinglePass: true,
        depthWrite: false,
        toneMapped: false,
      }),
      reveal,
    ),
  );
  glowMesh.userData.glow = true;
  group.add(glowMesh);
  group.add(
    new THREE.LineSegments(
      geometry(wires, wireAttr),
      revealMaterial(
        new THREE.LineBasicMaterial({
          color: '#e4ffff',
          transparent: true,
          opacity: 0.95,
          depthWrite: false,
          toneMapped: false,
        }),
        reveal,
      ),
    ),
  );
  group.userData.pattern = shieldPattern(serial, scale);
  group.userData.cells = cells;
  group.userData.centroid = [center.x, center.y];
  group.userData.count = cells.length;
  group.userData.serial = serial;
  group.userData.kind = 'shield-echo';
  group.userData.reveal = reveal;
  return group;
}
