import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Controls } from './Controls';
import { AudioEngine } from './Audio';
import { Effects, makeHexField, Ribbon } from './Effects';
import { World, contactShadowTexture } from './World';
import {
  clamp,
  damp,
  groundHeight,
  resolveCircle,
  segmentBox,
  segmentSphere,
  waveConfig,
} from './math';
import {
  SPELLS,
  type GameEvent,
  type Mode,
  type Settings,
  type Snapshot,
  type SpellId,
} from './types';

interface Enemy {
  group: THREE.Group;
  core: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  bar: THREE.Mesh;
  barGroup: THREE.Group;
  ribbon: Ribbon;
  center: THREE.Vector3;
  position: THREE.Vector3;
  health: number;
  maxHealth: number;
  phase: number;
  attack: number;
  flash: number;
  alive: boolean;
}
interface Projectile {
  mesh: THREE.Mesh;
  ribbon: Ribbon;
  velocity: THREE.Vector3;
  life: number;
  friendly: boolean;
  harmless: boolean;
  damage: number;
  last: THREE.Vector3;
  target: Enemy | null;
}

const direction = new THREE.Vector3();
const right = new THREE.Vector3();
const temp = new THREE.Vector3();
const temp2 = new THREE.Vector3();
const DOWN = new THREE.Vector3(0, -1, 0);
const START = new THREE.Vector3(0, 0, 18);

export class Game {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(62, 1, 0.065, 340);
  readonly controls: Controls;
  readonly audio: AudioEngine;
  private world: World;
  private fx: Effects;
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private settings: Settings;
  private settingsApplied = false;
  private targetShadows: THREE.InstancedMesh;
  private shadowStamp = new THREE.Object3D();
  private mode: Mode = 'menu';
  private returnMode: Mode = 'playing';
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private player = START.clone();
  private velocity = new THREE.Vector3();
  private dashDirection = new THREE.Vector3();
  private yaw = 0;
  private pitch = 0.025;
  private roll = 0;
  private health = 100;
  private energy = 100;
  private dashCooldown = 0;
  private dashTime = 0;
  private shielding = false;
  private shield: THREE.Group;
  private jumps = 0;
  private spell: SpellId = 0;
  private cooldowns = [0, 0, 0];
  private score = 0;
  private kills = 0;
  private wave = 1;
  private best = 0;
  private elapsed = 0;
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
  private damageTimer = 0;
  private flashTimer = 0;
  private nextWave = -1;
  private previewTimer = 0.4;
  private previewStep = 0;
  private aiming = false;
  private lockToastShown = false;
  private disposed = false;
  private projectileGeometry = new THREE.IcosahedronGeometry(0.16, 1);
  private projectileMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#ffae63').multiplyScalar(4),
  });
  private enemyProjectileMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#ff622d').multiplyScalar(4),
  });
  private readonly resizeListener = () => this.resize();
  private readonly visibilityListener = () => {
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
    this.renderer.shadowMap.enabled = true;
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
        this.emit({ type: 'toast', text: 'Seret pada arena untuk melihat. WASD untuk bergerak.' });
      },
    );
    this.fx = new Effects(this.scene);
    this.world = new World(this.scene, this.fx);
    this.targetShadows = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: contactShadowTexture(),
        color: '#23313a',
        transparent: true,
        opacity: 0.46,
        depthWrite: false,
      }),
      7,
    );
    this.targetShadows.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.targetShadows.frustumCulled = false;
    this.scene.add(this.targetShadows);
    this.shield = makeHexField(0.26, 2);
    this.shield.visible = false;
    this.scene.add(this.shield);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(800, 600), 0.55, 0.45, 1.1);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    try {
      const n = Number(localStorage.getItem('hea-best'));
      this.best = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    } catch {
      /* Storage is optional. */
    }
    this.applySettings(settings);
    this.spawnWave();
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
      shield: this.shielding,
      dash: clamp(1 - this.dashCooldown / 1.65, 0, 1),
      spell: this.spell,
      cooldowns: this.cooldowns.map((v, i) => clamp(v / SPELLS[i].cooldown, 0, 1)),
      wave: this.wave,
      score: this.score,
      best: this.best,
      kills: this.kills,
      enemies: this.enemies.filter((e) => e.alive).length,
      fps: this.fps,
      elapsed: this.elapsed,
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
      camera: { yaw: this.yaw, pitch: this.pitch, rotation: this.camera.rotation.toArray() },
    };
  }

  start() {
    this.audio.unlock();
    this.audio.click();
    this.clearProjectiles();
    this.fx.clear();
    this.player.copy(START);
    this.velocity.set(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0.025;
    this.roll = 0;
    this.health = this.energy = 100;
    this.dashCooldown = this.dashTime = 0;
    this.cooldowns = [0, 0, 0];
    this.jumps = 0;
    this.score = this.kills = this.elapsed = 0;
    this.wave = 1;
    this.nextWave = -1;
    this.damageTimer = this.shake = 0;
    this.spell = 0;
    this.shielding = false;
    this.shield.visible = false;
    this.spawnWave();
    this.updateEnemies(0, false);
    // Enter facing a real target, rather than asking a first-time mobile player to find one.
    temp.copy(this.enemies[0].position).sub(this.player);
    temp.y -= 1.72;
    this.yaw = Math.atan2(-temp.x, -temp.z);
    this.pitch = Math.atan2(temp.y, Math.hypot(temp.x, temp.z));
    this.changeMode('playing');
    this.updateCamera(0.016);
    this.controls.requestLock();
    this.audio.wave();
    this.emit({ type: 'wave', wave: 1 });
  }
  demo() {
    this.audio.unlock();
    this.clearProjectiles();
    this.fx.clear();
    this.wave = 1;
    this.spawnWave();
    this.previewTimer = 0.2;
    this.previewStep = 0;
    this.changeMode('demo');
  }
  menu() {
    this.clearProjectiles();
    this.fx.clear();
    this.wave = 1;
    this.spawnWave();
    this.shielding = false;
    this.shield.visible = false;
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
    if (this.returnMode === 'playing') this.controls.requestLock();
  }
  selectSpell(slot: number) {
    if (slot >= 0 && slot <= 2) {
      this.spell = slot as SpellId;
      this.audio.click();
    }
  }
  applySettings(settings: Settings) {
    const graphicsChanged = !this.settingsApplied || this.settings.quality !== settings.quality;
    this.settings = { ...settings };
    this.audio.apply(settings);
    if (!graphicsChanged) return;
    this.settingsApplied = true;
    this.lowQuality =
      settings.quality === 'low' || (settings.quality === 'auto' && this.controls.touch);
    this.useBloom = !this.lowQuality;
    this.renderer.shadowMap.enabled = !this.lowQuality;
    this.world.setQuality(this.lowQuality);
    this.fx.quality(this.lowQuality);
    this.slowFrames = 0;
    this.resize();
  }
  private changeMode(mode: Mode) {
    this.mode = mode;
    this.modeTime = 0;
    this.renderNeeded = true;
    this.controls.setEnabled(mode === 'playing');
    this.emit({ type: 'mode', mode });
  }
  private resize() {
    const width = window.innerWidth,
      height = window.innerHeight;
    const ratio = Math.min(
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
    const dt = clamp(rawDt, 0, 0.04);
    if (document.hidden) return;
    if ((this.mode === 'paused' || this.mode === 'gameover') && !this.renderNeeded) return;
    this.renderTime += rawDt;
    this.frames++;
    this.frameTime += rawDt;
    if (this.frameTime >= 0.75) {
      this.fps = Math.round(this.frames / this.frameTime);
      this.frameTime = this.frames = 0;
      if (this.settings.quality === 'auto' && !this.lowQuality && this.renderTime > 4) {
        this.slowFrames = this.fps < 28 ? this.slowFrames + 1 : 0;
        if (this.slowFrames >= 3) {
          this.lowQuality = true;
          this.useBloom = false;
          this.renderer.shadowMap.enabled = false;
          this.world.setQuality(true);
          this.fx.quality(true);
          this.resize();
        }
      }
    }
    if (this.mode !== 'paused' && this.mode !== 'gameover' && !document.hidden) {
      this.time += dt;
      this.modeTime += dt;
      this.flashTimer = Math.max(0, this.flashTimer - dt);
      if (this.mode === 'playing') {
        this.elapsed += dt;
        this.updatePlayer(dt);
        this.updateEnemies(dt, false);
        this.updateProjectiles(dt);
        this.updateWaves(dt);
      } else {
        this.showcaseCamera(dt);
        this.updateEnemies(dt, true);
        this.updateProjectiles(dt);
        this.updateShowcase(dt);
      }
      this.updateTargetShadows();
      this.world.update(this.time, dt, this.mode !== 'playing');
      this.fx.update(dt);
    }
    this.renderer.info.reset();
    if (this.useBloom) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
    this.renderNeeded = false;
  }
  private updatePlayer(dt: number) {
    this.damageTimer += dt;
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.dashTime = Math.max(0, this.dashTime - dt);
    this.cooldowns = this.cooldowns.map((c) => Math.max(0, c - dt));
    this.shielding = this.controls.blocking && this.energy > 1;
    this.energy = clamp(this.energy + dt * (this.shielding ? -13 : 12), 0, 100);
    if (this.damageTimer > 9) this.health = Math.min(100, this.health + dt * 3);
    const look = this.controls.look(),
      sensitivity = this.settings.sensitivity * 0.0021;
    this.yaw -= look.x * sensitivity;
    this.pitch = clamp(this.pitch - look.y * sensitivity, -1.37, 1.37);
    const move = this.controls.movement();
    const sin = Math.sin(this.yaw),
      cos = Math.cos(this.yaw);
    const wishX = move.x * cos - move.z * sin,
      wishZ = -move.x * sin - move.z * cos;
    const floor = groundHeight(this.player.x, this.player.z, this.player.y, this.world.obstacles);
    const grounded = this.player.y <= floor + 0.04 && this.velocity.y <= 0;
    if (grounded) {
      this.player.y = floor;
      this.velocity.y = 0;
      this.jumps = 0;
    }
    if (this.controls.jumpRequested) {
      this.controls.jumpRequested = false;
      if (this.jumps < 2) {
        this.velocity.y = this.jumps === 0 ? 9.4 : 8.2;
        this.jumps++;
        if (this.jumps === 2) {
          this.fx.burst(this.player, '#ceeaff', 12, 2, 0.22, 1);
          this.audio.dash();
        }
      }
    }
    if (this.controls.dashRequested) {
      this.controls.dashRequested = false;
      if (this.dashCooldown === 0) {
        this.dashTime = 0.2;
        this.dashCooldown = 1.65;
        this.dashDirection.set(wishX, 0, wishZ);
        if (this.dashDirection.lengthSq() < 0.01) this.dashDirection.set(-sin, 0, -cos);
        this.dashDirection.normalize();
        this.audio.dash();
        this.fx.burst(
          temp.copy(this.player).add(new THREE.Vector3(0, 0.6, 0)),
          '#ecf7ff',
          20,
          3,
          0.26,
          2,
        );
      }
    }
    const speed = this.shielding ? 4.3 : 7.2;
    this.velocity.x = damp(this.velocity.x, wishX * speed, grounded ? 13 : 6, dt);
    this.velocity.z = damp(this.velocity.z, wishZ * speed, grounded ? 13 : 6, dt);
    let vx = this.velocity.x,
      vz = this.velocity.z;
    if (this.dashTime > 0) {
      vx = this.dashDirection.x * 30;
      vz = this.dashDirection.z * 30;
    }
    const steps = Math.max(1, Math.ceil((Math.hypot(vx, vz) * dt) / 0.25));
    for (let i = 0; i < steps; i++) {
      const result = resolveCircle(
        this.player.x + (vx * dt) / steps,
        this.player.z + (vz * dt) / steps,
        this.player.y,
        0.38,
        this.world.obstacles,
      );
      this.player.x = result.x;
      this.player.z = result.z;
    }
    this.velocity.y -= 24 * dt;
    const nextY = this.player.y + this.velocity.y * dt;
    const nextFloor = groundHeight(
      this.player.x,
      this.player.z,
      this.player.y,
      this.world.obstacles,
    );
    if (this.velocity.y <= 0 && nextY <= nextFloor) {
      this.player.y = nextFloor;
      this.velocity.y = 0;
      this.jumps = 0;
    } else this.player.y = nextY;
    this.roll = damp(
      this.roll,
      this.settings.reducedEffects ? 0 : -move.x * (this.dashTime > 0 ? 0.06 : 0.025),
      9,
      dt,
    );
    this.updateCamera(dt);
    this.camera.getWorldDirection(direction);
    this.aiming =
      this.findEnemyOnRay(this.camera.position, direction, this.controls.touch ? 0.93 : 0.993) !==
      null;
    const shoot = this.controls.shooting || this.controls.shotRequested;
    this.controls.shotRequested = false;
    if (shoot) this.cast();
    this.shield.visible = this.shielding;
    if (this.shielding) {
      this.shield.position.copy(this.camera.position).addScaledVector(direction, 1.7);
      this.shield.quaternion.copy(this.camera.quaternion);
      this.shield.rotation.z += Math.sin(this.time * 2) * 0.02;
    }
  }
  private updateCamera(dt: number) {
    const movement = Math.min(1, Math.hypot(this.velocity.x, this.velocity.z) / 7);
    const bob =
      this.settings.reducedEffects || this.player.y > 0.15
        ? 0
        : Math.sin(this.time * 12) * 0.025 * movement;
    this.camera.position.copy(this.player);
    this.camera.position.y += 1.72 + bob;
    this.shake = damp(this.shake, 0, 11, dt);
    const shake = this.settings.reducedEffects ? 0 : this.shake;
    this.camera.rotation.set(
      this.pitch + (Math.random() - 0.5) * shake,
      this.yaw + (Math.random() - 0.5) * shake,
      this.roll,
    );
    const targetFov = this.settings.reducedEffects
      ? 74
      : this.dashTime > 0
        ? 92
        : 74 + movement * 2.2;
    this.camera.fov = damp(this.camera.fov, targetFov, 10, dt);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }
  private showcaseCamera(dt: number) {
    if (this.mode === 'demo') {
      const a = this.modeTime * 0.22;
      this.camera.position.set(
        Math.sin(a) * 13,
        5.8 + Math.sin(a * 1.7) * 2.5,
        11 + Math.cos(a) * 13,
      );
      this.camera.lookAt(-1.5, 3.1, -5);
      if (!this.settings.reducedEffects) this.camera.rotation.z = Math.sin(a) * 0.035;
      this.camera.fov = damp(this.camera.fov, 66, 4, dt);
    } else {
      const portrait = this.camera.aspect < 0.85;
      this.camera.position.set(
        (portrait ? 9 : 12.5) + Math.sin(this.time * 0.085) * 2,
        6.6 + Math.sin(this.time * 0.1) * 0.35,
        portrait ? 26 : 20.5,
      );
      this.camera.lookAt(portrait ? -0.5 : -1, 3.3, -4.5);
      this.camera.fov = portrait ? 60 : 57;
    }
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }
  private cast() {
    const spell = SPELLS[this.spell];
    if (this.cooldowns[this.spell] > 0 || this.energy < spell.cost) return;
    this.energy -= spell.cost;
    this.cooldowns[this.spell] = spell.cooldown;
    this.audio.cast(this.spell);
    this.camera.getWorldDirection(direction);
    const target = this.findEnemyOnRay(
      this.camera.position,
      direction,
      this.controls.touch ? 0.93 : 0.995,
    );
    if (target && this.controls.touch)
      direction.copy(target.position).sub(this.camera.position).normalize();
    right.set(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const origin = this.camera.position
      .clone()
      .addScaledVector(direction, 0.85)
      .addScaledVector(right, 0.23)
      .addScaledVector(DOWN, 0.17);
    if (target && this.controls.touch) direction.copy(target.position).sub(origin).normalize();
    if (this.spell === 0) {
      this.spawnProjectile(
        origin,
        direction.clone().multiplyScalar(37),
        true,
        false,
        spell.damage,
        target,
      );
      this.fx.glyph(origin, direction, '#ffbb66', 0.25, 0.26);
      this.shake = Math.max(this.shake, 0.006);
    } else if (this.spell === 1) {
      const end = origin.clone().addScaledVector(direction, 70);
      const hit = this.trace(origin, end, true);
      if (hit) end.lerpVectors(origin, end, hit.t);
      this.fx.beam(origin, end, '#8cf5ff', 0.045, 0.28);
      this.fx.glyph(origin, direction, '#8cf5ff', 0.47, 0.42);
      this.fx.burst(end, '#90efff', 25, 4, 0.4, 0.5);
      this.fx.hex(end, this.camera.position, 0.18, 0.55);
      if (hit?.enemy) this.damageEnemy(hit.enemy, spell.damage);
      this.shake = Math.max(this.shake, 0.012);
    } else {
      const end = origin.clone().addScaledVector(direction, 21);
      const hit = this.trace(origin, end, true);
      if (hit) end.lerpVectors(origin, end, hit.t);
      if (target && target.position.distanceTo(origin) < 27) end.copy(target.position);
      this.fx.impact(end, '#dff8ff', true);
      this.fx.glyph(end, temp.subVectors(this.camera.position, end), '#e7fdff', 1.65, 0.65);
      for (let i = 0; i < 9; i++) {
        const angle = (i / 9) * Math.PI * 2;
        this.fx.beam(
          end,
          temp2
            .copy(end)
            .add(
              new THREE.Vector3(
                Math.cos(angle) * 2.8,
                Math.sin(angle) * 2.8,
                (Math.random() - 0.5) * 2,
              ),
            ),
          '#d8faff',
          0.055,
          0.32,
        );
      }
      for (const enemy of this.enemies)
        if (
          enemy.alive &&
          enemy.position.distanceTo(end) < 6.5 &&
          this.clearSight(end, enemy.position)
        )
          this.damageEnemy(enemy, spell.damage);
      this.shake = 0.035;
      this.flash();
    }
  }
  private findEnemyOnRay(
    origin: THREE.Vector3,
    forward: THREE.Vector3,
    threshold: number,
  ): Enemy | null {
    let best: Enemy | null = null,
      dot = threshold;
    for (const enemy of this.enemies) {
      if (!enemy.alive || enemy.position.distanceToSquared(origin) > 55 * 55) continue;
      const alignment = temp.subVectors(enemy.position, origin).normalize().dot(forward);
      if (alignment > dot && this.clearSight(origin, enemy.position)) {
        dot = alignment;
        best = enemy;
      }
    }
    return best;
  }
  private clearSight(from: THREE.Vector3, to: THREE.Vector3) {
    return !this.world.obstacles.some((b) => {
      const t = segmentBox(from, to, b);
      return t !== null && t < 0.985;
    });
  }
  private trace(
    start: THREE.Vector3,
    end: THREE.Vector3,
    enemies: boolean,
  ): { t: number; enemy?: Enemy } | null {
    let best: { t: number; enemy?: Enemy } | null = null;
    for (const obstacle of this.world.obstacles) {
      const t = segmentBox(start, end, obstacle, 0.02);
      if (t !== null && (!best || t < best.t)) best = { t };
    }
    if (end.y < 0.04 && start.y >= 0.04) {
      const t = (start.y - 0.04) / (start.y - end.y);
      if (!best || t < best.t) best = { t };
    }
    if (enemies)
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        const t = segmentSphere(start, end, enemy.position, 0.92);
        if (t !== null && (!best || t < best.t)) best = { t, enemy };
      }
    return best;
  }
  private spawnProjectile(
    at: THREE.Vector3,
    velocity: THREE.Vector3,
    friendly: boolean,
    harmless = false,
    damage = 10,
    target: Enemy | null = null,
  ) {
    if (this.projectiles.length >= 42) this.removeProjectile(0);
    const mesh = new THREE.Mesh(
      this.projectileGeometry,
      friendly ? this.projectileMaterial : this.enemyProjectileMaterial,
    );
    mesh.position.copy(at);
    mesh.scale.set(0.75, 0.75, 1.5);
    mesh.lookAt(temp.copy(at).add(velocity));
    this.scene.add(mesh);
    const ribbon = new Ribbon(
      friendly ? 14 : 24,
      friendly ? 0.028 : 0.034,
      friendly ? '#ffcc87' : '#ff865e',
    );
    this.scene.add(ribbon.mesh);
    ribbon.reset(at);
    this.projectiles.push({
      mesh,
      ribbon,
      velocity,
      life: friendly ? 2.8 : 6.5,
      friendly,
      harmless,
      damage,
      last: at.clone(),
      target,
    });
  }
  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.removeProjectile(i);
        continue;
      }
      p.last.copy(p.mesh.position);
      if (p.target?.alive && p.friendly) {
        const homing = temp
          .subVectors(p.target.position, p.mesh.position)
          .normalize()
          .multiplyScalar(37);
        p.velocity.lerp(homing, clamp(dt * 5, 0, 1));
      }
      p.mesh.position.addScaledVector(p.velocity, dt);
      const hit = this.trace(p.last, p.mesh.position, p.friendly || p.harmless);
      if (hit) {
        p.mesh.position.lerpVectors(p.last, p.mesh.position, hit.t);
        this.fx.impact(p.mesh.position, p.friendly ? '#ffb068' : '#ff8a53');
        if (hit.enemy && !p.harmless && this.mode === 'playing')
          this.damageEnemy(hit.enemy, p.damage);
        this.removeProjectile(i);
        continue;
      }
      if (!p.friendly && !p.harmless && this.mode === 'playing') {
        const radius = this.shielding ? 1.45 : 0.55;
        temp.copy(this.player);
        temp.y += 1.1;
        if (segmentSphere(p.last, p.mesh.position, temp, radius) !== null) {
          if (this.shielding) {
            this.energy = Math.max(0, this.energy - 5);
            this.fx.hex(p.mesh.position, this.camera.position, 0.23, 0.4);
            this.audio.block();
          } else if (this.dashTime <= 0) this.damagePlayer(p.damage);
          this.fx.burst(p.mesh.position, this.shielding ? '#86f5ff' : '#ff8155', 18, 3, 0.35);
          this.removeProjectile(i);
          continue;
        }
      }
      p.ribbon.push(p.mesh.position, this.camera.position);
      if (Math.random() < dt * 16)
        this.fx.burst(p.mesh.position, p.friendly ? '#ffc47e' : '#ff7951', 1, 0.3, 0.2, 0);
    }
  }
  private removeProjectile(index: number) {
    const p = this.projectiles[index];
    p.mesh.removeFromParent();
    p.ribbon.dispose();
    this.projectiles.splice(index, 1);
  }
  private clearProjectiles() {
    while (this.projectiles.length) this.removeProjectile(this.projectiles.length - 1);
  }
  private spawnWave() {
    for (const enemy of this.enemies) {
      enemy.group.removeFromParent();
      enemy.ribbon.dispose();
      enemy.group.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
    }
    this.enemies = [];
    const config = waveConfig(this.wave);
    const centers = [
      [3.4, 2.0, 5.7],
      [-5.9, 2.8, -0.5],
      [7.7, 4.2, -8.1],
      [-11, 2.8, 6],
      [10, 2.2, 15],
      [-7, 4.1, -12],
      [16, 3.2, -8],
    ];
    for (let i = 0; i < config.count; i++) {
      const group = new THREE.Group();
      const core = new THREE.Mesh(
        new THREE.BoxGeometry(0.76, 1.3, 0.76),
        new THREE.MeshStandardMaterial({
          color: '#f2391e',
          emissive: '#ba3018',
          emissiveIntensity: 0.12,
          roughness: 0.48,
          metalness: 0.04,
        }),
      );
      core.castShadow = true;
      core.receiveShadow = true;
      group.add(core);
      const barGroup = new THREE.Group();
      barGroup.position.y = 1.04;
      const background = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 0.05),
        new THREE.MeshBasicMaterial({
          color: '#303a3c',
          transparent: true,
          opacity: 0.6,
          depthWrite: false,
        }),
      );
      barGroup.add(background);
      const bar = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 0.035),
        new THREE.MeshBasicMaterial({
          color: '#e9f5ec',
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
        }),
      );
      bar.position.z = 0.005;
      barGroup.add(bar);
      group.add(barGroup);
      this.scene.add(group);
      const ribbon = new Ribbon(100, 0.07);
      this.scene.add(ribbon.mesh);
      const position = new THREE.Vector3(...centers[i]);
      group.position.copy(position);
      ribbon.reset(position);
      // Prefill an actual curved path so the reference's white motion trail is visible immediately.
      for (let j = 99; j >= 0; j--) {
        const t = (this.time - j / 60) * config.speed + i * 2.3;
        const radius = i === 0 ? 4.1 : 3.1;
        const y = position.y + Math.sin(t * 1.4) * 0.65;
        const resolved = resolveCircle(
          position.x + Math.cos(t) * radius,
          position.z + Math.sin(t * 0.92) * 2.7,
          y - 0.65,
          0.5,
          this.world.obstacles,
        );
        ribbon.push(new THREE.Vector3(resolved.x, y, resolved.z), this.camera.position);
      }
      this.enemies.push({
        group,
        core,
        bar,
        barGroup,
        ribbon,
        center: position.clone(),
        position,
        health: config.health,
        maxHealth: config.health,
        phase: i * 2.3,
        attack: 5 + i * 1.1,
        flash: 0,
        alive: true,
      });
    }
  }
  private updateEnemies(dt: number, showcase: boolean) {
    const config = waveConfig(this.wave);
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const t = this.time * config.speed + enemy.phase;
      const radius = enemy.phase < 0.1 ? 4.1 : 3.1;
      const x = enemy.center.x + Math.cos(t) * radius;
      const z = enemy.center.z + Math.sin(t * 0.92) * 2.7;
      const y = enemy.center.y + Math.sin(t * 1.4) * 0.65;
      const resolved = resolveCircle(x, z, y - 0.65, 0.5, this.world.obstacles);
      enemy.position.set(resolved.x, y, resolved.z);
      enemy.group.position.copy(enemy.position);
      enemy.core.rotation.y = Math.sin(t * 0.7) * 0.4;
      enemy.core.rotation.z = Math.sin(t * 1.3) * 0.06;
      enemy.flash = Math.max(0, enemy.flash - dt);
      enemy.core.material.emissiveIntensity = enemy.flash > 0 ? 3 : 0.12;
      enemy.ribbon.push(enemy.position, this.camera.position);
      enemy.barGroup.quaternion.copy(this.camera.quaternion);
      enemy.barGroup.visible = !showcase && enemy.position.distanceTo(this.player) < 34;
      enemy.bar.scale.x = enemy.health / enemy.maxHealth;
      enemy.bar.position.x = -(1 - enemy.health / enemy.maxHealth) / 2;
      if (showcase) {
        if (Math.random() < dt * 10) {
          temp.copy(enemy.position);
          temp.y = 0.13;
          this.fx.debris(temp, 1, 1.6);
        }
      } else {
        enemy.attack -= dt;
        if (enemy.attack <= 0) {
          enemy.attack = config.attackInterval + Math.random() * 1.1;
          const target = this.player
            .clone()
            .add(new THREE.Vector3(this.velocity.x * 0.16, 1.1, this.velocity.z * 0.16));
          if (enemy.position.distanceTo(target) < 45 && this.clearSight(enemy.position, target)) {
            const aim = target.sub(enemy.position).normalize();
            this.spawnProjectile(
              enemy.position.clone().addScaledVector(aim, 0.7),
              aim.multiplyScalar(10 + Math.min(this.wave, 10) * 0.6),
              false,
              false,
              12,
            );
            this.fx.glyph(
              enemy.position,
              temp.copy(this.camera.position).sub(enemy.position),
              '#ffb365',
              0.37,
              0.4,
            );
          }
        }
      }
    }
  }
  private updateTargetShadows() {
    for (let i = 0; i < 7; i++) {
      const enemy = this.enemies[i];
      this.shadowStamp.rotation.set(-Math.PI / 2, 0, 0);
      if (enemy?.alive) {
        this.shadowStamp.position.set(enemy.position.x, 0.034, enemy.position.z);
        const size = 1.6 + enemy.position.y * 0.4;
        this.shadowStamp.scale.set(size, size, 1);
      } else this.shadowStamp.scale.setScalar(0);
      this.shadowStamp.updateMatrix();
      this.targetShadows.setMatrixAt(i, this.shadowStamp.matrix);
    }
    this.targetShadows.instanceMatrix.needsUpdate = true;
  }
  private damageEnemy(enemy: Enemy, amount: number) {
    if (!enemy.alive) return;
    enemy.health = Math.max(0, enemy.health - amount);
    enemy.flash = 0.12;
    const kill = enemy.health === 0;
    const points = kill ? 100 + (this.wave - 1) * 25 : 0;
    if (kill) {
      enemy.alive = false;
      enemy.group.visible = false;
      enemy.ribbon.mesh.visible = false;
      this.score += points;
      this.kills++;
      this.energy = Math.min(100, this.energy + 9);
      this.fx.impact(enemy.position, '#ffcc87', true);
      this.fx.hex(enemy.position, this.camera.position, 0.22, 0.5);
      this.shake = Math.max(this.shake, 0.015);
      this.saveBest();
      if (this.enemies.every((e) => !e.alive)) {
        this.nextWave = 3;
        this.emit({ type: 'toast', text: 'Arena bersih. Gelombang berikutnya dalam 3 detik.' });
      }
    }
    this.audio.hit(kill);
    this.emit({ type: 'hit', kill, points });
  }
  private damagePlayer(amount: number) {
    if (this.damageTimer < 0.3 || this.mode !== 'playing') return;
    this.health = Math.max(0, this.health - amount);
    this.damageTimer = 0;
    this.shake = 0.025;
    this.audio.damage();
    this.emit({ type: 'damage', amount });
    if (this.health === 0) {
      this.saveBest();
      this.shield.visible = false;
      this.changeMode('gameover');
    }
  }
  private flash() {
    if (!this.settings.reducedEffects && this.flashTimer === 0) {
      this.emit({ type: 'impact' });
      this.flashTimer = 1;
    }
  }
  private updateWaves(dt: number) {
    if (this.nextWave < 0) return;
    this.nextWave -= dt;
    if (this.nextWave <= 0) {
      this.nextWave = -1;
      this.wave++;
      this.score += 200;
      this.health = Math.min(100, this.health + 25);
      this.energy = Math.min(100, this.energy + 30);
      this.clearProjectiles();
      this.spawnWave();
      this.saveBest();
      this.audio.wave();
      this.emit({ type: 'wave', wave: this.wave });
    }
  }
  private saveBest() {
    if (this.score > this.best) {
      this.best = this.score;
      try {
        localStorage.setItem('hea-best', String(this.best));
      } catch {
        /* Storage is optional. */
      }
    }
  }
  private updateShowcase(dt: number) {
    this.previewTimer -= dt;
    if (this.previewTimer > 0) return;
    this.previewTimer = this.mode === 'demo' ? 1.4 : 2.0;
    const target = this.enemies[this.previewStep % this.enemies.length];
    const stage = this.previewStep++ % 4;
    if (this.mode === 'demo') this.audio.cast(stage % 3);
    if (stage === 0) {
      const origin = this.world.portalPosition.clone().add(new THREE.Vector3(0, 0, 0.4));
      this.spawnProjectile(
        origin,
        target.position.clone().sub(origin).normalize().multiplyScalar(14),
        true,
        true,
        0,
        target,
      );
      this.fx.glyph(origin, new THREE.Vector3(0, 0, 1), '#ffbb65', 0.85, 0.5);
    } else if (stage === 1) {
      const origin = new THREE.Vector3(-5, 3.5, -5);
      this.fx.beam(origin, target.position, '#9af5ff', 0.033, 0.7);
      this.fx.hex(target.position, this.camera.position, 0.3, 0.8);
      this.fx.burst(target.position, '#b4faff', 34, 3.4, 0.4, 2);
    } else if (stage === 2) {
      const point = new THREE.Vector3(0.5, 1.2, -1.5);
      this.fx.impact(point, '#acf3ff', true);
      this.fx.hex(point, this.camera.position, 0.3, 1);
    } else {
      for (let i = 0; i < 3; i++) {
        const origin = this.world.portalPosition
          .clone()
          .add(new THREE.Vector3((i - 1) * 0.45, 0, 0.7));
        const end = target.position.clone().add(new THREE.Vector3(i - 1, 0, 0));
        this.spawnProjectile(
          origin,
          end.sub(origin).normalize().multiplyScalar(12),
          false,
          true,
          0,
        );
      }
    }
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
