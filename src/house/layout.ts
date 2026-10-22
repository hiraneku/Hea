/** Reference living room, metres; north is -Z, entrance is south. */
export const HOUSE = { width: 8.11, depth: 8.3, upper: 3.3, eye: 1.58, radius: 0.19 };
export interface Obstacle {
  x: number;
  z: number;
  w: number;
  d: number;
  floor: number;
}
export const obstacles: Obstacle[] = [];
/** Shared footprints: scene, motor, camera proxies and plan derive from these. */
export const LIVING = {
  sofa: { x: 1.32, z: -3.45, w: 2.3, d: 0.83, floor: 0 },
  armchair: { x: 0.12, z: -2.12, w: 0.82, d: 0.82, floor: 0 },
  rocking: { x: 2.55, z: -0.98, w: 1.3, d: 1.4, floor: 0 },
  sideTable: { x: 2.91, z: -3.52, w: 0.62, d: 0.62, floor: 0 },
  fireplace: { x: 3.68, z: -2.1, w: 0.75, d: 1.9, floor: 0 },
  coat: { x: -0.93, z: 3.63, w: 0.55, d: 0.55, floor: 0 },
};
export const ROOMS = [
  {
    id: 'living',
    name: 'Living room',
    floor: 0,
    subtitle: 'Ruang untuk berkumpul',
    description:
      'Living room baru mengikuti denah referensi: ruang lega, sofa linen abu, kursi goyang kayu dan perapian batu.',
    position: [0, 0, 1.7],
    target: [1.3, 1.15, -2.2],
    icon: '01',
  },
] as const;
export type RoomId = (typeof ROOMS)[number]['id'];
export function floorAt(x: number, z: number, currentHeight: number): number | null {
  if (
    Math.abs(x) > HOUSE.width / 2 - HOUSE.radius ||
    Math.abs(z) > HOUSE.depth / 2 - HOUSE.radius ||
    Math.abs(currentHeight) > 0.34
  )
    return null;
  return 0;
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
