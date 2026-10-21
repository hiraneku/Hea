import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { cameraClearance, HouseFollowCamera } from '../../src/house/followCamera';
const wall = (z: number, transparent = false) => {
  const m = new T.Mesh(
    new T.BoxGeometry(5, 5, 0.1),
    new T.MeshBasicMaterial({ side: T.DoubleSide, transparent }),
  );
  m.position.set(0, 1, z);
  return m;
};
describe('house avatar follow camera', () => {
  it('keeps its boom in empty space and pulls in before an opaque wall', () => {
    const target = new T.Vector3(0, 1, 0),
      direction = new T.Vector3(0, 0, 1);
    expect(cameraClearance(target, direction, new T.Group())).toBe(2.25);
    expect(cameraClearance(target, direction, wall(1))).toBeCloseTo(0.77);
  });
  it('ignores transparent decorations and protects the corner rays', () => {
    expect(cameraClearance(new T.Vector3(0, 1, 0), new T.Vector3(0, 0, 1), wall(1, true))).toBe(
      2.25,
    );
    const edge = new T.Mesh(new T.BoxGeometry(0.06, 2, 0.1), new T.MeshBasicMaterial());
    edge.position.set(0.12, 1, 1);
    expect(cameraClearance(new T.Vector3(0, 1, 0), new T.Vector3(0, 0, 1), edge)).toBeLessThan(1);
  });
  it('snaps inward, widens tight-room framing, then eases outward without crossing a wall', () => {
    const follow = new HouseFollowCamera(),
      camera = new T.PerspectiveCamera(67, 1, 0.07, 100);
    follow.update(camera, 1 / 60, 0, 0, 0, 0, 0, wall(1));
    expect(follow.distance).toBeLessThan(1);
    expect(camera.position.z).toBeLessThan(0.95);
    expect(camera.fov).toBeGreaterThan(90);
    const before = follow.distance;
    follow.update(camera, 1 / 60, 0, 0, 0, 0, 0, new T.Group());
    expect(follow.distance).toBeGreaterThan(before);
    expect(follow.distance).toBeLessThan(2.25);
  });
});
