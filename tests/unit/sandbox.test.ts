import { describe, expect, it } from 'vitest';
import { Quaternion, Vector3 } from 'three';
import { BodyTumble, landingSlide, groundFriction, supportHeight } from '../../src/game/motion';
import { DestructibleVolume } from '../../src/game/destruction';
import { firstSolidSpan, segmentBox } from '../../src/game/math';
import { HEAVY } from '../../src/game/config';
import { makeShieldPatch, shieldPattern, HEX_COUNTS } from '../../src/game/ShieldVisual';

describe('varied shield echoes', () => {
  it('varies hex counts without replacing the hexagonal cell shape', () => {
    for (let i = 1; i < 90; i++) expect(shieldPattern(i)).not.toBe(shieldPattern(i - 1));
    for (let i = 0; i < 30; i += 6)
      expect(new Set(Array.from({ length: 6 }, (_, j) => shieldPattern(i + j))).size).toBe(
        HEX_COUNTS.length,
      );
  });
  it('builds prism clusters with a different number of hexagonal cells', () => {
    const counts = new Set<number>();
    for (let i = 0; i < 6; i++) {
      const patch = makeShieldPatch(i);
      counts.add(
        (patch.children[0] as import('three').LineSegments).geometry.attributes.position.count,
      );
      expect(patch.userData.kind).toBe('shield-echo');
    }
    expect(counts.size).toBeGreaterThanOrEqual(5);
  });
});

describe('material-thickness penetration', () => {
  const bounds = { minX: -8, maxX: 8, minZ: -1.2, maxZ: 1.2, bottom: 0, top: 20 };
  it('measures along the shot: a broad thin wall is penetrable face-on but not edge-on', () => {
    const normal = firstSolidSpan(new Vector3(0, 8, 8), new Vector3(0, 0, -1), [bounds])!;
    const edge = firstSolidSpan(new Vector3(12, 8, 0), new Vector3(-1, 0, 0), [bounds])!;
    expect(normal.exit - normal.enter).toBeCloseTo(2.4);
    expect(normal.exit - normal.enter).toBeLessThan(HEAVY.thinDepth);
    expect(edge.exit - edge.enter).toBeGreaterThan(HEAVY.thinDepth);
  });
  it('merges adjacent fragments so a thick wall cannot masquerade as thin cells', () => {
    const span = firstSolidSpan(
      new Vector3(0, 2, 10),
      new Vector3(0, 0, -1),
      [0, 1, 2, 3, 4, 5].map((z) => ({
        minX: -2,
        maxX: 2,
        minZ: z,
        maxZ: z + 1,
        bottom: 0,
        top: 5,
      })),
    )!;
    expect(span.exit - span.enter).toBe(6);
  });
  it('carves a real tunnel, preserves the sides, and restores it on reset', () => {
    const volume = new DestructibleVolume(bounds, 0, 1.6),
      start = new Vector3(0, 8, 2),
      end = new Vector3(0, 8, -2);
    expect(volume.breakSegment(start, end, HEAVY.tunnelRadius).length).toBeGreaterThan(0);
    expect(volume.colliders().some((b) => segmentBox(start, end, b, 1.25) !== null)).toBe(false);
    expect(
      volume
        .colliders()
        .some((b) => segmentBox(new Vector3(6, 8, 2), new Vector3(6, 8, -2), b) !== null),
    ).toBe(true);
    volume.reset();
    expect(volume.colliders().some((b) => segmentBox(start, end, b) !== null)).toBe(true);
  });
});

describe('ground ragdoll', () => {
  it('stays a ragdoll through the first part of free flight, then rights itself without landing', () => {
    const body = new BodyTumble();
    body.kick(new Quaternion(), new Vector3(0, -40, 35));
    const early = Math.floor((BodyTumble.airRecovery * 120) / 2);
    for (let i = 0; i < early; i++) {
      body.beginStep();
      body.step(1 / 120, new Quaternion());
    }
    expect(body.physical).toBe(true);
    expect(body.phase).toBe('air');
    for (let i = 0; i < 480; i++) {
      body.beginStep();
      body.step(1 / 120, new Quaternion());
    }
    expect(body.physical).toBe(false);
    expect(body.active).toBe(false);
    expect(body.airRecoveries).toBe(1);
  });
  it('absorbs vertical pressure into a ground skim with no upward rebound', () => {
    for (const speed of [8, 45, 100]) {
      const result = landingSlide(new Vector3(0, -speed, 0), new Vector3(0, 0, 1));
      expect(result.y).toBe(0);
      expect(result.length()).toBeLessThanOrEqual(speed);
    }
    expect(landingSlide(new Vector3(50, -30, 0), new Vector3(0, 0, 1)).x).toBeGreaterThan(40);
  });
  it('keeps a visible skid but settles monotonically, independent of timestep subdivision', () => {
    const a = new Vector3(35, 0, 0),
      b = a.clone();
    groundFriction(a, 0.1);
    for (let i = 0; i < 12; i++) groundFriction(b, 1 / 120);
    expect(a.distanceTo(b)).toBeLessThan(1e-8);
    expect(a.x).toBeGreaterThan(25);
    let last = a.x;
    for (let i = 0; i < 600; i++) {
      groundFriction(a, 1 / 120);
      expect(a.x).toBeLessThanOrEqual(last);
      last = a.x;
    }
    expect(a.x).toBe(0);
  });
  it('uses oriented support so a sideways block lies on the floor, not at standing height', () => {
    const half = new Vector3(0.325, 0.65, 0.325);
    expect(supportHeight(new Quaternion(), half)).toBeCloseTo(0.65);
    expect(
      supportHeight(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2), half),
    ).toBeCloseTo(0.325);
  });
});
