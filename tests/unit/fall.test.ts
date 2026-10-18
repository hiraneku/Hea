import { describe, expect, it } from 'vitest';
import { FALL, fallPressure, fallReleaseDamage, fallSlamDamage } from '../../src/game/combat';
import { normalizeEquipped, normalizeLoadout, SPELLS } from '../../src/game/types';

describe('FALL pressure', () => {
  it('fills over the pressure time, then leaks while still held', () => {
    expect(fallPressure(0)).toBe(0);
    expect(fallPressure(FALL.pressureTime / 2)).toBeCloseTo(0.5);
    expect(fallPressure(FALL.pressureTime)).toBe(1);
    expect(fallPressure(FALL.pressureTime + 2)).toBeLessThan(1);
    expect(fallPressure(60)).toBe(0);
  });

  it('is free: no energy cost and no cooldown, the hold is the price', () => {
    expect(FALL.cost).toBe(0);
    expect(FALL.cooldown).toBe(0);
    expect(SPELLS[3].cost).toBe(0);
    expect(SPELLS[3].cooldown).toBe(0);
  });

  it('slams at launch speed over a very large area', () => {
    expect(FALL.slamSpeed).toBeGreaterThanOrEqual(300);
    expect(FALL.crackRadius.full).toBeGreaterThanOrEqual(10);
    expect(FALL.build).toBeGreaterThanOrEqual(0.8);
  });

  it('slams harder from height, capped', () => {
    expect(fallSlamDamage(0)).toBe(FALL.slamDamage);
    expect(fallSlamDamage(FALL.slamHeightCap)).toBe(FALL.slamDamage + FALL.slamHeightBonus);
    expect(fallSlamDamage(500)).toBe(FALL.slamDamage + FALL.slamHeightBonus);
    expect(fallSlamDamage(6)).toBeGreaterThan(fallSlamDamage(0));
  });

  it('the release spends the stored pressure in one crush', () => {
    expect(fallReleaseDamage(1)).toBe(FALL.releaseBase + FALL.releasePressureDamage);
    expect(fallReleaseDamage(0)).toBe(FALL.releaseBase);
    expect(fallReleaseDamage(0.5)).toBe(
      Math.round(FALL.releaseBase + FALL.releasePressureDamage * 0.5),
    );
  });

  it('is registered as the fourth spell, a held gravity control', () => {
    expect(SPELLS[3].name).toBe('FALL');
    expect(SPELLS[3].school).toBe('Gravitasi');
    expect(SPELLS[3].cast).toBe('Tahan');
    expect(SPELLS[3].cooldown).toBe(FALL.cooldown);
  });
});

describe('spell loadout', () => {
  it('defaults to the four spells in registry order', () => {
    expect(normalizeLoadout(undefined)).toEqual([0, 1, 2, 3]);
    expect(normalizeLoadout('junk')).toEqual([0, 1, 2, 3]);
  });

  it('keeps a stored order and drops repeats and unknown ids', () => {
    expect(normalizeLoadout([3, 0, 0, 9, 1])).toEqual([3, 0, 1, 2]);
  });

  it('fills empty slots in registry order and never exceeds four', () => {
    expect(normalizeLoadout([2])).toEqual([2, 0, 1, 3]);
    expect(normalizeLoadout([3, 2, 1, 0, 0])).toHaveLength(4);
  });

  it('normalizes the equipped list for the BARU badges', () => {
    expect(normalizeEquipped([0, 2, 2, 7, -1])).toEqual([0, 2]);
    expect(normalizeEquipped(null)).toEqual([]);
  });
});
