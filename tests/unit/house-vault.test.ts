import { describe, it, expect, vi } from 'vitest';
import * as T from 'three';
vi.mock('../../src/house/materials', async () => {
  const t = await import('three');
  return {
    M: {
      roof: new t.MeshStandardMaterial(),
      plaster: new t.MeshStandardMaterial(),
      dark: new t.MeshStandardMaterial(),
      oak: new t.MeshStandardMaterial(),
    },
  };
});
import { buildVault } from '../../src/house/vault';
import { HOUSE } from '../../src/house/layout';

describe('open timber vault', () => {
  it('has a tall pitched clearance instead of a hidden old flat ceiling', () => {
    const world = new T.Group(),
      collision = new T.Group(),
      mat = new T.MeshBasicMaterial({ side: T.DoubleSide });
    const vault = buildVault(world, collision, mat);
    collision.updateMatrixWorld(true);
    const center = new T.Raycaster(
      new T.Vector3(0, 1.5, 0),
      new T.Vector3(0, 1, 0),
    ).intersectObject(collision, true);
    expect(HOUSE.ridge).toBe(5.9);
    expect(center[0].point.y).toBeGreaterThan(5.5);
    const slope = new T.Raycaster(new T.Vector3(2, 1.5, 1), new T.Vector3(0, 1, 0)).intersectObject(
      collision,
      true,
    );
    expect(slope[0].point.y).toBeGreaterThan(4.3);
    expect(slope[0].point.y).toBeLessThan(5.3);
    vault.dispose();
  });
  it('cuts a real high window aperture rather than painting glass over a wall', () => {
    const world = new T.Group(),
      collision = new T.Group();
    const vault = buildVault(world, collision, new T.MeshBasicMaterial({ side: T.DoubleSide }));
    collision.updateMatrixWorld(true);
    const ray = (x: number) => {
      const r = new T.Raycaster(new T.Vector3(x, 4.2, -5), new T.Vector3(0, 0, 1), 0, 1);
      return r.intersectObject(collision, true);
    };
    expect(ray(0)).toHaveLength(0);
    expect(ray(1.2).length).toBeGreaterThan(0);
    vault.dispose();
  });
});
