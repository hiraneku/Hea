import type { Settings } from './types';

type Actor = 'player' | 'boss';
interface ScrapeLoop {
  source: AudioBufferSourceNode;
  band: BiquadFilterNode;
  rumble: BiquadFilterNode;
  gain: GainNode;
  rumbleGain: GainNode;
  fed: number;
}

/**
 * Small procedural sound bank. Nothing is fetched and audio only starts after a user gesture.
 *
 * Mix: every one-shot runs into one bus that ends in a gentle compressor, so a heavy landing
 * on top of a salvo cannot clip, and the quiet cues (the Aegis raise, the telegraph charge)
 * sit at a level where they still read. Repeating cues (shield chimes under a 54-bolt salvo)
 * are rate-limited and duck themselves instead of stacking into a buzz. The drag of a body
 * across the ground is a continuous scrape loop driven by its speed, not a one-shot.
 */
export class AudioEngine {
  private context?: AudioContext;
  private master?: GainNode;
  private bus?: GainNode;
  private settings: Settings;
  private noise?: AudioBuffer;
  private scrapes = new Map<Actor, ScrapeLoop>();
  private recent = new Map<string, number[]>();
  constructor(settings: Settings) {
    this.settings = settings;
  }

  unlock() {
    try {
      this.context ??= new AudioContext();
      if (!this.master) {
        const ctx = this.context;
        this.master = ctx.createGain();
        const limiter = ctx.createDynamicsCompressor();
        limiter.threshold.value = -16;
        limiter.knee.value = 14;
        limiter.ratio.value = 4;
        limiter.attack.value = 0.004;
        limiter.release.value = 0.16;
        this.bus = ctx.createGain();
        this.bus.gain.value = 1;
        this.bus.connect(limiter);
        limiter.connect(this.master);
        this.master.connect(ctx.destination);
        const length = ctx.sampleRate;
        this.noise = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = this.noise.getChannelData(0);
        for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
      }
      this.apply(this.settings);
      void this.context.resume().catch(() => {});
    } catch {
      /* WebAudio is optional. */
    }
  }

  apply(settings: Settings) {
    this.settings = settings;
    if (this.context && this.master)
      this.master.gain.setTargetAtTime(
        settings.sound ? settings.volume * 0.6 : 0,
        this.context.currentTime,
        0.03,
      );
  }

  private get live() {
    return !!(
      this.context &&
      this.bus &&
      this.noise &&
      this.settings.sound &&
      this.context.state === 'running'
    );
  }

  /**
   * Repeat guard for cues that can fire many times a second: drops repeats closer than `gap`
   * and returns a duck factor that falls as more of them land inside the last half second.
   */
  private crowd(key: string, gap: number): number {
    if (!this.context) return 0;
    const now = this.context.currentTime,
      times = (this.recent.get(key) ?? []).filter((t) => now - t < 0.5);
    if (times.length && now - times[times.length - 1] < gap) {
      this.recent.set(key, times);
      return 0;
    }
    times.push(now);
    this.recent.set(key, times);
    return 1 / (1 + (times.length - 1) * 0.35);
  }

  private tone(
    frequency: number,
    end: number,
    duration: number,
    volume: number,
    type: OscillatorType = 'sine',
    delay = 0,
  ) {
    if (!this.live || volume <= 0) return;
    const ctx = this.context!,
      at = ctx.currentTime + delay;
    const oscillator = ctx.createOscillator(),
      gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, end), at + duration);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(volume, at + 0.009);
    gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
    oscillator.connect(gain);
    gain.connect(this.bus!);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.03);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }

  private air(duration: number, frequency: number, volume: number) {
    if (!this.live || volume <= 0) return;
    const ctx = this.context!,
      at = ctx.currentTime;
    const source = ctx.createBufferSource(),
      filter = ctx.createBiquadFilter(),
      gain = ctx.createGain();
    source.buffer = this.noise!;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(frequency, at);
    filter.frequency.exponentialRampToValueAtTime(90, at + duration);
    gain.gain.setValueAtTime(volume, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.bus!);
    source.start(at);
    source.stop(at + duration);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  /**
   * A body ploughing along the ground. Call every frame it is dragged with its ground speed;
   * the loop's level and colour follow the speed (a fast skid hisses, a slow grind rumbles)
   * and it fades out by itself a moment after the feeding stops.
   */
  scrape(actor: Actor, speed: number, weight = 1) {
    if (!this.live) return;
    const ctx = this.context!,
      now = ctx.currentTime;
    let loop = this.scrapes.get(actor);
    if (!loop) {
      const source = ctx.createBufferSource(),
        band = ctx.createBiquadFilter(),
        rumble = ctx.createBiquadFilter(),
        gain = ctx.createGain(),
        rumbleGain = ctx.createGain();
      source.buffer = this.noise!;
      source.loop = true;
      band.type = 'bandpass';
      band.Q.value = 0.9;
      rumble.type = 'lowpass';
      rumble.frequency.value = 160;
      gain.gain.value = 0;
      rumbleGain.gain.value = 0;
      source.connect(band);
      band.connect(gain);
      source.connect(rumble);
      rumble.connect(rumbleGain);
      gain.connect(this.bus!);
      rumbleGain.connect(this.bus!);
      source.start(now);
      loop = { source, band, rumble, gain, rumbleGain, fed: now };
      this.scrapes.set(actor, loop);
    }
    loop.fed = now;
    const drive = Math.min(1, speed / 28),
      level = drive <= 0.02 ? 0 : 0.05 + drive * 0.3;
    loop.band.frequency.setTargetAtTime(300 + drive * 1500, now, 0.05);
    loop.gain.gain.setTargetAtTime(level * weight, now, 0.04);
    loop.rumbleGain.gain.setTargetAtTime(
      level * weight * (actor === 'boss' ? 1.4 : 0.7),
      now,
      0.05,
    );
  }
  /** Let every scrape that has not been fed this frame die away. */
  update() {
    if (!this.context) return;
    const now = this.context.currentTime;
    for (const [actor, loop] of this.scrapes) {
      if (now - loop.fed < 0.08) continue;
      loop.gain.gain.setTargetAtTime(0, now, 0.06);
      loop.rumbleGain.gain.setTargetAtTime(0, now, 0.08);
      if (now - loop.fed > 1.5) {
        loop.source.stop();
        loop.source.disconnect();
        loop.band.disconnect();
        loop.rumble.disconnect();
        loop.gain.disconnect();
        loop.rumbleGain.disconnect();
        this.scrapes.delete(actor);
      }
    }
  }

  cast(spell: number) {
    if (spell === 0) {
      const duck = this.crowd('bolt', 0.05);
      this.tone(210, 50, 0.24, 0.42 * duck, 'triangle');
      this.air(0.19, 2200, 0.22 * duck);
    }
    if (spell === 1) {
      this.tone(1600, 120, 0.28, 0.25, 'sine');
      this.tone(850, 240, 0.2, 0.15, 'triangle');
      this.air(0.16, 7500, 0.18);
    }
    if (spell === 2) {
      this.tone(60, 28, 0.75, 0.5);
      this.tone(420, 80, 0.5, 0.2, 'triangle');
      this.air(0.6, 3500, 0.4);
    }
  }
  hit(kill: boolean) {
    this.tone(kill ? 580 : 320, kill ? 1150 : 120, kill ? 0.18 : 0.08, 0.16, 'triangle');
    this.air(0.12, 2800, 0.2);
  }
  dash() {
    this.air(0.35, 1800, 0.45);
    this.tone(95, 42, 0.3, 0.2);
  }
  /** An Aegis piece snapping up in front of the body: quiet, the hit itself comes later. */
  raise() {
    const duck = this.crowd('raise', 0.06);
    this.tone(1500, 1900, 0.07, 0.07 * duck, 'sine');
  }
  /**
   * A shot striking a standing patch: a glassy chime, with a thud underneath for heavy shots.
   * Under a salvo the chimes thin out instead of piling up.
   */
  block(kind: 'fire' | 'missile' | 'hammer' | 'vortex' | 'player' = 'fire') {
    const duck = kind === 'hammer' ? 1 : this.crowd('block', 0.055);
    if (duck === 0) return;
    this.tone(1200, 500, 0.2, 0.15 * duck);
    this.tone(1700, 700, 0.3, 0.08 * duck);
    if (kind === 'hammer') {
      this.tone(90, 38, 0.4, 0.4);
      this.air(0.3, 1400, 0.35);
    } else if (kind === 'missile') this.air(0.12, 2600, 0.18 * duck);
    else this.air(0.08, 4200, 0.12 * duck);
  }
  /** A solar vortex opening: a rising hum that keeps climbing while it pulls. */
  vortex() {
    this.tone(70, 190, 1.7, 0.22, 'sawtooth');
    this.tone(140, 380, 1.7, 0.08, 'triangle');
    this.air(1.6, 900, 0.14);
  }
  /** The vortex bursting into its ring of embers. */
  detonate() {
    this.tone(180, 30, 0.5, 0.45, 'triangle');
    this.tone(900, 160, 0.25, 0.18);
    this.air(0.55, 2600, 0.45);
  }
  /** A spent shield patch breaking up: a glassy crack falling into a short hiss. */
  shatter() {
    this.tone(1900, 240, 0.28, 0.22, 'triangle');
    this.tone(2600, 900, 0.14, 0.1);
    this.air(0.22, 3200, 0.3);
  }
  damage() {
    this.tone(120, 35, 0.3, 0.5, 'triangle');
    this.air(0.2, 600, 0.35);
  }
  beginDuel() {
    [330, 440, 660].forEach((f, i) => this.tone(f, f * 1.01, 0.4, 0.12, 'sine', i * 0.1));
  }
  crash(strength: number) {
    this.tone(60, 25, 0.6, Math.min(0.58, strength / 70));
    this.air(0.6, 1800, 0.45);
  }
  /** The telegraph: the one cue the player must never miss, so it sits a little forward. */
  charge() {
    this.tone(220, 820, 0.7, 0.14, 'triangle');
  }
  click() {
    this.tone(620, 420, 0.04, 0.12);
  }
}
