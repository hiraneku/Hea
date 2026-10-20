import { describe, it, expect } from 'vitest';
import {
  CharacterFacing,
  HEAD_LIMIT,
  angleDelta,
  directionalSpeed,
  GROUND_PACES,
} from '../../src/character/CharacterFacing';

describe('camera, body and movement separation', () => {
  it('keeps the body planted inside the neck limit and follows beyond it', () => {
    const facing = new CharacterFacing();
    for (let i = 0; i < 120; i++) facing.update(1 / 60, 0.8, false, 0, false);
    expect(facing.yaw).toBe(0);
    expect(facing.headYaw).toBeCloseTo(0.8, 4);
    for (let i = 0; i < 120; i++) facing.update(1 / 60, 2.2, false, 0, false);
    expect(facing.yaw).toBeGreaterThan(1);
    expect(Math.abs(facing.headYaw)).toBeLessThanOrEqual(HEAD_LIMIT + 1e-6);
  });
  it('handles rapid reversal across the yaw seam without a long spin or overshoot', () => {
    const facing = new CharacterFacing();
    facing.reset(Math.PI - 0.01);
    for (let i = 0; i < 30; i++)
      facing.update(1 / 60, -Math.PI + 0.02, true, -Math.PI + 0.02, false);
    expect(Math.abs(angleDelta(facing.yaw, -Math.PI + 0.02))).toBeLessThan(0.001);
    const before = facing.yaw;
    facing.update(0, 0, true, 0, false);
    expect(facing.yaw).toBe(before);
  });
  it('faces travel unlocked, but keeps a small diagonal allowance under lock', () => {
    const free = new CharacterFacing(),
      locked = new CharacterFacing();
    for (let i = 0; i < 120; i++) {
      free.update(1 / 60, 0, true, Math.PI / 2, false);
      locked.update(1 / 60, 0, true, Math.PI / 2, true);
    }
    expect(free.yaw).toBeCloseTo(Math.PI / 2, 4);
    expect(locked.yaw).toBeCloseTo(0.3, 4);
    expect(directionalSpeed(-1)).toBeLessThan(directionalSpeed(0));
    expect(directionalSpeed(0)).toBeLessThan(directionalSpeed(1));
    expect(GROUND_PACES[0]).toBeLessThan(GROUND_PACES[1]);
    expect(GROUND_PACES[1]).toBeLessThan(GROUND_PACES[2]);
  });
});
