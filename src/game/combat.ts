import { Vector3 } from 'three';
import { clamp, segmentSphere, seededRandom, type Point3 } from './math';

/** Main duel timings and thresholds; deliberately tunable against additional reference footage. */
/**
 * Nova can be held: a tap is the ordinary blast, a hold of `time` seconds charges it. The
 * charged blast reaches further, throws harder and costs more; its damage is unchanged.
 */
export const NOVA_CHARGE = {
  time: 0.6,
  cost: 1.8,
  radius: 1.5,
  launch: 1.35,
} as const;

/**
 * Prisma. A tap raises a small prism circle at a random point on a ring around the body;
 * a moment later the circle fires a thin beam at the aim and then hangs alongside the body —
 * every circle rides with the one who raised it, in first person with the view — until it
 * shatters. The button held past `holdAfter` raises one large circle ahead of the body
 * instead, which charges for `chargeTime` and fires a heavy beam on release.
 */
/**
 * Nothing is thrown at a range limit. Every projectile and beam flies until it strikes the
 * ground, a wall, a shield or a body; `FAR_REACH` is only the barrier met when something is
 * aimed at empty sky, so nothing is ever seen to wink out in mid-air.
 */
export const FAR_REACH = 520;

export const PRISMA = {
  /** Seconds from the tap to the circle starting to materialise. */
  circleDelay: 0.06,
  /** Seconds the circle takes to materialise once it begins — slow enough to be watched. */
  appear: 0.15,
  /** Seconds from the circle starting to its beam leaving (tap to hit ≈ 0.22 s). */
  beamDelay: 0.16,
  /** Seconds the small beam stays up, fading over its tail instead of blinking out. */
  beamLife: 0.4,
  /** Seconds the circle hangs after its beam before shattering. */
  linger: 0.45,
  /** The ring around the body centre the small circles are raised on, in metres. */
  ring: { min: 1.6, max: 2.9 },
  /** From the eyes the ring sits ahead of the view, tighter so it stays in frame. */
  eyeRing: { min: 0.8, max: 1.5, depth: 2.2 },
  /** Radians between consecutive circle angles, so a volley spreads around the body. */
  minTurn: 0.9,
  /** Seconds of holding before the large circle begins (a tap never shows it). */
  holdAfter: 0.22,
  /** Seconds for the large circle to charge once begun. */
  chargeTime: 0.6,
  /** How far a beam is followed when it meets nothing at all — a barrier in the far blue. */
  reach: FAR_REACH,
  circleRadius: 0.72,
  beamRadius: 0.085,
  /**
   * How far off its own line a beam still breaks enemy fire: a lance of light is a defensive
   * tool, so its corridor is generous rather than a razor's width — wide enough that a rake
   * of bolts from the boss's (grown) gate ring still flies into it.
   */
  sweep: 3.0,
  /**
   * Where on the ring the dice prefer to land. The ring stands square to the view, so its own
   * "right" is the screen's right: the flanks (angle 0, or π on the other side) put a circle
   * beside the body, clear of the crosshair and of whatever is being aimed at, while straight
   * up and down the ring is where the sight line lives. `viewBias` is how often the flank band
   * is drawn from — the rest of the draws still fall anywhere, so the ring keeps its surprise.
   */
  flank: 0,
  viewBias: 0.7,
  /** Half-width of the flank band, in radians: 0.55 keeps the circles well off dead centre. */
  viewBiasSpread: 0.55,
  /**
   * The heavy beam of the large circle. Damage is spent through the heavy-hit path, and the
   * impulse is a launch in Nova's class — a little short of it — so the lance throws the boss.
   */
  big: {
    damage: 90,
    cost: 20,
    radius: 0.5,
    circleRadius: 1.5,
    impulse: 115,
    linger: 0.45,
    /** The heavy lance's own corridor: wider, and it breaks the sphere and the seed too. */
    sweep: 2.8,
    /** Radius of the wound the lance tears out of a slab too thick to bore through. */
    crater: 2.9,
  },
} as const;

/** The shortest angular distance between two directions on the ring. */
export function ringDistance(a: number, b: number) {
  const d = Math.abs(a - b) % (Math.PI * 2);
  return d > Math.PI ? Math.PI * 2 - d : d;
}

/**
 * Where the next small circle goes on the ring: a random angle, re-drawn until it lies at
 * least `minTurn` away from the previous one, so a quick volley wreathes the body instead of
 * stacking circles.
 */
export function prismaAngle(
  random: () => number,
  previous: number | null,
  /**
   * Ring angle that puts a circle beside the body, clear of the sight line. With it, most draws
   * land in a narrow band on either flank and the rest anywhere on the ring; with it null the
   * dice are even all the way round.
   */
  flank: number | null = null,
  weight: number = PRISMA.viewBias,
  spread: number = PRISMA.viewBiasSpread,
): number {
  const roll = () => {
    if (flank === null || random() >= weight) return random() * Math.PI * 2;
    // Either flank: the two sides are each other's mirror across the body.
    return (random() < 0.5 ? flank : flank + Math.PI) + (random() * 2 - 1) * spread;
  };
  let angle = roll();
  for (let i = 0; i < 8 && previous !== null && ringDistance(angle, previous) < PRISMA.minTurn; i++)
    angle = roll();
  if (previous !== null && ringDistance(angle, previous) < PRISMA.minTurn)
    angle = previous + Math.PI;
  const full = Math.PI * 2;
  return ((angle % full) + full) % full;
}

/**
 * The state of a held Prisma: nothing before `holdAfter` (that is a tap), then the charge of
 * the large circle, which is ready once full and affordable.
 */
export function prismaHold(hold: number, energy: number, began: number = PRISMA.holdAfter) {
  const charging = hold >= PRISMA.holdAfter;
  const progress = charging
    ? Math.max(0, Math.min(1, (hold - Math.max(began, PRISMA.holdAfter)) / PRISMA.chargeTime))
    : 0;
  return { charging, progress, charged: progress >= 1 && energy >= PRISMA.big.cost };
}

/** The state of a held Nova: how charged it is and what a release right now would do. */
export function novaCharge(hold: number, energy: number, baseCost: number) {
  const progress = Math.max(0, Math.min(1, hold / NOVA_CHARGE.time));
  const cost = Math.round(baseCost * NOVA_CHARGE.cost);
  const charged = progress >= 1 && energy >= cost;
  return {
    progress,
    charged,
    cost: charged ? cost : baseCost,
    radius: charged ? NOVA_CHARGE.radius : 1,
    launch: charged ? NOVA_CHARGE.launch : 1,
  };
}

/**
 * FALL — the player's gravity spell, and the first of its school. It is *held*, not tapped:
 * pressing raises the pressure over the boss (a breath of build while the column locks on),
 * then the boss is driven into the ground at slam speed and kept there for as long as the
 * button stays down. It cannot break out; the spell ends only when the caster lets go or
 * runs out of energy. While it holds, pressure accumulates — visible as the cracks glowing
 * wider — and a deliberate release spends it in one final crush. Holding past full pressure
 * leaks it away and costs more energy by the second, so the release is a decision, not a
 * formality.
 */
export const FALL = {
  /**
   * Seconds between the press and the slam landing. The FALL title stands alone for the
   * first part of this, then the column gathers, then the weight lands — never all at once.
   */
  build: 0.85,
  /** Downward speed of the slam, metres per second — a launch, not a fall. */
  slamSpeed: 320,
  /** Damage of the slam before the height bonus. */
  slamDamage: 46,
  /** Extra slam damage at the greatest height it can be caught from (capped). */
  slamHeightBonus: 38,
  /** Height over the ground at which the slam bonus stops growing, metres. */
  slamHeightCap: 26,
  /** FALL costs no energy and has no cooldown: the hold itself is the whole price. */
  cost: 0,
  /** Seconds of holding to reach full stored pressure. */
  pressureTime: 3,
  /** Fraction of full pressure leaking away per second while held past full. */
  pressureLeak: 0.12,
  /** Seconds between crush pulses while the boss is held down. */
  crushInterval: 0.4,
  /** Damage of one crush pulse. */
  crushDamage: 8,
  /** Release damage before the stored-pressure share. */
  releaseBase: 22,
  /** Extra release damage at full stored pressure. */
  releasePressureDamage: 58,
  /** Seconds after release that the boss still rises and moves as if weighted. */
  lingerTime: 2.4,
  /** Radius of the cracked, sinking ground at first impact, growing with pressure. */
  crackRadius: { start: 16, full: 25 },
  cooldown: 0,
} as const;

/** Stored pressure (0..1) after holding this long: fills over `pressureTime`, then leaks. */
export function fallPressure(heldSeconds: number): number {
  const fill = clamp(heldSeconds / FALL.pressureTime, 0, 1);
  if (heldSeconds <= FALL.pressureTime) return fill;
  return Math.max(0, 1 - (heldSeconds - FALL.pressureTime) * FALL.pressureLeak);
}

/** Slam damage for a boss caught `height` metres over its ground. */
export function fallSlamDamage(height: number): number {
  const share = clamp(height / FALL.slamHeightCap, 0, 1);
  return Math.round(FALL.slamDamage + FALL.slamHeightBonus * share);
}

/** Damage of the closing crush when the caster lets go. */
export function fallReleaseDamage(pressure: number): number {
  return Math.round(FALL.releaseBase + FALL.releasePressureDamage * clamp(pressure, 0, 1));
}

export const DUEL = {
  bossHealth: 2400,
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
  shieldPatchHits: 10,
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

/**
 * Last-line shield position when a projectile reaches the body before a predictive patch can
 * stand. Preserve the shot's transverse lane (clamped to the body footprint) instead of
 * snapping every emergency patch to the chest centre; the projectile still meets the plate.
 */
export function shieldBodyInterceptOffset(
  relativeStart: Vector3,
  relativeEnd: Vector3,
  fraction: number,
  projectileVelocity: Vector3,
): Vector3 {
  const towardSource = projectileVelocity.clone().normalize().negate(),
    contact = relativeStart.clone().lerp(relativeEnd, clamp(fraction, 0, 1)),
    lateral = contact.addScaledVector(towardSource, -contact.dot(towardSource));
  lateral.clampLength(0, DUEL.bodyRadius);
  return lateral.addScaledVector(towardSource, DUEL.shieldNear);
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

export type AttackId = 'fire' | 'missiles' | 'hammer' | 'vortex' | 'summon';
export const ATTACK_ORDER: readonly AttackId[] = ['fire', 'missiles', 'hammer', 'vortex', 'summon'];
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
  /**
   * The boss calls three lesser constructs of its own kind to its side: small kin of the
   * boss itself — stone, ember and sigil — that dart around the player and spit small
   * straight fireballs, like the boss's own fire but with no homing in them and half the
   * bite, so weaving beats them where the boss's salvo would track.
   */
  summon: {
    label: 'PENJAGA SURYA',
    warning: 'PENJAGA DIPANGGIL',
    tell: 1.3,
    duration: 0.6,
    recovery: 1.4,
    shots: 1,
    interval: 0.1,
  },
} as const;

/** SUMMON — how many guards one call raises; a fresh call only tops the retinue back up. */
export const SUMMON = {
  count: 3,
} as const;

/**
 * The lesser constructs the boss calls — a standing enemy kind, not a boss-only trick:
 * anything that can field enemies (a future world encounter included) fields these. Small
 * kin of the boss: they hover, circle their quarry, dash to fresh angles, and spit the
 * fire school straight and weak. Every player attack can hurt them, and FALL's gravity
 * takes them exactly as it takes their master.
 */
export const ENEMY = {
  /** Sturdy enough to need a few real hits: three Bara bolts, or a Nova and a finisher. */
  health: 90,
  /** Collision radius of one construct, metres. */
  radius: 0.72,
  /** Their spit: straight fireballs, slower and weaker than the boss's own fire. */
  shotSpeed: 24,
  shotDamage: 6,
  /** Smaller body than the boss's bolts, and a fraction of their shove on a hit. */
  shotRadius: 0.22,
  shotPower: 0.2,
  /** Seconds between one construct's shots (randomised per construct in this band). */
  shotInterval: { min: 2.1, max: 3.2 },
  /** Orbit band around the quarry, metres. */
  orbitRadius: { min: 7.5, max: 11 },
  /** Tangential drift speed while circling, metres per second. */
  strafeSpeed: 7.5,
  /** Burst speed of a repositioning dash, metres per second. */
  dashSpeed: 17,
  /** Seconds between dashes (randomised per construct in this band). */
  dashInterval: { min: 1.5, max: 2.7 },
  /** Slam damage FALL deals them on impact — the crush, not the boss's full weight. */
  fallSlam: 16,
  /** Seconds spent grounded after FALL lets go before a construct rises again. */
  holdStagger: 0.9,
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
  /**
   * A cast broken before it leaves: the tell collapses, nothing is fired, and the
   * director simply recovers into its next pattern. FALL does this on impact, whatever
   * the boss was winding up.
   */
  interrupt() {
    if (this.stage === 'recover') return;
    this.stage = 'recover';
    this.elapsed = 0;
    this.fired = 0;
    this.opening = false;
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
    : attack === 'fire' || attack === 'summon'
      ? 'fire'
      : attack === 'vortex'
        ? 'vortex'
        : 'hammer';
}
/** The same radius drives the visible core, shield size and swept collision. */
export const PROJECTILES = {
  player: { radius: 0.17, speed: 44, range: FAR_REACH, launch: 0, pause: 0, slow: 0, stagger: 0 },
  fire: {
    radius: 0.32,
    speed: 36,
    range: FAR_REACH,
    launch: 44,
    pause: 0.09,
    slow: 0,
    stagger: 0.85,
  },
  missile: {
    radius: 0.34,
    speed: 28,
    range: FAR_REACH,
    launch: 72,
    pause: 0.12,
    slow: 0,
    stagger: 1.2,
  },
  hammer: {
    radius: 1.25,
    speed: 37,
    range: FAR_REACH,
    launch: 150,
    pause: DUEL.heavyFreeze,
    slow: DUEL.heavySlow,
    stagger: 1.5,
  },
  /** The vortex seed: harmless in flight, but its core detonation is a heavy contact. */
  vortex: {
    radius: 0.55,
    speed: 31,
    range: FAR_REACH,
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
