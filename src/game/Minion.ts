import * as THREE from 'three';
import { SUMMON } from './combat';
import { ARENA } from './config';
import { clamp, seededRandom, segmentSphere } from './math';

/** What a shade needs from the duel around it. Implemented by Game. */
export interface MinionHost {
  /** Chest position of the player right now. */
  playerChest(): THREE.Vector3;
  /** Player velocity, for a short aiming lead on the spit. */
  playerVelocity(): THREE.Vector3;
  /** Fire one small straight fireball from `at` (no homing, weaker than the boss's fire). */
  shoot(at: THREE.Vector3, velocity: THREE.Vector3): void;
  /** Push a flying body at `position` out of solid scenery. */
  collide(position: THREE.Vector3, radius: number): void;
  groundHeight(x: number, z: number): number;
}

interface Member {
  group: THREE.Group;
  core: THREE.Mesh;
  coreMaterial: THREE.MeshStandardMaterial;
  halo: THREE.Mesh;
  shards: THREE.Mesh[];
  velocity: THREE.Vector3;
  health: number;
  angle: number;
  orbitRadius: number;
  orbitDirection: 1 | -1;
  hoverPhase: number;
  shotTimer: number;
  dashTimer: number;
  flash: number;
  age: number;
}

const coreGeometry = new THREE.OctahedronGeometry(0.34);
const haloGeometry = new THREE.RingGeometry(0.5, 0.63, 28);
const shardGeometry = new THREE.TetrahedronGeometry(0.13);

/**
 * The lesser shades of the `summon` pattern: small, quick fliers that circle the player,
 * dash sideways to fresh angles, and spit small straight fireballs — like the boss's own
 * fire, but with no homing in them and half the bite. They fight on while the boss is
 * busy (even while FALL holds it down); only killing them, or the boss, clears them.
 */
export class MinionSwarm {
  private members: Member[] = [];
  private random = seededRandom(9176);
  private elapsed = 0;

  constructor(private scene: THREE.Scene) {}

  get alive(): number {
    return this.members.length;
  }

  /** Live body positions (the group origins), cheapest first. For tests and debugging. */
  get positions(): THREE.Vector3[] {
    return this.members.map((m) => m.group.position);
  }

  /** Call shades up to the full count around `center`; returns where each new one appeared. */
  summon(center: THREE.Vector3): THREE.Vector3[] {
    const spawned: THREE.Vector3[] = [];
    while (this.members.length < SUMMON.count) {
      const i = this.members.length,
        angle = (i / SUMMON.count) * Math.PI * 2 + this.random() * 0.8,
        at = center
          .clone()
          .add(new THREE.Vector3(Math.cos(angle) * 2.6, 1.6 + i * 0.5, Math.sin(angle) * 2.6));
      const coreMaterial = new THREE.MeshStandardMaterial({
        color: '#2a1650',
        emissive: '#8a5cff',
        emissiveIntensity: 1.5,
        roughness: 0.35,
        metalness: 0.1,
      });
      const core = new THREE.Mesh(coreGeometry, coreMaterial);
      const halo = new THREE.Mesh(
        haloGeometry,
        new THREE.MeshBasicMaterial({
          color: '#b78cff',
          transparent: true,
          opacity: 0.55,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      halo.rotation.x = Math.PI / 2;
      const shards: THREE.Mesh[] = [];
      const group = new THREE.Group();
      group.add(core, halo);
      for (let s = 0; s < 2; s++) {
        const shard = new THREE.Mesh(
          shardGeometry,
          new THREE.MeshStandardMaterial({
            color: '#1c0f38',
            emissive: '#6a3df0',
            emissiveIntensity: 1.1,
            roughness: 0.4,
          }),
        );
        shards.push(shard);
        group.add(shard);
      }
      group.position.copy(at);
      this.scene.add(group);
      this.members.push({
        group,
        core,
        coreMaterial,
        halo,
        shards,
        velocity: new THREE.Vector3(),
        health: SUMMON.health,
        angle: this.random() * Math.PI * 2,
        orbitRadius:
          SUMMON.orbitRadius.min +
          this.random() * (SUMMON.orbitRadius.max - SUMMON.orbitRadius.min),
        orbitDirection: this.random() < 0.5 ? -1 : 1,
        hoverPhase: this.random() * Math.PI * 2,
        shotTimer: 1 + i * 0.8 + this.random() * 0.5,
        dashTimer:
          SUMMON.dashInterval.min +
          this.random() * (SUMMON.dashInterval.max - SUMMON.dashInterval.min),
        flash: 0,
        age: 0,
      });
      spawned.push(at);
    }
    return spawned;
  }

  update(dt: number, host: MinionHost) {
    this.elapsed += dt;
    const chest = host.playerChest();
    for (const m of this.members) {
      m.age += dt;
      // Circle the player, drifting tangentially; every few seconds, dash to a fresh
      // angle and height so the swarm never settles into a rhythm that can be ignored.
      m.angle += (m.orbitDirection * SUMMON.strafeSpeed * dt) / m.orbitRadius;
      m.dashTimer -= dt;
      if (m.dashTimer <= 0) {
        m.dashTimer =
          SUMMON.dashInterval.min +
          this.random() * (SUMMON.dashInterval.max - SUMMON.dashInterval.min);
        m.orbitDirection = this.random() < 0.5 ? -1 : 1;
        m.orbitRadius =
          SUMMON.orbitRadius.min +
          this.random() * (SUMMON.orbitRadius.max - SUMMON.orbitRadius.min);
        const tangent = new THREE.Vector3(
          -Math.sin(m.angle) * m.orbitDirection,
          0,
          Math.cos(m.angle) * m.orbitDirection,
        );
        m.velocity.addScaledVector(tangent, SUMMON.dashSpeed * 0.7);
        m.velocity.y += (this.random() - 0.3) * 5;
      }
      const anchor = new THREE.Vector3(
        chest.x + Math.cos(m.angle) * m.orbitRadius,
        0,
        chest.z + Math.sin(m.angle) * m.orbitRadius,
      );
      anchor.x = clamp(anchor.x, -ARENA.halfSize + 3, ARENA.halfSize - 3);
      anchor.z = clamp(anchor.z, -ARENA.halfSize + 3, ARENA.halfSize - 3);
      anchor.y =
        host.groundHeight(anchor.x, anchor.z) +
        2.3 +
        Math.sin(this.elapsed * 1.8 + m.hoverPhase) * 0.55;
      const steer = anchor.sub(m.group.position).multiplyScalar(3.2);
      m.velocity.lerp(steer, 1 - Math.exp(-dt * 2.6));
      if (m.velocity.length() > SUMMON.dashSpeed) m.velocity.setLength(SUMMON.dashSpeed);
      m.group.position.addScaledVector(m.velocity, dt);
      host.collide(m.group.position, SUMMON.radius);
      const floor = host.groundHeight(m.group.position.x, m.group.position.z) + 0.7;
      if (m.group.position.y < floor) m.group.position.y = floor;
      // Presentation: bob, spin the halo, swing the shards around the core.
      m.core.rotation.y += dt * 2.4;
      m.core.rotation.x = Math.sin(this.elapsed * 2 + m.hoverPhase) * 0.35;
      m.halo.rotation.z -= dt * 1.8;
      m.shards.forEach((shard, s) => {
        const a = this.elapsed * 2.6 + m.hoverPhase + (s * Math.PI * 2) / m.shards.length;
        shard.position.set(Math.cos(a) * 0.62, Math.sin(a * 1.3) * 0.18, Math.sin(a) * 0.62);
        shard.rotation.y += dt * 3;
      });
      m.flash = Math.max(0, m.flash - dt);
      m.coreMaterial.emissiveIntensity = 1.5 + (m.flash > 0 ? (0.28 - m.flash) * 14 : 0);
      // Spit: a short bright wind-up, then a straight shot at where the chest is heading.
      m.shotTimer -= dt;
      if (m.shotTimer <= 0.28 && m.flash <= 0 && m.shotTimer > 0) m.flash = 0.28;
      if (m.shotTimer <= 0) {
        const range = SUMMON.shotInterval.min;
        if (m.group.position.distanceTo(chest) < 36) {
          const lead = host.playerVelocity().multiplyScalar(0.38),
            aim = chest.clone().add(lead).sub(m.group.position);
          if (aim.lengthSq() > 0.01)
            host.shoot(m.group.position.clone(), aim.normalize().multiplyScalar(SUMMON.shotSpeed));
        }
        m.shotTimer = range + this.random() * (SUMMON.shotInterval.max - SUMMON.shotInterval.min);
      }
    }
    // Keep wingmen out of each other's space.
    for (let i = 0; i < this.members.length; i++)
      for (let j = i + 1; j < this.members.length; j++) {
        const a = this.members[i].group.position,
          b = this.members[j].group.position,
          apart = a.clone().sub(b),
          d = apart.length();
        if (d > 0.001 && d < 1.7) {
          apart.normalize().multiplyScalar((1.7 - d) * 0.5);
          a.add(apart);
          b.sub(apart);
        }
      }
  }

  /** Earliest shade whose body the segment crosses, if any. */
  hitTest(
    start: THREE.Vector3,
    end: THREE.Vector3,
    radius: number,
  ): { member: Member; t: number } | null {
    let best: { member: Member; t: number } | null = null;
    for (const m of this.members) {
      const t = segmentSphere(start, end, m.group.position, SUMMON.radius + radius);
      if (t !== null && (!best || t < best.t)) best = { member: m, t };
    }
    return best;
  }

  /** Apply damage; returns true when this shade died (and was removed). */
  damage(member: Member, amount: number): boolean {
    member.health -= amount;
    if (member.health > 0) {
      member.flash = Math.max(member.flash, 0.12);
      return false;
    }
    this.remove(member);
    return true;
  }

  private remove(member: Member) {
    const at = this.members.indexOf(member);
    if (at >= 0) this.members.splice(at, 1);
    this.scene.remove(member.group);
    member.coreMaterial.dispose();
    (member.halo.material as THREE.Material).dispose();
    for (const shard of member.shards) (shard.material as THREE.Material).dispose();
  }

  clear() {
    for (const m of [...this.members]) this.remove(m);
  }
}
