import type { Settings } from './types';
import { ARENA_ROOM, SEND, impulseResponse } from './reverb';

/** Anything the engine can place in the world: a three.js Vector3 or a plain tuple/object. */
export interface SoundPoint {
  x: number;
  y: number;
  z: number;
}

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
  /** The dry bus: everything lands here, and here ends in the limiter. */
  private bus?: GainNode;
  /** Where cues are sent to be reverberated; one convolution covers the whole arena. */
  private send?: GainNode;
  private settings: Settings;
  private noise?: AudioBuffer;
  private scrapes = new Map<Actor, ScrapeLoop>();
  private windLoop?: {
    source: AudioBufferSourceNode;
    band: BiquadFilterNode;
    gain: GainNode;
    pan: StereoPannerNode | null;
    fed: number;
  };
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
        // The room: cues are sent here, a generated impulse response is convolved, and the tail
        // comes back under the dry signal. This is what makes a slam happen *in* the arena.
        this.send = ctx.createGain();
        this.send.gain.value = 1;
        const convolver = ctx.createConvolver();
        const room = impulseResponse({
          sampleRate: ctx.sampleRate,
          seconds: ARENA_ROOM.seconds,
          decay: ARENA_ROOM.decay,
          seed: 60415,
          reflections: ARENA_ROOM.reflections.map(([t, g]) => [t, g] as [number, number]),
        });
        convolver.buffer = ctx.createBuffer(2, room[0].length, ctx.sampleRate);
        room.forEach((channel, i) =>
          convolver.buffer!.copyToChannel(channel as Float32Array<ArrayBuffer>, i),
        );
        const tail = ctx.createGain();
        tail.gain.value = 0.62;
        this.send.connect(convolver);
        convolver.connect(tail);
        tail.connect(limiter);
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
   * The listener: where the ears are and which way they face. Fed from the camera every frame, so
   * a boss casting behind the player is heard behind them — with an HRTF panner that is a real
   * cue to turn around rather than a volume difference.
   */
  listener(at: SoundPoint, forward: SoundPoint) {
    const listener = this.context?.listener;
    if (!listener) return;
    const ctx = this.context!,
      now = ctx.currentTime;
    try {
      listener.positionX?.setTargetAtTime(at.x, now, 0.02);
      listener.positionY?.setTargetAtTime(at.y, now, 0.02);
      listener.positionZ?.setTargetAtTime(at.z, now, 0.02);
      listener.forwardX?.setTargetAtTime(forward.x, now, 0.04);
      listener.forwardY?.setTargetAtTime(forward.y, now, 0.04);
      listener.forwardZ?.setTargetAtTime(forward.z, now, 0.04);
      listener.upX?.setValueAtTime(0, now);
      listener.upY?.setValueAtTime(1, now);
      listener.upZ?.setValueAtTime(0, now);
    } catch {
      /* Older engines expose only the setters below; they are optional too. */
    }
  }

  /**
   * Where a cue should be wired: dry into the bus, and a share of it into the room. A cue with no
   * position is simply the bus (head-locked), which is what the HUD wants. Every positioned cue
   * gets its own HRTF panner, so it is placed once and forgotten.
   */
  private place(at: SoundPoint | undefined, sendLevel: number) {
    const ctx = this.context!,
      input = ctx.createGain();
    let node: AudioNode = input;
    if (at) {
      const panner = ctx.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 7;
      panner.maxDistance = 400;
      panner.rolloffFactor = 1.1;
      try {
        panner.positionX.value = at.x;
        panner.positionY.value = at.y;
        panner.positionZ.value = at.z;
      } catch {
        panner.setPosition(at.x, at.y, at.z);
      }
      input.connect(panner);
      node = panner;
    }
    node.connect(this.bus!);
    if (sendLevel > 0) {
      const gain = ctx.createGain();
      gain.gain.value = sendLevel;
      node.connect(gain);
      gain.connect(this.send!);
    }
    return input;
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
    place?: { at?: SoundPoint; send?: number },
  ) {
    if (!this.live || volume <= 0) return;
    const ctx = this.context!,
      at = ctx.currentTime + delay;
    const oscillator = ctx.createOscillator(),
      gain = ctx.createGain(),
      output = this.place(place?.at, place?.send ?? 0.25);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, end), at + duration);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(volume, at + 0.009);
    gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
    oscillator.connect(gain);
    gain.connect(output);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.03);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }

  private air(
    duration: number,
    frequency: number,
    volume: number,
    place?: { at?: SoundPoint; send?: number },
  ) {
    if (!this.live || volume <= 0) return;
    const ctx = this.context!,
      at = ctx.currentTime;
    const source = ctx.createBufferSource(),
      filter = ctx.createBiquadFilter(),
      gain = ctx.createGain(),
      output = this.place(place?.at, place?.send ?? 0.25);
    source.buffer = this.noise!;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(frequency, at);
    filter.frequency.exponentialRampToValueAtTime(90, at + duration);
    gain.gain.setValueAtTime(volume, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(output);
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
  /**
   * The rush of air past a body in flight: a soft hiss that is all but silent below 12 m/s,
   * grows through the 21 m/s cruise, peaks with the post-dash surge, and leans towards the
   * side the body is sweeping to. Fed every frame while flying; it dies away when it is not.
   */
  wind(speed: number, lateral: number, surge: number) {
    if (!this.live) return;
    const ctx = this.context!,
      now = ctx.currentTime;
    let loop = this.windLoop;
    if (!loop) {
      const source = ctx.createBufferSource(),
        band = ctx.createBiquadFilter(),
        gain = ctx.createGain(),
        pan = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : null;
      source.buffer = this.noise!;
      source.loop = true;
      source.loopStart = 0.137;
      band.type = 'bandpass';
      band.Q.value = 0.55;
      band.frequency.value = 700;
      gain.gain.value = 0;
      source.connect(band);
      band.connect(gain);
      if (pan) {
        gain.connect(pan);
        pan.connect(this.bus!);
      } else gain.connect(this.bus!);
      source.start(now);
      loop = this.windLoop = { source, band, gain, pan, fed: now };
    }
    loop.fed = now;
    // Silent until 12 m/s, about two thirds at cruise, full at the surge's 33 m/s.
    const t = Math.max(0, Math.min(1, (speed - 12) / 21)),
      drive = t * t * (3 - 2 * t),
      level = drive * (0.075 + 0.045 * surge);
    loop.gain.gain.setTargetAtTime(level, now, 0.08);
    loop.band.frequency.setTargetAtTime(650 + drive * 1900 + surge * 500, now, 0.1);
    loop.pan?.pan.setTargetAtTime(Math.max(-0.6, Math.min(0.6, lateral * 0.6)), now, 0.12);
  }
  /** Let every scrape (and the wind) that has not been fed this frame die away. */
  update() {
    if (!this.context) return;
    const now = this.context.currentTime;
    if (this.windLoop && now - this.windLoop.fed > 0.08) {
      this.windLoop.gain.gain.setTargetAtTime(0, now, 0.14);
      if (now - this.windLoop.fed > 2.5) {
        this.windLoop.source.stop();
        this.windLoop.source.disconnect();
        this.windLoop.band.disconnect();
        this.windLoop.gain.disconnect();
        this.windLoop.pan?.disconnect();
        this.windLoop = undefined;
      }
    }
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

  /** The charged Nova: a deeper body under the ordinary cast, and a short bright crack. */
  novaCharged() {
    this.tone(140, 38, 0.5, 0.4, 'sine');
    this.tone(2400, 900, 0.09, 0.2, 'square');
    this.air(0.4, 1400, 0.3);
  }
  /** The tick that marks a Nova hold reaching full charge. */
  chargeReady() {
    this.tone(1320, 1760, 0.08, 0.16, 'sine');
    this.tone(2640, 2640, 0.05, 0.06, 'triangle', 0.03);
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
  /** FALL gathering: a descending pressure that rises in pitch as the column locks on. */
  fallCharge(at?: SoundPoint) {
    const place = { at, send: SEND.cast };
    this.tone(90, 220, 0.32, 0.2, 'sine', 0, place);
    this.tone(45, 70, 0.32, 0.22, 'sine', 0, place);
    this.air(0.3, 900, 0.1, place);
  }
  /** The slam: a sub-bass drop with a stone crack on top, placed where the boss landed. */
  fallSlam(at?: SoundPoint) {
    const place = { at, send: SEND.crash };
    this.tone(120, 26, 0.55, 0.55, 'sine', 0, place);
    this.tone(52, 24, 0.8, 0.4, 'sine', 0.02, place);
    this.air(0.4, 1600, 0.4, place);
    this.tone(300, 90, 0.16, 0.2, 'triangle', 0.01, place);
  }
  /** One crush pulse under the held weight; it tightens as the stored pressure grows. */
  fallCrush(pressure: number, at?: SoundPoint) {
    const place = { at, send: SEND.impact };
    this.tone(55 + pressure * 30, 30, 0.22, 0.22 + pressure * 0.16, 'sine', 0, place);
    this.air(0.14, 700 + pressure * 500, 0.14, place);
    if (pressure > 0.97) this.tone(1560, 1560, 0.07, 0.07, 'sine', 0, place);
  }
  /** The release: the weight lifts — a full one rings, a forced one falls flat. */
  fallRelease(forced: boolean, at?: SoundPoint) {
    const place = { at, send: SEND.cast };
    if (forced) {
      this.tone(140, 50, 0.3, 0.2, 'sine', 0, place);
    } else {
      this.tone(70, 240, 0.35, 0.3, 'sine', 0, place);
      this.tone(1200, 2400, 0.12, 0.08, 'triangle', 0.02, place);
      this.air(0.3, 2000, 0.16, place);
    }
  }
  hit(kill: boolean, at?: SoundPoint) {
    const place = { at, send: SEND.impact };
    this.tone(kill ? 580 : 320, kill ? 1150 : 120, kill ? 0.18 : 0.08, 0.16, 'triangle', 0, place);
    this.air(0.12, 2800, 0.2, place);
  }
  dash() {
    this.air(0.3, 2400, 0.42);
    this.air(0.18, 900, 0.2);
    this.tone(140, 48, 0.26, 0.2);
  }
  /** A perfect dodge: a bright two-note chime over the dash's whoosh. */
  perfect() {
    this.tone(1320, 1980, 0.16, 0.16, 'sine');
    this.tone(1980, 2640, 0.26, 0.12, 'sine', 0.07);
    this.air(0.3, 5200, 0.14);
  }
  /**
   * The Prisma lance: a bright shot that opens into a body of sound while the light stands, held
   * wet because the beam is the loudest thing the player owns and the room should answer it.
   */
  beam(heavy: boolean, at?: SoundPoint) {
    const place = { at, send: SEND.beam };
    if (heavy) {
      this.tone(240, 46, 0.5, 0.42, 'triangle', 0, place);
      this.tone(1180, 260, 0.34, 0.2, 'sine', 0, place);
      this.air(0.5, 5200, 0.34, place);
      this.tone(64, 30, 0.7, 0.3, 'sine', 0.02, place);
    } else {
      this.tone(980, 180, 0.22, 0.24, 'sine', 0, place);
      this.air(0.24, 6400, 0.2, place);
    }
  }

  /**
   * A footfall. The surface changes the noise band and the length: the plaza's slabs click, the
   * grit out past it scuffs. Fired from the player's own stride, so it is head-locked rather
   * than placed — the body is always where the ears are.
   */
  step(surface: 'stone' | 'grit', weight = 1) {
    const duck = this.crowd('step', 0.16);
    if (duck === 0) return;
    const place = { send: SEND.step },
      level = 0.1 * weight * duck;
    if (surface === 'grit') this.air(0.09, 1500, level * 1.2, place);
    else this.air(0.06, 3200, level, place);
    this.tone(surface === 'grit' ? 92 : 128, 60, 0.07, level * 0.7, 'triangle', 0, place);
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
  block(kind: 'fire' | 'missile' | 'hammer' | 'vortex' | 'player' = 'fire', at?: SoundPoint) {
    const duck = kind === 'hammer' ? 1 : this.crowd('block', 0.055);
    if (duck === 0) return;
    const place = { at, send: SEND.block };
    this.tone(1200, 500, 0.2, 0.15 * duck, 'sine', 0, place);
    this.tone(1700, 700, 0.3, 0.08 * duck, 'sine', 0, place);
    if (kind === 'hammer') {
      this.tone(90, 38, 0.4, 0.4, 'sine', 0, place);
      this.air(0.3, 1400, 0.35, place);
    } else if (kind === 'missile') this.air(0.12, 2600, 0.18 * duck, place);
    else this.air(0.08, 4200, 0.12 * duck, place);
  }
  /** A solar vortex opening: a rising hum that keeps climbing while it pulls. */
  vortex(at?: SoundPoint) {
    const place = { at, send: SEND.vortex };
    this.tone(70, 190, 1.7, 0.22, 'sawtooth', 0, place);
    this.tone(140, 380, 1.7, 0.08, 'triangle', 0, place);
    this.air(1.6, 900, 0.14, place);
  }
  /** The vortex bursting into its ring of embers. */
  detonate(at?: SoundPoint) {
    const place = { at, send: SEND.detonate };
    this.tone(180, 30, 0.5, 0.45, 'triangle', 0, place);
    this.tone(900, 160, 0.25, 0.18, 'sine', 0, place);
    this.air(0.55, 2600, 0.45, place);
  }
  /** A spent shield patch breaking up: a glassy crack falling into a short hiss. */
  shatter() {
    this.tone(1900, 240, 0.28, 0.22, 'triangle');
    this.tone(2600, 900, 0.14, 0.1);
    this.air(0.22, 3200, 0.3);
  }
  damage(at?: SoundPoint) {
    const place = { at, send: SEND.impact };
    this.tone(120, 35, 0.3, 0.5, 'triangle', 0, place);
    this.air(0.2, 600, 0.35, place);
  }
  beginDuel() {
    [330, 440, 660].forEach((f, i) => this.tone(f, f * 1.01, 0.4, 0.12, 'sine', i * 0.1));
  }
  /**
   * A body slamming the world. Placed where it happened and sent generously to the room: the
   * tail is most of what tells the player that the arena is big and made of stone. The surface
   * colours it — ground absorbs, a wall rings — and a heavy one adds a low crack.
   */
  crash(strength: number, at?: SoundPoint, surface: 'ground' | 'wall' = 'ground') {
    const loud = Math.min(0.58, strength / 70),
      place = { at, send: SEND.crash };
    this.tone(60, 25, 0.6, loud, 'sine', 0, place);
    this.air(0.6, surface === 'wall' ? 2400 : 1500, 0.45, place);
    if (surface === 'wall') this.tone(210, 90, 0.22, loud * 0.7, 'triangle', 0.004, place);
    if (strength > 45) this.tone(38, 22, 0.9, loud * 0.8, 'sine', 0.01, place);
  }
  /** The telegraph: the one cue the player must never miss, so it sits a little forward. */
  charge(at?: SoundPoint) {
    this.tone(220, 820, 0.7, 0.14, 'triangle', 0, { at, send: SEND.cast });
  }
  click() {
    this.tone(620, 420, 0.04, 0.12);
  }
  /**
   * The impact frame's two beats: a dry, sharp click as the picture cuts to paper, and a
   * short sub-bass thump under the negative frame.
   */
  impactPaper() {
    this.tone(3200, 1200, 0.018, 0.22, 'square');
    this.air(0.03, 6500, 0.25);
  }
  impactNegative() {
    this.tone(48, 28, 0.2, 0.55, 'sine');
    this.tone(96, 40, 0.09, 0.18, 'triangle');
  }
}
