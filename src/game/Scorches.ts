import * as THREE from 'three';
import { seededRandom } from './math';

/** Grid resolution of one draped scorch patch (GRID × GRID quads). */
const GRID = 4;
const VERTS = (GRID + 1) * (GRID + 1);
const TRIS = GRID * GRID * 2;

interface Scorch {
  x: number;
  z: number;
  radius: number;
  born: number;
  life: number;
  /** Peak darkening at the centre, 0–1. */
  strength: number;
  seed: number;
  live: boolean;
}

/**
 * Burn marks where fire reaches the ground: soft, ragged dark discs draped over the terrain
 * that hold for a few seconds and then bleach away. One multiply-blended mesh for the whole
 * pool — a mark darkens whatever is under it (grass, dust, a crater wall) and fading is just
 * the vertex colour sliding back to white, so there is nothing to sort and nothing to flicker.
 */
export class ScorchMarks {
  readonly mesh: THREE.Mesh;
  private readonly marks: Scorch[] = [];
  private readonly positions: Float32Array;
  private readonly colours: Float32Array;
  private cursor = 0;
  private groundAt = (_x: number, _z: number) => 0;
  constructor(private readonly capacity = 48) {
    this.positions = new Float32Array(capacity * VERTS * 3);
    this.colours = new Float32Array(capacity * VERTS * 3).fill(1);
    const indices = new Uint32Array(capacity * TRIS * 3);
    for (let m = 0; m < capacity; m++) {
      this.marks.push({
        x: 0,
        z: 0,
        radius: 0,
        born: 0,
        life: 0,
        strength: 0,
        seed: 0,
        live: false,
      });
      const base = m * VERTS;
      let k = m * TRIS * 3;
      for (let j = 0; j < GRID; j++)
        for (let i = 0; i < GRID; i++) {
          const a = base + j * (GRID + 1) + i,
            b = a + 1,
            c = a + GRID + 1,
            d = c + 1;
          indices[k++] = a;
          indices[k++] = c;
          indices[k++] = b;
          indices[k++] = b;
          indices[k++] = c;
          indices[k++] = d;
        }
      // Parked far below the arena until used.
      for (let v = 0; v < VERTS; v++) this.positions[(base + v) * 3 + 1] = -1000;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage),
    );
    geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(this.colours, 3).setUsage(THREE.DynamicDrawUsage),
    );
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    this.mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        blending: THREE.MultiplyBlending,
        // three r180 implements multiply as dst·src + dst·(1 − a) and insists on premultiplied
        // alpha; drawn after the terrain it darkens (transparent pass), but first among the
        // transparent objects so sparks and shields still composite on top.
        premultipliedAlpha: true,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
        toneMapped: false,
      }),
    );
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1;
  }
  setGroundSampler(sampler: (x: number, z: number) => number) {
    this.groundAt = sampler;
  }
  /** Marks still visible, for diagnostics. */
  get count() {
    return this.marks.filter((m) => m.live).length;
  }
  /** Lay a mark of `radius` metres at (x, z); it stays `life` seconds, fading over the last 40 %. */
  add(x: number, z: number, radius: number, life: number, time: number, strength = 0.74) {
    const slot = this.cursor++ % this.capacity,
      mark = this.marks[slot];
    mark.x = x;
    mark.z = z;
    mark.radius = radius;
    mark.born = time;
    mark.life = life;
    mark.strength = strength;
    mark.seed = this.cursor * 97 + Math.floor(x * 13 + z * 7);
    mark.live = true;
    const random = seededRandom(mark.seed),
      base = slot * VERTS;
    for (let j = 0; j <= GRID; j++)
      for (let i = 0; i <= GRID; i++) {
        const u = (i / GRID) * 2 - 1,
          v = (j / GRID) * 2 - 1,
          // A ragged outline: the rim wanders ±25 %, the inside stays put.
          ragged = 1 + (random() - 0.5) * 0.5 * Math.min(1, Math.hypot(u, v)),
          px = x + u * radius * ragged,
          pz = z + v * radius * ragged,
          o = (base + j * (GRID + 1) + i) * 3;
        this.positions[o] = px;
        this.positions[o + 1] = this.groundAt(px, pz) + 0.035;
        this.positions[o + 2] = pz;
      }
    this.paint(slot, 1);
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.attributes.color.needsUpdate = true;
  }
  private paint(slot: number, fade: number) {
    const mark = this.marks[slot],
      base = slot * VERTS;
    for (let j = 0; j <= GRID; j++)
      for (let i = 0; i <= GRID; i++) {
        const u = (i / GRID) * 2 - 1,
          v = (j / GRID) * 2 - 1,
          d = Math.min(1, Math.hypot(u, v)),
          // Broad dark core, soft shoulder, clean rim.
          core = (1 - d * d) * (1 - 0.45 * d * d),
          dark = mark.strength * core * fade,
          o = (base + j * (GRID + 1) + i) * 3;
        // Warm soot: a little less red absorbed than blue, so the mark reads brown-black.
        this.colours[o] = 1 - dark * 0.88;
        this.colours[o + 1] = 1 - dark * 0.95;
        this.colours[o + 2] = 1 - dark;
      }
  }
  update(time: number) {
    let dirty = false;
    for (let slot = 0; slot < this.capacity; slot++) {
      const mark = this.marks[slot];
      if (!mark.live) continue;
      const age = time - mark.born,
        remaining = mark.life - age;
      if (remaining <= 0) {
        this.retire(slot);
        dirty = true;
        continue;
      }
      const tail = mark.life * 0.4;
      if (remaining < tail) {
        const k = remaining / tail;
        this.paint(slot, k * k);
        dirty = true;
      }
    }
    if (dirty) this.mesh.geometry.attributes.color.needsUpdate = true;
  }
  private retire(slot: number) {
    const mark = this.marks[slot],
      base = slot * VERTS;
    mark.live = false;
    for (let v = 0; v < VERTS; v++) {
      const o = (base + v) * 3;
      this.positions[o + 1] = -1000;
      this.colours[o] = this.colours[o + 1] = this.colours[o + 2] = 1;
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
  }
  clear() {
    for (let slot = 0; slot < this.capacity; slot++) if (this.marks[slot].live) this.retire(slot);
    this.mesh.geometry.attributes.color.needsUpdate = true;
  }
}
