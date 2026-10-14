import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import {
  ATTACKS,
  DUEL,
  HitPause,
  PROJECTILES,
  guideMissile,
  salvoSpread,
  shieldCovers,
  shieldScale,
} from '../../src/game/combat';
import { flightWish, smoothFlight } from '../../src/game/flight';
import { segmentSphere } from '../../src/game/math';
import { FLIGHT } from '../../src/game/config';

describe('front and peripheral Aegis', () => {
  const facing = new Vector3(0, 0, -1);
  it('covers front and both sides, but not the rear blind spot', () => {
    for (const source of [new Vector3(0, 0, -4), new Vector3(-4, 0, 0), new Vector3(4, 0, 0)])
      expect(shieldCovers(facing, source)).toBe(true);
    expect(shieldCovers(facing, new Vector3(0, 0, 4))).toBe(false);
    expect(shieldCovers(facing, new Vector3(3, 0, 3))).toBe(false);
  });
  it('rotates with facing, including vertical flight, not the source of the last block', () => {
    expect(shieldCovers(new Vector3(0, 0, 1), new Vector3(0, 0, -4))).toBe(false);
    expect(shieldCovers(new Vector3(0, 1, 0), new Vector3(0, -4, 0))).toBe(false);
    expect(shieldCovers(new Vector3(0, 1, 0), new Vector3(0, 4, 0))).toBe(true);
  });
  it('has a precise, finite arc; hovering/zero vectors cannot create a 360 degree shield', () => {
    const a = ((DUEL.shieldArcDegrees / 2) * Math.PI) / 180;
    expect(shieldCovers(facing, new Vector3(Math.sin(a - 0.01), 0, -Math.cos(a - 0.01)))).toBe(
      true,
    );
    expect(shieldCovers(facing, new Vector3(Math.sin(a + 0.01), 0, -Math.cos(a + 0.01)))).toBe(
      false,
    );
    expect(shieldCovers(new Vector3(), facing)).toBe(false);
  });
  it('gives the large solar sphere a correspondingly larger shield', () => {
    expect(PROJECTILES.hammer.radius).toBeGreaterThan(PROJECTILES.fire.radius * 3);
    expect(shieldScale(PROJECTILES.hammer.radius)).toBeGreaterThan(
      shieldScale(PROJECTILES.fire.radius) * 1.8,
    );
  });
});

describe('spell seeker terminal guidance', () => {
  function intercept(
    distance: number,
    heading: number,
    dt: number,
    targetVelocity = new Vector3(),
  ) {
    const p = new Vector3(distance, 3, 0),
      target = new Vector3(0, 3, 0);
    let v = new Vector3(-Math.cos(heading), 0, Math.sin(heading)).multiplyScalar(15);
    for (let t = 0; t < 4; t += dt) {
      const old = p.clone(),
        oldTarget = target.clone();
      v = guideMissile(p, v, target, targetVelocity, t, dt);
      p.addScaledVector(v, dt);
      target.addScaledVector(targetVelocity, dt);
      expect(v.toArray().every(Number.isFinite)).toBe(true);
      if (
        segmentSphere(
          old.sub(oldTarget),
          p.clone().sub(target),
          new Vector3(),
          DUEL.bodyRadius + PROJECTILES.missile.radius,
        ) !== null
      )
        return t;
    }
    return Infinity;
  }
  for (const distance of [2, 3.5, 6, 12, 22])
    it(`intercepts a stationary target at ${distance}m, even when initially pointing away`, () => {
      for (const heading of [0, Math.PI / 2, Math.PI])
        expect(intercept(distance, heading, 1 / 120)).toBeLessThan(3);
    });
  it('leads ordinary strafing, with no near-range launch lockout', () => {
    expect(intercept(3.5, Math.PI / 2, 1 / 120, new Vector3(0, 0, 8))).toBeLessThan(2);
    expect(intercept(18, 0, 1 / 120, new Vector3(0, 0, 8))).toBeLessThan(3);
  });
  it('still intercepts at a coarse fixed timestep', () => {
    expect(intercept(3.5, Math.PI / 2, 1 / 30)).toBeLessThan(2);
  });
});

describe('longer spread salvo and contact timing', () => {
  it('authors a longer, wider salvo without random per-frame aiming', () => {
    expect(ATTACKS.fire.duration).toBeGreaterThan(3);
    const spread = Array.from({ length: ATTACKS.fire.shots }, (_, i) => salvoSpread(i));
    expect(spread.some((s) => s.yaw > 0.07)).toBe(true);
    expect(spread.some((s) => s.yaw < -0.07)).toBe(true);
    expect(spread.filter((s) => s.yaw === 0 && s.pitch === 0).length).toBeGreaterThanOrEqual(5);
    expect(salvoSpread(4)).toEqual(salvoSpread(4));
  });
  it('holds precisely at contact, then releases the remainder of the frame', () => {
    const pause = new HitPause();
    pause.request(0.105);
    expect(pause.consume(0.04)).toBe(0);
    expect(pause.remaining).toBeCloseTo(0.065);
    expect(pause.consume(0.02)).toBe(0);
    expect(pause.consume(0.06)).toBeCloseTo(0.015);
    expect(pause.remaining).toBe(0);
    expect(pause.consume(0.016)).toBeCloseTo(0.016);
  });
  it('does not carry an old contact pause into a restarted duel', () => {
    const pause = new HitPause();
    pause.request(0.12);
    pause.reset();
    expect(pause.consume(0.1)).toBe(0.1);
  });
});

describe('smooth six-axis flight', () => {
  it('moves in the looked-at direction and has independent lift/descent', () => {
    expect(flightWish(0, 1, 0, 0, Math.PI / 4).y).toBeGreaterThan(0);
    expect(flightWish(0, 0, 1, 0, 0).y).toBe(FLIGHT.verticalSpeed);
    expect(flightWish(0, 0, -1, 0, 0).y).toBe(-FLIGHT.verticalSpeed);
    expect(flightWish(0, 0, 0, 0, 0).length()).toBe(0);
  });
  it('does not gain diagonal speed from combined movement/lift', () => {
    expect(flightWish(1, 1, 1, 0, 0).length()).toBeLessThanOrEqual(FLIGHT.speed);
  });
  it('accelerates and coasts smoothly, independent of frame subdivision', () => {
    const goal = flightWish(0, 1, 0, 0, 0),
      zero = new Vector3();
    const velocity = smoothFlight(zero, goal, 0.1);
    expect(velocity.length()).toBeGreaterThan(0);
    expect(velocity.length()).toBeLessThan(goal.length());
    const coarse = smoothFlight(velocity, zero, 0.1),
      fine = smoothFlight(smoothFlight(velocity, zero, 0.05), zero, 0.05);
    expect(coarse.distanceTo(fine)).toBeLessThan(1e-8);
    expect(coarse.length()).toBeGreaterThan(0);
  });
});
