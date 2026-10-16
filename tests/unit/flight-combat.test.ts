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
  PRISMA,
  prismaAngle,
  prismaHold,
  ringDistance,
  salvoSpread,
  shieldCovers,
  shieldScale,
} from '../../src/game/combat';
import { flightWish, smoothFlight } from '../../src/game/flight';
import { seededRandom, segmentSphere } from '../../src/game/math';
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

describe('Prisma circles and the held lance', () => {
  it('spreads consecutive circles around the ring instead of stacking them', () => {
    const random = seededRandom(99);
    let previous: number | null = null;
    for (let i = 0; i < 40; i++) {
      const angle = prismaAngle(random, previous);
      expect(angle).toBeGreaterThanOrEqual(0);
      expect(angle).toBeLessThan(Math.PI * 2);
      if (previous !== null)
        expect(ringDistance(angle, previous)).toBeGreaterThanOrEqual(PRISMA.minTurn);
      previous = angle;
    }
  });
  it('falls back to the opposite side when the dice keep landing on the last angle', () => {
    const stuck = () => 0.25;
    const first = prismaAngle(stuck, null);
    expect(ringDistance(prismaAngle(stuck, first), first)).toBeCloseTo(Math.PI, 5);
    expect(ringDistance(0.1, Math.PI * 2 - 0.1)).toBeCloseTo(0.2, 10);
  });
  it('a tap never charges; a hold starts the large circle after the threshold and fills it in 0.6 s', () => {
    expect(prismaHold(0.1, 100).charging).toBe(false);
    expect(prismaHold(PRISMA.holdAfter - 0.01, 100).progress).toBe(0);
    const mid = prismaHold(PRISMA.holdAfter + PRISMA.chargeTime / 2, 100);
    expect(mid.charging).toBe(true);
    expect(mid.progress).toBeCloseTo(0.5, 5);
    expect(mid.charged).toBe(false);
    const full = prismaHold(PRISMA.holdAfter + PRISMA.chargeTime, PRISMA.big.cost);
    expect(full.progress).toBe(1);
    expect(full.charged).toBe(true);
    expect(prismaHold(5, PRISMA.big.cost - 1).charged).toBe(false);
    // A circle raised late (energy arrived mid-hold) counts its charge from when it rose.
    expect(prismaHold(1.0, 100, 0.8).progress).toBeCloseTo(1 / 3, 5);
  });
  it('forms each circle before its beam leaves, and lets the beam burn on after it', () => {
    // The circle opens over `appear`; the beam waits at least that long, so it never fires
    // out of a half-formed ring.
    expect(PRISMA.appear).toBeLessThanOrEqual(PRISMA.beamDelay);
    expect(PRISMA.beamDelay).toBeGreaterThan(0.1);
    // The beam lingers well past the frame it was fired on instead of blinking out.
    expect(PRISMA.beamLife).toBeGreaterThan(0.3);
    // A circle big enough to read as a ring, not a bead on the end of the beam.
    expect(PRISMA.circleRadius).toBeGreaterThan(PRISMA.beamRadius * 5);
    expect(PRISMA.big.circleRadius).toBeGreaterThan(PRISMA.big.radius * 2);
  });
  it('keeps the agreed prices: cheap quick beams, a heavy lance at 90 for 20', () => {
    expect(SPELLS[1].cost).toBe(2);
    expect(SPELLS[1].damage).toBe(15);
    expect(SPELLS[1].cooldown).toBe(0.3);
    expect(PRISMA.big).toMatchObject({ damage: 90, cost: 20, radius: 0.5 });
    expect(PRISMA.big.impulse).toBeGreaterThan(10);
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
