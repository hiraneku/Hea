import * as THREE from 'three';
import type { Effects } from './Effects';
import { clamp, seededRandom, segmentBox, type Obstacle } from './math';

const MIN_RANGE = 6;
const MAX_RANGE = 18;
const START_OFFSET = 2.4;
const SPIKE_WIDTH = 2.05;
const SPIKE_DEPTH = 1.75;
const MAX_SPIKES_PER_LINE = 7;
const RISE_TIME = 0.48;
const SEQUENTIAL_DELAY = 0.14;
const SPIKE_HEALTH = 72;
const SPIKE_DARK = new THREE.Color('#44392b');

export interface SpikeLine {
  id: number;
  hasStruckBoss: boolean;
}

interface StoneSpike {
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  obstacle: Obstacle;
  base: THREE.Color;
  line: SpikeLine;
  age: number;
  delay: number;
  height: number;
  width: number;
  depth: number;
  health: number;
  solid: boolean;
  started: boolean;
}

export interface StoneSpikeHost {
  groundAt: (x: number, z: number) => number;
  candidates: (start: THREE.Vector3, end: THREE.Vector3, padding: number) => Obstacle[];
  addObstacles: (obstacles: Obstacle[]) => void;
  removeObstacles: (obstacles: Obstacle[]) => void;
  onErupt: (obstacle: Obstacle, line: SpikeLine) => void;
}

type SpikeEffects = Pick<Effects, 'dust' | 'debris' | 'impact'>;

function smooth01(value: number) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

/** A broad, rough low-poly stalagmite with an irregular base and an off-centre tip. */
function spireGeometry(seed: number) {
  const random = seededRandom(seed);
  const sides = 7;
  const rings = [
    { y: 0, radius: 0.52 },
    { y: 0.24, radius: 0.49 },
    { y: 0.59, radius: 0.34 },
    { y: 0.84, radius: 0.19 },
  ];
  const positions: number[] = [];
  for (let ring = 0; ring < rings.length; ring++) {
    const { y, radius } = rings[ring];
    const offset = ring % 2 ? 0.13 : 0;
    for (let side = 0; side < sides; side++) {
      const angle = (side / sides) * Math.PI * 2 + offset;
      const uneven = 0.82 + random() * 0.34;
      positions.push(
        Math.cos(angle) * radius * uneven + (random() - 0.5) * 0.08,
        y + (random() - 0.5) * (ring === 0 ? 0.025 : 0.05),
        Math.sin(angle) * radius * uneven + (random() - 0.5) * 0.08,
      );
    }
  }
  const tip = sides * rings.length;
  positions.push((random() - 0.5) * 0.22, 1, (random() - 0.5) * 0.22);
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
  for (let side = 0; side < sides; side++)
    indices.push(lastRing + side, tip, lastRing + ((side + 1) % sides));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function footprint(center: THREE.Vector3, forward: THREE.Vector3, width: number, depth: number) {
  const side = new THREE.Vector3(-forward.z, 0, forward.x);
  const corners: THREE.Vector3[] = [];
  for (const x of [-1, 1])
    for (const z of [-1, 1])
      corners.push(
        center
          .clone()
          .addScaledVector(side, (width / 2) * x)
          .addScaledVector(forward, (depth / 2) * z),
      );
  return {
    minX: Math.min(...corners.map((point) => point.x)),
    maxX: Math.max(...corners.map((point) => point.x)),
    minZ: Math.min(...corners.map((point) => point.z)),
    maxZ: Math.max(...corners.map((point) => point.z)),
  };
}

/**
 * Raised stone spikes for the Batu spell. Each cast leaves a chain of independent, solid
 * stalagmites in the world; their hitboxes remain registered until broken or the duel resets.
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
      position: spike.mesh.position.toArray(),
      health: spike.health,
      solid: spike.solid,
      bounds: { ...spike.obstacle },
      line: spike.line.id,
    }));
  }

  /**
   * Raise one medium-range row from the player's current ground position toward the aim. A
   * nearby wall shortens the row so the stones never grow through the city geometry.
   */
  cast(player: THREE.Vector3, aim: THREE.Vector3, targetDistance: number) {
    const forward = new THREE.Vector3(aim.x, 0, aim.z);
    if (forward.lengthSq() < 1e-6 || targetDistance < MIN_RANGE) return 0;
    forward.normalize();
    let range = clamp(targetDistance - 1.5, MIN_RANGE, MAX_RANGE);
    const origin = player.clone();
    const start = origin.clone().addScaledVector(forward, START_OFFSET);
    start.y = this.host.groundAt(start.x, start.z) + 1.05;
    const end = origin.clone().addScaledVector(forward, range);
    end.y = this.host.groundAt(end.x, end.z) + 1.05;
    for (const obstacle of this.host.candidates(start, end, SPIKE_WIDTH * 0.4)) {
      const hit = segmentBox(start, end, obstacle, SPIKE_WIDTH * 0.3);
      if (hit === null || hit < 0.02) continue;
      range = Math.min(range, START_OFFSET + (range - START_OFFSET) * hit - 0.7);
    }
    range = Math.max(START_OFFSET + 1.2, range);
    const spacing = 2.55;
    const count = clamp(Math.ceil((range - START_OFFSET) / spacing) + 1, 2, MAX_SPIKES_PER_LINE);
    const line: SpikeLine = { id: this.nextLine++, hasStruckBoss: false };
    const newSpikes: StoneSpike[] = [];
    const random = seededRandom(line.id * 7919);

    for (let index = 0; index < count; index++) {
      const t = index / (count - 1);
      const along = THREE.MathUtils.lerp(START_OFFSET, range, t);
      const position = origin.clone().addScaledVector(forward, along);
      const ground = this.host.groundAt(position.x, position.z);
      const width = SPIKE_WIDTH * (0.88 + random() * 0.22);
      const depth = SPIKE_DEPTH * (0.9 + random() * 0.18);
      const height = 3.65 + random() * 0.75;
      const bounds = footprint(position, forward, width, depth);
      const obstacle: Obstacle = {
        ...bounds,
        bottom: ground,
        top: ground + height,
      };
      const base = new THREE.Color().setHSL(0.095 + random() * 0.025, 0.22, 0.35 + random() * 0.08);
      const material = new THREE.MeshStandardMaterial({
        color: base,
        roughness: 0.97,
        flatShading: true,
      });
      const mesh = new THREE.Mesh(spireGeometry(line.id * 101 + index), material);
      mesh.name = `stone-stalagmite-${line.id}-${index}`;
      mesh.position.set(position.x, ground - height, position.z);
      mesh.rotation.y = Math.atan2(forward.x, forward.z) + (random() - 0.5) * 0.18;
      mesh.scale.set(width, height, depth);
      mesh.castShadow = mesh.receiveShadow = true;
      this.scene.add(mesh);
      newSpikes.push({
        mesh,
        obstacle,
        base,
        line,
        age: 0,
        delay: index * SEQUENTIAL_DELAY,
        height,
        width,
        depth,
        health: SPIKE_HEALTH,
        solid: false,
        started: false,
      });
    }
    this.spikes.push(...newSpikes);
    return newSpikes.length;
  }

  update(dt: number) {
    const becomeSolid: Obstacle[] = [];
    for (const spike of this.spikes) {
      spike.age += dt;
      const phase = clamp((spike.age - spike.delay) / RISE_TIME, 0, 1);
      if (phase <= 0) continue;
      if (!spike.started) {
        spike.started = true;
        const ground = spike.obstacle.bottom ?? 0;
        const base = new THREE.Vector3(spike.mesh.position.x, ground, spike.mesh.position.z);
        this.fx.dust(base, 11, 1.5, new THREE.Vector3(0, 3.2, 0));
      }
      const rise = smooth01(phase);
      spike.mesh.position.y = (spike.obstacle.bottom ?? 0) - spike.height * (1 - rise);
      const scale = 0.82 + 0.18 * rise;
      spike.mesh.scale.set(spike.width * scale, spike.height, spike.depth * scale);
      if (phase < 1 || spike.solid) continue;
      spike.solid = true;
      becomeSolid.push(spike.obstacle);
      const base = new THREE.Vector3(
        spike.mesh.position.x,
        spike.obstacle.bottom ?? 0,
        spike.mesh.position.z,
      );
      this.fx.debris(base, 5, 2.4, 0.8, new THREE.Vector3(0, 1.6, 0));
      this.host.onErupt(spike.obstacle, spike.line);
    }
    if (becomeSolid.length) this.host.addObstacles(becomeSolid);
  }

  /** Applies damage to a registered spike and reports whether it cracked or was destroyed. */
  hit(
    obstacle: Obstacle,
    amount: number,
    at: THREE.Vector3,
    force: THREE.Vector3,
  ): 'unknown' | 'damaged' | 'destroyed' {
    const spike = this.spikes.find((candidate) => candidate.obstacle === obstacle);
    if (!spike || !spike.solid) return 'unknown';
    spike.health -= Math.max(1, amount);
    const lost = 1 - clamp(spike.health / SPIKE_HEALTH, 0, 1);
    spike.mesh.material.color.copy(spike.base).lerp(SPIKE_DARK, lost * 0.68);
    spike.mesh.material.emissive.set('#6e4b2e');
    spike.mesh.material.emissiveIntensity = 0.3 + lost * 0.35;
    this.fx.impact(at, '#c8aa7b', false, 0.75);
    if (spike.health <= 0) {
      this.destroy(spike, at, force);
      return 'destroyed';
    }
    return 'damaged';
  }

  /** A high-speed player/boss body impact can break the wall segment it strikes. */
  impact(obstacle: Obstacle, at: THREE.Vector3, force: THREE.Vector3, power: number) {
    return this.hit(obstacle, power, at, force);
  }

  private destroy(spike: StoneSpike, at: THREE.Vector3, force: THREE.Vector3) {
    if (spike.solid) this.host.removeObstacles([spike.obstacle]);
    this.scene.remove(spike.mesh);
    spike.mesh.geometry.dispose();
    spike.mesh.material.dispose();
    this.fx.debris(at, 18, 5.5, 1.5, force);
    this.fx.dust(at, 12, 2.2, force);
    this.spikes = this.spikes.filter((candidate) => candidate !== spike);
  }

  reset() {
    const solid = this.spikes.filter((spike) => spike.solid).map((spike) => spike.obstacle);
    if (solid.length) this.host.removeObstacles(solid);
    for (const spike of this.spikes) {
      this.scene.remove(spike.mesh);
      spike.mesh.geometry.dispose();
      spike.mesh.material.dispose();
    }
    this.spikes = [];
    this.nextLine = 1;
  }

  dispose() {
    this.reset();
  }
}
