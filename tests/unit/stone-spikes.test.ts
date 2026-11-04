import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { StoneSpikes, type StoneSpikeHost } from '../../src/game/StoneSpikes';
import type { Obstacle } from '../../src/game/math';

describe('Batu stalagmites', () => {
  function setup() {
    const scene = new THREE.Scene();
    const registered: Obstacle[] = [];
    const removed: Obstacle[] = [];
    const eruptLines: number[] = [];
    const host: StoneSpikeHost = {
      groundAt: () => 0,
      candidates: () => [],
      addObstacles: (obstacles) => registered.push(...obstacles),
      removeObstacles: (obstacles) => removed.push(...obstacles),
      onErupt: (_obstacle, line) => eruptLines.push(line.id),
    };
    const fx = { dust: () => {}, debris: () => {}, impact: () => {} };
    const spikes = new StoneSpikes(scene, host, fx);
    return { scene, registered, removed, eruptLines, spikes };
  }

  it('rejects a target closer than the medium-range minimum', () => {
    const { spikes } = setup();
    expect(spikes.cast(new THREE.Vector3(0, 1.8, 20), new THREE.Vector3(0, 0, -1), 5.9)).toBe(0);
    expect(spikes.diagnostics).toHaveLength(0);
    spikes.dispose();
  });

  it('raises a staged row toward aim, then keeps the solid obstacles at their original world positions', () => {
    const { scene, registered, eruptLines, spikes } = setup();
    const count = spikes.cast(new THREE.Vector3(0, 1.8, 20), new THREE.Vector3(0, 0, -1), 12);
    expect(count).toBeGreaterThanOrEqual(4);
    expect(spikes.diagnostics).toHaveLength(count);
    expect(spikes.diagnostics.every((spike) => !spike.solid)).toBe(true);

    spikes.update(2);
    expect(registered).toHaveLength(count);
    expect(spikes.diagnostics.every((spike) => spike.solid)).toBe(true);
    expect(eruptLines).toEqual(Array(count).fill(1));
    const positions = spikes.diagnostics.map((spike) => spike.position);
    expect(positions.every((position) => position[2] < 20)).toBe(true);

    // Later player positions are not passed to the structures: the raised stones stay put.
    spikes.update(5);
    expect(spikes.diagnostics.map((spike) => spike.position)).toEqual(positions);
    expect(
      scene.children.filter((object) => object.name.startsWith('stone-stalagmite-')),
    ).toHaveLength(count);
    spikes.dispose();
  });

  it('breaks a spike only after projectile/impact damage depletes its health', () => {
    const { scene, registered, removed, spikes } = setup();
    spikes.cast(new THREE.Vector3(0, 1.8, 20), new THREE.Vector3(0, 0, -1), 8);
    spikes.update(2);
    const target = spikes.diagnostics[0];
    const mesh = scene.children.find((object) => object.name === 'stone-stalagmite-1-0')!;
    const obstacle = registered[0];
    const at = new THREE.Vector3(target.position[0], target.position[1] + 1, target.position[2]);

    expect(spikes.hit(obstacle, 40, at, new THREE.Vector3(0, 0, -8))).toBe('damaged');
    expect(spikes.diagnostics[0].health).toBe(32);
    expect(spikes.impact(obstacle, at, new THREE.Vector3(0, 0, -8), 32)).toBe('destroyed');
    expect(removed).toContain(obstacle);
    expect(mesh.parent).toBeNull();
    expect(spikes.hit(obstacle, 100, at, new THREE.Vector3())).toBe('unknown');
    spikes.dispose();
  });

  it('clears every persistent spike and collider at duel reset', () => {
    const { registered, removed, spikes } = setup();
    spikes.cast(new THREE.Vector3(0, 1.8, 20), new THREE.Vector3(0, 0, -1), 15);
    spikes.update(2);
    expect(spikes.count).toBe(registered.length);
    spikes.reset();
    expect(spikes.count).toBe(0);
    expect(removed).toEqual(registered);
  });
});
