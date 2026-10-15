import { describe, expect, it } from 'vitest';
import { MeshStandardMaterial, Quaternion, Scene, Vector3 } from 'three';
import { RAGDOLL_CENTER, Ragdoll } from '../../src/game/Ragdoll';

const flat = { height: () => 0, obstacles: [] };
const facing = new Quaternion();

function thrown(spin = new Vector3(0, 0, 9)) {
  const scene = new Scene(),
    doll = new Ragdoll(scene, new MeshStandardMaterial());
  doll.spawn(new Vector3(0, RAGDOLL_CENTER, 0), facing, new Vector3(1, 0.2, 0), spin);
  return { scene, doll };
}

describe('the jointed ragdoll', () => {
  it('starts in the standing pose: head up, feet on the ground, about 1.2 m head to heel', () => {
    const { scene, doll } = thrown(new Vector3());
    expect(scene.getObjectByName('player-ragdoll')).toBeDefined();
    expect(doll.active).toBe(true);
    expect(doll.spawns).toBe(1);
    const shape = doll.shape;
    expect(shape.lowest).toBeGreaterThan(-0.01);
    expect(shape.lowest).toBeLessThan(0.1);
    expect(shape.span).toBeGreaterThan(1.1);
    expect(shape.span).toBeLessThan(1.3);
  });

  it('keeps every bone at its rest length while it tumbles', () => {
    const { doll } = thrown();
    const rest = doll.nodes.map((node) => node.pos.clone());
    // Pairs that must stay rigid: torso, upper and lower arms, thighs and shins.
    const bones: [number, number][] = [
      [0, 1],
      [1, 2],
      [3, 5],
      [5, 7],
      [4, 6],
      [6, 8],
      [9, 11],
      [11, 13],
      [10, 12],
      [12, 14],
    ];
    const anchor = new Vector3(0, 0.3, 0);
    for (let t = 0; t < 1.5; t += 1 / 60) {
      anchor.x += 6 / 60;
      doll.step(1 / 60, anchor, flat, 0, anchor, facing);
      for (const [a, b] of bones) {
        const length = doll.nodes[a].pos.distanceTo(doll.nodes[b].pos),
          expected = rest[a].distanceTo(rest[b]);
        // The spawn fling is random; a 5 cm tolerance keeps the check about the solver, not luck.
        expect(Math.abs(length - expected)).toBeLessThan(0.05);
      }
    }
  });

  it('never sinks below the ground and ends up lying down, not stretched or balled up', () => {
    const { doll } = thrown();
    const anchor = new Vector3(0, 0.3, 0);
    let lowest = Infinity;
    for (let t = 0; t < 2.5; t += 1 / 60) {
      anchor.x += (t < 1 ? 8 : 0) / 60;
      doll.step(1 / 60, anchor, flat, 0, anchor, facing);
      lowest = Math.min(lowest, doll.shape.lowest);
    }
    expect(lowest).toBeGreaterThan(-0.03);
    const shape = doll.shape;
    expect(shape.span).toBeGreaterThan(0.5);
    expect(shape.span).toBeLessThan(1.3);
    // Lying: the head is at most knee height above the ground.
    expect(doll.nodes[2].pos.y).toBeLessThan(0.6);
    expect(doll.contacts).toBeGreaterThan(50);
  });

  it('is dragged along by its pelvis tether and trails behind the root', () => {
    const { doll } = thrown(new Vector3());
    const anchor = new Vector3(0, 0.3, 0);
    for (let t = 0; t < 1; t += 1 / 60) {
      anchor.x += 20 / 60;
      doll.step(1 / 60, anchor, flat, 0, anchor, facing);
    }
    const pelvis = doll.nodes[0].pos;
    expect(pelvis.x).toBeGreaterThan(anchor.x - 1.5);
    // Hands and feet trail the pelvis in the direction of travel.
    const extremities = [7, 8, 13, 14].map((i) => doll.nodes[i].pos.x);
    expect(Math.min(...extremities)).toBeLessThan(pelvis.x);
  });

  it('gathers itself back into the standing pose as the body rises', () => {
    const { doll } = thrown();
    const anchor = new Vector3(0, 0.3, 0);
    for (let t = 0; t < 1.2; t += 1 / 60) doll.step(1 / 60, anchor, flat, 0, anchor, facing);
    const center = new Vector3(anchor.x, RAGDOLL_CENTER, anchor.z);
    for (let k = 0.1; k <= 1; k += 0.1) doll.step(1 / 60, center, flat, k, center, facing);
    const shape = doll.shape;
    expect(doll.nodes[2].pos.y).toBeGreaterThan(1.1);
    expect(shape.span).toBeGreaterThan(1.1);
    doll.finish();
    expect(doll.active).toBe(false);
    doll.reset();
    expect(doll.spawns).toBe(0);
  });
});
