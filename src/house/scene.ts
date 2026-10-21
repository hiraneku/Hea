import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { M } from './materials';
import { obstacles } from './layout';

/** Static, locally modelled stylized interior. No changes to the character rig. */
export function buildHouse(scene: T.Scene) {
  obstacles.length = 0;
  const world = new T.Group();
  scene.add(world);
  const unitBox = new T.BoxGeometry(1, 1, 1);
  const softBox = new RoundedBoxGeometry(1, 1, 1, 2, 0.055);
  const cylinder = new T.CylinderGeometry(1, 1, 1, 12);
  const sphere = new T.SphereGeometry(1, 12, 8);
  function mesh(
    g: T.BufferGeometry,
    m: T.Material,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = 1,
    sz = 1,
    cast = true,
  ) {
    const o = new T.Mesh(g, m);
    o.position.set(x, y, z);
    o.scale.set(sx, sy, sz);
    o.castShadow = cast;
    o.receiveShadow = true;
    world.add(o);
    return o;
  }
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    m: T.Material = M.wood,
    cast = true,
  ) =>
    mesh(
      [M.linen, M.sage, M.rust, M.blue, M.cream].includes(m as T.MeshStandardMaterial)
        ? softBox
        : unitBox,
      m,
      x,
      y,
      z,
      w,
      h,
      d,
      cast,
    );
  const ball = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    m: T.Material = M.pottery,
  ) => mesh(sphere, m, x, y, z, w, h, d);
  const cyl = (x: number, y: number, z: number, r: number, h: number, m: T.Material = M.wood) =>
    mesh(cylinder, m, x, y, z, r, h, r);
  const block = (x: number, z: number, w: number, d: number, floor = 0) =>
    obstacles.push({ x, z, w, d, floor });
  function beam(a: T.Vector3, b: T.Vector3, width = 0.08, m: T.Material = M.dark) {
    const o = box(
      (a.x + b.x) / 2,
      (a.y + b.y) / 2,
      (a.z + b.z) / 2,
      width,
      a.distanceTo(b),
      width,
      m,
    );
    o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    return o;
  }
  function shadow(x: number, z: number, w: number, d: number, y = 0) {
    const o = mesh(new T.PlaneGeometry(w, d), M.ao, x, y + 0.029, z, 1, 1, 1, false);
    o.rotation.x = -Math.PI / 2;
  }
  function rug(x: number, z: number, w: number, d: number, y = 0) {
    box(x, y + 0.012, z, w, 0.018, d, M.rug, false);
    for (let i = 0; i < 24; i++)
      for (const side of [-1, 1])
        box(
          x - w / 2 + (i * w) / 23,
          y + 0.019,
          z + side * (d / 2 + 0.045),
          0.014,
          0.008,
          0.09,
          M.linen,
          false,
        );
  }
  function vase(x: number, y: number, z: number, scale = 0.22, m: T.Material = M.clay) {
    const points = [
      [0, 0],
      [0.65, 0],
      [0.82, 0.18],
      [1, 0.55],
      [0.83, 0.95],
      [0.46, 1.2],
      [0.45, 1.45],
      [0.55, 1.5],
    ].map(([r, h]) => new T.Vector2(r * scale, h * scale));
    return mesh(new T.LatheGeometry(points, 16), m, x, y, z);
  }
  function plant(x: number, y: number, z: number, scale = 0.22) {
    vase(x, y, z, scale * 0.7, M.clay);
    for (let i = 0; i < 7; i++) {
      const a = i * 2.4;
      const leaf = ball(
        x + Math.cos(a) * scale * 0.6,
        y + scale * (1.6 + i * 0.09),
        z + Math.sin(a) * scale * 0.6,
        scale * 0.25,
        scale * 0.9,
        scale * 0.15,
        i % 2 ? M.leaf : M.leafLight,
      );
      leaf.rotation.set(Math.sin(a) * 0.8, 0, Math.cos(a) * 0.8);
    }
  }
  function book(x: number, y: number, z: number, h: number, m: T.Material = M.sage) {
    box(x, y + h / 2, z, 0.075, h, 0.2, m);
    box(x + 0.039, y + h / 2, z + 0.01, 0.008, h - 0.025, 0.16, M.linen, false);
    for (const a of [-0.32, 0.32])
      box(x, y + h / 2 + h * a, z + 0.105, 0.053, 0.013, 0.008, M.gold, false);
  }
  function shelf(x: number, y: number, z: number, w: number, h: number) {
    box(x - w / 2, y + h / 2, z, 0.1, h, 0.34, M.dark);
    box(x + w / 2, y + h / 2, z, 0.1, h, 0.34, M.dark);
    box(x, y + h / 2, z - 0.15, w, h, 0.035, M.edge);
    for (let row = 0; row < 4; row++) {
      const sy = y + (row * h) / 3;
      box(x, sy, z, w, 0.07, 0.38, M.edge);
      if (row < 3)
        for (let i = 0; i < Math.floor(w / 0.11) - 2; i++) {
          const materials = [M.sage, M.rust, M.cream, M.blue, M.dark];
          book(
            x - w / 2 + 0.15 + i * 0.105,
            sy + 0.045,
            z,
            0.19 + ((i * 7 + row * 3) % 5) * 0.035,
            materials[(i + row) % 5],
          );
        }
    }
  }
  function picture(x: number, y: number, z: number, w = 0.85, h = 0.63, angle = 0) {
    const g = new T.Group();
    world.add(g);
    // Building in local coordinates then rotating preserves both wall orientations.

    const frame = box(x, y, z, w + 0.09, h + 0.09, 0.055, M.dark);
    const painting = box(x, y, z + 0.036, w, h, 0.012, M.art, false);
    g.position.set(x, y, z);
    for (const o of [frame, painting]) {
      g.add(o);
      o.position.sub(g.position);
    }
    g.rotation.y = angle;
  }
  function curtain(x: number, base: number, z: number, width: number, angle = 0) {
    const group = new T.Group();
    group.position.set(x, base, z);
    group.rotation.y = angle;
    world.add(group);
    function localBox(
      px: number,
      py: number,
      pz: number,
      w: number,
      h: number,
      d: number,
      m: T.Material,
    ) {
      const o = box(px, py, pz, w, h, d, m);
      world.remove(o);
      group.add(o);
      return o;
    }
    localBox(0, 2.66, 0.12, width + 0.38, 0.045, 0.045, M.dark);
    for (const side of [-1, 1]) {
      const geo = new T.PlaneGeometry(0.33, 1.62, 12, 12);
      const attr = geo.getAttribute('position');
      for (let i = 0; i < attr.count; i++) {
        const yy = attr.getY(i);
        attr.setZ(i, Math.sin(attr.getX(i) * 70) * 0.032);
        attr.setX(i, attr.getX(i) * (1 - 0.35 * Math.exp(-(((yy + 0.15) * 3) ** 2))));
      }
      geo.computeVertexNormals();
      const material = M.linen.clone();
      material.side = T.DoubleSide;
      const o = new T.Mesh(geo, material);
      o.position.set(side * (width / 2 + 0.04), 1.79, 0.16);
      o.castShadow = true;
      group.add(o);
      localBox(side * (width / 2 + 0.04), 1.6, 0.18, 0.25, 0.045, 0.06, M.rust);
    }
  }
  function windowAt(x: number, y: number, z: number, width: number, angle = 0) {
    const g = new T.Group();
    g.position.set(x, y, z);
    g.rotation.y = angle;
    world.add(g);
    function piece(
      px: number,
      py: number,
      pz: number,
      w: number,
      h: number,
      d: number,
      m: T.Material = M.dark,
    ) {
      const o = box(px, py, pz, w, h, d, m);
      world.remove(o);
      g.add(o);
      return o;
    }
    piece(0, 1.9, 0, width, 1.45, 0.025, M.glass);
    for (const side of [-1, 1]) piece((side * width) / 2, 1.9, 0, 0.08, 1.6, 0.15);
    piece(0, 1.12, 0.02, width + 0.26, 0.12, 0.33, M.oak);
    piece(0, 2.68, 0, width + 0.16, 0.1, 0.13);
    piece(0, 1.9, 0.02, 0.045, 1.5, 0.06);
    piece(0, 1.9, 0.03, width, 0.045, 0.06);
    curtain(x, y, z, width, angle);
  }
  // Shell with REAL window apertures, not bright rectangles on solid walls.
  for (const y of [0, 3.4])
    for (const side of [-1, 1]) {
      const z = side * 4;
      const centers = side === 1 ? [-3, 3] : y === 0 ? [0, 3] : [-3, 0, 3];
      const intervals = centers.map((c) => [c - 0.66, c + 0.66]);
      let edge = -5;
      for (const [a, b] of intervals) {
        box((edge + a) / 2, y + 1.7, z, a - edge, 3.4, 0.18, M.plaster);
        box((a + b) / 2, y + 0.53, z, b - a, 1.06, 0.18, M.plaster);
        box((a + b) / 2, y + 3.045, z, b - a, 0.71, 0.18, M.plaster);
        windowAt((a + b) / 2, y, z - side * 0.1, b - a, side === 1 ? Math.PI : 0);
        edge = b;
      }
      box((edge + 5) / 2, y + 1.7, z, 5 - edge, 3.4, 0.18, M.plaster);
    }
  for (const y of [0, 3.4])
    for (const side of [-1, 1]) {
      const x = side * 5;
      const intervals = [
        [-2.8, -1.5],
        [1.0, 2.3],
      ];
      let edge = -4;
      for (const [a, b] of intervals) {
        box(x, y + 1.7, (edge + a) / 2, 0.18, 3.4, a - edge, M.plaster);
        box(x, y + 0.53, (a + b) / 2, 0.18, 1.06, b - a, M.plaster);
        box(x, y + 3.045, (a + b) / 2, 0.18, 0.71, b - a, M.plaster);
        windowAt(x - side * 0.1, y, (a + b) / 2, b - a, side === 1 ? -Math.PI / 2 : Math.PI / 2);
        edge = b;
      }
      box(x, y + 1.7, (edge + 4) / 2, 0.18, 3.4, 4 - edge, M.plaster);
    }
  // Lower floor and upper deck with a genuine 1.65 × 4.62 m stair void.
  box(0, -0.1, 0, 10, 0.2, 8, M.floor, false);
  box(-1.1, 3.31, 0, 7.8, 0.18, 8, M.floor, false);
  box(4.75, 3.31, 0, 0.5, 0.18, 8, M.floor, false);
  box(3.65, 3.31, -2.56, 1.7, 0.18, 2.88, M.floor, false);
  box(3.65, 3.31, 3.75, 1.7, 0.18, 0.5, M.floor, false);
  // Exposed framing, baseboards and ceiling joists.
  for (const y of [0.15, 3.25, 3.55, 6.68]) {
    box(0, y, -3.86, 10, 0.17, 0.14, M.dark);
    box(0, y, 3.86, 10, 0.17, 0.14, M.dark);
    box(-4.86, y, 0, 0.14, 0.17, 8, M.dark);
    box(4.86, y, 0, 0.14, 0.17, 8, M.dark);
  }
  for (const x of [-4.85, -1.5, 1.5, 4.85])
    for (const z of [-3.85, 3.85]) box(x, 3.4, z, 0.19, 6.8, 0.19, M.dark);
  for (const z of [-3.5, -1.6, 0.4, 2.5]) box(-1.05, 3.16, z, 7.7, 0.22, 0.17, M.dark);
  box(0.2, 1.58, 0.7, 0.18, 3.16, 0.18, M.dark);
  block(0.2, 0.7, 0.18, 0.18);
  for (const side of [-1, 1]) {
    const roof = box(side * 2.5, 7.75, 0, 5.4, 0.2, 8.35, M.dark);
    roof.rotation.z = -side * Math.atan(0.38);
    for (const z of [-3.75, -1.8, 0.2, 2.2, 3.75])
      beam(new T.Vector3(side * 4.9, 6.8, z), new T.Vector3(0, 8.66, z), 0.15, M.oak);
  }
  box(0, 8.65, 0, 0.25, 0.25, 8.2, M.dark);
  for (const z of [-4, 4]) {
    const shape = new T.Shape();
    shape.moveTo(-5, 6.8);
    shape.lineTo(5, 6.8);
    shape.lineTo(0, 8.7);
    shape.closePath();
    const material = M.plaster.clone();
    material.side = T.DoubleSide;
    mesh(new T.ShapeGeometry(shape), material, 0, 0, z);
  }
  // Entry door, coat pegs, basket, boots and hall runner.
  box(0, 1.18, 3.84, 1.12, 2.36, 0.12, M.edge);
  for (const x of [-0.58, 0.58]) box(x, 1.25, 3.73, 0.1, 2.5, 0.13, M.dark);
  box(0, 2.48, 3.73, 1.25, 0.1, 0.13, M.dark);
  for (let i = 0; i < 6; i++) box(-0.46 + i * 0.185, 1.18, 3.765, 0.012, 2.3, 0.015, M.dark, false);
  ball(-0.37, 1.05, 3.67, 0.045, 0.045, 0.045, M.gold);
  box(1.1, 1.55, 3.78, 0.8, 0.1, 0.09, M.dark);
  for (const x of [0.83, 1.1, 1.37])
    beam(new T.Vector3(x, 1.55, 3.72), new T.Vector3(x, 1.59, 3.58), 0.035, M.dark);
  const coat = box(0.86, 1.02, 3.58, 0.3, 0.7, 0.1, M.sage);
  coat.rotation.z = 0.1;
  rug(0.25, 2.75, 1.25, 1.5);
  vase(1.65, 0, 3.35, 0.27, M.oak);
  for (const x of [0.85, 1.12]) {
    box(x, 0.13, 3.38, 0.18, 0.24, 0.3, M.dark);
    ball(x, 0.08, 3.22, 0.1, 0.08, 0.18, M.dark);
  }
  // Stairs: 17 visible treads, handrails and upper landing balusters.
  for (let i = 0; i < 17; i++) {
    const h = (i + 1) * 0.2,
      z = 3.3 - (i + 0.5) * 0.26;
    box(3.65, h / 2, z, 1.3, h, 0.26, M.edge);
    box(3.65, h + 0.025, z + 0.012, 1.38, 0.05, 0.285, M.oak);
    if (i % 3 === 0) for (const x of [2.95, 4.35]) box(x, h + 0.48, z, 0.065, 0.96, 0.065, M.dark);
  }
  for (const x of [2.95, 4.35])
    beam(new T.Vector3(x, 0.95, 3.28), new T.Vector3(x, 4.35, -1.12), 0.09, M.dark);
  for (let i = 0; i < 14; i++) box(2.85, 3.92, -0.95 + i * 0.33, 0.06, 1.03, 0.06, M.dark);
  box(2.85, 4.47, 1.15, 0.1, 0.1, 4.45, M.oak);
  block(2.85, 1.25, 0.1, 4.15, 1);
  // Stone hearth with irregular coursing, chimney and mantel.
  box(-3.05, 0.12, -3.4, 2.2, 0.24, 0.95, M.stone);
  box(-3.05, 1.15, -3.62, 1.9, 2.1, 0.5, M.mortar);
  box(-3.05, 0.62, -3.3, 1.03, 1.05, 0.08, M.iron);
  for (let row = 0; row < 5; row++)
    for (let col = 0; col < 5; col++) {
      if (row < 3 && col > 0 && col < 4) continue;
      box(
        -3.81 + col * 0.38 + (row % 2) * 0.02,
        0.35 + row * 0.36,
        -3.26,
        0.35,
        0.33,
        0.23,
        row % 2 ? M.stone : M.mortar,
      );
    }
  box(-3.05, 2.06, -3.35, 2.08, 0.15, 0.65, M.dark);
  box(-3.05, 2.65, -3.64, 1.23, 1.16, 0.45, M.plaster);
  block(-3.05, -3.4, 2.2, 1.0);
  picture(-3.05, 2.64, -3.37, 0.71, 0.5);
  vase(-3.73, 2.14, -3.28, 0.14);
  plant(-2.32, 2.14, -3.31, 0.15);
  for (let i = 0; i < 4; i++) {
    const log = cyl(-3.33 + i * 0.17, 0.29, -3.12, 0.07, 0.53, M.dark);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = i * 0.5;
  }
  const flameShape = new T.Shape();
  flameShape.moveTo(0, 0);
  flameShape.bezierCurveTo(-0.18, 0.1, -0.12, 0.26, -0.025, 0.48);
  flameShape.bezierCurveTo(0.12, 0.32, 0.015, 0.24, 0.1, 0.17);
  flameShape.bezierCurveTo(0.19, 0.05, 0.1, -0.015, 0, 0);
  const flameGeometry = new T.ShapeGeometry(flameShape, 12);
  const orangeFlame = new T.MeshBasicMaterial({
    color: '#eb852b',
    side: T.DoubleSide,
    toneMapped: false,
  });
  const innerFlame = new T.MeshBasicMaterial({
    color: '#ffd08a',
    side: T.DoubleSide,
    toneMapped: false,
  });
  for (let i = 0; i < 5; i++) {
    mesh(
      flameGeometry,
      orangeFlame,
      -3.38 + i * 0.16,
      0.31,
      -3.16,
      0.62,
      0.65 + (i % 3) * 0.14,
      1,
      false,
    );
    mesh(
      flameGeometry,
      innerFlame,
      -3.38 + i * 0.16,
      0.31,
      -3.15,
      0.3,
      0.42 + (i % 3) * 0.1,
      1,
      false,
    );
  }
  const fire = new T.PointLight('#ffa14e', 3.2, 5, 2);
  fire.position.set(-3.05, 0.8, -2.9);
  scene.add(fire);
  // Family seating: wooden settle, woven rug, low table, armchair.
  rug(-2.9, -0.92, 3.15, 2.6);
  function settle(x: number, z: number) {
    shadow(x, z, 2.7, 1.3);
    box(x, 0.31, z, 2.45, 0.18, 0.77, M.dark);
    box(x, 0.48, z, 2.28, 0.22, 0.7, M.linen);
    box(x, 0.89, z + 0.33, 2.45, 0.96, 0.12, M.edge);
    for (const side of [-1, 1]) {
      box(x + side * 1.22, 0.7, z, 0.12, 0.55, 0.9, M.dark);
      box(x + side * 1.08, 0.73, z + 0.18, 0.37, 0.43, 0.16, side < 0 ? M.rust : M.sage);
    }
    for (const dx of [-1.02, 1.02])
      for (const dz of [-0.26, 0.26]) box(x + dx, 0.14, z + dz, 0.09, 0.28, 0.09, M.dark);
    block(x, z, 2.6, 0.95);
  }
  settle(-3.05, 0.45);
  function table(x: number, z: number, w: number, d: number, h: number, y = 0) {
    shadow(x, z, w + 0.6, d + 0.5, y);
    box(x, y + h, z, w, 0.1, d, M.oak);
    for (const dx of [-1, 1])
      for (const dz of [-1, 1])
        box(x + dx * (w / 2 - 0.12), y + h / 2, z + dz * (d / 2 - 0.12), 0.095, h, 0.095, M.dark);
    box(x, y + h * 0.45, z, w - 0.24, 0.06, d - 0.2, M.edge);
  }
  table(-3.05, -1.1, 1.5, 0.72, 0.47);
  block(-3.05, -1.1, 1.5, 0.75);
  box(-3.4, 0.55, -1.15, 0.38, 0.06, 0.25, M.sage);
  box(-3.38, 0.59, -1.14, 0.33, 0.025, 0.24, M.cream);
  function cup(x: number, y: number, z: number, scale = 0.065) {
    vase(x, y, z, scale, M.pottery);
    const handle = mesh(
      new T.TorusGeometry(scale * 0.45, scale * 0.13, 6, 12),
      M.pottery,
      x + scale * 0.75,
      y + scale * 0.7,
      z,
    );
    handle.rotation.y = Math.PI / 2;
  }
  cup(-2.8, 0.54, -1.05);
  vase(-3.0, 0.54, -1.08, 0.075, M.clay);
  shelf(-4.4, 0, -0.78, 0.6, 1.65);
  plant(-4.38, 1.73, -0.78, 0.18);
  block(-4.4, -0.78, 0.65, 0.4);
  table(-4.25, 2.22, 0.75, 0.55, 0.65);
  plant(-4.25, 0.71, 2.22, 0.24);
  block(-4.25, 2.22, 0.8, 0.6);
  picture(-4.86, 2.02, 0.1, 0.9, 0.65, Math.PI / 2);
  // Kitchen dresser, cabinets, stone wash basin and four-place dining table.
  for (const x of [0.9, 1.7, 2.5, 3.3]) {
    box(x, 0.44, -3.52, 0.76, 0.88, 0.66, M.edge);
    box(x, 0.92, -3.51, 0.8, 0.1, 0.72, M.oak);
    box(x, 0.45, -3.17, 0.66, 0.67, 0.035, M.wood);
    box(x, 0.76, -3.13, 0.32, 0.035, 0.04, M.dark);
    block(x, -3.52, 0.8, 0.72);
  }
  box(3.18, 0.99, -3.49, 0.6, 0.08, 0.45, M.stone);
  box(3.18, 1.02, -3.49, 0.42, 0.06, 0.29, M.iron);
  beam(new T.Vector3(3.32, 1, -3.74), new T.Vector3(3.32, 1.38, -3.74), 0.04, M.iron);
  beam(new T.Vector3(3.32, 1.38, -3.74), new T.Vector3(3.32, 1.38, -3.53), 0.04, M.iron);
  for (const y of [1.65, 2.26]) {
    box(1.5, y, -3.72, 2.2, 0.09, 0.4, M.oak);
    for (let i = 0; i < 5; i++)
      vase(0.65 + i * 0.39, y + 0.05, -3.69, 0.1 + (i % 2) * 0.025, i % 2 ? M.pottery : M.clay);
    for (const x of [0.6, 2.4])
      beam(new T.Vector3(x, y - 0.25, -3.85), new T.Vector3(x, y, -3.5), 0.04, M.dark);
  }
  box(1.1, 0.995, -3.5, 0.48, 0.035, 0.35, M.dark);
  for (let i = 0; i < 3; i++) {
    const bread = ball(0.98 + i * 0.11, 1.07, -3.5, 0.12, 0.07, 0.08, M.bread);
    bread.rotation.y = 0.2;
  }
  plant(4.24, 0, -3.32, 0.32);
  vase(4.14, 0, -2.63, 0.33, M.oak);
  block(4.15, -2.65, 0.55, 0.55);
  table(1.35, -1.34, 1.85, 1.12, 0.79);
  block(1.35, -1.34, 1.9, 1.15);
  box(1.35, 0.85, -1.34, 0.47, 0.018, 1.1, M.linen, false);
  vase(1.35, 0.86, -1.34, 0.1, M.pottery);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const f = ball(
      1.35 + Math.cos(a) * 0.1,
      1.13,
      -1.34 + Math.sin(a) * 0.1,
      0.08,
      0.055,
      0.08,
      M.cream,
    );
    f.castShadow = false;
  }
  function chair(x: number, z: number, y = 0, angle = 0, material: T.Material = M.sage) {
    const g = new T.Group();
    world.add(g);
    g.position.set(x, y, z);
    g.rotation.y = angle;
    const parts: T.Mesh[] = [];
    function b(
      px: number,
      py: number,
      pz: number,
      w: number,
      h: number,
      d: number,
      m: T.Material = M.dark,
    ) {
      const o = box(px, py, pz, w, h, d, m);
      world.remove(o);
      g.add(o);
      parts.push(o);
    }
    b(0, 0.47, 0, 0.48, 0.09, 0.48, M.oak);
    b(0, 0.54, 0, 0.42, 0.07, 0.42, material);
    for (const dx of [-0.18, 0.18])
      for (const dz of [-0.18, 0.18]) b(dx, 0.23, dz, 0.055, 0.46, 0.055);
    for (const dx of [-0.2, 0.2]) b(dx, 0.84, 0.21, 0.055, 0.7, 0.055);
    b(0, 1.08, 0.21, 0.46, 0.1, 0.07, M.oak);
    b(0, 0.85, 0.21, 0.44, 0.16, 0.05, M.edge);
    shadow(x, z, 0.9, 0.9, y);
    block(x, z, 0.5, 0.55, y > 1 ? 1 : 0);
  }
  for (const x of [0.82, 1.88])
    for (const side of [-1, 1]) {
      chair(x, -1.34 + side * 0.95, 0, side < 0 ? Math.PI : 0);
      const plate = cyl(x, 0.854, -1.34 + side * 0.33, 0.17, 0.015, M.linen);
      plate.castShadow = false;
      cup(x + 0.24, 0.85, -1.34 + side * 0.37, 0.045);
    }
  const pendant = new T.Mesh(new T.ConeGeometry(0.33, 0.18, 24, 1, true), M.clay);
  pendant.position.set(1.35, 2.68, -1.34);
  world.add(pendant);
  beam(new T.Vector3(1.35, 2.78, -1.34), new T.Vector3(1.35, 3.12, -1.34), 0.025, M.iron);
  ball(1.35, 2.62, -1.34, 0.065, 0.065, 0.065, M.glow);
  const lamp = new T.PointLight('#ffe2ab', 4.0, 7, 2);
  lamp.position.set(1.35, 2.48, -1.34);
  scene.add(lamp);
  // Upstairs room partitions with open 1.1 m doorways.
  function partition(z: number, length: number) {
    box(0.25, 4.87, z, 0.14, 2.94, length, M.plaster);
    box(0.14, 3.53, z, 0.08, 0.16, length, M.dark);
    block(0.25, z, 0.18, length, 1);
  }
  partition(-3.15, 1.7);
  partition(0.05, 2.5);
  partition(3.3, 1.4);
  for (const z of [-1.75, 1.92]) {
    box(0.25, 6.38, z, 0.19, 0.1, 1.15, M.dark);
    for (const side of [-1, 1]) box(0.25, 4.86, z + side * 0.57, 0.19, 2.96, 0.08, M.dark);
  }
  box(-2.35, 4.87, 0.25, 5.1, 2.94, 0.14, M.plaster);
  box(-2.35, 3.53, 0.14, 5.1, 0.16, 0.08, M.dark);
  block(-2.35, 0.25, 5.1, 0.18, 1);
  // Parents' bedroom.
  function bed(x: number, z: number, w: number, d: number, y: number, cloth: T.Material) {
    shadow(x, z, w + 0.7, d + 0.7, y);
    box(x, y + 0.33, z, w, 0.36, d, M.dark);
    box(x, y + 0.57, z, w - 0.05, 0.25, d - 0.05, M.linen);
    box(x, y + 0.73, z - 0.06, w - 0.13, 0.1, d - 1.0, cloth);
    box(x, y + 0.62, z + 0.46, w - 0.13, 0.2, 0.22, cloth);
    if (w > 1.4)
      for (const side of [-1, 1])
        box(x + side * w * 0.24, y + 0.7, z - d / 2 + 0.4, w * 0.42, 0.19, 0.43, M.cream);
    else box(x, y + 0.7, z - d / 2 + 0.4, w - 0.25, 0.19, 0.42, M.cream);
    box(x, y + 0.75, z - d / 2, w + 0.08, 1.05, 0.14, M.edge);
    for (const dx of [-1, 1])
      for (const dz of [-1, 1])
        box(x + dx * (w / 2 - 0.1), y + 0.12, z + dz * (d / 2 - 0.12), 0.1, 0.24, 0.1, M.dark);
    block(x, z, w + 0.1, d + 0.12, 1);
  }
  bed(-3.0, 2.0, 1.8, 2.1, 3.4, M.sage);
  rug(-2.85, 2.0, 3.4, 3.1, 3.4);
  table(-4.25, 1.2, 0.5, 0.5, 0.63, 3.4);
  vase(-4.25, 4.1, 1.2, 0.13, M.pottery);
  box(-1.1, 4.35, 3.45, 1.0, 1.9, 0.65, M.edge);
  for (const x of [-1.35, -0.85]) box(x, 4.35, 3.11, 0.46, 1.72, 0.035, M.wood);
  for (const x of [-1.16, -1.04]) ball(x, 4.3, 3.07, 0.025, 0.035, 0.025, M.gold);
  block(-1.1, 3.45, 1.05, 0.7, 1);
  box(-3.0, 3.65, 3.45, 1.45, 0.45, 0.5, M.dark);
  box(-3.0, 3.9, 3.45, 1.5, 0.08, 0.54, M.oak);
  box(-3.0, 3.95, 3.46, 1.0, 0.06, 0.48, M.linen);
  block(-3.0, 3.45, 1.5, 0.55, 1);
  picture(-3.0, 5.1, 0.35, 1.0, 0.68);
  plant(-4.28, 3.4, 3.27, 0.22);
  // Children's shared room: individual beds, toys and a writing desk.
  bed(-4.0, -2.55, 1.12, 2.0, 3.4, M.blue);
  bed(-2.4, -2.55, 1.12, 2.0, 3.4, M.rust);
  rug(-3.1, -0.55, 2.5, 1.1, 3.4);
  table(-1.0, -3.3, 1.45, 0.6, 0.72, 3.4);
  chair(-1.02, -2.55, 3.4, Math.PI, M.blue);
  block(-1, -3.3, 1.5, 0.65, 1);
  box(-1.25, 4.18, -3.3, 0.3, 0.025, 0.25, M.linen);
  beam(new T.Vector3(-1.3, 4.21, -3.35), new T.Vector3(-1.12, 4.21, -3.23), 0.016, M.dark);
  cup(-0.65, 4.17, -3.35, 0.05);
  for (let i = 0; i < 5; i++)
    book(-1.6 + i * 0.09, 4.17, -3.5, 0.2 + (i % 2) * 0.03, [M.sage, M.rust, M.cream][i % 3]);
  box(-4.25, 3.66, -0.5, 0.9, 0.5, 0.5, M.oak);
  box(-4.25, 3.93, -0.5, 0.96, 0.06, 0.56, M.edge);
  block(-4.25, -0.5, 0.95, 0.6, 1);
  for (let i = 0; i < 4; i++)
    box(
      -2.7 + i * 0.2,
      3.49,
      -0.55 + (i % 2) * 0.16,
      0.14,
      0.17,
      0.14,
      [M.rust, M.sage, M.blue, M.oak][i],
    );
  // Toy horse, landscape pictures and family reading nook.
  box(-1.9, 3.64, -0.4, 0.32, 0.15, 0.14, M.oak);
  for (const dx of [-0.12, 0.12])
    for (const dz of [-0.05, 0.05]) box(-1.9 + dx, 3.51, -0.4 + dz, 0.035, 0.15, 0.035, M.dark);
  box(-1.74, 3.78, -0.4, 0.09, 0.24, 0.1, M.oak);
  picture(-3.1, 5.07, 0.15, 0.86, 0.56, Math.PI);
  shelf(1.5, 3.4, -3.64, 1.55, 1.85);
  block(1.5, -3.64, 1.6, 0.4, 1);
  chair(1.15, -2.25, 3.4, 0.2, M.sage);
  rug(1.35, -2.17, 2.0, 1.8, 3.4);
  table(2.18, -2.6, 0.53, 0.53, 0.63, 3.4);
  cup(2.18, 4.1, -2.6, 0.055);
  block(2.18, -2.6, 0.55, 0.55, 1);
  plant(2.27, 3.4, -3.36, 0.24);
  picture(4.85, 5.25, -2.3, 0.8, 0.6, -Math.PI / 2);
  // Soft afternoon garden glimpses through every window.
  const grass = new T.MeshStandardMaterial({ color: '#87916a', roughness: 1 });
  box(0, -0.24, 0, 120, 0.1, 120, grass, false);
  for (let i = 0; i < 26; i++) {
    const angle = i * 2.399,
      radius = 10 + (i % 5) * 3.1,
      x = Math.cos(angle) * radius,
      z = Math.sin(angle) * radius;
    cyl(x, 1.1, z, 0.17, 2.2, M.dark);
    ball(x, 2.9, z, 1.4, 1.9, 1.3, i % 2 ? M.leaf : M.leafLight);
  }
  const hill = new T.MeshStandardMaterial({ color: '#9faa86', roughness: 1 });
  for (let i = 0; i < 8; i++) ball(Math.cos(i) * 40, -1.8, Math.sin(i) * 40, 17, 8, 13, hill);
  // Batch static geometry by material/shadow state: dozens, not hundreds of draw calls.
  world.updateMatrixWorld(true);
  const batches = new Map<
    string,
    { material: T.Material; cast: boolean; geometries: T.BufferGeometry[] }
  >();
  world.traverse((o) => {
    if (!(o instanceof T.Mesh) || Array.isArray(o.material)) return;
    const key = o.material.uuid + String(o.castShadow);
    let batch = batches.get(key);
    if (!batch) {
      batch = { material: o.material, cast: o.castShadow, geometries: [] };
      batches.set(key, batch);
    }
    const geo = o.geometry.clone().applyMatrix4(o.matrixWorld);
    if (geo.index) {
      batch.geometries.push(geo.toNonIndexed());
      geo.dispose();
    } else batch.geometries.push(geo);
  });
  scene.remove(world);
  const staticHouse = new T.Group();
  scene.add(staticHouse);
  for (const batch of batches.values()) {
    const geo = mergeGeometries(batch.geometries, false);
    if (!geo) throw new Error('House geometry batching failed');
    const o = new T.Mesh(geo, batch.material);
    o.castShadow = batch.cast;
    o.receiveShadow = true;
    staticHouse.add(o);
    batch.geometries.forEach((g) => g.dispose());
  }
  // Keep the small animated fire separate from the static batch.
  const ember = new T.Mesh(flameGeometry, innerFlame);
  ember.position.set(-3.05, 0.31, -3.12);
  ember.scale.set(0.5, 1, 1);
  scene.add(ember);
  return {
    fire,
    ember,
    meshCount: staticHouse.children.length,
    dispose: () => {
      staticHouse.traverse((o) => {
        if (o instanceof T.Mesh) o.geometry.dispose();
      });
    },
  };
}
