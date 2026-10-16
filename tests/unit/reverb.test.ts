import { describe, it, expect } from 'vitest';
import { ARENA_ROOM, SEND, impulseResponse } from '../../src/game/reverb';

const OPTIONS = {
  sampleRate: 48000,
  seconds: 1.5,
  decay: 0.42,
  seed: 60415,
  reflections: ARENA_ROOM.reflections.map(([t, g]) => [t, g] as [number, number]),
};

/** Energy in a window of samples. */
function energy(channel: Float32Array, from: number, to: number) {
  let sum = 0;
  for (let i = from; i < to; i++) sum += channel[i] * channel[i];
  return sum;
}

describe('the arena as an impulse response', () => {
  it('is a stereo tail of the requested length, normalised and deterministic', () => {
    const [left, right] = impulseResponse(OPTIONS);
    expect(left.length).toBe(Math.round(OPTIONS.seconds * OPTIONS.sampleRate));
    expect(right.length).toBe(left.length);
    let peak = 0;
    for (const v of [...left, ...right]) peak = Math.max(peak, Math.abs(v));
    expect(peak).toBeGreaterThan(0.9);
    expect(peak).toBeLessThanOrEqual(1.0001);
    expect(impulseResponse(OPTIONS)[0]).toEqual(left);
    expect(impulseResponse({ ...OPTIONS, seed: 7 })[0]).not.toEqual(left);
  });

  it('puts the early reflections where the room says they are', () => {
    const [left] = impulseResponse(OPTIONS),
      rate = OPTIONS.sampleRate;
    for (const [time, gain] of OPTIONS.reflections) {
      const at = Math.round(time * rate),
        window = energy(left, at, at + 16);
      // Every tap is louder than the diffuse tail around it, or it would not read as a wall.
      expect(window).toBeGreaterThan(gain * gain * 0.4);
    }
    // The first tap really is the first thing that arrives.
    expect(Math.abs(left[0])).toBeLessThan(0.05);
  });

  it('decays: late energy is a small fraction of early energy', () => {
    const [left] = impulseResponse(OPTIONS),
      rate = OPTIONS.sampleRate;
    const early = energy(left, Math.round(0.05 * rate), Math.round(0.15 * rate)),
      late = energy(left, Math.round(1.1 * rate), Math.round(1.4 * rate));
    expect(late).toBeLessThan(early * 0.05);
    expect(late).toBeGreaterThan(0);
  });

  it('decorrelates the two channels, so the tail has width rather than a mono echo', () => {
    const [left, right] = impulseResponse(OPTIONS),
      // Compare where there is still energy: the deep tail has decayed to zero in both channels,
      // and two silences are trivially identical.
      audible = Math.round(0.6 * OPTIONS.sampleRate);
    let same = 0,
      total = 0;
    for (let i = 0; i < audible; i += 7) {
      if (Math.abs(left[i] - right[i]) < 1e-6) same++;
      total++;
    }
    expect(total).toBeGreaterThan(1000);
    expect(same / total).toBeLessThan(0.05);
  });

  it('sends impacts to the room and keeps the interface dry', () => {
    expect(SEND.crash).toBeGreaterThan(SEND.block);
    expect(SEND.impact).toBeGreaterThan(0.3);
    expect(SEND.hud).toBe(0);
    // The room is a room, not a cathedral: an arena this size rings for about a second and a half.
    expect(ARENA_ROOM.seconds).toBeLessThan(3);
    expect(ARENA_ROOM.reflections.length).toBeGreaterThan(3);
    expect(ARENA_ROOM.reflections[0][0]).toBeLessThan(0.02);
  });
});
