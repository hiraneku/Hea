import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { EarthFists } from '../../src/game/EarthFists';

describe('Battle Mode earth fists', () => {
  it('forms two continuous ground-grown arms into detailed fists, idles, and retracts smoothly', () => {
    const scene = new THREE.Scene();
    const fists = new EarthFists(scene);
    const player = new THREE.Vector3(2, 0.66, -3);
    const groundAt = () => 0;

    expect(fists.group.visible).toBe(false);
    expect(fists.group.children).toHaveLength(2);
    fists.setActive(true);
    fists.update(1.4, player, Math.PI / 4, groundAt, 1.4);

    expect(fists.group.visible).toBe(true);
    expect(fists.group.position.x).toBeGreaterThan(0);
    expect(fists.group.position.z).toBeLessThan(0);
    for (const arm of fists.group.children) {
      const forearm = arm.getObjectByName('earth-forearm') as THREE.Mesh;
      const fist = arm.getObjectByName('earth-fist') as THREE.Group;
      expect(forearm.scale.y).toBeGreaterThan(1);
      expect(fist.scale.x).toBeCloseTo(1);
      expect(fist.children.length).toBeGreaterThan(9);
    }

    fists.setActive(false);
    fists.update(0.24, player, Math.PI / 4, groundAt, 1.64);
    expect(fists.group.visible).toBe(true);
    expect(
      (fists.group.children[0].getObjectByName('earth-fist') as THREE.Group).scale.x,
    ).toBeLessThan(1);

    fists.update(0.3, player, Math.PI / 4, groundAt, 1.94);
    expect(fists.group.visible).toBe(false);
    fists.dispose();
  });
});
