/** Dimensions are metres. Layout/navigation is isolated from arena physics. */
export const HOUSE = { width: 10, depth: 8, upper: 3.4, eye: 1.58, radius: 0.19 };
export interface Obstacle {
  x: number;
  z: number;
  w: number;
  d: number;
  floor: number;
}
export const obstacles: Obstacle[] = [];
export const ROOMS = [
  {
    id: 'living',
    name: 'Ruang keluarga',
    floor: 0,
    subtitle: 'Tempat cerita pulang',
    description:
      'Perapian batu, bangku berlapis linen, dan secangkir teh. Jantung rumah tempat seluruh keluarga berkumpul.',
    position: [-0.15, 0, 1.65],
    target: [-3.05, 1.2, -2.6],
    icon: '01',
  },
  {
    id: 'kitchen',
    name: 'Dapur & meja makan',
    floor: 0,
    subtitle: 'Roti hangat untuk semua',
    description:
      'Dapur kayu sederhana dengan pantry, keranjang panen, dan meja makan empat kursi. Satu ruang terbuka untuk keseharian keluarga.',
    position: [0.1, 0, 0.8],
    target: [2, 1.0, -2.65],
    icon: '02',
  },
  {
    id: 'parents',
    name: 'Kamar orang tua',
    floor: 1,
    subtitle: 'Istirahat di bawah kasau',
    description:
      'Tempat tidur berlapis selimut sage, peti linen, lemari kayu, dan cahaya jendela. Tenang, hangat, tanpa kemewahan berlebihan.',
    position: [-0.65, 3.4, 1.7],
    target: [-3.0, 4.25, 2.25],
    icon: '03',
  },
  {
    id: 'children',
    name: 'Kamar anak',
    floor: 1,
    subtitle: 'Dua tempat bermimpi',
    description:
      'Dua ranjang kecil, meja belajar bersama, mainan kayu, dan buku cerita. Ruang yang tumbuh bersama anak-anak.',
    position: [-0.7, 3.4, -1.25],
    target: [-3.2, 4.1, -2.3],
    icon: '04',
  },
  {
    id: 'reading',
    name: 'Sudut baca',
    floor: 1,
    subtitle: 'Sore yang berjalan pelan',
    description:
      'Kursi dekat jendela, rak buku keluarga, dan pandangan ke kebun. Terhubung dengan bordes tangga dan kedua kamar.',
    position: [2.0, 3.4, -0.3],
    target: [1.0, 4.15, -3.0],
    icon: '05',
  },
] as const;
export type RoomId = (typeof ROOMS)[number]['id'];

/** Continuous ramp over visible treads avoids stair-induced camera vibration. */
export function stairHeight(z: number) {
  return Math.max(0, Math.min(HOUSE.upper, ((3.3 - z) / 4.42) * HOUSE.upper));
}
export function floorAt(x: number, z: number, currentHeight: number): number | null {
  const r = HOUSE.radius;
  if (Math.abs(x) > 4.82 - r || Math.abs(z) > 3.82 - r) return null;
  if (x > 2.95 && x < 4.35 && z > -1.12 && z < 3.3) {
    if (x < 3.15 || x > 4.12) return null;
    const h = stairHeight(z);
    return Math.abs(h - currentHeight) < 0.34 ? h : null;
  }
  // The upstairs stairwell is genuinely open, not a painted stair texture.
  if (currentHeight > 1.7 && x > 2.8 && x < 4.47 && z > -1.12 && z < 3.5) return null;
  const h = currentHeight > 1.7 ? HOUSE.upper : 0;
  return Math.abs(h - currentHeight) < 0.34 ? h : null;
}
export function canOccupy(x: number, z: number, height: number, blockers = obstacles) {
  const floor = height > 2.6 ? 1 : 0;
  return !blockers.some(
    (b) =>
      b.floor === floor &&
      Math.abs(x - b.x) < b.w / 2 + HOUSE.radius &&
      Math.abs(z - b.z) < b.d / 2 + HOUSE.radius,
  );
}
export function moveInside(
  x: number,
  z: number,
  height: number,
  dx: number,
  dz: number,
  blockers = obstacles,
) {
  // Axis-separated resolution allows sliding along furniture, never tunnelling.
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.07));
  for (let i = 0; i < steps; i++) {
    let h = floorAt(x + dx / steps, z, height);
    if (h !== null && canOccupy(x + dx / steps, z, h, blockers)) {
      x += dx / steps;
      height = h;
    }
    h = floorAt(x, z + dz / steps, height);
    if (h !== null && canOccupy(x, z + dz / steps, h, blockers)) {
      z += dz / steps;
      height = h;
    }
  }
  return { x, z, height };
}
