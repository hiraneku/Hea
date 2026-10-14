import { Quaternion, Vector3 } from 'three';
import { clamp } from './math';
import { steerMissile } from './combat';
import { HEAVY } from './config';

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

export class AirDash {
  readonly direction = new Vector3(0, 0, -1);
  readonly velocity = new Vector3();
  age = 10;
  static readonly rise = 0.06;
  static readonly hold = 0.09;
  static readonly fall = 0.35;
  static readonly duration = AirDash.rise + AirDash.hold + AirDash.fall;
  get active() {
    return this.age < AirDash.duration;
  }
  get invulnerable() {
    return this.age < 0.23;
  }
  get strength() {
    if (!this.active) return 0;
    if (this.age < AirDash.rise) return ease(this.age / AirDash.rise);
    return 1 - ease((this.age - AirDash.rise - AirDash.hold) / AirDash.fall);
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
    this.velocity.copy(this.direction).multiplyScalar(34 * this.strength);
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
    const weight = ease(this.age / 0.035);
    impulse.addScaledVector(this.target, weight - this.applied);
    this.applied = weight;
  }
}

/** Torque-driven block body: fall -> bounce/roll/slide -> settle -> recover. */
export class BodyTumble {
  readonly orientation = new Quaternion();
  readonly angularVelocity = new Vector3();
  active = false;
  phase: 'idle' | 'air' | 'slide' | 'recover' = 'idle';
  weight = 0;
  grounded = false;
  groundTravel = 0;
  bounces = 0;
  landings = 0;
  private wasGrounded = false;
  private groundSpeed = 0;
  private roll = new Vector3();
  private settled = 0;
  private recoveryTime = 0;
  get physical() {
    return this.phase === 'air' || this.phase === 'slide';
  }
  reset() {
    this.active = this.grounded = this.wasGrounded = false;
    this.phase = 'idle';
    this.weight =
      this.settled =
      this.recoveryTime =
      this.groundTravel =
      this.bounces =
      this.landings =
        0;
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
    this.settled = this.recoveryTime = this.bounces = this.landings = this.groundTravel = 0;
    const direction = impulse.clone().normalize(),
      axis = new Vector3().crossVectors(direction, new Vector3(0, 1, 0));
    if (axis.lengthSq() < 0.02) axis.set(1, 0, 0.35);
    this.angularVelocity
      .copy(axis.normalize())
      .multiplyScalar(8.5)
      .addScaledVector(direction, 3.2)
      .add(new Vector3(0, 1.3, 0));
  }
  beginStep() {
    this.wasGrounded = this.grounded;
    this.grounded = false;
  }
  ground(velocity: Vector3, bounce: number, radius: number) {
    if (!this.physical) return;
    if (!this.wasGrounded) this.landings++;
    if (bounce > 0) {
      this.bounces++;
      this.phase = 'air';
      this.grounded = false;
      this.settled = 0;
      return;
    }
    this.grounded = true;
    this.phase = 'slide';
    this.groundSpeed = Math.hypot(velocity.x, velocity.z);
    this.roll
      .crossVectors(new Vector3(0, 1, 0), velocity)
      .setY(0)
      .multiplyScalar(0.65 / radius)
      .clampLength(0, 10);
  }
  collide(normal: Vector3, velocity: Vector3) {
    if (!this.active) return;
    const torque = new Vector3()
      .crossVectors(normal, velocity)
      .multiplyScalar(0.1)
      .clampLength(0, 5);
    this.angularVelocity.multiplyScalar(0.6).add(torque).clampLength(0, 12);
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
        this.angularVelocity.lerp(this.roll, 1 - Math.exp(-dt * 5));
        this.settled = this.groundSpeed < 2.4 ? this.settled + dt : 0;
        if (this.settled > 0.22) {
          this.phase = 'recover';
          this.recoveryTime = 0;
        }
      } else {
        this.phase = 'air';
        this.settled = 0;
        this.angularVelocity.multiplyScalar(Math.exp(-dt * 0.7));
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
      this.angularVelocity.multiplyScalar(Math.exp(-dt * 9));
      this.orientation.slerp(desired, 1 - Math.exp(-dt * 6));
      this.weight = 1 - ease(this.recoveryTime / 0.85);
      if (this.recoveryTime >= 1) {
        this.active = false;
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
export function groundBounce(normalSpeed: number): number {
  return normalSpeed > HEAVY.bounceThreshold ? Math.min(HEAVY.maxBounce, normalSpeed * 0.23) : 0;
}
/** Continuous ground friction preserves a visible skid, but cannot accelerate a resting body. */
export function groundFriction(velocity: Vector3, dt: number) {
  const speed = Math.hypot(velocity.x, velocity.z);
  if (speed < 1e-6) return;
  const next = Math.max(0, (speed + 5 / 0.9) * Math.exp(-0.9 * dt) - 5 / 0.9),
    factor = next / speed;
  velocity.x *= factor;
  velocity.z *= factor;
}

/** Blends both steering authority and drag back in, without a hard recovery-time switch. */
export function recoveryBlend(remaining: number): number {
  return 1 - ease(remaining / 0.7);
}
