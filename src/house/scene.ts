import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { M } from './materials';
import { HOUSE, LIVING, obstacles } from './layout';

/** Reference layout, reinterpreted as a village home. No speculative extra rooms. */
export function buildHouse(scene: T.Scene) {
  const world = new T.Group();
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
  const grey = material('#696d65'),
    lightGrey = material('#a0a69a'),
    brown = material('#4d3d2e'),
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
  box(0, 3.34, 0, HOUSE.width + 0.3, 0.16, HOUSE.depth + 0.3, M.plaster);
  proxy(0, 3.34, 0, HOUSE.width, 0.16, HOUSE.depth);
  wall(0, -D - 0.09, HOUSE.width + 0.36, 0.18);
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
  door.rotation.y = -1.17;
  world.add(door);
  box(0.57, 1.17, 0, 1.14, 2.34, 0.065, M.dark, false, door);
  for (const y of [0.65, 1.75]) box(0.57, y, -0.045, 0.86, 0.77, 0.04, M.oak, false, door);
  cyl(1.02, 1.15, -0.09, 0.045, 0.12, M.gold, door);
  box(0, 1.25, D + 0.65, 1.3, 2.5, 0.1, M.dark); // temporary closed porch, not another finished room
  box(0, 0.016, 3.18, 1.25, 0.024, 0.74, brown);
  proxy(0, 1.25, D, 1.3, 2.5, 0.08); // Keep the follow camera inside the entry aperture.
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
  for (const z of [-2.9, 0, 2.9]) box(0, 3.17, z, HOUSE.width, 0.2, 0.17, M.dark);
  for (const z of [-D + 0.01, D - 0.01]) box(0, 0.1, z, HOUSE.width, 0.2, 0.06, M.wood);
  for (const x of [-W + 0.01, W - 0.01]) box(x, 0.1, 0, 0.06, 0.2, HOUSE.depth, M.wood);
  // Future north-west connection is represented by a closed arched timber door.
  const arch = new T.Shape();
  arch.moveTo(-0.62, 0);
  arch.lineTo(0.62, 0);
  arch.lineTo(0.62, 1.76);
  arch.absarc(0, 1.76, 0.62, 0, Math.PI, false);
  arch.lineTo(-0.62, 0);
  const archGeo = new T.ExtrudeGeometry(arch, {
    depth: 0.07,
    bevelEnabled: false,
    curveSegments: 20,
  });
  const arched = new T.Mesh(archGeo, M.oak);
  arched.position.set(-2.85, 0, -D + 0.025);
  world.add(arched);
  for (const x of [-3.51, -2.19]) box(x, 0.89, -D + 0.08, 0.12, 1.78, 0.16, M.dark);
  const arc = new T.TorusGeometry(0.66, 0.06, 6, 32, Math.PI);
  const rim = new T.Mesh(arc, M.dark);
  rim.position.set(-2.85, 1.76, -D + 0.1);
  world.add(rim);
  for (let i = 0; i < 7; i++) box(-3.37 + i * 0.17, 0.82, -D + 0.108, 0.012, 1.6, 0.008, M.edge);
  cyl(-2.47, 1.0, -D + 0.17, 0.035, 0.12, M.iron);
  // Plain brown woven rug: reference size and position, not the old central patterned rug.
  box(1.32, 0.015, -2.12, 3.25, 0.025, 1.95, brown);
  // Three-seat linen sofa, north wall, facing south into the seating group.
  const s = LIVING.sofa;
  for (const x of [s.x - 0.9, s.x + 0.9])
    for (const z of [s.z - 0.25, s.z + 0.25]) box(x, 0.14, z, 0.085, 0.28, 0.085, M.dark);
  box(s.x, 0.35, s.z, 2.22, 0.28, 0.78, grey, true);
  box(s.x, 0.79, s.z - 0.32, 2.28, 0.76, 0.2, grey, true);
  for (const side of [-1, 1]) box(s.x + side * 1.08, 0.62, s.z, 0.19, 0.48, 0.86, grey, true);
  for (let i = 0; i < 3; i++) {
    const x = s.x + (i - 1) * 0.66;
    box(x, 0.53, s.z + 0.04, 0.64, 0.16, 0.64, grey, true);
    box(x, 0.91, s.z - 0.19, 0.64, 0.49, 0.16, grey, true);
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
  // Upholstered armchair faces into the rug from its west edge.
  const a = new T.Group();
  a.position.set(LIVING.armchair.x, 0, LIVING.armchair.z);
  a.rotation.y = Math.PI / 2;
  world.add(a);
  box(0, 0.43, 0, 0.69, 0.22, 0.66, lightGrey, true, a);
  box(0, 0.79, -0.26, 0.73, 0.64, 0.18, lightGrey, true, a);
  for (const side of [-1, 1]) box(side * 0.34, 0.66, 0.02, 0.14, 0.4, 0.67, lightGrey, true, a);
  for (const x of [-0.25, 0.25])
    for (const z of [-0.23, 0.23]) box(x, 0.15, z, 0.065, 0.3, 0.065, M.oak, false, a);
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
  // East-wall limestone hearth, opening toward west (not toward the sofa wall).
  box(3.84, 0.77, -2.1, 0.29, 1.5, 1.7, M.stone);
  box(3.66, 0.68, -2.1, 0.12, 1.08, 1.16, black);
  for (const z of [-2.84, -1.36]) {
    box(3.56, 0.69, z, 0.58, 1.23, 0.25, M.stone);
    for (let i = 0; i < 5; i++) box(3.255, 0.21 + i * 0.23, z, 0.018, 0.012, 0.25, M.mortar);
  }
  box(3.52, 1.37, -2.1, 0.76, 0.21, 1.98, M.stone);
  box(3.43, 0.08, -2.1, 1.04, 0.16, 2.02, M.stone);
  box(3.55, 1.55, -2.1, 0.7, 0.12, 2.08, M.oak);
  for (const z of [-2.36, -1.95]) {
    const log = cyl(3.42, 0.25, z, 0.09, 0.58, M.dark);
    log.rotation.x = Math.PI / 2;
  }
  const fire = new T.PointLight('#ffb95c', 3.2, 5, 2);
  fire.position.set(3.07, 0.65, -2.1);
  scene.add(fire);
  const flameGeometry = new T.SphereGeometry(1, 10, 10),
    flameMaterial = M.glow.clone();
  owned.push(flameMaterial);
  const ember = new T.Mesh(flameGeometry, flameMaterial);
  ember.position.set(3.42, 0.38, -2.1);
  ember.scale.set(0.12, 0.22, 0.33);
  scene.add(ember);
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
  // Camera solids have the same architectural/furniture footprints as the movement motor.
  obstacles.splice(0, obstacles.length, ...Object.values(LIVING).map((b) => ({ ...b })));
  for (const [key, b] of Object.entries(LIVING))
    proxy(
      b.x,
      key === 'coat' ? 0.95 : key === 'fireplace' ? 0.8 : 0.64,
      b.z,
      b.w,
      key === 'coat' ? 1.9 : key === 'fireplace' ? 1.6 : 1.28,
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
  scene.add(staticHouse);
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
    ember,
    meshCount: staticHouse.children.length,
    cameraGeometry,
    dispose() {
      staticHouse.traverse((o) => {
        if (o instanceof T.Mesh) o.geometry.dispose();
      });
      scene.remove(staticHouse, fire, ember);
      flameGeometry.dispose();
      cameraMaterial.dispose();
      owned.forEach((m) => m.dispose());
    },
  };
}
