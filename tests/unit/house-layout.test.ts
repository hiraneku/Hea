import { describe, expect, it } from 'vitest';
import { HOUSE, ROOMS, stairHeight, floorAt, canOccupy, moveInside } from '../../src/house/layout';

describe('two-storey family-house layout', () => {
  it('provides the agreed family rooms, split over two floors', () => {
    expect(ROOMS.filter((r) => r.floor === 0)).toHaveLength(2);
    expect(ROOMS.filter((r) => r.floor === 1)).toHaveLength(3);
    expect(ROOMS.find((r) => r.id === 'parents')!.position[1]).toBe(HOUSE.upper);
    expect(ROOMS.find((r) => r.id === 'children')!.position[1]).toBe(HOUSE.upper);
    for (const room of ROOMS)
      expect(floorAt(room.position[0], room.position[2], room.position[1])).toBe(room.position[1]);
  });
  it('climbs and descends the full continuous stair route without teleporting floors', () => {
    const up = moveInside(3.65, 3.55, 0, 0, -5, []);
    expect(up.z).toBeCloseTo(-1.45);
    expect(up.height).toBeCloseTo(3.4);
    const landing = moveInside(up.x, up.z, up.height, -1.65, 0, []);
    expect(landing.x).toBeCloseTo(2);
    expect(landing.height).toBe(3.4);
    const down = moveInside(up.x, up.z, up.height, 0, 5, []);
    expect(down.z).toBeCloseTo(3.55);
    expect(down.height).toBeCloseTo(0);
    expect(stairHeight(3.3)).toBe(0);
    expect(stairHeight(-1.12)).toBeCloseTo(3.4);
  });
  it('does not step into the stair void, through the underside, or across the outer shell', () => {
    expect(floorAt(4.4, 0, 3.4)).toBeNull();
    expect(floorAt(3.65, 0, 0)).toBeNull();
    expect(floorAt(5, 0, 0)).toBeNull();
    const wall = moveInside(0, 1.5, 0, 100, 0, []);
    expect(wall.x).toBeLessThanOrEqual(4.63);
    expect(wall.x).toBeGreaterThan(2.5);
  });
  it('blocks furniture, slides along it, and keeps floor-specific partitions separate', () => {
    const furniture = [{ x: 0, z: 0, w: 1, d: 1, floor: 0 }];
    expect(canOccupy(0, 0, 0, furniture)).toBe(false);
    expect(canOccupy(0, 0, 3.4, furniture)).toBe(true);
    const stopped = moveInside(-1.5, 0, 0, 3, 0, furniture);
    expect(stopped.x).toBeLessThan(-0.68);
    const slide = moveInside(-0.72, 0, 0, 0.5, 1.7, furniture);
    expect(slide.z).toBeGreaterThan(1.6);
  });
  it('substeps large movements instead of tunnelling through thin partitions', () => {
    const wall = [{ x: 0.25, z: 0, w: 0.14, d: 2.5, floor: 1 }];
    const stopped = moveInside(-1, 0, 3.4, 2.5, 0, wall);
    expect(stopped.x).toBeLessThan(0.25 - 0.07 - HOUSE.radius);
    const doorway = moveInside(-1, -1.75, 3.4, 2.5, 0, wall);
    expect(doorway.x).toBeGreaterThan(1.4);
  });
});
