import { Quaternion, Vector3 } from 'three';
import { clamp } from './math';
import { steerMissile } from './combat';

export const ease = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

/** Exact critically damped spring, with a continuous first derivative across target changes. */
export function springVector(
  value: Vector3,
  rate: Vector3,
  target: Vector3,
  frequency: number,
  dt: number,
) {
  const decay = Math.exp(-frequency * dt);
  for (const axis of ['x', 'y', 'z'] as const) {
    const offset = value[axis] - target[axis],
      carry = rate[axis] + frequency * offset;
    value[axis] = target[axis] + (offset + carry * dt) * decay;
    rate[axis] = (rate[axis] - frequency * carry * dt) * decay;
  }
}

/**
 * The burst dash: an almost instant rise to full speed, a short hold, then a long, fast-
 * decaying glide, so the body snaps away and settles instead of sliding at a constant speed.
 * The first `invulnerableFor` seconds phase through anything the boss throws; a shot that
 * would have landed in that window counts as a perfect dodge.
 */
export class AirDash {
  readonly direction = new Vector3(0, 0, -1);
  readonly velocity = new Vector3();
  age = 10;
  static readonly rise = 0.045;
  static readonly hold = 0.1;
  static readonly fall = 0.33;
  static readonly speed = 37;
  static readonly invulnerableFor = 0.26;
  static readonly duration = AirDash.rise + AirDash.hold + AirDash.fall;
  get active() {
    return this.age < AirDash.duration;
  }
  get invulnerable() {
    return this.age < AirDash.invulnerableFor;
  }
  get strength() {
    if (!this.active) return 0;
    if (this.age < AirDash.rise) return ease(this.age / AirDash.rise);
    const t = clamp((this.age - AirDash.rise - AirDash.hold) / AirDash.fall, 0, 1);
    return Math.pow(1 - t, 1.7);
  }
  start(direction: Vector3) {
    this.direction.copy(direction).normalize();
    this.age = 0;
    this.velocity.set(0, 0, 0);
  }
  reset() {
    this.age = 10;
    this.velocity.set(0, 0, 0);
  }
  step(dt: number, steering: Vector3) {
    if (!this.active) return;
    this.age += dt;
    if (steering.lengthSq() > 0.1)
      this.direction.copy(steerMissile(this.direction, steering, 1.5, dt, 1));
    this.velocity.copy(this.direction).multiplyScalar(AirDash.speed * this.strength);
  }
}

/** A short release ramp, after the contact pause, rather than a velocity teleport. */
export class LaunchRelease {
  private target = new Vector3();
  private age = 1;
  private applied = 1;
  start(impulse: Vector3) {
    this.target.copy(impulse);
    this.age = this.applied = 0;
  }
  cancel() {
    this.age = this.applied = 1;
  }
  step(dt: number, impulse: Vector3) {
    if (this.applied >= 1) return;
    this.age += dt;
    const weight = ease(this.age / 0.008);
    impulse.addScaledVector(this.target, weight - this.applied);
    this.applied = weight;
  }
}

/**
 * Shoulder-first tumble and frictional skid. No ground restitution or idle unconscious delay:
 * the moment the drag slows below `riseSpeed` the body gets up, finishing the last metre of
 * the skid on its feet instead of lying still. A body that keeps flying without touching
 * anything rights itself in mid-air after `airRecovery` seconds instead of waiting for the ground.
 */
export class BodyTumble {
  static readonly airRecovery = 0.85;
  /** Ground speed (m/s) below which a sliding body stands up — no unconscious pause. */
  static readonly riseSpeed = 6.5;
  /** Recovery blend: a short rise from the ground, a longer deliberate flip in the air. */
  static readonly riseBlend = 0.22;
  /** A jointed human figure takes a little longer to gather itself off the ground. */
  static readonly humanRise = 0.3;
  static readonly flipBlend = 0.46;
  /** True while the current recovery is the mid-air somersault. */
  flipping = false;
  private flipSign = 1;
  readonly orientation = new Quaternion();
  readonly angularVelocity = new Vector3();
  active = false;
  phase: 'idle' | 'air' | 'slide' | 'recover' = 'idle';
  weight = 0;
  grounded = false;
  groundTravel = 0;
  bounces = 0;
  landings = 0;
  airTime = 0;
  airRecoveries = 0;
  private wasGrounded = false;
  private groundSpeed = 0;
  private roll = new Vector3();
  private groundRoll = 0;
  private slidePose = new Quaternion();
  private riseStart = new Quaternion();
  constructor(private humanLike = false) {}
  private recoveryTime = 0;
  get physical() {
    return this.phase === 'air' || this.phase === 'slide';
  }
  reset() {
    this.active = this.grounded = this.wasGrounded = false;
    this.phase = 'idle';
    this.weight =
      this.recoveryTime =
      this.groundTravel =
      this.bounces =
      this.landings =
      this.airTime =
      this.airRecoveries =
        0;
    this.groundRoll = 0;
    this.flipping = false;
    this.angularVelocity.set(0, 0, 0);
    this.orientation.identity();
    this.roll.set(0, 0, 0);
  }
  kick(pose: Quaternion, impulse: Vector3) {
    this.orientation.copy(pose);
    this.active = true;
    this.phase = 'air';
    this.weight = 1;
    this.grounded = false;
    this.groundRoll = 0;
    this.airTime = 0;
    this.recoveryTime = this.bounces = this.landings = this.groundTravel = 0;
    const direction = impulse.clone().normalize(),
      axis = new Vector3().crossVectors(direction, new Vector3(0, 1, 0));
    if (axis.lengthSq() < 0.02) axis.set(1, 0, 0.35);
    this.angularVelocity
      .copy(axis.normalize())
      .multiplyScalar(this.humanLike ? 4.8 : 7.2)
      .addScaledVector(direction, this.humanLike ? 0.55 : 1.1)
      .add(new Vector3(0, 0.25, 0));
  }
  beginStep() {
    this.wasGrounded = this.grounded;
    this.grounded = false;
  }
  ground(velocity: Vector3, _bounce: number, radius: number) {
    if (!this.physical) return;
    if (!this.wasGrounded) this.landings++;
    this.grounded = true;
    this.airTime = 0;
    this.phase = 'slide';
    this.groundSpeed = Math.hypot(velocity.x, velocity.z);
    this.roll
      .crossVectors(new Vector3(0, 1, 0), velocity)
      .setY(0)
      .multiplyScalar(0.18 / radius)
      .clampLength(0, this.humanLike ? 4.3 : 5.5);
    if (this.groundSpeed > 0.1)
      this.slidePose.setFromUnitVectors(
        new Vector3(0, 1, 0),
        new Vector3(velocity.x, 0, velocity.z).normalize(),
      );
  }
  collide(normal: Vector3, velocity: Vector3) {
    if (!this.active) return;
    // Touching a wall restarts the free-flight clock: the body keeps tumbling.
    this.airTime = 0;
    const torque = new Vector3()
      .crossVectors(normal, velocity)
      .multiplyScalar(0.1)
      .clampLength(0, 5);
    this.angularVelocity.multiplyScalar(0.6).add(torque).clampLength(0, 12);
  }
  private beginRecovery(flip = false) {
    this.phase = 'recover';
    this.recoveryTime = 0;
    this.riseStart.copy(this.orientation);
    if (flip) {
      // Keep turning the way the body was already spinning about its side axis.
      const sideSpin = this.angularVelocity.dot(
        new Vector3(1, 0, 0).applyQuaternion(this.orientation),
      );
      this.flipSign = sideSpin < 0 ? -1 : 1;
    }
    this.flipping = flip;
    this.angularVelocity.set(0, 0, 0);
  }
  step(dt: number, desired: Quaternion): Quaternion {
    if (!this.active) {
      if (dt <= 0) this.orientation.copy(desired);
      else this.orientation.slerp(desired, 1 - Math.exp(-dt * 22));
      return this.orientation;
    }
    if (dt <= 0) return this.orientation;
    if (this.physical) {
      if (this.grounded) {
        const remaining = Math.max(0, 1 - this.groundRoll / (Math.PI * 1.2));
        this.angularVelocity.lerp(
          this.roll.clone().multiplyScalar(remaining),
          1 - Math.exp(-dt * 9),
        );
        this.groundRoll += this.angularVelocity.length() * dt;
        if (this.groundRoll > 1.1) this.orientation.slerp(this.slidePose, 1 - Math.exp(-dt * 5));
        if (this.groundSpeed <= BodyTumble.riseSpeed) this.beginRecovery();
      } else {
        this.phase = 'air';
        this.airTime += dt;
        this.angularVelocity.multiplyScalar(Math.exp(-dt * 0.7));
        if (this.airTime >= BodyTumble.airRecovery) {
          this.airRecoveries++;
          this.beginRecovery(true);
        }
      }
    }
    const speed = this.angularVelocity.length();
    if (speed > 0.001)
      this.orientation
        .premultiply(
          new Quaternion().setFromAxisAngle(
            this.angularVelocity.clone().divideScalar(speed),
            speed * dt,
          ),
        )
        .normalize();
    if (this.phase === 'recover') {
      this.recoveryTime += dt;
      const blend = this.flipping
          ? BodyTumble.flipBlend
          : this.humanLike
            ? BodyTumble.humanRise
            : BodyTumble.riseBlend,
        k = ease(this.recoveryTime / blend);
      this.orientation.slerpQuaternions(this.riseStart, desired, k);
      if (this.flipping) {
        // One controlled somersault about the body's own side axis, continuing the spin it
        // already had; a full turn at k = 1 lands exactly on the upright pose.
        const turn = Math.PI * 2 * ease(k) * this.flipSign;
        this.orientation.multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), turn));
      }
      this.weight = 1 - k;
      if (this.recoveryTime >= blend) {
        this.active = false;
        this.flipping = false;
        this.phase = 'idle';
        this.weight = 0;
      }
    }
    return this.orientation;
  }
}

/** Height from model origin to its lowest oriented bound, so a sideways block lies ON the floor. */
export function supportHeight(q: Quaternion, halfSize: Vector3, centerY = 0): number {
  const x = new Vector3(1, 0, 0).applyQuaternion(q).y,
    y = new Vector3(0, 1, 0).applyQuaternion(q).y,
    z = new Vector3(0, 0, 1).applyQuaternion(q).y;
  return (
    Math.abs(x) * halfSize.x + Math.abs(y) * halfSize.y + Math.abs(z) * halfSize.z - centerY * y
  );
}
/** Absorb the normal impulse. A steep slam is redirected into a modest skim, never a bounce. */
/**
 * How far the view drops when a body lands at `fall` metres per second. Tuned against the jump:
 * a plain hop lands at 9.6 and gives about 1.5 cm, a fall from nine metres about eight, and
 * anything slower than 7 m/s is not worth a flinch.
 */
export function landingDip(fall: number, cap: number): number {
  return Math.min(cap, Math.max(0, (fall - 7) * 0.0057));
}
export function landingSlide(velocity: Vector3, away: Vector3): Vector3 {
  const speed = Math.hypot(velocity.x, velocity.z),
    normal = Math.max(0, -velocity.y);
  const retention = normal > 12 ? 0.94 : 1;
  const result = new Vector3(velocity.x * retention, 0, velocity.z * retention);
  if (speed < 10 && normal > 18) {
    const tangent = away.clone().setY(0);
    if (tangent.lengthSq() < 0.001) tangent.set(0, 0, 1);
    result.copy(tangent.normalize()).multiplyScalar(Math.min(28, normal * 0.28));
  }
  return result;
}
/** Continuous ground friction preserves a visible skid, but cannot accelerate a resting body. */
export function groundFriction(velocity: Vector3, dt: number) {
  const speed = Math.hypot(velocity.x, velocity.z);
  if (speed < 1e-6) return;
  const next = Math.max(0, (speed + 7) * Math.exp(-dt) - 7),
    factor = next / speed;
  velocity.x *= factor;
  velocity.z *= factor;
}

/** Blends both steering authority and drag back in, without a hard recovery-time switch. */
export function recoveryBlend(remaining: number): number {
  return 1 - ease(remaining / 0.7);
}

/**
 * How far a hovering construct leans into its own motion: a roll into lateral speed and a
 * nose-down pitch with forward (and climbing) speed, in radians, relative to `maxSpeed`.
 */
export function hoverLean(
  velocity: Vector3,
  forward: Vector3,
  right: Vector3,
  maxSpeed: number,
): { roll: number; pitch: number } {
  const lateral = velocity.dot(right) / maxSpeed,
    ahead = velocity.dot(forward) / maxSpeed,
    climb = velocity.y / maxSpeed;
  return {
    roll: clamp(-lateral * 0.46, -0.4, 0.4),
    pitch: clamp(ahead * 0.17 - climb * 0.12, -0.24, 0.24),
  };
}
