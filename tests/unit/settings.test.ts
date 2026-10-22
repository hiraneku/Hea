import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_BINDINGS,
  DEFAULT_SETTINGS,
  HUD_SCALE_RANGE,
  normalizeBindings,
  readSettings,
} from '../../src/game/types';

describe('normalizeBindings', () => {
  it('keeps a valid custom map', () => {
    const bindings = normalizeBindings({ ...DEFAULT_BINDINGS, dash: 'AltLeft', cycle: 'KeyR' });
    expect(bindings.dash).toBe('AltLeft');
    expect(bindings.cycle).toBe('KeyR');
    expect(bindings.forward).toBe('KeyW');
  });

  it('falls back per action for missing, malformed or non-string codes', () => {
    const bindings = normalizeBindings({ forward: 42, back: 'bad code!', left: '', right: 'KeyL' });
    expect(bindings.forward).toBe(DEFAULT_BINDINGS.forward);
    expect(bindings.back).toBe(DEFAULT_BINDINGS.back);
    expect(bindings.left).toBe(DEFAULT_BINDINGS.left);
    expect(bindings.right).toBe('KeyL');
  });

  it('never lets two actions share a key: a claimed default is swapped, not duplicated', () => {
    const bindings = normalizeBindings({ dash: 'KeyE' });
    expect(bindings.dash).toBe('KeyE');
    expect(bindings.focus).toBe(DEFAULT_BINDINGS.dash);
    const codes = Object.values(bindings);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('survives a corrupt save entirely', () => {
    expect(normalizeBindings(null)).toEqual(DEFAULT_BINDINGS);
    expect(normalizeBindings('KeyW')).toEqual(DEFAULT_BINDINGS);
  });
});

describe('readSettings accessibility fields', () => {
  afterEach(() => vi.unstubAllGlobals());

  function stored(value: unknown) {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    vi.stubGlobal('localStorage', {
      getItem: () => JSON.stringify(value),
    });
    return readSettings();
  }

  it('reads the accessibility settings and clamps the HUD scale', () => {
    const settings = stored({
      aimAssist: false,
      threatIndicator: false,
      colorVision: 'deuteranopia',
      hudScale: 99,
      bindings: { dash: 'AltLeft' },
    });
    expect(settings.aimAssist).toBe(false);
    expect(settings.threatIndicator).toBe(false);
    expect(settings.colorVision).toBe('deuteranopia');
    expect(settings.hudScale).toBe(HUD_SCALE_RANGE.max);
    expect(settings.bindings.dash).toBe('AltLeft');
  });

  it('rejects unknown palettes and keeps the defaults for absent fields', () => {
    const settings = stored({ colorVision: 'infrared' });
    expect(settings.colorVision).toBe(DEFAULT_SETTINGS.colorVision);
    expect(settings.aimAssist).toBe(DEFAULT_SETTINGS.aimAssist);
    expect(settings.threatIndicator).toBe(DEFAULT_SETTINGS.threatIndicator);
    expect(settings.hudScale).toBe(DEFAULT_SETTINGS.hudScale);
    expect(settings.bindings).toEqual(DEFAULT_BINDINGS);
    expect(settings.bossMode).toBe('battle');
  });

  it('restores the silent target mode and rejects unknown mode values', () => {
    expect(stored({ bossMode: 'silent' }).bossMode).toBe('silent');
    expect(stored({ bossMode: 'sleep' }).bossMode).toBe('battle');
  });

  it('brings the old default chase distance in closer while preserving versioned preferences', () => {
    expect(stored({ cameraDistance: 6.2 }).cameraDistance).toBe(DEFAULT_SETTINGS.cameraDistance);
    expect(stored({ cameraDistance: 6.2, cameraVersion: 2 }).cameraDistance).toBe(6.2);
  });
});
