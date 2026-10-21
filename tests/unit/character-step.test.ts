import { describe, expect, it } from 'vitest';
import { sampleLocomotionStep } from '../../src/character/CharacterLocomotion';

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
