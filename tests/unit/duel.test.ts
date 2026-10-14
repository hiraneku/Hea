import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import {
  ATTACKS,
  AutoShield,
  BossDirector,
  DUEL,
  rangeCorrection,
  steerMissile,
  threatTime,
} from '../../src/game/combat';
import { DestructibleVolume, TerrainDeformation } from '../../src/game/destruction';
import { groundHeight, resolveCircle, segmentBox } from '../../src/game/math';

describe('maximum automatic Aegis', () => {
  it('starts ready and protects against every projectile, not just the first hit', () => {
    const s = new AutoShield();
    expect(s.phase).toBe('ready');
    for (let i = 0; i < 60; i++) expect(s.intercept()).toBe(true);
    expect(s.blocked).toBe(60);
    expect(s.phase).toBe('active');
    expect(s.remaining).toBe(DUEL.shieldWindow);
  });
  it('has a bounded window that cannot be refreshed indefinitely by impacts', () => {
    const s = new AutoShield();
    s.intercept();
    s.update(1);
    s.intercept();
    expect(s.remaining).toBeCloseTo(DUEL.shieldWindow - 1);
    s.update(DUEL.shieldWindow - 1);
    expect(s.phase).toBe('cooldown');
    expect(s.intercept()).toBe(false);
    expect(s.blocked).toBe(2);
    s.update(DUEL.shieldCooldown);
    expect(s.phase).toBe('ready');
    expect(s.intercept()).toBe(true);
  });
  it('handles a long frame across both timers and resets cleanly', () => {
    const s = new AutoShield();
    s.intercept();
    s.update(10);
    expect(s.phase).toBe('ready');
    s.intercept();
    s.reset();
    expect(s.remaining).toBe(0);
    expect(s.blocked).toBe(0);
  });
  it('predicts an actual hit shortly before contact, from any direction', () => {
    for (const side of [
      new Vector3(1, 0, 0),
      new Vector3(-1, 0, 0),
      new Vector3(0, 1, 0),
      new Vector3(0, 0, -1),
    ]) {
      expect(
        threatTime(
          side.clone().multiplyScalar(3),
          side.clone().multiplyScalar(-24),
          new Vector3(),
          new Vector3(),
          0.13,
        ),
      ).not.toBeNull();
    }
  });
  it('does not activate on a near miss, receding shot, or distant projectile', () => {
    expect(
      threatTime(new Vector3(2, 3, 0), new Vector3(-24, 0, 0), new Vector3(), new Vector3(), 0.13),
    ).toBeNull();
    expect(
      threatTime(new Vector3(3, 0, 0), new Vector3(24, 0, 0), new Vector3(), new Vector3(), 0.13),
    ).toBeNull();
    expect(
      threatTime(new Vector3(12, 0, 0), new Vector3(-24, 0, 0), new Vector3(), new Vector3(), 0.13),
    ).toBeNull();
  });
  it('accounts for player motion rather than blocking harmless nearby shots', () => {
    const p = new Vector3(3, 0, 0),
      v = new Vector3(-12, 0, 0);
    expect(threatTime(p, v, new Vector3(), new Vector3(12, 0, 0), 0.13)).not.toBeNull();
    expect(threatTime(p, v, new Vector3(), new Vector3(-12, 0, 0), 0.13)).toBeNull();
  });
});

describe('one boss, deliberate attack patterns', () => {
  it('fires salvos, missile pairs and a heavy shot in the authored order', () => {
    const d = new BossDirector(),
      commands = d.step(14.1);
    const shots = commands.filter((c) => c.type === 'shot');
    expect(shots.filter((c) => c.attack === 'fire').length).toBe(ATTACKS.fire.shots);
    expect(shots.filter((c) => c.attack === 'missiles').length).toBe(ATTACKS.missiles.shots);
    expect(shots.filter((c) => c.attack === 'hammer').length).toBe(1);
    expect(shots[0].attack).toBe('fire');
    expect(shots[ATTACKS.fire.shots].attack).toBe('missiles');
    expect(shots[ATTACKS.fire.shots + ATTACKS.missiles.shots].attack).toBe('hammer');
  });
  it('does not skip or duplicate attacks at low frame rates', () => {
    const a = new BossDirector(),
      b = new BossDirector();
    const coarse = a.step(12),
      fine = Array.from({ length: 600 }, () => b.step(0.02)).flat();
    expect(fine).toEqual(coarse);
    b.reset();
    expect(b.attack).toBe('fire');
    expect(b.stage).toBe('telegraph');
    expect(b.elapsed).toBe(0);
  });
  it('telegraphs before attacking and maintains a ranged standoff', () => {
    const d = new BossDirector();
    expect(d.step(1.5).filter((c) => c.type === 'shot')).toHaveLength(0);
    expect(d.charge).toBeGreaterThan(0.5);
    expect(rangeCorrection(6)).toBeLessThan(0);
    expect(rangeCorrection(32)).toBeGreaterThan(0);
    expect(rangeCorrection(DUEL.preferredRange)).toBe(0);
  });
  it('missiles have capped turning and constant requested speed', () => {
    const v = new Vector3(0, 0, -15),
      target = new Vector3(1, 0, 0);
    const result = steerMissile(v, target, 1.5, 0.1, 18);
    expect(result.length()).toBeCloseTo(18);
    expect(v.angleTo(result)).toBeCloseTo(0.15);
    expect(v.toArray()).toEqual([0, 0, -15]);
    const opposite = steerMissile(v, new Vector3(0, 0, 1), 1.5, 0.1, 18);
    expect(opposite.toArray().every(Number.isFinite)).toBe(true);
  });
});

describe('persistent world destruction', () => {
  const bounds = { minX: -3, maxX: 3, minZ: -0.6, maxZ: 0.6, top: 6 };
  it('removes real collision at the impact point while preserving the rest of a wall', () => {
    const v = new DestructibleVolume(bounds, 0, 1);
    const from = new Vector3(0, 1, 4),
      to = new Vector3(0, 1, -4);
    expect(v.colliders().some((b) => segmentBox(from, to, b) !== null)).toBe(true);
    const removed = v.breakAt(new Vector3(0, 1, 0), 1.5);
    expect(removed.length).toBeGreaterThan(0);
    expect(v.cells.some((c) => c.alive)).toBe(true);
    expect(v.colliders().some((b) => segmentBox(from, to, b) !== null)).toBe(false);
    expect(
      v
        .colliders()
        .some((b) => segmentBox(new Vector3(2.7, 4, 4), new Vector3(2.7, 4, -4), b) !== null),
    ).toBe(true);
    expect(resolveCircle(0, 0, 0, 0.38, v.colliders())).toEqual({ x: 0, z: 0 });
  });
  it('cannot remove a cell twice; reset restores geometry and collision', () => {
    const v = new DestructibleVolume(bounds, 0, 1);
    v.breakAt(new Vector3(0, 1, 0), 1.5);
    expect(v.breakAt(new Vector3(0, 1, 0), 1.5)).toHaveLength(0);
    v.reset();
    expect(v.damaged).toBe(false);
    expect(v.cells.every((c) => c.alive)).toBe(true);
    expect(v.colliders()).toHaveLength(1);
  });
  it('craters deform the actual ground and support feet below the original plane', () => {
    const ground = new TerrainDeformation();
    ground.add(2, 4, 3, 1.2);
    expect(ground.heightAt(2, 4)).toBeCloseTo(-1.2);
    expect(ground.heightAt(20, 20)).toBe(0);
    expect(ground.heightAt(5.15, 4)).toBeGreaterThan(0);
    expect(groundHeight(2, 4, 0, [], ground.heightAt(2, 4))).toBeCloseTo(-1.2);
    ground.reset();
    expect(ground.heightAt(2, 4)).toBe(0);
  });
  it('caps terrain complexity without silently healing old craters', () => {
    const ground = new TerrainDeformation();
    for (let i = 0; i < 60; i++) ground.add(i * 5, 0, 2, 0.8);
    expect(ground.craters.length).toBe(24);
    expect(ground.heightAt(0, 0)).toBeCloseTo(-0.8);
  });
});
