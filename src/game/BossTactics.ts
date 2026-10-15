import { Vector3 } from 'three';
import { ARENA, BOSS } from './config';
import { clamp, seededRandom } from './math';
import type { AttackId, AttackStage } from './combat';

export type Maneuver = 'strafe' | 'flank' | 'press' | 'low-pass' | 'rise' | 'recover';
/** Finite-lived waypoints, not a permanent player-height-plus-offset tether. */
/** Flight speed caps (m/s) of the boss's own motor: a quarter faster than v0.9 across the board. */
export const BOSS_MOTOR = { cruise: 15, routing: 20, recover: 19, max: 24, retreat: 33 } as const;
/** How long (s) into the hunting spell's tell the boss keeps breaking away before it casts. */
export const MISSILE_RETREAT = { burst: 0.55, settle: 0.95, range: 46 } as const;

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
  /** True while the pre-cast retreat burst is driving the motor (allows a higher speed cap). */
  retreating = false;
  reset(seed = 7391) {
    this.random = seededRandom(seed);
    this.remaining = 0;
    this.lastPattern = -1;
    this.decisions = 0;
    this.goal.set(0, 6, 0);
    this.direction = 1;
    this.maneuver = 'strafe';
    this.routing = false;
    this.retreating = false;
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
    this.goal.y = clamp(position.y + (this.random() - 0.5) * 2.5, BOSS.hover, ARENA.ceiling);
    this.remaining = 2.1;
  }
  /**
   * `sighted` reports whether a candidate waypoint still has a firing lane to the player; a
   * manoeuvre never deliberately flies back behind the cover it has just worked around.
   * `clear` says the boss can see the player right now: far out with a clear lane it stands
   * and casts from range instead of closing first, and only moves in while it recovers.
   * `tellTime` is how far (s) the current telegraph has run: the hunting spell opens with a
   * short, fast break away from the player that settles just before the first orb leaves.
   */
  step(
    dt: number,
    position: Vector3,
    player: Vector3,
    attack: AttackId,
    stage: AttackStage,
    pattern: number,
    sighted?: (goal: Vector3) => boolean,
    clear = false,
    tellTime = Infinity,
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
            : attack === 'vortex'
              ? // The well is seeded from a distance: climb and keep the body in view.
                ['rise', 'strafe', 'flank']
              : ['rise', 'flank', 'low-pass'];
      this.choose(
        position,
        player,
        options[(this.decisions + Math.floor(this.random() * 2)) % options.length],
        sighted,
      );
    } else if (this.maneuver === 'recover' && this.remaining <= 0)
      this.choose(position, player, 'flank', sighted);
    // Emergency range control only; ordinary movement follows its chosen world-space waypoint.
    const delta = this.goal.clone().sub(position);
    const motor = delta
      .multiplyScalar(stage === 'recover' ? 1.6 : 1.25)
      .clampLength(
        0,
        stage === 'recover'
          ? BOSS_MOTOR.recover
          : this.routing
            ? BOSS_MOTOR.routing
            : BOSS_MOTOR.cruise,
      );
    const away = position.clone().sub(player);
    away.y = 0;
    const distance = away.length();
    if (distance < 10) motor.addScaledVector(away.normalize(), (10 - distance) * 2);
    // Long-range casting: a boss that can see its target from far away holds its ground and
    // delivers the spell from there (a slow drift towards its waypoint at most).
    const sniping = clear && stage !== 'recover' && distance > 30 && !this.routing;
    if (sniping) motor.multiplyScalar(0.25);
    // A boss thrown across the larger arena closes back in decisively rather than drifting —
    // unless it is following a routed waypoint around cover, which may lead away first.
    if (distance > 33 && !this.routing && !sniping)
      motor.addScaledVector(away.normalize(), -(distance - 33) * 1.1);
    if (attack === 'hammer' && stage === 'telegraph' && position.y < 6)
      motor.y = Math.max(motor.y, (6 - position.y) * 2);
    const retreat = missileRetreat(attack, stage, tellTime, distance);
    this.retreating = retreat > 1;
    if (retreat > 0 && distance > 0.001) {
      motor.addScaledVector(away.normalize(), retreat);
      // Keep roughly level while backing off, so the break reads as a slide, not a climb.
      motor.y *= 0.4;
    }
    return motor.clampLength(0, this.retreating ? BOSS_MOTOR.retreat : BOSS_MOTOR.max);
  }
  private choose(
    position: Vector3,
    player: Vector3,
    kind: Maneuver,
    sighted?: (goal: Vector3) => boolean,
  ) {
    this.maneuver = kind;
    this.routing = false;
    this.decisions++;
    if (this.random() < 0.42) this.direction *= -1;
    const from = position.clone().sub(player),
      angle = Math.atan2(from.z, from.x);
    const sweep = kind === 'flank' || kind === 'recover' ? 0.85 : kind === 'press' ? 0.22 : 0.5;
    const spin = this.random() * 0.3;
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
    const place = (turn: number) =>
      this.goal.set(
        clamp(player.x + Math.cos(angle + turn) * range, -ARENA.halfSize + 8, ARENA.halfSize - 8),
        clamp(altitude, BOSS.hover, ARENA.ceiling),
        clamp(player.z + Math.sin(angle + turn) * range, -ARENA.halfSize + 8, ARENA.halfSize - 8),
      );
    place(this.direction * (sweep + spin));
    if (sighted && !sighted(this.goal)) {
      // The preferred sweep ends behind cover: try the other way round, then shorter arcs on
      // either side, and finally the current bearing. The first clear spot wins; when every
      // option is covered the original goal stands and the navigator routes around.
      const fallbacks = [
        -this.direction * (sweep + spin),
        this.direction * sweep * 0.45,
        -this.direction * sweep * 0.45,
        0,
      ];
      const found = fallbacks.find((turn) => sighted(place(turn)));
      if (found === undefined) place(this.direction * (sweep + spin));
      else if (found < 0 !== this.direction < 0 && found !== 0) this.direction *= -1;
    }
    this.remaining = 1.5 + this.random() * 1.4;
  }
}

/** Satellite circles orbit well outside the boss body (about 3 m out), ahead of its glyph. */
export const FIRE_GATE_RADIUS = 2.95;
/** Successive packets sweep a wide arc around the frontal glyph, as in reference2. */
/** Gates drift along the ring while they are open; alternate patterns orbit the other way. */
export const FIRE_GATE_ORBIT = 0.7;
export function fireGateOffset(
  index: number,
  pattern: number,
): { local: Vector3; side: number; angle: number; radius: number; spin: number } {
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
    local: fireGateLocal(angle, radius),
    side: index % 4,
    angle,
    radius,
    spin: (pattern % 2 ? -1 : 1) * FIRE_GATE_ORBIT,
  };
}
/** Local gate position on the frontal ring of the glyph for a given polar angle. */
export function fireGateLocal(angle: number, radius: number): Vector3 {
  return new Vector3(Math.cos(angle) * radius, 0.1 + Math.sin(angle) * radius, 1.45);
}

/**
 * Backward speed (m/s) the boss adds while the hunting spell charges: a full burst for the
 * first half second of the tell, eased out before the cast, and none once it is already far.
 */
export function missileRetreat(
  attack: AttackId,
  stage: AttackStage,
  tellTime: number,
  distance: number,
): number {
  if (attack !== 'missiles' || stage !== 'telegraph' || !Number.isFinite(tellTime)) return 0;
  const t = clamp(
      (tellTime - MISSILE_RETREAT.burst) / (MISSILE_RETREAT.settle - MISSILE_RETREAT.burst),
      0,
      1,
    ),
    ease = 1 - t * t * (3 - 2 * t),
    room = clamp((MISSILE_RETREAT.range - distance) / 12, 0, 1);
  return BOSS_MOTOR.retreat * ease * room;
}
