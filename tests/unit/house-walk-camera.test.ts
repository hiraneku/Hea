import { describe, expect, it } from 'vitest';
import { WalkCamera } from '../../src/house/WalkCamera';
describe('first-person walking camera', () => {
  it('follows travelled distance with gentle alternating steps', () => {
    const camera = new WalkCamera();
    let out = { side: 0, y: 0, roll: 0, pitch: 0 };
    for (let i = 0; i < 15; i++) out = camera.update(1 / 60, 0.85 / 60, true);
    expect(out.y).toBeGreaterThan(0.001);
    expect(Math.abs(out.roll)).toBeLessThan(0.003);
    const first = out.y;
    for (let i = 0; i < 15; i++) out = camera.update(1 / 60, 0.85 / 60, true);
    expect(out.y).toBeLessThan(-0.001);
    expect(out.y).toBeLessThan(first);
  });
  it('settles smoothly at rest and resets in reduced-motion mode', () => {
    const camera = new WalkCamera();
    for (let i = 0; i < 40; i++) camera.update(1 / 60, 0.014, true);
    let out = { side: 0, y: 0, roll: 0, pitch: 0 };
    for (let i = 0; i < 90; i++) out = camera.update(1 / 60, 0, true);
    expect(Math.abs(out.y)).toBeLessThan(0.0005);
    expect(camera.update(0.016, 0.02, false)).toEqual({ side: 0, y: 0, roll: 0, pitch: 0 });
  });
});
