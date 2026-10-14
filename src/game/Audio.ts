import type { Settings } from './types';

/** Small procedural sound bank. Nothing is fetched and audio only starts after a user gesture. */
export class AudioEngine {
  private context?: AudioContext;
  private master?: GainNode;
  private settings: Settings;
  private noise?: AudioBuffer;
  constructor(settings: Settings) {
    this.settings = settings;
  }

  unlock() {
    try {
      this.context ??= new AudioContext();
      if (!this.master) {
        this.master = this.context.createGain();
        this.master.connect(this.context.destination);
        const length = this.context.sampleRate;
        this.noise = this.context.createBuffer(1, length, this.context.sampleRate);
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
        settings.sound ? settings.volume * 0.55 : 0,
        this.context.currentTime,
        0.03,
      );
  }

  private tone(
    frequency: number,
    end: number,
    duration: number,
    volume: number,
    type: OscillatorType = 'sine',
    delay = 0,
  ) {
    if (!this.context || !this.master || !this.settings.sound || this.context.state !== 'running')
      return;
    const ctx = this.context,
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
    gain.connect(this.master);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.03);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }

  private air(duration: number, frequency: number, volume: number) {
    if (
      !this.context ||
      !this.master ||
      !this.noise ||
      !this.settings.sound ||
      this.context.state !== 'running'
    )
      return;
    const ctx = this.context,
      at = ctx.currentTime;
    const source = ctx.createBufferSource(),
      filter = ctx.createBiquadFilter(),
      gain = ctx.createGain();
    source.buffer = this.noise;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(frequency, at);
    filter.frequency.exponentialRampToValueAtTime(90, at + duration);
    gain.gain.setValueAtTime(volume, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(at);
    source.stop(at + duration);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  cast(spell: number) {
    if (spell === 0) {
      this.tone(210, 50, 0.24, 0.5, 'triangle');
      this.air(0.19, 2200, 0.25);
    }
    if (spell === 1) {
      this.tone(1600, 120, 0.28, 0.25, 'sine');
      this.tone(850, 240, 0.2, 0.15, 'triangle');
      this.air(0.16, 7500, 0.18);
    }
    if (spell === 2) {
      this.tone(60, 28, 0.75, 0.6);
      this.tone(420, 80, 0.5, 0.22, 'triangle');
      this.air(0.6, 3500, 0.45);
    }
  }
  hit(kill: boolean) {
    this.tone(kill ? 580 : 320, kill ? 1150 : 120, kill ? 0.18 : 0.08, 0.16, 'triangle');
    this.air(0.12, 2800, 0.2);
  }
  dash() {
    this.air(0.35, 1800, 0.5);
    this.tone(95, 42, 0.3, 0.2);
  }
  /** An Aegis piece snapping up in front of the body: quiet, the hit itself comes later. */
  raise() {
    this.tone(1500, 1900, 0.07, 0.05, 'sine');
  }
  /** A shot striking a standing patch: a glassy chime, with a thud underneath for heavy shots. */
  block(kind: 'fire' | 'missile' | 'hammer' | 'vortex' | 'player' = 'fire') {
    this.tone(1200, 500, 0.2, 0.18);
    this.tone(1700, 700, 0.3, 0.1);
    if (kind === 'hammer') {
      this.tone(90, 38, 0.4, 0.4);
      this.air(0.3, 1400, 0.35);
    } else if (kind === 'missile') this.air(0.12, 2600, 0.18);
    else this.air(0.08, 4200, 0.12);
  }
  /** A solar vortex opening: a rising hum that keeps climbing while it pulls. */
  vortex() {
    this.tone(70, 190, 1.7, 0.22, 'sawtooth');
    this.tone(140, 380, 1.7, 0.08, 'triangle');
    this.air(1.6, 900, 0.14);
  }
  /** The vortex bursting into its ring of embers. */
  detonate() {
    this.tone(180, 30, 0.5, 0.5, 'triangle');
    this.tone(900, 160, 0.25, 0.2);
    this.air(0.55, 2600, 0.5);
  }
  /** A spent shield patch breaking up: a glassy crack falling into a short hiss. */
  shatter() {
    this.tone(1900, 240, 0.28, 0.2, 'triangle');
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
    this.tone(60, 25, 0.6, Math.min(0.65, strength / 60));
    this.air(0.6, 1800, 0.5);
  }
  charge() {
    this.tone(220, 820, 0.7, 0.11, 'triangle');
  }
  click() {
    this.tone(620, 420, 0.04, 0.12);
  }
}
