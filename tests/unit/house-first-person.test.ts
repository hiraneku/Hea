import { describe, it, expect } from 'vitest';
import * as T from 'three';
import { firstPersonBody } from '../../src/house/firstPersonBody';
import { HOUSE, LIVING, RUG, moveInside } from '../../src/house/layout';
describe('house corrections', () => {
  it('walks at a deliberately slow indoor pace', () => {
    expect(HOUSE.walkSpeed).toBe(0.85);
    expect(HOUSE.walkSpeed).toBeLessThan(1);
  });
  it('leaves clearance between rug, chairs and the hearth footprint', () => {
    const hearthLeft = LIVING.fireplace.x - LIVING.fireplace.w / 2;
    expect(hearthLeft - (RUG.x + RUG.w / 2)).toBeGreaterThan(0.9);
    expect(hearthLeft - (LIVING.rocking.x + LIVING.rocking.w / 2)).toBeGreaterThan(0.6);
  });
  it('walks through the open arch but not beside its jamb or through the hall end', () => {
    expect(moveInside(-2.85, -3.5, 0, 0, -2.6, []).z).toBeCloseTo(-6.1);
    expect(moveInside(-1.8, -3.5, 0, 0, -2, []).z).toBeGreaterThan(-4);
    expect(moveInside(-2.85, -5.5, 0, 0, -3, []).z).toBeGreaterThan(-6.2);
  });
  it('removes head triangles in a private geometry without changing bones or source mesh', () => {
    const g = new T.BufferGeometry();
    g.setAttribute(
      'position',
      new T.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 2, 0, 1, 2, 0, 0, 3, 0], 3),
    );
    g.setAttribute(
      'skinIndex',
      new T.Uint16BufferAttribute(
        Array.from({ length: 6 }, (_, i) => [i < 3 ? 0 : 1, 0, 0, 0]).flat(),
        4,
      ),
    );
    g.setAttribute(
      'skinWeight',
      new T.Float32BufferAttribute(Array.from({ length: 6 }, () => [1, 0, 0, 0]).flat(), 4),
    );
    g.setIndex([0, 1, 2, 3, 4, 5]);
    const torso = new T.Bone(),
      head = new T.Bone();
    head.name = 'Head';
    torso.add(head);
    const mesh = new T.SkinnedMesh(g, new T.MeshBasicMaterial());
    mesh.bind(new T.Skeleton([torso, head]));
    const body = firstPersonBody(mesh);
    expect(Array.from(body.index!.array)).toEqual([0, 1, 2]);
    expect(g.index!.count).toBe(6);
    expect(head.scale.toArray()).toEqual([1, 1, 1]);
    body.dispose();
    g.dispose();
  });
});
