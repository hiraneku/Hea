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
  guideMissile,
  shieldCovers,
  shieldScale,
  shieldIntercept,
  salvoSpread,
  HitPause,
  PROJECTILES,
  type ProjectileKind,
  type MissileGuidance,
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

import { ARENA, FLIGHT, GROUND, HEAVY } from './config';
import { flightWish, advanceFlight } from './flight';
import type { FiringLane } from './AttackSight';
import {
  AirDash,
  BodyTumble,
  LaunchRelease,
  recoveryBlend,
  springVector,
  landingSlide,
  groundFriction,
  supportHeight,
} from './motion';
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
  radius: number;
  origin: THREE.Vector3;
  guidance: MissileGuidance;
}
interface TraceHit {
  t: number;
  boss?: boolean;
  obstacle?: Obstacle;
  ground?: boolean;
}
const START = new THREE.Vector3(0, 1.8, 24);
const UP = new THREE.Vector3(0, 1, 0);
const direction = new THREE.Vector3();

export class Game {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(64, 1, 0.065, 480);
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
  private airDash = new AirDash();
  private flightEnabled = true;
  private verticalVelocity = 0;
  private groundJumps = 0;
  private heavyPenetrations: {
    owner: number;
    thickness: number;
    entry: number[];
    exit: number[];
  }[] = [];
  private groundReactions: { actor: string; speed: number; bounce: number; position: number[] }[] =
    [];
  private flightAcceleration = new THREE.Vector3();
  private cameraSpringVelocity = new THREE.Vector3();
  private playerTumble = new BodyTumble(true);
  private playerRelease = new LaunchRelease();
  private bank = new THREE.Vector3();
  private bossLane: FiringLane = { mode: 'clear', walls: [], thickness: 0 };
  private sightClock = 0;
  private seekClock = 0;
  private breachClock = 0;
  private blockedCasts = 0;
  private firePacket: { packet: number; pattern: number; origin: THREE.Vector3 } | null = null;
  private pendingFire: { origin: THREE.Vector3; delay: number; index: number }[] = [];
  private shieldPatches: { offset: number[]; position: number[]; normal: number[] }[] = [];
  private avatar: THREE.Mesh;
  private playerTrail = new Ribbon(150, 0.085);
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
  private pendingPlayerImpulse: THREE.Vector3 | null = null;
  private facing = new THREE.Vector3(0, 0, -1);
  private facingQuaternion = new THREE.Quaternion();
  private lastDamageBlind = false;
  private lastBlock: { scale: number; radius: number; direction: number[] } | null = null;
  private contacts = 0;
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
  private autoResolution = 1;
  private useBloom = true;
  private shake = 0;
  private damageTimer = 10;
  private flashTimer = 0;
  private impactGate = { player: 0, boss: 0 };
  private hitPause = new HitPause();
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
    this.spellRuneMaterial = new THREE.MeshBasicMaterial({
      map: this.fx.sigilMap,
      color: '#ffba78',
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    });
    this.world = new World(this.scene, this.fx);
    this.fx.setGroundSampler((x, z) => this.world.surfaceHeight(x, z));
    this.boss = new Boss(this.scene, this.fx);
    this.avatar = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 1.3, 0.65),
      new THREE.MeshStandardMaterial({ color: '#ed371c', roughness: 0.5, metalness: 0.02 }),
    );
    this.avatar.castShadow = this.avatar.receiveShadow = true;
    this.avatar.name = 'player-avatar';
    this.avatar.rotation.order = 'YXZ';
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.36, 0.075),
      new THREE.MeshBasicMaterial({ color: '#ffd8ba' }),
    );
    face.position.set(0, 0.3, -0.328);
    face.rotation.y = Math.PI;
    this.avatar.add(face);
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

  private setFlight(enabled: boolean) {
    if (this.flightEnabled === enabled) return;
    this.flightEnabled = enabled;
    this.controls.jumpRequested = false;
    if (!this.playerTumble.physical) {
      if (enabled) {
        this.velocity.y = this.verticalVelocity;
        this.verticalVelocity = 0;
      } else {
        this.verticalVelocity = this.velocity.y;
        this.velocity.y = 0;
        this.groundJumps = 1;
        this.airDash.direction.y = this.airDash.velocity.y = 0;
      }
      this.flightAcceleration.y = 0;
    }
  }
  get snapshot(): Snapshot {
    return {
      mode: this.mode,
      health: this.health,
      energy: this.energy,
      shield: {
        phase: this.aegis.phase,
        enabled: this.aegis.enabled,
        blocked: this.aegis.blocked,
        blindWarning: this.lastDamageBlind && this.damageTimer < 1.25,
      },
      boss: {
        health: this.boss.health,
        maxHealth: DUEL.bossHealth,
        alive: this.boss.alive,
        attack: ATTACKS[this.boss.director.attack].label,
        stage:
          this.boss.knockTime > 0
            ? 'stagger'
            : this.bossLane.mode === 'blocked'
              ? 'search'
              : this.boss.director.stage,
        charge: this.boss.director.charge,
        distance: this.boss.position.distanceTo(this.player),
        enraged: this.boss.enraged,
        maneuver: this.boss.tactics.maneuver,
      },
      dash: clamp(1 - this.dashCooldown / 1.65, 0, 1),
      spell: this.spell,
      cooldowns: this.cooldowns.map((c, i) => clamp(c / SPELLS[i].cooldown, 0, 1)),
      damageDealt: this.damageDealt,
      impacts: this.impacts,
      wallsBroken: this.world.wallsBroken,
      craters: this.world.terrain.craters.length,
      launched: this.knockTime > 0.05 && this.impulse.length() > 4,
      flight: {
        enabled: this.flightEnabled,
        altitude: Math.max(
          0,
          this.player.y - this.world.surfaceHeight(this.player.x, this.player.z),
        ),
        speed: this.velocity.clone().add(this.impulse).add(this.airDash.velocity).length(),
        phase: this.pendingPlayerImpulse
          ? 'contact'
          : this.playerTumble.active
            ? 'ragdoll'
            : this.knockTime > 0
              ? 'launch'
              : this.airDash.active
                ? 'dash'
                : !this.flightEnabled
                  ? Math.abs(this.verticalVelocity) > 0.3
                    ? 'falling'
                    : this.velocity.length() > 1
                      ? 'walking'
                      : 'grounded'
                  : this.velocity.length() > 1
                    ? 'flying'
                    : 'hover',
      },
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
      facing: this.facing.toArray(),
      hitPause: this.hitPause.remaining,
      playerReaction: this.pendingPlayerImpulse
        ? 'contact'
        : this.knockTime > 0
          ? 'launch'
          : 'idle',
      bossReaction: this.boss.pendingImpulse
        ? 'contact'
        : this.boss.knockTime > 0
          ? 'launch'
          : 'idle',
      lastBlock: this.lastBlock,
      shieldPatches: this.shieldPatches,
      shieldEchoes: this.fx.shieldEchoes,
      heavyPenetrations: this.heavyPenetrations,
      groundReactions: this.groundReactions,
      groundJumps: this.groundJumps,
      verticalVelocity: this.verticalVelocity,
      walls: this.world.wallBounds,
      heavyCircleRadius: this.boss.chargeRadius,
      playerVelocity: this.velocity.clone().add(this.impulse).add(this.airDash.velocity).toArray(),
      dashMotion: {
        active: this.airDash.active,
        strength: this.airDash.strength,
        age: this.airDash.age,
        invulnerable: this.airDash.invulnerable,
      },
      ragdoll: {
        player: this.playerTumble.active,
        boss: this.boss.tumble.active,
        playerWeight: this.playerTumble.weight,
        playerPhase: this.playerTumble.phase,
        bossPhase: this.boss.tumble.phase,
        playerBounces: this.playerTumble.bounces,
        bossBounces: this.boss.tumble.bounces,
        playerGroundTravel: this.playerTumble.groundTravel,
        bossGroundTravel: this.boss.tumble.groundTravel,
        bossWeight: this.boss.tumble.weight,
        playerOrientation: this.avatar.quaternion.toArray(),
        bossOrientation: this.boss.group.quaternion.toArray(),
      },
      bossTactic: this.boss.tactics.maneuver,
      bossLane: this.bossLane,
      blockedCasts: this.blockedCasts,
      bossVelocity: this.boss.velocity.clone().add(this.boss.impulse).toArray(),
      bossGoal: this.boss.tactics.goal.toArray(),
      bossDecisions: this.boss.tactics.decisions,
      fireGates: this.boss.activeGates,
      fireOrigins: this.boss.gateHistory,
      pendingFire: this.pendingFire.length,
      contacts: this.contacts,
      arena: { size: ARENA.halfSize * 2, buildings: this.world.buildingCount },
      bossCount: this.scene.children.filter((o) => o.name === 'sole-boss').length,
      bossPosition: this.boss.position.toArray(),
      bossVisible: this.boss.group.visible,
      attacksFired: { ...this.attacksFired },
      missiles: this.projectiles
        .filter((p) => p.kind === 'missile')
        .map((p) => ({
          position: p.mesh.position.toArray(),
          velocity: p.velocity.toArray(),
          age: p.age,
          radius: p.radius,
          origin: p.origin.toArray(),
          committed: p.guidance.committed,
        })),
      shots: this.projectiles.map((p) => ({
        kind: p.kind,
        radius: p.radius,
        origin: p.origin.toArray(),
        position: p.mesh.position.toArray(),
        velocity: p.velocity.toArray(),
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
    this.airDash.reset();
    this.flightEnabled = true;
    this.verticalVelocity = this.groundJumps = 0;
    this.heavyPenetrations = [];
    this.groundReactions = [];
    this.flightAcceleration.set(0, 0, 0);
    this.cameraSpringVelocity.set(0, 0, 0);
    this.playerTumble.reset();
    this.playerRelease.cancel();
    this.bank.set(0, 0, 0);
    this.pendingFire = [];
    this.firePacket = null;
    this.bossLane = { mode: 'clear', walls: [], thickness: 0 };
    this.sightClock = this.seekClock = this.breachClock = this.blockedCasts = 0;
    this.shieldPatches = [];
    this.health = this.energy = 100;
    this.dashCooldown = this.dashTime = this.knockTime = 0;
    this.spell = 0;
    this.cooldowns = [0, 0, 0];
    this.pendingPlayerImpulse = null;
    this.lastBlock = null;
    this.contacts = 0;
    this.lastDamageBlind = false;
    this.roll = this.shake = 0;
    this.damageDealt = this.impacts = this.elapsed = 0;
    this.damageTimer = 10;
    this.hitPause.reset();
    this.flashTimer = 0;
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
    this.facingQuaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
    this.facing.set(0, 0, -1).applyQuaternion(this.facingQuaternion);
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
    this.autoResolution = 1;
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
        this.lowQuality ? this.autoResolution : this.settings.quality === 'high' ? 2 : 1.5,
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
      if (this.settings.quality === 'auto' && this.lowQuality && this.renderTime > 5) {
        this.slowFrames = this.fps < 26 ? this.slowFrames + 1 : 0;
        if (this.slowFrames >= 4 && this.autoResolution > 0.75) {
          this.autoResolution = Math.max(0.75, this.autoResolution - 0.125);
          this.slowFrames = 0;
          this.resize();
        }
      }
      if (this.settings.quality === 'auto' && !this.lowQuality && this.renderTime > 4) {
        this.slowFrames = this.fps < 28 ? this.slowFrames + 1 : 0;
        if (this.slowFrames >= 3) {
          this.lowQuality = true;
          this.configureQuality();
        }
      }
    }
    if (!this.manualSimulation) this.simulate(Math.max(0, rawDt));
    this.renderer.info.reset();
    if (this.useBloom) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
    this.renderNeeded = false;
  }
  private simulate(realDt: number) {
    if (['paused', 'gameover', 'victory'].includes(this.mode)) return;
    if (this.controls.shieldRequested) {
      this.controls.shieldRequested = false;
      this.aegis.toggle();
    }
    if (this.controls.flightRequested) {
      this.controls.flightRequested = false;
      this.setFlight(!this.flightEnabled);
    }
    this.flashTimer = Math.max(0, this.flashTimer - realDt);
    // Pause uses wall-clock time. Physics still has a cap, so slow renderers cannot tunnel.
    let left = Math.min(0.1, this.hitPause.consume(realDt));
    while (left > 1e-8) {
      left = this.hitPause.consume(left);
      if (left <= 1e-8) break;
      if (this.pendingPlayerImpulse) {
        this.playerRelease.start(this.pendingPlayerImpulse);
        this.pendingPlayerImpulse = null;
      }
      if (this.boss.pendingImpulse) {
        this.boss.release.start(this.boss.pendingImpulse);
        this.boss.pendingImpulse = null;
      }
      const dt = Math.min(left, 1 / 120);
      left -= dt;
      this.playerRelease.step(dt, this.impulse);
      this.boss.release.step(dt, this.boss.impulse);
      this.time += dt;
      this.modeTime += dt;
      if (this.mode === 'playing' && !this.outcome) this.elapsed += dt;
      this.aegis.update(dt);
      this.damageTimer += dt;
      this.impactGate.player = Math.max(0, this.impactGate.player - dt);
      this.impactGate.boss = Math.max(0, this.impactGate.boss - dt);
      this.previousPlayer.copy(this.player);
      this.updatePlayer(dt, this.mode !== 'playing');
      if (this.hitPause.remaining === 0) this.updateBoss(dt);
      if (this.hitPause.remaining === 0) {
        this.updateFireGates(dt);
        if (!this.outcome) this.updateProjectiles(dt);
        else this.clearProjectiles();
      }
      if (this.mode !== 'playing') this.showcaseCamera(dt);
      this.presentActors(this.hitPause.remaining > 0 ? 0 : dt);
      this.fx.update(this.hitPause.remaining > 0 ? 0 : dt);
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
    this.knockTime = this.playerTumble.physical
      ? Math.max(0.4, this.knockTime - dt)
      : Math.max(0, this.knockTime - dt);
    if (this.playerTumble.phase === 'recover') this.knockTime = Math.min(this.knockTime, 0.18);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);

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
    this.pitch = clamp(this.pitch - look.y * this.settings.sensitivity * 0.0021, -1.25, 1.35);
    if ((this.lockedOn || showcase) && this.boss.alive) this.aimAtBoss(1 - Math.exp(-dt * 10));
    // This is the avatar's actual facing (and the shield's reference), not its travel direction.
    const desiredFacing = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'),
    );
    this.facingQuaternion.slerp(desiredFacing, 1 - Math.exp(-dt * 18));
    this.facing.set(0, 0, -1).applyQuaternion(this.facingQuaternion);
    const move = this.outcome ? { x: 0, z: 0, lift: 0 } : this.controls.movement();
    let wish = flightWish(
      move.x,
      move.z,
      this.flightEnabled ? move.lift : 0,
      this.yaw,
      this.flightEnabled ? this.pitch : 0,
    );
    if (!this.flightEnabled) wish.multiplyScalar(GROUND.speed / FLIGHT.speed);
    if (showcase) {
      const target = new THREE.Vector3(
        Math.sin(this.time * 0.46) * 11,
        2.5 + Math.sin(this.time * 0.7) * 1.5,
        12 + Math.cos(this.time * 0.46) * 6,
      );
      wish = target.sub(this.player).multiplyScalar(1.8).clampLength(0, 10);
    }
    const floor = groundHeight(
      this.player.x,
      this.player.z,
      this.player.y,
      this.world.obstacles,
      this.world.surfaceHeight(this.player.x, this.player.z),
    );
    const grounded = this.player.y <= floor + 0.045;
    const physical = this.playerTumble.physical;
    const recovery = physical ? 0 : recoveryBlend(this.knockTime) * (1 - this.playerTumble.weight);
    if (grounded && this.verticalVelocity <= 0 && !physical) this.groundJumps = 0;
    if (this.controls.jumpRequested) {
      this.controls.jumpRequested = false;
      if (!this.flightEnabled && !physical && this.knockTime <= 0.05 && this.groundJumps < 2) {
        this.verticalVelocity = this.groundJumps === 0 ? GROUND.jump : GROUND.airJump;
        this.groundJumps++;
        this.fx.burst(this.player, '#dff5ff', 8, 2, 0.15, 2);
      }
    }
    if (physical || this.outcome === 'gameover') {
      wish.set(0, 0, 0);
      this.verticalVelocity = 0;
      this.impulse.y -= HEAVY.gravity * dt;
    } else if (this.knockTime > 0) {
      wish.multiplyScalar(0.05 + recovery * 0.95);
      this.impulse.y -= 14 * (1 - recovery) * dt;
    }
    if (!physical && this.outcome !== 'gameover') {
      this.impulse.y = damp(this.impulse.y, 0, recovery * 6, dt);
      if (!this.flightEnabled) this.verticalVelocity -= GROUND.gravity * dt;
      else if (move.lift >= 0 && this.player.y < floor + FLIGHT.hoverHeight)
        wish.y = Math.max(wish.y, (floor + FLIGHT.hoverHeight - this.player.y) * 4 * recovery);
    }
    if (this.flightEnabled && !physical) {
      if (wish.y > 0) wish.y *= clamp((ARENA.ceiling - this.player.y) / 3, 0, 1);
      if (this.player.y > ARENA.ceiling)
        wish.y = Math.min(wish.y, (ARENA.ceiling - this.player.y) * 2);
    }
    for (const axis of ['x', 'z'] as const)
      if (Math.sign(wish[axis]) === Math.sign(this.player[axis]))
        wish[axis] *= clamp((ARENA.halfSize - Math.abs(this.player[axis])) / 4, 0, 1);
    if (this.controls.dashRequested) {
      this.controls.dashRequested = false;
      if (this.dashCooldown === 0 && this.damageTimer > 0.25 && !this.outcome && !physical) {
        this.dashCooldown = 1.65;
        const dashAim = wish.lengthSq() > 0.01 ? wish.clone() : this.facing.clone();
        if (!this.flightEnabled) dashAim.y = 0;
        this.airDash.start(dashAim.normalize());
        this.knockTime = Math.min(this.knockTime, 0.55);
        this.audio.dash();
        this.fx.burst(this.player.clone().add(UP), '#effaff', 16, 3, 0.25, 2);
      }
    }
    this.airDash.step(dt, wish);
    this.dashTime = this.airDash.active ? AirDash.duration - this.airDash.age : 0;
    advanceFlight(this.velocity, this.flightAcceleration, wish, dt);
    const motor = this.velocity.clone().add(this.airDash.velocity);
    if (!this.flightEnabled && !physical) motor.y = this.verticalVelocity;
    this.moveBody(
      this.player,
      motor,
      this.impulse,
      dt,
      this.knockTime > 0 || physical,
      'player',
      0.38 + this.playerTumble.weight * 0.4,
      1.7 * (1 - this.playerTumble.weight) +
        2 *
          (supportHeight(this.playerTumble.orientation, new THREE.Vector3(0.325, 0.65, 0.325)) +
            0.025) *
          this.playerTumble.weight,
    );
    if (motor.y === 0 && this.velocity.y < 0) {
      this.velocity.y = 0;
      this.flightAcceleration.y = 0;
    }
    if (!this.flightEnabled && motor.y === 0 && this.verticalVelocity < 0)
      this.verticalVelocity = 0;
    if (physical && this.playerTumble.grounded) groundFriction(this.impulse, dt);
    else {
      const drag = Math.exp(-dt * (physical ? 0.28 : 0.55 * (1 - recovery) + recovery * 5));
      this.impulse.x *= drag;
      this.impulse.z *= drag;
    }
    this.skidTimer -= dt;
    if (
      (this.knockTime > 0 || physical) &&
      this.impulse.length() > 4 &&
      this.player.y < floor + 0.35 &&
      this.skidTimer <= 0
    ) {
      this.skidTimer = 0.055;
      this.fx.debris(this.player, 3, 2.3, 1.6, this.impulse);
      this.fx.dust(this.player, 2, 0.8, this.impulse);
    }
    this.roll = damp(
      this.roll,
      this.settings.reducedEffects
        ? 0
        : -move.x * 0.035 + (this.knockTime > 0 ? Math.sin(this.time * 8) * 0.055 : 0),
      7,
      dt,
    );
    if (!showcase) {
      this.updateCamera(dt);
      this.camera.getWorldDirection(direction);
      this.aiming = this.aimsAtBoss(direction);
      const shoot = this.controls.shooting || this.controls.shotRequested;
      if (this.hitPause.remaining === 0) {
        this.controls.shotRequested = false;
        if (shoot && !this.outcome && this.damageTimer > 0.18 && !this.playerTumble.physical)
          this.cast();
      }
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
    const tumble = actor === 'player' ? this.playerTumble : this.boss.tumble;
    tumble.beginStep();
    const before = position.clone();
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
          broken = this.world.damageWall(wall, at, impulse, actor === 'boss' ? 3.15 : 2.6);
        if (this.impactGate[actor] <= 0) {
          this.worldImpact(at, force, 'wall', actor);
          impulse.multiplyScalar(broken ? 0.83 : -0.15);
        }
      }
      const resolved = resolveCircle(nx, nz, previousFeet, radius, this.world.obstacles, height);
      if (Math.abs(nx) > ARENA.halfSize) motor.x = impulse.x = 0;
      if (Math.abs(nz) > ARENA.halfSize) motor.z = impulse.z = 0;
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
        const force = Math.abs(total.y),
          contactFloor = floor;
        let throughRoof = false;
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
          if (support) this.world.damageWall(support, at, total, 2.8);
          else this.world.crater(at, force);
          this.worldImpact(at, force, support ? 'wall' : 'ground', actor);
          floor = groundHeight(
            nx,
            nz,
            previousFeet,
            this.world.obstacles,
            this.world.surfaceHeight(nx, nz),
          );
          throughRoof = !!support && floor < contactFloor - 0.4;
        }
        if (throughRoof) position.y = Math.max(ny, floor);
        else {
          const away =
            actor === 'player'
              ? this.player.clone().sub(this.boss.position)
              : this.boss.position.clone().sub(this.player);
          const slide = tumble.physical
            ? landingSlide(total, away)
            : new THREE.Vector3(total.x, 0, total.z);
          motor.y = 0;
          impulse.copy(slide).sub(motor);
          impulse.y = 0;
          // New craters do not teleport a body to their bottom, nor throw it back upwards.
          position.y = Math.max(ny, floor);
          if (position.y > floor + 0.06) impulse.y = -Math.min(8, Math.max(2, force * 0.12));
          else {
            position.y = floor;
            tumble.ground(impulse.clone().add(motor), 0, actor === 'player' ? 0.55 : 1.4);
          }
          if (force > HEAVY.impactSpeed) {
            this.groundReactions.push({
              actor,
              speed: force,
              bounce: 0,
              position: position.toArray(),
            });
            if (this.groundReactions.length > 24) this.groundReactions.shift();
          }
        }
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
        } else position.y = Math.min(ny, ARENA.ceiling + 16);
      }
      if (this.hitPause.remaining > 0) break;
    }
    if (tumble.grounded)
      tumble.groundTravel += Math.hypot(position.x - before.x, position.z - before.z);
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
    if (snap) {
      this.camera.position.copy(desired);
      this.cameraSpringVelocity.set(0, 0, 0);
    } else
      springVector(
        this.camera.position,
        this.cameraSpringVelocity,
        desired,
        this.knockTime > 0 ? 18 : 23,
        dt,
      );
    // Keep a backwards launch from pushing the avatar through the chase camera.
    const behind = this.camera.position.clone().sub(pivot).dot(forward.clone().negate());
    if (behind < 3.8) {
      this.camera.position.addScaledVector(forward, behind - 3.8);
      this.cameraSpringVelocity.copy(this.velocity).add(this.impulse).add(this.airDash.velocity);
    }
    const obstruction = this.trace(pivot, this.camera.position, false, 0.12);
    if (obstruction) {
      this.camera.position.lerpVectors(
        pivot,
        this.camera.position,
        Math.max(0.08, obstruction.t - 0.03),
      );
      this.cameraSpringVelocity.multiplyScalar(0.2);
    }
    this.shake = damp(this.shake, 0, 11, dt);
    const shake = this.settings.reducedEffects ? 0 : this.shake;
    const targetRotation = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        this.pitch + Math.sin(this.time * 49) * shake * 0.4,
        this.yaw + Math.sin(this.time * 37 + 1.3) * shake * 0.4,
        this.roll,
        'YXZ',
      ),
    );
    if (snap) this.camera.quaternion.copy(targetRotation);
    else this.camera.quaternion.slerp(targetRotation, 1 - Math.exp(-dt * 22));
    const speed = this.velocity.clone().add(this.impulse).add(this.airDash.velocity).length();
    this.camera.fov = damp(
      this.camera.fov,
      this.settings.reducedEffects ? 74 : 74 + clamp((speed - 14) * 0.25, 0, 11),
      8,
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
    this.avatar.position.copy(this.player);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.facingQuaternion);
    this.bank.z = damp(
      this.bank.z,
      clamp(
        (-this.velocity.dot(right) / FLIGHT.speed) * 0.24 -
          this.flightAcceleration.dot(right) * 0.0015,
        -0.32,
        0.32,
      ),
      8,
      dt,
    );
    this.bank.x = damp(
      this.bank.x,
      (this.velocity.dot(this.facing) / FLIGHT.speed) * 0.09 + this.airDash.strength * 0.13,
      8,
      dt,
    );
    const pose = this.facingQuaternion
      .clone()
      .multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(this.bank.x, 0, this.bank.z)));
    this.avatar.quaternion.copy(this.playerTumble.step(dt, pose));
    const restingPivot = this.flightEnabled ? 0.85 : 0.66;
    this.avatar.position.y +=
      restingPivot * (1 - this.playerTumble.weight) +
      (supportHeight(this.avatar.quaternion, new THREE.Vector3(0.325, 0.65, 0.325)) + 0.025) *
        this.playerTumble.weight;
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
    const b = this.boss;
    if ((!b.alive && b.deathDelay < 0) || (this.outcome && this.outcome !== 'victory')) return;
    if (b.deathDelay >= 0) {
      b.deathDelay -= dt;
      if (b.deathDelay <= 0) {
        this.destroyBoss();
        return;
      }
    }
    const wasKnocked = b.knockTime > 0;
    b.knockTime = b.tumble.physical
      ? Math.max(0.4, b.knockTime - dt)
      : Math.max(0, b.knockTime - dt);
    if (wasKnocked && b.knockTime === 0) b.tactics.displaced(b.position, this.player);
    if (b.tumble.phase === 'recover') b.knockTime = Math.min(b.knockTime, 0.18);
    this.sightClock -= dt;
    this.seekClock -= dt;
    this.breachClock -= dt;
    if (this.sightClock <= 0 && !b.tumble.physical) {
      this.sightClock = 0.1;
      this.updateBossSight();
    }
    const recovery = b.tumble.physical ? 0 : recoveryBlend(b.knockTime) * (1 - b.tumble.weight);
    const motor = b.tactics.step(
      dt,
      b.position,
      this.player,
      b.director.attack,
      b.director.stage,
      b.director.pattern,
    );
    const blocked = this.trace(
      b.position,
      b.position.clone().addScaledVector(motor, 0.65),
      false,
      0.55,
    );
    if (blocked?.obstacle && b.knockTime === 0) {
      const side = new THREE.Vector3(-motor.z, 0, motor.x).normalize();
      for (const sign of [1, -1]) {
        const escape = side.clone().multiplyScalar(sign * 7);
        if (!this.trace(b.position, b.position.clone().add(escape), false, 0.4)) {
          motor.x = escape.x * 1.5;
          motor.z = escape.z * 1.5;
          break;
        }
      }
      if (this.trace(b.position, b.position.clone().addScaledVector(motor, 0.5), false, 0.4))
        motor.y = Math.max(motor.y, 8);
    }
    // Obstacle avoidance must never override the duel's minimum standoff.
    const away = b.position.clone().sub(this.player);
    away.y = 0;
    const distance = away.length();
    if (distance > 0.001 && distance < DUEL.nearRange) {
      away.divideScalar(distance);
      const outward = motor.dot(away),
        retreat = Math.min(12, (DUEL.nearRange - distance) * 2.5);
      if (outward < retreat) motor.addScaledVector(away, retreat - outward);
    }
    motor.clampLength(0, 19);
    motor.multiplyScalar(0.035 + recovery * 0.965);
    b.impulse.y -= (b.tumble.physical ? HEAVY.gravity : 14 * (1 - recovery)) * dt;
    b.velocity.lerp(motor, 1 - Math.exp(-dt * 4.5));
    const extent =
        2.05 * (1 - b.tumble.weight) +
        supportHeight(b.tumble.orientation, new THREE.Vector3(1.85, 1.7, 0.575), -0.3375) *
          b.tumble.weight,
      feet = b.position.clone().addScaledVector(UP, -extent);
    this.moveBody(
      feet,
      b.velocity,
      b.impulse,
      dt,
      b.knockTime > 0,
      'boss',
      1.15 + b.tumble.weight * 0.75,
      extent * 2,
    );
    b.position.copy(feet).addScaledVector(UP, extent);
    if (b.tumble.physical && b.tumble.grounded) groundFriction(b.impulse, dt);
    else {
      const drag = Math.exp(-dt * (b.tumble.physical ? 0.28 : 0.55 + recovery * 4.45));
      b.impulse.x *= drag;
      b.impulse.z *= drag;
    }
    if (!b.tumble.physical) b.impulse.y = damp(b.impulse.y, 0, recovery * 6, dt);
    b.group.position.copy(b.position);
    b.group.lookAt(this.player.clone().add(UP));
    b.group.updateMatrixWorld(true);
    if (
      !b.alive ||
      b.knockTime > 0.15 ||
      b.tumble.weight > 0.25 ||
      this.testIdleBoss ||
      this.bossLane.mode === 'blocked' ||
      this.hitPause.remaining > 0
    )
      return;
    if (b.director.stage === 'telegraph' && b.director.charge < 0.78)
      b.lockedTarget
        .copy(this.player)
        .add(
          new THREE.Vector3(
            this.velocity.x * 0.16,
            0.95 + this.velocity.y * 0.16,
            this.velocity.z * 0.16,
          ),
        );
    for (const command of b.director.step(dt, b.enraged)) {
      if (command.type === 'tell') {
        if (this.mode !== 'menu') this.audio.charge();
        if (command.attack === 'hammer') {
          const mark = this.player.clone();
          mark.y = this.world.surfaceHeight(mark.x, mark.z) + 0.04;
          this.fx.glyph(mark, UP, '#ff9a5d', 2.8, ATTACKS.hammer.tell);
        }
      } else this.bossAttack(command.attack, command.index);
    }
  }
  private updateBossSight() {
    const b = this.boss,
      target = this.player.clone().add(new THREE.Vector3(0, 0.9, 0));
    this.bossLane = this.world.firingLane(b.position, target, b.director.attack);
    if (this.bossLane.mode !== 'blocked') return;
    this.pendingFire = [];
    this.firePacket = null;
    b.clearGates();
    if (!this.testIdleBoss && this.breachClock <= 0) {
      for (const attack of ['missiles', 'hammer'] as const) {
        const lane = this.world.firingLane(b.position, target, attack);
        if (lane.mode === 'breach' && b.director.redirect(attack)) {
          this.bossLane = lane;
          this.breachClock = 4;
          b.lockedTarget.copy(target);
          if (this.mode !== 'menu') this.audio.charge();
          return;
        }
      }
    }
    if (this.seekClock > 0 || this.testIdleBoss) return;
    this.seekClock = 0.55;
    const delta = b.position.clone().sub(this.player),
      angle = Math.atan2(delta.z, delta.x);
    const obstruction = this.trace(b.position, target, false)?.obstacle;
    let best: THREE.Vector3 | null = null,
      cost = Infinity;
    const heights = [
      b.position.y,
      Math.max(2.5, this.player.y + 0.9),
      Math.min(ARENA.ceiling, (obstruction?.top ?? b.position.y) + 3),
    ];
    for (const height of heights)
      for (const turn of [-0.45, 0.45, -0.9, 0.9, -1.4, 1.4]) {
        const candidate = new THREE.Vector3(
          this.player.x + Math.cos(angle + turn) * DUEL.preferredRange,
          height,
          this.player.z + Math.sin(angle + turn) * DUEL.preferredRange,
        );
        if (
          Math.abs(candidate.x) > ARENA.halfSize - 5 ||
          Math.abs(candidate.z) > ARENA.halfSize - 5
        )
          continue;
        if (
          this.trace(candidate, candidate, false, 1.3) ||
          this.world.firingLane(candidate, target, 'fire').mode !== 'clear'
        )
          continue;
        const score = candidate.distanceTo(b.position) + Math.abs(height - b.position.y) * 1.4;
        if (score < cost) {
          cost = score;
          best = candidate;
        }
      }
    if (best) b.tactics.seekSight(best, b.director.pattern);
  }
  private permittedCast(
    attack: AttackId,
    origin?: THREE.Vector3,
    target = this.player.clone().add(new THREE.Vector3(0, 0.9, 0)),
  ) {
    const core = this.world.firingLane(this.boss.position, target, attack);
    if (core.mode === 'blocked') {
      this.blockedCasts++;
      return false;
    }
    if (
      origin &&
      (!this.clearSight(this.boss.position, origin) ||
        this.world.firingLane(origin, target, attack).mode === 'blocked')
    ) {
      this.blockedCasts++;
      return false;
    }
    return true;
  }
  private bossAttack(attack: AttackId, index: number) {
    if (!this.permittedCast(attack)) return;
    const muzzle = this.boss.muzzle(attack === 'hammer' ? PROJECTILES.hammer.radius : 0);
    if (attack === 'fire') {
      const packet = Math.floor(index / 4),
        pattern = this.boss.director.pattern;
      if (
        !this.firePacket ||
        this.firePacket.packet !== packet ||
        this.firePacket.pattern !== pattern
      ) {
        const origin = this.boss.fireGate(
          packet,
          this.player.clone().addScaledVector(UP, 0.9),
          (x, z) => this.world.surfaceHeight(x, z),
        );
        this.firePacket = { packet, pattern, origin };
      }
      this.pendingFire.push({ origin: this.firePacket.origin.clone(), delay: 0.12, index });
    } else if (attack === 'missiles') {
      for (const side of [0, 3]) {
        const port = this.boss.spellPort(index + side),
          forward = this.player
            .clone()
            .add(new THREE.Vector3(0, 0.9, 0))
            .sub(port)
            .normalize();
        const radial = port.clone().sub(this.boss.muzzle()).normalize();
        const launch = forward
          .multiplyScalar(0.88)
          .addScaledVector(radial, 0.3 * Math.min(1, port.distanceTo(this.player) / 12))
          .normalize()
          .multiplyScalar(15);
        if (!this.permittedCast('missiles', port)) continue;
        this.spawn(port, launch, 'missile', 16);
        this.fx.glyph(port, forward, '#ffbc80', 0.32, 0.32);
      }
      if (this.mode !== 'menu') this.audio.cast(0);
    } else {
      if (!this.permittedCast('hammer', muzzle, this.boss.lockedTarget)) return;
      const aim = this.boss.lockedTarget.clone().sub(muzzle).normalize();
      this.spawn(muzzle, aim.clone().multiplyScalar(PROJECTILES.hammer.speed), 'hammer', 29);
      this.fx.glyph(muzzle, aim, '#fff0b8', 2.3, 0.55);
      this.fx.burst(muzzle, '#ffe7ae', 40, 5, 0.8, 1);
      if (this.mode !== 'menu') this.audio.cast(2);
    }
  }
  private updateFireGates(dt: number) {
    if (!this.boss.alive || this.outcome) {
      this.pendingFire = [];
      return;
    }
    for (let i = this.pendingFire.length - 1; i >= 0; i--) {
      const shot = this.pendingFire[i];
      shot.delay -= dt;
      if (shot.delay > 0) continue;
      this.pendingFire.splice(i, 1);
      if (!this.permittedCast('fire', shot.origin)) continue;
      const aim = this.player
        .clone()
        .add(
          new THREE.Vector3(
            this.velocity.x * 0.12,
            0.95 + this.velocity.y * 0.12,
            this.velocity.z * 0.12,
          ),
        )
        .sub(shot.origin)
        .normalize();
      const spread = salvoSpread(shot.index),
        right = new THREE.Vector3().crossVectors(aim, UP).normalize();
      aim.applyAxisAngle(UP, spread.yaw).applyAxisAngle(right, spread.pitch);
      this.spawn(shot.origin, aim.multiplyScalar(PROJECTILES.fire.speed), 'fire', 9);
      if (this.mode !== 'menu' && shot.index % 3 === 0) this.audio.cast(0);
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
        this.damageBoss(
          spell.damage,
          direction.clone().multiplyScalar(DUEL.novaLaunch).addScaledVector(UP, 3),
        );
      this.shake = Math.max(this.shake, 0.018);
    }
  }
  private clearSight(from: THREE.Vector3, to: THREE.Vector3) {
    const hit = this.trace(from, to, false);
    return !hit || hit.t >= 0.985;
  }
  private trace(
    start: THREE.Vector3,
    end: THREE.Vector3,
    boss: boolean,
    radius = 0.02,
  ): TraceHit | null {
    let best: TraceHit | null = null;
    for (const obstacle of this.world.obstacles) {
      const t = segmentBox(start, end, obstacle, radius);
      if (t !== null && (!best || t < best.t)) best = { t, obstacle };
    }
    const ground = this.world.traceGround(start, end, radius);
    if (ground !== null && (!best || ground < best.t)) best = { t: ground, ground: true };
    if (boss && this.boss.alive) {
      const t = segmentSphere(start, end, this.boss.position, 1.48 + radius);
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
    const mesh = new THREE.Mesh(
      kind === 'fire' ? this.fireGeometry : this.projectileGeometry,
      this.projectileMaterials[kind],
    );
    mesh.position.copy(at);
    const radius = PROJECTILES[kind].radius;
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
    this.projectiles.push({
      mesh,
      ribbon,
      velocity,
      last: at.clone(),
      kind,
      damage,
      homing,
      life: PROJECTILES[kind].life,
      radius,
      origin: at.clone(),
      guidance: { committed: false },
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
      if (p.kind === 'missile') {
        p.velocity.copy(
          guideMissile(p.mesh.position, p.velocity, previousCenter, motion, p.age, dt, p.guidance),
        );
      } else if (p.kind === 'player' && p.homing && this.boss.alive)
        p.velocity.lerp(
          this.boss.position.clone().sub(p.mesh.position).normalize().multiplyScalar(40),
          1 - Math.exp(-dt * 6),
        );
      p.last.copy(p.mesh.position);
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.mesh.lookAt(p.mesh.position.clone().add(p.velocity));
      p.mesh.children.forEach((o, index) => {
        o.rotation.z += dt * (index ? -3 : 4);
      });
      let worldHit = this.trace(p.last, p.mesh.position, p.kind === 'player', p.radius);
      // Carve only the measured thin material span, then re-run CCD for the remaining path.
      if (p.kind === 'hammer')
        for (let n = 0; n < 4 && worldHit?.obstacle; n++) {
          const contact = p.last.clone().lerp(p.mesh.position, worldHit.t);
          const result = this.world.pierceThin(
            worldHit.obstacle,
            p.last,
            p.velocity.clone().normalize(),
            contact,
          );
          if (!result) break;
          this.heavyPenetrations.push({
            owner: worldHit.obstacle.owner!,
            thickness: result.thickness,
            entry: result.entry.toArray(),
            exit: result.exit.toArray(),
          });
          if (this.heavyPenetrations.length > 32) this.heavyPenetrations.shift();
          this.fx.burst(result.entry, '#ffdfad', 18, 5, 0.35, 2);
          worldHit = this.trace(p.last, p.mesh.position, false, p.radius);
        }
      if (p.kind !== 'player') {
        const horizon = dt + DUEL.shieldPrediction;
        const shieldFacing = this.playerTumble.active
          ? new THREE.Vector3(0, 0, -1).applyQuaternion(this.playerTumble.orientation)
          : this.facing;
        const covered = shieldCovers(shieldFacing, p.last.clone().sub(previousCenter));
        const guard = this.aegis.enabled
          ? shieldIntercept(
              p.last,
              p.velocity,
              previousCenter,
              motion,
              shieldFacing,
              p.radius,
              horizon,
            )
          : null;
        if (guard) {
          const futureEnd = p.last.clone().addScaledVector(p.velocity, horizon),
            cover = this.trace(p.last, futureEnd, false, p.radius);
          const intercept = center.clone().add(guard.offset);
          if (
            (!cover || cover.t * horizon > guard.time + 0.001) &&
            this.clearSight(center, intercept) &&
            this.aegis.intercept()
          ) {
            const incoming = guard.normal.clone().negate(),
              scale = shieldScale(p.radius);
            this.lastBlock = { scale, radius: p.radius, direction: guard.normal.toArray() };
            this.shieldPatches.push({
              position: intercept.toArray(),
              offset: guard.offset.toArray(),
              normal: guard.normal.toArray(),
            });
            if (this.shieldPatches.length > 20) this.shieldPatches.shift();
            this.fx.block(intercept, incoming, scale);
            if (this.mode !== 'menu') this.audio.block();
            this.emit({
              type: 'block',
              direction: { x: guard.normal.x, y: guard.normal.y, z: guard.normal.z },
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
          DUEL.bodyRadius + p.radius,
        );
        if (hitPlayer !== null && (!worldHit || hitPlayer <= worldHit.t)) {
          if (!this.airDash.invulnerable) this.damagePlayer(p.damage, p.velocity, p.kind, !covered);
          this.fx.burst(p.mesh.position, '#ff9a62', 18, 3.5, 0.36);
          this.removeProjectile(i);
          if (this.hitPause.remaining > 0) break;
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
              p.kind === 'hammer' ? 4.2 : 1.8,
            );
          if (worldHit.ground && p.kind === 'hammer') this.world.crater(p.mesh.position, 36);
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
  private contactPause(
    actor: 'player' | 'boss',
    incoming: THREE.Vector3,
    duration: number,
    strength: number,
  ) {
    const at =
      actor === 'player'
        ? this.player.clone().add(new THREE.Vector3(0, 0.9, 0))
        : this.boss.position.clone();
    at.addScaledVector(incoming.clone().normalize(), actor === 'player' ? -0.65 : -1.2);
    this.fx.contact(at, incoming, strength > 55 ? 1.4 : 0.8);
    this.hitPause.request(duration);
    this.contacts++;
    this.emit({ type: 'contact', actor });
  }
  private destroyBoss() {
    this.boss.deathDelay = -1;
    this.boss.group.visible = this.boss.ribbon.mesh.visible = false;
    this.fx.impact(this.boss.position, '#ffe0a1', true);
    this.fx.debris(this.boss.position, 35, 8, 3);
    this.fx.dust(this.boss.position, 15, 2.5);
  }
  private damageBoss(amount: number, impulse: THREE.Vector3) {
    if (!this.boss.alive || this.outcome || this.mode !== 'playing') return;
    const actual = Math.min(amount, this.boss.health);
    this.boss.health -= actual;
    this.damageDealt += actual;
    this.boss.flash = 0.14;
    const heavy = impulse.length() > 10;
    if (heavy) {
      this.boss.pendingImpulse = impulse.clone().addScaledVector(this.boss.velocity, 0.25);
      this.boss.release.cancel();
      this.boss.tumble.kick(this.boss.group.quaternion, impulse);
      this.pendingFire = [];
      this.boss.clearGates();
      this.boss.impulse.set(0, 0, 0);
      this.boss.velocity.set(0, 0, 0);
      this.boss.knockTime = 1.25;
      this.contactPause('boss', impulse, DUEL.novaPause, impulse.length());
    } else this.boss.impulse.add(impulse).clampLength(0, 9);
    this.emit({ type: 'hit', kill: !this.boss.alive, damage: actual });
    this.audio.hit(!this.boss.alive);
    if (!this.boss.alive) {
      if (heavy) this.boss.deathDelay = 0.95;
      else this.destroyBoss();
      this.outcome = 'victory';
      this.finishTimer = heavy ? 1.6 : 1.15;
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
  private damagePlayer(
    amount: number,
    incoming: THREE.Vector3,
    kind: ProjectileKind,
    blind: boolean,
  ) {
    if (this.outcome || this.damageTimer < 0.14 || this.testInvulnerable) return;
    this.damageTimer = 0;
    this.lastDamageBlind = blind;
    if (this.mode === 'playing' && !this.testInvulnerable)
      this.health = Math.max(0, this.health - amount);
    const tuning = PROJECTILES[kind],
      vector = incoming.clone().normalize().multiplyScalar(tuning.launch);
    if (kind === 'hammer') vector.y = vector.y < -10 ? vector.y : clamp(vector.y + 4, -10, 18);
    else vector.y = Math.max(kind === 'missile' ? 5 : 2.5, vector.y * 0.6 + 3);
    vector
      .addScaledVector(this.velocity, 0.25)
      .addScaledVector(this.impulse, 0.2)
      .clampLength(0, 140);
    vector.y += this.verticalVelocity * 0.2;
    this.verticalVelocity = 0;
    this.pendingPlayerImpulse = vector;
    this.playerRelease.cancel();
    this.flightAcceleration.set(0, 0, 0);
    this.airDash.reset();
    if (kind === 'hammer') this.playerTumble.kick(this.avatar.quaternion, vector);
    this.velocity.set(0, 0, 0);
    this.impulse.set(0, 0, 0);
    this.dashTime = 0;
    this.knockTime = tuning.stagger;
    this.contactPause('player', incoming, tuning.pause, tuning.launch);
    this.shake = 0.018;
    if (this.mode !== 'menu') this.audio.damage();
    this.emit({ type: 'damage', amount });
    if (this.health === 0 && this.mode === 'playing') {
      this.outcome = 'gameover';
      this.finishTimer = 2.4;
      this.controls.setEnabled(false);
    }
  }
  private worldImpact(
    at: THREE.Vector3,
    strength: number,
    surface: 'wall' | 'ground',
    actor: 'player' | 'boss',
  ) {
    const tumble = actor === 'player' ? this.playerTumble : this.boss.tumble;
    const velocity = actor === 'player' ? this.impulse : this.boss.impulse;
    const normal = surface === 'ground' ? UP : velocity.clone().negate().setY(0).normalize();
    tumble.collide(normal, velocity);
    (actor === 'player' ? this.playerRelease : this.boss.release).cancel();
    this.impactGate[actor] = 0.22;
    this.impacts++;
    this.lastImpact = { surface, actor };
    this.fx.burst(at, '#f2f7ed', 30, 7, 0.3, 3);
    if (surface === 'ground') this.fx.shock(at.clone().addScaledVector(UP, 0.09), '#edf4e9', 6);
    if (this.mode !== 'menu') this.audio.crash(strength);
    this.shake = this.settings.reducedEffects ? 0 : Math.min(0.1, strength / 500);
    this.hitPause.request(0.035);
    // Impact frames are caused by secondary world collisions, never by ordinary spell casts.
    if (this.flashTimer <= 0) {
      this.flashTimer = DUEL.impactInterval;
      this.emit({ type: 'impact', surface, actor, strength });
    }
  }

  /** Explicit dev-only QA scenarios. Never exported to the production Pages build. */
  testHarness() {
    if (!import.meta.env.DEV || !new URLSearchParams(location.search).has('test')) return undefined;
    const orient = (yaw: number, pitch = 0) => {
      this.lockedOn = false;
      this.yaw = yaw;
      this.pitch = pitch;
      this.facingQuaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
      this.facing.set(0, 0, -1).applyQuaternion(this.facingQuaternion);
      this.updateCamera(1, true);
    };
    const incoming = (
      side: 'front' | 'back' | 'left' | 'right' = 'front',
      kind: ProjectileKind = 'fire',
    ) => {
      const sideVector = new THREE.Vector3().crossVectors(this.facing, UP).normalize();
      const toSource =
        side === 'front'
          ? this.facing.clone()
          : side === 'back'
            ? this.facing.clone().negate()
            : sideVector.multiplyScalar(side === 'right' ? 1 : -1);
      this.spawn(
        this.player
          .clone()
          .add(new THREE.Vector3(0, 0.9, 0))
          .addScaledVector(toSource, kind === 'hammer' ? 6 : 3),
        toSource.multiplyScalar(-PROJECTILES[kind].speed),
        kind,
        kind === 'hammer' ? 29 : 9,
      );
    };
    return {
      freeze: (value: boolean) => {
        this.manualSimulation = value;
      },
      step: (seconds: number) => {
        for (let left = Math.min(30, Math.max(0, seconds)); left > 1e-8; left -= 1 / 60)
          this.simulate(Math.min(left, 1 / 60));
        this.renderNeeded = true;
      },
      face: orient,
      castBoss: (attack: AttackId, index = 0) => this.bossAttack(attack, index),
      place: (player: number[], boss: number[]) => {
        this.player.fromArray(player);
        this.previousPlayer.copy(this.player);
        this.boss.position.fromArray(boss);
        this.boss.lockedTarget.copy(this.player).addScaledVector(UP, 0.9);
        this.sightClock = 0;
        this.presentActors(0);
      },
      lane: (attack: AttackId) =>
        this.world.firingLane(
          this.boss.position,
          this.player.clone().addScaledVector(UP, 0.9),
          attack,
        ),
      incoming,
      scenario: (name: string) => {
        this.start(false);
        this.testIdleBoss = true;
        if (['wall', 'ground', 'contact', 'missile-near', 'defeat', 'ragdoll'].includes(name)) {
          this.aegis.setEnabled(false);
        }
        if (['sight-thick', 'sight-thin', 'sight-live'].includes(name)) {
          if (name === 'sight-thin') {
            this.player.set(-2, 7, -18);
            this.boss.position.set(-2, 7, -3);
          } else {
            this.player.set(-4, 6, 12);
            this.boss.position.set(-27, 6, 12);
          }
          if (name === 'sight-live') {
            this.testIdleBoss = false;
            this.testInvulnerable = true;
          }
        } else if (name === 'nova-air') {
          this.player.set(0, 34, 15);
          this.boss.position.set(0, 37, 4);
          this.spell = 2;
          this.lockedOn = true;
        } else if (name === 'player-air') {
          this.player.set(0, 32, 24);
          this.aegis.setEnabled(false);
          this.spawn(
            this.player.clone().add(new THREE.Vector3(0, 0.9, 2.1)),
            new THREE.Vector3(0, 0, -31),
            'hammer',
            29,
          );
        } else if (['pierce-player', 'pierce-ground', 'thick-cover'].includes(name)) {
          this.aegis.setEnabled(false);
          if (name === 'pierce-player') {
            this.player.set(-2, 6, -15);
            this.spawn(new THREE.Vector3(-2, 6.9, -5), new THREE.Vector3(0, 0, -31), 'hammer', 29);
          } else if (name === 'pierce-ground') {
            this.player.set(60, 8, 60);
            this.spawn(new THREE.Vector3(-2, 3, -5), new THREE.Vector3(0, -8, -31), 'hammer', 29);
          } else {
            this.player.set(-24, 2.1, 12);
            this.spawn(new THREE.Vector3(-3, 3, 12), new THREE.Vector3(-31, 0, 0), 'hammer', 29);
          }
        } else if (name === 'ground-skid') {
          this.aegis.setEnabled(false);
          this.player.set(0, 5, 65);
          this.spawn(new THREE.Vector3(0, 12, 70), new THREE.Vector3(0, -28, -20), 'hammer', 29);
        } else if (name === 'walk') {
          this.player.set(0, 0, 24);
          this.setFlight(false);
          this.groundJumps = 0;
        } else if (name === 'wall') {
          this.player.set(-7, 1.5, 12);
          this.spawn(new THREE.Vector3(-3, 2.4, 12), new THREE.Vector3(-38, 0, 0), 'hammer', 29);
        } else if (name === 'ground') {
          this.player.set(0, 8, 24);
          this.spawn(new THREE.Vector3(0, 13, 24), new THREE.Vector3(0, -34, 0), 'hammer', 29);
        } else if (name === 'nova' || name === 'nova-finish') {
          this.player.set(0, 2, 10);
          this.boss.position.set(0, 5, 0);
          this.spell = 2;
          this.lockedOn = true;
          if (name === 'nova-finish') this.boss.health = 1;
        } else if (name === 'cover') {
          this.player.set(-6.5, 0, 12);
          this.spawn(new THREE.Vector3(-25, 0.95, 12), new THREE.Vector3(30, 0, 0), 'fire', 9);
        } else if (name === 'contact') {
          this.player.set(0, 4, 24);
          this.spawn(
            this.player.clone().add(new THREE.Vector3(0, 0.9, 1.7)),
            new THREE.Vector3(0, 0, -30),
            'fire',
            9,
          );
        } else if (name === 'ragdoll') {
          this.player.set(0, 12, 24);
          this.spawn(new THREE.Vector3(0, 12.9, 30), new THREE.Vector3(0, 0, -34), 'hammer', 29);
        } else if (name === 'missile-near') {
          this.player.set(0, 5, 24);
          this.spawn(
            this.player.clone().add(new THREE.Vector3(2.4, 0.9, 0)),
            new THREE.Vector3(-15, 0, 0),
            'missile',
            16,
          );
        } else if (name === 'victory') {
          this.boss.health = 1;
          this.lockedOn = true;
          this.spell = 1;
        } else if (name === 'defeat') {
          this.health = 1;
          this.spawn(
            this.player.clone().add(new THREE.Vector3(0, 0.95, -3)),
            new THREE.Vector3(0, 0, 28),
            'fire',
            9,
          );
        } else if (name === 'patterns') {
          this.player.set(0, 35, 24);
          this.boss.position.set(0, 39, 1.5);
          this.testIdleBoss = false;
          this.testInvulnerable = true;
        }
        this.previousPlayer.copy(this.player);
        this.boss.lockedTarget.copy(this.player).addScaledVector(UP, 0.9);
        this.aimAtBoss(1);
        this.facingQuaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
        this.facing.set(0, 0, -1).applyQuaternion(this.facingQuaternion);
        if (name === 'shield') {
          incoming('front');
          incoming('left');
          incoming('right');
        }
        if (name === 'shield-large') incoming('front', 'hammer');
        if (name === 'flight' || name === 'walk') orient(0, 0);
        if (name === 'shield-scatter') {
          orient(0, 0);
          const center = this.player.clone().add(new THREE.Vector3(0, 0.9, 0));
          for (const [x, y] of [
            [-1.1, 0],
            [1.1, 0.5],
            [0, 1.25],
            [3.6, 0],
          ])
            this.spawn(
              center.clone().add(new THREE.Vector3(x, y, -3)),
              new THREE.Vector3(0, 0, 30),
              'fire',
              9,
            );
        }
        this.updateCamera(1, true);
        this.presentActors(0);
        this.renderNeeded = true;
      },
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
