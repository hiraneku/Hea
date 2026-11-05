import * as THREE from 'three';
import type { Effects } from './Effects';
import { DestructibleVolume } from './destruction';
import { clamp, seededRandom, segmentBox, type Obstacle, type Point3 } from './math';

const MIN_RANGE = 6.5;
const MAX_RANGE = 30;
const START_OFFSET = 2.6;
const SPIKE_WIDTH = 6.2;
const SPIKE_DEPTH = 5.4;
const CELL_SIZE = 0.82;
const RISE_TIME = 0.28;
const ROOT_BURY = 1.35;

export interface SpikeLine {
  id: number;
  hasStruckBoss: boolean;
}

interface StoneSpike {
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  volume: DestructibleVolume;
  line: SpikeLine;
  owner: number;
  base: THREE.Vector3;
  root: THREE.Vector3;
  tip: THREE.Vector3;
  axis: THREE.Vector3;
  solidLength: number;
  width: number;
  depth: number;
  radius: number;
  length: number;
  age: number;
  solid: boolean;
}

export interface StoneSpikeHost {
  groundAt: (x: number, z: number) => number;
  candidates: (start: THREE.Vector3, end: THREE.Vector3, padding: number) => Obstacle[];
  addWall: (mesh: THREE.Mesh, volume: DestructibleVolume) => void;
  removeWalls: (owners: number[]) => void;
  hasWall: (owner: number) => boolean;
  onEmerge: (
    spike: { base: THREE.Vector3; tip: THREE.Vector3; radius: number },
    line: SpikeLine,
  ) => void;
}

type SpikeEffects = Pick<Effects, 'dust' | 'debris'>;

function thrustEase(value: number) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return 1 - (1 - t) ** 3;
}

/** Broad, faceted stone lance with a buried root and full shoulders; local Y follows the cast. */
function spireGeometry(seed: number) {
  const random = seededRandom(seed);
  const sides = 10;
  const rings = [
    { y: 0, radius: 0.4 },
    { y: 0.025, radius: 0.54 },
    { y: 0.075, radius: 0.58 },
    { y: 0.14, radius: 0.51 },
    { y: 0.32, radius: 0.43 },
    { y: 0.55, radius: 0.34 },
    { y: 0.75, radius: 0.24 },
    { y: 0.9, radius: 0.14 },
    { y: 0.97, radius: 0.065 },
  ];
  const positions: number[] = [];
  const colors: number[] = [];
  for (let ring = 0; ring < rings.length; ring++) {
    const { y, radius } = rings[ring];
    const offset = ring % 2 ? 0.09 : 0;
    const stoneTone = 0.92 + random() * 0.18;
    for (let side = 0; side < sides; side++) {
      const angle = (side / sides) * Math.PI * 2 + offset;
      const uneven = 0.94 + random() * 0.13;
      positions.push(
        Math.cos(angle) * radius * uneven + (random() - 0.5) * 0.018,
        y + (random() - 0.5) * 0.008,
        Math.sin(angle) * radius * uneven + (random() - 0.5) * 0.018,
      );
      colors.push(stoneTone, stoneTone * (0.98 + random() * 0.04), stoneTone * 0.92);
    }
  }
  const tip = sides * rings.length;
  positions.push((random() - 0.5) * 0.025, 1, (random() - 0.5) * 0.025);
  colors.push(1, 0.97, 0.9);
  const bottomCenter = positions.length / 3;
  positions.push(0, 0, 0);
  colors.push(0.88, 0.85, 0.79);
  const indices: number[] = [];
  for (let ring = 0; ring < rings.length - 1; ring++)
    for (let side = 0; side < sides; side++) {
      const a = ring * sides + side;
      const b = ring * sides + ((side + 1) % sides);
      const c = (ring + 1) * sides + side;
      const d = (ring + 1) * sides + ((side + 1) % sides);
      indices.push(a, c, b, b, c, d);
    }
  const lastRing = (rings.length - 1) * sides;
  for (let side = 0; side < sides; side++) {
    const next = (side + 1) % sides;
    indices.push(lastRing + side, tip, lastRing + next);
    indices.push(bottomCenter, next, side);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function structureBounds(
  base: THREE.Vector3,
  axis: THREE.Vector3,
  right: THREE.Vector3,
  side: THREE.Vector3,
  length: number,
  width: number,
  depth: number,
): Obstacle {
  const points: THREE.Vector3[] = [];
  for (const t of [0, length])
    for (const x of [-1, 1])
      for (const z of [-1, 1])
        points.push(
          base
            .clone()
            .addScaledVector(axis, t)
            .addScaledVector(right, x * width * 0.52)
            .addScaledVector(side, z * depth * 0.52),
        );
  return {
    minX: Math.min(...points.map((point) => point.x)),
    maxX: Math.max(...points.map((point) => point.x)),
    minZ: Math.min(...points.map((point) => point.z)),
    maxZ: Math.max(...points.map((point) => point.z)),
    bottom: Math.min(...points.map((point) => point.y)),
    top: Math.max(...points.map((point) => point.y)),
  };
}

function spikeCellMask(
  root: THREE.Vector3,
  axis: THREE.Vector3,
  right: THREE.Vector3,
  side: THREE.Vector3,
  length: number,
  width: number,
  depth: number,
) {
  return (point: Point3) => {
    const fromRoot = new THREE.Vector3(point.x, point.y, point.z).sub(root);
    const along = fromRoot.dot(axis);
    if (along < 0 || along > length) return false;
    const taper = 1 - 0.82 * (along / length);
    // A small conservative margin makes the voxel collider meet at cell edges instead of
    // leaving hairline walk-through gaps between the visual stone and its collision skin.
    const x = fromRoot.dot(right) / (width * 0.54 * taper);
    const z = fromRoot.dot(side) / (depth * 0.54 * taper);
    return x * x + z * z <= 1.06;
  };
}

/**
 * Each cast creates one huge leaning spear that grows out from near the caster toward the aim.
 * Its voxel mask, hit response, fragments and collider lifetime use the arena wall system.
 */
export class StoneSpikes {
  private spikes: StoneSpike[] = [];
  private nextLine = 1;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly host: StoneSpikeHost,
    private readonly fx: SpikeEffects,
  ) {}

  get count() {
    return this.spikes.length;
  }

  get diagnostics() {
    return this.spikes.map((spike) => ({
      position: spike.base.toArray(),
      tip: spike.tip.toArray(),
      length: spike.length,
      solid: spike.solid,
      damaged: spike.volume.aliveCount < spike.volume.initialAliveCount,
      cellsAlive: spike.volume.aliveCount,
      cellsTotal: spike.volume.initialAliveCount,
      meshVisible: spike.mesh.visible,
      bounds: { ...spike.volume.bounds },
      line: spike.line.id,
    }));
  }

  /** Create one long stone spear, with its base beside the caster and its tip aimed downrange. */
  cast(player: THREE.Vector3, aim: THREE.Vector3, targetDistance: number) {
    const forward = new THREE.Vector3(aim.x, 0, aim.z);
    if (forward.lengthSq() < 1e-6 || targetDistance < MIN_RANGE + START_OFFSET + 0.8) return 0;
    forward.normalize();
    const slope = clamp(aim.y / Math.max(0.001, Math.hypot(aim.x, aim.z)), 0.32, 0.5);
    const axis = forward
      .clone()
      .addScaledVector(new THREE.Vector3(0, 1, 0), slope)
      .normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion).normalize();
    const side = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion).normalize();
    const base = player.clone().addScaledVector(forward, START_OFFSET);
    const ground = this.host.groundAt(base.x, base.z);
    base.y = ground + 0.03;
    let horizontalReach = clamp(
      targetDistance - START_OFFSET - 0.8,
      MIN_RANGE,
      MAX_RANGE - START_OFFSET,
    );
    let length = horizontalReach / Math.hypot(axis.x, axis.z);
    const castStart = base.clone().addScaledVector(axis, 0.2);
    const castEnd = base.clone().addScaledVector(axis, length);
    for (const obstacle of this.host.candidates(castStart, castEnd, SPIKE_WIDTH * 0.3)) {
      const hit = segmentBox(castStart, castEnd, obstacle, SPIKE_WIDTH * 0.2);
      if (hit === null || hit < 0.03) continue;
      length = Math.min(length, length * hit - 0.8);
    }
    horizontalReach = length * Math.hypot(axis.x, axis.z);
    if (horizontalReach < MIN_RANGE) return 0;

    const id = this.nextLine++;
    const line: SpikeLine = { id, hasStruckBoss: false };
    const tip = base.clone().addScaledVector(axis, length);
    const root = base.clone().addScaledVector(axis, -ROOT_BURY);
    const solidLength = length + ROOT_BURY;
    const width = SPIKE_WIDTH;
    const depth = SPIKE_DEPTH;
    const radius = Math.max(width, depth) * 0.54;
    const bounds = structureBounds(root, axis, right, side, solidLength, width, depth);
    // Sink the shoulder well below the floor so the emerging stone never has an open-looking
    // cut end at ground level; keep a little buried volume for continuous collision support.
    bounds.bottom = Math.max(ground - 0.28, bounds.bottom ?? ground);
    const owner = -id;
    const volume = new DestructibleVolume(
      bounds,
      owner,
      CELL_SIZE,
      spikeCellMask(root, axis, right, side, solidLength, width, depth),
    );
    const random = seededRandom(id * 7919);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.095 + random() * 0.025, 0.17, 0.42 + random() * 0.035),
      roughness: 0.94,
      flatShading: true,
      vertexColors: true,
    });
    const mesh = new THREE.Mesh(spireGeometry(id * 101), material);
    mesh.name = `stone-spear-${id}`;
    mesh.position.copy(root);
    mesh.quaternion.copy(quaternion);
    mesh.scale.set(width, 0.01, depth);
    mesh.castShadow = mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.fx.dust(base, 8, 1.4, axis.clone().multiplyScalar(4));
    this.spikes.push({
      mesh,
      volume,
      line,
      owner,
      base,
      root,
      tip,
      axis,
      solidLength,
      width,
      depth,
      radius,
      length,
      age: 0,
      solid: false,
    });
    return 1;
  }

  update(dt: number) {
    for (const spike of [...this.spikes]) {
      if (spike.solid) {
        if (!this.host.hasWall(spike.owner)) this.remove(spike);
        continue;
      }
      spike.age += dt;
      const phase = clamp(spike.age / RISE_TIME, 0, 1);
      const growth = thrustEase(phase);
      spike.mesh.scale.set(spike.width, Math.max(0.01, spike.solidLength * growth), spike.depth);
      if (phase < 1) continue;
      spike.solid = true;
      this.host.addWall(spike.mesh, spike.volume);
      this.fx.dust(spike.base, 26, 3.2, spike.axis.clone().multiplyScalar(3.4));
      this.host.onEmerge(
        { base: spike.base.clone(), tip: spike.tip.clone(), radius: spike.radius },
        spike.line,
      );
    }
  }

  private remove(spike: StoneSpike) {
    this.scene.remove(spike.mesh);
    spike.mesh.geometry.dispose();
    spike.mesh.material.dispose();
    this.spikes = this.spikes.filter((candidate) => candidate !== spike);
  }

  reset() {
    const owners = this.spikes.filter((spike) => spike.solid).map((spike) => spike.owner);
    if (owners.length) this.host.removeWalls(owners);
    for (const spike of this.spikes) this.remove(spike);
    this.nextLine = 1;
  }

  dispose() {
    this.reset();
  }
}
