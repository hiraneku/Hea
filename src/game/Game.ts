import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CameraRig } from './CameraRig';
import { Controls } from './Controls';
import { ProjectileSystem, type Projectile } from './ProjectileSystem';
import { PrismaSystem } from './PrismaSystem';
import { FallSystem, type FallPhase } from './FallSystem';
import { ImpactFrame } from './ImpactFrame';
import { AudioEngine } from './Audio';
import { Effects, Ribbon, makeSigil } from './Effects';
import { AvatarModel, avatarReport } from './Avatar';
import {
  PIXEL_BUDGET,
  RESOLUTION_LADDER,
  adaptiveNext,
  adaptiveStart,
  resolutionScale,
  startStep,
  type AdaptiveState,
} from './adaptive';
import { World, contactShadowTexture } from './World';
import { Boss } from './Boss';
import { BossNavigator } from './BossNavigation';
import { BOSS_MOTOR } from './BossTactics';
import { ShieldPatchRegistry } from './ShieldPatches';
import { SCENARIOS } from './TestScenarios';
// Inside the plaza's ring the floor is laid slabs; beyond it, the grit of the outer ground.
import { PLAZA_RADIUS } from './layout';
import {
  AutoShield,
  ATTACKS,
  DUEL,
  guideMissile,
  missileAimOffset,
  patchRadius,
  shieldCovers,
  shieldScale,
  shieldIntercept,
  salvoSpread,
  HitPause,
  PROJECTILES,
  novaCharge,
  FALL,
  fallDrainRate,
  fallPressure,
  fallReleaseDamage,
  fallSlamDamage,
  PRISMA,
  prismaHold,
  type ProjectileKind,
  type AttackId,
  type ShieldPatch,
} from './combat';
import {
  clamp,
  damp,
  groundHeight,
  resolveCircle,
  seededRandom,
  segmentBox,
  segmentSphere,
  type TraceHit,
} from './math';
import {
  MAX_SLOTS,
  SPELLS,
  type GameEvent,
  type Mode,
  type Settings,
  type Snapshot,
  type SpellId,
  type CameraMode,
} from './types';

import { ARENA, BOSS, FLIGHT, GROUND, HEAVY } from './config';
import { flightWish, advanceFlight, dashBoost } from './flight';
import { Ragdoll, type RagdollSurface } from './Ragdoll';
import type { FiringLane } from './AttackSight';
import {
  AirDash,
  BodyTumble,
  LaunchRelease,
  recoveryBlend,
  landingSlide,
  groundFriction,
  supportHeight,
} from './motion';
/** A solar vortex: anchored, pulling, then detonating into a flat ring of embers. */
interface Well {
  position: THREE.Vector3;
  core: THREE.Object3D;
  age: number;
  spin: number;
  detonated: boolean;
}
const START = new THREE.Vector3(0, 1.8, 24);
const UP = new THREE.Vector3(0, 1, 0);
/** Reach (m) of the solar sphere's blast when it bursts against the world. */
const HAMMER_SPLASH = 3.6;
/** Height of the ragdoll's pelvis above the physics root (the lying body's thickness). */
const RAGDOLL_ROOT = 0.3;
const direction = new THREE.Vector3();

export class Game {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(64, 1, 0.065, 720);
  readonly controls: Controls;
  readonly audio: AudioEngine;
  private world: World;
  private fx: Effects;
  private boss: Boss;
  private aegis = new AutoShield();
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  /** The two-tone graphic cut on heavy hits, applied as the last pass of the composer. */
  private readonly impactFrame = new ImpactFrame();
  private settings: Settings;
  private settingsApplied = false;
  private mode: Mode = 'menu';
  private returnMode: Mode = 'playing';
  private projectileSystem!: ProjectileSystem;
  /** The shots in the air, owned by the projectile system. */
  private get projectiles(): Projectile[] {
    return this.projectileSystem.list;
  }
  private player = START.clone();
  private previousPlayer = START.clone();
  private velocity = new THREE.Vector3();
  private travelCache = new THREE.Vector3();
  private viewRightCache = new THREE.Vector3();
  private viewUpCache = new THREE.Vector3();
  private impulse = new THREE.Vector3();
  private airDash = new AirDash();
  private flightEnabled = true;
  private verticalVelocity = 0;
  private groundJumps = 0;
  /** The camera as a physical rig: sprung follow, kick spring, landing dip, punch. */
  private readonly cameraRig = new CameraRig(this.camera);
  private heavyPenetrations: {
    owner: number;
    thickness: number;
    entry: number[];
    exit: number[];
  }[] = [];
  private groundReactions: { actor: string; speed: number; bounce: number; position: number[] }[] =
    [];
  private flightAcceleration = new THREE.Vector3();
  private playerTumble = new BodyTumble(true);
  private ragdoll: Ragdoll;
  private ragdollSurface: RagdollSurface;
  private playerRelease = new LaunchRelease();
  private bank = new THREE.Vector3();
  private bossLane: FiringLane = { mode: 'clear', walls: [], thickness: 0 };
  private sightClock = 0;
  private seekClock = 0;
  private breachClock = 0;
  private blockedCasts = 0;
  /** Continuous seconds without a firing lane; long blockades make the boss close in/climb. */
  private blockedTime = 0;
  private readonly nav = new BossNavigator({
    trace: (start, end, radius) => this.trace(start, end, false, radius),
    // Vantage points are judged for the attack the boss actually wants to cast.
    lane: (from, target) => this.world.firingLane(from, target, this.boss.director.attack).mode,
    bounds: () => this.world.wallBounds,
  });
  private firePacket: { packet: number; pattern: number; origin: THREE.Vector3 } | null = null;
  private pendingFire: { origin: THREE.Vector3; delay: number; index: number; packet: number }[] =
    [];
  private readonly patches = new ShieldPatchRegistry();
  private wells: Well[] = [];
  /** Velocity the vortex has imparted on the player; it bleeds off once the pull ends. */
  private pull = new THREE.Vector3();
  private vortexCoreHits = 0;
  private vortexDetonations = 0;
  private splashHits = 0;
  private seenAirRecoveries = { player: 0, boss: 0 };
  private playerWasPhysical = false;
  private bossSkidTimer = 0;
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
  /** Seconds of post-dash flight boost left (the dash carries momentum into the glide). */
  private flightBoost = 0;
  /** Seconds the fire control has been held with Nova selected (it casts on release). */
  private novaHold = 0;
  private novaHolding = false;
  private novaChargedCasts = 0;
  private novaChimed = false;
  private chargeSigil?: THREE.Group;
  /** Prisma: the circles, beams and standing lances, and the hold that raises them. */
  private prisma!: PrismaSystem;
  /** Distance walked since the last footfall, metres. */
  private stride = 0;
  /** The articulated silhouette riding the collision box, and whether it has arrived. */
  private avatarModel!: AvatarModel;
  /** Whether the box's own faces have been retired in favour of the model. */
  private skinRetired = false;
  /** Whether the body is resting on the floor this frame: jumping and falling count as airborne. */
  private onGround = true;
  private prismaHoldTime = 0;
  private prismaChargeStart = 0;
  /** FALL: the held gravity column over the boss (idle between casts). */
  private fallSystem!: FallSystem;
  private fallPhase: FallPhase = 'idle';
  private fallTime = 0;
  private fallHeld = 0;
  private fallTick = 0;
  private fallHeight = 0;
  private fallLinger = 0;
  private fallSquash = false;
  private testCamera: { at: number[]; look: number[] } | null = null;
  /** A dash pressed a moment too early (cooldown, tumble) fires as soon as it is allowed. */
  private dashBuffer = 0;
  private perfectDodges = 0;
  private dashTime = 0;
  private knockTime = 0;
  private pendingPlayerImpulse: THREE.Vector3 | null = null;
  private facing = new THREE.Vector3(0, 0, -1);
  private facingQuaternion = new THREE.Quaternion();
  private lastDamageBlind = false;
  private lastBlock: { scale: number; radius: number; direction: number[] } | null = null;
  private contacts = 0;
  private slot = 0;
  /** The spell in the selected slot; the loadout itself lives in the settings. */
  private get spell(): SpellId {
    return this.settings.loadout[this.slot] ?? 0;
  }
  private cooldowns = [0, 0, 0, 0];
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
  /** The frame-time budget that walks the resolution ladder (see adaptive.ts). */
  private adaptive: AdaptiveState = adaptiveStart();
  /** The current rung's pixel-ratio multiplier, applied on top of the tier's full ratio. */
  private resolutionScale: number = resolutionScale(this.adaptive);
  /** The measured frame time of the last averaging window, milliseconds (the perf HUD reads it). */
  private frameMs = 0;
  private useBloom = true;
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
  private attacksFired = { fire: 0, missile: 0, hammer: 0, vortex: 0 };
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
      () => this.selectSpell((this.slot + 1) % MAX_SLOTS),
      (locked) => this.emit({ type: 'lock', locked }),
      () => {
        if (this.lockToastShown) return;
        this.lockToastShown = true;
        this.emit({
          type: 'toast',
          text: 'Seret untuk melihat. Tekan E untuk mengunci pandangan ke boss.',
        });
      },
      settings.bindings,
    );
    this.fx = new Effects(this.scene);
    this.fx.eye = this.camera;
    this.projectileSystem = new ProjectileSystem(this.scene, this.fx.sigilMap);
    this.world = new World(this.scene, this.fx);
    this.fx.setGroundSampler((x, z) => this.world.surfaceHeight(x, z));
    this.boss = new Boss(this.scene, this.fx);
    this.prisma = new PrismaSystem(
      this.scene,
      this.fx,
      this.audio,
      this.world,
      this.projectileSystem,
      {
        camera: this.camera,
        isFirst: () => this.cameraMode === 'first',
        player: () => this.player,
        bossAlive: () => this.boss.alive,
        bossPosition: () => this.boss.position,
        aimsAtBoss: (forward) => this.aimsAtBoss(forward),
        trace: (start, end, boss, radius) => this.trace(start, end, boss, radius),
        spendBig: () => {
          this.energy -= PRISMA.big.cost;
          this.cooldowns[1] = 0.6;
        },
        heldCharge: () => this.heldSpell(),
        addShake: (amount) => {
          this.cameraRig.shake = Math.max(this.cameraRig.shake, amount);
        },
        noteCast: () => this.cameraRig.noteCast(),
        noteWorldHit: (ground) => {
          this.lastImpact = { surface: ground ? 'ground' : 'wall', actor: 'player' };
        },
        damageBoss: (amount, impulse, source) => this.damageBoss(amount, impulse, source),
        time: () => this.time,
      },
    );
    this.fallSystem = new FallSystem(
      this.scene,
      (x, z) => this.world.surfaceHeight(x, z),
      settings.reducedEffects,
    );
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
    // An articulated body riding the same transform as the physics box: the box keeps the
    // collisions, the model supplies the silhouette and the animation.
    this.avatarModel = new AvatarModel(this.avatar);
    void this.avatarModel.load();
    this.ragdoll = new Ragdoll(this.scene, this.avatar.material as THREE.Material);
    const world = this.world;
    this.ragdollSurface = {
      height: (x, z) => world.surfaceHeight(x, z),
      // Live view: wall damage rebuilds the collider list, so it must not be captured once.
      get obstacles() {
        return world.obstacles;
      },
    };
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
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(800, 600), 0.5, 0.45, 1.1);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());
    // The impact frame works on the final display-space picture, after tone mapping.
    this.composer.addPass(this.impactFrame.pass);
    try {
      const n = Number(localStorage.getItem('hea-duel-best'));
      this.bestTime = Number.isFinite(n) && n > 0 ? n : 0;
    } catch {
      /* Storage is optional. */
    }
    this.applySettings(settings);
    // The impact frame's two beats each get a sound: a dry click on the paper cut and a
    // sub-bass thump under the negative.
    this.impactFrame.onBeat = (beat) => {
      if (this.mode === 'menu') return;
      if (beat === 0) this.audio.impactPaper();
      else this.audio.impactNegative();
    };
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
        bearing: this.bossBearing(),
        enraged: this.boss.enraged,
        maneuver: this.boss.tactics.maneuver,
      },
      dash: clamp(1 - this.dashCooldown / 1.65, 0, 1),
      spell: this.spell,
      slot: this.slot,
      loadout: [...this.settings.loadout],
      fall: {
        phase: this.fallPhase,
        pressure:
          this.fallPhase === 'press' || this.fallPhase === 'slam' ? fallPressure(this.fallHeld) : 0,
      },
      charge: this.heldSpell().progress,
      charged: this.heldSpell().charged,
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
        boost: this.airDash.active ? 0 : (dashBoost(this.flightBoost) - 1) / FLIGHT.boost,
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
      camera: this.cameraMode,
      fps: this.fps,
      elapsed: this.elapsed,
      bestTime: this.bestTime,
      position: { x: this.player.x, y: this.player.y, z: this.player.z },
      aimTarget: this.aiming,
    };
  }
  /**
   * The few numbers the performance readout needs, gathered without building the whole
   * diagnostics object every frame (that object allocates arrays, and the HUD is per-frame).
   */
  get perfStats() {
    return {
      fps: this.fps,
      frameMs: this.frameMs,
      resolutionScale: this.resolutionScale,
      adaptiveStep: this.adaptive.step,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      pixelRatio: this.renderer.getPixelRatio(),
      density: this.fx.particleDensity,
    };
  }
  get diagnostics() {
    return {
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      perf: {
        fps: this.fps,
        frameMs: this.frameMs,
        resolutionScale: this.resolutionScale,
        adaptiveStep: this.adaptive.step,
        pixelRatio: this.renderer.getPixelRatio(),
        shadows: this.renderer.shadowMap.enabled,
        bloom: this.useBloom,
        density: this.fx.particleDensity,
        programs: this.renderer.info.programs?.length ?? 0,
        points: this.renderer.info.render.points,
        lines: this.renderer.info.render.lines,
      },
      projectiles: this.projectiles.length,
      lowQuality: this.lowQuality,
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
      camera: {
        yaw: this.yaw,
        pitch: this.pitch,
        kick: this.cameraRig.kickOffset.toArray(),
        landings: this.cameraRig.landings,
      },
      cameraPosition: this.camera.position.toArray(),
      avatarVisible: this.avatar.visible,
      avatarModel: avatarReport(this.avatarModel),
      nova: {
        hold: this.novaHold,
        holding: this.novaHolding,
        chargedCasts: this.novaChargedCasts,
      },
      prisma: {
        circles: this.prisma.circles.map((c) => ({
          position: c.position.toArray(),
          normal: c.normal.toArray(),
          age: c.age,
          fired: c.fireAt === null,
          big: c.big,
        })),
        beams: this.prisma.beams,
        bigCasts: this.prisma.bigCasts,
        hold: this.prismaHoldTime,
        charging: !!this.prisma.big,
        charged: this.spell === 1 && this.heldSpell().charged,
        bigPosition: this.prisma.big?.position.toArray() ?? null,
        lastAngle: this.prisma.lastAngle,
      },
      facing: this.facing.toArray(),
      health: this.health,
      hitPause: this.hitPause.remaining,
      slowMotion: this.hitPause.slowRemaining,
      timeScale: this.hitPause.scale,
      punch: this.cameraRig.punch,
      fov: this.camera.fov,
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
      shieldPatches: this.patches.patches,
      patchReuses: this.patches.reuses,
      patchShatters: this.patches.shatters,
      patchGaps: this.patches.openGaps,
      patchLeaks: this.patches.leaks,
      patchTiling: {
        clusters: this.patches.clusterCount,
        joined: this.patches.joined,
        overlaps: this.patches.overlaps,
      },
      shieldEchoes: this.fx.shieldEchoes,
      wells: this.wells.map((w) => ({
        position: w.position.toArray(),
        age: w.age,
        detonated: w.detonated,
      })),
      pull: this.pull.toArray(),
      vortexCoreHits: this.vortexCoreHits,
      vortexDetonations: this.vortexDetonations,
      splashHits: this.splashHits,
      perfectDodges: this.perfectDodges,
      particles: this.fx.activity,
      heavyPenetrations: this.heavyPenetrations,
      groundReactions: this.groundReactions,
      groundJumps: this.groundJumps,
      verticalVelocity: this.verticalVelocity,
      walls: this.world.wallBounds,
      heavyCircleRadius: this.boss.chargeRadius,
      playerPosition: this.player.toArray(),
      playerVelocity: this.velocity.clone().add(this.impulse).add(this.airDash.velocity).toArray(),
      impactFrame: {
        active: this.impactFrame.active,
        phase: this.impactFrame.phase,
        elapsed: this.impactFrame.elapsed,
      },
      dashMotion: {
        active: this.airDash.active,
        strength: this.airDash.strength,
        age: this.airDash.age,
        invulnerable: this.airDash.invulnerable,
        boost: this.flightBoost,
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
        playerAirTime: this.playerTumble.airTime,
        bossAirTime: this.boss.tumble.airTime,
        playerAirRecoveries: this.playerTumble.airRecoveries,
        playerFigure: this.ragdoll.active ? this.ragdoll.shape : null,
        playerFigureSpawns: this.ragdoll.spawns,
        playerFigureContacts: this.ragdoll.contacts,
        bossAirRecoveries: this.boss.tumble.airRecoveries,
        playerFlipping: this.playerTumble.flipping,
        bossFlipping: this.boss.tumble.flipping,
        bossWeight: this.boss.tumble.weight,
        playerOrientation: this.avatar.quaternion.toArray(),
        bossOrientation: this.boss.group.quaternion.toArray(),
      },
      bossTactic: this.boss.tactics.maneuver,
      bossLane: this.bossLane,
      bossBlockedTime: this.blockedTime,
      bossDetour: this.nav.detour ? this.nav.detour.motion.toArray() : null,
      bossRoute: this.nav.route.map((point) => point.toArray()),
      bossVantage: this.nav.vantage ? this.nav.vantage.point.toArray() : null,
      bossOverTop: this.nav.overTop,
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
          aimOffset: p.aimOffset ? p.aimOffset.toArray() : null,
        })),
      shots: this.projectiles.map((p) => ({
        kind: p.kind,
        radius: p.radius,
        origin: p.origin.toArray(),
        position: p.mesh.position.toArray(),
        velocity: p.velocity.toArray(),
      })),
      /**
       * Shot bodies still standing in the scene with no shot behind them. A break hands the
       * mesh to an effect that finishes it off, so this must fall back to zero; anything that
       * lingers is a body left hanging in mid-air where it was caught.
       */
      strayShots: this.scene.children.filter(
        (o) => o.userData.projectile && !this.projectiles.some((p) => p.mesh === o),
      ).length,
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
    this.playerTumble.reset();
    this.ragdoll.reset();
    this.playerRelease.cancel();
    this.bank.set(0, 0, 0);
    this.pendingFire = [];
    this.firePacket = null;
    this.bossLane = { mode: 'clear', walls: [], thickness: 0 };
    this.sightClock = this.seekClock = this.breachClock = this.blockedCasts = 0;
    this.blockedTime = 0;
    this.nav.reset();
    this.patches.reset();
    this.playerWasPhysical = false;
    this.bossSkidTimer = 0;
    this.health = this.energy = 100;
    this.dashCooldown = this.dashTime = this.knockTime = this.flightBoost = 0;
    this.novaHold = 0;
    this.novaHolding = this.novaChimed = false;
    this.clearPrisma();
    this.slot = 0;
    this.endFallSilent();
    this.fallLinger = 0;
    this.cooldowns = [0, 0, 0, 0];
    this.pendingPlayerImpulse = null;
    this.lastBlock = null;
    this.contacts = 0;
    this.lastDamageBlind = false;
    this.roll = 0;
    this.cameraRig.reset();
    this.seenAirRecoveries = { player: 0, boss: 0 };
    this.damageDealt = this.impacts = this.elapsed = 0;
    this.damageTimer = 10;
    this.hitPause.reset();
    this.flashTimer = 0;
    this.impactFrame.cancel();
    this.impactGate.player = this.impactGate.boss = this.skidTimer = 0;
    this.outcome = null;
    this.finishTimer = 0;
    this.testIdleBoss = this.testInvulnerable = false;
    this.lastImpact = null;
    this.attacksFired = { fire: 0, missile: 0, hammer: 0, vortex: 0 };
    this.clearWells();
    this.pull.set(0, 0, 0);
    this.vortexCoreHits = this.vortexDetonations = this.splashHits = this.perfectDodges = 0;
    this.dashBuffer = 0;
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
    if (this.fallPhase !== 'idle') {
      this.endFallSilent();
      this.cooldowns[3] = Math.max(this.cooldowns[3], 2);
    }
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
    if (slot < 0 || slot >= MAX_SLOTS) return;
    if (slot !== this.slot) {
      this.novaHold = 0;
      this.novaHolding = false;
      if (this.prisma.big) this.prisma.cancelBig();
      this.prismaHoldTime = 0;
      if (this.fallPhase !== 'idle') this.endFallSilent();
    }
    this.slot = slot;
    this.audio.click();
  }

  /** A spell newly placed in a slot starts on cooldown, so swapping can never dodge one. */
  noteEquipped(spell: SpellId) {
    this.cooldowns[spell] = SPELLS[spell].cooldown;
  }
  applySettings(settings: Settings) {
    const changed = !this.settingsApplied || this.settings.quality !== settings.quality;
    this.settings = { ...settings, bindings: { ...settings.bindings } };
    this.controls.setBindings(this.settings.bindings);
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
    this.bloomPass.enabled = this.useBloom;
    this.renderer.shadowMap.enabled = !this.lowQuality;
    this.world.setQuality(this.lowQuality);
    this.boss.setQuality(this.lowQuality);
    this.fx.quality(this.lowQuality);
    this.resize(true);
  }
  /**
   * Footfalls: while the body is on the ground and moving, each stride's worth of distance fires
   * one step, so the rhythm follows the speed rather than a timer. The surface is read from where
   * the player is — the plaza's slabs inside its ring, the grit out past it.
   */
  private footsteps(grounded: boolean) {
    if (!grounded || this.manualSimulation) {
      this.stride = 0;
      return;
    }
    const speed = this.velocity.length();
    if (speed < 1.2) {
      this.stride = 0;
      return;
    }
    this.stride += speed / 60;
    if (this.stride < 0.78) return;
    this.stride = 0;
    const distance = Math.hypot(this.player.x, this.player.z);
    this.audio.step(distance > PLAZA_RADIUS ? 'grit' : 'stone', Math.min(1.2, speed / 9));
  }

  private changeMode(mode: Mode) {
    this.mode = mode;
    this.modeTime = 0;
    this.renderNeeded = true;
    this.controls.setEnabled(mode === 'playing' && !this.outcome);
    this.emit({ type: 'mode', mode });
  }
  /** The tier's full pixel ratio before the adaptive ladder takes its share. */
  private get tierRatio() {
    const cap = this.lowQuality ? 1 : this.settings.quality === 'high' ? 2 : 1.5;
    return Math.min(devicePixelRatio || 1, cap);
  }
  /** The pixel budget this tier starts from (never a ceiling: the ladder may climb past it). */
  private get pixelBudget() {
    return this.lowQuality
      ? PIXEL_BUDGET.low
      : this.settings.quality === 'high'
        ? PIXEL_BUDGET.high
        : PIXEL_BUDGET.auto;
  }
  private resize(start = false) {
    const width = innerWidth,
      height = innerHeight;
    if (start) {
      // A huge window should not open on eight million pixels and take a second to react.
      this.adaptive.step = startStep(width, height, this.pixelBudget);
      this.resolutionScale = resolutionScale(this.adaptive);
    }
    const ratio = this.tierRatio * this.resolutionScale;
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(width, height, false);
    this.composer.setPixelRatio(ratio);
    this.composer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.fx.resize(height, ratio);
    this.renderNeeded = true;
  }
  /**
   * One averaging window of frame time through the resolution ladder. Called about once a second
   * with the measured average, and directly by the test harness so the loop can be exercised
   * without needing a slow machine.
   */
  private applyFrameBudget(frameMs: number) {
    const move = adaptiveNext(this.adaptive, frameMs);
    this.adaptive = move.state;
    if (!move.direction) return;
    this.resolutionScale = resolutionScale(this.adaptive);
    this.resize();
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
      this.frameMs = (this.frameTime / Math.max(1, this.frames)) * 1000;
      this.frames = this.frameTime = 0;
      // The particle budget follows the real frame rate (not under the stepped test harness).
      if (!this.manualSimulation && this.renderTime > 2) {
        this.fx.load(this.fps);
        this.applyFrameBudget(this.frameMs);
      }
      // Only when the ladder itself is out of room does the tier give up shadows and bloom, and
      // only on Otomatis: Tinggi and Ringan are the player's explicit choice and stay put.
      const floored = this.adaptive.step === RESOLUTION_LADDER.length - 1;
      if (this.settings.quality === 'auto' && !this.lowQuality && this.renderTime > 4) {
        this.slowFrames = this.fps < 28 && floored ? this.slowFrames + 1 : 0;
        if (this.slowFrames >= 3) {
          this.lowQuality = true;
          this.configureQuality();
        }
      }
    }
    if (!this.manualSimulation) this.simulate(Math.max(0, rawDt));
    // The ears sit on the camera: placed cues then pan around the player as they turn, which is
    // how a boss at their back becomes audible without a marker on screen.
    this.camera.getWorldDirection(direction);
    this.audio.listener(this.camera.position, direction);
    this.audio.update();
    this.renderer.info.reset();
    if (this.testCamera) {
      // Test harness only: a pinned observer camera for close-up screenshots.
      this.camera.position.fromArray(this.testCamera.at);
      this.camera.lookAt(new THREE.Vector3().fromArray(this.testCamera.look));
      this.camera.updateMatrixWorld();
    }
    if (this.useBloom || this.impactFrame.active) {
      const target = this.composer.renderTarget1;
      this.impactFrame.prepare(this.camera, target.width, target.height);
      this.composer.render();
    } else this.renderer.render(this.scene, this.camera);
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
    this.impactFrame.update(realDt);
    // The camera punch runs on wall-clock time so it still plays while the world is frozen.
    this.cameraRig.punch = damp(this.cameraRig.punch, 0, 4.5, realDt);
    if (this.hitPause.active && this.mode === 'playing') this.updateCamera(0, false, realDt);
    // Pause uses wall-clock time: a dead freeze, then slow motion ramping back to real time.
    // Physics still has a cap, so slow renderers cannot tunnel.
    let left = Math.min(0.1, this.hitPause.consume(realDt));
    while (left > 1e-8) {
      // A freeze requested by a hit inside this frame eats the rest of the frame's budget.
      left = this.hitPause.hold(left);
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
      this.patches.age(dt);
      this.damageTimer += dt;
      this.impactGate.player = Math.max(0, this.impactGate.player - dt);
      this.impactGate.boss = Math.max(0, this.impactGate.boss - dt);
      this.previousPlayer.copy(this.player);
      this.updatePlayer(dt, this.mode !== 'playing');
      if (this.hitPause.remaining === 0) this.prisma.update(dt);
      if (this.hitPause.remaining === 0)
        this.fallSystem.update(
          dt,
          this.fallPhase,
          this.fallPhase === 'press' || this.fallPhase === 'slam' ? fallPressure(this.fallHeld) : 0,
          this.fallPhase === 'build' ? this.boss.position : null,
        );
      if (this.hitPause.remaining === 0) this.updateBoss(dt);
      if (this.hitPause.remaining === 0) {
        this.updateFireGates(dt);
        this.updateWells(dt);
        if (!this.outcome) this.updateProjectiles(dt);
        else this.clearProjectiles();
      }
      if (this.mode !== 'playing') this.showcaseCamera(dt);
      this.presentActors(this.hitPause.remaining > 0 ? 0 : dt);
      this.noteAirRecoveries();
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
    if (this.fallPhase === 'idle') this.energy = Math.min(100, this.energy + dt * 12);
    else if (this.fallPhase === 'build') this.energy = Math.min(100, this.energy + dt * 6);
    if (this.damageTimer > 9 && !this.outcome) this.health = Math.min(100, this.health + dt * 3);
    if (this.controls.focusRequested) {
      this.controls.focusRequested = false;
      this.lockedOn = !this.lockedOn;
    }
    if (this.controls.viewRequested) {
      this.controls.viewRequested = false;
      if (!this.outcome) this.toggleCamera();
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
    // The dash leaves the motor running hot: once the burst itself is over, movement stays
    // markedly faster for half a second and then eases back over the next second, in the air
    // and on foot alike. The clock only runs after the burst so the plateau is felt in full.
    if (!this.airDash.active) this.flightBoost = Math.max(0, this.flightBoost - dt);
    if (this.flightBoost > 0) wish.multiplyScalar(dashBoost(this.flightBoost));
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
    this.onGround = grounded;
    this.footsteps(grounded);
    const physical = this.playerTumble.physical;
    if (this.playerWasPhysical && !physical && !grounded && !this.flightEnabled) {
      // Mid-air recovery in walk mode hands the remaining fall to the ordinary gravity model.
      this.verticalVelocity = Math.min(0, this.impulse.y);
      this.impulse.y = 0;
      this.groundJumps = Math.max(this.groundJumps, 1);
    }
    this.playerWasPhysical = physical;
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
        wish.y = Math.max(wish.y, (floor + FLIGHT.hoverHeight - this.player.y) * 6 * recovery);
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
      this.dashBuffer = 0.18;
    }
    if (this.dashBuffer > 0) {
      this.dashBuffer -= dt;
      if (this.dashCooldown === 0 && this.damageTimer > 0.25 && !this.outcome && !physical) {
        this.dashBuffer = 0;
        this.dashCooldown = 1.65;
        const dashAim = wish.lengthSq() > 0.01 ? wish.clone() : this.facing.clone();
        if (!this.flightEnabled) dashAim.y = 0;
        this.airDash.start(dashAim.normalize());
        this.knockTime = Math.min(this.knockTime, 0.55);
        this.flightBoost = FLIGHT.boostDuration;
        this.audio.dash();
        const chest = this.player.clone().add(UP);
        this.fx.burst(chest, '#effaff', 22, 3.6, 0.26, 2);
        // The launch disc: a flat white circle left hanging at the take-off point, facing the
        // way the body goes, that tears open into a jagged ring as the body leaves it. Close
        // to the ground the disc would cut through the floor, so it lies on the surface instead.
        this.launchDisc(chest, this.airDash.direction, floor, 1);
        if (!this.flightEnabled) this.fx.dust(this.player, 8, 1.4);
      }
    }
    this.airDash.step(dt, wish);
    this.dashTime = this.airDash.active ? AirDash.duration - this.airDash.age : 0;
    // No afterimages: the dash is read from the torn disc, the thickened ribbon and the
    // speed itself.
    advanceFlight(this.velocity, this.flightAcceleration, wish, dt);
    const motor = this.velocity.clone().add(this.airDash.velocity);
    if (!this.flightEnabled && !physical) motor.y = this.verticalVelocity;
    // The vortex's pull rides on top of the motor: thrust fights it, a dash breaks it.
    if (this.pull.lengthSq() > 1e-6) {
      if (!this.flightEnabled && !physical) this.pull.y = 0;
      motor.add(this.pull);
    }
    this.moveBody(
      this.player,
      motor,
      this.impulse,
      dt,
      this.knockTime > 0 || physical,
      'player',
      0.38 + this.playerTumble.weight * 0.4,
      // A thrown body is a jointed figure lying low, not a standing box.
      1.7 * (1 - this.playerTumble.weight) + RAGDOLL_ROOT * 2.4 * this.playerTumble.weight,
    );
    if (motor.y === 0 && this.velocity.y < 0) {
      this.velocity.y = 0;
      this.flightAcceleration.y = 0;
    }
    if (!this.flightEnabled && motor.y === 0 && this.verticalVelocity < 0) {
      // The one moment a fall's weight should reach the eye, measured before it is zeroed.
      this.landCamera(-this.verticalVelocity);
      this.verticalVelocity = 0;
    }
    if (physical && this.playerTumble.grounded) groundFriction(this.impulse, dt);
    else {
      const drag = Math.exp(-dt * (physical ? 0.28 : 0.55 * (1 - recovery) + recovery * 5));
      this.impulse.x *= drag;
      this.impulse.z *= drag;
    }
    this.skidTimer -= dt;
    const dragging =
      (physical && this.playerTumble.grounded) ||
      (this.knockTime > 0 && this.impulse.length() > 4 && this.player.y < floor + 0.35);
    if (dragging && this.skidTimer <= 0) {
      // A continuous friction trail while the body is dragged, as in the reference footage.
      this.skidTimer = 0.045;
      this.fx.skid(this.player, this.impulse.clone().add(motor), 1, 'player');
    }
    if (dragging && this.mode !== 'menu')
      this.audio.scrape('player', Math.hypot(this.impulse.x + motor.x, this.impulse.z + motor.z));
    // The chase camera banks with lateral speed (about six degrees at full strafe), so the
    // horizon tilts through turns the way it does in the reference footage.
    const lateral = this.velocity.dot(
      new THREE.Vector3(1, 0, 0).applyQuaternion(this.facingQuaternion),
    );
    this.roll = damp(
      this.roll,
      this.settings.reducedEffects
        ? 0
        : clamp(-lateral / FLIGHT.speed, -1, 1) * (this.flightEnabled ? 0.11 : 0.04) -
            move.x * 0.012 +
            (this.knockTime > 0 ? Math.sin(this.time * 8) * 0.055 : 0),
      6,
      dt,
    );
    // The rush of air: fed while the body moves fast through the air under its own motor
    // (not while dragged along the ground, which has its own scrape), panned to the side
    // the body is sweeping towards.
    if (this.mode !== 'menu' && !dragging) {
      const airspeed = motor.length();
      if (airspeed > 9)
        this.audio.wind(
          airspeed,
          clamp(lateral / FLIGHT.speed, -1, 1),
          this.airDash.active ? 0 : (dashBoost(this.flightBoost) - 1) / FLIGHT.boost,
        );
    }
    if (!showcase) {
      this.updateCamera(dt);
      this.camera.getWorldDirection(direction);
      this.aiming = this.aimsAtBoss(direction);
      const shoot = this.controls.shooting || this.controls.shotRequested;
      if (this.hitPause.remaining === 0) {
        const may = !this.outcome && this.damageTimer > 0.18 && !this.playerTumble.physical;
        if (this.spell === 2) {
          // Nova casts on release: a tap is the ordinary blast, a hold charges it. The hold
          // only starts counting once the spell is ready, so a button pressed during the
          // cooldown begins charging the moment it ends.
          if (this.controls.shooting && may) {
            this.controls.shotRequested = false;
            if (this.cooldowns[2] === 0 && this.energy >= SPELLS[2].cost) {
              this.novaHold += dt;
              this.novaHolding = true;
            }
          } else if (this.novaHolding || this.controls.shotRequested) {
            this.controls.shotRequested = false;
            if (may) this.cast();
            this.novaHold = 0;
            this.novaHolding = false;
          }
        } else if (this.spell === 3) {
          this.updateFallCast(dt, may);
        } else if (this.spell === 1) {
          // Prisma: a tap raises a circle that fires on its own; the button held past a
          // short threshold raises the large circle, which charges and fires on release.
          if (this.controls.shotRequested && may) this.cast();
          this.controls.shotRequested = false;
          if (this.controls.shooting && may) {
            this.prismaHoldTime += dt;
            if (
              prismaHold(this.prismaHoldTime, this.energy).charging &&
              !this.prisma.big &&
              this.prismaChargeStart === 0 &&
              this.energy >= PRISMA.big.cost
            )
              this.raisePrismaBig();
          } else {
            if (this.prisma.big) {
              if (this.heldSpell().charged && may) this.castPrismaBig();
              else this.cancelPrismaBig();
            }
            this.prismaHoldTime = this.prismaChargeStart = 0;
          }
        } else {
          this.controls.shotRequested = false;
          if (shoot && may) this.cast();
        }
      }
      this.presentCharge();
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
      // A dragged body hugs the ground: on a falling slope it would otherwise lift off in
      // tiny hops, lose its friction and creep along "unconscious" for seconds.
      const snapped =
        tumble.physical && tumble.landings > 0 && total.y <= 0.001 && ny <= floor + 0.35;
      if ((total.y < 0 && ny <= floor) || snapped) {
        const force = snapped ? 0 : Math.abs(total.y),
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
          position.y = snapped ? floor : Math.max(ny, floor);
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
  /**
   * Chase camera. `realDt` > 0 with `dt` = 0 runs only the wall-clock parts (the heavy-hit
   * zoom punch and its shake) while the simulation itself is frozen or slowed.
   */
  /** Flip between the chase camera and the first-person view; the shell persists it. */
  toggleCamera() {
    const camera: CameraMode = this.settings.camera === 'first' ? 'third' : 'first';
    this.settings = { ...this.settings, camera };
    this.emit({ type: 'camera', camera });
  }
  /**
   * The view in use right now. First person is a setting, but the camera steps back out to the
   * chase framing while the body is thrown about as a ragdoll, and returns once it stands.
   */
  get cameraMode(): CameraMode {
    return this.settings.camera === 'first' &&
      !this.playerTumble.physical &&
      this.playerTumble.weight < 0.02 &&
      !this.ragdoll.active &&
      this.outcome !== 'gameover'
      ? 'first'
      : 'third';
  }
  private updateCamera(dt: number, snap = false, realDt = 0) {
    this.cameraRig.update({
      dt,
      snap,
      realDt,
      first: this.cameraMode === 'first',
      yaw: this.yaw,
      pitch: this.pitch,
      roll: this.roll,
      time: this.time,
      player: this.player,
      velocity: this.velocity,
      impulse: this.impulse,
      dashVelocity: this.airDash.velocity,
      dashStrength: this.airDash.strength,
      dashActive: this.airDash.active,
      bankZ: this.bank.z,
      flightEnabled: this.flightEnabled,
      knockTime: this.knockTime,
      settings: this.settings,
      trace: (start, end, radius) => this.trace(start, end, false, radius),
    });
  }
  private showcaseCamera(dt: number) {
    this.cameraRig.showcase(this.mode, dt, this.player, this.boss.position, this.time);
  }
  /**
   * Shove the view along `direction`, sized for the view in use. See `CameraRig.kick`: the
   * cap follows the view the player is about to see, which is why a hammer — which throws
   * the body and so steps the camera back out — is sized for the chase camera even when the
   * blow lands in first person.
   */
  private kickCamera(direction: THREE.Vector3, metres: number) {
    this.cameraRig.kick(
      direction,
      metres,
      this.cameraMode === 'first',
      this.settings.reducedEffects,
    );
  }
  /** Touching down drops the view by the weight of the fall; the rig's spring lifts it back. */
  private landCamera(fall: number) {
    this.cameraRig.land(fall, this.cameraMode === 'first', this.settings.reducedEffects);
  }
  private applyPunch(realDt: number) {
    this.cameraRig.applyPunch(realDt, this.settings.reducedEffects);
  }
  /** The moment a tumbling body rights itself in the air gets its own small flourish. */
  private noteAirRecoveries() {
    if (this.playerTumble.airRecoveries > this.seenAirRecoveries.player) {
      this.seenAirRecoveries.player = this.playerTumble.airRecoveries;
      this.fx.airRecover(this.player.clone().addScaledVector(UP, 0.7), 1);
    }
    if (this.boss.tumble.airRecoveries > this.seenAirRecoveries.boss) {
      this.seenAirRecoveries.boss = this.boss.tumble.airRecoveries;
      this.fx.airRecover(this.boss.position.clone(), 2.2);
    }
  }
  private presentActors(dt: number) {
    this.avatar.position.copy(this.player);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.facingQuaternion);
    // The body leans into its motion like a flyer, not a box on rails: a deep roll into
    // lateral speed (with a touch of anticipation from the acceleration) and a nose-down
    // pitch with forward speed, both eased so the pose flows through turns.
    const lean = this.flightEnabled ? 1 : 0.35;
    this.bank.z = damp(
      this.bank.z,
      clamp(
        ((-this.velocity.dot(right) / FLIGHT.speed) * FLIGHT.bankRoll -
          this.flightAcceleration.dot(right) * 0.004) *
          lean,
        -FLIGHT.bankRoll,
        FLIGHT.bankRoll,
      ),
      9,
      dt,
    );
    this.bank.x = damp(
      this.bank.x,
      clamp(
        (this.velocity.dot(this.facing) / FLIGHT.speed) * FLIGHT.bankPitch * lean +
          this.airDash.strength * 0.13,
        -FLIGHT.bankPitch,
        FLIGHT.bankPitch + 0.13,
      ),
      9,
      dt,
    );
    const pose = this.facingQuaternion
      .clone()
      .multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(this.bank.x, 0, this.bank.z)));
    this.avatar.quaternion.copy(this.playerTumble.step(dt, pose));
    // A slow hover bob while flying gently, fading out with speed.
    const cruise = Math.min(1, this.velocity.length() / FLIGHT.speed);
    const bob = this.flightEnabled ? Math.sin(this.time * 2.2) * 0.05 * (1 - cruise) : 0;
    const restingPivot = (this.flightEnabled ? 0.85 : 0.66) + bob;
    this.avatar.position.y +=
      restingPivot * (1 - this.playerTumble.weight) +
      (supportHeight(this.avatar.quaternion, new THREE.Vector3(0.325, 0.65, 0.325)) + 0.025) *
        this.playerTumble.weight;
    if (this.ragdoll.active) {
      // The jointed body rides the physics root while the tumble lasts, then gathers itself
      // into the avatar's standing pose as the tumble recovers and hands back to the box.
      const rise = this.playerTumble.phase === 'recover' ? 1 - this.playerTumble.weight : 0;
      this.ragdoll.step(
        dt,
        this.player.clone().addScaledVector(UP, RAGDOLL_ROOT),
        this.ragdollSurface,
        rise,
        this.avatar.position,
        this.avatar.quaternion,
      );
      if (!this.playerTumble.active) this.ragdoll.finish();
    }
    const first = this.cameraMode === 'first';
    this.avatar.visible = !this.ragdoll.active && !first;
    if (this.avatarModel.ready && !this.skinRetired) {
      // The box stays as the transform root, but its own faces are retired once the model stands
      // on it. The material is swapped rather than hidden in place: the ragdoll shares the
      // original instance, and hiding that would take the jointed body with it.
      this.skinRetired = true;
      const retired = (this.avatar.material as THREE.MeshStandardMaterial).clone();
      retired.visible = false;
      this.avatar.material = retired;
      this.avatar.castShadow = false;
      this.avatar.children.forEach((child) => {
        if (child !== this.avatarModel.group) child.visible = false;
      });
    }
    if (this.avatarModel.ready) {
      this.avatarModel.update(dt, {
        speed: this.velocity.length() + this.airDash.velocity.length(),
        airborne: this.flightEnabled || this.knockTime > 0 || !this.onGround,
        dead: this.health <= 0 || this.outcome === 'gameover',
      });
    }
    // From the eyes the ribbon would only ever smear across the lower edge of the view.
    this.playerTrail.mesh.visible = !first;
    // A body dragged along the ground leaves a furrow, not a light trail.
    if (this.playerTumble.physical && this.playerTumble.grounded)
      this.playerTrail.reset(this.avatar.position);
    else
      this.playerTrail.push(
        this.avatar.position,
        this.camera.position,
        // The ribbon thickens while the post-dash glide is still fast, then thins back.
        1 + 2.4 * Math.min(1, this.flightBoost / FLIGHT.boostDuration),
      );
    this.world.focusShadow(this.player);
    this.boss.present(
      this.time,
      dt,
      this.player.clone().add(new THREE.Vector3(0, 0.95, 0)),
      this.camera.position,
    );
    // Under FALL the construct is pressed low and trembling against the weight: a slight
    // vertical squash and a fine two-wave shudder, so the hold reads on the body itself.
    if (this.fallPhase === 'press' && this.boss.alive) {
      const tremble = (Math.sin(this.time * 47) + Math.sin(this.time * 31 + 1.3)) * 0.5;
      this.boss.group.scale.set(BOSS.scale * 1.05, BOSS.scale * 0.93, BOSS.scale * 1.05);
      this.boss.group.position.y -= 0.12;
      this.boss.group.position.x += tremble * 0.02;
      this.boss.group.position.z += Math.cos(this.time * 39) * 0.015;
    } else if (this.fallSquash) {
      // Undo the squash exactly once: the group scale belongs to the boss (BOSS.scale),
      // so it is restored to that, never to 1.
      this.fallSquash = false;
      this.boss.group.scale.setScalar(BOSS.scale);
    }
    [this.player, this.boss.position].forEach((p, i) => {
      this.stamp.position.set(p.x, this.world.surfaceHeight(p.x, p.z) + 0.035, p.z);
      this.stamp.rotation.set(-Math.PI / 2, 0, 0);
      const size = i === 0 ? 1.6 + Math.max(0, p.y) * 0.2 : this.boss.alive ? 3.3 * BOSS.scale : 0;
      this.stamp.scale.set(size, size, 1);
      this.stamp.updateMatrix();
      this.shadows.setMatrixAt(i, this.stamp.matrix);
    });
    this.shadows.instanceMatrix.needsUpdate = true;
  }
  /** The hunting spell opens with a fast break away from the player: a torn disc and dust. */
  private bossBreakAway() {
    const b = this.boss;
    if (!b.alive || b.tumble.physical) return;
    const away = b.position.clone().sub(this.player);
    away.y = 0;
    if (away.lengthSq() < 1e-4 || away.length() > 44) return;
    away.normalize();
    this.launchDisc(
      b.position.clone().addScaledVector(away, -1.2),
      away,
      this.world.surfaceHeight(b.position.x, b.position.z),
      BOSS.scale * 0.95,
    );
    this.fx.burst(b.position, '#ffd2a8', 10, 4, 0.3, 0.9);
  }
  /**
   * The take-off disc. In the air it hangs across the path, raised just enough that its
   * opening radius clears the ground; a body too close to the floor for that (a dash on
   * foot) leaves a ring on the ground instead of a disc cut in half by it.
   */
  private launchDisc(at: THREE.Vector3, direction: THREE.Vector3, floor: number, scale: number) {
    const radius = 2.2 * scale;
    if (at.y - floor >= 1.5 * scale) {
      const lifted = at.clone();
      lifted.y = Math.max(at.y, floor + radius + 0.1);
      this.fx.dashRing(lifted, direction, scale);
    } else this.fx.dashRing(new THREE.Vector3(at.x, floor + 0.07, at.z), UP, scale * 0.85, true);
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
    // FALL holds the boss where it struck: no tactics, no director, no way out while
    // the caster keeps the button down. The descent itself is driven here, so the slam
    // crosses the air at full slam speed inside a frame or two.
    if ((this.fallPhase === 'slam' || this.fallPhase === 'press') && b.alive) {
      b.velocity.set(0, 0, 0);
      b.impulse.set(0, 0, 0);
      const floor = groundHeight(
        b.position.x,
        b.position.z,
        b.position.y - BOSS.extent,
        this.world.obstacles,
        this.world.surfaceHeight(b.position.x, b.position.z),
      );
      const restY = floor + BOSS.extent;
      if (this.fallPhase === 'slam') {
        const next = b.position.y - FALL.slamSpeed * dt;
        if (next <= restY) {
          b.position.y = restY;
          this.fallImpact();
        } else b.position.y = next;
      } else b.position.y = restY;
      b.group.position.copy(b.position);
      b.group.lookAt(this.player.clone().add(UP));
      b.group.updateMatrixWorld(true);
      return;
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
    this.blockedTime = this.bossLane.mode === 'blocked' ? this.blockedTime + dt : 0;
    const recovery = b.tumble.physical ? 0 : recoveryBlend(b.knockTime) * (1 - b.tumble.weight);
    const eye = this.player.clone().addScaledVector(UP, 0.9);
    const motor = b.tactics.step(
      dt,
      b.position,
      this.player,
      b.director.attack,
      b.director.stage,
      b.director.pattern,
      // A manoeuvre waypoint must keep the player in sight and be reachable in a straight
      // flight; otherwise the local steering would climb over a monolith to get there.
      (goal) =>
        this.world.firingLane(goal, eye, b.director.attack).mode !== 'blocked' &&
        !this.trace(b.position, goal, false, 1.2),
      this.bossLane.mode === 'clear',
      b.director.stage === 'telegraph' && !b.tumble.physical ? b.director.elapsed : Infinity,
    );
    if (b.knockTime === 0)
      this.nav.steer(b.position, motor, b.tactics.goal, this.player, this.time);
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
    motor.clampLength(0, b.tactics.retreating ? BOSS_MOTOR.retreat : BOSS_MOTOR.max);
    motor.multiplyScalar(0.035 + recovery * 0.965);
    // The weight outlives the spell a little: after a release the boss climbs and moves
    // as if still carrying it, before it is fully itself again.
    if (this.fallLinger > 0) {
      this.fallLinger = Math.max(0, this.fallLinger - dt);
      motor.multiplyScalar(0.35);
      if (motor.y > 0) motor.y *= 0.3;
    }
    b.impulse.y -= (b.tumble.physical ? HEAVY.gravity : 14 * (1 - recovery)) * dt;
    // The motor's exponential smoothing (time constant ~0.19 s) already rounds waypoint
    // changes off; the banked, slerped presentation in Boss.present() does the rest, so the
    // navigation itself is left exactly as tuned.
    b.velocity.lerp(motor, 1 - Math.exp(-dt * 5.2));
    const extent =
        BOSS.extent * (1 - b.tumble.weight) +
        supportHeight(
          b.tumble.orientation,
          new THREE.Vector3(1.85, 1.7, 0.575).multiplyScalar(BOSS.scale),
          -0.3375 * BOSS.scale,
        ) *
          b.tumble.weight,
      feet = b.position.clone().addScaledVector(UP, -extent);
    this.moveBody(
      feet,
      b.velocity,
      b.impulse,
      dt,
      b.knockTime > 0,
      'boss',
      (1.15 + b.tumble.weight * 0.75) * BOSS.scale,
      extent * 2,
    );
    b.position.copy(feet).addScaledVector(UP, extent);
    this.bossSkidTimer -= dt;
    if (b.tumble.physical && b.tumble.grounded && this.bossSkidTimer <= 0) {
      this.bossSkidTimer = 0.045;
      this.fx.skid(feet, b.impulse.clone().add(b.velocity), 1.8, 'boss');
    }
    if (b.tumble.physical && b.tumble.grounded && this.mode !== 'menu')
      this.audio.scrape(
        'boss',
        Math.hypot(b.impulse.x + b.velocity.x, b.impulse.z + b.velocity.z),
        1.3,
      );
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
        if (this.mode !== 'menu') this.audio.charge(this.boss.position);
        if (command.attack === 'missiles') this.bossBreakAway();
        if (command.attack === 'hammer') {
          const mark = this.player.clone();
          mark.y = this.world.surfaceHeight(mark.x, mark.z) + 0.04;
          this.fx.glyph(mark, UP, '#ff9a5d', 2.8, ATTACKS.hammer.tell);
        }
      } else this.bossAttack(command.attack, command.index);
    }
    // The last third of a second of the hammer tell draws the shot line to the locked point,
    // so the sphere's path can be read and sidestepped before it leaves the glyph.
    if (
      b.director.attack === 'hammer' &&
      b.director.stage === 'telegraph' &&
      b.director.charge >= 1 - 0.3 / b.director.duration
    ) {
      const muzzle = b.muzzle(PROJECTILES.hammer.radius);
      this.fx.beam(muzzle, b.lockedTarget, '#ffd9a0', 0.028, 0.07);
    }
    if (b.director.attack === 'vortex' && b.director.stage === 'telegraph' && b.alive) {
      // The tell: loose embers drawn into the glyph, so the pull is announced before it exists.
      const glyph = b.muzzle();
      if (Math.random() < dt * 40) this.fx.inflow(glyph, 3.2, 1, '#ff7a4a');
      this.fx.attract(glyph, 4, 12, 0.9);
    }
  }
  private updateBossSight() {
    const b = this.boss,
      target = this.player.clone().add(new THREE.Vector3(0, 0.9, 0));
    this.bossLane = this.world.firingLane(b.position, target, b.director.attack);
    if (this.bossLane.mode !== 'blocked') {
      // Sight regained part-way along a route: the waypoint no longer needs protecting, so the
      // ordinary range control may pull the boss in from the corner it peeked around.
      b.tactics.routing = false;
      return;
    }
    this.pendingFire = [];
    this.firePacket = null;
    b.clearGates();
    if (!this.testIdleBoss && this.breachClock <= 0) {
      // Whenever the player can be seen at all, something is cast: an attack whose corridor
      // fits (a thin bolt stream past a corner, a seeker that curves, a sphere that breaches a
      // slab) replaces the one that does not, instead of the boss going quiet while it looks
      // for a better spot. Clear lanes beat breaches.
      let pick: { attack: AttackId; lane: FiringLane } | null = null;
      for (const attack of ['fire', 'missiles', 'hammer', 'vortex'] as const) {
        if (attack === b.director.attack) continue;
        const lane = this.world.firingLane(b.position, target, attack);
        if (lane.mode === 'blocked') continue;
        if (!pick || (pick.lane.mode === 'breach' && lane.mode === 'clear'))
          pick = { attack, lane };
      }
      if (pick && b.director.redirect(pick.attack)) {
        this.bossLane = pick.lane;
        this.breachClock = 4;
        b.lockedTarget.copy(target);
        if (this.mode !== 'menu') this.audio.charge(this.boss.position);
        return;
      }
    }
    if (this.seekClock > 0 || this.testIdleBoss) return;
    this.seekClock = 0.4;
    b.tactics.seekSight(
      this.nav.seek(b.position, this.player, target, this.time, this.blockedTime),
      b.director.pattern,
    );
  }
  private permittedCast(
    attack: AttackId,
    origin?: THREE.Vector3,
    target = this.player.clone().add(new THREE.Vector3(0, 0.9, 0)),
    count = true,
  ) {
    const core = this.world.firingLane(this.boss.position, target, attack);
    if (core.mode === 'blocked') {
      if (count) this.blockedCasts++;
      return false;
    }
    if (
      origin &&
      (!this.clearSight(this.boss.position, origin) ||
        this.world.firingLane(origin, target, attack).mode === 'blocked')
    ) {
      if (count) this.blockedCasts++;
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
        // The packet's own ring slot is preferred; when a wall or the ground masks that
        // slot, the gate opens at the nearest slot around the ring with a clear lane.
        const eye = this.player.clone().addScaledVector(UP, 0.9),
          floor = (x: number, z: number) => this.world.surfaceHeight(x, z);
        let slot = packet;
        for (let k = 0; k < 8; k++) {
          const candidate = packet + k;
          if (this.permittedCast('fire', this.boss.gateOriginFor(candidate, floor), eye, false)) {
            slot = candidate;
            break;
          }
        }
        const origin = this.boss.fireGate(packet, eye, floor, slot);
        this.firePacket = { packet, pattern, origin };
      }
      this.pendingFire.push({
        origin: this.firePacket.origin.clone(),
        delay: 0.12,
        index,
        packet,
      });
    } else if (attack === 'missiles') {
      for (const side of [0, 3]) {
        const port = this.boss.spellPort(index + side),
          center = this.player.clone().add(new THREE.Vector3(0, 0.9, 0)),
          approach = center.clone().sub(port).normalize(),
          right = new THREE.Vector3().crossVectors(approach, UP);
        if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
        right.normalize();
        // Every orb gets its own scatter point, so a salvo fans out instead of forming one stream.
        const scatter = missileAimOffset(
            this.boss.director.pattern * 131 + index * 2 + (side ? 1 : 0),
          ),
          aimOffset = right.multiplyScalar(scatter.side).addScaledVector(UP, scatter.up),
          forward = center.add(aimOffset).sub(port).normalize();
        const radial = port.clone().sub(this.boss.muzzle()).normalize();
        // Seekers leave on an outward, rising arc off the glyph and only then turn and dive
        // on the player, so every salvo blooms open before it converges.
        const near = Math.min(1, port.distanceTo(this.player) / 12);
        const launch = forward
          .multiplyScalar(0.55)
          .addScaledVector(radial, 0.6 * near)
          .addScaledVector(UP, 0.5 * near)
          .normalize()
          .multiplyScalar(17);
        if (!this.permittedCast('missiles', port)) continue;
        this.spawn(port, launch, 'missile', 16, false, aimOffset);
        this.fx.glyph(port, launch.clone().normalize(), '#ffbc80', 0.42, 0.3);
        this.fx.burst(port, '#ffb98a', 8, 2.5, 0.22, 0.7);
      }
      if (this.mode !== 'menu') this.audio.cast(0);
    } else if (attack === 'vortex') {
      // The seed heads for where the player will be, and anchors a little short of the body.
      const target = this.player
        .clone()
        .addScaledVector(UP, 1.6)
        .addScaledVector(this.velocity, 0.45)
        .addScaledVector(this.impulse, 0.3);
      target.x = clamp(target.x, -ARENA.halfSize + 6, ARENA.halfSize - 6);
      target.z = clamp(target.z, -ARENA.halfSize + 6, ARENA.halfSize - 6);
      target.y = clamp(
        target.y,
        this.world.surfaceHeight(target.x, target.z) + 1.5,
        ARENA.ceiling - 2,
      );
      const aim = target.clone().sub(muzzle),
        distance = Math.max(4, aim.length() - 2.5);
      aim.normalize();
      if (!this.permittedCast('vortex', muzzle, target)) return;
      this.spawn(muzzle, aim.clone().multiplyScalar(PROJECTILES.vortex.speed), 'vortex', 0);
      const seed = this.projectiles[this.projectiles.length - 1];
      seed.anchor = muzzle.clone().addScaledVector(aim, distance);
      seed.life = distance / PROJECTILES.vortex.speed + 0.05;
      this.fx.glyph(muzzle, aim, '#ff6a3a', 1.6, 0.5);
      this.fx.burst(muzzle, '#ff8a5a', 30, 4, 0.5, 1);
      if (this.mode !== 'menu') this.audio.cast(2);
    } else {
      if (!this.permittedCast('hammer', muzzle, this.boss.lockedTarget)) return;
      const aim = this.boss.lockedTarget.clone().sub(muzzle).normalize();
      this.spawn(muzzle, aim.clone().multiplyScalar(PROJECTILES.hammer.speed), 'hammer', 29);
      this.fx.glyph(muzzle, aim, '#fff0b8', 2.6, 0.55);
      this.fx.glyph(muzzle.clone().addScaledVector(aim, 0.6), aim, '#ffd28a', 1.4, 0.3);
      this.fx.burst(muzzle, '#ffe7ae', 48, 6, 0.8, 1.1);
      // The heave kicks the caster backwards and off its line.
      if (!this.boss.tumble.physical) this.boss.impulse.addScaledVector(aim, -7.5);
      if (this.mode !== 'menu') this.audio.cast(2);
    }
  }
  /** A vortex seed arriving: its body becomes the core of a well that starts to pull. */
  private anchorWell(p: Projectile, at: THREE.Vector3) {
    const core = p.mesh;
    core.userData.projectile = false;
    core.position.copy(at);
    core.rotation.set(0, 0, 0);
    core.scale.setScalar(PROJECTILES.vortex.radius / 0.17);
    for (const child of [...core.children]) core.remove(child);
    this.projectileSystem.decorateWellCore(core);
    this.wells.push({ position: at.clone(), core, age: 0, spin: 0, detonated: false });
    this.fx.burst(at, '#ff7a4a', 26, 4, 0.4, 0.5);
    if (this.mode !== 'menu') this.audio.vortex(this.boss.position);
  }
  private updateWells(dt: number) {
    const center = this.player.clone().addScaledVector(UP, 0.9);
    let pulling = false;
    for (let i = this.wells.length - 1; i >= 0; i--) {
      const w = this.wells[i];
      w.age += dt;
      if (w.age >= DUEL.vortexPull) {
        this.detonateWell(w);
        this.wells.splice(i, 1);
        continue;
      }
      pulling = true;
      const grow = Math.min(1, w.age / 0.3);
      w.spin += dt * (2 + w.age * 2.5);
      w.core.rotation.y = w.spin;
      w.core.children.forEach((o) => {
        if (o.userData.ring) {
          o.rotation.x = Math.PI / 2;
          o.rotation.z = -w.spin * 0.7;
          o.scale.setScalar((0.6 + 0.4 * grow) * (1 + Math.sin(w.age * 9) * 0.06));
        } else if (o.userData.halo) {
          o.rotation.z = -w.spin * 1.3;
          o.scale.setScalar(0.7 + grow * 0.5 + w.age * 0.12);
        } else if (o.userData.pin) o.scale.setScalar(0.3 + Math.sin(w.age * 22) * 0.06);
      });
      this.fx.attract(w.position, DUEL.vortexRadius, 26 * grow, 0.8);
      if (Math.random() < dt * 70 * grow) this.fx.inflow(w.position, 7, 3);
      // The pull on the body: strongest at the core, fading linearly to nothing at the edge.
      const offset = w.position.clone().sub(center),
        distance = offset.length();
      if (distance < DUEL.vortexRadius && distance > 0.05 && !this.outcome) {
        const falloff = 1 - distance / DUEL.vortexRadius,
          accel = DUEL.vortexStrength * grow * falloff;
        this.pull.addScaledVector(offset.divideScalar(distance), accel * dt);
        if (!this.settings.reducedEffects)
          this.cameraRig.shake = Math.max(this.cameraRig.shake, 0.004 * falloff);
      }
    }
    // The imparted velocity decays quickly, faster still once nothing is pulling any more.
    this.pull.multiplyScalar(Math.exp(-dt * (pulling ? 2.4 : 7)));
    if (this.pull.lengthSq() < 1e-4) this.pull.set(0, 0, 0);
  }
  private detonateWell(w: Well) {
    w.detonated = true;
    this.vortexDetonations++;
    w.core.removeFromParent();
    w.core.children.forEach((o) => {
      if (o instanceof THREE.Mesh && o.userData.ring) o.geometry.dispose();
      if (o instanceof THREE.Mesh && o.userData.pin) (o.material as THREE.Material).dispose();
    });
    this.fx.detonate(w.position, 9);
    this.cameraRig.shake = Math.max(this.cameraRig.shake, 0.03);
    if (this.mode !== 'menu') this.audio.detonate(this.pull);
    // A flat ring of embers: thin enough to climb or dive out of, wide enough to punish fleeing.
    const base = Math.random() * Math.PI * 2;
    for (let i = 0; i < DUEL.vortexEmbers; i++) {
      const angle = base + (i / DUEL.vortexEmbers) * Math.PI * 2,
        direction = new THREE.Vector3(
          Math.cos(angle),
          i % 2 ? 0.035 : -0.035,
          Math.sin(angle),
        ).normalize();
      this.spawn(
        w.position.clone().addScaledVector(direction, 0.9),
        direction.multiplyScalar(PROJECTILES.fire.speed * 0.85),
        'fire',
        8,
      );
    }
    const center = this.player.clone().addScaledVector(UP, 0.9),
      away = center.clone().sub(w.position),
      distance = away.length();
    if (distance < DUEL.vortexCoreRadius && !this.outcome) {
      // Caught in the core: a heavy contact that blasts the body straight back out.
      if (distance < 0.2) away.copy(this.facing).negate();
      away.normalize();
      this.vortexCoreHits++;
      if (!this.airDash.invulnerable) this.damagePlayer(24, away, 'vortex', false);
    }
    const ground = this.world.surfaceHeight(w.position.x, w.position.z);
    if (w.position.y - ground < 4.5)
      this.world.crater(new THREE.Vector3(w.position.x, ground, w.position.z), 24);
  }
  private clearWells() {
    for (const w of this.wells) w.core.removeFromParent();
    this.wells = [];
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
      // The gate has drifted along its orbit since the packet opened: fire from where it is.
      const origin = this.boss.gateOrigin(shot.packet) ?? shot.origin;
      if (!this.permittedCast('fire', origin)) continue;
      const aim = this.player
        .clone()
        .add(
          new THREE.Vector3(
            this.velocity.x * 0.12,
            0.95 + this.velocity.y * 0.12,
            this.velocity.z * 0.12,
          ),
        )
        .sub(origin)
        .normalize();
      // The salvo's fan narrows with distance, so a long-range stream still brackets the
      // target instead of scattering harmlessly around it.
      const spread = salvoSpread(shot.index),
        focus = clamp(30 / Math.max(1, origin.distanceTo(this.player)), 0.4, 1),
        right = new THREE.Vector3().crossVectors(aim, UP).normalize();
      aim.applyAxisAngle(UP, spread.yaw * focus).applyAxisAngle(right, spread.pitch * focus);
      this.spawn(origin, aim.clone().multiplyScalar(PROJECTILES.fire.speed), 'fire', 9);
      // Each bolt ignites in the gate: a short flash plate pushed just ahead of the ring.
      this.fx.glyph(origin.clone().addScaledVector(aim, 0.35), aim, '#ffc478', 0.42, 0.14);
      if (this.mode !== 'menu' && shot.index % 3 === 0) this.audio.cast(0);
    }
  }
  /**
   * Where the boss sits around the view, for the non-colour threat indicator: 0 dead ahead,
   * ±π directly behind, positive to the right — measured on the ground plane so a boss far
   * above still points the right way around the compass.
   */
  private bossBearing(): number {
    if (!this.boss.alive) return 0;
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 1e-6) return 0;
    forward.normalize();
    const right = new THREE.Vector3(forward.z, 0, -forward.x).negate();
    const toBoss = this.boss.position.clone().sub(this.camera.position);
    toBoss.y = 0;
    if (toBoss.lengthSq() < 1e-6) return 0;
    toBoss.normalize();
    return Math.atan2(toBoss.dot(right), toBoss.dot(forward));
  }
  private aimsAtBoss(forward: THREE.Vector3) {
    if (!this.boss.alive) return false;
    const delta = this.boss.position.clone().sub(this.camera.position);
    const threshold =
      this.settings.aimAssist && (this.controls.touch || this.lockedOn) ? 0.925 : 0.987;
    return (
      delta.normalize().dot(forward) > threshold &&
      this.clearSight(this.camera.position, this.boss.position)
    );
  }
  /**
   * The tell of a held Nova: a sigil in the casting hand that grows and spins faster with
   * the charge, pulses once full, and a chime the moment it gets there.
   */
  private presentCharge() {
    const show = this.novaHolding && this.spell === 2 && this.mode === 'playing';
    if (!show) {
      if (this.chargeSigil) this.chargeSigil.visible = false;
      this.novaChimed = false;
      return;
    }
    if (!this.chargeSigil) {
      this.chargeSigil = makeSigil(this.fx.sigilMap, 1, '#dcf9ff');
      this.chargeSigil.renderOrder = 6;
      this.scene.add(this.chargeSigil);
    }
    const charge = novaCharge(this.novaHold, this.energy, SPELLS[2].cost),
      first = this.cameraMode === 'first',
      right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion),
      ahead = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const hand = first
      ? this.camera.position
          .clone()
          .addScaledVector(right, 0.3)
          .addScaledVector(UP, -0.17)
          .addScaledVector(ahead, 0.75)
      : this.player
          .clone()
          .add(new THREE.Vector3(0, 1.12, 0))
          .addScaledVector(right, 0.55)
          .addScaledVector(this.facing, 0.6);
    const sigil = this.chargeSigil;
    sigil.visible = true;
    sigil.position.copy(hand);
    sigil.quaternion.copy(this.camera.quaternion);
    sigil.rotateZ(this.time * (1.5 + 7 * charge.progress));
    const pulse = charge.charged ? 1 + 0.07 * Math.sin(this.time * 18) : 1;
    sigil.scale.setScalar(((first ? 0.07 : 0.14) + (first ? 0.24 : 0.5) * charge.progress) * pulse);
    if (charge.charged && !this.novaChimed) {
      this.novaChimed = true;
      this.audio.chargeReady();
      this.fx.burst(hand, '#fff6dc', 14, 1.2, 0.3, 1);
    }
  }
  private cast() {
    const spell = SPELLS[this.spell];
    if (this.cooldowns[this.spell] > 0 || this.energy < spell.cost) {
      // Nothing to cast: instead of silence, the slot dips and the newest circle loses its
      // light for a moment. There is no buffer behind this — the press is simply spent.
      this.emit({ type: 'dry', spell: this.spell });
      if (this.spell === 1) this.prisma.dry = 0.36;
      return;
    }
    const charge = novaCharge(this.spell === 2 ? this.novaHold : 0, this.energy, spell.cost);
    this.energy -= charge.cost;
    this.cooldowns[this.spell] = spell.cooldown;
    // Prisma sounds when its beam leaves the circle, a moment after the tap.
    if (this.spell !== 1) this.audio.cast(this.spell);
    if (charge.charged) {
      this.novaChargedCasts++;
      this.audio.novaCharged();
    }
    this.camera.getWorldDirection(direction);
    const hasTarget = this.aimsAtBoss(direction);
    const distantAim = this.camera.position.clone().addScaledVector(direction, 60);
    const origin = this.player.clone().add(new THREE.Vector3(0, 1.12, 0));
    if (this.cameraMode === 'first') {
      // From the eyes the spell leaves the casting hand: low and to the right of the view.
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
      origin.addScaledVector(right, 0.34).addScaledVector(UP, -0.12);
      this.cameraRig.noteCast();
    }
    const aim = hasTarget ? this.boss.position.clone() : distantAim;
    direction.copy(aim).sub(origin).normalize();
    origin.addScaledVector(direction, 0.6);
    if (this.spell === 0) {
      this.spawn(origin, direction.clone().multiplyScalar(40), 'player', spell.damage, hasTarget);
      this.fx.glyph(origin, direction, '#ffa34f', 0.27, 0.25);
    } else if (this.spell === 1) {
      this.prisma.raiseCircle(hasTarget);
    } else {
      const end = origin.clone().addScaledVector(direction, 27),
        hit = this.trace(origin, end, true);
      if (hit) end.lerpVectors(origin, end, hit.t);
      if (hasTarget && this.boss.position.distanceTo(origin) < 34) end.copy(this.boss.position);
      // A charged Nova is the same blast grown half as large again: wider reach, a harder
      // throw, a bigger wound in a wall; its damage is unchanged.
      const grow = charge.radius;
      this.fx.impact(end, '#dff9ff', true, grow);
      this.fx.glyph(end, this.camera.position.clone().sub(end), '#dcf9ff', 1.55 * grow, 0.6);
      if (charge.charged) this.fx.burst(end, '#fff1c9', 36, 7, 0.5, 2);
      if (hit?.obstacle)
        this.world.damageWall(
          hit.obstacle,
          end,
          direction.clone().multiplyScalar(25 * grow),
          2.6 * grow,
        );
      if (
        this.boss.alive &&
        this.boss.position.distanceTo(end) < 6.5 * grow &&
        this.clearSight(end, this.boss.position)
      )
        this.damageBoss(
          spell.damage,
          direction
            .clone()
            .multiplyScalar(DUEL.novaLaunch * charge.launch)
            .addScaledVector(UP, 3 * charge.launch),
          { spell: 2, at: this.boss.position.clone(), along: direction },
        );
      this.cameraRig.shake = Math.max(this.cameraRig.shake, charge.charged ? 0.03 : 0.018);
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
      const t = segmentSphere(start, end, this.boss.position, BOSS.radius + radius);
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
    aimOffset: THREE.Vector3 | null = null,
  ) {
    this.projectileSystem.spawn(at, velocity, kind, damage, homing, aimOffset);
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
        if (p.kind === 'vortex') {
          this.anchorWell(p, p.anchor ?? p.mesh.position);
          this.removeProjectile(i, true);
          continue;
        }
        // The far barrier: whatever it was aimed at, it lands on something far away rather
        // than winking out in the sky.
        this.fx.impact(p.mesh.position, '#ffab72', p.kind === 'hammer');
        this.fx.dust(p.mesh.position, 6, 1.6);
        this.removeProjectile(i);
        continue;
      }
      if (p.kind === 'missile') {
        const aim = p.aimOffset ? previousCenter.clone().add(p.aimOffset) : previousCenter;
        p.velocity.copy(
          guideMissile(p.mesh.position, p.velocity, aim, motion, p.age, dt, p.guidance),
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
      if (p.kind === 'vortex' && p.anchor) {
        // The seed stops short of the body and opens there; a wall on the way opens it earlier.
        const wall = this.trace(p.last, p.mesh.position, false, p.radius);
        const reached = p.mesh.position.clone().sub(p.anchor).dot(p.velocity) >= 0;
        if (wall || reached) {
          const at = wall
            ? p.last
                .clone()
                .lerp(p.mesh.position, wall.t)
                .addScaledVector(p.velocity.clone().normalize(), -1.2)
            : p.anchor.clone();
          this.anchorWell(p, at);
          this.removeProjectile(i, true);
          continue;
        }
        p.ribbon.push(p.mesh.position, this.camera.position);
        if (Math.random() < dt * 30) this.fx.burst(p.mesh.position, '#ff7a44', 1, 0.5, 0.3, 0);
        continue;
      }
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
        // 1. Contact. A standing patch stops the shot where its head meets the surface: the
        //    body is handed over to crush and splash there, nothing vanishes short of it.
        if (this.aegis.enabled) {
          const standing = this.patches.sweep(
            p.last,
            p.mesh.position,
            p.velocity,
            p.radius,
            p.kind,
          );
          if (standing && (!worldHit || standing.t <= worldHit.t)) {
            p.mesh.position.copy(standing.at);
            this.absorbOnPatch(standing.patch, standing.at, p);
            this.removeProjectile(i, true);
            continue;
          }
        }
        // 2. Prediction. Raise a patch where the shot will cross the shell, and let the shot
        //    fly on to it. A claim on a patch that no longer lies on the path is dropped so a
        //    weaving body gets a fresh piece fitted next to the first one.
        if (p.claim !== null) {
          const claimed = this.patches.find(p.claim),
            ahead = p.mesh.position.clone().addScaledVector(p.velocity, horizon);
          if (!claimed || !this.patches.sweep(p.mesh.position, ahead, p.velocity, p.radius, p.kind))
            p.claim = null;
        }
        const guard =
          this.aegis.enabled && p.claim === null
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
          let intercept = guard.point.clone(),
            offset = guard.offset.clone();
          if (!this.clearSight(center, intercept)) {
            // Close to a wall the patch is raised nearer the body instead of inside the wall.
            offset = guard.offset.clone().setLength(DUEL.shieldNear);
            intercept = center.clone().add(offset);
          }
          const open = this.patches.gapAt(offset);
          if (open && !p.leaked) {
            // A hole left by a shattered patch stays open: this shot gets through.
            p.leaked = true;
            this.patches.noteLeak();
          }
          if (
            (!cover || cover.t * horizon > guard.time + 0.001) &&
            this.clearSight(center, intercept) &&
            !open
          ) {
            const scale = shieldScale(p.radius),
              radius = patchRadius(scale);
            // A footprint already covering this lane takes the shot; otherwise a new piece is
            // fitted onto the lattice beside its neighbours instead of on top of them.
            const existing = this.patches.overlapping(intercept, guard.normal, radius);
            if (existing) p.claim = existing.serial;
            else p.claim = this.raisePatch(intercept, guard.normal, scale, p.radius, center);
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
          if (this.aegis.enabled && covered && !this.patches.gapAt(relativeStart)) {
            // The shell's last line: a piece snaps up right at the body and takes the shot.
            const direction = p.velocity.clone().normalize().negate(),
              at = center.clone().addScaledVector(direction, DUEL.shieldNear),
              scale = shieldScale(p.radius),
              radius = patchRadius(scale);
            const patch =
              this.patches.overlapping(at, direction, radius) ??
              this.patches.find(this.raisePatch(at, direction, scale, p.radius, center))!;
            p.mesh.position.copy(at).addScaledVector(direction, p.radius * 0.5);
            this.absorbOnPatch(patch, at, p);
            this.removeProjectile(i, true);
            continue;
          }
          if (this.airDash.invulnerable) {
            // The dash phases through: the shot flies on, and the near miss is rewarded.
            if (!p.dodged) {
              p.dodged = true;
              this.perfectDodge(center);
            }
          } else {
            this.damagePlayer(p.damage, p.velocity, p.kind, !covered);
            this.fx.burst(p.mesh.position, '#ff9a62', 18, 3.5, 0.36);
            this.removeProjectile(i);
            if (this.hitPause.remaining > 0) break;
            continue;
          }
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
          if (p.kind === 'hammer') this.hammerSplash(p.mesh.position, !!worldHit.ground);
        }
        if (worldHit.ground && (p.kind === 'fire' || p.kind === 'missile'))
          this.fx.scorch(p.mesh.position, p.kind);
        this.removeProjectile(i);
        continue;
      }
      p.ribbon.push(p.mesh.position, this.camera.position);
      if (Math.random() < dt * 18)
        this.fx.burst(p.mesh.position, '#ffc086', 1, 0.35, p.kind === 'hammer' ? 0.5 : 0.22, 0);
    }
  }
  /** `keepMesh` hands the body over (to a shield crush or a vortex well) instead of dropping it. */
  private removeProjectile(index: number, keepMesh = false) {
    this.projectileSystem.remove(index, keepMesh);
  }
  /** A new Aegis piece fitted onto the shell for a shot of `radius`; returns its serial. */
  private raisePatch(
    desired: THREE.Vector3,
    normal: THREE.Vector3,
    scale: number,
    radius: number,
    center: THREE.Vector3,
  ): number {
    const life = scale > 2 ? DUEL.shieldPatchLifeLarge : DUEL.shieldPatchLife,
      placement = this.patches.place(desired, normal, scale, this.fx.nextShieldSerial),
      echo = this.fx.block(placement.position, placement.quaternion, scale, life);
    this.lastBlock = { scale, radius, direction: normal.toArray() };
    this.patches.add({
      position: placement.position.toArray(),
      offset: placement.position.clone().sub(center).toArray(),
      normal: normal.toArray(),
      radius: patchRadius(scale),
      life,
      serial: echo.serial,
      hits: 0,
      scale,
      cluster: placement.cluster,
      anchor: placement.anchor,
    });
    if (this.mode !== 'menu') this.audio.raise();
    return echo.serial;
  }
  private clearProjectiles() {
    this.projectileSystem.clear();
  }
  /**
   * A shot connects with a standing patch. The projectile's body is left on the surface to
   * crush and the struck cell flashes, the patch (from the second hit) cracks like glass, until
   * the hit budget is spent and it shatters — leaving that lane open for a moment.
   */
  private absorbOnPatch(patch: ShieldPatch, at: THREE.Vector3, p: Projectile) {
    const scale = shieldScale(p.radius),
      normal = new THREE.Vector3().fromArray(patch.normal),
      result = this.patches.absorb(patch, scale);
    this.aegis.intercept();
    this.lastBlock = { scale, radius: p.radius, direction: normal.toArray() };
    const shown = this.fx.shieldImpact(patch.serial, at, normal, p.kind, scale, patch.hits, p.mesh);
    if (!shown) this.fx.burst(at, '#9cf6ff', 10, 2.6, 0.2 * Math.sqrt(scale), 0.5);
    if (result === 'shattered') {
      this.fx.shatterEcho(patch.serial, at, scale);
      this.cameraRig.shake = Math.max(this.cameraRig.shake, 0.014);
      if (this.mode !== 'menu') this.audio.shatter();
    } else if (this.mode !== 'menu') this.audio.block(p.kind, p.last);
    this.emit({ type: 'block', direction: { x: normal.x, y: normal.y, z: normal.z } });
  }
  private contactPause(
    actor: 'player' | 'boss',
    incoming: THREE.Vector3,
    duration: number,
    strength: number,
    slow = 0,
  ) {
    const at =
      actor === 'player'
        ? this.player.clone().add(new THREE.Vector3(0, 0.9, 0))
        : this.boss.position.clone();
    at.addScaledVector(incoming.clone().normalize(), actor === 'player' ? -0.65 : -1.2);
    this.fx.contact(at, incoming, strength > 55 ? 1.4 : 0.8);
    this.hitPause.request(duration, slow);
    // Heavy contact: a short zoom punch released through the slow-motion tail, and the
    // two-tone impact frame cut around the point of contact.
    if (slow > 0 && !this.settings.reducedEffects) this.cameraRig.punch = 1;
    if (slow > 0) this.impactCut(at, incoming);
    this.contacts++;
    this.emit({ type: 'contact', actor });
  }
  private destroyBoss() {
    this.boss.deathDelay = -1;
    this.boss.group.visible = this.boss.ribbon.mesh.visible = false;
    this.fx.impact(this.boss.position, '#ffe0a1', true);
    this.fx.debris(this.boss.position, Math.round(35 * BOSS.scale), 8 * BOSS.scale, 3 * BOSS.scale);
    this.fx.dust(this.boss.position, Math.round(15 * BOSS.scale), 2.5 * BOSS.scale);
  }
  /**
   * FALL's side of the fire control. The press pays up front and locks the column onto the
   * boss; the slam lands a breath later; from there the spell lasts exactly as long as the
   * button does (or the energy). The boss cannot break it — it ends by the caster's hand.
   */
  private updateFallCast(dt: number, may: boolean) {
    if (this.fallPhase === 'idle') {
      if (!this.controls.shotRequested) return;
      this.controls.shotRequested = false;
      if (!may || !this.boss.alive) return;
      if (this.cooldowns[3] > 0 || this.energy < FALL.cost) {
        this.emit({ type: 'dry', spell: 3 });
        return;
      }
      this.energy -= FALL.cost;
      this.fallPhase = 'build';
      this.fallTime = 0;
      this.fallSystem.begin(this.boss.position);
      this.audio.fallCharge(this.boss.position);
      return;
    }
    if (this.fallPhase === 'build') {
      this.fallTime += dt;
      if (!this.controls.shooting) {
        // Let go before the weight landed: half the price back, and no mark left behind.
        this.energy = Math.min(100, this.energy + FALL.cost / 2);
        this.cooldowns[3] = 2;
        this.endFallSilent();
      } else if (this.fallTime >= FALL.build) {
        const b = this.boss,
          floor = groundHeight(
            b.position.x,
            b.position.z,
            b.position.y - BOSS.extent,
            this.world.obstacles,
            this.world.surfaceHeight(b.position.x, b.position.z),
          );
        this.fallHeight = Math.max(0, b.position.y - (floor + BOSS.extent));
        this.fallPhase = 'slam';
      }
      return;
    }
    if (this.fallPhase === 'slam') return; // the descent is driven inside updateBoss
    // press: the boss is down and stays down.
    this.fallHeld += dt;
    this.energy -= fallDrainRate(this.fallHeld) * dt;
    this.fallTick -= dt;
    if (this.fallTick <= 0) {
      this.fallTick = FALL.crushInterval;
      if (this.boss.alive) {
        this.damageBoss(FALL.crushDamage, new THREE.Vector3(0, -1, 0), {
          spell: 3,
          at: this.boss.position.clone(),
          along: new THREE.Vector3(0, -1, 0),
        });
        this.fallSystem.crushPulse();
        this.audio.fallCrush(fallPressure(this.fallHeld), this.boss.position);
        if (!this.boss.alive) {
          this.endFallSilent();
          return;
        }
      }
    }
    if (!this.controls.shooting) this.releaseFall(false);
    else if (this.energy <= 0) {
      this.energy = 0;
      this.releaseFall(true);
    }
  }

  /** The slam reaching the ground: damage by height, a crater, and the press begins. */
  private fallImpact() {
    this.fallPhase = 'press';
    this.fallHeld = 0;
    this.fallTick = FALL.crushInterval;
    const at = this.boss.position.clone(),
      feet = new THREE.Vector3(at.x, this.world.surfaceHeight(at.x, at.z), at.z);
    this.damageBoss(fallSlamDamage(this.fallHeight), new THREE.Vector3(0, -2, 0), {
      spell: 3,
      at: at.clone(),
      along: new THREE.Vector3(0, -1, 0),
    });
    this.world.crater(feet, 30);
    this.fx.dust(feet, 30, 3.2);
    this.fx.impact(feet.clone().add(new THREE.Vector3(0, 0.4, 0)), '#b78cff', true);
    this.fx.shock(feet.clone().add(new THREE.Vector3(0, 0.15, 0)), '#a678ff', 6);
    this.fallSystem.crushPulse();
    this.audio.fallSlam(at);
    this.cameraRig.shake = Math.max(this.cameraRig.shake, 0.3);
    if (!this.boss.alive) this.endFallSilent();
  }

  /** Letting go (or running dry): the stored pressure closes the spell in one crush. */
  private releaseFall(forced: boolean) {
    if (this.boss.alive)
      this.damageBoss(
        fallReleaseDamage(fallPressure(this.fallHeld), forced),
        new THREE.Vector3(0, -1, 0),
        {
          spell: 3,
          at: this.boss.position.clone(),
          along: new THREE.Vector3(0, -1, 0),
        },
      );
    this.audio.fallRelease(forced, this.boss.position);
    this.endFallSilent();
    this.cooldowns[3] = SPELLS[3].cooldown;
    this.fallLinger = FALL.lingerTime;
  }

  /** The column collapses without a closing crush (pause, slot change, a kill mid-hold). */
  private endFallSilent() {
    if (this.fallSystem) this.fallSystem.end();
    this.fallPhase = 'idle';
    this.fallHeld = this.fallTick = this.fallTime = 0;
  }

  /** The charge of whatever the fire control is holding: a Prisma lance or a Nova. */
  private heldSpell() {
    if (this.spell === 3) {
      if (this.fallPhase === 'build')
        return { progress: clamp(this.fallTime / FALL.build, 0, 1) * 0.25, charged: false };
      if (this.fallPhase === 'slam' || this.fallPhase === 'press') {
        const pressure = fallPressure(this.fallHeld);
        return { progress: pressure, charged: pressure >= 1 };
      }
    }
    if (this.spell === 1 && this.prisma.big) {
      const hold = prismaHold(this.prismaHoldTime, this.energy, this.prismaChargeStart);
      return { progress: hold.progress, charged: hold.charged };
    }
    if (this.spell === 2 && this.novaHolding) {
      const charge = novaCharge(this.novaHold, this.energy, SPELLS[2].cost);
      return { progress: charge.progress, charged: charge.charged };
    }
    return { progress: 0, charged: false };
  }
  /** How the body is travelling right now, for the frame-rate dressing of the screen. */
  get travel() {
    return this.travelCache.copy(this.velocity).add(this.impulse).add(this.airDash.velocity);
  }
  /** The view's own right and up in the world: travel across them is what a turn looks like. */
  get viewRight() {
    return this.viewRightCache.set(1, 0, 0).applyQuaternion(this.camera.quaternion);
  }
  get viewUp() {
    return this.viewUpCache.set(0, 1, 0).applyQuaternion(this.camera.quaternion);
  }
  /** Raise the held circle; the charge is timed from this moment by the fire control. */
  private raisePrismaBig() {
    this.prisma.raiseBig();
    this.prismaChargeStart = this.prismaHoldTime;
  }
  /** Released before the charge is full: the large circle breaks up, nothing is spent. */
  private cancelPrismaBig() {
    this.prisma.cancelBig();
  }
  private castPrismaBig() {
    this.prisma.castBig();
  }
  private clearPrisma() {
    this.prisma.clear();
    this.prismaHoldTime = this.prismaChargeStart = 0;
  }
  /**
   * Where a hit lands on screen, for the floating damage number: position in 0..1 (y down)
   * and the direction the hit travels in, projected. Null when the point is behind the camera.
   */
  private hitOnScreen(at: THREE.Vector3, along: THREE.Vector3) {
    this.camera.updateMatrixWorld();
    const p = at.clone().project(this.camera);
    if (p.z >= 1 || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
    const q = at.clone().addScaledVector(along.clone().normalize(), 3).project(this.camera);
    let dx = q.x - p.x,
      dy = -(q.y - p.y);
    const len = Math.hypot(dx, dy);
    if (len > 1e-4) {
      dx /= len;
      dy /= len;
    } else {
      dx = 0;
      dy = -1;
    }
    return { x: (p.x + 1) / 2, y: (1 - p.y) / 2, dx, dy };
  }
  private damageBoss(
    amount: number,
    impulse: THREE.Vector3,
    source?: { spell: SpellId; at: THREE.Vector3; along: THREE.Vector3 },
  ) {
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
      this.contactPause('boss', impulse, DUEL.heavyFreeze, impulse.length(), DUEL.heavySlow);
    } else this.boss.impulse.add(impulse).clampLength(0, 9);
    const screen = source ? this.hitOnScreen(source.at, source.along) : null;
    this.emit({
      type: 'hit',
      kill: !this.boss.alive,
      damage: actual,
      number: source && screen ? { spell: source.spell, ...screen } : undefined,
    });
    this.audio.hit(!this.boss.alive, this.boss.position);
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
  /**
   * A shot that would have landed during the dash's phasing window: a beat of slow motion to
   * savour it, a ring of light, a chime, a shot of energy and the next dash almost at once.
   */
  private perfectDodge(center: THREE.Vector3) {
    this.perfectDodges++;
    this.hitPause.request(0, 0.5);
    this.energy = Math.min(100, this.energy + 20);
    this.dashCooldown = Math.min(this.dashCooldown, 0.4);
    this.fx.shock(center, '#bdf6ff', 3.4);
    this.fx.burst(center, '#dffbff', 22, 4, 0.32, 1.3);
    if (!this.settings.reducedEffects) this.cameraRig.punch = 0.7;
    this.audio.perfect();
    this.emit({ type: 'dodge' });
  }
  /**
   * The solar sphere bursting against the world: a shock ring and embers, and anyone standing
   * within `HAMMER_SPLASH` metres is launched away from the blast — weaker at the rim, never
   * as hard as the direct hit. This is what lets the boss punish a player on foot.
   */
  private hammerSplash(at: THREE.Vector3, ground: boolean) {
    const up = ground ? UP : new THREE.Vector3(0, 0.6, 0);
    this.fx.shock(at.clone().addScaledVector(UP, 0.12), '#ffb46e', 7.5);
    this.fx.burst(at, '#ff9c4a', 36, 8, 0.45, 2.2);
    const center = this.player.clone().addScaledVector(UP, 0.9),
      away = center.clone().sub(at),
      distance = away.length();
    if (distance > HAMMER_SPLASH || this.airDash.invulnerable) return;
    const falloff = 1 - distance / HAMMER_SPLASH,
      direction = away.divideScalar(Math.max(0.01, distance)).add(up).normalize();
    this.splashHits++;
    this.damagePlayer(
      Math.round(29 * (0.3 + 0.4 * falloff)),
      direction,
      'hammer',
      false,
      0.55 + 0.35 * falloff,
    );
  }
  private damagePlayer(
    amount: number,
    incoming: THREE.Vector3,
    kind: ProjectileKind,
    blind: boolean,
    power = 1,
  ) {
    if (this.outcome || this.damageTimer < 0.14 || this.testInvulnerable) return;
    this.damageTimer = 0;
    this.lastDamageBlind = blind;
    if (this.mode === 'playing' && !this.testInvulnerable)
      this.health = Math.max(0, this.health - amount);
    const tuning = PROJECTILES[kind],
      vector = incoming
        .clone()
        .normalize()
        .multiplyScalar(tuning.launch * power);
    if (kind === 'hammer') vector.y = vector.y < -10 ? vector.y : clamp(vector.y + 4, -10, 18);
    else vector.y = Math.max(kind === 'missile' ? 5 : 2.5, vector.y * 0.6 + 3);
    vector
      .addScaledVector(this.velocity, 0.25)
      .addScaledVector(this.impulse, 0.2)
      .clampLength(0, 175);
    vector.y += this.verticalVelocity * 0.2;
    this.verticalVelocity = 0;
    this.pendingPlayerImpulse = vector;
    this.playerRelease.cancel();
    this.flightAcceleration.set(0, 0, 0);
    this.airDash.reset();
    if (kind === 'hammer') {
      this.playerTumble.kick(this.avatar.quaternion, vector);
      this.ragdoll.spawn(
        this.avatar.position,
        this.avatar.quaternion,
        vector,
        this.playerTumble.angularVelocity,
      );
    }
    this.velocity.set(0, 0, 0);
    this.impulse.set(0, 0, 0);
    this.dashTime = this.flightBoost = 0;
    this.knockTime = tuning.stagger;
    this.contactPause('player', incoming, tuning.pause * power, tuning.launch * power, tuning.slow);
    this.cameraRig.shake = 0.018;
    this.kickCamera(incoming, 0.045 * power);
    if (this.mode !== 'menu') this.audio.damage(this.player);
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
    if (this.mode !== 'menu') this.audio.crash(strength, at, surface);
    this.cameraRig.shake = this.settings.reducedEffects ? 0 : Math.min(0.1, strength / 500);
    this.hitPause.request(0.035);
    // Impact frames are caused by heavy contact and by world collisions, never by ordinary
    // spell casts; the caption follows the collision.
    if (this.impactCut(at, velocity)) this.emit({ type: 'impact', surface, actor, strength });
  }
  /**
   * The graphic cut, rate-limited so a hit and the crash that follows do not strobe. The
   * burst leans the way the body is thrown (`along`: the incoming hit or the crash velocity).
   */
  private impactCut(at: THREE.Vector3, along?: THREE.Vector3) {
    if (this.flashTimer > 0 || this.mode === 'menu') return false;
    this.flashTimer = DUEL.impactInterval;
    this.impactFrame.trigger(at, this.settings.reducedEffects, along);
    return true;
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
      /**
       * Feed the resolution ladder a frame time, as one averaging window would. `reset` puts it
       * back on the top rung first, so a test can watch the ladder from a known place even when
       * the machine running the test is slow enough to have moved it already.
       */
      frameBudget: (frameMs: number, windows = 1, reset = false) => {
        if (reset) {
          this.adaptive = adaptiveStart();
          this.resize(true);
        }
        for (let i = 0; i < windows; i++) this.applyFrameBudget(frameMs);
      },
      step: (seconds: number) => {
        for (let left = Math.min(30, Math.max(0, seconds)); left > 1e-8; left -= 1 / 60)
          this.simulate(Math.min(left, 1 / 60));
        this.renderNeeded = true;
      },
      face: orient,
      observe: (at: number[] | null, look: number[] = [0, 0, 0]) => {
        this.testCamera = at ? { at, look } : null;
        this.renderNeeded = true;
      },
      castBoss: (attack: AttackId, index = 0) => this.bossAttack(attack, index),
      scene: () => this.scene,
      place: (player: number[], boss: number[]) => {
        this.player.fromArray(player);
        this.previousPlayer.copy(this.player);
        this.boss.position.fromArray(boss);
        this.boss.lockedTarget.copy(this.player).addScaledVector(UP, 0.9);
        this.sightClock = 0;
        // A teleport must not leave a trail ribbon stretched from the old position.
        this.playerTrail.reset(this.player.clone().add(new THREE.Vector3(0, 0.8, 0)));
        this.boss.ribbon.reset(this.boss.position);
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
        const scenario = SCENARIOS[name] ?? {};
        this.start(false);
        this.prisma.seedRandom(seededRandom(4242));
        this.novaChargedCasts = 0;
        this.testIdleBoss = scenario.idleBoss ?? true;
        this.testInvulnerable = scenario.invulnerable ?? false;
        if (scenario.aegis === false) this.aegis.setEnabled(false);
        if (scenario.player) this.player.fromArray(scenario.player);
        if (scenario.boss) this.boss.position.fromArray(scenario.boss);
        if (scenario.flight === false) {
          this.setFlight(false);
          this.groundJumps = 0;
        }
        if (scenario.spell !== undefined) {
          const at = this.settings.loadout.indexOf(scenario.spell as SpellId);
          if (at >= 0) this.slot = at;
        }
        if (scenario.lockOn) this.lockedOn = true;
        if (scenario.bossHealth !== undefined) this.boss.health = scenario.bossHealth;
        if (scenario.health !== undefined) this.health = scenario.health;
        this.previousPlayer.copy(this.player);
        this.boss.lockedTarget.copy(this.player).addScaledVector(UP, 0.9);
        this.aimAtBoss(1);
        this.facingQuaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
        this.facing.set(0, 0, -1).applyQuaternion(this.facingQuaternion);
        if (scenario.orient) orient(...scenario.orient);
        const chest = this.player.clone().addScaledVector(UP, 0.9);
        for (const shot of scenario.shots ?? [])
          this.spawn(
            (shot.relative ? chest.clone() : new THREE.Vector3()).add(
              new THREE.Vector3().fromArray(shot.at),
            ),
            new THREE.Vector3().fromArray(shot.velocity),
            shot.kind,
            shot.damage,
          );
        for (const [side, kind] of scenario.incoming ?? []) incoming(side, kind);
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
    this.impactFrame.dispose();
    this.renderer.dispose();
  }
}
