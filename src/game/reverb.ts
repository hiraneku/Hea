/**
 * The arena's room, as an impulse response rather than an algorithm: a stone plaza between
 * concrete monoliths. An IR can be generated — the taps are just numbers — and a convolver fed
 * one is the difference between a sound happening *at* the player and a sound happening *in a
 * place*, which is what the whole pivot is for.
 *
 * Pure maths, so it can be measured: the decay really is exponential, the early reflections sit
 * where the geometry says they do, and the tail is quiet enough to be a room and not a wash.
 */
import { seededRandom } from './math';

export interface ImpulseOptions {
  sampleRate: number;
  /** Seconds until the tail is effectively gone. */
  seconds: number;
  seed: number;
  /** Seconds for the tail to fall by 60 dB; defaults to a quarter of `seconds`. */
  decay?: number;
  /** Early reflection times in seconds, each with its own gain. */
  reflections?: [number, number][];
}

/**
 * A stereo impulse response: early reflections on top of a smooth exponential tail, each channel
 * decorrelated so the reverb reads as width rather than as a mono echo. Stereo, because a
 * convolver with a two-channel IR pans the tail around the listener's head.
 */
export function impulseResponse(options: ImpulseOptions): Float32Array[] {
  const { sampleRate, seconds, seed } = options,
    decay = options.decay ?? Math.max(0.15, seconds * 0.25),
    reflections = options.reflections ?? [],
    length = Math.max(1, Math.round(seconds * sampleRate)),
    random = seededRandom(seed),
    channels: Float32Array[] = [];
  for (let channel = 0; channel < 2; channel++) {
    const data = new Float32Array(length);
    // Diffuse tail: noise under an exponential envelope, with a short build so the reverb does
    // not slap in on the very first sample.
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate,
        envelope = Math.exp(-t / (decay / 6.9078)) * Math.min(1, t / 0.012);
      data[i] = (random() * 2 - 1) * envelope;
    }
    // Early reflections: the first wall, the floor, a monolith across the plaza. Each is a tap
    // with its own colour, offset by a sample per channel so the pair is not identical.
    for (const [time, gain] of reflections) {
      const at = Math.round(time * sampleRate) + channel * 3;
      if (at >= length) continue;
      data[at] += gain * (channel ? 0.92 : 1);
      // A tap is a wall, not a click: smear it over a few samples.
      for (let k = 1; k <= 12; k++) {
        const index = at + k;
        if (index >= length) break;
        data[index] += gain * 0.35 * (1 - k / 13) * (random() * 2 - 1);
      }
    }
    // Normalise so the loudest tap is unity: the send level, not the IR, sets how wet it is.
    let peak = 0;
    for (const v of data) peak = Math.max(peak, Math.abs(v));
    if (peak > 0) for (let i = 0; i < length; i++) data[i] /= peak;
    channels.push(data);
  }
  return channels;
}

/** The arena as it is built today: a plaza about forty metres across, walls six metres up. */
export const ARENA_ROOM = {
  seconds: 1.5,
  decay: 0.42,
  reflections: [
    [0.0125, 0.5],
    [0.021, 0.34],
    [0.039, 0.26],
    [0.058, 0.2],
    [0.092, 0.15],
    [0.131, 0.12],
  ] as [number, number][],
} as const;

/** How much of each cue goes to the room. Impacts are wet; the HUD is bone dry. */
export const SEND = {
  cast: 0.22,
  beam: 0.3,
  impact: 0.5,
  crash: 0.55,
  block: 0.18,
  vortex: 0.45,
  detonate: 0.5,
  step: 0.16,
  hud: 0,
} as const;
