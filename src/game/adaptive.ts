/**
 * Adaptive resolution: the ladder of pixel-ratio multipliers a frame-time budget walks up and
 * down. Rendering fewer pixels is the first lever on every quality tier — it costs nothing but
 * sharpness, and it can be given straight back — where dropping shadows and bloom is a one-way
 * step the player feels as a different game.
 *
 * The loop is fed the measured frame time once an averaging window (0.75 s). It moves one rung
 * when frames stay late, and climbs one rung when there is real headroom, with a dead band in
 * between so a machine hovering around 60 fps does not flap. A climb that is immediately undone
 * doubles the evidence the next climb needs, which is the cheap cure for oscillation.
 */
export const RESOLUTION_LADDER = [1, 0.88, 0.76, 0.64, 0.52] as const;

export interface AdaptiveState {
  /** Index into `RESOLUTION_LADDER`; 0 is the tier's full resolution. */
  step: number;
  /** Consecutive late windows. */
  slowStreak: number;
  /** Consecutive early windows. */
  fastStreak: number;
  /** Windows to leave untouched after a move, so the measurement settles. */
  settle: number;
  /** Early windows a climb needs; doubles after a climb is undone by a drop. */
  climb: number;
  /** Whether the last move was a climb (+1) or a drop (−1); 0 before the first. */
  lastDirection: -1 | 0 | 1;
}

export const ADAPTIVE = {
  /** 60 fps. */
  targetMs: 1000 / 60,
  /** Later than this and the picture is visibly behind: 51 fps. */
  slowMs: 19.5,
  /** Earlier than this and there is headroom to spend: 76 fps. */
  fastMs: 13.2,
  /** Beyond this the rung is hopeless, so take two. */
  desperateMs: 33.4,
  slowWindows: 2,
  fastWindows: 4,
  settleWindows: 2,
  maxClimb: 32,
} as const;

export function adaptiveStart(): AdaptiveState {
  return {
    step: 0,
    slowStreak: 0,
    fastStreak: 0,
    settle: 0,
    climb: ADAPTIVE.fastWindows,
    lastDirection: 0,
  };
}

export interface AdaptiveMove {
  state: AdaptiveState;
  /** −1 dropped a rung, +1 climbed one, 0 held. */
  direction: -1 | 0 | 1;
}

/**
 * One averaging window of frame time. Returns the next state and whether the resolution should
 * change; the caller applies `RESOLUTION_LADDER[state.step]` when `direction` is not zero.
 */
export function adaptiveNext(previous: AdaptiveState, frameMs: number): AdaptiveMove {
  const state = { ...previous };
  if (!Number.isFinite(frameMs) || frameMs <= 0) return { state, direction: 0 };
  if (state.settle > 0) {
    state.settle--;
    state.slowStreak = state.fastStreak = 0;
    return { state, direction: 0 };
  }
  if (frameMs > ADAPTIVE.slowMs) {
    state.slowStreak++;
    state.fastStreak = 0;
    if (state.step >= RESOLUTION_LADDER.length - 1 || state.slowStreak < ADAPTIVE.slowWindows) {
      return { state, direction: 0 };
    }
    // Very late frames mean this rung is miles off; skipping one spends the window usefully.
    const rungs = frameMs > ADAPTIVE.desperateMs ? 2 : 1;
    state.step = Math.min(RESOLUTION_LADDER.length - 1, state.step + rungs);
    state.slowStreak = 0;
    state.settle = ADAPTIVE.settleWindows;
    // A drop straight after a climb says that climb was optimistic: ask for more evidence next.
    state.climb =
      state.lastDirection === 1
        ? Math.min(ADAPTIVE.maxClimb, state.climb * 2)
        : ADAPTIVE.fastWindows;
    state.lastDirection = -1;
    return { state, direction: -1 };
  }
  if (frameMs < ADAPTIVE.fastMs) {
    state.fastStreak++;
    state.slowStreak = 0;
    if (state.step === 0 || state.fastStreak < state.climb) return { state, direction: 0 };
    state.step--;
    state.fastStreak = 0;
    state.settle = ADAPTIVE.settleWindows;
    state.lastDirection = 1;
    return { state, direction: 1 };
  }
  // Inside the dead band: hold both the rung and the streaks.
  state.slowStreak = state.fastStreak = 0;
  return { state, direction: 0 };
}

/** The pixel-ratio multiplier the given ladder position asks for. */
export function resolutionScale(state: AdaptiveState): number {
  return RESOLUTION_LADDER[Math.max(0, Math.min(RESOLUTION_LADDER.length - 1, state.step))];
}

/** The most pixels a tier renders before the ladder is asked to climb: a 4K panel would
 *  otherwise start at eight million pixels and take a second to notice. */
export const PIXEL_BUDGET = { high: 5.2e6, auto: 3.1e6, low: 1.8e6 } as const;

/** The furthest down the ladder a big window may *start*: the loop climbs slowly, so opening at
 *  the floor would spend ten seconds looking soft before the picture caught up. */
export const MAX_START_DROP = 2;

/**
 * The ladder rung a window of this many CSS pixels should start on. This is a guess to spare the
 * first seconds, not a ceiling: the loop is free to climb back to full resolution if the machine
 * turns out to hold it, and it never opens further than `MAX_START_DROP` rungs down.
 */
export function startStep(width: number, height: number, budget: number): number {
  const pixels = Math.max(1, width * height);
  const ratio = pixels <= budget ? 1 : Math.sqrt(budget / pixels);
  let step = RESOLUTION_LADDER.length - 1;
  for (let i = 0; i < RESOLUTION_LADDER.length; i++)
    if (RESOLUTION_LADDER[i] <= ratio) {
      step = i;
      break;
    }
  return Math.min(step, MAX_START_DROP);
}
