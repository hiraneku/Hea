import { Vector3 } from 'three';
import { clamp, segmentSphere, seededRandom, type Point3 } from './math';

/** Main duel timings and thresholds; deliberately tunable against additional reference footage. */
export const DUEL = {
  bossHealth: 1440,
  preferredRange: 21,
  nearRange: 15,
  farRange: 27,
  bossSpeed: 12,
  shieldPrediction: 0.24,
  bodyRadius: 0.72,
  shieldArcDegrees: 240,
  shieldShell: 3.1,
  shieldNear: 2.4,
  shieldReach: 5.2,
  /** A patch keeps blocking shots on its line for this long; each block renews it. */
  shieldPatchLife: 1.5,
  shieldPatchLifeLarge: 1.7,
  /**
   * Hits one patch can take before it shatters, and the hole that leaves in the shell: for
   * `shieldGap` seconds nothing is intercepted within `shieldGapDegrees` of that direction.
   */
  shieldPatchHits: 5,
  shieldGap: 1,
  shieldGapDegrees: 30,
  /** Solar vortex: how long the well pulls before it detonates, its reach and peak pull. */
  vortexPull: 1.7,
  vortexRadius: 22,
  vortexStrength: 30,
  vortexCoreRadius: 3.2,
  vortexEmbers: 14,
  novaLaunch: 138,
  /** Heavy contact: a dead freeze, then a slow-motion release that ramps back to real time. */
  heavyFreeze: 0.15,
  heavySlow: 0.35,
  wallBreakSpeed: 12,
  groundBreakSpeed: 10,
  impactInterval: 0.65,
} as const;

export type ShieldPhase = 'off' | 'ready' | 'active';
export class AutoShield {
  enabled = true;
  blocked = 0;
  private pulse = 0;
  get phase(): ShieldPhase {
    return !this.enabled ? 'off' : this.pulse > 0 ? 'active' : 'ready';
  }
  reset() {
    this.enabled = true;
    this.blocked = this.pulse = 0;
  }
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.pulse = 0;
  }
  toggle() {
    this.setEnabled(!this.enabled);
  }
  update(dt: number) {
    this.pulse = Math.max(0, this.pulse - dt);
  }
  /** Always ready while ON. The pulse is feedback only, never a protection window/cooldown. */
  intercept(): boolean {
    if (!this.enabled) return false;
    this.blocked++;
    this.pulse = 0.22;
    return true;
  }
}

/** Relative-motion CCD. Near misses don't waste the automatic shield. */
export function threatTime(
  projectile: Point3,
  velocity: Point3,
  player: Point3,
  playerVelocity: Point3,
  horizon: number,
  radius: number = DUEL.bodyRadius,
): number | null {
  const end = {
    x: projectile.x + (velocity.x - playerVelocity.x) * horizon,
    y: projectile.y + (velocity.y - playerVelocity.y) * horizon,
    z: projectile.z + (velocity.z - playerVelocity.z) * horizon,
  };
  const fraction = segmentSphere(projectile, end, player, radius);
  return fraction === null ? null : fraction * horizon;
}

export type AttackId = 'fire' | 'missiles' | 'hammer' | 'vortex';
export const ATTACK_ORDER: readonly AttackId[] = ['fire', 'missiles', 'hammer', 'vortex'];
export type AttackStage = 'telegraph' | 'attack' | 'recover';
export const ATTACKS = {
  fire: {
    label: 'RENTETAN API',
    warning: 'SALVO API',
    tell: 0.9,
    duration: 5.6,
    recovery: 0.95,
    shots: 54,
    interval: 0.1,
  },
  missiles: {
    label: 'MANTRA PEMBURU',
    warning: 'MANTRA MENYEBAR',
    tell: 1.2,
    duration: 2.4,
    recovery: 1.25,
    shots: 6,
    interval: 0.36,
  },
  hammer: {
    label: 'HEMPASAN SURYA',
    warning: 'SERANGAN BERAT',
    tell: 1.6,
    duration: 0.2,
    recovery: 1.6,
    shots: 1,
    interval: 0.15,
  },
  /**
   * A seed flies to the player and anchors as a gravity well: it drags the body (and every
   * loose particle) inwards for `DUEL.vortexPull` seconds, then detonates into a flat ring of
   * embers — fleeing straight away turns your blind rear to the ring; climbing or diving clears it.
   */
  vortex: {
    label: 'PUSARAN SURYA',
    warning: 'TARIKAN GRAVITASI',
    tell: 1.25,
    duration: 2.9,
    recovery: 1.3,
    shots: 1,
    interval: 0.1,
  },
} as const;
export interface AttackCommand {
  type: 'tell' | 'shot';
  attack: AttackId;
  index: number;
}

/** A deterministic state machine, not random per-frame attacks. */
export class BossDirector {
  private sequence: AttackId[] = [...ATTACK_ORDER];
  private index = 0;
  private fired = 0;
  private opening = true;
  private override: AttackId | null = null;
  stage: AttackStage = 'telegraph';
  elapsed = 0;
  reset() {
    this.index = this.fired = this.elapsed = 0;
    this.sequence = [...ATTACK_ORDER];
    this.stage = 'telegraph';
    this.opening = true;
    this.override = null;
  }
  redirect(attack: AttackId) {
    if (this.attack === attack) return false;
    this.override = attack;
    this.stage = 'telegraph';
    this.elapsed = this.fired = 0;
    this.opening = false;
    return true;
  }
  get pattern() {
    return this.index;
  }
  get attack(): AttackId {
    return this.override ?? this.sequence[this.index % this.sequence.length];
  }
  get duration() {
    const a = ATTACKS[this.attack];
    return this.stage === 'telegraph'
      ? a.tell + (this.opening ? 1 : 0)
      : this.stage === 'attack'
        ? a.duration
        : a.recovery;
  }
  get charge() {
    return this.stage === 'telegraph' ? clamp(this.elapsed / this.duration, 0, 1) : 0;
  }
  step(dt: number, enraged = false): AttackCommand[] {
    const commands: AttackCommand[] = [];
    let left = Math.max(0, dt) * (enraged ? 1.13 : 1);
    while (left > 1e-8) {
      const step = Math.min(left, this.duration - this.elapsed);
      this.elapsed += step;
      left -= step;
      if (this.stage === 'attack') {
        const a = ATTACKS[this.attack];
        while (this.fired < a.shots && this.fired * a.interval <= this.elapsed + 1e-8) {
          commands.push({ type: 'shot', attack: this.attack, index: this.fired++ });
        }
      }
      if (this.elapsed + 1e-8 >= this.duration) {
        this.elapsed = 0;
        if (this.stage === 'telegraph') {
          this.stage = 'attack';
          this.fired = 0;
          this.opening = false;
        } else if (this.stage === 'attack') this.stage = 'recover';
        else {
          const previous = this.attack;
          this.override = null;
          this.index++;
          if (this.index % ATTACK_ORDER.length === 0) {
            const random = seededRandom(this.index * 997 + 71);
            this.sequence = [...ATTACK_ORDER];
            for (let i = this.sequence.length - 1; i > 0; i--) {
              const j = Math.floor(random() * (i + 1));
              [this.sequence[i], this.sequence[j]] = [this.sequence[j], this.sequence[i]];
            }
            if (this.sequence[0] === previous)
              [this.sequence[0], this.sequence[1]] = [this.sequence[1], this.sequence[0]];
          }
          this.stage = 'telegraph';
          commands.push({ type: 'tell', attack: this.attack, index: 0 });
        }
      }
    }
    return commands;
  }
}

/** Limited angular guidance lets missiles curve around the arena but still be dodged. */
export function steerMissile(
  velocity: Vector3,
  desiredDirection: Vector3,
  turnRate: number,
  dt: number,
  speed: number,
): Vector3 {
  const current = velocity.clone().normalize(),
    desired = desiredDirection.clone().normalize();
  if (desired.lengthSq() < 0.01) return velocity.clone();
  const angle = current.angleTo(desired),
    maxTurn = Math.max(0, turnRate * dt);
  if (angle <= maxTurn || angle < 1e-6) return desired.multiplyScalar(speed);
  let axis = new Vector3().crossVectors(current, desired);
  if (axis.lengthSq() < 1e-8) axis = new Vector3().crossVectors(current, new Vector3(0, 1, 0));
  if (axis.lengthSq() < 1e-8) axis.set(1, 0, 0);
  return current.applyAxisAngle(axis.normalize(), maxTurn).multiplyScalar(speed);
}

export function rangeCorrection(distance: number): number {
  if (distance < DUEL.nearRange) return -Math.min(8, (DUEL.nearRange - distance) * 2.4);
  if (distance > DUEL.farRange)
    return Math.min(DUEL.bossSpeed * 1.5, (distance - DUEL.preferredRange) * 1.4);
  return clamp((distance - DUEL.preferredRange) * 0.8, -2.5, 2.5);
}

export type ProjectileKind = 'player' | 'fire' | 'missile' | 'hammer' | 'vortex';
/** The projectile each boss attack launches (the vortex seed for the vortex). */
export function projectileOf(attack: AttackId): Exclude<ProjectileKind, 'player'> {
  return attack === 'missiles'
    ? 'missile'
    : attack === 'fire'
      ? 'fire'
      : attack === 'vortex'
        ? 'vortex'
        : 'hammer';
}
/** The same radius drives the visible core, shield size and swept collision. */
export const PROJECTILES = {
  player: { radius: 0.17, speed: 44, life: 2.8, launch: 0, pause: 0, slow: 0, stagger: 0 },
  fire: { radius: 0.32, speed: 36, life: 4, launch: 44, pause: 0.09, slow: 0, stagger: 0.85 },
  missile: { radius: 0.34, speed: 28, life: 5.5, launch: 72, pause: 0.12, slow: 0, stagger: 1.2 },
  hammer: {
    radius: 1.25,
    speed: 37,
    life: 5,
    launch: 150,
    pause: DUEL.heavyFreeze,
    slow: DUEL.heavySlow,
    stagger: 1.5,
  },
  /** The vortex seed: harmless in flight, but its core detonation is a heavy contact. */
  vortex: {
    radius: 0.55,
    speed: 31,
    life: 3,
    launch: 98,
    pause: DUEL.heavyFreeze,
    slow: DUEL.heavySlow,
    stagger: 1.4,
  },
} as const;
/** How far the visible head of a projectile reaches ahead of its centre (fire is a long bolt). */
export function projectileNose(kind: ProjectileKind): number {
  return kind === 'fire' ? 0.36 : PROJECTILES[kind].radius;
}

/** Front and peripheral vision in 3D; the rear cone is a genuine blind spot, even while active. */
export function shieldCovers(facing: Vector3, toProjectile: Vector3): boolean {
  if (toProjectile.lengthSq() < 1e-8 || facing.lengthSq() < 1e-8) return false;
  return (
    facing.clone().normalize().dot(toProjectile.clone().normalize()) >=
    Math.cos((DUEL.shieldArcDegrees * Math.PI) / 360) - 1e-7
  );
}
export function shieldScale(projectileRadius: number): number {
  return clamp(0.9 + projectileRadius * 1.35, 1, 2.8);
}
/** Blocking radius of a standing polyhex patch; slightly inside its visible outline. */
export function patchRadius(scale: number): number {
  return 0.85 * scale;
}

export interface ShieldPatch {
  position: number[];
  offset: number[];
  normal: number[];
  radius: number;
  life: number;
  serial: number;
  hits: number;
  /** Visual scale of the polyhex, and the lattice it was fitted into (see ShieldLattice). */
  scale: number;
  cluster: number;
  anchor: { q: number; r: number };
}
/**
 * A patch that is still standing stops later shots travelling the same lane. The patch is a
 * disc: the shot connects when its visible head reaches the plane inside the disc, approaching
 * from the front face — not metres early on a bounding sphere. Rear/edge passes ignore it.
 * Returns the fraction of `start → end` at which the head touches the surface.
 */
export function patchBlocks(
  patch: Pick<ShieldPatch, 'position' | 'normal' | 'radius'>,
  start: Point3,
  end: Point3,
  velocity: Point3,
  projectileRadius: number,
  nose = projectileRadius,
): number | null {
  const speed = Math.hypot(velocity.x, velocity.y, velocity.z);
  if (speed < 1e-6) return null;
  const [nx, ny, nz] = patch.normal;
  const approach = (velocity.x * nx + velocity.y * ny + velocity.z * nz) / speed;
  if (approach > -0.25) return null;
  const [px, py, pz] = patch.position;
  // Signed heights of the head above the patch plane at both ends of the step.
  const h0 = (start.x - px) * nx + (start.y - py) * ny + (start.z - pz) * nz - nose,
    h1 = (end.x - px) * nx + (end.y - py) * ny + (end.z - pz) * nz - nose;
  if (h1 > 0) return null; // Still in front of the surface.
  if (h0 < -projectileRadius * 2.5) return null; // Already well past it: never crossed here.
  const t = h0 <= 0 ? 0 : h0 / (h0 - h1);
  const cx = start.x + (end.x - start.x) * t - px,
    cy = start.y + (end.y - start.y) * t - py,
    cz = start.z + (end.z - start.z) * t - pz;
  const along = cx * nx + cy * ny + cz * nz,
    lateral = Math.sqrt(Math.max(0, cx * cx + cy * cy + cz * cz - along * along));
  return lateral <= patch.radius + projectileRadius ? t : null;
}

/** Deterministic per-orb aim scatter: each seeker chases its own point around the player. */
export function missileAimOffset(seed: number): { side: number; up: number } {
  const random = seededRandom(seed * 7919 + 13);
  const angle = random() * Math.PI * 2,
    radius = 0.7 + random() * 1.9;
  return { side: Math.cos(angle) * radius, up: Math.sin(angle) * radius * 0.75 };
}

/**
 * Contact hold: a dead freeze, then an optional slow-motion tail whose time scale ramps back
 * to real time. Only the pause portion of a long render frame is consumed.
 */
export class HitPause {
  remaining = 0;
  slowRemaining = 0;
  private slowTotal = 0;
  static readonly slowScale = 0.2;
  request(freeze: number, slow = 0) {
    this.remaining = Math.max(this.remaining, freeze);
    if (slow > this.slowRemaining) {
      this.slowRemaining = slow;
      this.slowTotal = slow;
    }
  }
  /** True while anything (freeze or slow-motion) still alters the flow of time. */
  get active() {
    return this.remaining > 0 || this.slowRemaining > 0;
  }
  /** Current simulation speed: 0 frozen, ramping from slowScale up to 1 through the tail. */
  get scale() {
    if (this.remaining > 0) return 0;
    if (this.slowRemaining <= 0 || this.slowTotal <= 0) return 1;
    const progress = 1 - this.slowRemaining / this.slowTotal;
    return HitPause.slowScale + (1 - HitPause.slowScale) * progress * progress;
  }
  /** Freeze only: the held portion is removed from `dt`, the rest is returned unchanged. */
  hold(dt: number): number {
    const held = Math.min(Math.max(0, dt), this.remaining);
    this.remaining = Math.max(0, this.remaining - held);
    return Math.max(0, dt - held);
  }
  /** Converts a real-time frame into simulated time: freeze, then the slow-motion ramp. */
  consume(dt: number): number {
    let real = this.hold(dt),
      simulated = 0;
    while (real > 1e-9 && this.slowRemaining > 0) {
      const slice = Math.min(real, this.slowRemaining, 1 / 240),
        scale = this.scale;
      this.slowRemaining = Math.max(0, this.slowRemaining - slice);
      simulated += slice * (scale + this.scale) * 0.5;
      real -= slice;
    }
    return simulated + real;
  }
  reset() {
    this.remaining = this.slowRemaining = this.slowTotal = 0;
  }
}

/** Low-discrepancy spray: a readable cone, wider than the previous pinpoint stream. */
export function salvoSpread(index: number): { yaw: number; pitch: number } {
  // Four-shot rakes; one centred bolt in each packet and a broad surrounding fan (about ±7.5°
  // across, ±5° up and down) so the salvo sweeps the lane instead of drilling one point.
  const side = Math.floor(index / 4) % 2 ? -1 : 1;
  const yaw = [-0.12, 0, 0.133, 0.05][index % 4] * side;
  const pitch = [0.06, 0, -0.052, 0.085][index % 4];
  return { yaw, pitch };
}

export interface MissileGuidance {
  committed: boolean;
}
/** Soft pursuit, then a committed straight run: dodging does not trigger a near-range U-turn. */
export function guideMissile(
  position: Vector3,
  velocity: Vector3,
  target: Vector3,
  targetVelocity: Vector3,
  age: number,
  dt: number,
  state: MissileGuidance = { committed: false },
): Vector3 {
  const offset = target.clone().sub(position),
    distance = offset.length();
  const alignment = velocity.clone().normalize().dot(offset.clone().normalize());
  // A moderate lock: the orb hunts for a good two seconds and aims ahead of a moving body,
  // but can only bend its course gently (a radian per second), so a slow drift gets caught
  // while a committed full-speed strafe still slips past it.
  if (distance <= 4.5 || age >= 2.2 || alignment < 0.05) state.committed = true;
  const speed = Math.min(PROJECTILES.missile.speed, 15 + age * 8);
  if (state.committed) return velocity.clone().normalize().multiplyScalar(speed);
  const lead = Math.min(0.6, distance / 60);
  const desired = offset.addScaledVector(targetVelocity, lead * 0.9);
  return steerMissile(velocity, desired, 1.0, dt, speed);
}

/** Project a patch onto the ACTUAL nearby trajectory, retaining off-centre X/Y offsets. */
export function shieldIntercept(
  projectile: Vector3,
  projectileVelocity: Vector3,
  center: Vector3,
  playerVelocity: Vector3,
  facing: Vector3,
  radius: number,
  horizon: number,
) {
  const relative = projectile.clone().sub(center),
    velocity = projectileVelocity.clone().sub(playerVelocity);
  if (!shieldCovers(facing, relative)) return null;
  if (relative.dot(velocity) >= 0 && relative.length() > DUEL.bodyRadius + radius) return null;
  const time = threatTime(
    projectile,
    projectileVelocity,
    center,
    playerVelocity,
    horizon,
    DUEL.shieldShell + radius,
  );
  if (time === null) return null;
  const offset = relative.addScaledVector(velocity, time);
  if (offset.lengthSq() < 1e-6) offset.copy(projectileVelocity).negate().normalize();
  offset.clampLength(DUEL.shieldNear, DUEL.shieldReach);
  // The body keeps moving during `time`: the shot crosses the shell at `point` in world space,
  // which is where the patch must stand for the shot to actually arrive on it.
  const point = center.clone().addScaledVector(playerVelocity, time).add(offset);
  return { time, offset, point, normal: projectileVelocity.clone().negate().normalize() };
}
