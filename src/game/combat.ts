import { Vector3 } from 'three';
import { clamp, segmentSphere, type Point3 } from './math';

/** Main duel timings and thresholds; deliberately tunable against additional reference footage. */
export const DUEL = {
  bossHealth: 1440,
  preferredRange: 15,
  nearRange: 11,
  farRange: 19,
  bossSpeed: 7,
  shieldWindow: 1.65,
  shieldCooldown: 3.2,
  shieldPrediction: 0.13,
  bodyRadius: 0.72,
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
  /** No mana drain or projectile limit: every inbound projectile is blocked during the window. */
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
  radius = DUEL.bodyRadius,
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
    tell: 0.8,
    duration: 1.6,
    recovery: 0.85,
    shots: 12,
    interval: 0.125,
  },
  missiles: {
    label: 'MISIL HOMING',
    warning: 'MISIL MENGUNCI',
    tell: 1.0,
    duration: 0.85,
    recovery: 1.3,
    shots: 3,
    interval: 0.26,
  },
  hammer: {
    label: 'HEMPASAN SURYA',
    warning: 'SERANGAN BERAT',
    tell: 1.35,
    duration: 0.15,
    recovery: 1.45,
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
