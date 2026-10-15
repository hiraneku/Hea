import { describe, expect, it } from 'vitest';
import { ScorchMarks } from '../../src/game/Scorches';
import { adaptDensity } from '../../src/game/Effects';

const colours = (s: ScorchMarks) => s.mesh.geometry.getAttribute('color').array as Float32Array;
const positions = (s: ScorchMarks) =>
  s.mesh.geometry.getAttribute('position').array as Float32Array;

describe('ground scorch marks', () => {
  it('drapes a dark, ragged disc over the terrain that bleaches away over the last 40 %', () => {
    const s = new ScorchMarks(4);
    s.setGroundSampler((x, z) => 0.5 + x * 0.1 + z * 0.05);
    s.add(10, 20, 1.2, 6, 100);
    expect(s.count).toBe(1);
    const p = positions(s),
      c = colours(s);
    // 25 vertices per mark: the centre vertex (row 2, column 2) sits on the sampled ground.
    const centre = 2 * 5 + 2;
    expect(p[centre * 3]).toBeCloseTo(10, 5);
    expect(p[centre * 3 + 2]).toBeCloseTo(20, 5);
    expect(p[centre * 3 + 1]).toBeCloseTo(0.5 + 1 + 1 + 0.035, 5);
    // Dark core (warm: red survives slightly more than blue), clean white rim.
    expect(c[centre * 3 + 2]).toBeLessThan(0.3);
    expect(c[centre * 3]).toBeGreaterThan(c[centre * 3 + 2]);
    expect(c[0]).toBeCloseTo(1, 5);
    expect(Math.hypot(p[0] - 10, p[2] - 20)).toBeGreaterThan(1.2 * 0.75);
    s.update(103);
    const held = c[centre * 3 + 2];
    expect(held).toBeLessThan(0.3);
    s.update(105);
    expect(c[centre * 3 + 2]).toBeGreaterThan(held);
    expect(c[centre * 3 + 2]).toBeLessThan(1);
    s.update(106.1);
    expect(s.count).toBe(0);
    expect(p[centre * 3 + 1]).toBe(-1000);
    expect(c[centre * 3 + 2]).toBe(1);
  });
  it('recycles the oldest slot once the pool is full', () => {
    const s = new ScorchMarks(3);
    for (let i = 0; i < 5; i++) s.add(i * 3, 0, 1, 10, i);
    expect(s.count).toBe(3);
    const p = positions(s);
    // Slot 0 now holds the fourth mark (x = 9), slot 1 the fifth (x = 12), slot 2 the third.
    expect(p[(2 * 5 + 2) * 3]).toBeCloseTo(9, 5);
    expect(p[(25 + 2 * 5 + 2) * 3]).toBeCloseTo(12, 5);
    expect(p[(50 + 2 * 5 + 2) * 3]).toBeCloseTo(6, 5);
    s.clear();
    expect(s.count).toBe(0);
  });
});

describe('adaptive particle density', () => {
  it('drops quickly under load, recovers slowly, and never starves impacts', () => {
    expect(adaptDensity(1, 60)).toBe(1);
    expect(adaptDensity(1, 24)).toBeCloseTo(0.85, 5);
    let d = 1;
    for (let i = 0; i < 10; i++) d = adaptDensity(d, 20);
    expect(d).toBeCloseTo(0.3, 5);
    expect(adaptDensity(0.3, 36)).toBeCloseTo(0.35, 5);
    d = 0.3;
    for (let i = 0; i < 40; i++) d = adaptDensity(d, 36);
    expect(d).toBeCloseTo(0.6, 5);
    for (let i = 0; i < 40; i++) d = adaptDensity(d, 90);
    expect(d).toBeCloseTo(1, 5);
  });
});
