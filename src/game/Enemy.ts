import * as THREE from 'three';
import { ENEMY } from './combat';
import { ARENA } from './config';
import { clamp, segmentSphere } from './math';

/** What an enemy needs from the fight around it. Implemented by Game. */
export interface EnemyHost {
  /** Chest position of the quarry right now (the player, in the duel). */
  targetChest(): THREE.Vector3;
  /** Quarry velocity, for a short aiming lead on the spit. */
  targetVelocity(): THREE.Vector3;
  /** Fire one small straight fireball from `at` (no homing, weaker than the boss's fire). */
  shoot(at: THREE.Vector3, velocity: THREE.Vector3): void;
  /** Push a flying body at `position` out of solid scenery. */
  collide(position: THREE.Vector3, radius: number): void;
  groundHeight(x: number, z: number): number;
}

const plateGeometry = new THREE.BoxGeometry(0.85, 1.0, 0.32);
const lowerGeometry = new THREE.BoxGeometry(0.55, 0.26, 0.4);
const crownGeometry = new THREE.BoxGeometry(0.5, 0.18, 0.3);
const emberGeometry = new THREE.IcosahedronGeometry(0.1, 1);
const shardGeometry = new THREE.BoxGeometry(0.12, 0.26, 0.22);
const backingGeometry = new THREE.CircleGeometry(0.34, 32);
const rimGeometry = new THREE.TorusGeometry(0.35, 0.013, 4, 40);
const innerRimGeometry = new THREE.TorusGeometry(0.22, 0.009, 4, 32);

/**
 * A lesser construct of the boss's own kind: the same dark stone, the same gold ember,
 * the same sigil worn on its chest — a standing enemy kind, fielded by the boss's
 * `summon` today and by anything else that needs enemies tomorrow. It hovers, circles
 * its quarry, dashes sideways to fresh angles, and spits small straight fireballs.
 * Every player attack can hurt it, and FALL's gravity holds it exactly like its master:
 * slammed down, pinned while the spell is held, slow to rise when it lets go.
 */
export class Enemy {
  readonly group = new THREE.Group();
  readonly velocity = new THREE.Vector3();
  /** Seconds spent on the ground after gravity lets go, before rising. */
  health = ENEMY.health;
  /** Held down by FALL: no flight, no fire, face in the dirt until released. */
  held = false;
  private body = new THREE.Group();
  private ember!: THREE.Mesh;
  private emberMaterial!: THREE.MeshBasicMaterial;
  private sigil!: THREE.Group;
  private innerSigil!: THREE.Group;
  private shards: THREE.Mesh[] = [];
  private materials: THREE.Material[] = [];
  private angle: number;
  private orbitRadius: number;
  private orbitDirection: 1 | -1;
  private hoverPhase: number;
  private shotTimer: number;
  private dashTimer: number;
  private flash = 0;
  private stagger = 0;
  private holdY = 0;
  private age = 0;
  private elapsed = 0;
  private scratch = new THREE.Vector3();
  private emberBase = new THREE.Color('#ffad4d').multiplyScalar(3);

  constructor(
    private scene: THREE.Scene,
    at: THREE.Vector3,
    private random: () => number = Math.random,
  ) {
    // Built from the boss's own palette and parts, at a third of its stature.
    const stone = new THREE.MeshStandardMaterial({
      color: '#313d49',
      roughness: 0.58,
      metalness: 0.13,
      emissive: '#612813',
      emissiveIntensity: 0.06,
    });
    this.materials.push(stone);
    const plate = new THREE.Mesh(plateGeometry, stone);
    plate.castShadow = true;
    const lower = new THREE.Mesh(lowerGeometry, stone);
    lower.position.set(0, -0.68, -0.04);
    lower.rotation.z = 0.05;
    const crown = new THREE.Mesh(crownGeometry, stone);
    crown.position.set(0, 0.6, -0.02);
    crown.rotation.z = -0.04;
    this.body.add(plate, lower, crown);
    this.emberMaterial = new THREE.MeshBasicMaterial({ color: this.emberBase.clone() });
    this.materials.push(this.emberMaterial);
    this.ember = new THREE.Mesh(emberGeometry, this.emberMaterial);
    this.ember.position.set(0, 0.02, 0.26);
    // The sigil it wears like its master: a dark backing, a gold rim, a smaller rim
    // turning against it.
    const backingMaterial = new THREE.MeshBasicMaterial({
      color: '#4d230e',
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    });
    const rimMaterial = new THREE.MeshBasicMaterial({
      color: '#ffbf60',
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      toneMapped: false,
    });
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: '#ff9e37',
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      toneMapped: false,
    });
    this.materials.push(backingMaterial, rimMaterial, innerMaterial);
    const backing = new THREE.Mesh(backingGeometry, backingMaterial);
    backing.position.z = -0.012;
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    this.innerSigil = new THREE.Group();
    this.innerSigil.add(new THREE.Mesh(innerRimGeometry, innerMaterial));
    this.sigil = new THREE.Group();
    this.sigil.add(backing, rim, this.innerSigil);
    this.sigil.position.set(0, 0.02, 0.17);
    for (let i = 0; i < 3; i++) {
      const shard = new THREE.Mesh(shardGeometry, stone);
      shard.castShadow = true;
      this.shards.push(shard);
      this.group.add(shard);
    }
    this.group.add(this.body, this.ember, this.sigil);
    this.group.position.copy(at);
    this.angle = this.random() * Math.PI * 2;
    this.orbitRadius =
      ENEMY.orbitRadius.min + this.random() * (ENEMY.orbitRadius.max - ENEMY.orbitRadius.min);
    this.orbitDirection = this.random() < 0.5 ? -1 : 1;
    this.hoverPhase = this.random() * Math.PI * 2;
    this.shotTimer = 1 + this.random() * 1.2;
    this.dashTimer =
      ENEMY.dashInterval.min + this.random() * (ENEMY.dashInterval.max - ENEMY.dashInterval.min);
    scene.add(this.group);
  }

  get position(): THREE.Vector3 {
    return this.group.position;
  }

  get alive(): boolean {
    return this.health > 0;
  }

  /** Where a segment crosses this body, if it does (t along the segment, 0..1). */
  crossedBy(start: THREE.Vector3, end: THREE.Vector3, radius: number): number | null {
    return segmentSphere(start, end, this.position, ENEMY.radius + radius);
  }

  /** Apply damage; returns true when this construct died. */
  damage(amount: number): boolean {
    this.health -= amount;
    this.flash = Math.max(this.flash, 0.14);
    return this.health <= 0;
  }

  /** FALL takes hold: remember the ground it is about to be pressed into. */
  beginHold(groundY: number) {
    this.held = true;
    this.holdY = groundY + 0.42;
    this.velocity.set(0, 0, 0);
  }

  /** FALL lets go: it stays down a beat, then gathers itself back into the air. */
  endHold() {
    if (!this.held) return;
    this.held = false;
    this.stagger = ENEMY.holdStagger;
  }

  update(dt: number, host: EnemyHost) {
    this.age += dt;
    this.elapsed += dt;
    const chest = host.targetChest();
    if (this.held) {
      // Pressed flat: it sinks to its ground and stays there, ember dimmed, face down.
      this.position.y += (this.holdY - this.position.y) * (1 - Math.exp(-dt * 16));
      this.body.rotation.x += (0.62 - this.body.rotation.x) * (1 - Math.exp(-dt * 10));
      this.emberMaterial.color.copy(this.emberBase).multiplyScalar(0.35);
      this.spinDressing(dt, 0.4);
      return;
    }
    this.emberMaterial.color.copy(this.emberBase);
    this.body.rotation.x *= Math.exp(-dt * 6);
    if (this.stagger > 0) {
      this.stagger -= dt;
      this.spinDressing(dt, 0.8);
      return;
    }
    // Circle the quarry, drifting tangentially; every few seconds, dash to a fresh
    // angle and height so the retinue never settles into a rhythm that can be ignored.
    this.angle += (this.orbitDirection * ENEMY.strafeSpeed * dt) / this.orbitRadius;
    this.dashTimer -= dt;
    if (this.dashTimer <= 0) {
      this.dashTimer =
        ENEMY.dashInterval.min + this.random() * (ENEMY.dashInterval.max - ENEMY.dashInterval.min);
      this.orbitDirection = this.random() < 0.5 ? -1 : 1;
      this.orbitRadius =
        ENEMY.orbitRadius.min + this.random() * (ENEMY.orbitRadius.max - ENEMY.orbitRadius.min);
      this.scratch.set(
        -Math.sin(this.angle) * this.orbitDirection,
        0,
        Math.cos(this.angle) * this.orbitDirection,
      );
      this.velocity.addScaledVector(this.scratch, ENEMY.dashSpeed * 0.7);
      this.velocity.y += (this.random() - 0.3) * 5;
    }
    const anchor = this.scratch.set(
      chest.x + Math.cos(this.angle) * this.orbitRadius,
      0,
      chest.z + Math.sin(this.angle) * this.orbitRadius,
    );
    anchor.x = clamp(anchor.x, -ARENA.halfSize + 3, ARENA.halfSize - 3);
    anchor.z = clamp(anchor.z, -ARENA.halfSize + 3, ARENA.halfSize - 3);
    anchor.y =
      host.groundHeight(anchor.x, anchor.z) +
      2.3 +
      Math.sin(this.elapsed * 1.8 + this.hoverPhase) * 0.55;
    anchor.sub(this.position).multiplyScalar(3.2);
    this.velocity.lerp(anchor, 1 - Math.exp(-dt * 2.6));
    if (this.velocity.length() > ENEMY.dashSpeed) this.velocity.setLength(ENEMY.dashSpeed);
    this.position.addScaledVector(this.velocity, dt);
    host.collide(this.position, ENEMY.radius);
    const floor = host.groundHeight(this.position.x, this.position.z) + 0.7;
    if (this.position.y < floor) this.position.y = floor;
    // Face the quarry like its master does, hovering with a slow breath.
    this.scratch.set(chest.x, this.position.y + (chest.y - this.position.y) * 0.25, chest.z);
    this.group.lookAt(this.scratch);
    this.body.position.y = Math.sin(this.elapsed * 2.1 + this.hoverPhase) * 0.07;
    this.body.rotation.z = Math.sin(this.elapsed * 1.3 + this.hoverPhase) * 0.05;
    this.spinDressing(dt, 1);
    // Spit: a short bright wind-up, then a straight shot at where the chest is heading.
    this.shotTimer -= dt;
    if (this.shotTimer <= 0.28 && this.flash <= 0 && this.shotTimer > 0) this.flash = 0.28;
    if (this.shotTimer <= 0) {
      if (this.position.distanceTo(chest) < 36) {
        const lead = host.targetVelocity().multiplyScalar(0.38),
          aim = chest.clone().add(lead).sub(this.position);
        if (aim.lengthSq() > 0.01)
          host.shoot(this.position.clone(), aim.normalize().multiplyScalar(ENEMY.shotSpeed));
      }
      this.shotTimer =
        ENEMY.shotInterval.min + this.random() * (ENEMY.shotInterval.max - ENEMY.shotInterval.min);
    }
    this.flash = Math.max(0, this.flash - dt);
    const pulse = 1 + (this.flash > 0 ? (0.28 - Math.max(0, this.flash)) * 6 : 0);
    this.ember.scale.setScalar(pulse);
  }

  private spinDressing(dt: number, rate: number) {
    this.sigil.rotation.z += dt * 0.7 * rate;
    this.innerSigil.rotation.z -= dt * 1.6 * rate;
    this.shards.forEach((shard, s) => {
      const a =
        this.elapsed * 1.9 * rate + this.hoverPhase + (s * Math.PI * 2) / this.shards.length;
      shard.position.set(Math.cos(a) * 0.58, Math.sin(a * 1.3) * 0.16, Math.sin(a) * 0.58);
      shard.rotation.y += dt * 2 * rate;
    });
  }

  dispose() {
    this.scene.remove(this.group);
    for (const material of this.materials) material.dispose();
  }
}
