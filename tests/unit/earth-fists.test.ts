import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { EarthFists } from '../../src/game/EarthFists';

describe('Battle Mode earth fists', () => {
  it('pulls individual stones from the ground and assembles two fists, then retracts them', () => {
    const scene = new THREE.Scene();
    const fists = new EarthFists(scene);
    const player = new THREE.Vector3(2, 0.66, -3);
    const groundAt = () => 0;

    expect(fists.group.visible).toBe(false);
    expect(fists.group.children).toHaveLength(2);
    fists.setActive(true);
    fists.update(1.7, player, Math.PI / 4, groundAt, 1.7);

    expect(fists.group.visible).toBe(true);
    expect(fists.group.position.x).toBeGreaterThan(0);
    expect(fists.group.position.z).toBeLessThan(0);
    for (const assembly of fists.group.children) {
      const stones = assembly.children.filter((part) => part.name.startsWith('earth-'));
      expect(stones.length).toBeGreaterThan(12);
      expect(assembly.getObjectByName('earth-palm-stone')!.position.y).toBeGreaterThan(1);
      expect(assembly.children.filter((part) => part.name === 'earth-knuckle')).toHaveLength(4);
      expect(assembly.getObjectByName('earth-thumb')!.position.z).toBeGreaterThan(0);
    }

    const raised = (fists.group.children[0].getObjectByName('earth-palm-stone') as THREE.Mesh)
      .position.y;
    fists.setActive(false);
    fists.update(0.31, player, Math.PI / 4, groundAt, 2.01);
    expect(fists.group.visible).toBe(true);
    expect(
      (fists.group.children[0].getObjectByName('earth-palm-stone') as THREE.Mesh).position.y,
    ).toBeLessThan(raised);

    fists.update(0.4, player, Math.PI / 4, groundAt, 2.41);
    expect(fists.group.visible).toBe(false);
    fists.dispose();
  });
});
