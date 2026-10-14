import { Vector3 } from 'three';
import { ARENA } from './config';
import { clamp, seededRandom } from './math';
import type { AttackId, AttackStage } from './combat';

export type Maneuver = 'strafe' | 'flank' | 'press' | 'low-pass' | 'rise' | 'recover';
/** Finite-lived waypoints, not a permanent player-height-plus-offset tether. */
export class BossTactics {
  readonly goal = new Vector3();
  maneuver: Maneuver = 'strafe';
  decisions = 0;
  private random = seededRandom(7391);
  private remaining = 0;
  private lastPattern = -1;
  private direction = 1;
  /** True while the goal is a routed waypoint; range control must not drag the boss off it. */
  routing = false;
  reset(seed = 7391) {
    this.random = seededRandom(seed);
    this.remaining = 0;
    this.lastPattern = -1;
    this.decisions = 0;
    this.goal.set(0, 6, 0);
    this.direction = 1;
    this.maneuver = 'strafe';
    this.routing = false;
  }
  seekSight(goal: Vector3, pattern: number) {
    this.goal.copy(goal);
    this.maneuver = 'flank';
    this.remaining = 1.4;
    this.lastPattern = pattern;
    this.routing = true;
    this.decisions++;
  }
  displaced(position: Vector3, player: Vector3) {
    this.choose(position, player, 'recover');
    // Recover near the actual post-impact altitude, rather than snapping above the player.
    this.goal.y = clamp(position.y + (this.random() - 0.5) * 2.5, 2.5, ARENA.ceiling);
    this.remaining = 2.1;
  }
  step(
    dt: number,
    position: Vector3,
    player: Vector3,
    attack: AttackId,
    stage: AttackStage,
    pattern: number,
  ) {
    this.remaining -= dt;
    const changed = pattern !== this.lastPattern;
    if (changed) this.lastPattern = pattern;
    if ((changed || this.remaining <= 0) && this.maneuver !== 'recover') {
      const options: Maneuver[] =
        attack === 'fire'
          ? ['strafe', 'press', 'low-pass']
          : attack === 'missiles'
            ? ['flank', 'low-pass', 'strafe']
            : ['rise', 'flank', 'low-pass'];
      this.choose(
        position,
        player,
        options[(this.decisions + Math.floor(this.random() * 2)) % options.length],
      );
    } else if (this.maneuver === 'recover' && this.remaining <= 0)
      this.choose(position, player, 'flank');
    // Emergency range control only; ordinary movement follows its chosen world-space waypoint.
    const delta = this.goal.clone().sub(position);
    const motor = delta
      .multiplyScalar(stage === 'recover' ? 1.5 : 1.1)
      .clampLength(0, stage === 'recover' ? 15 : this.routing ? 16 : 12);
    const away = position.clone().sub(player);
    away.y = 0;
    const distance = away.length();
    if (distance < 10) motor.addScaledVector(away.normalize(), (10 - distance) * 2);
    // A boss thrown across the larger arena closes back in decisively rather than drifting —
    // unless it is following a routed waypoint around cover, which may lead away first.
    if (distance > 33 && !this.routing)
      motor.addScaledVector(away.normalize(), -(distance - 33) * 1.1);
    if (attack === 'hammer' && stage === 'telegraph' && position.y < 6)
      motor.y = Math.max(motor.y, (6 - position.y) * 2);
    return motor.clampLength(0, 19);
  }
  private choose(position: Vector3, player: Vector3, kind: Maneuver) {
    this.maneuver = kind;
    this.routing = false;
    this.decisions++;
    if (this.random() < 0.42) this.direction *= -1;
    const from = position.clone().sub(player),
      angle = Math.atan2(from.z, from.x);
    const sweep = kind === 'flank' || kind === 'recover' ? 0.85 : kind === 'press' ? 0.22 : 0.5;
    const nextAngle = angle + this.direction * (sweep + this.random() * 0.3);
    const range =
      kind === 'press' ? 15 + this.random() * 3 : kind === 'recover' ? 26 : 19 + this.random() * 7;
    const eye = player.y + 0.9;
    const altitude =
      kind === 'low-pass'
        ? eye - 4.5
        : kind === 'rise'
          ? eye + 7.5
          : kind === 'flank'
            ? eye - 1.7
            : kind === 'press'
              ? eye + 0.1
              : eye + (this.random() - 0.5) * 5;
    this.goal.set(
      clamp(player.x + Math.cos(nextAngle) * range, -ARENA.halfSize + 8, ARENA.halfSize - 8),
      clamp(altitude, 2.5, ARENA.ceiling),
      clamp(player.z + Math.sin(nextAngle) * range, -ARENA.halfSize + 8, ARENA.halfSize - 8),
    );
    this.remaining = 1.8 + this.random() * 1.6;
  }
}

/** Satellite circles orbit well outside the boss body (about 3 m out), ahead of its glyph. */
export const FIRE_GATE_RADIUS = 2.95;
/** Successive packets sweep a wide arc around the frontal glyph, as in reference2. */
export function fireGateOffset(index: number, pattern: number): { local: Vector3; side: number } {
  const angles = [
    Math.PI * 0.72,
    -Math.PI * 0.22,
    Math.PI * 0.22,
    -Math.PI * 0.72,
    Math.PI * 0.5,
    0,
    -Math.PI * 0.5,
    Math.PI,
  ];
  const angle = angles[(index + pattern) % angles.length],
    radius = FIRE_GATE_RADIUS + (index % 3) * 0.22;
  return {
    local: new Vector3(Math.cos(angle) * radius, 0.1 + Math.sin(angle) * radius, 1.45),
    side: index % 4,
  };
}
