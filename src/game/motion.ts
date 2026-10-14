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

/** Torque-driven blockout ragdoll: free rotation, collision torque, then a soft pose recovery. */
export class BodyTumble {
  readonly orientation = new Quaternion();
  readonly angularVelocity = new Vector3();
  active = false;
  weight = 0;
  private hold = 0;
  private recoveryTime = 0;
  reset() {
    this.active = false;
    this.hold = this.weight = this.recoveryTime = 0;
    this.angularVelocity.set(0, 0, 0);
    this.orientation.identity();
  }
  kick(pose: Quaternion, impulse: Vector3) {
    this.orientation.copy(pose);
    this.active = true;
    this.hold = 0.65;
    this.weight = 1;
    this.recoveryTime = 0;
    const direction = impulse.clone().normalize(),
      axis = new Vector3().crossVectors(direction, new Vector3(0, 1, 0));
    if (axis.lengthSq() < 0.02) axis.set(1, 0, 0.35);
    this.angularVelocity
      .copy(axis.normalize())
      .multiplyScalar(8.5)
      .addScaledVector(direction, 3.2)
      .add(new Vector3(0, 1.3, 0));
  }
  collide(normal: Vector3, velocity: Vector3) {
    if (!this.active) return;
    const torque = new Vector3()
      .crossVectors(normal, velocity)
      .multiplyScalar(0.1)
      .clampLength(0, 5);
    this.angularVelocity.multiplyScalar(0.6).add(torque).clampLength(0, 12);
    this.hold = Math.max(this.hold, 0.12);
  }
  step(dt: number, desired: Quaternion): Quaternion {
    if (!this.active) {
      if (dt <= 0) this.orientation.copy(desired);
      else this.orientation.slerp(desired, 1 - Math.exp(-dt * 22));
      return this.orientation;
    }
    if (dt <= 0) return this.orientation;
    this.hold = Math.max(0, this.hold - dt);
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
    this.angularVelocity.multiplyScalar(Math.exp(-dt * (this.hold > 0 ? 1.2 : 8)));
    if (this.hold === 0) {
      this.recoveryTime += dt;
      this.orientation.slerp(desired, 1 - Math.exp(-dt * 7));
      this.weight = clamp(
        this.orientation.angleTo(desired) / 1.2 + this.angularVelocity.length() * 0.05,
        0,
        1,
      );
      if (this.weight < 0.006 || (this.recoveryTime > 1 && this.angularVelocity.length() < 0.08)) {
        this.active = false;
        this.weight = 0;
      }
    }
    return this.orientation;
  }
}

/** Blends both steering authority and drag back in, without a hard recovery-time switch. */
export function recoveryBlend(remaining: number): number {
  return 1 - ease(remaining / 0.7);
}
