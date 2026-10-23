import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { EarthFists } from '../../src/game/EarthFists';

describe('Battle Mode earth fists', () => {
  it('lifts stones from an anchored source, forms a front-facing fist, and retracts', () => {
    const scene = new THREE.Scene();
    const fists = new EarthFists(scene);
    const player = new THREE.Vector3(2, 0.66, -3);
    const groundAt = () => 0;

    expect(fists.group.visible).toBe(false);
    expect(fists.group.children).toHaveLength(2);
    expect(scene.children.filter((part) => part.name.startsWith('earth-')).every((part) => !part.visible)).toBe(true);
    fists.setActive(true);
    fists.update(0.016, player, Math.PI / 4, groundAt, 0.016);
    fists.update(3.8, player, Math.PI / 4, groundAt, 3.816);

    expect(fists.group.visible).toBe(true);
    expect(fists.group.position.x).toBeGreaterThan(0);
    expect(fists.group.position.z).toBeLessThan(0);
    const assemblies = fists.group.children as THREE.Group[];
    for (const assembly of assemblies) {
      const side = assembly.name.endsWith('left') ? 'left' : 'right';
      const palm = scene.getObjectByName('earth-palm-stone') as THREE.Mesh;
      const stones = scene.children.filter((part) => part.name.startsWith('earth-'));
      expect(stones.length).toBeGreaterThan(35);
      expect(palm.position.y).toBeGreaterThan(1);
      expect(palm.scale.x).toBeGreaterThan(1.15);
      expect(scene.children.filter((part) => part.name === 'earth-knuckle')).toHaveLength(8);
      const knuckle = scene.getObjectByName('earth-knuckle') as THREE.Mesh;
      expect(fists.group.worldToLocal(knuckle.position.clone()).z).toBeLessThan(
        fists.group.worldToLocal(palm.position.clone()).z,
      );
      expect(scene.getObjectByName(`earth-source-${side}`)!.visible).toBe(true);
    }

    const sources = scene.children.filter((part) => part.name.startsWith('earth-source-'));
    const fixedSourcePositions = sources.map((source) => source.position.clone());
    const raised = (scene.getObjectByName('earth-palm-stone') as THREE.Mesh).position.y;
    player.x += 12;
    player.z -= 9;
    fists.update(0.5, player, Math.PI / 4, groundAt, 4.316);
    expect(sources.map((source) => source.position.toArray())).toEqual(
      fixedSourcePositions.map((position) => position.toArray()),
    );
    expect(fists.group.position.x).toBeGreaterThan(2);

    fists.setActive(false);
    fists.update(0.31, player, Math.PI / 4, groundAt, 4.626);
    expect(fists.group.visible).toBe(true);
    expect((scene.getObjectByName('earth-palm-stone') as THREE.Mesh).position.y).toBeLessThan(raised);

    fists.update(0.5, player, Math.PI / 4, groundAt, 5.126);
    expect(fists.group.visible).toBe(false);
    expect(sources.every((source) => !source.visible)).toBe(true);
    fists.dispose();
  });
});
