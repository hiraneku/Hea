import * as T from 'three';
import { HOUSE } from './layout';
import { M } from './materials';

/** Open timber roof and a real pierced gable; all geometry joins the static batch. */
export function buildVault(world: T.Group, collision: T.Group, proxyMaterial: T.Material) {
  const boxGeometry = new T.BoxGeometry(1, 1, 1);
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    m: T.Material,
    parent: T.Group = world,
  ) => {
    const o = new T.Mesh(boxGeometry, m);
    o.position.set(x, y, z);
    o.scale.set(w, h, d);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  };
  const beam = (a: T.Vector3, b: T.Vector3, width: number, depth = width) => {
    const o = box(
      (a.x + b.x) / 2,
      (a.y + b.y) / 2,
      (a.z + b.z) / 2,
      width,
      a.distanceTo(b),
      depth,
      M.dark,
    );
    o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    return o;
  };
  const W = HOUSE.width / 2 + 0.17,
    D = HOUSE.depth / 2 + 0.18,
    rise = HOUSE.ridge - HOUSE.eaves,
    length = Math.hypot(W, rise),
    angle = Math.atan2(rise, W);
  for (const side of [-1, 1]) {
    const shell = box(
      (side * W) / 2,
      (HOUSE.ridge + HOUSE.eaves) / 2,
      0,
      length,
      0.14,
      D * 2,
      M.roof,
    );
    shell.rotation.z = -side * angle;
    const solid = shell.clone();
    solid.material = proxyMaterial;
    collision.add(solid);
    for (let i = 0; i < 33; i++) {
      const plank = box(
        (side * W) / 2,
        (HOUSE.ridge + HOUSE.eaves) / 2 - 0.085,
        -D + (i + 0.5) * ((D * 2) / 33),
        length,
        0.035,
        (D * 2) / 33 - 0.012,
        M.roof,
      );
      plank.rotation.z = -side * angle;
    }
    for (const z of [-3.97, -2.65, -1.32, 0, 1.32, 2.65, 3.97]) {
      beam(
        new T.Vector3(side * (W - 0.05), HOUSE.eaves - 0.07, z),
        new T.Vector3(0, HOUSE.ridge - 0.09, z),
        0.13,
        0.17,
      );
    }
    for (const z of [-3.8, 0, 3.8])
      beam(
        new T.Vector3(side * (W - 0.2), 2.65, z),
        new T.Vector3(side * (W - 0.85), 3.56, z),
        0.11,
      );
  }
  box(0, HOUSE.ridge - 0.12, 0, 0.2, 0.22, D * 2, M.dark);
  for (const z of [-2.65, 2.65]) {
    box(0, 4.35, z, 4.2, 0.14, 0.15, M.dark);
    beam(new T.Vector3(0, 4.36, z), new T.Vector3(0, HOUSE.ridge - 0.1, z), 0.1);
  }
  // Gable triangle, north pierced by a high tracery window. Never a luminous rectangle on plaster.
  const pane = new T.Shape();
  pane.moveTo(0.45, 3.63);
  pane.lineTo(1.95, 3.63);
  pane.lineTo(1.2, 4.88);
  pane.closePath();
  const glass = new T.MeshStandardMaterial({
    color: '#e9dfac',
    emissive: '#edda99',
    emissiveIntensity: 1.5,
    roughness: 0.65,
    side: T.DoubleSide,
  });
  for (const side of [-1, 1]) {
    const shape = new T.Shape();
    shape.moveTo(-W, HOUSE.eaves);
    shape.lineTo(W, HOUSE.eaves);
    shape.lineTo(0, HOUSE.ridge);
    shape.closePath();
    if (side === -1) {
      const hole = new T.Path();
      hole.moveTo(0.45, 3.63);
      hole.lineTo(1.2, 4.88);
      hole.lineTo(1.95, 3.63);
      hole.closePath();
      shape.holes.push(hole);
    }
    const g = new T.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: false });
    const wall = new T.Mesh(g, M.plaster);
    wall.position.z = side === -1 ? -D : HOUSE.depth / 2;
    wall.castShadow = true;
    wall.receiveShadow = true;
    world.add(wall);
    const solid = new T.Mesh(g, proxyMaterial);
    solid.position.copy(wall.position);
    collision.add(solid);
    if (side === -1) {
      const p = new T.Mesh(new T.ShapeGeometry(pane), glass);
      p.position.z = -D + 0.11;
      world.add(p);
      const z = -D + 0.15;
      beam(new T.Vector3(0.4, 3.59, z), new T.Vector3(2, 3.59, z), 0.085);
      beam(new T.Vector3(0.4, 3.59, z), new T.Vector3(1.2, 4.98, z), 0.085);
      beam(new T.Vector3(2, 3.59, z), new T.Vector3(1.2, 4.98, z), 0.085);
      beam(new T.Vector3(1.2, 3.65, z), new T.Vector3(1.2, 4.64, z), 0.035);
      for (const [x, y, r] of [
        [0.91, 3.91, 0.18],
        [1.49, 3.91, 0.18],
        [1.2, 4.37, 0.16],
      ]) {
        const o = new T.Mesh(new T.TorusGeometry(r, 0.022, 6, 24), M.oak);
        o.position.set(x, y, z);
        o.castShadow = true;
        world.add(o);
      }
    }
  }
  return { dispose: () => glass.dispose() };
}
