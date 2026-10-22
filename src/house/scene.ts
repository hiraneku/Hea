import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { M } from './materials';
import { boundBook, openJournal, BOOK_TITLES, disposeBookAssets, type HouseBook } from './books';
import { windowAtmosphere } from './windowAtmosphere';
import { buildVault } from './vault';
import { hearthFire } from './hearthFire';
import { HOUSE, LIVING, RUG, obstacles } from './layout';

/** Reference layout, reinterpreted as a village home. No speculative extra rooms. */
export function buildHouse(scene: T.Scene) {
  const world = new T.Group();
  const interactiveBooks = new T.Group();
  const bookHitMaterial = new T.MeshBasicMaterial({
    colorWrite: false,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: T.DoubleSide,
  });
  const books: HouseBook[] = [];
  const unit = new T.BoxGeometry(1, 1, 1),
    soft = new RoundedBoxGeometry(1, 1, 1, 3, 0.065);
  const cylinder = new T.CylinderGeometry(1, 1, 1, 20),
    sphere = new T.SphereGeometry(1, 14, 10);
  const owned: T.Material[] = [];
  const material = (color: string) => {
    const m = new T.MeshStandardMaterial({ color, roughness: 0.94 });
    owned.push(m);
    return m;
  };
  const grey = material('#908b7d'),
    brown = material('#66533b'),
    black = material('#211d18');
  const cameraGeometry = new T.Group(),
    cameraMaterial = new T.MeshBasicMaterial({ side: T.DoubleSide });
  function mesh(
    g: T.BufferGeometry,
    m: T.Material,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    cast = true,
    parent: T.Object3D = world,
  ) {
    const o = new T.Mesh(g, m);
    o.position.set(x, y, z);
    o.scale.set(w, h, d);
    o.castShadow = cast;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  function box(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    m: T.Material = M.wood,
    rounded = false,
    parent: T.Object3D = world,
  ) {
    return mesh(rounded ? soft : unit, m, x, y, z, w, h, d, true, parent);
  }
  function cyl(
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    m: T.Material = M.dark,
    parent: T.Object3D = world,
  ) {
    return mesh(cylinder, m, x, y, z, r, h, r, true, parent);
  }
  function beam(
    a: T.Vector3,
    b: T.Vector3,
    w: number,
    m: T.Material = M.dark,
    parent: T.Object3D = world,
  ) {
    const o = box(
      (a.x + b.x) / 2,
      (a.y + b.y) / 2,
      (a.z + b.z) / 2,
      w,
      a.distanceTo(b),
      w,
      m,
      false,
      parent,
    );
    o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    return o;
  }
  function registerBook(book: T.Group, id: string, title: string, w: number, h: number, d: number) {
    interactiveBooks.add(book);
    book.updateMatrixWorld(true);
    book.traverse((child) => {
      if (child instanceof T.Mesh) {
        const geometry = child.geometry.clone().applyMatrix4(child.matrixWorld);
        const visual = new T.Mesh(geometry, child.material);
        visual.castShadow = child.castShadow;
        visual.receiveShadow = true;
        world.add(visual);
      }
    });
    for (const child of [...book.children])
      if (child instanceof T.Mesh) {
        book.remove(child);
        child.geometry.dispose();
      }
    const hit = new T.Mesh(new T.BoxGeometry(w, h, d), bookHitMaterial);
    hit.name = 'book-pickup-hitbox';
    hit.userData = { bookId: id, title };
    book.add(hit);
    books.push({ id, title, position: book.position.clone(), object: book });
  }
  const proxy = (x: number, y: number, z: number, w: number, h: number, d: number) =>
    mesh(unit, cameraMaterial, x, y, z, w, h, d, false, cameraGeometry);
  function wall(x: number, z: number, w: number, d: number, h = 3.25) {
    box(x, h / 2, z, w, h, d, M.plaster);
    proxy(x, h / 2, z, w, h, d);
  }
  const W = HOUSE.width / 2,
    D = HOUSE.depth / 2;
  // Finished internal dimensions, outside faces of shell are beyond the playable bounds.
  box(0, -0.09, 0, HOUSE.width + 0.3, 0.18, HOUSE.depth + 0.3, M.floor);
  proxy(0, -0.1, 0, HOUSE.width, 0.2, HOUSE.depth);
  const vault = buildVault(world, cameraGeometry, cameraMaterial);
  // Real arched opening: side piers and the curved spandrel, not a door on a solid wall.
  wall((-W - 3.5) / 2, -D - 0.09, W - 3.5, 0.18);
  wall((-2.2 + W) / 2, -D - 0.09, W + 2.2, 0.18);
  const spandrel = new T.Shape();
  spandrel.moveTo(-0.65, 3.25);
  spandrel.lineTo(0.65, 3.25);
  spandrel.lineTo(0.65, 1.76);
  spandrel.absarc(0, 1.76, 0.65, 0, Math.PI, false);
  spandrel.closePath();
  const archTop = new T.Mesh(
    new T.ExtrudeGeometry(spandrel, { depth: 0.18, bevelEnabled: false, curveSegments: 20 }),
    M.plaster,
  );
  archTop.position.set(-2.85, 0, -D - 0.18);
  world.add(archTop);
  const archProxy = archTop.clone();
  cameraGeometry.add(archProxy);
  box(-2.85, -0.09, -5.25, 1.3, 0.18, 2.2, M.floor);
  proxy(-2.85, -0.1, -5.25, 1.3, 0.2, 2.2);
  for (const x of [-3.59, -2.11]) {
    wall(x, -5.25, 0.18, 2.2, 2.7);
  }
  wall(-2.85, -6.44, 1.66, 0.18, 2.7);
  box(-2.85, 2.78, -5.25, 1.66, 0.16, 2.2, M.plaster);
  proxy(-2.85, 2.78, -5.25, 1.66, 0.16, 2.2);
  wall(W + 0.09, 0, 0.18, HOUSE.depth);
  // Entrance opening in south wall. Closed porch view keeps this first stage self-contained.
  wall((-W - 0.62) / 2, D + 0.09, W - 0.62, 0.18);
  wall((W + 0.62) / 2, D + 0.09, W - 0.62, 0.18);
  box(0, 2.87, D + 0.09, 1.24, 0.76, 0.18, M.plaster);
  proxy(0, 2.87, D + 0.09, 1.24, 0.76, 0.18);
  for (const x of [-0.65, 0.65]) box(x, 1.22, D, 0.12, 2.44, 0.24, M.oak);
  box(0, 2.47, D, 1.42, 0.14, 0.24, M.oak);
  const door = new T.Group();
  door.position.set(-0.59, 0, D);
  door.rotation.y = 1.17;
  world.add(door);
  box(0.57, 1.17, 0, 1.14, 2.34, 0.065, M.dark, false, door);
  // Recessed panels on both faces, iron strap hinges and a horizontal latch.
  for (const side of [-1, 1]) {
    for (const y of [0.65, 1.75]) box(0.57, y, side * 0.041, 0.86, 0.77, 0.025, M.oak, false, door);
    for (const y of [0.32, 2.02])
      box(0.2, y, side * 0.045, 0.36, 0.065, 0.025, M.iron, false, door);
    box(1.0, 1.13, side * 0.07, 0.14, 0.035, 0.05, M.iron, false, door);
  }
  // Porch is open daylight, not the opaque panel that previously obscured the entry.
  box(0, -0.08, D + 0.65, 1.6, 0.16, 1.3, M.stone);
  box(0, 0.016, 3.18, 1.25, 0.024, 0.74, brown);
  const doorProxy = door.clone();
  doorProxy.traverse((o) => {
    if (o instanceof T.Mesh) o.material = cameraMaterial;
  });
  cameraGeometry.add(doorProxy);
  proxy(0, 1.25, D, 1.3, 2.5, 0.08);
  // West window: genuine aperture with wood mullions, linen curtains, garden outside.
  wall(-W - 0.09, (-D - 0.4) / 2, 0.18, D - 0.4);
  wall(-W - 0.09, (D + 1.7) / 2, 0.18, D - 1.7);
  box(-W - 0.09, 0.48, 0.65, 0.18, 0.96, 2.1, M.plaster);
  box(-W - 0.09, 2.99, 0.65, 0.18, 0.52, 2.1, M.plaster);
  proxy(-W - 0.09, 0.48, 0.65, 0.18, 0.96, 2.1);
  proxy(-W - 0.09, 2.99, 0.65, 0.18, 0.52, 2.1);
  for (const z of [-0.43, 1.73]) box(-W, 1.86, z, 0.2, 1.86, 0.09, M.oak);
  for (const y of [1.0, 2.77]) box(-W, y, 0.65, 0.25, 0.1, 2.27, M.oak);
  box(-W + 0.03, 1.88, 0.65, 0.07, 1.74, 0.055, M.dark);
  box(-W + 0.03, 1.88, 0.65, 0.07, 0.055, 2.1, M.dark);
  mesh(unit, M.glass, -W, 1.88, 0.65, 0.022, 1.7, 2.1, false);
  box(-W + 0.08, 0.96, 0.65, 0.42, 0.12, 2.4, M.oak);
  for (const z of [-0.6, 1.9]) {
    box(-W + 0.12, 2.84, z, 0.12, 0.06, 0.46, M.dark);
    for (let i = 0; i < 7; i++)
      box(
        -W + 0.17 + Math.sin(i * 2) * 0.025,
        1.96,
        z + (i - 3) * 0.047,
        0.04,
        1.6,
        0.062,
        M.linen,
        true,
      );
  }
  // Village timber details, restrained to preserve the reference's open white walls.
  for (const x of [-W + 0.05, W - 0.05])
    for (const z of [-D + 0.05, D - 0.05]) box(x, 1.63, z, 0.14, 3.26, 0.14, M.dark);
  for (const z of [-D + 0.05, D - 0.05]) box(0, 3.21, z, HOUSE.width, 0.18, 0.19, M.dark);
  for (const z of [-D + 0.01, D - 0.01]) box(0, 0.1, z, HOUSE.width, 0.2, 0.06, M.wood);
  for (const x of [-W + 0.01, W - 0.01]) box(x, 0.1, 0, 0.06, 0.2, HOUSE.depth, M.wood);
  // Open timber arch to the connecting hall: no leaf, handle or board behind it.
  for (const x of [-3.55, -2.15]) box(x, 0.88, -D + 0.04, 0.1, 1.76, 0.18, M.dark);
  const arc = new T.TorusGeometry(0.7, 0.05, 6, 32, Math.PI);
  const rim = new T.Mesh(arc, M.dark);
  rim.position.set(-2.85, 1.76, -D + 0.04);
  world.add(rim);
  // Plain brown woven rug: reference size and position, not the old central patterned rug.
  box(RUG.x, 0.015, RUG.z, RUG.w, 0.025, RUG.d, M.rug);
  for (let i = 0; i < 42; i++)
    for (const side of [-1, 1])
      box(
        RUG.x - RUG.w / 2 + (i * RUG.w) / 41,
        0.023,
        RUG.z + side * (RUG.d / 2 + 0.035),
        0.012,
        0.008,
        0.07,
        M.linen,
      );
  // Craftsman's settle: exposed oak rails/slats, restrained loose linen cushions.
  const s = LIVING.sofa;
  for (const x of [s.x - 1.03, s.x + 1.03])
    for (const z of [s.z - 0.29, s.z + 0.29]) {
      cyl(x, 0.25, z, 0.055, 0.5, M.dark);
      cyl(x, 0.52, z, 0.07, 0.08, M.oak);
    }
  box(s.x, 0.35, s.z, 2.23, 0.12, 0.73, M.dark);
  box(s.x, 0.22, s.z + 0.29, 2.1, 0.08, 0.06, M.oak);
  box(s.x, 1.12, s.z - 0.32, 2.3, 0.11, 0.1, M.oak, true);
  box(s.x, 0.58, s.z - 0.32, 2.2, 0.09, 0.08, M.dark);
  for (let i = 0; i < 13; i++)
    box(s.x - 1.02 + i * 0.17, 0.85, s.z - 0.33, 0.065, 0.5, 0.055, M.oak);
  for (const side of [-1, 1]) {
    box(s.x + side * 1.07, 0.74, s.z, 0.105, 0.1, 0.88, M.oak, true);
    for (const z of [s.z - 0.22, s.z + 0.22])
      box(s.x + side * 1.07, 0.57, z, 0.045, 0.26, 0.045, M.dark);
  }
  for (let i = 0; i < 3; i++) {
    const x = s.x + (i - 1) * 0.67;
    mesh(soft, M.linen, x, 0.51, s.z + 0.035, 0.65, 0.22, 0.65, true);
    const cushion = mesh(soft, grey, x, 0.9, s.z - 0.19, 0.63, 0.51, 0.2, true);
    cushion.rotation.x = -0.11;
  }
  for (const side of [-1, 1]) {
    const pillow = mesh(
      soft,
      side < 0 ? M.sage : M.rust,
      s.x + side * 0.86,
      0.75,
      s.z + 0.02,
      0.27,
      0.34,
      0.31,
      true,
    );
    pillow.rotation.z = -side * 0.2;
  }
  // Round three-legged side table, as in plan.
  const t = LIVING.sideTable;
  cyl(t.x, 0.61, t.z, 0.31, 0.07, M.dark);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    beam(
      new T.Vector3(t.x + Math.cos(a) * 0.21, 0.03, t.z + Math.sin(a) * 0.21),
      new T.Vector3(t.x + Math.cos(a) * 0.13, 0.57, t.z + Math.sin(a) * 0.13),
      0.055,
    );
  }
  // Matching oak armchair, not a modern upholstered tub chair.
  const a = new T.Group();
  a.position.set(LIVING.armchair.x, 0, LIVING.armchair.z);
  a.rotation.y = Math.PI / 2;
  world.add(a);
  box(0, 0.37, 0, 0.7, 0.1, 0.68, M.dark, false, a);
  for (const x of [-0.3, 0.3])
    for (const z of [-0.25, 0.25]) cyl(x, 0.23, z, 0.045, 0.46, M.dark, a);
  for (const x of [-0.34, 0.34]) {
    box(x, 0.72, 0, 0.09, 0.09, 0.76, M.oak, true, a);
    for (const z of [-0.25, 0.25]) box(x, 0.55, z, 0.045, 0.32, 0.045, M.dark, false, a);
  }
  for (let i = 0; i < 7; i++) box((i - 3) * 0.095, 0.85, -0.29, 0.045, 0.6, 0.05, M.oak, false, a);
  box(0, 1.13, -0.29, 0.78, 0.1, 0.09, M.oak, true, a);
  box(0, 0.49, 0.01, 0.62, 0.2, 0.61, M.linen, true, a);
  const chairBack = box(0, 0.88, -0.2, 0.59, 0.48, 0.14, grey, true, a);
  chairBack.rotation.x = -0.1;
  // Wooden rocking chair with curved runners, spindle back and a readable silhouette.
  const r = new T.Group();
  r.position.set(LIVING.rocking.x, 0, LIVING.rocking.z);
  r.rotation.y = -2.5;
  world.add(r);
  box(0, 0.48, 0, 0.62, 0.09, 0.62, M.dark, true, r);
  for (const x of [-0.31, 0.31]) {
    const points = [];
    for (let i = 0; i <= 16; i++) {
      const z = -0.57 + i * 0.075;
      points.push(new T.Vector3(x, 0.06 + 0.3 * z * z, z));
    }
    const runner = new T.Mesh(
      new T.TubeGeometry(new T.CatmullRomCurve3(points), 20, 0.033, 6, false),
      M.dark,
    );
    r.add(runner);
    beam(new T.Vector3(x, 0.12, -0.28), new T.Vector3(x, 0.57, -0.23), 0.045, M.dark, r);
    beam(new T.Vector3(x, 0.12, 0.28), new T.Vector3(x, 0.57, 0.23), 0.045, M.dark, r);
    box(x, 0.76, 0.0, 0.075, 0.07, 0.73, M.dark, true, r);
    beam(new T.Vector3(x, 0.5, -0.26), new T.Vector3(x, 1.27, -0.47), 0.05, M.dark, r);
    beam(new T.Vector3(x, 0.52, 0.25), new T.Vector3(x, 0.74, 0.25), 0.045, M.dark, r);
  }
  for (let i = 0; i < 7; i++)
    beam(
      new T.Vector3((i - 3) * 0.077, 0.54, -0.28),
      new T.Vector3((i - 3) * 0.077, 1.17, -0.44),
      0.026,
      M.dark,
      r,
    );
  box(0, 1.24, -0.46, 0.74, 0.13, 0.085, M.dark, true, r);
  // A pointed stone hearth, with a weathered plaster hood and a working recess.
  box(3.84, 0.8, -2.1, 0.08, 1.38, 1.36, black);
  const surround = new T.Shape();
  surround.moveTo(-0.84, 0.13);
  surround.lineTo(0.84, 0.13);
  surround.lineTo(0.84, 1.7);
  surround.lineTo(-0.84, 1.7);
  surround.closePath();
  const opening = new T.Path();
  opening.moveTo(-0.57, 0.13);
  opening.lineTo(-0.57, 0.76);
  opening.quadraticCurveTo(-0.54, 1.06, 0, 1.36);
  opening.quadraticCurveTo(0.54, 1.06, 0.57, 0.76);
  opening.lineTo(0.57, 0.13);
  opening.closePath();
  surround.holes.push(opening);
  const surroundMesh = new T.Mesh(
    new T.ExtrudeGeometry(surround, {
      depth: 0.32,
      bevelEnabled: true,
      bevelSize: 0.025,
      bevelThickness: 0.015,
      bevelSegments: 1,
      steps: 1,
    }),
    M.stone,
  );
  surroundMesh.rotation.y = -Math.PI / 2;
  surroundMesh.position.set(3.64, 0, -2.1);
  surroundMesh.castShadow = true;
  surroundMesh.receiveShadow = true;
  world.add(surroundMesh);
  // Proper radial wedge blocks with a constant joint gap and shared arch center.
  for (let i = 0; i < 13; i++) {
    const t0 = (i * Math.PI) / 13 + 0.013,
      t1 = ((i + 1) * Math.PI) / 13 - 0.013;
    const shape = new T.Shape();
    for (let j = 0; j <= 6; j++) {
      const t = t0 + ((t1 - t0) * j) / 6;
      const u = Math.cos(t) * 0.76,
        v = 0.74 + Math.sin(t) * 0.79;
      if (j) shape.lineTo(u, v);
      else shape.moveTo(u, v);
    }
    for (let j = 6; j >= 0; j--) {
      const t = t0 + ((t1 - t0) * j) / 6;
      shape.lineTo(Math.cos(t) * 0.58, 0.74 + Math.sin(t) * 0.6);
    }
    shape.closePath();
    const stone = new T.Mesh(
      new T.ExtrudeGeometry(shape, {
        depth: 0.09,
        bevelEnabled: true,
        bevelSize: 0.009,
        bevelThickness: 0.008,
        bevelSegments: 2,
      }),
      i % 3 === 0 ? M.stoneDark : M.stoneLight,
    );
    stone.rotation.y = -Math.PI / 2;
    stone.position.set(3.32, 0, -2.1);
    stone.castShadow = true;
    stone.receiveShadow = true;
    world.add(stone);
  }
  box(3.53, 0.065, -2.1, 0.95, 0.13, 1.84, M.stone);
  box(3.57, 1.73, -2.1, 0.72, 0.11, 1.86, M.oak);
  // Rectangular tapered hood: the former four-sided cylinder produced an untidy diamond.
  // Tapered masonry/plaster breast with two clean shoulder returns into the stack.
  const hoodShape = new T.Shape();
  hoodShape.moveTo(-0.84, 0.13);
  hoodShape.lineTo(0.84, 0.13);
  hoodShape.lineTo(0.84, 0.4);
  hoodShape.lineTo(0.62, 0.67);
  hoodShape.lineTo(0.32, 0.91);
  hoodShape.lineTo(0.22, 1.15);
  hoodShape.lineTo(-0.22, 1.15);
  hoodShape.lineTo(-0.32, 0.91);
  hoodShape.lineTo(-0.62, 0.67);
  hoodShape.lineTo(-0.84, 0.4);
  hoodShape.closePath();
  const hoodGeo = new T.ExtrudeGeometry(hoodShape, {
    depth: 0.56,
    bevelEnabled: true,
    bevelSize: 0.018,
    bevelThickness: 0.012,
    bevelSegments: 2,
    curveSegments: 3,
  });
  const hoodMesh = new T.Mesh(hoodGeo, M.plaster);
  hoodMesh.rotation.y = Math.PI / 2;
  hoodMesh.position.set(3.3, 1.65, -2.1);
  hoodMesh.castShadow = true;
  hoodMesh.receiveShadow = true;
  world.add(hoodMesh);
  box(3.76, 3.1, -2.1, 0.42, 0.72, 0.89, M.plaster);
  // Bark, cut end grain, charcoal and glowing fissures: not two smooth brown cylinders.
  const charredWood = material('#373128');
  charredWood.emissive.set('#211208');
  charredWood.emissiveIntensity = 0.18;
  for (let i = 0; i < 3; i++) {
    const logGroup = new T.Group();
    logGroup.position.set(3.18, 0.3 + i * 0.09, -2.1 + (i - 1) * 0.17);
    logGroup.rotation.set(Math.PI / 2, 0.12 * (i - 1), 0.18 * (i - 1));
    world.add(logGroup);
    const bark = new T.Mesh(
      new T.CylinderGeometry(0.066, 0.078, 0.58, 16, 4),
      i === 1 ? charredWood : M.dark,
    );
    bark.castShadow = true;
    bark.receiveShadow = true;
    logGroup.add(bark);
    for (let k = 0; k < 9; k++) {
      const a = (k * Math.PI * 2) / 9;
      beam(
        new T.Vector3(Math.cos(a) * 0.077, -0.27, Math.sin(a) * 0.077),
        new T.Vector3(Math.cos(a + 0.08) * 0.077, 0.26, Math.sin(a + 0.08) * 0.077),
        0.011,
        k % 3 ? M.iron : M.edge,
        logGroup,
      );
    }
    for (const end of [-1, 1]) {
      const disk = new T.Mesh(new T.CylinderGeometry(0.064, 0.064, 0.008, 20), M.edge);
      disk.position.y = end * 0.294;
      disk.castShadow = true;
      logGroup.add(disk);
      for (const radius of [0.023, 0.044]) {
        const ring = new T.Mesh(new T.TorusGeometry(radius, 0.0025, 4, 20), M.dark);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = end * 0.3;
        logGroup.add(ring);
      }
    }
  }
  const crossLog = new T.Group();
  crossLog.position.set(3.28, 0.37, -2.1);
  crossLog.rotation.z = Math.PI / 2;
  world.add(crossLog);
  const crossBark = new T.Mesh(new T.CylinderGeometry(0.078, 0.068, 0.48, 18, 4), M.dark);
  crossBark.castShadow = true;
  crossBark.receiveShadow = true;
  crossLog.add(crossBark);
  const cutEnd = new T.Mesh(new T.CylinderGeometry(0.068, 0.068, 0.009, 20), M.edge);
  cutEnd.position.y = 0.244;
  crossLog.add(cutEnd);
  for (const radius of [0.024, 0.046]) {
    const ring = new T.Mesh(new T.TorusGeometry(radius, 0.0025, 5, 24), M.iron);
    ring.position.y = 0.251;
    ring.rotation.x = Math.PI / 2;
    crossLog.add(ring);
  }
  const fire = new T.PointLight('#ffb95c', 3.2, 5, 2);
  fire.position.set(3.07, 0.65, -2.1);
  scene.add(fire);
  const flames = hearthFire(scene);
  const dust = windowAtmosphere(scene);
  // Entry coat stand: slim turned post with radial hooks and splayed feet.
  const c = LIVING.coat;
  cyl(c.x, 0.95, c.z, 0.035, 1.9);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    beam(
      new T.Vector3(c.x, 1.55, c.z),
      new T.Vector3(c.x + Math.cos(a) * 0.25, 1.76, c.z + Math.sin(a) * 0.25),
      0.028,
    );
  }
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    beam(
      new T.Vector3(c.x, 0.18, c.z),
      new T.Vector3(c.x + Math.cos(a) * 0.26, 0.03, c.z + Math.sin(a) * 0.26),
      0.04,
    );
  }
  // Regular bonded courses with clipped ends and consistent 12 mm mortar joints.
  const stones = [M.stone, M.stoneLight, M.stoneDark];
  function course(start: number, end: number, axis: 'x' | 'z', fixed: number) {
    for (let row = 0; row < 3; row++) {
      let edge = start;
      let n = 0;
      while (edge < end - 0.025) {
        const length = Math.min(n === 0 && row % 2 ? 0.23 : 0.46, end - edge);
        if (length > 0.035) {
          const c = edge + length / 2,
            y = 0.105 + row * 0.195;
          box(
            axis === 'x' ? c : fixed,
            y,
            axis === 'z' ? c : fixed,
            axis === 'x' ? length - 0.012 : 0.095,
            0.18,
            axis === 'z' ? length - 0.012 : 0.095,
            stones[(n + row) % 3],
            true,
          );
        }
        edge += length;
        n++;
      }
    }
  }
  course(-W + 0.09, -3.61, 'x', -D + 0.028);
  course(-2.1, W - 0.09, 'x', -D + 0.028);
  course(-W + 0.09, -0.79, 'x', D - 0.028);
  course(0.79, W - 0.09, 'x', D - 0.028);
  course(-D + 0.09, -3.12, 'z', W - 0.028);
  course(-0.98, D - 0.09, 'z', W - 0.028);
  course(-D + 0.09, D - 0.09, 'z', -W + 0.028);
  // Compact household book press, pottery and baskets: no new room or floor plan.
  const cabinet = LIVING.bookcase;
  box(cabinet.x, 0.88, cabinet.z, 0.9, 1.76, 0.12, M.dark);
  for (const x of [cabinet.x - 0.43, cabinet.x + 0.43])
    box(x, 0.9, cabinet.z + 0.14, 0.09, 1.8, 0.4, M.oak);
  for (const y of [0.14, 0.68, 1.22, 1.78])
    box(cabinet.x, y, cabinet.z + 0.14, 0.94, 0.075, 0.44, M.dark);
  for (let level = 0; level < 3; level++)
    for (let i = 0; i < 7; i++) {
      const h = 0.27 + ((i * 7 + level * 3) % 5) * 0.022,
        id = `shelf-${level}-${i}`,
        book = boundBook(id, i, h);
      book.position.set(cabinet.x - 0.32 + i * 0.1, 0.19 + level * 0.54 + h / 2, cabinet.z + 0.17);
      registerBook(book, id, BOOK_TITLES[i], 0.09, h + 0.04, 0.25);
    }
  // Small writing surface under the window, and a linen chest against the south wall.
  const desk = LIVING.writingDesk;
  box(desk.x, 0.76, desk.z, 0.54, 0.065, 1.17, M.oak, true);
  for (const x of [desk.x - 0.2, desk.x + 0.2])
    for (const z of [desk.z - 0.48, desk.z + 0.48]) box(x, 0.36, z, 0.065, 0.72, 0.065, M.dark);
  box(desk.x, 0.6, desk.z, 0.45, 0.16, 1.03, M.dark);
  box(desk.x + 0.24, 0.6, desk.z, 0.025, 0.11, 0.7, M.oak);
  const journal = openJournal('travel-journal');
  journal.position.set(desk.x, 0.805, desk.z);
  journal.rotation.y = Math.PI / 2;
  interactiveBooks.add(journal);
  books.push({
    id: 'travel-journal',
    title: BOOK_TITLES[0],
    position: journal.position.clone(),
    object: journal,
  });
  const chest = LIVING.chest;
  box(chest.x, 0.3, chest.z, 1.05, 0.48, 0.51, M.dark, true);
  box(chest.x, 0.56, chest.z, 1.1, 0.075, 0.55, M.oak, true);
  for (const x of [chest.x - 0.35, chest.x + 0.35]) {
    box(x, 0.33, chest.z + 0.263, 0.055, 0.45, 0.016, M.iron);
    box(x, 0.605, chest.z, 0.055, 0.015, 0.51, M.iron);
  }
  box(chest.x, 0.36, chest.z + 0.28, 0.08, 0.1, 0.02, M.gold);
  const jugGeometry = new T.LatheGeometry(
    [
      new T.Vector2(0.065, 0),
      new T.Vector2(0.09, 0.03),
      new T.Vector2(0.12, 0.14),
      new T.Vector2(0.07, 0.23),
      new T.Vector2(0.045, 0.27),
      new T.Vector2(0.05, 0.29),
    ],
    16,
  );
  mesh(jugGeometry, M.pottery, 2.3, 0.65, -3.52, 1, 1, 1);
  const handle = new T.Mesh(new T.TorusGeometry(0.065, 0.017, 6, 16, Math.PI * 1.6), M.pottery);
  handle.position.set(2.39, 0.81, -3.52);
  world.add(handle);
  for (let i = 0; i < 3; i++) {
    const book = box(3.5, 1.82 + i * 0.045, -2.56, 0.2, 0.04, 0.27, [M.sage, M.rust, M.cream][i]);
    book.rotation.y = 0.1 * i;
  }
  // Contact shading under furniture/against the stone plinth without expensive SSAO.
  for (const b of [LIVING.sofa, LIVING.armchair, LIVING.bookcase]) {
    const ao = mesh(
      new T.PlaneGeometry(b.w * 1.3, b.d * 1.6),
      M.ao,
      b.x,
      0.029,
      b.z,
      1,
      1,
      1,
      false,
    );
    ao.rotation.x = -Math.PI / 2;
  }
  // Camera solids have the same architectural/furniture footprints as the movement motor.
  obstacles.splice(0, obstacles.length, ...Object.values(LIVING).map((b) => ({ ...b })));
  for (const [key, b] of Object.entries(LIVING))
    proxy(
      b.x,
      key === 'coat' ? 0.95 : key === 'bookcase' ? 0.9 : key === 'fireplace' ? 1.6 : 0.64,
      b.z,
      b.w,
      key === 'coat' ? 1.9 : key === 'bookcase' ? 1.8 : key === 'fireplace' ? 3.2 : 1.28,
      b.d,
    );
  // Local garden backdrop seen through the window, not another explorable stage.
  const grass = material('#8d9c70');
  box(0, -0.3, 0, 100, 0.15, 100, grass);
  for (let i = 0; i < 16; i++) {
    const theta = i * 2.399,
      rad = 9 + (i % 4) * 2,
      x = Math.cos(theta) * rad,
      z = Math.sin(theta) * rad;
    cyl(x, 0.9, z, 0.12, 1.8);
    mesh(sphere, i % 2 ? M.leaf : M.leafLight, x, 2.5, z, 1.25, 1.7, 1.3);
  }
  // Merge by material/shadow state, retaining bounded draw calls on phones.
  world.updateMatrixWorld(true);
  cameraGeometry.updateMatrixWorld(true);
  const batches = new Map<
    string,
    { material: T.Material; cast: boolean; geos: T.BufferGeometry[] }
  >();
  world.traverse((o) => {
    if (!(o instanceof T.Mesh) || Array.isArray(o.material)) return;
    const key = o.material.uuid + o.castShadow;
    let b = batches.get(key);
    if (!b) {
      b = { material: o.material, cast: o.castShadow, geos: [] };
      batches.set(key, b);
    }
    const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
    if (g.index) {
      b.geos.push(g.toNonIndexed());
      g.dispose();
    } else b.geos.push(g);
  });
  const staticHouse = new T.Group();
  scene.add(staticHouse, interactiveBooks);
  for (const b of batches.values()) {
    const g = mergeGeometries(b.geos, false);
    if (!g) throw new Error('House batch failed');
    const o = new T.Mesh(g, b.material);
    o.castShadow = b.cast;
    o.receiveShadow = true;
    staticHouse.add(o);
    b.geos.forEach((g) => g.dispose());
  }
  const originals = new Set<T.BufferGeometry>();
  world.traverse((o) => {
    if (o instanceof T.Mesh) originals.add(o.geometry);
  });
  originals.forEach((g) => g.dispose());
  return {
    fire,
    books,
    animateFire: (time: number) => {
      flames.update(time);
      dust.update(time);
    },
    meshCount: staticHouse.children.length,
    cameraGeometry,
    dispose() {
      staticHouse.traverse((o) => {
        if (o instanceof T.Mesh) o.geometry.dispose();
      });
      scene.remove(staticHouse, interactiveBooks, fire);
      interactiveBooks.traverse((o) => {
        if (o instanceof T.Mesh) o.geometry.dispose();
      });
      flames.dispose();
      dust.dispose();
      vault.dispose();
      cameraMaterial.dispose();
      owned.forEach((m) => m.dispose());
      disposeBookAssets();
      bookHitMaterial.dispose();
    },
  };
}
