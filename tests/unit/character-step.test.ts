import { describe, expect, it } from 'vitest';
import { sampleLocomotionStep, sampleSprintStep } from '../../src/character/CharacterLocomotion';

describe('procedural step joins without a stamped toe-off', () => {
  it.each([0.62, 0.42, 0.365])(
    'matches position, velocity and acceleration at stance %s',
    (stance) => {
      const h = 1e-5;
      const sample = (p: number) => sampleLocomotionStep((p + 1) % 1, stance, 0.5, 0.065, 0.2);
      for (const at of [0, stance]) {
        const a = sample(at - h),
          b = sample(at),
          c = sample(at + h);
        for (const key of ['travel', 'lift', 'pitch'] as const) {
          expect(Math.abs(c[key] - a[key]), key).toBeLessThan(0.00004);
          const incoming = (b[key] - a[key]) / h;
          const outgoing = (c[key] - b[key]) / h;
          expect(Math.abs(incoming - outgoing), key).toBeLessThan(0.001);
          const aa = sample(at - 2 * h),
            cc = sample(at + 2 * h);
          const before = (b[key] - 2 * a[key] + aa[key]) / h ** 2;
          const after = (cc[key] - 2 * c[key] + b[key]) / h ** 2;
          expect(Math.abs(before - after), key).toBeLessThan(0.15);
        }
      }
      expect(sampleLocomotionStep(stance, stance, 0.5, 0.065, 0.2).lift).toBe(0);
      expect(sampleLocomotionStep((stance + 1) / 2, stance, 0.5, 0.065, 0.2).lift).toBeCloseTo(
        0.065,
      );
    },
  );
});

describe('reference sprint recovery', () => {
  it('folds early, then extends for contact instead of dragging a straight leg', () => {
    const stance = 0.35;
    const sample = (u: number) =>
      sampleSprintStep(stance + u * (1 - stance), stance, 1, 0.48, 0.42);
    expect(sample(0.32).lift).toBeGreaterThan(0.46);
    expect(sample(0.32).travel).toBeLessThan(0);
    expect(sample(0.85).travel).toBeGreaterThan(0);
    expect(sample(0.85).lift).toBeLessThan(0.03);
  });
  it.each([0, 0.35, ...[0.18, 0.55, 0.68, 0.88].map((u) => 0.35 + 0.65 * u)])(
    'preserves continuous position and velocity at phase %s',
    (at) => {
      const h = 1e-6;
      const sample = (p: number) => sampleSprintStep((p + 1) % 1, 0.35, 1, 0.48, 0.42);
      for (const key of ['travel', 'lift', 'pitch'] as const) {
        const a = sample(at - h)[key],
          b = sample(at)[key],
          c = sample(at + h)[key];
        expect(Math.abs(c - a)).toBeLessThan(0.00008);
        expect(Math.abs((b - a) / h - (c - b) / h)).toBeLessThan(0.001);
        const aa = sample(at - 2 * h)[key],
          cc = sample(at + 2 * h)[key];
        expect(Math.abs((b - 2 * a + aa) / h ** 2 - (cc - 2 * c + b) / h ** 2)).toBeLessThan(0.15);
      }
    },
  );
});

it('retains a compact high knee until the opposite toe-off, then reaches and retracts', () => {
  const sample = (u: number) => sampleSprintStep(0.23 + 0.77 * u, 0.23, 0.74, 0.6, 0.42);
  expect(sample(0.55).travel).toBeCloseTo(0.74 * 0.08);
  expect(sample(0.55).lift).toBeCloseTo(0.6);
  expect(sample(0.72).lift).toBeGreaterThan(0.4);
  expect(sample(0.88).travel).toBeGreaterThan(0.58);
  expect(sample(0.88).lift).toBeLessThan(0.02);
  expect(sample(0.99).travel).toBeLessThan(sample(0.88).travel);
});
