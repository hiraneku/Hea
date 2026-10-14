import * as THREE from 'three';

/**
 * Furrows ploughed by a body dragged across the arena floor. Instead of flat decals, each
 * drag gouges a strip whose cross-section is a dark trough with a raised ridge of lifted
 * earth on either side, laid section by section straight along the direction of travel. A
 * single dynamic mesh holds every section (ring buffer); ridges slump and the colour settles
 * back towards the ground over several seconds, so the arena remembers a slide without
 * accumulating geometry forever.
 */
interface Section {
  x: number;
  y: number;
  z: number;
  dirX: number;
  dirZ: number;
  width: number;
  ridge: number;
  age: number;
  life: number;
  furrow: number;
  /** 0 at the open end of a furrow (still forming), 1 once the drag has moved past it. */
  formed: number;
  /** Laying order, so consecutive sections of one furrow can be stitched. */
  serial: number;
}
const PROFILE = [-1.7, -1.05, -0.5, 0, 0.5, 1.05, 1.7] as const;
const HEIGHTS = [0, 1, 0.22, 0.04, 0.22, 1, 0] as const;
/** Linear-space vertex colours: ground-matched edges, tan lifted earth, a dark trough. */
const COLOURS = [
  [0.7, 0.71, 0.7],
  [0.27, 0.19, 0.125],
  [0.14, 0.1, 0.07],
  [0.06, 0.05, 0.042],
  [0.14, 0.1, 0.07],
  [0.27, 0.19, 0.125],
  [0.7, 0.71, 0.7],
] as const;
const GROUND_TINT = [0.7, 0.71, 0.7] as const;
const RING = PROFILE.length;

export class FurrowTrail {
  readonly mesh: THREE.Mesh;
  private readonly sections: Section[] = [];
  private readonly positions: Float32Array;
  private readonly normals: Float32Array;
  private readonly colours: Float32Array;
  private readonly indices: Uint32Array;
  private cursor = 0;
  private nextFurrow = 1;
  private readonly open = new Map<string, { furrow: number; index: number; since: number }>();
  private dirty = true;
  private groundAt = (_x: number, _z: number) => 0;
  constructor(private readonly capacity = 360) {
    this.positions = new Float32Array(capacity * RING * 3);
    this.normals = new Float32Array(capacity * RING * 3);
    this.colours = new Float32Array(capacity * RING * 3);
    this.indices = new Uint32Array(capacity * (RING - 1) * 6);
    for (let i = 0; i < capacity; i++)
      this.sections.push({
        x: 0,
        y: -1000,
        z: 0,
        dirX: 1,
        dirZ: 0,
        width: 0,
        ridge: 0,
        age: 0,
        life: 0,
        furrow: 0,
        formed: 0,
        serial: 0,
      });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage),
    );
    geometry.setAttribute(
      'normal',
      new THREE.BufferAttribute(this.normals, 3).setUsage(THREE.DynamicDrawUsage),
    );
    geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(this.colours, 3).setUsage(THREE.DynamicDrawUsage),
    );
    geometry.setIndex(new THREE.BufferAttribute(this.indices, 1).setUsage(THREE.DynamicDrawUsage));
    geometry.setDrawRange(0, 0);
    this.mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 1,
        metalness: 0,
        polygonOffset: true,
        polygonOffsetFactor: -1.5,
        polygonOffsetUnits: -1.5,
      }),
    );
    this.mesh.frustumCulled = false;
    this.mesh.receiveShadow = true;
    this.mesh.renderOrder = -1;
  }
  setGroundSampler(sampler: (x: number, z: number) => number) {
    this.groundAt = sampler;
  }
  /** Live (not yet settled) sections, for diagnostics. */
  get count() {
    return this.sections.filter((s) => s.life > 0).length;
  }
  /** Distinct furrows still standing. */
  get furrows() {
    return new Set(this.sections.filter((s) => s.life > 0).map((s) => s.furrow)).size;
  }
  /**
   * Advance the furrow ploughed by `actor` to `at`, travelling along `direction`. A new
   * section is laid every ~0.3 m; a pause or a jump of more than 1.6 m starts a fresh furrow
   * so the strip never bridges a gap the body flew over.
   */
  extend(
    actor: string,
    at: THREE.Vector3,
    direction: THREE.Vector3,
    scale: number,
    intensity: number,
    time: number,
  ) {
    const horizontal = Math.hypot(direction.x, direction.z);
    if (horizontal < 1e-4) return;
    const dirX = direction.x / horizontal,
      dirZ = direction.z / horizontal;
    const width = 0.6 * scale,
      ridge = (0.14 + 0.26 * intensity) * scale,
      life = 7 + 3 * intensity;
    const current = this.open.get(actor);
    let furrow = current?.furrow ?? 0,
      from: Section | null = null;
    if (current) {
      const last = this.sections[current.index];
      const gap = Math.hypot(at.x - last.x, at.z - last.z),
        elapsed = time - current.since,
        // A fast body covers metres between two calls: continuity is judged against the
        // distance its speed accounts for, not a fixed span.
        reach = Math.max(1.6 * scale, horizontal * Math.max(elapsed, 0.01) * 1.6 + 0.3);
      const continuous = last.furrow === current.furrow && elapsed < 0.3 && gap < reach;
      if (!continuous) furrow = 0;
      else if (gap < 0.3 * scale) {
        // Too close for a new section: drag the open end along instead.
        last.x = at.x;
        last.z = at.z;
        last.y = this.groundAt(at.x, at.z);
        last.dirX = dirX;
        last.dirZ = dirZ;
        last.ridge = Math.max(last.ridge, ridge);
        current.since = time;
        this.dirty = true;
        return;
      } else {
        last.formed = 1;
        from = last;
      }
    }
    if (!furrow) furrow = this.nextFurrow++;
    // A long stride is split into short sections so the strip follows the ground closely.
    const span = from ? Math.hypot(at.x - from.x, at.z - from.z) : 0,
      steps = from ? Math.min(8, Math.max(1, Math.ceil(span / (0.6 * scale)))) : 1;
    const startX = from ? from.x : at.x,
      startZ = from ? from.z : at.z;
    let index = this.cursor % this.capacity;
    for (let k = 1; k <= steps; k++) {
      const f = k / steps,
        x = startX + (at.x - startX) * f,
        z = startZ + (at.z - startZ) * f;
      index = this.cursor % this.capacity;
      const section = this.sections[index];
      section.serial = this.cursor++;
      section.x = x;
      section.z = z;
      section.y = this.groundAt(x, z);
      section.dirX = dirX;
      section.dirZ = dirZ;
      // A little deterministic unevenness: ploughed earth does not crumble to a straight edge.
      const grain = 0.86 + 0.28 * (((this.cursor * 7919) % 97) / 96);
      section.width = width * (0.94 + 0.12 * (((this.cursor * 104729) % 89) / 88));
      // The first section of a furrow starts flat: the ridges rise over the first metre.
      section.ridge = (from ? ridge : ridge * 0.25) * grain;
      section.age = 0;
      section.life = life;
      section.furrow = furrow;
      section.formed = k < steps ? 1 : 0;
    }
    this.open.set(actor, { furrow, index, since: time });
    this.dirty = true;
  }
  update(dt: number) {
    let alive = false;
    for (const s of this.sections) {
      if (s.life <= 0) continue;
      s.age += dt;
      s.life -= dt;
      alive = true;
      this.dirty = true;
      if (s.life <= 0) s.y = -1000;
    }
    if (!this.dirty) return;
    this.dirty = alive;
    this.rebuild();
  }
  private rebuild() {
    let triangles = 0;
    const p = this.positions,
      n = this.normals,
      c = this.colours;
    for (let i = 0; i < this.capacity; i++) {
      const s = this.sections[i],
        base = i * RING;
      if (s.life <= 0) {
        for (let j = 0; j < RING; j++) {
          p[(base + j) * 3 + 1] = -1000;
        }
        continue;
      }
      // Settling: ridges slump and the trough fades towards the ground colour at the end.
      const settle = Math.min(1, s.life / 3),
        slump = 0.25 + 0.75 * settle,
        shape = s.formed ? 1 : 0.45,
        ridge = s.ridge * slump * shape,
        sideX = -s.dirZ,
        sideZ = s.dirX;
      for (let j = 0; j < RING; j++) {
        const u = PROFILE[j] * s.width,
          h = HEIGHTS[j] * ridge + (j === 0 || j === RING - 1 ? 0.012 : 0.03),
          x = s.x + sideX * u,
          z = s.z + sideZ * u,
          ground = j === 0 || j === RING - 1 ? this.groundAt(x, z) : s.y,
          v = (base + j) * 3;
        p[v] = x;
        p[v + 1] = ground + h;
        p[v + 2] = z;
        // Cross-section slope gives the lighting that makes the lifted edges read as 3D.
        const hl = HEIGHTS[Math.max(0, j - 1)] * ridge,
          hr = HEIGHTS[Math.min(RING - 1, j + 1)] * ridge,
          du = (PROFILE[Math.min(RING - 1, j + 1)] - PROFILE[Math.max(0, j - 1)]) * s.width,
          slope = du > 0 ? (hr - hl) / du : 0,
          length = Math.hypot(slope, 1);
        n[v] = (-slope / length) * sideX;
        n[v + 1] = 1 / length;
        n[v + 2] = (-slope / length) * sideZ;
        const tint = COLOURS[j],
          blend = settle * (0.55 + 0.45 * shape);
        c[v] = GROUND_TINT[0] + (tint[0] - GROUND_TINT[0]) * blend;
        c[v + 1] = GROUND_TINT[1] + (tint[1] - GROUND_TINT[1]) * blend;
        c[v + 2] = GROUND_TINT[2] + (tint[2] - GROUND_TINT[2]) * blend;
      }
    }
    // Stitch consecutive sections of the same furrow, in the order they were laid.
    const order = this.sections
      .map((s, i) => ({ s, i }))
      .filter((e) => e.s.life > 0)
      .sort((a, b) => a.s.serial - b.s.serial);
    for (let k = 1; k < order.length; k++) {
      const a = order[k - 1],
        b = order[k];
      if (a.s.furrow !== b.s.furrow) continue;
      for (let j = 0; j < RING - 1; j++) {
        const a0 = a.i * RING + j,
          a1 = a0 + 1,
          b0 = b.i * RING + j,
          b1 = b0 + 1,
          t = triangles * 3;
        // Counter-clockwise seen from above, so the single-sided strip faces the sky.
        this.indices[t] = a0;
        this.indices[t + 1] = a1;
        this.indices[t + 2] = b0;
        this.indices[t + 3] = a1;
        this.indices[t + 4] = b1;
        this.indices[t + 5] = b0;
        triangles += 2;
      }
    }
    const geometry = this.mesh.geometry;
    geometry.setDrawRange(0, triangles * 3);
    (geometry.index as THREE.BufferAttribute).needsUpdate = true;
    for (const attribute of Object.values(geometry.attributes))
      (attribute as THREE.BufferAttribute).needsUpdate = true;
  }
  clear() {
    for (const s of this.sections) {
      s.life = 0;
      s.y = -1000;
    }
    this.open.clear();
    this.dirty = true;
    this.rebuild();
  }
  dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
