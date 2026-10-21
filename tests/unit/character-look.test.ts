import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { CharacterLook } from '../../src/character/CharacterLook';

function rig() {
  const model = new THREE.Group();
  const neck = new THREE.Bone(),
    head = new THREE.Bone();
  neck.name = 'Neck';
  head.name = 'Head';
  model.add(neck);
  neck.add(head);
  return { model, neck, head, look: new CharacterLook(model) };
}
const pitch = (bone: THREE.Bone) =>
  new THREE.Euler().setFromQuaternion(bone.quaternion, 'YXZ').x / 0.65;

describe('gameplay look pitch without mixer feedback', () => {
  it('filters pitch at frame-rate independent speed, without adding yaw latency', () => {
    const run = (fps: number) => {
      const { neck, look } = rig();
      for (let i = 0; i < fps / 5; i++) look.apply(0.8, 0.6, 1 / fps);
      return neck.quaternion.clone();
    };
    expect(run(60).angleTo(run(120))).toBeLessThan(1e-7);
    const { neck, look } = rig();
    look.apply(0.8, 0.6, 1 / 60);
    const e = new THREE.Euler().setFromQuaternion(neck.quaternion, 'YXZ');
    expect(e.x).toBeCloseTo(0.6 * (1 - Math.exp(-22 / 60)) * 0.65, 6);
    expect(e.y).toBeCloseTo(0.8 * 0.65, 6);
  });
  it('clamps before filtering, returns promptly from saturation, and freezes with dt zero', () => {
    const { neck, look } = rig();
    for (let i = 0; i < 120; i++) look.apply(0, 99, 1 / 60);
    expect(pitch(neck)).toBeCloseTo(Math.PI / 4, 6);
    const before = neck.quaternion.clone();
    look.apply(0, -99, 0);
    expect(neck.quaternion.angleTo(before)).toBeLessThan(1e-7);
    look.apply(0, 0, 1 / 60);
    expect(pitch(neck)).toBeCloseTo((Math.PI / 4) * Math.exp(-22 / 60), 6);
    for (let i = 0; i < 120; i++) look.apply(0, -99, 1 / 60);
    expect(pitch(neck)).toBeCloseTo((-35 * Math.PI) / 180, 6);
  });
  it('restores the mixer base exactly and retains immediate pose inspection', () => {
    const { neck, head, look } = rig();
    for (let i = 0; i < 90; i++) {
      look.clear();
      const animated = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.01 * i, 0.02, 0));
      neck.quaternion.copy(animated);
      head.quaternion.identity();
      look.apply(0.4, 0.3, 1 / 60);
      expect(neck.quaternion.length()).toBeCloseTo(1, 10);
      look.clear();
      expect(neck.quaternion.angleTo(animated)).toBeLessThan(1e-7);
      expect(head.quaternion.angleTo(new THREE.Quaternion())).toBeLessThan(1e-7);
    }
    neck.quaternion.identity();
    look.apply(0, 0.2);
    expect(pitch(neck)).toBeCloseTo(0.2, 6);
  });
});
