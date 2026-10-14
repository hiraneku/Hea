import * as THREE from 'three';
import { BossDirector, DUEL } from './combat';
import { Effects, makeSigil, Ribbon } from './Effects';
import { BodyTumble, LaunchRelease, ease } from './motion';
import { BossTactics, fireGateOffset } from './BossTactics';

/** A single floating spellcaster: dark blockout body and an animated, front-facing solar sigil. */
export class Boss {
  readonly group = new THREE.Group();
  readonly position = new THREE.Vector3(-2, 5.8, 1.5);
  readonly velocity = new THREE.Vector3();
  readonly impulse = new THREE.Vector3();
  readonly lockedTarget = new THREE.Vector3();
  readonly director = new BossDirector();
  readonly tactics = new BossTactics();
  readonly tumble = new BodyTumble();
  readonly release = new LaunchRelease();
  private gates: { object: THREE.Group; age: number }[] = [];
  private gateCursor = 0;
  readonly gateHistory: { side: number; origin: number[]; boss: number[]; local: number[] }[] = [];
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
    this.chargeRing = makeSigil(fx.sigilMap, 3.4, '#ffc25c');
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
    for (let i = 0; i < 8; i++) {
      const object = makeSigil(fx.sigilMap, 1.12, '#ffb94e');
      const backing = new THREE.Mesh(
        new THREE.CircleGeometry(1.02, 48),
        new THREE.MeshBasicMaterial({
          color: '#4d230e',
          transparent: true,
          opacity: 0.28,
          side: THREE.DoubleSide,
          forceSinglePass: true,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      backing.position.z = -0.018;
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(1.03, 0.028, 4, 56),
        new THREE.MeshBasicMaterial({
          color: '#ffbf60',
          transparent: true,
          opacity: 1,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      rim.position.z = 0.015;
      (
        object.children[0] as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
      ).material.toneMapped = false;
      object.add(backing, rim);
      object.children.forEach((o) => {
        if (o instanceof THREE.Mesh)
          o.userData.baseOpacity = (o.material as THREE.Material).opacity;
      });
      object.visible = false;
      scene.add(object);
      this.gates.push({ object, age: 10 });
    }
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
    this.gates.forEach((g) => {
      g.object.children[1].visible = !low;
    });
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
    this.tactics.reset();
    this.tumble.reset();
    this.release.cancel();
    this.clearGates();
    this.gateHistory.length = 0;
    this.gateCursor = 0;
    this.group.visible = true;
    this.group.scale.setScalar(1);
    this.ribbon.reset(this.position);
    this.ribbon.mesh.visible = true;
  }
  muzzle(radius = 0) {
    this.group.updateMatrixWorld(true);
    return this.group.localToWorld(new THREE.Vector3(0, 0.1, 1.05 + radius * 0.8));
  }
  clearGates() {
    this.gates.forEach((g) => {
      g.age = 10;
      g.object.visible = false;
    });
  }
  get chargeRadius() {
    return this.director.attack === 'hammer' && this.chargeRing.visible
      ? 3.4 * this.chargeRing.scale.x
      : 0;
  }
  get activeGates() {
    return this.gates
      .filter((g) => g.object.visible)
      .map((g) => ({
        position: g.object.position.toArray(),
        age: g.age,
        radius: 1.12 * g.object.scale.x,
      }));
  }
  fireGate(index: number, target: THREE.Vector3, floor: (x: number, z: number) => number) {
    const { local, side } = fireGateOffset(index, this.director.pattern);
    this.group.updateMatrixWorld(true);
    const origin = this.group.localToWorld(local.clone());
    origin.y = Math.max(origin.y, floor(origin.x, origin.z) + 1.2);
    const gate = this.gates[this.gateCursor++ % this.gates.length];
    gate.object.position.copy(origin);
    gate.object.lookAt(target);
    gate.object.scale.setScalar(0.2);
    gate.object.visible = true;
    gate.age = 0;
    this.gateHistory.push({
      side,
      origin: origin.toArray(),
      boss: this.position.toArray(),
      local: local.toArray(),
    });
    if (this.gateHistory.length > 48) this.gateHistory.shift();
    return origin;
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
    this.group.quaternion.copy(this.tumble.step(dt, this.group.quaternion.clone()));
    this.group.updateMatrixWorld(true);
    this.flash = Math.max(0, this.flash - dt);
    this.plate.material.emissiveIntensity = this.flash > 0 ? 2.1 : 0.025;
    const charge = this.director.charge;
    this.sigil.rotation.z += dt * (0.35 + charge * 2.2);
    this.sigil.scale.setScalar(1 + charge * 0.13);
    this.chargeRing.visible = this.director.stage !== 'recover' && this.director.attack !== 'fire';
    this.chargeRing.rotation.z -= dt * 0.8;
    this.chargeRing.scale.setScalar(
      this.director.attack === 'hammer'
        ? 1.05 + (this.director.stage === 'telegraph' ? charge : 1) * 0.4
        : 0.52 + charge * 0.14,
    );
    const heavy = this.director.attack === 'hammer' && this.director.stage === 'telegraph';
    this.ember.scale.setScalar(1 + charge * (heavy ? 5.8 : 1.8) + Math.sin(time * 5) * 0.1);
    this.ember.position.z = 0.75 + (heavy ? charge * 0.9 : 0);
    this.gates.forEach((g) => {
      g.age += dt;
      g.object.visible = g.age < 0.66;
      if (!g.object.visible) return;
      g.object.scale.setScalar(0.45 + ease(g.age / 0.1) * 0.55);
      g.object.rotateZ(dt * 0.5);
      g.object.children.forEach((o) => {
        if (o instanceof THREE.Mesh)
          (o.material as THREE.Material).opacity =
            (1 - ease((g.age - 0.43) / 0.23)) * (o.userData.baseOpacity ?? 1);
      });
    });
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
