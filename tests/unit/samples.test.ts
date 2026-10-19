import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SAMPLE_FILES } from '../../src/game/Audio';

const SFX_DIR = join(process.cwd(), 'public', 'sfx');

describe('sample bank manifest', () => {
  it('every manifest entry exists on disk as a small web-ready ogg', () => {
    for (const [name, file] of Object.entries(SAMPLE_FILES)) {
      const path = join(SFX_DIR, file);
      expect(existsSync(path), `${name} -> ${file}`).toBe(true);
      const size = statSync(path).size;
      expect(size, `${file} size`).toBeGreaterThan(1000);
      expect(size, `${file} size`).toBeLessThan(300_000);
      // Ogg capture pattern: no sample sneaks in as another format.
      expect(readFileSync(path).subarray(0, 4).toString('latin1')).toBe('OggS');
    }
  });

  it('ships the CC0 licence and mapping next to the samples', () => {
    const licence = readFileSync(join(SFX_DIR, 'LICENSE.txt'), 'utf8');
    expect(licence).toContain('CC0');
    expect(licence).toContain('Kenney');
    for (const file of Object.values(SAMPLE_FILES)) expect(licence).toContain(file);
  });

  it('covers the three spells this layer was bought for', () => {
    const names = Object.keys(SAMPLE_FILES);
    for (const spell of ['prisma', 'nova', 'fall'])
      expect(
        names.some((n) => n.startsWith(spell)),
        spell,
      ).toBe(true);
  });
});
