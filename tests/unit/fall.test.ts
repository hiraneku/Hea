import { describe, expect, it } from 'vitest';
import {
  BossDirector,
  FALL,
  fallPressure,
  fallReleaseDamage,
  fallSlamDamage,
} from '../../src/game/combat';
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

  it('keeps the boss down a while after the release, and breaks any cast on impact', () => {
    expect(FALL.lingerTime).toBeGreaterThanOrEqual(2);
    const director = new BossDirector();
    expect(director.stage).toBe('telegraph');
    director.step(0.5);
    director.interrupt();
    expect(director.stage).toBe('recover');
    expect(director.charge).toBe(0);
    // The interrupted cast itself fires nothing while the director recovers.
    const during = director.step(0.5);
    expect(during.filter((c) => c.type === 'shot')).toHaveLength(0);
    expect(director.stage).toBe('recover');
  });

  it('keeps FALL as a held gravity control and registers TITAN as a basic earth attack', () => {
    expect(SPELLS[3].name).toBe('FALL');
    expect(SPELLS[3].school).toBe('Gravitasi');
    expect(SPELLS[3].cast).toBe('Tahan');
    expect(SPELLS[3].cooldown).toBe(FALL.cooldown);
    expect(SPELLS[4].name).toBe('TITAN');
    expect(SPELLS[4].school).toBe('Tanah');
    expect(SPELLS[4].cast).toBe('Ketuk');
    expect(SPELLS[4].damage).toBeGreaterThan(0);
  });
});

describe('spell loadout', () => {
  it('defaults to the five spells in registry order', () => {
    expect(normalizeLoadout(undefined)).toEqual([0, 1, 2, 3, 4]);
    expect(normalizeLoadout('junk')).toEqual([0, 1, 2, 3, 4]);
  });

  it('keeps a stored order and drops repeats and unknown ids', () => {
    expect(normalizeLoadout([4, 3, 0, 0, 9, 1])).toEqual([4, 3, 0, 1, 2]);
  });

  it('fills empty slots in registry order and never exceeds five', () => {
    expect(normalizeLoadout([2])).toEqual([2, 0, 1, 3, 4]);
    expect(normalizeLoadout([4, 3, 2, 1, 0, 0])).toHaveLength(5);
  });

  it('normalizes the equipped list for the BARU badges', () => {
    expect(normalizeEquipped([0, 2, 2, 7, -1])).toEqual([0, 2]);
    expect(normalizeEquipped(null)).toEqual([]);
  });
});
