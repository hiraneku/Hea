import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { CameraRig, type CameraRigFrame } from '../../src/game/CameraRig';
import { DEFAULT_SETTINGS } from '../../src/game/types';

function frame(camera: PerspectiveCamera, over: Partial<CameraRigFrame> = {}): CameraRigFrame {
  return {
    dt: 1 / 60,
    first: false,
    yaw: 0,
    pitch: 0.05,
    roll: 0,
    time: 0,
    player: new Vector3(0, 1.8, 24),
    velocity: new Vector3(),
    impulse: new Vector3(),
    dashVelocity: new Vector3(),
    dashStrength: 0,
    dashActive: false,
    bankZ: 0,
    flightEnabled: true,
    knockTime: 0,
    settings: { ...DEFAULT_SETTINGS },
    trace: () => null,
    ...over,
  };
}

describe('CameraRig', () => {
  it('snaps the chase camera behind the body at the configured distance', () => {
    const camera = new PerspectiveCamera(64, 1, 0.065, 720);
    const rig = new CameraRig(camera);
    rig.update(frame(camera, { snap: true, pitch: 0 }));
    // Pivot is 1.25 m above the root; the chase view rests behind it, offset right and up.
    expect(camera.position.x).toBeCloseTo(0.65);
    expect(camera.position.y).toBeCloseTo(1.8 + 1.25 + 0.95);
    expect(camera.position.z).toBeCloseTo(24 + DEFAULT_SETTINGS.cameraDistance);
  });

  it('caps a kick at six centimetres for the chase camera, less from the eyes', () => {
    const camera = new PerspectiveCamera(64, 1, 0.065, 720);
    const rig = new CameraRig(camera);
    rig.kick(new Vector3(1, 0, 0), 10, false, false);
    expect(rig.kickOffset.length()).toBeCloseTo(0.06);
    rig.reset();
    rig.kick(new Vector3(1, 0, 0), 10, true, false);
    expect(rig.kickOffset.length()).toBeCloseTo(0.035);
    rig.reset();
    rig.kick(new Vector3(1, 0, 0), 10, false, true);
    expect(rig.kickOffset.length()).toBe(0);
  });

  it('dips the view on a hard landing, ignores a hop, and counts landings', () => {
    const camera = new PerspectiveCamera(64, 1, 0.065, 720);
    const rig = new CameraRig(camera);
    rig.land(6, false, false);
    expect(rig.landings).toBe(0);
    expect(rig.kickOffset.y).toBe(0);
    rig.land(20, false, false);
    expect(rig.landings).toBe(1);
    expect(rig.kickOffset.y).toBeCloseTo(-Math.min(0.08, 13 * 0.0057));
    rig.land(20, false, true);
    expect(rig.landings).toBe(1);
  });

  it('narrows the field of view by the punch, unless effects are reduced', () => {
    const camera = new PerspectiveCamera(64, 1, 0.065, 720);
    const rig = new CameraRig(camera);
    rig.update(frame(camera, { snap: true }));
    rig.punch = 1;
    rig.applyPunch(0, false);
    expect(camera.fov).toBeCloseTo(66.5);
    rig.applyPunch(0, true);
    expect(camera.fov).toBeCloseTo(74);
  });

  it('reset clears the kick, the punch and the landing count', () => {
    const camera = new PerspectiveCamera(64, 1, 0.065, 720);
    const rig = new CameraRig(camera);
    rig.kick(new Vector3(0, 1, 0), 1, false, false);
    rig.land(20, false, false);
    rig.punch = 0.7;
    rig.reset();
    expect(rig.kickOffset.length()).toBe(0);
    expect(rig.punch).toBe(0);
    expect(rig.landings).toBe(0);
  });
});

describe('CameraRig follow behaviour', () => {
  it('springs after a moving body instead of snapping to it', () => {
    const camera = new PerspectiveCamera(64, 1, 0.065, 720);
    const rig = new CameraRig(camera);
    const f = frame(camera, { snap: true, pitch: 0 });
    rig.update(f);
    f.player = new Vector3(6, 1.8, 24);
    for (let i = 0; i < 90; i++) rig.update({ ...f, time: i / 60 });
    expect(camera.position.x).toBeCloseTo(6.65, 0);
    expect(Number.isFinite(camera.position.length())).toBe(true);
  });

  it('sits at the eye line in first person', () => {
    const camera = new PerspectiveCamera(64, 1, 0.065, 720);
    const rig = new CameraRig(camera);
    rig.update(frame(camera, { snap: true, first: true, pitch: 0 }));
    expect(camera.position.y).toBeCloseTo(1.8 + 1.36, 1);
    expect(camera.position.z).toBeCloseTo(24 - 0.12, 1);
  });

  it('pulls the chase camera in when the way behind the body is blocked', () => {
    const camera = new PerspectiveCamera(64, 1, 0.065, 720);
    const rig = new CameraRig(camera);
    const blocked = frame(camera, { snap: true, pitch: 0, trace: () => ({ t: 0.5 }) });
    rig.update(blocked);
    const pivot = new Vector3(0, 1.8 + 1.25, 24);
    expect(camera.position.distanceTo(pivot)).toBeLessThan(DEFAULT_SETTINGS.cameraDistance);
  });

  it('frames the menu tableau and the demo orbit', () => {
    const camera = new PerspectiveCamera(64, 1, 0.065, 720);
    const rig = new CameraRig(camera);
    rig.showcase('menu', 0, new Vector3(0, 1.8, 24), new Vector3(0, 4, 0), 0);
    expect(camera.position.y).toBeCloseTo(7);
    expect(camera.fov).toBe(57);
    rig.showcase('demo', 1 / 60, new Vector3(0, 1.8, 24), new Vector3(0, 4, 0), 1);
    expect(camera.fov).toBe(67);
  });
});
