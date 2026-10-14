import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Controls } from './Controls';
import { AudioEngine } from './Audio';
import { Effects, Ribbon } from './Effects';
import { World, contactShadowTexture } from './World';
import { Boss } from './Boss';
import {
  AutoShield,
  ATTACKS,
  DUEL,
  rangeCorrection,
  steerMissile,
  threatTime,
  type AttackId,
} from './combat';
import {
  clamp,
  damp,
  groundHeight,
  resolveCircle,
  segmentBox,
  segmentSphere,
  type Obstacle,
} from './math';
import {
  SPELLS,
  type GameEvent,
  type Mode,
  type Settings,
  type Snapshot,
  type SpellId,
} from './types';

type ProjectileKind = 'player' | 'fire' | 'missile' | 'hammer';
interface Projectile {
  mesh: THREE.Mesh;
  ribbon: Ribbon;
  velocity: THREE.Vector3;
  last: THREE.Vector3;
  kind: ProjectileKind;
  life: number;
  age: number;
  damage: number;
  homing: boolean;
}
interface TraceHit {
  t: number;
  boss?: boolean;
  obstacle?: Obstacle;
  ground?: boolean;
}
const START = new THREE.Vector3(0, 0, 18);
const UP = new THREE.Vector3(0, 1, 0);
const direction = new THREE.Vector3();

export class Game {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(64, 1, 0.065, 340);
  readonly controls: Controls;
  readonly audio: AudioEngine;
  private world: World;
  private fx: Effects;
  private boss: Boss;
  private aegis = new AutoShield();
  private composer: EffectComposer;
  private settings: Settings;
  private settingsApplied = false;
  private mode: Mode = 'menu';
  private returnMode: Mode = 'playing';
  private projectiles: Projectile[] = [];
  private player = START.clone();
  private previousPlayer = START.clone();
  private velocity = new THREE.Vector3();
  private impulse = new THREE.Vector3();
  private dashDirection = new THREE.Vector3();
  private avatar: THREE.Mesh;
  private playerTrail = new Ribbon(110, 0.07);
  private shadows: THREE.InstancedMesh;
  private stamp = new THREE.Object3D();
  private yaw = 0;
  private pitch = 0.05;
  private roll = 0;
  private health = 100;
  private energy = 100;
  private dashCooldown = 0;
  private dashTime = 0;
  private knockTime = 0;
  private jumps = 0;
  private spell: SpellId = 0;
  private cooldowns = [0, 0, 0];
  private lockedOn = false;
  private damageDealt = 0;
  private impacts = 0;
  private elapsed = 0;
  private bestTime = 0;
  private time = 0;
  private modeTime = 0;
  private last = 0;
  private fps = 60;
  private frameTime = 0;
  private frames = 0;
  private slowFrames = 0;
  private renderTime = 0;
  private renderNeeded = true;
  private lowQuality = false;
  private useBloom = true;
  private shake = 0;
  private damageTimer = 10;
  private flashTimer = 0;
  private impactGate = { player: 0, boss: 0 };
  private hitStop = 0;
  private skidTimer = 0;
  private outcome: 'victory' | 'gameover' | null = null;
  private finishTimer = 0;
  private aiming = false;
  private lockToastShown = false;
  private disposed = false;
  private manualSimulation = false;
  private testIdleBoss = false;
  private testInvulnerable = false;
  private lastImpact: { surface: 'wall' | 'ground'; actor: 'player' | 'boss' } | null = null;
  private attacksFired = { fire: 0, missile: 0, hammer: 0 };
  private projectileGeometry = new THREE.IcosahedronGeometry(0.17, 1);
  private projectileMaterials = {
    player: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffad53').multiplyScalar(3) }),
    fire: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff702e').multiplyScalar(3) }),
    missile: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffbc70').multiplyScalar(3) }),
    hammer: new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff0ba').multiplyScalar(4) }),
  };
  private resizeListener = () => this.resize();
  private visibilityListener = () => {
    if (document.hidden) this.pause();
  };

  constructor(
    canvas: HTMLCanvasElement,
    settings: Settings,
    private emit: (event: GameEvent) => void,
  ) {
    this.settings = settings;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.info.autoReset = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.03;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.camera.rotation.order = 'YXZ';
    this.audio = new AudioEngine(settings);
    this.controls = new Controls(
      canvas,
      () => this.pause(),
      (slot) => this.selectSpell(slot),
      () => this.selectSpell((this.spell + 1) % 3),
      (locked) => this.emit({ type: 'lock', locked }),
      () => {
        if (this.lockToastShown) return;
        this.lockToastShown = true;
        this.emit({
          type: 'toast',
          text: 'Seret untuk melihat. Tekan E untuk mengunci pandangan ke boss.',
        });
      },
    );
    this.fx = new Effects(this.scene);
    this.world = new World(this.scene, this.fx);
    this.fx.setGroundSampler((x, z) => this.world.surfaceHeight(x, z));
    this.boss = new Boss(this.scene, this.fx);
    this.avatar = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 1.3, 0.65),
      new THREE.MeshStandardMaterial({ color: '#ed371c', roughness: 0.5, metalness: 0.02 }),
    );
    this.avatar.castShadow = this.avatar.receiveShadow = true;
    this.avatar.name = 'player-avatar';
    this.scene.add(this.avatar, this.playerTrail.mesh);
    this.shadows = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: contactShadowTexture(),
        color: '#23313a',
        transparent: true,
        opacity: 0.46,
        depthWrite: false,
      }),
      2,
    );
    this.shadows.frustumCulled = false;
    this.scene.add(this.shadows);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(800, 600), 0.5, 0.45, 1.1));
    this.composer.addPass(new OutputPass());
    try {
      const n = Number(localStorage.getItem('hea-duel-best'));
      this.bestTime = Number.isFinite(n) && n > 0 ? n : 0;
    } catch {
      /* Storage is optional. */
    }
    this.applySettings(settings);
    this.resetDuel();
    this.showcaseCamera(0);
    window.addEventListener('resize', this.resizeListener);
    document.addEventListener('visibilitychange', this.visibilityListener);
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.pause();
      this.emit({
        type: 'toast',
        text: 'Konteks grafis terputus. Muat ulang halaman untuk memulihkan arena.',
      });
    });
    this.renderer.setAnimationLoop((timestamp) => this.tick(timestamp));
  }

  get snapshot(): Snapshot {
    return {
      mode: this.mode,
      health: this.health,
      energy: this.energy,
      shield: {
        phase: this.aegis.phase,
        remaining: this.aegis.remaining,
        progress: this.aegis.progress,
        blocked: this.aegis.blocked,
      },
      boss: {
        health: this.boss.health,
        maxHealth: DUEL.bossHealth,
        alive: this.boss.alive,
        attack: ATTACKS[this.boss.director.attack].label,
        stage: this.boss.knockTime > 0 ? 'stagger' : this.boss.director.stage,
        charge: this.boss.director.charge,
        distance: this.boss.position.distanceTo(this.player),
        enraged: this.boss.enraged,
      },
      dash: clamp(1 - this.dashCooldown / 1.65, 0, 1),
      spell: this.spell,
      cooldowns: this.cooldowns.map((c, i) => clamp(c / SPELLS[i].cooldown, 0, 1)),
      damageDealt: this.damageDealt,
      impacts: this.impacts,
      wallsBroken: this.world.wallsBroken,
      craters: this.world.terrain.craters.length,
      launched: this.knockTime > 0.05 && this.impulse.length() > 4,
      lockedOn: this.lockedOn,
      fps: this.fps,
      elapsed: this.elapsed,
      bestTime: this.bestTime,
      position: { x: this.player.x, y: this.player.y, z: this.player.z },
      aimTarget: this.aiming,
    };
  }
  get diagnostics() {
    return {
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      projectiles: this.projectiles.length,
      lowQuality: this.lowQuality,
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
      camera: { yaw: this.yaw, pitch: this.pitch },
      bossCount: this.scene.children.filter((o) => o.name === 'sole-boss').length,
      bossPosition: this.boss.position.toArray(),
      attacksFired: { ...this.attacksFired },
      missiles: this.projectiles
        .filter((p) => p.kind === 'missile')
        .map((p) => ({
          position: p.mesh.position.toArray(),
          velocity: p.velocity.toArray(),
          age: p.age,
        })),
      colliders: this.world.obstacles.length,
      lastImpact: this.lastImpact,
    };
  }
  private resetDuel() {
    this.clearProjectiles();
    this.fx.clear();
    this.world.reset();
    this.boss.reset();
    this.aegis.reset();
    this.player.copy(START);
    this.previousPlayer.copy(START);
    this.velocity.set(0, 0, 0);
    this.impulse.set(0, 0, 0);
    this.health = this.energy = 100;
    this.dashCooldown = this.dashTime = this.knockTime = 0;
    this.spell = 0;
    this.cooldowns = [0, 0, 0];
    this.jumps = 0;
    this.roll = this.shake = 0;
    this.damageDealt = this.impacts = this.elapsed = 0;
    this.damageTimer = 10;
    this.hitStop = this.flashTimer = 0;
    this.impactGate.player = this.impactGate.boss = this.skidTimer = 0;
    this.outcome = null;
    this.finishTimer = 0;
    this.testIdleBoss = this.testInvulnerable = false;
    this.lastImpact = null;
    this.attacksFired = { fire: 0, missile: 0, hammer: 0 };
    this.lockedOn = this.controls.touch;
    this.avatar.visible = true;
    this.avatar.rotation.set(0, 0, 0);
    this.playerTrail.reset(this.player.clone().add(new THREE.Vector3(0, 0.8, 0)));
    this.aimAtBoss(1);
    this.boss.lockedTarget.copy(this.player).add(new THREE.Vector3(0, 0.9, 0));
  }
  start(capturePointer = true) {
    this.audio.unlock();
    this.audio.click();
    this.resetDuel();
    this.changeMode('playing');
    this.updateCamera(1, true);
    if (capturePointer) this.controls.requestLock();
    this.audio.beginDuel();
    this.emit({ type: 'duel' });
  }
  demo() {
    this.audio.unlock();
    this.resetDuel();
    this.changeMode('demo');
  }
  menu() {
    this.resetDuel();
    this.changeMode('menu');
  }
  pause() {
    if (this.mode !== 'playing' && this.mode !== 'demo') return;
    this.returnMode = this.mode;
    this.changeMode('paused');
  }
  resume() {
    if (this.mode !== 'paused') return;
    this.audio.unlock();
    this.changeMode(this.returnMode);
    if (this.returnMode === 'playing' && !this.outcome) this.controls.requestLock();
  }
  selectSpell(slot: number) {
    if (slot >= 0 && slot <= 2) {
      this.spell = slot as SpellId;
      this.audio.click();
    }
  }
  applySettings(settings: Settings) {
    const changed = !this.settingsApplied || this.settings.quality !== settings.quality;
    this.settings = { ...settings };
    this.audio.apply(settings);
    if (!changed) return;
    this.settingsApplied = true;
    this.lowQuality =
      settings.quality === 'low' || (settings.quality === 'auto' && this.controls.touch);
    this.configureQuality();
    this.slowFrames = 0;
  }
  private configureQuality() {
    this.useBloom = !this.lowQuality;
    this.renderer.shadowMap.enabled = !this.lowQuality;
    this.world.setQuality(this.lowQuality);
    this.boss.setQuality(this.lowQuality);
    this.fx.quality(this.lowQuality);
    this.resize();
  }
  private changeMode(mode: Mode) {
    this.mode = mode;
    this.modeTime = 0;
    this.renderNeeded = true;
    this.controls.setEnabled(mode === 'playing' && !this.outcome);
    this.emit({ type: 'mode', mode });
  }
  private resize() {
    const width = innerWidth,
      height = innerHeight,
      ratio = Math.min(
        devicePixelRatio || 1,
        this.lowQuality ? 1 : this.settings.quality === 'high' ? 2 : 1.5,
      );
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(width, height, false);
    this.composer.setPixelRatio(ratio);
    this.composer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.fx.resize(height, ratio);
    this.renderNeeded = true;
  }
  private tick(timestamp: number) {
    if (this.disposed) return;
    const rawDt = this.last ? (timestamp - this.last) / 1000 : 1 / 60;
    this.last = timestamp;
    if (document.hidden) return;
    if (['paused', 'gameover', 'victory'].includes(this.mode) && !this.renderNeeded) return;
    this.frames++;
    this.frameTime += rawDt;
    this.renderTime += rawDt;
    if (this.frameTime >= 0.75) {
      this.fps = Math.round(this.frames / this.frameTime);
      this.frames = this.frameTime = 0;
      if (this.settings.quality === 'auto' && !this.lowQuality && this.renderTime > 4) {
        this.slowFrames = this.fps < 28 ? this.slowFrames + 1 : 0;
        if (this.slowFrames >= 3) {
          this.lowQuality = true;
          this.configureQuality();
        }
      }
    }
    if (!this.manualSimulation) this.simulate(clamp(rawDt, 0, 0.05));
    this.renderer.info.reset();
    if (this.useBloom) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
    this.renderNeeded = false;
  }
  private simulate(realDt: number) {
    if (['paused', 'gameover', 'victory'].includes(this.mode)) return;
    this.flashTimer = Math.max(0, this.flashTimer - realDt);
    if (this.hitStop > 0) {
      this.hitStop = Math.max(0, this.hitStop - realDt);
      return;
    }
    // Fixed-size physics substeps keep fast knockback/projectiles stable at mobile frame rates.
    const steps = Math.max(1, Math.ceil(realDt / (1 / 60))),
      dt = realDt / steps;
    for (let i = 0; i < steps; i++) {
      if (['victory', 'gameover'].includes(this.mode)) break;
      this.time += dt;
      this.modeTime += dt;
      if (this.mode === 'playing' && !this.outcome) this.elapsed += dt;
      this.aegis.update(dt);
      this.damageTimer += dt;
      this.impactGate.player = Math.max(0, this.impactGate.player - dt);
      this.impactGate.boss = Math.max(0, this.impactGate.boss - dt);
      this.previousPlayer.copy(this.player);
      this.updatePlayer(dt, this.mode !== 'playing');
      this.updateBoss(dt);
      if (!this.outcome) this.updateProjectiles(dt);
      else this.clearProjectiles();
      if (this.mode !== 'playing') this.showcaseCamera(dt);
      this.presentActors(dt);
      this.fx.update(dt);
      if (this.outcome) {
        this.finishTimer -= dt;
        if (this.finishTimer <= 0) {
          this.changeMode(this.outcome);
          break;
        }
      }
    }
  }
  private updatePlayer(dt: number, showcase: boolean) {
    this.knockTime = Math.max(0, this.knockTime - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.dashTime = Math.max(0, this.dashTime - dt);
    this.cooldowns = this.cooldowns.map((c) => Math.max(0, c - dt));
    this.energy = Math.min(100, this.energy + dt * 12);
    if (this.damageTimer > 9 && !this.outcome) this.health = Math.min(100, this.health + dt * 3);
    if (this.controls.focusRequested) {
      this.controls.focusRequested = false;
      this.lockedOn = !this.lockedOn;
    }
    const look = this.controls.look();
    if (Math.abs(look.x) + Math.abs(look.y) > 2) this.lockedOn = false;
    this.yaw -= look.x * this.settings.sensitivity * 0.0021;
    this.pitch = clamp(this.pitch - look.y * this.settings.sensitivity * 0.0021, -1.1, 1.15);
    if (this.lockedOn && this.boss.alive) this.aimAtBoss(1 - Math.exp(-dt * 10));
    const move = this.outcome ? { x: 0, z: 0 } : this.controls.movement();
    const sin = Math.sin(this.yaw),
      cos = Math.cos(this.yaw);
    let wishX = move.x * cos - move.z * sin,
      wishZ = -move.x * sin - move.z * cos;
    if (showcase) {
      const target = new THREE.Vector3(
        Math.sin(this.time * 0.46) * 8,
        0,
        9 + Math.cos(this.time * 0.46) * 4,
      );
      const wanted = target.sub(this.player);
      wanted.y = 0;
      wanted.clampLength(0, 1);
      wishX = wanted.x;
      wishZ = wanted.z;
    }
    const floor = groundHeight(
      this.player.x,
      this.player.z,
      this.player.y,
      this.world.obstacles,
      this.world.surfaceHeight(this.player.x, this.player.z),
    );
    const grounded = this.player.y <= floor + 0.045 && this.velocity.y + this.impulse.y <= 0;
    if (
      grounded &&
      !(this.knockTime > 0 && this.velocity.y + this.impulse.y <= -DUEL.groundBreakSpeed)
    ) {
      this.player.y = floor;
      this.velocity.y = this.impulse.y = 0;
      this.jumps = 0;
    }
    if (this.controls.jumpRequested) {
      this.controls.jumpRequested = false;
      if (this.jumps < 2 && this.damageTimer > 0.16) {
        this.velocity.y = this.jumps === 0 ? 9.4 : 8.2;
        this.impulse.y = 0;
        this.jumps++;
        if (this.jumps === 2) {
          this.fx.burst(this.player, '#ceeaff', 12, 2, 0.22, 1);
          this.audio.dash();
        }
      }
    }
    if (this.controls.dashRequested) {
      this.controls.dashRequested = false;
      if (this.dashCooldown === 0 && this.damageTimer > 0.16) {
        this.dashTime = 0.2;
        this.dashCooldown = 1.65;
        this.impulse.x *= 0.2;
        this.impulse.z *= 0.2;
        this.dashDirection.set(wishX, 0, wishZ);
        if (this.dashDirection.lengthSq() < 0.01) this.dashDirection.set(-sin, 0, -cos);
        this.dashDirection.normalize();
        this.audio.dash();
        this.fx.burst(this.player.clone().add(UP), '#effaff', 16, 3, 0.25, 2);
      }
    }
    const speed = showcase ? 5.5 : this.damageTimer < 0.22 ? 1 : this.knockTime > 0 ? 3.2 : 8;
    this.velocity.x = damp(this.velocity.x, wishX * speed, grounded ? 13 : 6, dt);
    this.velocity.z = damp(this.velocity.z, wishZ * speed, grounded ? 13 : 6, dt);
    this.velocity.y -= 24 * dt;
    const motor = this.velocity.clone();
    if (this.dashTime > 0) {
      motor.x = this.dashDirection.x * 32;
      motor.z = this.dashDirection.z * 32;
    }
    this.moveBody(this.player, motor, this.impulse, dt, this.knockTime > 0, 'player', 0.38, 1.65);
    this.velocity.y = motor.y;
    const drag = Math.exp(-dt * (grounded ? 2.1 : 0.65));
    this.impulse.x *= drag;
    this.impulse.z *= drag;
    this.skidTimer -= dt;
    if (
      this.knockTime > 0 &&
      this.impulse.length() > 10 &&
      this.player.y < this.world.surfaceHeight(this.player.x, this.player.z) + 0.3 &&
      this.skidTimer <= 0
    ) {
      this.skidTimer = 0.08;
      this.fx.debris(this.player, 3, 2.3, 1.6, this.impulse);
      this.fx.dust(this.player, 2, 0.8, this.impulse);
    }
    this.roll = damp(
      this.roll,
      this.settings.reducedEffects
        ? 0
        : -move.x * 0.027 + (this.knockTime > 0 ? Math.sin(this.time * 8) * 0.07 : 0),
      9,
      dt,
    );
    if (!showcase) {
      this.updateCamera(dt);
      this.camera.getWorldDirection(direction);
      this.aiming = this.aimsAtBoss(direction);
      const shoot = this.controls.shooting || this.controls.shotRequested;
      this.controls.shotRequested = false;
      if (shoot && !this.outcome) this.cast();
    }
  }
  private moveBody(
    position: THREE.Vector3,
    motor: THREE.Vector3,
    impulse: THREE.Vector3,
    dt: number,
    knocked: boolean,
    actor: 'player' | 'boss',
    radius: number,
    height: number,
  ) {
    const speed = motor.clone().add(impulse).length(),
      steps = Math.max(1, Math.ceil((speed * dt) / 0.22));
    const sub = dt / steps;
    for (let i = 0; i < steps; i++) {
      const previousFeet = position.y,
        total = motor.clone().add(impulse);
      let nx = position.x + total.x * sub,
        nz = position.z + total.z * sub;
      const ny = position.y + total.y * sub;
      const wall = this.world.obstacles.find(
        (b) =>
          previousFeet < b.top - 0.06 &&
          previousFeet + height > (b.bottom ?? 0) + 0.03 &&
          Math.hypot(nx - clamp(nx, b.minX, b.maxX), nz - clamp(nz, b.minZ, b.maxZ)) < radius,
      );
      if (wall && knocked && Math.hypot(impulse.x, impulse.z) >= DUEL.wallBreakSpeed) {
        const at = new THREE.Vector3(
          clamp(nx, wall.minX, wall.maxX),
          clamp(position.y + height * 0.55, wall.bottom ?? 0, wall.top),
          clamp(nz, wall.minZ, wall.maxZ),
        );
        const force = impulse.length(),
          broken = this.world.damageWall(wall, at, impulse, actor === 'boss' ? 2.65 : 2.1);
        if (this.impactGate[actor] <= 0) {
          this.worldImpact(at, force, 'wall', actor);
          impulse.multiplyScalar(broken ? 0.83 : -0.15);
        }
      }
      const resolved = resolveCircle(nx, nz, previousFeet, radius, this.world.obstacles, height);
      nx = resolved.x;
      nz = resolved.z;
      position.x = nx;
      position.z = nz;
      let floor = groundHeight(
        nx,
        nz,
        previousFeet,
        this.world.obstacles,
        this.world.surfaceHeight(nx, nz),
      );
      if (total.y < 0 && ny <= floor) {
        const force = Math.abs(total.y);
        if (knocked && force >= DUEL.groundBreakSpeed && this.impactGate[actor] <= 0) {
          const at = new THREE.Vector3(nx, floor, nz);
          const support = this.world.obstacles.find(
            (b) =>
              Math.abs(b.top - floor) < 0.1 &&
              nx >= b.minX - radius &&
              nx <= b.maxX + radius &&
              nz >= b.minZ - radius &&
              nz <= b.maxZ + radius,
          );
          if (support) this.world.damageWall(support, at, total, 2.4);
          else this.world.crater(at, force);
          this.worldImpact(at, force, support ? 'wall' : 'ground', actor);
          floor = groundHeight(
            nx,
            nz,
            previousFeet,
            this.world.obstacles,
            this.world.surfaceHeight(nx, nz),
          );
          impulse.x *= 0.78;
          impulse.z *= 0.78;
        }
        position.y = floor;
        motor.y = impulse.y = 0;
      } else {
        // A preserved ceiling above a punched opening still collides when jumping upward.
        const ceiling = this.world.obstacles.find(
          (b) =>
            (b.bottom ?? 0) > previousFeet + height - 0.03 &&
            ny + height >= (b.bottom ?? 0) &&
            nx > b.minX - radius &&
            nx < b.maxX + radius &&
            nz > b.minZ - radius &&
            nz < b.maxZ + radius,
        );
        if (ceiling && total.y > 0) {
          position.y = (ceiling.bottom ?? 0) - height;
          motor.y = impulse.y = 0;
        } else position.y = ny;
      }
    }
  }
  private aimAtBoss(amount: number) {
    const delta = this.boss.position.clone().sub(this.player);
    delta.y -= 1.95;
    const yaw = Math.atan2(-delta.x, -delta.z),
      diff = Math.atan2(Math.sin(yaw - this.yaw), Math.cos(yaw - this.yaw));
    this.yaw += diff * amount;
    this.pitch += (Math.atan2(delta.y, Math.hypot(delta.x, delta.z) + 6.4) - this.pitch) * amount;
  }
  private updateCamera(dt: number, snap = false) {
    const quaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'),
    );
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion),
      right = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);
    const pivot = this.player.clone().add(new THREE.Vector3(0, 1.25, 0));
    const desired = pivot
      .clone()
      .addScaledVector(forward, -6.4)
      .addScaledVector(right, 0.65)
      .addScaledVector(UP, 0.95);
    const wall = this.trace(pivot, desired, false);
    if (wall) desired.lerpVectors(pivot, desired, Math.max(0.1, wall.t - 0.06));
    if (snap) this.camera.position.copy(desired);
    else this.camera.position.lerp(desired, 1 - Math.exp(-dt * (this.knockTime > 0 ? 18 : 24)));
    this.shake = damp(this.shake, 0, 11, dt);
    const shake = this.settings.reducedEffects ? 0 : this.shake;
    this.camera.rotation.set(
      this.pitch + (Math.random() - 0.5) * shake,
      this.yaw + (Math.random() - 0.5) * shake,
      this.roll,
    );
    this.camera.fov = damp(
      this.camera.fov,
      this.settings.reducedEffects ? 74 : this.dashTime > 0 || this.knockTime > 0.5 ? 87 : 74,
      9,
      dt,
    );
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }
  private showcaseCamera(dt: number) {
    const portrait = this.camera.aspect < 0.85;
    if (this.mode === 'demo') {
      const center = this.player.clone().lerp(this.boss.position, 0.45);
      const desired = center
        .clone()
        .add(new THREE.Vector3(Math.sin(this.time * 0.13) * 12 + 5, 5.8, 17));
      this.camera.position.lerp(desired, 1 - Math.exp(-dt * 3));
      this.camera.lookAt(center);
      this.camera.fov = 67;
    } else {
      this.camera.position.set(
        (portrait ? 8 : 12.5) + Math.sin(this.time * 0.08) * 2,
        7.0,
        portrait ? 28 : 23,
      );
      this.camera.lookAt(-1, 3.3, -0.5);
      this.camera.fov = portrait ? 60 : 57;
    }
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }
  private presentActors(dt: number) {
    this.avatar.position.copy(this.player).y += 0.75;
    this.avatar.rotation.set(
      this.knockTime > 0 ? Math.sin(this.time * 10) * 0.18 : 0,
      this.yaw,
      this.knockTime > 0 ? 0.14 : 0,
    );
    this.playerTrail.push(this.avatar.position, this.camera.position);
    this.boss.present(
      this.time,
      dt,
      this.player.clone().add(new THREE.Vector3(0, 0.95, 0)),
      this.camera.position,
    );
    [this.player, this.boss.position].forEach((p, i) => {
      this.stamp.position.set(p.x, this.world.surfaceHeight(p.x, p.z) + 0.035, p.z);
      this.stamp.rotation.set(-Math.PI / 2, 0, 0);
      const size = i === 0 ? 1.6 + Math.max(0, p.y) * 0.2 : this.boss.alive ? 3.3 : 0;
      this.stamp.scale.set(size, size, 1);
      this.stamp.updateMatrix();
      this.shadows.setMatrixAt(i, this.stamp.matrix);
    });
    this.shadows.instanceMatrix.needsUpdate = true;
  }
  private updateBoss(dt: number) {
    if (!this.boss.alive || this.outcome) return;
    const b = this.boss;
    b.knockTime = Math.max(0, b.knockTime - dt);
    const toward = this.player.clone().sub(b.position);
    toward.y = 0;
    const distance = toward.length();
    toward.normalize();
    const tangent = new THREE.Vector3(-toward.z, 0, toward.x);
    const orbit = Math.sin(this.time * 0.3) > 0 ? 1 : -1;
    const motor = toward
      .clone()
      .multiplyScalar(rangeCorrection(distance))
      .addScaledVector(tangent, orbit * (b.director.stage === 'recover' ? 3.5 : 1.8));
    let height = clamp(this.player.y + 4.1, 3.7, 14) + Math.sin(this.time * 1.1) * 0.45;
    if (b.director.attack === 'hammer' && b.director.stage !== 'recover') height += 4;
    const cover = this.trace(b.position, this.player.clone().add(UP), false);
    if (cover?.obstacle && distance > 9)
      height = Math.min(19, Math.max(height, cover.obstacle.top + 2));
    motor.y = clamp((height - b.position.y) * 2.4, -5, 7);
    if (b.knockTime > 0) {
      motor.multiplyScalar(0.15);
      b.impulse.y -= 19 * dt;
    }
    b.velocity.lerp(motor, 1 - Math.exp(-dt * 5));
    const feet = b.position.clone().addScaledVector(UP, -1.4);
    this.moveBody(feet, b.velocity, b.impulse, dt, b.knockTime > 0, 'boss', 1.15, 2.8);
    b.position.copy(feet).addScaledVector(UP, 1.4);
    b.impulse.x *= Math.exp(-dt * 1.2);
    b.impulse.z *= Math.exp(-dt * 1.2);
    if (b.knockTime <= 0) b.impulse.y = damp(b.impulse.y, 0, 7, dt);
    b.group.position.copy(b.position);
    b.group.lookAt(this.player.clone().add(UP));
    b.group.updateMatrixWorld(true);
    if (b.knockTime > 0.2 || this.testIdleBoss) return;
    if (b.director.stage === 'telegraph' && b.director.charge < 0.78)
      b.lockedTarget
        .copy(this.player)
        .add(new THREE.Vector3(this.velocity.x * 0.16, 0.95, this.velocity.z * 0.16));
    for (const command of b.director.step(dt, b.enraged)) {
      if (command.type === 'tell') {
        if (this.mode !== 'menu') this.audio.charge();
        if (command.attack === 'hammer') {
          const mark = this.player.clone();
          mark.y = this.world.surfaceHeight(mark.x, mark.z) + 0.04;
          this.fx.glyph(mark, UP, '#ff9a5d', 1.5, 1.4);
        }
      } else this.bossAttack(command.attack, command.index);
    }
  }
  private bossAttack(attack: AttackId, index: number) {
    const muzzle = this.boss.muzzle();
    if (attack === 'fire') {
      const aim = this.player
        .clone()
        .add(new THREE.Vector3(this.velocity.x * 0.1, 0.95, this.velocity.z * 0.1))
        .sub(muzzle)
        .normalize();
      aim.applyAxisAngle(UP, Math.sin(index * 2.1) * 0.011);
      this.spawn(muzzle, aim.multiplyScalar(27), 'fire', 9);
      this.fx.glyph(muzzle, aim, '#ff9d48', 0.3, 0.17);
      if (this.mode !== 'menu' && index % 2 === 0) this.audio.cast(0);
    } else if (attack === 'missiles') {
      for (const side of [-1, 1]) {
        const port = this.boss.muzzle(side),
          forward = this.player.clone().add(UP).sub(port).normalize();
        const wing = new THREE.Vector3(1, 0, 0).applyQuaternion(this.boss.group.quaternion);
        const launch = forward
          .multiplyScalar(0.65)
          .addScaledVector(wing, side * 0.9)
          .addScaledVector(UP, 0.45 + index * 0.12)
          .normalize()
          .multiplyScalar(13);
        this.spawn(port, launch, 'missile', 16);
        this.fx.glyph(port, launch, '#ffbc80', 0.48, 0.35);
      }
      if (this.mode !== 'menu') this.audio.cast(0);
    } else {
      const aim = this.boss.lockedTarget.clone().sub(muzzle).normalize();
      this.spawn(muzzle, aim.multiplyScalar(34), 'hammer', 26);
      this.fx.glyph(muzzle, aim, '#fff0b8', 1.2, 0.45);
      this.fx.burst(muzzle, '#ffe7ae', 35, 5, 0.6, 1);
      if (this.mode !== 'menu') this.audio.cast(2);
    }
  }
  private aimsAtBoss(forward: THREE.Vector3) {
    if (!this.boss.alive) return false;
    const delta = this.boss.position.clone().sub(this.camera.position);
    const threshold = this.controls.touch || this.lockedOn ? 0.925 : 0.987;
    return (
      delta.normalize().dot(forward) > threshold &&
      this.clearSight(this.camera.position, this.boss.position)
    );
  }
  private cast() {
    const spell = SPELLS[this.spell];
    if (this.cooldowns[this.spell] > 0 || this.energy < spell.cost) return;
    this.energy -= spell.cost;
    this.cooldowns[this.spell] = spell.cooldown;
    this.audio.cast(this.spell);
    this.camera.getWorldDirection(direction);
    const hasTarget = this.aimsAtBoss(direction);
    const distantAim = this.camera.position.clone().addScaledVector(direction, 60);
    const origin = this.player.clone().add(new THREE.Vector3(0, 1.12, 0));
    const aim = hasTarget ? this.boss.position.clone() : distantAim;
    direction.copy(aim).sub(origin).normalize();
    origin.addScaledVector(direction, 0.6);
    if (this.spell === 0) {
      this.spawn(origin, direction.clone().multiplyScalar(40), 'player', spell.damage, hasTarget);
      this.fx.glyph(origin, direction, '#ffa34f', 0.27, 0.25);
    } else if (this.spell === 1) {
      const end = origin.clone().addScaledVector(direction, 70),
        hit = this.trace(origin, end, true);
      if (hit) end.lerpVectors(origin, end, hit.t);
      this.fx.beam(origin, end, '#78e9ff', 0.045, 0.25);
      this.fx.glyph(origin, direction, '#79efff', 0.5, 0.4);
      this.fx.burst(end, '#95f5ff', 24, 4, 0.4, 1);
      if (hit?.boss) this.damageBoss(spell.damage, direction.clone().multiplyScalar(3.5));
    } else {
      const end = origin.clone().addScaledVector(direction, 27),
        hit = this.trace(origin, end, true);
      if (hit) end.lerpVectors(origin, end, hit.t);
      if (hasTarget && this.boss.position.distanceTo(origin) < 34) end.copy(this.boss.position);
      this.fx.impact(end, '#dff9ff', true);
      this.fx.glyph(end, this.camera.position.clone().sub(end), '#dcf9ff', 1.55, 0.6);
      if (hit?.obstacle)
        this.world.damageWall(hit.obstacle, end, direction.clone().multiplyScalar(25), 2.6);
      if (
        this.boss.alive &&
        this.boss.position.distanceTo(end) < 6.5 &&
        this.clearSight(end, this.boss.position)
      )
        this.damageBoss(spell.damage, direction.clone().multiplyScalar(27).addScaledVector(UP, 3));
      this.shake = Math.max(this.shake, 0.018);
    }
  }
  private clearSight(from: THREE.Vector3, to: THREE.Vector3) {
    const hit = this.trace(from, to, false);
    return !hit || hit.t >= 0.985;
  }
  private trace(start: THREE.Vector3, end: THREE.Vector3, boss: boolean): TraceHit | null {
    let best: TraceHit | null = null;
    for (const obstacle of this.world.obstacles) {
      const t = segmentBox(start, end, obstacle, 0.02);
      if (t !== null && (!best || t < best.t)) best = { t, obstacle };
    }
    const ground = this.world.traceGround(start, end);
    if (ground !== null && (!best || ground < best.t)) best = { t: ground, ground: true };
    if (boss && this.boss.alive) {
      const t = segmentSphere(start, end, this.boss.position, 1.48);
      if (t !== null && (!best || t < best.t)) best = { t, boss: true };
    }
    return best;
  }
  private spawn(
    at: THREE.Vector3,
    velocity: THREE.Vector3,
    kind: ProjectileKind,
    damage: number,
    homing = false,
  ) {
    if (this.projectiles.length >= 72) this.removeProjectile(0);
    const mesh = new THREE.Mesh(this.projectileGeometry, this.projectileMaterials[kind]);
    mesh.position.copy(at);
    const scale = kind === 'hammer' ? 2.15 : kind === 'missile' ? 1.2 : 0.8;
    mesh.scale.set(scale, scale, scale * (kind === 'missile' ? 2.8 : 1.8));
    mesh.lookAt(at.clone().add(velocity));
    this.scene.add(mesh);
    const ribbon = new Ribbon(
      kind === 'missile' ? 40 : 20,
      kind === 'hammer' ? 0.12 : 0.035,
      kind === 'hammer' ? '#ffeecf' : '#ffae77',
    );
    ribbon.reset(at);
    this.scene.add(ribbon.mesh);
    this.projectiles.push({
      mesh,
      ribbon,
      velocity,
      last: at.clone(),
      kind,
      damage,
      homing,
      life: kind === 'player' ? 2.5 : kind === 'missile' ? 6 : 3.2,
      age: 0,
    });
    if (kind !== 'player') this.attacksFired[kind]++;
  }
  private updateProjectiles(dt: number) {
    const center = this.player.clone().add(new THREE.Vector3(0, 0.9, 0)),
      previousCenter = this.previousPlayer.clone().add(new THREE.Vector3(0, 0.9, 0));
    const motion = this.player.clone().sub(this.previousPlayer).divideScalar(Math.max(dt, 0.001));
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.age += dt;
      if (p.life <= 0) {
        this.fx.burst(p.mesh.position, '#ffab72', 6, 1, 0.22);
        this.removeProjectile(i);
        continue;
      }
      if (p.kind === 'missile' && p.age > 0.38 && p.age < 3.6) {
        const toward = center.clone().addScaledVector(motion, 0.09).sub(p.mesh.position);
        p.velocity.copy(steerMissile(p.velocity, toward, 1.5, dt, Math.min(24, 13 + p.age * 4)));
      } else if (p.kind === 'player' && p.homing && this.boss.alive)
        p.velocity.lerp(
          this.boss.position.clone().sub(p.mesh.position).normalize().multiplyScalar(40),
          1 - Math.exp(-dt * 6),
        );
      p.last.copy(p.mesh.position);
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.mesh.lookAt(p.mesh.position.clone().add(p.velocity));
      const worldHit = this.trace(p.last, p.mesh.position, p.kind === 'player');
      if (p.kind !== 'player') {
        const horizon = dt + DUEL.shieldPrediction;
        const threat = threatTime(p.last, p.velocity, previousCenter, motion, horizon);
        if (threat !== null) {
          const futureEnd = p.last.clone().addScaledVector(p.velocity, horizon),
            cover = this.trace(p.last, futureEnd, false);
          if ((!cover || cover.t * horizon > threat + 0.001) && this.aegis.intercept()) {
            const incoming = p.velocity.clone().normalize(),
              intercept = center.clone().addScaledVector(incoming, -1.2);
            this.fx.block(intercept, incoming);
            if (this.mode !== 'menu') this.audio.block();
            this.emit({
              type: 'block',
              direction: { x: -incoming.x, y: -incoming.y, z: -incoming.z },
            });
            this.removeProjectile(i);
            continue;
          }
        }
        const relativeStart = p.last.clone().sub(previousCenter),
          relativeEnd = p.mesh.position.clone().sub(center);
        const hitPlayer = segmentSphere(
          relativeStart,
          relativeEnd,
          new THREE.Vector3(),
          DUEL.bodyRadius,
        );
        if (hitPlayer !== null && (!worldHit || hitPlayer <= worldHit.t)) {
          if (this.dashTime <= 0) this.damagePlayer(p.damage, p.velocity, p.kind);
          this.fx.burst(p.mesh.position, '#ff9a62', 18, 3.5, 0.36);
          this.removeProjectile(i);
          continue;
        }
      }
      if (worldHit) {
        p.mesh.position.lerpVectors(p.last, p.mesh.position, worldHit.t);
        this.fx.impact(
          p.mesh.position,
          p.kind === 'player' ? '#ffc18a' : '#ff9d58',
          p.kind === 'hammer',
        );
        if (worldHit.boss)
          this.damageBoss(p.damage, p.velocity.clone().normalize().multiplyScalar(1.7));
        else if (p.kind === 'hammer' || p.kind === 'missile') {
          if (worldHit.obstacle)
            this.world.damageWall(
              worldHit.obstacle,
              p.mesh.position,
              p.velocity,
              p.kind === 'hammer' ? 2.5 : 1.35,
            );
          if (worldHit.ground && p.kind === 'hammer') this.world.crater(p.mesh.position, 18);
        }
        this.removeProjectile(i);
        continue;
      }
      p.ribbon.push(p.mesh.position, this.camera.position);
      if (Math.random() < dt * 18)
        this.fx.burst(p.mesh.position, '#ffc086', 1, 0.35, p.kind === 'hammer' ? 0.5 : 0.22, 0);
    }
  }
  private removeProjectile(index: number) {
    const p = this.projectiles[index];
    if (!p) return;
    p.mesh.removeFromParent();
    p.ribbon.dispose();
    this.projectiles.splice(index, 1);
  }
  private clearProjectiles() {
    while (this.projectiles.length) this.removeProjectile(this.projectiles.length - 1);
  }
  private damageBoss(amount: number, impulse: THREE.Vector3) {
    if (!this.boss.alive || this.outcome || this.mode !== 'playing') return;
    const actual = Math.min(amount, this.boss.health);
    this.boss.health -= actual;
    this.damageDealt += actual;
    this.boss.flash = 0.11;
    if (impulse.length() > 10) {
      this.boss.impulse.copy(impulse);
      this.boss.knockTime = 1.3;
    } else this.boss.impulse.add(impulse).clampLength(0, 9);
    this.emit({ type: 'hit', kill: !this.boss.alive, damage: actual });
    this.audio.hit(!this.boss.alive);
    if (!this.boss.alive) {
      this.boss.group.visible = false;
      this.boss.ribbon.mesh.visible = false;
      this.fx.impact(this.boss.position, '#ffe0a1', true);
      this.fx.debris(this.boss.position, 35, 8, 3);
      this.fx.dust(this.boss.position, 15, 2.5);
      this.outcome = 'victory';
      this.finishTimer = 1.15;
      this.controls.setEnabled(false);
      if (this.bestTime === 0 || this.elapsed < this.bestTime) {
        this.bestTime = this.elapsed;
        try {
          localStorage.setItem('hea-duel-best', String(this.bestTime));
        } catch {
          /* Optional. */
        }
      }
    }
  }
  private damagePlayer(amount: number, incoming: THREE.Vector3, kind: ProjectileKind) {
    if (this.outcome || this.damageTimer < 0.11) return;
    this.damageTimer = 0;
    if (this.mode === 'playing' && !this.testInvulnerable)
      this.health = Math.max(0, this.health - amount);
    const vector = incoming.clone().normalize(),
      magnitude = kind === 'hammer' ? 43 : kind === 'missile' ? 27 : 8;
    this.impulse.x = this.impulse.x * 0.35 + vector.x * magnitude;
    this.impulse.z = this.impulse.z * 0.35 + vector.z * magnitude;
    this.impulse.y =
      kind === 'hammer'
        ? Math.min(-5, vector.y * magnitude)
        : kind === 'missile'
          ? Math.max(6, 9 + vector.y * 8)
          : 2;
    this.velocity.y = 0;
    this.knockTime = kind === 'fire' ? 0.55 : 1.7;
    this.shake = 0.018;
    if (this.mode !== 'menu') this.audio.damage();
    this.emit({ type: 'damage', amount });
    if (this.health === 0 && this.mode === 'playing') {
      this.outcome = 'gameover';
      this.finishTimer = 2.2;
      this.controls.setEnabled(false);
    }
  }
  private worldImpact(
    at: THREE.Vector3,
    strength: number,
    surface: 'wall' | 'ground',
    actor: 'player' | 'boss',
  ) {
    this.impactGate[actor] = 0.22;
    this.impacts++;
    this.lastImpact = { surface, actor };
    this.fx.burst(at, '#f2f7ed', 30, 7, 0.3, 3);
    if (surface === 'ground') this.fx.shock(at.clone().addScaledVector(UP, 0.09), '#edf4e9', 6);
    if (this.mode !== 'menu') this.audio.crash(strength);
    this.shake = this.settings.reducedEffects ? 0 : Math.min(0.1, strength / 500);
    this.hitStop = this.settings.reducedEffects ? 0 : 0.065;
    // Impact frames are caused by secondary world collisions, never by ordinary spell casts.
    if (this.flashTimer <= 0) {
      this.flashTimer = DUEL.impactInterval;
      this.emit({ type: 'impact', surface, actor, strength });
    }
  }

  /** Explicit dev-only QA scenarios. Never exported to the production Pages build. */
  testHarness() {
    if (!import.meta.env.DEV || !new URLSearchParams(location.search).has('test')) return undefined;
    return {
      freeze: (value: boolean) => {
        this.manualSimulation = value;
      },
      step: (seconds: number) => {
        for (let left = Math.min(30, Math.max(0, seconds)); left > 1e-8; left -= 1 / 60)
          this.simulate(Math.min(left, 1 / 60));
        this.renderNeeded = true;
      },
      scenario: (name: string) => {
        this.start(false);
        this.testIdleBoss = true;
        if (name === 'wall') {
          this.player.set(-7, 0, 12);
          this.previousPlayer.copy(this.player);
          this.aegis.phase = 'cooldown';
          this.aegis.remaining = 3.2;
          this.spawn(new THREE.Vector3(-3, 0.95, 12), new THREE.Vector3(-38, 0, 0), 'hammer', 26);
        } else if (name === 'ground') {
          this.player.set(0, 6, 12);
          this.previousPlayer.copy(this.player);
          this.aegis.phase = 'cooldown';
          this.aegis.remaining = 3.2;
          this.spawn(new THREE.Vector3(0, 10, 12), new THREE.Vector3(0, -34, 0), 'hammer', 26);
        } else if (name === 'shield') {
          const center = this.player.clone().add(new THREE.Vector3(0, 0.95, 0));
          for (const side of [
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 1, 0),
          ])
            this.spawn(
              center.clone().addScaledVector(side, 2.5),
              side.multiplyScalar(-25),
              'hammer',
              26,
            );
        } else if (name === 'nova') {
          this.player.set(0, 0, 10);
          this.previousPlayer.copy(this.player);
          this.boss.position.set(0, 3, 0);
          this.spell = 2;
          this.lockedOn = true;
        } else if (name === 'cover') {
          this.player.set(-7, 0, 12);
          this.previousPlayer.copy(this.player);
          this.spawn(new THREE.Vector3(-17, 0.95, 12), new THREE.Vector3(30, 0, 0), 'fire', 9);
        } else if (name === 'victory') {
          this.boss.health = 1;
          this.lockedOn = true;
          this.spell = 1;
        } else if (name === 'defeat') {
          this.health = 1;
          this.aegis.phase = 'cooldown';
          this.aegis.remaining = 3.2;
          this.spawn(
            this.player.clone().add(new THREE.Vector3(0, 0.95, -3)),
            new THREE.Vector3(0, 0, 28),
            'missile',
            16,
          );
        } else if (name === 'patterns') {
          this.testIdleBoss = false;
          this.testInvulnerable = true;
        }
        this.aimAtBoss(1);
        this.updateCamera(1, true);
        this.presentActors(0);
        this.renderNeeded = true;
      },
      incoming: () =>
        this.spawn(
          this.player.clone().add(new THREE.Vector3(0, 0.95, 3)),
          new THREE.Vector3(0, 0, -28),
          'fire',
          9,
        ),
      groundAt: (x: number, z: number) => this.world.surfaceHeight(x, z),
      wallRay: (from: number[], to: number[]) =>
        this.trace(new THREE.Vector3().fromArray(from), new THREE.Vector3().fromArray(to), false),
    };
  }
  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.controls.setEnabled(false);
    window.removeEventListener('resize', this.resizeListener);
    document.removeEventListener('visibilitychange', this.visibilityListener);
    this.clearProjectiles();
    this.fx.clear();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
