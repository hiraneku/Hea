import { describe, expect, it } from 'vitest';
import { Scene, Vector3 } from 'three';
import { MinionSwarm, type MinionHost } from '../../src/game/Minion';
import { SUMMON } from '../../src/game/combat';

function fakeHost(shots: { at: Vector3; velocity: Vector3 }[]): MinionHost {
  return {
    playerChest: () => new Vector3(0, 1.5, 20),
    playerVelocity: () => new Vector3(),
    shoot: (at, velocity) => shots.push({ at: at.clone(), velocity: velocity.clone() }),
    collide: () => {},
    groundHeight: () => 0,
  };
}

describe('the summoned shades', () => {
  it('answers a call with exactly three, and only tops up afterwards', () => {
    const swarm = new MinionSwarm(new Scene());
    const spawned = swarm.summon(new Vector3(0, 10, 0));
    expect(spawned).toHaveLength(3);
    expect(swarm.alive).toBe(3);
    expect(swarm.summon(new Vector3(0, 10, 0))).toHaveLength(0);
    swarm.clear();
    expect(swarm.alive).toBe(0);
  });

  it('circles the player and spits straight, boss-slower fireballs', () => {
    const shots: { at: Vector3; velocity: Vector3 }[] = [];
    const swarm = new MinionSwarm(new Scene()),
      host = fakeHost(shots);
    swarm.summon(new Vector3(0, 6, 12));
    const before = swarm.positions.map((p) => p.clone());
    for (let t = 0; t < 8; t += 1 / 60) swarm.update(1 / 60, host);
    expect(swarm.alive).toBe(3);
    expect(shots.length).toBeGreaterThanOrEqual(3);
    for (const shot of shots) expect(shot.velocity.length()).toBeCloseTo(SUMMON.shotSpeed, 3);
    // They hunt: after eight seconds every shade has left its spawn point far behind and
    // holds the orbit band around the player rather than drifting off.
    swarm.positions.forEach((p, i) => {
      expect(p.distanceTo(before[i])).toBeGreaterThan(3);
      const ring = Math.hypot(p.x, p.z - 20);
      expect(ring).toBeGreaterThan(4);
      expect(ring).toBeLessThan(15);
      expect(p.y).toBeGreaterThan(0.6);
    });
  });

  it('dies to focused fire and frees its slot for the next call', () => {
    const swarm = new MinionSwarm(new Scene());
    swarm.summon(new Vector3(0, 4, 14));
    const target = swarm.positions[0].clone(),
      hit = swarm.hitTest(
        target.clone().add(new Vector3(0, 0, -6)),
        target.clone().add(new Vector3(0, 0, 6)),
        0.17,
      );
    expect(hit).not.toBeNull();
    expect(swarm.damage(hit!.member, SUMMON.health - 1)).toBe(false);
    expect(swarm.alive).toBe(3);
    expect(swarm.damage(hit!.member, 1)).toBe(true);
    expect(swarm.alive).toBe(2);
    expect(swarm.summon(new Vector3(0, 10, 0))).toHaveLength(1);
    swarm.clear();
  });
});
