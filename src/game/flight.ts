import { Vector3 } from 'three';
import { FLIGHT } from './config';
import { springVector } from './motion';

/** Camera-relative six-axis flight. Neutral input brakes to a hover; there is no idle gravity. */
export function flightWish(
  x: number,
  forward: number,
  lift: number,
  yaw: number,
  pitch: number,
): Vector3 {
  const c = Math.cos(pitch),
    s = Math.sin(pitch);
  const wish = new Vector3(
    x * Math.cos(yaw) - forward * Math.sin(yaw) * c,
    forward * s + lift,
    -x * Math.sin(yaw) - forward * Math.cos(yaw) * c,
  ).clampLength(0, 1);
  wish.x *= FLIGHT.speed;
  wish.z *= FLIGHT.speed;
  wish.y *= FLIGHT.verticalSpeed;
  return wish;
}
export function smoothFlight(velocity: Vector3, target: Vector3, dt: number): Vector3 {
  const rate = target.lengthSq() > 0.01 ? FLIGHT.acceleration : FLIGHT.braking;
  return velocity.clone().lerp(target, 1 - Math.exp(-Math.max(0, dt) * rate));
}
/**
 * Speed multiplier the motor keeps after a dash: full boost while `remaining` is still inside
 * the hold, then a smooth ease back to 1 over the rest of `FLIGHT.boostDuration`.
 */
export function dashBoost(remaining: number): number {
  if (remaining <= 0) return 1;
  const tail = FLIGHT.boostDuration - FLIGHT.boostHold;
  const k = Math.min(1, remaining / tail);
  return 1 + FLIGHT.boost * k * k * (3 - 2 * k);
}

/** Jerk-soft flight motor. Acceleration persists across starts, stops and reversals. */
export function advanceFlight(
  velocity: Vector3,
  acceleration: Vector3,
  target: Vector3,
  dt: number,
) {
  springVector(
    velocity,
    acceleration,
    target,
    target.lengthSq() > 0.05 ? FLIGHT.acceleration : FLIGHT.braking,
    dt,
  );
}
