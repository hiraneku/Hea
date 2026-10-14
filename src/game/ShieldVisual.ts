import * as THREE from 'three';
import { seededRandom } from './math';

export const SHIELD_PATTERNS = [
  'honeycomb',
  'triangles',
  'diamonds',
  'rings',
  'petals',
  'shards',
] as const;
export type ShieldPattern = (typeof SHIELD_PATTERNS)[number];
function bag(cycle: number) {
  const random = seededRandom(719 + cycle * 131),
    values = [0, 1, 2, 3, 4, 5];
  for (let i = 5; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}
export function shieldPattern(serial: number): ShieldPattern {
  const cycle = Math.floor(serial / 6),
    values = bag(cycle);
  if (cycle > 0 && values[0] === bag(cycle - 1)[5]) [values[0], values[1]] = [values[1], values[0]];
  return SHIELD_PATTERNS[values[serial % 6]];
}

/** Different tessellations/silhouettes, not simply six-sided fields rotated in place. */
export function makeShieldPatch(serial: number): THREE.Group {
  const pattern = shieldPattern(serial),
    random = seededRandom(3001 + serial * 41),
    lines: number[] = [],
    fill: number[] = [];
  const polygon = (cx: number, cy: number, r: number, sides: number, angle = 0, stretch = 1) => {
    const p = Array.from({ length: sides }, (_, i) => {
      const a = angle + (i * Math.PI * 2) / sides;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * stretch];
    });
    for (let i = 0; i < sides; i++) {
      const a = p[i],
        b = p[(i + 1) % sides];
      lines.push(...a, 0, ...b, 0);
      fill.push(cx, cy, -0.008, ...a, -0.008, ...b, -0.008);
    }
  };
  const ring = (r: number, segments = 48) => {
    for (let i = 0; i < segments; i++) {
      const a = (i * Math.PI * 2) / segments,
        b = ((i + 1) * Math.PI * 2) / segments;
      lines.push(Math.cos(a) * r, Math.sin(a) * r, 0, Math.cos(b) * r, Math.sin(b) * r, 0);
    }
  };
  if (pattern === 'honeycomb') {
    for (let q = -2; q <= 2; q++)
      for (let r = Math.max(-2, -q - 2); r <= Math.min(2, -q + 2); r++) {
        if (Math.abs(q + r) === 2 && random() < 0.3) continue;
        polygon(0.25 * Math.sqrt(3) * (q + r / 2), 0.375 * r, 0.22, 6, Math.PI / 6);
      }
  } else if (pattern === 'triangles') {
    for (let row = 0; row < 4; row++)
      for (let j = 0; j <= row; j++)
        polygon((j - row / 2) * 0.47, 0.8 - row * 0.43, 0.28, 3, Math.PI / 2);
    polygon(0, 0.05, 1.12, 3, Math.PI / 2);
  } else if (pattern === 'diamonds') {
    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++) polygon(x * 0.54, y * 0.54, 0.32, 4, 0);
    polygon(0, 0, 1.1, 4, Math.PI / 4);
  } else if (pattern === 'rings') {
    ring(1.04);
    ring(0.86);
    ring(0.48);
    polygon(0, 0, 0.42, 12, Math.PI / 12);
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      polygon(Math.cos(a) * 0.68, Math.sin(a) * 0.68, 0.065, 4, a);
    }
  } else if (pattern === 'petals') {
    ring(0.35, 32);
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      polygon(Math.cos(a) * 0.66, Math.sin(a) * 0.66, 0.38, 10, a, 0.8);
    }
  } else {
    polygon(0, 0, 0.4, 4, Math.PI / 4);
    for (let i = 0; i < 7; i++) {
      const a = (i * Math.PI * 2) / 7;
      polygon(
        Math.cos(a) * (0.65 + random() * 0.2),
        Math.sin(a) * (0.65 + random() * 0.2),
        0.24 + random() * 0.12,
        3,
        a,
        1.3,
      );
    }
  }
  const group = new THREE.Group(),
    wire = new THREE.BufferGeometry(),
    faces = new THREE.BufferGeometry();
  wire.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
  faces.setAttribute('position', new THREE.Float32BufferAttribute(fill, 3));
  group.add(
    new THREE.LineSegments(
      wire,
      new THREE.LineBasicMaterial({
        color: '#80f2ff',
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        toneMapped: false,
      }),
    ),
  );
  group.add(
    new THREE.Mesh(
      faces,
      new THREE.MeshBasicMaterial({
        color: '#50d7ef',
        transparent: true,
        opacity: 0.085,
        side: THREE.DoubleSide,
        forceSinglePass: true,
        depthWrite: false,
        toneMapped: false,
      }),
    ),
  );
  group.rotation.z = (random() - 0.5) * 0.6;
  group.userData.pattern = pattern;
  group.userData.serial = serial;
  group.userData.kind = 'shield-echo';
  return group;
}
