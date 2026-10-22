import { describe, expect, it } from 'vitest';
import { Quaternion, Vector3 } from 'three';
import { assessFiringLane } from '../../src/game/AttackSight';
import { BodyTumble, landingSlide, LaunchRelease } from '../../src/game/motion';
import { HEX_NEIGHBORS, shieldLayout } from '../../src/game/ShieldVisual';
import { DUEL, PROJECTILES } from '../../src/game/combat';

describe('weapon-aware cover checks', () => {
  const from = new Vector3(0, 5, 10),
    target = new Vector3(0, 5, -10),
    thin = { minX: -10, maxX: 10, minZ: -1, maxZ: 1, bottom: 0, top: 20, owner: 0 };
  it('holds ordinary fire behind a slab while allowing the solar spell to breach it', () => {
    expect(assessFiringLane(from, target, 'fire', [thin]).mode).toBe('blocked');
    expect(assessFiringLane(from, target, 'hammer', [thin]).mode).toBe('breach');
  });
  it('allows missile cover destruction only for sufficiently shallow material', () => {
    expect(assessFiringLane(from, target, 'missiles', [thin]).mode).toBe('blocked');
    expect(
      assessFiringLane(from, target, 'missiles', [{ ...thin, minZ: -0.5, maxZ: 0.5 }]).mode,
    ).toBe('breach');
  });
  it('rejects thick walls and indestructible props for every attack', () => {
    for (const attack of ['fire', 'missiles', 'hammer'] as const) {
      expect(assessFiringLane(from, target, attack, [{ ...thin, minZ: -4, maxZ: 4 }]).mode).toBe(
        'blocked',
      );
      expect(assessFiringLane(from, target, attack, [{ ...thin, owner: undefined }]).mode).toBe(
        'blocked',
      );
    }
  });
  it('checks downstream cover too, rather than treating the first thin slab as a clear route', () => {
    expect(
      assessFiringLane(from, target, 'hammer', [thin, { ...thin, minZ: -8, maxZ: -4, owner: 1 }])
        .mode,
    ).toBe('blocked');
  });
  it('cannot mistake a fractured thick wall for many independent thin cells', () => {
    const cells = Array.from({ length: 6 }, (_, i) => ({ ...thin, minZ: i - 3, maxZ: i - 2 }));
    expect(assessFiringLane(from, target, 'hammer', cells).mode).toBe('blocked');
    expect(assessFiringLane(from, target, 'fire', []).mode).toBe('clear');
  });
});

describe('reference2 polyhex pieces', () => {
  it('scales the cell pattern to the projectile class', () => {
    const small = Array.from({ length: 24 }, (_, i) => shieldLayout(i, 1.3).length),
      large = Array.from({ length: 24 }, (_, i) => shieldLayout(i, 2.6).length);
    expect(Math.min(...small)).toBeGreaterThanOrEqual(3);
    expect(Math.max(...small)).toBeLessThanOrEqual(5);
    expect(Math.min(...large)).toBeGreaterThanOrEqual(9);
    expect(Math.max(...large)).toBeLessThanOrEqual(12);
  });
  it('uses 5–10 edge-connected hex cells without duplicates', () => {
    for (let i = 0; i < 60; i++) {
      const cells = shieldLayout(i),
        keys = new Set(cells.map((c) => `${c.q},${c.r}`));
      expect(keys.size).toBe(cells.length);
      expect(cells.length).toBeGreaterThanOrEqual(5);
      expect(cells.length).toBeLessThanOrEqual(10);
      const visited = new Set([`${cells[0].q},${cells[0].r}`]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const c of cells)
          if (
            !visited.has(`${c.q},${c.r}`) &&
            HEX_NEIGHBORS.some(([x, y]) => visited.has(`${c.q + x},${c.r + y}`))
          ) {
            visited.add(`${c.q},${c.r}`);
            changed = true;
          }
      }
      expect(visited.size).toBe(cells.length);
    }
  });
});

describe('brief hold, explosive release, immediate get-up', () => {
  it('holds heavy contact (freeze + slow-motion ≈ 0.5 s) and reaches launch speed in one tick', () => {
    expect(DUEL.heavyFreeze + DUEL.heavySlow).toBeCloseTo(0.5);
    expect(PROJECTILES.hammer.pause + PROJECTILES.hammer.slow).toBeCloseTo(0.5);
    const release = new LaunchRelease(),
      velocity = new Vector3();
    release.start(new Vector3(DUEL.novaLaunch, 0, 0));
    release.step(1 / 120, velocity);
    expect(velocity.length()).toBeGreaterThan(100);
  });
  it('never generates upward momentum at a landing', () => {
    for (const v of [new Vector3(0, -122, 0), new Vector3(90, -40, 15), new Vector3(0, -10, 0)])
      expect(landingSlide(v, new Vector3(0, 0, 1)).y).toBe(0);
  });
  it('does not apply impact friction repeatedly to resting contact', () => {
    let velocity = new Vector3(30, -0.225, 0);
    for (let i = 0; i < 120; i++)
      velocity = landingSlide(velocity.clone().setY(-0.225), new Vector3(0, 0, 1));
    expect(velocity.x).toBeCloseTo(30);
  });
  it('stands within a third of a second after the skid slows, with no unconscious waiting phase', () => {
    const body = new BodyTumble(true),
      pose = new Quaternion();
    body.kick(pose, new Vector3(90, -20, 0));
    for (let i = 0; i < 40; i++) {
      body.beginStep();
      body.ground(new Vector3(2, 0, 0), 0, 0.55);
      body.step(1 / 120, pose);
    }
    expect(body.active).toBe(false);
    expect(body.orientation.angleTo(pose)).toBeLessThan(0.01);
    expect(body.bounces).toBe(0);
  });
});
