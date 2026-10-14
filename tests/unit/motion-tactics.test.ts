import { describe, expect, it } from 'vitest';
import { Quaternion, Vector3 } from 'three';
import {
  AirDash,
  BodyTumble,
  LaunchRelease,
  recoveryBlend,
  springVector,
} from '../../src/game/motion';
import { advanceFlight } from '../../src/game/flight';
import { BossTactics, fireGateOffset } from '../../src/game/BossTactics';
import {
  ATTACKS,
  BossDirector,
  DUEL,
  missileAimOffset,
  patchBlocks,
  patchRadius,
  shieldIntercept,
} from '../../src/game/combat';

describe('continuous flight and dash', () => {
  it('starts gently, carries acceleration through reversal, then settles into hover', () => {
    const v = new Vector3(),
      acceleration = new Vector3(),
      goal = new Vector3(14.5, 0, 0);
    advanceFlight(v, acceleration, goal, 1 / 120);
    expect(v.x).toBeGreaterThan(0);
    expect(v.x).toBeLessThan(0.1);
    for (let i = 0; i < 60; i++) advanceFlight(v, acceleration, goal, 1 / 120);
    const before = v.clone();
    advanceFlight(v, acceleration, goal.clone().negate(), 1 / 120);
    expect(v.distanceTo(before)).toBeLessThan(1);
    expect(v.x).toBeGreaterThan(0);
    for (let i = 0; i < 400; i++) advanceFlight(v, acceleration, new Vector3(), 1 / 120);
    expect(v.length()).toBeLessThan(0.001);
  });
  it('camera/motor springs are independent of frame subdivision', () => {
    const a = new Vector3(),
      av = new Vector3(),
      b = new Vector3(),
      bv = new Vector3(),
      target = new Vector3(7, 9, 12);
    springVector(a, av, target, 18, 0.1);
    for (let i = 0; i < 12; i++) springVector(b, bv, target, 18, 1 / 120);
    expect(a.distanceTo(b)).toBeLessThan(1e-8);
    expect(av.distanceTo(bv)).toBeLessThan(1e-8);
  });
  it('dash ramps up and tails off instead of switching a fixed velocity on/off', () => {
    const dash = new AirDash();
    dash.start(new Vector3(0, 0, -1));
    expect(dash.velocity.length()).toBe(0);
    dash.step(1 / 120, new Vector3());
    expect(dash.velocity.length()).toBeLessThan(1);
    for (let i = 0; i < 14; i++) dash.step(1 / 120, new Vector3());
    expect(dash.velocity.length()).toBeCloseTo(34);
    let previous = dash.velocity.clone(),
      largestEndStep = 0;
    for (let i = 0; i < 60; i++) {
      dash.step(1 / 120, new Vector3());
      if (dash.age > 0.42)
        largestEndStep = Math.max(largestEndStep, dash.velocity.distanceTo(previous));
      previous = dash.velocity.clone();
    }
    expect(dash.active).toBe(false);
    expect(dash.invulnerable).toBe(false);
    expect(dash.velocity.length()).toBe(0);
    expect(largestEndStep).toBeLessThan(1);
  });
  it('dash steering bends, never snaps to an opposite input direction', () => {
    const dash = new AirDash();
    dash.start(new Vector3(0, 0, -1));
    dash.step(0.1, new Vector3(0, 0, 1));
    expect(dash.direction.angleTo(new Vector3(0, 0, -1))).toBeCloseTo(0.15);
  });
  it('launch release is quick but continuous and collision can cancel its remainder', () => {
    const release = new LaunchRelease(),
      force = new Vector3();
    release.start(new Vector3(70, 0, 0));
    release.step(1 / 120, force);
    expect(force.x).toBeGreaterThan(0);
    expect(force.x).toBeCloseTo(70);
    release.step(0.03, force);
    expect(force.x).toBeCloseTo(70);
    release.start(new Vector3(0, 80, 0));
    release.step(0.01, force);
    release.cancel();
    const before = force.clone();
    release.step(0.1, force);
    expect(force).toEqual(before);
  });
  it('recovery drag and steering do not jump at the end of stagger', () => {
    expect(recoveryBlend(1)).toBe(0);
    expect(recoveryBlend(0)).toBe(1);
    expect(Math.abs(recoveryBlend(0.008) - recoveryBlend(0))).toBeLessThan(0.001);
  });
});

describe('torque-driven blockout ragdoll', () => {
  it('holds pose during contact pause, tumbles after release, and recovers without permanent spin', () => {
    const body = new BodyTumble(),
      base = new Quaternion();
    body.kick(base, new Vector3(0, -84, 0));
    expect(body.step(0, base).angleTo(base)).toBe(0);
    for (let i = 0; i < 24; i++) body.step(1 / 120, base);
    expect(body.orientation.angleTo(base)).toBeGreaterThan(1);
    expect(body.orientation.length()).toBeCloseTo(1);
    for (let i = 0; i < 420; i++) {
      body.beginStep();
      body.ground(new Vector3(), 0, 0.55);
      body.step(1 / 120, base);
    }
    expect(body.active).toBe(false);
    expect(body.orientation.angleTo(base)).toBeLessThan(0.001);
  });
  it('rights itself in mid-air after flying untouched, instead of waiting for the ground', () => {
    const body = new BodyTumble(),
      base = new Quaternion();
    body.kick(base, new Vector3(0, 90, 0));
    for (let i = 0; i < 60; i++) {
      body.beginStep();
      body.step(1 / 120, base);
    }
    expect(body.phase).toBe('air');
    expect(body.active).toBe(true);
    for (let i = 0; i < 140; i++) {
      body.beginStep();
      body.step(1 / 120, base);
    }
    expect(body.airRecoveries).toBe(1);
    expect(body.active).toBe(false);
    expect(body.orientation.angleTo(base)).toBeLessThan(0.001);
  });
  it('keeps tumbling while it is still hitting walls; only free flight starts the recovery clock', () => {
    const body = new BodyTumble(),
      base = new Quaternion();
    body.kick(base, new Vector3(80, 10, 0));
    for (let i = 0; i < 180; i++) {
      body.beginStep();
      if (i % 60 === 59) body.collide(new Vector3(-1, 0, 0), new Vector3(30, -5, 0));
      body.step(1 / 120, base);
    }
    expect(body.active).toBe(true);
    expect(body.airRecoveries).toBe(0);
    expect(body.airTime).toBeLessThan(BodyTumble.airRecovery);
  });
  it('reacts to world collision and eventually recovers even while the aiming pose keeps moving', () => {
    const body = new BodyTumble();
    body.kick(new Quaternion(), new Vector3(70, 5, 0));
    const before = body.angularVelocity.clone();
    body.collide(new Vector3(0, 1, 0), new Vector3(40, -12, 0));
    expect(body.angularVelocity.distanceTo(before)).toBeGreaterThan(1);
    for (let i = 0; i < 420; i++) {
      body.beginStep();
      body.ground(new Vector3(), 0, 0.55);
      body.step(1 / 120, new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), i * 0.003));
    }
    expect(body.active).toBe(false);
    body.reset();
    expect(body.weight).toBe(0);
  });
});

describe('varied boss tactics and satellite circles', () => {
  it('chooses level, lower, and higher waypoints instead of a permanent overhead tether', () => {
    const tactics = new BossTactics(),
      boss = new Vector3(0, 15, 0),
      player = new Vector3(0, 12, 23),
      heights: number[] = [],
      modes = new Set();
    for (let i = 0; i < 90; i++) {
      const motor = tactics.step(
        0.25,
        boss,
        player,
        ['fire', 'missiles', 'hammer'][Math.floor(i / 12) % 3] as 'fire' | 'missiles' | 'hammer',
        'attack',
        Math.floor(i / 12),
      );
      expect(motor.length()).toBeLessThanOrEqual(19.0001);
      heights.push(tactics.goal.y);
      modes.add(tactics.maneuver);
    }
    expect(Math.min(...heights)).toBeLessThan(player.y);
    expect(Math.max(...heights)).toBeGreaterThan(player.y + 5);
    expect(modes.size).toBeGreaterThanOrEqual(4);
    tactics.displaced(new Vector3(20, 4, 30), player);
    expect(tactics.goal.y).toBeLessThan(6);
    expect(tactics.maneuver).toBe('recover');
  });
  it('shuffles attack order after the learnable opening, with no consecutive identical attacks', () => {
    const director = new BossDirector(),
      tells = director
        .step(150)
        .filter((c) => c.type === 'tell')
        .map((c) => c.attack);
    expect(tells.slice(0, 2)).toEqual(['missiles', 'hammer']);
    for (let i = 1; i < tells.length; i++) expect(tells[i]).not.toBe(tells[i - 1]);
    expect(tells.slice(2, 8).join(',')).not.toBe('fire,missiles,hammer,fire,missiles,hammer');
  });
  it('populates all four outside quadrants in shuffled, reproducible groups', () => {
    const sides = new Set<number>();
    for (let i = 0; i < 4; i++) {
      const p = fireGateOffset(i, 0);
      sides.add(p.side);
      expect(Math.hypot(p.local.x, p.local.y - 0.1)).toBeGreaterThan(1.6);
      expect(p).toEqual(fireGateOffset(i, 0));
    }
    expect(sides.size).toBe(4);
    expect(fireGateOffset(0, 0).local.equals(fireGateOffset(0, 1).local)).toBe(false);
    // Circles now orbit roughly 3 m out, clear of the 2.35 m wide body.
    for (let i = 0; i < 8; i++)
      expect(
        Math.hypot(fireGateOffset(i, 0).local.x, fireGateOffset(i, 0).local.y - 0.1),
      ).toBeGreaterThan(2.8);
    expect(ATTACKS.fire.duration).toBeCloseTo(4.2);
    expect(ATTACKS.fire.shots * ATTACKS.fire.interval + 0.12).toBeLessThan(ATTACKS.fire.duration);
    expect(ATTACKS.missiles.shots * 2).toBe(12);
  });
  it('gives every seeker its own reproducible scatter point around the player', () => {
    const offsets = Array.from({ length: 12 }, (_, i) => missileAimOffset(i));
    expect(new Set(offsets.map((o) => `${o.side.toFixed(3)},${o.up.toFixed(3)}`)).size).toBe(12);
    for (const o of offsets) {
      expect(Math.hypot(o.side, o.up)).toBeGreaterThan(0.5);
      expect(Math.hypot(o.side, o.up)).toBeLessThan(2.7);
    }
    expect(offsets.some((o) => o.side < -0.5)).toBe(true);
    expect(offsets.some((o) => o.side > 0.5)).toBe(true);
    expect(missileAimOffset(4)).toEqual(missileAimOffset(4));
  });
});

describe('local shield patches on actual trajectories', () => {
  it('retains independent side/height offsets for parallel incoming shots', () => {
    const center = new Vector3(),
      facing = new Vector3(0, 0, -1),
      motion = new Vector3(),
      velocity = new Vector3(0, 0, 30);
    const a = shieldIntercept(
      new Vector3(-1.1, 0, -3),
      velocity,
      center,
      motion,
      facing,
      0.32,
      0.13,
    )!;
    const b = shieldIntercept(
      new Vector3(1.1, 0.5, -3),
      velocity,
      center,
      motion,
      facing,
      0.32,
      0.13,
    )!;
    expect(a.offset.x).toBeCloseTo(-1.1);
    expect(b.offset.x).toBeCloseTo(1.1);
    expect(b.offset.y).toBeCloseTo(0.5);
    expect(a.offset.length()).toBeGreaterThanOrEqual(DUEL.shieldNear);
    expect(a.offset.length()).toBeLessThan(DUEL.shieldReach);
    expect(a.offset.distanceTo(b.offset)).toBeGreaterThan(2);
    // Patches now stand further out: an approaching bolt is met beyond the 3.1 m shell.
    const far = shieldIntercept(
      new Vector3(0, 0, -6),
      velocity,
      center,
      motion,
      facing,
      0.32,
      0.13,
    )!;
    expect(far.offset.length()).toBeGreaterThan(3.3);
    expect(far.offset.length()).toBeLessThanOrEqual(DUEL.shieldReach);
  });
  it('lets a standing patch stop later shots on the same lane, but not from behind or beside', () => {
    const patch = {
      position: [0.4, 1.1, -3.4],
      normal: [0, 0, -1],
      radius: patchRadius(1.33),
    };
    // Same lane, swept through the patch from its front face.
    expect(
      patchBlocks(
        patch,
        { x: 0.4, y: 1.1, z: -6 },
        { x: 0.4, y: 1.1, z: -2 },
        { x: 0, y: 0, z: 30 },
        0.32,
      ),
    ).not.toBeNull();
    // Parallel lane well outside the footprint.
    expect(
      patchBlocks(
        patch,
        { x: 3.2, y: 1.1, z: -6 },
        { x: 3.2, y: 1.1, z: -2 },
        { x: 0, y: 0, z: 30 },
        0.32,
      ),
    ).toBeNull();
    // Travelling away from the patch's face (a shot from behind the player) is not caught.
    expect(
      patchBlocks(
        patch,
        { x: 0.4, y: 1.1, z: -2 },
        { x: 0.4, y: 1.1, z: -6 },
        { x: 0, y: 0, z: -30 },
        0.32,
      ),
    ).toBeNull();
    // A shot that never reaches the patch this step is left alone.
    expect(
      patchBlocks(
        patch,
        { x: 0.4, y: 1.1, z: -12 },
        { x: 0.4, y: 1.1, z: -9 },
        { x: 0, y: 0, z: 30 },
        0.32,
      ),
    ).toBeNull();
  });
  it('covers a wider safe zone than before, still leaving a genuine rear blind spot', () => {
    expect(DUEL.shieldArcDegrees).toBeGreaterThanOrEqual(240);
    expect(DUEL.shieldArcDegrees).toBeLessThan(300);
    expect(DUEL.shieldShell).toBeGreaterThan(2.9);
    expect(DUEL.shieldNear).toBeGreaterThan(2.2);
  });
  it('ignores distant grazes and the blind spot, and bounds large patches close to the body', () => {
    const zero = new Vector3(),
      facing = new Vector3(0, 0, -1);
    expect(
      shieldIntercept(
        new Vector3(3.6, 0, -3),
        new Vector3(0, 0, 30),
        zero,
        zero,
        facing,
        0.32,
        0.13,
      ),
    ).toBeNull();
    expect(
      shieldIntercept(new Vector3(0, 0, 3), new Vector3(0, 0, -30), zero, zero, facing, 0.32, 0.13),
    ).toBeNull();
    const large = shieldIntercept(
      new Vector3(0, 0, -5),
      new Vector3(0, 0, 31),
      zero,
      zero,
      facing,
      1.25,
      0.13,
    )!;
    expect(large.offset.length()).toBeLessThanOrEqual(DUEL.shieldReach);
  });
});
