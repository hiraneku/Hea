import { describe, expect, it } from 'vitest';
import { Scene, Vector3 } from 'three';
import { Enemy, type EnemyHost } from '../../src/game/Enemy';
import { ENEMY } from '../../src/game/combat';
import { seededRandom } from '../../src/game/math';

function fakeHost(shots: { at: Vector3; velocity: Vector3 }[]): EnemyHost {
  return {
    targetChest: () => new Vector3(0, 1.5, 20),
    targetVelocity: () => new Vector3(),
    shoot: (at, velocity) => shots.push({ at: at.clone(), velocity: velocity.clone() }),
    collide: () => {},
    groundHeight: () => 0,
  };
}

function raiseGuards(count = 3): Enemy[] {
  const scene = new Scene();
  return Array.from(
    { length: count },
    (_, i) => new Enemy(scene, new Vector3(i * 3 - 3, 5, 12), seededRandom(40 + i)),
  );
}

describe('the lesser constructs (boss-kin enemies)', () => {
  it('circles the quarry and spits straight, boss-slower fireballs', () => {
    const shots: { at: Vector3; velocity: Vector3 }[] = [];
    const guards = raiseGuards(),
      host = fakeHost(shots);
    const before = guards.map((g) => g.position.clone());
    for (let t = 0; t < 8; t += 1 / 60) for (const g of guards) g.update(1 / 60, host);
    expect(shots.length).toBeGreaterThanOrEqual(3);
    for (const shot of shots) expect(shot.velocity.length()).toBeCloseTo(ENEMY.shotSpeed, 3);
    guards.forEach((g, i) => {
      expect(g.position.distanceTo(before[i])).toBeGreaterThan(3);
      const ring = Math.hypot(g.position.x, g.position.z - 20);
      expect(ring).toBeGreaterThan(4);
      expect(ring).toBeLessThan(15);
      expect(g.position.y).toBeGreaterThan(0.6);
    });
  });

  it('can be shot down: crossedBy finds the body and damage finishes it', () => {
    const [guard] = raiseGuards(1);
    const target = guard.position.clone(),
      t = guard.crossedBy(
        target.clone().add(new Vector3(0, 0, -6)),
        target.clone().add(new Vector3(0, 0, 6)),
        0.17,
      );
    expect(t).not.toBeNull();
    expect(guard.damage(ENEMY.health - 1)).toBe(false);
    expect(guard.alive).toBe(true);
    expect(guard.damage(1)).toBe(true);
    expect(guard.alive).toBe(false);
  });

  it('FALL takes it too: held flat and silent, slow to rise when released', () => {
    const shots: { at: Vector3; velocity: Vector3 }[] = [];
    const [guard] = raiseGuards(1),
      host = fakeHost(shots);
    guard.beginHold(0);
    for (let t = 0; t < 2; t += 1 / 60) guard.update(1 / 60, host);
    expect(guard.held).toBe(true);
    expect(guard.position.y).toBeCloseTo(0.42, 1);
    expect(shots).toHaveLength(0); // pinned things do not spit
    guard.endHold();
    for (let t = 0; t < ENEMY.holdStagger - 0.05; t += 1 / 60) guard.update(1 / 60, host);
    expect(shots).toHaveLength(0); // still gathering itself during the stagger
    for (let t = 0; t < 4; t += 1 / 60) guard.update(1 / 60, host);
    expect(guard.position.y).toBeGreaterThan(1.5); // risen back into the hunt
  });
});
