import * as THREE from 'three';
import { BossDirector, DUEL } from './combat';
import { Effects, makeSigil, Ribbon } from './Effects';

/** A single floating spellcaster: dark blockout body and an animated, front-facing solar sigil. */
export class Boss {
  readonly group = new THREE.Group();
  readonly position = new THREE.Vector3(-2, 5.8, 1.5);
  readonly velocity = new THREE.Vector3();
  readonly impulse = new THREE.Vector3();
  readonly lockedTarget = new THREE.Vector3();
  readonly director = new BossDirector();
  readonly ribbon = new Ribbon(70, 0.034, '#ffd1a0');
  health: number = DUEL.bossHealth;
  knockTime = 0;
  flash = 0;
  pendingImpulse: THREE.Vector3 | null = null;
  deathDelay = -1;
  private castRotation = 0;
  private spellSeeds: THREE.Mesh[] = [];
  private plate: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  private sigil: THREE.Group;
  private chargeRing: THREE.Group;
  private ember: THREE.Mesh;
  private shards: THREE.Mesh[] = [];
  private light: THREE.PointLight;

  constructor(scene: THREE.Scene, fx: Effects) {
    this.group.name = 'sole-boss';
    const stone = new THREE.MeshStandardMaterial({
      color: '#313d49',
      roughness: 0.58,
      metalness: 0.13,
      emissive: '#612813',
      emissiveIntensity: 0.025,
    });
    this.plate = new THREE.Mesh(new THREE.BoxGeometry(2.35, 2.7, 0.85), stone);
    this.plate.castShadow = this.plate.receiveShadow = true;
    this.group.add(this.plate);
    const lower = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.65, 1), stone);
    lower.position.set(0, -1.7, -0.1);
    lower.rotation.z = 0.05;
    this.group.add(lower);
    this.sigil = makeSigil(fx.sigilMap, 1.22, '#ff9e37');
    this.sigil.position.set(0, 0.1, 0.45);
    this.group.add(this.sigil);
    this.chargeRing = makeSigil(fx.sigilMap, 1.8, '#ffd495');
    this.chargeRing.position.set(0, 0.1, 0.52);
    this.chargeRing.visible = false;
    this.group.add(this.chargeRing);
    const gold = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#ffad4d').multiplyScalar(3),
    });
    this.ember = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), gold);
    this.ember.position.set(0, 0.1, 0.75);
    this.group.add(this.ember);
    const seedGeometry = new THREE.IcosahedronGeometry(0.11, 1);
    for (let i = 0; i < 6; i++) {
      const seed = new THREE.Mesh(seedGeometry, gold);
      this.group.add(seed);
      this.spellSeeds.push(seed);
    }
    for (let i = 0; i < 4; i++) {
      const shard = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.7, 0.65), stone);
      this.group.add(shard);
      this.shards.push(shard);
    }
    this.light = new THREE.PointLight('#ff9a4f', 8, 7, 2);
    this.light.position.set(0, 0.3, 1.3);
    this.group.add(this.light);
    scene.add(this.group, this.ribbon.mesh);
    this.reset();
  }
  get alive() {
    return this.health > 0;
  }
  get enraged() {
    return this.health / DUEL.bossHealth < 0.45;
  }
  setQuality(low: boolean) {
    this.light.visible = !low;
  }
  reset() {
    this.health = DUEL.bossHealth;
    this.position.set(-2, 5.8, 1.5);
    this.velocity.set(0, 0, 0);
    this.impulse.set(0, 0, 0);
    this.knockTime = this.flash = 0;
    this.pendingImpulse = null;
    this.deathDelay = -1;
    this.castRotation = 0;
    this.director.reset();
    this.group.visible = true;
    this.group.scale.setScalar(1);
    this.ribbon.reset(this.position);
    this.ribbon.mesh.visible = true;
  }
  muzzle(radius = 0) {
    this.group.updateMatrixWorld(true);
    return this.group.localToWorld(new THREE.Vector3(0, 0.1, 1.05 + radius * 0.8));
  }
  private seedPosition(index: number) {
    const angle = this.castRotation + (index / 6) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(angle) * 0.86, 0.1 + Math.sin(angle) * 0.86, 0.78);
  }
  /** Launch points are ON the frontal spell circle, not on the shoulders. */
  spellPort(index: number) {
    this.group.updateMatrixWorld(true);
    return this.group.localToWorld(this.seedPosition(index));
  }
  present(time: number, dt: number, target: THREE.Vector3, camera: THREE.Vector3) {
    this.group.position.copy(this.position);
    this.group.lookAt(target);
    this.group.updateMatrixWorld(true);
    this.flash = Math.max(0, this.flash - dt);
    this.plate.material.emissiveIntensity = this.flash > 0 ? 2.1 : 0.025;
    const charge = this.director.charge;
    this.sigil.rotation.z += dt * (0.35 + charge * 2.2);
    this.sigil.scale.setScalar(1 + charge * 0.13);
    this.chargeRing.visible = this.director.stage !== 'recover' && this.director.attack !== 'fire';
    this.chargeRing.rotation.z -= dt * 0.8;
    this.chargeRing.scale.setScalar(
      this.director.attack === 'hammer' ? 1.1 + charge * 0.5 : 0.82 + charge * 0.25,
    );
    const heavy = this.director.attack === 'hammer' && this.director.stage === 'telegraph';
    this.ember.scale.setScalar(1 + charge * (heavy ? 5.8 : 1.8) + Math.sin(time * 5) * 0.1);
    this.ember.position.z = 0.75 + (heavy ? charge * 0.9 : 0);
    this.castRotation = time * 0.55;
    this.spellSeeds.forEach((seed, i) => {
      seed.visible = this.director.attack === 'missiles' && this.director.stage !== 'recover';
      seed.position.copy(this.seedPosition(i));
      seed.scale.setScalar(0.4 + charge * 1.9);
    });
    this.shards.forEach((shard, i) => {
      const side = i % 2 ? 1 : -1;
      shard.position.set(
        side * (1.52 + charge * 0.18),
        (i < 2 ? 0.8 : -0.9) + Math.sin(time * 1.3 + i) * 0.12,
        -0.05,
      );
      shard.rotation.z = side * (0.16 + Math.sin(time + i) * 0.08);
    });
    if (this.group.visible) this.ribbon.push(this.position, camera);
  }
}
