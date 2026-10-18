import * as THREE from 'three';
import { Ribbon, makeSigil } from './Effects';
import { PROJECTILES, type MissileGuidance, type ProjectileKind } from './combat';

/** One shot in the air: its body, its trail, and everything the duel needs to steer it. */
export interface Projectile {
  mesh: THREE.Mesh;
  ribbon: Ribbon;
  velocity: THREE.Vector3;
  last: THREE.Vector3;
  kind: ProjectileKind;
  life: number;
  age: number;
  damage: number;
  /** Knockback scale on a player hit: lesser spits shove less than the boss's own fire. */
  power: number;
  homing: boolean;
  radius: number;
  origin: THREE.Vector3;
  guidance: MissileGuidance;
  /** Seekers chase their own scatter point around the player, not one shared centre. */
  aimOffset: THREE.Vector3 | null;
  /** Serial of the patch raised for this shot: it flies on until it actually strikes it. */
  claim: number | null;
  /** Set once this shot has been let through an open hole in the shell. */
  leaked: boolean;
  /** Set once this shot has passed through a dashing player, so it rewards only one dodge. */
  dodged: boolean;
  /** Vortex seeds anchor here (or at the first wall) instead of expiring. */
  anchor: THREE.Vector3 | null;
}

/** Shots fly until they strike the world, so the live cap is set with room for a full duel. */
const MAX_LIVE = 120;

/**
 * Owns every projectile in the air: the shared geometries/materials their bodies are built
 * from, spawning, and retiring them (a body can be handed over — to a shield crush or a
 * vortex well — instead of dropped). Flight, steering and collision stay with the game,
 * which works on {@link ProjectileSystem.list} directly. Extracted from `Game` unchanged in
 * behaviour.
 */
export class ProjectileSystem {
  readonly list: Projectile[] = [];
  private spellOrbitGeometry = new THREE.TorusGeometry(0.225, 0.011, 3, 28);
  private spellOrbitMaterial = new THREE.MeshBasicMaterial({
    color: '#ffac57',
    transparent: true,
    opacity: 0.58,
    toneMapped: false,
  });
  private spellRuneGeometry = new THREE.PlaneGeometry(0.61, 0.61);
  private spellRuneMaterial: THREE.MeshBasicMaterial;
  private fireGeometry = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0, -0.8),
      new THREE.Vector2(0.045, -0.4),
      new THREE.Vector2(0.12, -0.08),
      new THREE.Vector2(0.17, 0.035),
      new THREE.Vector2(0.13, 0.13),
      new THREE.Vector2(0, 0.19),
    ],
    10,
  ).rotateX(Math.PI / 2);
  private fireCore = new THREE.MeshBasicMaterial({ color: '#fff5b8', toneMapped: false });
  private projectileGeometry = new THREE.IcosahedronGeometry(0.17, 1);
  private projectileMaterials = {
    player: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffad53').multiplyScalar(3) }),
    fire: new THREE.MeshBasicMaterial({ color: '#ff842b', toneMapped: false }),
    missile: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffbc70').multiplyScalar(3) }),
    hammer: new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff0ba').multiplyScalar(4) }),
    vortex: new THREE.MeshBasicMaterial({
      color: '#2b0b08',
      transparent: true,
      opacity: 0.78,
      toneMapped: false,
    }),
  };
  private vortexRimMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#ff5a2a').multiplyScalar(2.5),
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false,
  });

  constructor(
    private readonly scene: THREE.Scene,
    private readonly sigilMap: THREE.Texture,
  ) {
    this.spellRuneMaterial = new THREE.MeshBasicMaterial({
      map: sigilMap,
      color: '#ffba78',
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    });
  }

  spawn(
    at: THREE.Vector3,
    velocity: THREE.Vector3,
    kind: ProjectileKind,
    damage: number,
    homing = false,
    aimOffset: THREE.Vector3 | null = null,
    power = 1,
    radiusOverride?: number,
  ): Projectile {
    if (this.list.length >= MAX_LIVE) this.remove(0);
    const mesh = new THREE.Mesh(
      kind === 'fire' ? this.fireGeometry : this.projectileGeometry,
      this.projectileMaterials[kind],
    );
    mesh.position.copy(at);
    // Marked as a shot's body while it is one, so a stray left in the scene can be counted
    // rather than noticed by eye (see `diagnostics().strayShots`).
    mesh.userData.projectile = true;
    const radius = radiusOverride ?? PROJECTILES[kind].radius;
    mesh.scale.setScalar(radius / 0.17);
    if (kind === 'fire') {
      const core = new THREE.Mesh(this.fireGeometry, this.fireCore);
      core.scale.set(0.62, 0.62, 0.9);
      core.position.z = 0.04;
      mesh.add(core);
    }
    if (kind === 'missile' || kind === 'hammer') {
      const orbit = new THREE.Mesh(this.spellOrbitGeometry, this.spellOrbitMaterial);
      orbit.rotation.x = Math.PI / 3;
      const runes = new THREE.Mesh(this.spellRuneGeometry, this.spellRuneMaterial);
      runes.rotation.z = Math.random() * Math.PI;
      mesh.add(orbit, runes);
    }
    mesh.lookAt(at.clone().add(velocity));
    this.scene.add(mesh);
    const ribbon = new Ribbon(
      kind === 'missile' ? 40 : 24,
      kind === 'hammer' ? 0.24 : kind === 'fire' ? 0.075 : 0.055,
      kind === 'hammer' ? '#ffeecf' : '#ffae77',
    );
    ribbon.reset(at);
    this.scene.add(ribbon.mesh);
    const projectile: Projectile = {
      mesh,
      ribbon,
      velocity,
      last: at.clone(),
      kind,
      damage,
      power,
      homing,
      life: PROJECTILES[kind].range / PROJECTILES[kind].speed,
      radius,
      origin: at.clone(),
      guidance: { committed: false },
      aimOffset,
      age: 0,
      claim: null,
      anchor: null,
      leaked: false,
      dodged: false,
    };
    this.list.push(projectile);
    return projectile;
  }

  /** `keepMesh` hands the body over (to a shield crush or a vortex well) instead of dropping it. */
  remove(index: number, keepMesh = false) {
    const p = this.list[index];
    if (!p) return;
    if (!keepMesh) p.mesh.removeFromParent();
    p.ribbon.dispose();
    this.list.splice(index, 1);
  }

  clear() {
    while (this.list.length) this.remove(this.list.length - 1);
  }

  /**
   * Dress a retired vortex seed as the heart of its well: a flat accretion disc whose outer
   * rim marks the lethal core radius, a rune disc spinning against it, and a white-hot
   * pinpoint in the dark centre.
   */
  decorateWellCore(core: THREE.Mesh) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 48), this.vortexRimMaterial);
    ring.userData.ring = true;
    const halo = makeSigil(this.sigilMap, 0.55, '#ff8a52');
    halo.userData.halo = true;
    halo.rotation.x = -Math.PI / 2;
    const pin = new THREE.Mesh(
      this.projectileGeometry,
      new THREE.MeshBasicMaterial({ color: '#fff3dc', toneMapped: false }),
    );
    pin.scale.setScalar(0.3);
    pin.userData.pin = true;
    core.add(ring, halo, pin);
  }
}
