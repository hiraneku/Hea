import { describe, it, expect } from 'vitest';
import {
  ADAPTIVE,
  MAX_START_DROP,
  PIXEL_BUDGET,
  RESOLUTION_LADDER,
  adaptiveNext,
  adaptiveStart,
  resolutionScale,
  startStep,
  type AdaptiveState,
} from '../../src/game/adaptive';

/** Run the loop over a list of window averages and report the rungs it visited. */
function run(frames: number[], start: AdaptiveState = adaptiveStart()) {
  const visited = [start.step];
  let state = start;
  for (const ms of frames) {
    const move = adaptiveNext(state, ms);
    state = move.state;
    visited.push(state.step);
  }
  return { state, visited };
}

const FLOOR = RESOLUTION_LADDER.length - 1;

describe('adaptive resolution', () => {
  it('stays on the top rung while frames are comfortably inside the budget', () => {
    const { state, visited } = run(Array(30).fill(16));
    expect(state.step).toBe(0);
    expect(new Set(visited)).toEqual(new Set([0]));
    expect(ADAPTIVE.fastMs).toBeLessThan(ADAPTIVE.targetMs);
    expect(ADAPTIVE.slowMs).toBeGreaterThan(ADAPTIVE.targetMs);
  });

  it('steps down while frames stay late, and takes two rungs when they are desperate', () => {
    expect(run(Array(4).fill(21)).state.step).toBe(1);
    expect(run(Array(2).fill(40)).state.step).toBe(2);
  });

  it('walks all the way to the floor and stays there, never past it', () => {
    const { state } = run(Array(120).fill(45));
    expect(state.step).toBe(FLOOR);
    expect(resolutionScale(state)).toBe(RESOLUTION_LADDER[FLOOR]);
  });

  it('climbs back once there is real headroom, but not on a single fast frame', () => {
    const floored = run(Array(60).fill(45)).state;
    const quiet: AdaptiveState = { ...floored, climb: ADAPTIVE.fastWindows, settle: 0 };
    // One fast window is noise, not headroom.
    expect(adaptiveNext(quiet, 8).direction).toBe(0);
    const climb = run(Array(ADAPTIVE.fastWindows).fill(8), quiet);
    expect(climb.state.step).toBe(FLOOR - 1);
  });

  it('holds still inside the dead band instead of chasing the average', () => {
    // Frame times wobbling around 60 fps must not move the rung in either direction.
    const jitter = Array.from({ length: 40 }, (_, i) => (i % 2 ? 14.5 : 18.5));
    expect(run(jitter).state.step).toBe(0);
  });

  it('demands more evidence after a climb that had to be undone', () => {
    const floored = run(Array(60).fill(45)).state;
    let state: AdaptiveState = { ...floored, climb: ADAPTIVE.fastWindows, settle: 0 };
    for (let i = 0; i < ADAPTIVE.fastWindows; i++) state = adaptiveNext(state, 8).state;
    expect(state.step).toBe(FLOOR - 1);
    expect(state.lastDirection).toBe(1);
    // The settle windows run first, then the late windows that undo the climb.
    for (let i = 0; i < ADAPTIVE.settleWindows + ADAPTIVE.slowWindows; i++)
      state = adaptiveNext(state, 40).state;
    expect(state.step).toBe(FLOOR);
    expect(state.climb).toBe(ADAPTIVE.fastWindows * 2);
    // A fast streak that used to be enough no longer is.
    let probe: AdaptiveState = { ...state, settle: 0, fastStreak: 0 };
    for (let i = 0; i < ADAPTIVE.fastWindows; i++) probe = adaptiveNext(probe, 8).state;
    expect(probe.step).toBe(state.step);
  });

  it('ignores nonsense frame times without moving', () => {
    const start = adaptiveStart();
    for (const bad of [0, -4, Number.NaN, Infinity])
      expect(adaptiveNext(start, bad)).toEqual({ state: start, direction: 0 });
  });

  it('opens a big window lower down the ladder, and a small one at the top', () => {
    expect(startStep(1100, 700, PIXEL_BUDGET.high)).toBe(0);
    expect(startStep(1440, 900, PIXEL_BUDGET.auto)).toBe(0);
    expect(startStep(3840, 2160, PIXEL_BUDGET.high)).toBeGreaterThan(0);
    // Never at the floor: a big window opens softly, not blurred, and climbs from there.
    expect(startStep(3840, 2160, PIXEL_BUDGET.high)).toBe(MAX_START_DROP);
    expect(startStep(7680, 4320, PIXEL_BUDGET.high)).toBe(MAX_START_DROP);
    expect(startStep(390, 844, PIXEL_BUDGET.low)).toBe(0);
  });
});
