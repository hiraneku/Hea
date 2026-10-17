import { describe, expect, it } from 'vitest';
import { Scene, Texture, Vector3 } from 'three';
import { ProjectileSystem } from '../../src/game/ProjectileSystem';
import { PROJECTILES } from '../../src/game/combat';

const at = new Vector3(0, 2, 0);
const velocity = new Vector3(0, 0, -40);

describe('ProjectileSystem', () => {
  it('spawns a shot with a body and a trail in the scene', () => {
    const scene = new Scene();
    const system = new ProjectileSystem(scene, new Texture());
    const p = system.spawn(at, velocity.clone(), 'fire', 9);
    expect(system.list).toHaveLength(1);
    expect(p.mesh.userData.projectile).toBe(true);
    expect(p.life).toBeCloseTo(PROJECTILES.fire.range / PROJECTILES.fire.speed);
    expect(p.radius).toBe(PROJECTILES.fire.radius);
    expect(scene.children).toContain(p.mesh);
    expect(scene.children).toContain(p.ribbon.mesh);
    // Fire carries a bright core inside the flame body.
    expect(p.mesh.children).toHaveLength(1);
  });

  it('dresses seekers with an orbit ring and runes', () => {
    const scene = new Scene();
    const system = new ProjectileSystem(scene, new Texture());
    const p = system.spawn(at, velocity.clone(), 'missile', 12, true);
    expect(p.homing).toBe(true);
    expect(p.mesh.children).toHaveLength(2);
  });

  it('retires the oldest shot when the live cap is reached', () => {
    const scene = new Scene();
    const system = new ProjectileSystem(scene, new Texture());
    const first = system.spawn(at, velocity.clone(), 'player', 36);
    for (let i = 0; i < 120; i++) system.spawn(at, velocity.clone(), 'player', 36);
    expect(system.list).toHaveLength(120);
    expect(system.list).not.toContain(first);
    expect(first.mesh.parent).toBeNull();
  });

  it('keepMesh hands the body over instead of dropping it from the scene', () => {
    const scene = new Scene();
    const system = new ProjectileSystem(scene, new Texture());
    const kept = system.spawn(at, velocity.clone(), 'vortex', 0);
    system.remove(0, true);
    expect(system.list).toHaveLength(0);
    expect(kept.mesh.parent).toBe(scene);
    const dropped = system.spawn(at, velocity.clone(), 'fire', 9);
    system.remove(0);
    expect(dropped.mesh.parent).toBeNull();
  });

  it('clear empties the air, and a retired seed can be dressed as a well core', () => {
    const scene = new Scene();
    const system = new ProjectileSystem(scene, new Texture());
    const seed = system.spawn(at, velocity.clone(), 'vortex', 0);
    system.spawn(at, velocity.clone(), 'fire', 9);
    system.decorateWellCore(seed.mesh);
    expect(seed.mesh.children.map((c) => Object.keys(c.userData))).toEqual([
      ['ring'],
      ['halo'],
      ['pin'],
    ]);
    system.clear();
    expect(system.list).toHaveLength(0);
    expect(scene.children.some((o) => o.userData.projectile)).toBe(false);
  });
});
