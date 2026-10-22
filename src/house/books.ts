import * as T from 'three';
import { M } from './materials';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export const BOOK_TITLES = [
  'Catatan Perjalanan',
  'Tumbuhan Desa',
  'Peta Lembah',
  'Kisah Perapian',
  'Musim dan Panen',
  'Bintang Utara',
  'Resep Keluarga',
] as const;
export interface HouseBook {
  id: string;
  title: string;
  position: T.Vector3;
  object: T.Group;
}
function texture(draw: (c: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  draw(canvas.getContext('2d')!);
  const t = new T.CanvasTexture(canvas);
  t.colorSpace = T.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const labels = texture((c) => {
  c.fillStyle = '#493d2b';
  c.fillRect(0, 0, 512, 512);
  BOOK_TITLES.forEach((title, i) => {
    const x = (i * 512) / 7,
      w = 512 / 7;
    c.strokeStyle = '#c2a66b';
    c.lineWidth = 3;
    c.strokeRect(x + 5, 5, w - 10, 502);
    c.fillStyle = '#d6c89f';
    c.beginPath();
    c.arc(x + w / 2, 47, 10, 0, Math.PI * 2);
    c.fill();
    c.save();
    c.translate(x + w / 2, 270);
    c.rotate(-Math.PI / 2);
    c.font = '20px Georgia';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(title, 0, 0, 390);
    c.restore();
  });
});
const paper = texture((c) => {
  c.fillStyle = '#d6cbb0';
  c.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 4) {
    c.strokeStyle = y % 12 ? '#bdb499' : '#e7ddc2';
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(512, y);
    c.stroke();
  }
});
const bodyMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.93 });
const labelMat = new T.MeshStandardMaterial({ map: labels, roughness: 0.85 }),
  paperMat = new T.MeshStandardMaterial({ map: paper, roughness: 1 });
const openMap = texture((c) => {
  c.fillStyle = '#e2d7b9';
  c.fillRect(0, 0, 512, 512);
  c.strokeStyle = '#aa9976';
  c.strokeRect(22, 22, 468, 468);
  c.fillStyle = '#514b37';
  c.textAlign = 'center';
  c.font = '30px Georgia';
  c.fillText('Catatan Perjalanan', 256, 70);
  c.font = '19px Georgia';
  [
    'Di balik bukit, jalan setapak',
    'membawa kami ke lembah.',
    'Rumah-rumah menyala hangat',
    'ketika senja mulai turun.',
  ].forEach((s, i) => c.fillText(s, 256, 118 + i * 29));
  c.beginPath();
  c.arc(256, 340, 76, 0, Math.PI * 2);
  c.moveTo(256, 245);
  c.lineTo(256, 435);
  c.moveTo(161, 340);
  c.lineTo(351, 340);
  c.stroke();
  c.font = '18px Georgia';
  c.fillText('UTARA', 256, 255);
  c.fillText('12', 256, 472);
});
const openMat = new T.MeshStandardMaterial({ map: openMap, roughness: 1, side: T.DoubleSide });
function part(
  parent: T.Group,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  mat: T.Material,
) {
  const o = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}
/** Reusable bound volume with covers, page block, spine, raised bands and title. */
function consolidate(group: T.Group) {
  group.updateMatrix();
  const body: T.BufferGeometry[] = [],
    mapped = new Map<T.Material, T.BufferGeometry[]>(),
    remove: T.Mesh[] = [];
  for (const child of [...group.children])
    if (child instanceof T.Mesh && !Array.isArray(child.material)) {
      const geo = child.geometry.clone().applyMatrix4(child.matrix);
      if (child.material.map || child === group.getObjectByName('spine-title')) {
        const arr = mapped.get(child.material) ?? [];
        arr.push(geo);
        mapped.set(child.material, arr);
      } else {
        const color = (child.material as T.MeshStandardMaterial).color ?? new T.Color('#ffffff');
        const values = new Float32Array(geo.getAttribute('position').count * 3);
        for (let i = 0; i < values.length; i += 3) {
          values[i] = color.r;
          values[i + 1] = color.g;
          values[i + 2] = color.b;
        }
        geo.setAttribute('color', new T.BufferAttribute(values, 3));
        body.push(geo);
      }
      remove.push(child);
    }
  for (const child of remove) {
    group.remove(child);
    child.geometry.dispose();
  }
  if (body.length) {
    const geometry = mergeGeometries(body, false);
    body.forEach((g) => g.dispose());
    if (geometry) {
      const mesh = new T.Mesh(geometry, bodyMat);
      mesh.name = 'book-body';
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
  }
  for (const [material, geometries] of mapped) {
    const geometry = mergeGeometries(geometries, false);
    geometries.forEach((g) => g.dispose());
    if (geometry) {
      const mesh = new T.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = material === labelMat ? 'book-title' : 'book-pages';
      group.add(mesh);
    }
  }
}
export function boundBook(id: string, index: number, height = 0.3, thickness = 0.066) {
  const group = new T.Group();
  group.name = `book:${id}`;
  group.userData = { bookId: id, title: BOOK_TITLES[index % 7], pickupReady: true };
  const cover = [M.sage, M.rust, M.blue, M.dark][index % 4],
    depth = 0.22;
  part(group, 0, 0, 0, thickness - 0.014, height - 0.018, depth - 0.02, paperMat);
  // Two rigid cloth-bound boards sit over the page block; the rounded spine faces the reader.
  for (const side of [-1, 1]) {
    const board = part(
      group,
      0,
      0,
      side * (depth / 2 - 0.005),
      thickness + 0.014,
      height + 0.012,
      0.012,
      cover,
    );
    board.name = side > 0 ? 'front-cover' : 'back-cover';
    for (const y of [-height * 0.38, height * 0.38])
      part(group, 0, y, side * (depth / 2 + 0.002), thickness + 0.008, 0.009, 0.003, M.gold);
  }
  const spine = part(
    group,
    -thickness / 2 - 0.002,
    0,
    0,
    0.012,
    height + 0.008,
    depth + 0.006,
    cover,
  );
  spine.name = 'title-spine';
  const labelGeo = new T.PlaneGeometry(0.01, height * 0.76),
    uv = labelGeo.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) uv.setX(i, (index + uv.getX(i)) / 7);
  const label = new T.Mesh(labelGeo, labelMat);
  label.position.set(-thickness / 2 - 0.009, 0, 0);
  label.rotation.y = -Math.PI / 2;
  label.name = 'spine-title';
  group.add(label);
  for (const y of [-height * 0.36, height * 0.36]) {
    const line = part(group, -thickness / 2 - 0.01, y, 0, 0.003, 0.008, depth * 0.9, M.gold);
    line.name = 'spine-gilt';
  }
  consolidate(group);
  return group;
}
export function openJournal(id: string) {
  const group = new T.Group();
  group.name = `book:${id}`;
  group.userData = { bookId: id, title: BOOK_TITLES[0], pickupReady: true };
  part(group, 0, 0, 0, 0.43, 0.018, 0.32, M.dark);
  for (const side of [-1, 1]) {
    part(group, side * 0.105, 0.018, 0, 0.2, 0.018, 0.302, paperMat);
    const geo = new T.PlaneGeometry(0.2, 0.3, 12, 2),
      pos = geo.getAttribute('position');
    for (let i = 0; i < pos.count; i++)
      pos.setZ(i, 0.012 + Math.sin(((pos.getX(i) + 0.1) * Math.PI) / 0.2) * 0.014);
    geo.computeVertexNormals();
    const page = new T.Mesh(geo, openMat);
    page.rotation.x = -Math.PI / 2;
    page.position.set(side * 0.104, 0.027, 0);
    page.receiveShadow = true;
    group.add(page);
  }
  const ribbon = part(group, 0.01, 0.015, 0.195, 0.012, 0.005, 0.1, M.rust);
  ribbon.rotation.y = 0.15;
  consolidate(group);
  return group;
}

export function disposeBookAssets() {
  labels.dispose();
  paper.dispose();
  openMap.dispose();
  bodyMat.dispose();
  labelMat.dispose();
  paperMat.dispose();
  openMat.dispose();
}
