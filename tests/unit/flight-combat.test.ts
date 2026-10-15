import { beforeAll, describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import {
  ATTACKS,
  DUEL,
  HitPause,
  PROJECTILES,
  guideMissile,
  novaCharge,
  NOVA_CHARGE,
  salvoSpread,
  shieldCovers,
  shieldScale,
} from '../../src/game/combat';
import { flightWish, smoothFlight } from '../../src/game/flight';
import { segmentSphere } from '../../src/game/math';
import { FLIGHT } from '../../src/game/config';
import { CAMERA_RANGES, DEFAULT_SETTINGS, SPELLS, readSettings } from '../../src/game/types';

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
    it(`can hit an aligned stationary target at ${distance}m`, () => {
      for (const heading of [0]) expect(intercept(distance, heading, 1 / 120)).toBeLessThan(3);
    });
  it('does not snap sideways or turn around after passing the player', () => {
    expect(intercept(3.5, Math.PI / 2, 1 / 120, new Vector3(0, 0, 8))).toBe(Infinity);
    expect(intercept(3.5, Math.PI, 1 / 120)).toBe(Infinity);
  });
  it('locks on moderately: catches a slow drift at range, but not a full-speed strafe', () => {
    const strafe = new Vector3(0, 0, 14.5),
      drift = new Vector3(0, 0, 6);
    for (const distance of [12, 20, 30])
      expect(intercept(distance, 0, 1 / 120, strafe)).toBe(Infinity);
    for (const distance of [30, 40])
      expect(intercept(distance, 0, 1 / 120, drift)).toBeLessThan(2.5);
    expect(PROJECTILES.missile.speed).toBeLessThan(30);
  });
  it('commits to a terminal course that a late dodge can evade', () => {
    const state = { committed: false },
      p = new Vector3(0, 0, -4),
      v = new Vector3(0, 0, 24);
    guideMissile(p, v, new Vector3(), new Vector3(), 0.5, 1 / 60, state);
    expect(state.committed).toBe(true);
    const next = guideMissile(p, v, new Vector3(10, 0, 0), new Vector3(), 0.7, 0.1, state);
    expect(next.x).toBeCloseTo(0);
    expect(next.z).toBeGreaterThan(0);
  });
});

describe('longer spread salvo and contact timing', () => {
  it('authors a longer, wider salvo without random per-frame aiming', () => {
    expect(ATTACKS.fire.duration).toBeGreaterThan(3);
    const spread = Array.from({ length: ATTACKS.fire.shots }, (_, i) => salvoSpread(i));
    expect(spread.some((s) => s.yaw > 0.1)).toBe(true);
    expect(spread.some((s) => s.yaw < -0.1)).toBe(true);
    expect(spread.some((s) => s.pitch > 0.08)).toBe(true);
    expect(spread.some((s) => s.pitch < -0.05)).toBe(true);
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
  it('holds heavy contacts as a short freeze plus a slow-motion tail, light contacts briefly', () => {
    expect(PROJECTILES.hammer.pause).toBeCloseTo(DUEL.heavyFreeze);
    expect(PROJECTILES.hammer.slow).toBeCloseTo(DUEL.heavySlow);
    expect(DUEL.heavyFreeze).toBeCloseTo(0.15);
    expect(DUEL.heavyFreeze + DUEL.heavySlow).toBeCloseTo(0.5);
    expect(PROJECTILES.fire.pause).toBeLessThan(0.15);
    expect(PROJECTILES.fire.slow).toBe(0);
    expect(PROJECTILES.missile.pause).toBeLessThan(0.2);
  });
  it('slow motion starts near one fifth speed and ramps back to real time', () => {
    const pause = new HitPause();
    pause.request(DUEL.heavyFreeze, DUEL.heavySlow);
    expect(pause.scale).toBe(0);
    expect(pause.consume(DUEL.heavyFreeze)).toBe(0);
    expect(pause.scale).toBeCloseTo(HitPause.slowScale);
    // The first real-time slice of the tail yields far less simulated time than it costs.
    const early = pause.consume(0.05);
    expect(early).toBeGreaterThan(0.05 * HitPause.slowScale * 0.9);
    expect(early).toBeLessThan(0.05 * 0.4);
    let simulated = early;
    for (let i = 0; i < 100 && pause.active; i++) simulated += pause.consume(0.01);
    expect(pause.active).toBe(false);
    expect(pause.scale).toBe(1);
    // Integrated: the 0.35 s tail plays out in roughly 0.17 s of simulated time.
    expect(simulated).toBeGreaterThan(0.14);
    expect(simulated).toBeLessThan(0.21);
    expect(pause.consume(0.016)).toBeCloseTo(0.016);
  });
  it('a freeze requested mid-frame eats only the remaining frame budget', () => {
    const pause = new HitPause();
    pause.request(0.1);
    expect(pause.hold(0.03)).toBe(0);
    expect(pause.hold(0.1)).toBeCloseTo(0.03);
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

describe('held Nova', () => {
  const cost = SPELLS[2].cost;
  it('a tap or a short hold is the ordinary blast at the ordinary price', () => {
    for (const hold of [0, 0.1, NOVA_CHARGE.time - 0.01]) {
      const c = novaCharge(hold, 100, cost);
      expect(c.charged).toBe(false);
      expect(c.cost).toBe(cost);
      expect(c.radius).toBe(1);
      expect(c.launch).toBe(1);
      expect(c.progress).toBeLessThan(1);
    }
  });
  it('a full hold widens and hardens the blast and costs more, with the damage untouched', () => {
    const c = novaCharge(NOVA_CHARGE.time, 100, cost);
    expect(c.charged).toBe(true);
    expect(c.progress).toBe(1);
    expect(c.cost).toBe(Math.round(cost * NOVA_CHARGE.cost));
    expect(c.radius).toBe(NOVA_CHARGE.radius);
    expect(c.launch).toBe(NOVA_CHARGE.launch);
    expect(SPELLS[2].damage).toBe(86);
  });
  it('without the energy for the charged price, a long hold falls back to the ordinary blast', () => {
    const c = novaCharge(5, Math.round(cost * NOVA_CHARGE.cost) - 1, cost);
    expect(c.progress).toBe(1);
    expect(c.charged).toBe(false);
    expect(c.cost).toBe(cost);
  });
});

describe('camera settings', () => {
  const storage = new Map<string, string>();
  beforeAll(() => {
    Object.assign(globalThis, {
      matchMedia: () => ({ matches: false }),
      localStorage: {
        getItem: (k: string) => storage.get(k) ?? null,
        setItem: (k: string, v: string) => storage.set(k, v),
      },
    });
  });
  it('defaults sit inside their slider ranges', () => {
    expect(DEFAULT_SETTINGS.fovThird).toBeGreaterThanOrEqual(CAMERA_RANGES.fovThird.min);
    expect(DEFAULT_SETTINGS.fovThird).toBeLessThanOrEqual(CAMERA_RANGES.fovThird.max);
    expect(DEFAULT_SETTINGS.fovFirst).toBeGreaterThanOrEqual(CAMERA_RANGES.fovFirst.min);
    expect(DEFAULT_SETTINGS.fovFirst).toBeLessThanOrEqual(CAMERA_RANGES.fovFirst.max);
    expect(DEFAULT_SETTINGS.cameraDistance).toBeGreaterThanOrEqual(
      CAMERA_RANGES.cameraDistance.min,
    );
    expect(DEFAULT_SETTINGS.cameraDistance).toBeLessThanOrEqual(CAMERA_RANGES.cameraDistance.max);
  });
  it('reads stored values, clamps them to the sliders and ignores junk', () => {
    storage.set('hea-settings', JSON.stringify({ fovThird: 88, fovFirst: 999, cameraDistance: 1 }));
    let s = readSettings();
    expect(s.fovThird).toBe(88);
    expect(s.fovFirst).toBe(CAMERA_RANGES.fovFirst.max);
    expect(s.cameraDistance).toBe(CAMERA_RANGES.cameraDistance.min);
    storage.set('hea-settings', JSON.stringify({ fovThird: 'wide', cameraDistance: null }));
    s = readSettings();
    expect(s.fovThird).toBe(DEFAULT_SETTINGS.fovThird);
    expect(s.cameraDistance).toBe(DEFAULT_SETTINGS.cameraDistance);
  });
});
