import { describe, expect, it } from 'vitest';
import { HOUSE, ROOMS, LIVING, floorAt, canOccupy, moveInside } from '../../src/house/layout';
describe('reference living room, first stage', () => {
  it('uses reference dimensions and only the agreed living room', () => {
    expect(HOUSE.width).toBe(8.11);
    expect(HOUSE.depth).toBe(8.3);
    expect(ROOMS.map((r) => r.id)).toEqual(['living']);
    expect(floorAt(0, 2.55, 0)).toBe(0);
    expect(floorAt(0, 0, 3.4)).toBeNull();
  });
  it('keeps seating north-east and entry/open circulation south', () => {
    expect(LIVING.sofa.z).toBeLessThan(-3);
    expect(LIVING.fireplace.x).toBeGreaterThan(3.5);
    expect(LIVING.armchair.x).toBeLessThan(LIVING.rocking.x);
    expect(LIVING.coat.z).toBeGreaterThan(3);
    const b = Object.values(LIVING);
    for (const z of [3, 2, 1, 0]) expect(canOccupy(0, z, 0, b)).toBe(true);
  });
  it('cannot exit the shell or an unbuilt future room', () => {
    const p = moveInside(0, 1.5, 0, 100, 0, []);
    expect(p.x).toBeLessThanOrEqual(HOUSE.width / 2 - HOUSE.radius);
    expect(floorAt(0, 4.16, 0)).toBeNull();
  });
  it('blocks furniture but permits sliding along its edge', () => {
    const b = [{ x: 0, z: 0, w: 1, d: 1, floor: 0 }];
    expect(canOccupy(0, 0, 0, b)).toBe(false);
    const p = moveInside(-1.5, 0, 0, 3, 0, b);
    expect(p.x).toBeLessThan(-0.68);
    expect(moveInside(-0.72, 0, 0, 0.5, 1.7, b).z).toBeGreaterThan(1.6);
  });
  it('substeps instead of tunnelling through a thin collider', () => {
    const b = [{ x: 0.25, z: 0, w: 0.14, d: 2.5, floor: 0 }];
    expect(moveInside(-1, 0, 0, 2.5, 0, b).x).toBeLessThan(0.25 - 0.07 - HOUSE.radius);
    expect(moveInside(-1, -1.75, 0, 2.5, 0, b).x).toBeGreaterThan(1.4);
  });
});
