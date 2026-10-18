import * as THREE from 'three';
import { BossDirector, DUEL } from './combat';
import { Effects, makeSigil, Ribbon } from './Effects';
import { BodyTumble, LaunchRelease, ease, hoverLean } from './motion';
import { BOSS_MOTOR, BossTactics, fireGateLocal, fireGateOffset } from './BossTactics';
import { BOSS } from './config';

/** Satellite fire gates relative to their v0.10 size. */
const GATE_SCALE = 1.25;

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
  private gates: {
    object: THREE.Group;
    age: number;
    packet: number;
    angle: number;
    radius: number;
    spin: number;
    roll: number;
  }[] = [];
  private gateCursor = 0;
  private floor = (_x: number, _z: number) => 0;
  readonly gateHistory: { side: number; origin: number[]; boss: number[]; local: number[] }[] = [];
  readonly ribbon = new Ribbon(70, 0.034, '#ffd1a0');
  health: number = DUEL.bossHealth;
  knockTime = 0;
  /** Held down by FALL: the body keeps the facing it was slammed with. */
  pinned = false;
  flash = 0;
  pendingImpulse: THREE.Vector3 | null = null;
  deathDelay = -1;
  private castRotation = 0;
  /** Forward lunge after a release (1 at the moment of casting, decays to 0). */
  private snap = 0;
  /** Smoothed facing and lean, so the construct turns and banks instead of snapping. */
  private readonly facingQ = new THREE.Quaternion();
  private facingSet = false;
  private leanRoll = 0;
  private leanPitch = 0;
  private lastStage: BossDirector['stage'] = 'recover';
  private spellSeeds: THREE.Mesh[] = [];
  private plate: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  private lower: THREE.Mesh;
  private body = new THREE.Group();
  private sigil: THREE.Group;
  private innerSigil: THREE.Group;
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
    // The stone body sits in its own pivot so the telegraph can lean it back and the release
    // can lunge it forward without disturbing the glyph, ports and gates in the group frame.
    this.group.add(this.body);
    this.plate = new THREE.Mesh(new THREE.BoxGeometry(2.35, 2.7, 0.85), stone);
    this.plate.castShadow = this.plate.receiveShadow = true;
    this.body.add(this.plate);
    this.lower = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.65, 1), stone);
    this.lower.position.set(0, -1.7, -0.1);
    this.lower.rotation.z = 0.05;
    this.body.add(this.lower);
    this.sigil = makeSigil(fx.sigilMap, 1.22, '#ff9e37');
    this.sigil.position.set(0, 0.1, 0.45);
    this.group.add(this.sigil);
    // A second, counter-rotating circle wakes up inside the main one while a spell charges.
    this.innerSigil = makeSigil(fx.sigilMap, 0.8, '#ffd79a');
    this.innerSigil.position.set(0, 0.1, 0.5);
    this.group.add(this.innerSigil);
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
      shard.castShadow = true;
      this.body.add(shard);
      this.shards.push(shard);
    }
    this.light = new THREE.PointLight('#ff9a4f', 8, 7, 2);
    this.light.position.set(0, 0.3, 1.3);
    this.group.add(this.light);
    scene.add(this.group, this.ribbon.mesh);
    for (let i = 0; i < 8; i++) {
      const object = makeSigil(fx.sigilMap, 1.3, '#ffb94e');
      const backing = new THREE.Mesh(
        new THREE.CircleGeometry(1.18, 48),
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
        new THREE.TorusGeometry(1.2, 0.03, 4, 56),
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
      this.gates.push({ object, age: 10, packet: -1, angle: 0, radius: 0, spin: 0, roll: 0 });
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
    this.snap = 0;
    this.facingSet = false;
    this.leanRoll = this.leanPitch = 0;
    this.lastStage = 'recover';
    this.body.rotation.set(0, 0, 0);
    this.body.position.set(0, 0, 0);
    this.director.reset();
    this.tactics.reset();
    this.tumble.reset();
    this.release.cancel();
    this.clearGates();
    this.gateHistory.length = 0;
    this.gateCursor = 0;
    this.pinned = false;
    this.group.visible = true;
    this.group.scale.setScalar(BOSS.scale);
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
        radius: 1.3 * g.object.scale.x,
      }));
  }
  /** Where a gate opened in ring slot `slot` would sit right now, without opening it. */
  gateOriginFor(slot: number, floor: (x: number, z: number) => number) {
    const { local } = fireGateOffset(slot, this.director.pattern);
    this.group.updateMatrixWorld(true);
    const origin = this.group.localToWorld(local.clone());
    origin.y = Math.max(origin.y, floor(origin.x, origin.z) + 1.2);
    return origin;
  }
  /**
   * Opens the gate for bolt packet `index`. The gate normally takes the packet's own ring slot;
   * the caller may hand it another `slot` whose lane is clear when the packet's own is masked.
   */
  fireGate(
    index: number,
    target: THREE.Vector3,
    floor: (x: number, z: number) => number,
    slot = index,
  ) {
    const { local, angle, radius, spin } = fireGateOffset(slot, this.director.pattern),
      side = fireGateOffset(index, this.director.pattern).side;
    this.floor = floor;
    const origin = this.gateOriginFor(slot, floor);
    const gate = this.gates[this.gateCursor++ % this.gates.length];
    gate.object.position.copy(origin);
    gate.object.lookAt(target);
    gate.object.scale.setScalar(0.2 * GATE_SCALE);
    gate.object.visible = true;
    gate.age = 0;
    gate.packet = index;
    gate.angle = angle;
    gate.radius = radius;
    gate.spin = spin;
    gate.roll = 0;
    this.gateHistory.push({
      side,
      origin: origin.toArray(),
      boss: this.position.toArray(),
      local: local.toArray(),
    });
    if (this.gateHistory.length > 48) this.gateHistory.shift();
    return origin;
  }
  /** Where an open gate is right now: it keeps orbiting the glyph while its packet fires. */
  gateOrigin(packet: number): THREE.Vector3 | null {
    const gate = this.gates.find((g) => g.object.visible && g.packet === packet);
    return gate ? gate.object.position.clone() : null;
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
    // Face the target through a smoothed turn (not a per-frame snap), lean into the motion
    // like something that actually flies, and breathe up and down a little while hovering.
    // Pinned under FALL it does none of that: the facing stays where the slam left it.
    if (!this.pinned) this.group.lookAt(target);
    if (!this.facingSet || this.tumble.physical || dt > 0.5) {
      this.facingQ.copy(this.group.quaternion);
      this.facingSet = true;
    } else this.facingQ.slerp(this.group.quaternion, 1 - Math.exp(-dt * 7));
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.facingQ),
      right = new THREE.Vector3(-1, 0, 0).applyQuaternion(this.facingQ);
    const lean = hoverLean(this.velocity, forward, right, BOSS_MOTOR.max),
      settle = 1 - Math.exp(-dt * 6);
    this.leanRoll += (lean.roll - this.leanRoll) * settle;
    this.leanPitch += (lean.pitch - this.leanPitch) * settle;
    const upright = 1 - this.tumble.weight;
    const attitude = this.facingQ
      .clone()
      .multiply(
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(this.leanPitch * upright, 0, this.leanRoll * upright),
        ),
      );
    this.group.quaternion.copy(this.tumble.step(dt, attitude));
    const cruise = Math.min(1, this.velocity.length() / 8);
    this.group.position.y += Math.sin(time * 1.7) * 0.12 * upright * (1 - cruise);
    this.group.updateMatrixWorld(true);
    this.flash = Math.max(0, this.flash - dt);
    this.plate.material.emissiveIntensity = this.flash > 0 ? 2.1 : 0.025;
    const charge = this.director.charge,
      stage = this.director.stage;
    // Body language: the construct rears back while a spell charges, then lunges forward as
    // it releases — the heavier the spell, the longer the wind-up and the harder the snap.
    if (stage === 'attack' && this.lastStage === 'telegraph')
      this.snap = this.director.attack === 'hammer' ? 1.35 : 1;
    this.lastStage = stage;
    this.snap = Math.max(0, this.snap - dt * 3.2);
    const rear = this.director.attack === 'hammer' ? 0.19 : 0.11,
      pose = -ease(charge) * rear + ease(Math.min(1, this.snap)) * 0.14;
    this.body.rotation.x = pose;
    this.body.position.z = ease(Math.min(1, this.snap)) * 0.38 - ease(charge) * 0.12;
    this.body.position.y = ease(charge) * 0.1;
    this.sigil.rotation.z += dt * (0.35 + charge * 2.2);
    this.sigil.scale.setScalar(1 + charge * 0.13 + this.snap * 0.08);
    this.innerSigil.rotation.z -= dt * (0.5 + charge * 3.6 + this.snap * 4);
    this.innerSigil.scale.setScalar(0.3 + ease(charge) * 0.8 + Math.min(1, this.snap) * 0.25);
    this.chargeRing.visible = this.director.stage !== 'recover' && this.director.attack !== 'fire';
    this.chargeRing.rotation.z -= dt * 0.8;
    this.chargeRing.scale.setScalar(
      this.director.attack === 'hammer'
        ? 1.05 + (this.director.stage === 'telegraph' ? charge : 1) * 0.4
        : 0.52 + charge * 0.14,
    );
    const heavy = this.director.attack === 'hammer' && this.director.stage === 'telegraph',
      vortex = this.director.attack === 'vortex' && this.director.stage === 'telegraph';
    // The vortex tell is the opposite of the hammer's swell: the ember shrinks to a dense,
    // dark-red bead while the charge ring collapses in on it.
    this.ember.scale.setScalar(
      vortex
        ? Math.max(0.35, 1 - charge * 0.6) + Math.sin(time * 14) * 0.05 * charge
        : 1 + charge * (heavy ? 5.8 : 1.8) + Math.sin(time * 5) * 0.1,
    );
    this.ember.position.z = 0.75 + (heavy ? charge * 0.9 : 0);
    if (vortex) this.chargeRing.scale.setScalar(1.3 - charge * 0.75);
    this.chargeRing.rotation.z -= vortex ? dt * charge * 6 : 0;
    this.gates.forEach((g) => {
      g.age += dt;
      g.object.visible = g.age < 0.66;
      if (!g.object.visible) return;
      // Satellite gates ride the boss's frame and drift slowly around the ring while open.
      if (g.radius > 0) {
        const world = this.group.localToWorld(fireGateLocal(g.angle + g.spin * g.age, g.radius));
        world.y = Math.max(world.y, this.floor(world.x, world.z) + 1.2);
        g.object.position.copy(world);
        g.object.lookAt(target);
        g.roll += dt * 0.5;
        g.object.rotateZ(g.roll);
      } else g.object.rotateZ(dt * 0.5);
      g.object.scale.setScalar((0.45 + ease(g.age / 0.1) * 0.55) * GATE_SCALE);
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
    // The loose shards draw in tight against the plate during the tell and fling outwards on
    // the release, trailing the lunge. While the construct tumbles they are flung out by the
    // spin and rattle, so the body reads as a cluster of parts rather than one rigid prop.
    const pull = ease(charge),
      fling = Math.min(1, this.snap),
      spin = this.tumble.physical ? Math.min(1, this.tumble.angularVelocity.length() / 5) : 0;
    this.shards.forEach((shard, i) => {
      const side = i % 2 ? 1 : -1;
      shard.position.set(
        side * (1.52 - pull * 0.42 + fling * 0.75 + spin * 0.55),
        (i < 2 ? 0.8 : -0.9) * (1 - pull * 0.25 + spin * 0.3) +
          Math.sin(time * 1.3 + i) * 0.12 +
          Math.sin(time * 17 + i * 2.1) * spin * 0.1,
        -0.05 - pull * 0.35 + fling * 0.3 + Math.sin(time * 13 + i) * spin * 0.2,
      );
      shard.rotation.z =
        side * (0.16 + Math.sin(time + i) * 0.08 + pull * 0.45 - fling * 0.3) +
        Math.sin(time * 11 + i) * spin * 0.5;
      shard.rotation.x = -pull * 0.2 + fling * 0.35 + Math.sin(time * 9 + i * 1.7) * spin * 0.6;
    });
    this.lower.rotation.x = Math.sin(time * 12) * spin * 0.25;
    this.lower.position.y = -1.7 - spin * 0.25;
    if (this.group.visible) this.ribbon.push(this.position, camera);
  }
}
