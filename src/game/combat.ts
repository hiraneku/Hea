import { Vector3 } from 'three';
import { clamp, segmentSphere, type Point3 } from './math';

/** Main duel timings and thresholds; deliberately tunable against additional reference footage. */
export const DUEL = {
  bossHealth: 1440,
  preferredRange: 21,
  nearRange: 15,
  farRange: 27,
  bossSpeed: 12,
  shieldWindow: 1.65,
  shieldCooldown: 3.2,
  shieldPrediction: 0.13,
  bodyRadius: 0.72,
  shieldArcDegrees: 210,
  novaLaunch: 62,
  novaPause: 0.105,
  wallBreakSpeed: 12,
  groundBreakSpeed: 10,
  impactInterval: 0.65,
} as const;

export type ShieldPhase = 'ready' | 'active' | 'cooldown';
export class AutoShield {
  phase: ShieldPhase = 'ready';
  remaining = 0;
  blocked = 0;
  reset() {
    this.phase = 'ready';
    this.remaining = this.blocked = 0;
  }
  update(dt: number) {
    let left = Math.max(0, dt);
    while (left > 0 && this.phase !== 'ready') {
      const step = Math.min(left, this.remaining);
      this.remaining = Math.max(0, this.remaining - step);
      left -= step;
      if (this.remaining < 1e-8) {
        if (this.phase === 'active') {
          this.phase = 'cooldown';
          this.remaining = DUEL.shieldCooldown;
        } else {
          this.phase = 'ready';
          this.remaining = 0;
        }
      }
    }
  }
  /** Unlimited interceptions in the window, but the caller must check facing and occlusion first. */
  intercept(): boolean {
    if (this.phase === 'cooldown') return false;
    if (this.phase === 'ready') {
      this.phase = 'active';
      this.remaining = DUEL.shieldWindow;
    }
    this.blocked++;
    return true;
  }
  get progress() {
    return this.phase === 'ready'
      ? 1
      : this.phase === 'active'
        ? this.remaining / DUEL.shieldWindow
        : 1 - this.remaining / DUEL.shieldCooldown;
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

export type AttackId = 'fire' | 'missiles' | 'hammer';
export type AttackStage = 'telegraph' | 'attack' | 'recover';
export const ATTACKS = {
  fire: {
    label: 'RENTETAN API',
    warning: 'SALVO API',
    tell: 0.9,
    duration: 3.65,
    recovery: 0.95,
    shots: 30,
    interval: 0.12,
  },
  missiles: {
    label: 'MANTRA PEMBURU',
    warning: 'SIGIL MENGUNCI',
    tell: 1.05,
    duration: 1.0,
    recovery: 1.25,
    shots: 3,
    interval: 0.3,
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
} as const;
export interface AttackCommand {
  type: 'tell' | 'shot';
  attack: AttackId;
  index: number;
}

/** A deterministic state machine, not random per-frame attacks. */
export class BossDirector {
  private sequence: AttackId[] = ['fire', 'missiles', 'hammer'];
  private index = 0;
  private fired = 0;
  private opening = true;
  stage: AttackStage = 'telegraph';
  elapsed = 0;
  reset() {
    this.index = this.fired = this.elapsed = 0;
    this.stage = 'telegraph';
    this.opening = true;
  }
  get attack(): AttackId {
    return this.sequence[this.index % this.sequence.length];
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
          this.index++;
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

export type ProjectileKind = 'player' | 'fire' | 'missile' | 'hammer';
/** The same radius drives the visible core, shield size and swept collision. */
export const PROJECTILES = {
  player: { radius: 0.17, speed: 44, life: 2.8, launch: 0, pause: 0, stagger: 0 },
  fire: { radius: 0.32, speed: 30, life: 4, launch: 30, pause: 0.075, stagger: 0.75 },
  missile: { radius: 0.34, speed: 28, life: 5.5, launch: 52, pause: 0.095, stagger: 1.1 },
  hammer: { radius: 1.25, speed: 31, life: 5, launch: 76, pause: 0.12, stagger: 1.35 },
} as const;

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

/** Stops simulation at contact; consumes only the pause portion of a long render frame. */
export class HitPause {
  remaining = 0;
  request(duration: number) {
    this.remaining = Math.max(this.remaining, duration);
  }
  consume(dt: number): number {
    const held = Math.min(Math.max(0, dt), this.remaining);
    this.remaining = Math.max(0, this.remaining - held);
    return Math.max(0, dt - held);
  }
  reset() {
    this.remaining = 0;
  }
}

/** Low-discrepancy spray: readable cone, wider than the previous pinpoint stream. */
export function salvoSpread(index: number): { yaw: number; pitch: number } {
  if (index % 5 === 0) return { yaw: 0, pitch: 0 };
  const angle = index * 2.39996323,
    radius = 0.5 + (index % 4) * 0.16;
  return { yaw: Math.cos(angle) * 0.105 * radius, pitch: Math.sin(angle) * 0.06 * radius };
}

/** Adaptive terminal guidance: no dead zone/delayed lock near the player and no endless orbit. */
export function guideMissile(
  position: Vector3,
  velocity: Vector3,
  target: Vector3,
  targetVelocity: Vector3,
  age: number,
  dt: number,
): Vector3 {
  const offset = target.clone().sub(position),
    distance = offset.length();
  const toward = offset.clone().normalize(),
    current = velocity.clone().normalize();
  const alignment = current.dot(toward);
  const close = 1 - clamp(distance / 10, 0, 1);
  const cruise = Math.min(PROJECTILES.missile.speed, 15 + age * 9);
  // Brake into tight bends instead of circling a target faster than the seeker can turn.
  const speed = cruise * (alignment < 0.45 ? clamp((alignment + 1) * 0.5, 0.38, 1) : 1);
  const lead = Math.min(0.48, distance / Math.max(10, cruise));
  const desired = offset.addScaledVector(targetVelocity, lead * (distance < 2 ? 0.35 : 0.85));
  const turnRate = 3.2 + close * 10.8;
  return steerMissile(velocity, desired, turnRate, dt, speed);
}
