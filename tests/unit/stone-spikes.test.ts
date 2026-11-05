import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { StoneSpikes, type StoneSpikeHost } from '../../src/game/StoneSpikes';
import type { DestructibleVolume } from '../../src/game/destruction';
import { groundHeight, resolveCircle } from '../../src/game/math';

describe('Batu leaning stone spear', () => {
  function setup() {
    const scene = new THREE.Scene();
    const walls = new Map<number, DestructibleVolume>();
    const emerged: number[] = [];
    const removed: number[] = [];
    const host: StoneSpikeHost = {
      groundAt: () => 0,
      candidates: () => [],
      addWall: (_mesh, volume) => walls.set(volume.owner, volume),
      removeWalls: (owners) => {
        removed.push(...owners);
        owners.forEach((owner) => walls.delete(owner));
      },
      hasWall: (owner) => walls.has(owner),
      onEmerge: (_spike, line) => emerged.push(line.id),
    };
    const fx = { dust: () => {}, debris: () => {} };
    const spikes = new StoneSpikes(scene, host, fx);
    return { scene, walls, emerged, removed, spikes };
  }

  it('rejects a target closer than the medium-range minimum', () => {
    const { spikes } = setup();
    expect(spikes.cast(new THREE.Vector3(0, 1.8, 20), new THREE.Vector3(0, 0, -1), 7.9)).toBe(0);
    expect(spikes.diagnostics).toHaveLength(0);
    spikes.dispose();
  });

  it('spawns exactly one large tilted spear that grows outward from the player toward aim', () => {
    const { scene, walls, emerged, spikes } = setup();
    expect(spikes.cast(new THREE.Vector3(0, 1.8, 20), new THREE.Vector3(0, 0, -1), 14)).toBe(1);
    expect(spikes.diagnostics).toHaveLength(1);
    expect(spikes.diagnostics[0].solid).toBe(false);

    const mesh = scene.children.find((object) => object.name === 'stone-spear-1') as THREE.Mesh;
    expect(mesh.scale.y).toBeLessThan(1);
    spikes.update(1);

    expect(spikes.diagnostics).toHaveLength(1);
    expect(spikes.diagnostics[0].solid).toBe(true);
    expect(spikes.diagnostics[0].length).toBeGreaterThan(10);
    expect(spikes.diagnostics[0].tip[1]).toBeGreaterThan(spikes.diagnostics[0].position[1]);
    expect(walls.size).toBe(1);
    expect(emerged).toEqual([1]);
    expect(spikes.diagnostics[0].cellsAlive).toBeGreaterThan(0);
    const voxelized = walls.get(-1)!;
    expect(voxelized.initialAliveCount).toBeLessThan(voxelized.cells.length);
    const base = new THREE.Vector3().fromArray(spikes.diagnostics[0].position);
    expect(
      voxelized.cells.filter(
        (cell) =>
          cell.alive &&
          Math.hypot(cell.x - base.x, cell.z - base.z) < 2.3 &&
          cell.y > -0.2 &&
          cell.y < 2,
      ),
    ).not.toHaveLength(0);
    const fixedPosition = spikes.diagnostics[0].position;

    spikes.update(5);
    expect(spikes.diagnostics).toHaveLength(1);
    expect(spikes.diagnostics[0].position).toEqual(fixedPosition);
    spikes.dispose();
  });

  it('keeps a continuous solid collision skin and walkable tops along the spear', () => {
    const { walls, spikes } = setup();
    spikes.cast(new THREE.Vector3(0, 1.8, 20), new THREE.Vector3(0, 0, -1), 14);
    spikes.update(1);
    const volume = walls.get(-1)!;
    const colliders = volume.colliders();
    const cell = colliders.find((part) => part.top - (part.bottom ?? 0) < 1.1 && part.top > 1.2);
    expect(cell).toBeDefined();
    const x = (cell!.minX + cell!.maxX) / 2;
    const z = (cell!.minZ + cell!.maxZ) / 2;
    const resolved = resolveCircle(x, z, cell!.bottom ?? 0, 0.42, colliders, 1.7);
    expect(Math.hypot(resolved.x - x, resolved.z - z)).toBeGreaterThan(0.3);
    expect(groundHeight(x, z, cell!.top, colliders)).toBeGreaterThanOrEqual(cell!.top);
    spikes.dispose();
  });

  it('uses wall-like destructible cells and removes the spear after its owner is gone', () => {
    const { scene, walls, removed, spikes } = setup();
    spikes.cast(new THREE.Vector3(0, 1.8, 20), new THREE.Vector3(0, 0, -1), 14);
    spikes.update(1);
    const spike = spikes.diagnostics[0];
    const volume = walls.get(-1)!;
    const before = volume.aliveCount;
    const point = new THREE.Vector3()
      .fromArray(spike.position)
      .lerp(new THREE.Vector3().fromArray(spike.tip), 0.42);

    expect(volume.breakAt(point, 1.5).length).toBeGreaterThan(0);
    expect(volume.aliveCount).toBeLessThan(before);
    expect(volume.colliders().length).toBeGreaterThan(0);
    expect(spikes.diagnostics[0].damaged).toBe(true);

    volume.reset();
    expect(volume.aliveCount).toBe(volume.initialAliveCount);
    expect(volume.colliders().length).toBeGreaterThan(0);

    walls.delete(-1);
    spikes.update(1 / 60);
    expect(spikes.count).toBe(0);
    expect(removed).toHaveLength(0);
    expect(scene.children.some((object) => object.name === 'stone-spear-1')).toBe(false);
    spikes.dispose();
  });

  it('unregisters every persistent dynamic wall on duel reset', () => {
    const { walls, removed, spikes } = setup();
    spikes.cast(new THREE.Vector3(0, 1.8, 20), new THREE.Vector3(0, 0, -1), 14);
    spikes.update(1);
    const colliders = [...walls.values()].flatMap((volume) => volume.colliders());
    expect(colliders.length).toBeGreaterThan(0);
    expect([...walls.keys()]).toEqual([-1]);
    spikes.reset();
    expect(spikes.count).toBe(0);
    expect(walls.size).toBe(0);
    expect(removed).toEqual([-1]);
  });
});
