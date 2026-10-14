import { describe, expect, it } from 'vitest';
import { Scene, Texture, Vector3 } from 'three';
import { Boss } from '../../src/game/Boss';
import type { Effects } from '../../src/game/Effects';

describe('spell-circle emission', () => {
  it('all six seekers originate on the rotated frontal sigil, not from shoulder launchers', () => {
    const boss = new Boss(new Scene(), { sigilMap: new Texture() } as Effects);
    boss.present(4, 0.01, new Vector3(15, 3, 8), new Vector3(0, 4, 20));
    const points = Array.from({ length: 6 }, (_, i) => boss.group.worldToLocal(boss.spellPort(i)));
    for (const p of points) {
      expect(Math.hypot(p.x, p.y - 0.1)).toBeCloseTo(0.86);
      expect(p.z).toBeCloseTo(0.78);
      expect(Math.abs(p.x)).toBeLessThan(1.22);
    }
    for (let i = 0; i < 6; i++) expect(points[i].distanceTo(points[(i + 1) % 6])).toBeCloseTo(0.86);
  });
});
