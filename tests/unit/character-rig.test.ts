import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { armRegions101172 } from '../../src/character/skinRegions101172';
import { CharacterLook } from '../../src/character/CharacterLook';
import { CharacterTestDrive } from '../../src/character/CharacterTestDrive';
import { taperForearms101172 } from '../../src/character/shape101172';
import { CharacterPlayback } from '../../src/character/CharacterPlayback';
import { makeCharacterStop } from '../../src/character/CharacterStop';
import {
  resolveWalkingGait,
  stampWalkingGait,
  nextFootContact,
  isFootPlanted,
  phaseDistance,
  type WalkingGaitSpec,
} from '../../src/character/WalkingGait';
import { AvatarModel } from '../../src/game/Avatar';
import {
  measure101172,
  crossSections,
  type CharacterAnatomy,
} from '../../src/character/anatomy101172';
import { JOINT_NAMES, WALK } from '../../src/character/rig101172';

/** Decode the actual exported asset, without browser-only texture decoding.
 * Leave buffers, geometry, skin and animations unchanged; strip only render materials.
 */
async function loadRig(path = 'public/models/101172-rigged.glb') {
  const file = readFileSync(path);
  const jsonLength = file.readUInt32LE(12);
  const json = JSON.parse(file.subarray(20, 20 + jsonLength).toString());
  delete json.images;
  delete json.textures;
  delete json.materials;
  delete json.samplers;
  for (const mesh of json.meshes)
    for (const primitive of mesh.primitives) delete primitive.material;
  const text = Buffer.from(JSON.stringify(json));
  const padding = (4 - (text.length % 4)) % 4;
  const jsonChunk = Buffer.concat([text, Buffer.alloc(padding, 32)]);
  const binaryChunk = file.subarray(20 + jsonLength);
  const header = Buffer.alloc(20);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(20 + jsonChunk.length + binaryChunk.length, 8);
  header.writeUInt32LE(jsonChunk.length, 12);
  header.writeUInt32LE(0x4e4f534a, 16);
  const buffer = Buffer.concat([header, jsonChunk, binaryChunk]);
  return new GLTFLoader().parseAsync(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    '',
  );
}
/** Re-time and re-phase every track, retaining an actual cyclic skinned walk. */
function changedWalking(source: THREE.AnimationClip, durationScale: number, shift: number) {
  const duration = source.duration * durationScale;
  return new THREE.AnimationClip(
    'Walking',
    duration,
    source.tracks.map((track) => {
      const interpolant = track.name.endsWith('.quaternion')
        ? new THREE.QuaternionLinearInterpolant(track.times, track.values, 4)
        : new THREE.LinearInterpolant(track.times, track.values, 3);
      const times: number[] = [],
        values: number[] = [];
      for (let i = 0; i <= 240; i++) {
        times.push((i / 240) * duration);
        values.push(...interpolant.evaluate(((i / 240 + shift) % 1) * source.duration));
      }
      return track.name.endsWith('.quaternion')
        ? new THREE.QuaternionKeyframeTrack(track.name, times, values)
        : new THREE.VectorKeyframeTrack(track.name, times, values);
    }),
  );
}
let sourceGeometry: THREE.BufferGeometry;
let measured: CharacterAnatomy;
beforeAll(async () => {
  const source = await loadRig('public/models/101172.glb');
  source.scene.updateMatrixWorld(true);
  source.scene.traverse((o) => {
    if (o instanceof THREE.Mesh) sourceGeometry = o.geometry.clone().applyMatrix4(o.matrixWorld);
  });
  sourceGeometry.computeBoundingBox();
  const box = sourceGeometry.boundingBox!;
  const centre = box.getCenter(new THREE.Vector3());
  const scale = 2 / (box.max.y - box.min.y);
  sourceGeometry.translate(-centre.x, -box.min.y, -centre.z).scale(scale, scale, scale);
  measured = measure101172(sourceGeometry);
}, 30000);
let gltf: GLTF;
let mesh: THREE.SkinnedMesh;
beforeEach(async () => {
  gltf = await loadRig();
  gltf.scene.traverse((o) => {
    if (o instanceof THREE.SkinnedMesh) mesh = o;
  });
});

describe('portable 101172 rig and Walking asset', () => {
  it('contains a real humanoid skeleton, bind matrices, UVs and the gameplay clip name', () => {
    expect(mesh).toBeInstanceOf(THREE.SkinnedMesh);

    expect(mesh.skeleton.bones.map((bone) => bone.name).sort()).toEqual([...JOINT_NAMES].sort());
    expect(mesh.skeleton.boneInverses).toHaveLength(28);
    expect(mesh.geometry.getAttribute('uv').count).toBe(116724);
    expect(gltf.animations.map((clip) => clip.name)).toEqual(['Walking']);
    expect(gltf.animations[0].duration).toBeCloseTo(WALK.duration, 5);
    const metadata = gltf.scene.getObjectByName('HEA_101172')!.userData.heaCharacter;
    expect(metadata.rootMotion).toBe(false);
    expect(metadata.sourceSHA256).toBe(
      createHash('sha256').update(readFileSync('public/models/101172.glb')).digest('hex'),
    );
  });

  it('only tapers the requested derivative forearms while preserving source proportions elsewhere', () => {
    const expected = sourceGeometry.clone();
    taperForearms101172(expected, measured);
    const source = expected.getAttribute('position');
    const original = sourceGeometry.getAttribute('position');
    const target = mesh.geometry.getAttribute('position');
    expect(target.count).toBe(source.count);
    let maxError = 0;
    for (let i = 0; i < source.count * 3; i++)
      maxError = Math.max(maxError, Math.abs(source.array[i] - target.array[i]));
    expect(maxError).toBeLessThan(1e-6);
    let changed = 0;
    for (let i = 0; i < source.count; i++) {
      const d = new THREE.Vector3()
        .fromBufferAttribute(original, i)
        .distanceTo(new THREE.Vector3().fromBufferAttribute(target, i));
      if (d > 1e-6) {
        changed++;
        expect(original.getY(i)).toBeGreaterThan(0.91);
        expect(original.getY(i)).toBeLessThan(measured.arms.left.elbow[1]);
        expect(Math.abs(original.getX(i))).toBeGreaterThan(original.getY(i) < 1.1 ? 0.16 : 0.1);
      }
      expect(d).toBeLessThan(0.008);
    }
    expect(changed).toBeGreaterThan(1000);
    for (const side of ['Left', 'Right']) {
      const ankle = gltf.scene
        .getObjectByName(side + 'Foot')!
        .getWorldPosition(new THREE.Vector3());
      const toe = gltf.scene
        .getObjectByName(side + 'ToeEnd')!
        .getWorldPosition(new THREE.Vector3());
      expect(toe.z - ankle.z).toBeGreaterThan(0.14);
    }
  });

  it('places the hip above the actual crotch and fits the knee/ankle to source contour measurements', () => {
    expect(measured.crotch).toBeCloseTo(1.05, 2);
    expect(measured.pelvis[1]).toBeGreaterThan(measured.crotch);
    for (const [side, anatomy] of [
      ['Left', measured.left],
      ['Right', measured.right],
    ] as const) {
      const hip = gltf.scene.getObjectByName(side + 'Thigh')!.getWorldPosition(new THREE.Vector3());
      const knee = gltf.scene.getObjectByName(side + 'Shin')!.getWorldPosition(new THREE.Vector3());
      const ankle = gltf.scene
        .getObjectByName(side + 'Foot')!
        .getWorldPosition(new THREE.Vector3());
      expect(hip.distanceTo(new THREE.Vector3(...anatomy.hip))).toBeLessThan(1e-5);
      expect(hip.y).toBeGreaterThan(measured.crotch);
      expect(knee.distanceTo(new THREE.Vector3(...anatomy.knee))).toBeLessThan(1e-5);
      expect(knee.y).toBeGreaterThan(0.59);
      expect(knee.y).toBeLessThan(0.64);
      const contour = crossSections(sourceGeometry, knee.y).find(
        (s) => Math.abs(s.x - knee.x) < 0.005,
      );
      expect(contour).toBeDefined();
      expect(Math.abs(knee.z - contour!.z)).toBeLessThan(contour!.depth / 4);
      expect(ankle.distanceTo(new THREE.Vector3(...anatomy.ankle))).toBeLessThan(1e-5);
    }
  });

  it('fits shoulders above the armpits and elbows at the source arm shaft transition', () => {
    for (const [side, arm] of [
      ['Left', measured.arms.left],
      ['Right', measured.arms.right],
    ] as const) {
      expect(Math.abs(arm.tip[0])).toBeGreaterThan(0.2);
      expect(
        new THREE.Vector3(...arm.tip).distanceTo(new THREE.Vector3(...arm.wrist)),
      ).toBeLessThan(0.12);
      expect(arm.shoulder[1]).toBeGreaterThan(1.53);
      expect(arm.shoulder[1]).toBeLessThan(1.59);
      expect(arm.elbow[1]).toBeGreaterThan(1.3);
      expect(arm.elbow[1]).toBeLessThan(1.4);
      const waist = arm.profile
        .filter((s) => s.y >= 1.25 && s.y <= 1.42)
        .reduce((a, b) => (a.width * a.depth < b.width * b.depth ? a : b));
      expect(arm.elbowContour).toEqual([waist.x, waist.y, waist.z]);
      expect(arm.elbow[1]).toBeCloseTo(waist.y - 0.04, 5);
      for (const [name, point] of [
        ['UpperArm', arm.shoulder],
        ['ForeArm', arm.elbow],
        ['Hand', arm.wrist],
      ] as const) {
        const bone = gltf.scene.getObjectByName(side + name)!;
        expect(
          bone.getWorldPosition(new THREE.Vector3()).distanceTo(new THREE.Vector3(...point)),
        ).toBeLessThan(1e-5);
      }
      const chest = gltf.scene.getObjectByName('Chest')!.getWorldPosition(new THREE.Vector3());
      expect(Math.abs(chest.y - arm.shoulder[1])).toBeLessThan(0.025);
    }
  });

  it('assigns the lower arm to ForeArm below the measured elbow transition', () => {
    const regions = armRegions101172(sourceGeometry);
    const positions = mesh.geometry.getAttribute('position');
    const weights = mesh.geometry.getAttribute('skinWeight');
    const indices = mesh.geometry.getAttribute('skinIndex');
    let checked = 0;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      if (!regions[i] || y < 1.12 || y > 1.25) continue;
      let forearmWeight = 0;
      for (let slot = 0; slot < 4; slot++) {
        if (mesh.skeleton.bones[indices.array[i * 4 + slot]].name.endsWith('ForeArm'))
          forearmWeight += weights.array[i * 4 + slot];
      }
      expect(forearmWeight).toBeGreaterThan(0.99);
      checked++;
    }
    expect(checked).toBeGreaterThan(100);
  });

  it('turns Neck and Head additively without accumulating rotations or moving the torso', () => {
    const player = new CharacterPlayback(gltf.scene, gltf.animations);
    player.setMode('bind', true);
    player.playing = false;
    player.update(0);
    const look = new CharacterLook(gltf.scene);
    const neck = gltf.scene.getObjectByName('Neck')!,
      head = gltf.scene.getObjectByName('Head')!;
    const chest = gltf.scene.getObjectByName('Chest')!.quaternion.clone();
    const rest = neck.quaternion.clone();
    look.apply(0.8, 0.2);
    const once = neck.quaternion.clone();
    for (let i = 0; i < 100; i++) look.apply(0.8, 0.2);
    expect(neck.quaternion.angleTo(once)).toBeLessThan(1e-6);
    expect(neck.quaternion.angleTo(rest)).toBeGreaterThan(0.4);
    expect(head.quaternion.angleTo(new THREE.Quaternion())).toBeGreaterThan(0.2);
    expect(gltf.scene.getObjectByName('Chest')!.quaternion.angleTo(chest)).toBeLessThan(1e-6);
    look.clear();
    expect(neck.quaternion.angleTo(rest)).toBeLessThan(1e-6);
    player.seek(0.3);
    const animated = neck.quaternion.clone();
    look.apply(99, 99);
    look.clear();
    expect(neck.quaternion.angleTo(animated)).toBeLessThan(1e-6);
    player.dispose();
  });

  it('drives the portable clip at travelled speed with camera-relative motion and arena limits', () => {
    const player = new CharacterPlayback(gltf.scene, gltf.animations);
    const body = new THREE.Group();
    body.add(gltf.scene);
    const drive = new CharacterTestDrive(body, player, WALK.stride / WALK.duration);
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 1, 5);
    camera.lookAt(0, 1, 0);
    camera.updateMatrixWorld();
    const delta = drive.update(0.1, 0, 1, camera);
    expect(delta.z).toBeCloseTo(-drive.walkSpeed * 0.1, 5);
    expect(player.mode).toBe('walk');
    expect(drive.update(0.1, 1, 1, camera).length()).toBeCloseTo(delta.length(), 5);
    for (let i = 0; i < 200; i++) drive.update(0.1, 1, 1, camera);
    expect(Math.abs(body.position.x)).toBeLessThanOrEqual(5);
    expect(Math.abs(body.position.z)).toBeLessThanOrEqual(5);
    drive.update(0.1, 0, 0, camera);
    expect(player.mode).toBe('bind');
    const before = body.position.clone();
    drive.update(0, 1, 1, camera);
    expect(body.position.distanceTo(before)).toBe(0);
    player.dispose();
  });

  it('has finite normalized four-slot skin weights and valid bone indices at every vertex', () => {
    const weight = mesh.geometry.getAttribute('skinWeight');
    const index = mesh.geometry.getAttribute('skinIndex');
    expect(weight.itemSize).toBe(4);
    let maxError = 0;
    for (let vertex = 0; vertex < weight.count; vertex++) {
      let total = 0;
      for (let slot = 0; slot < 4; slot++) {
        const w = weight.array[vertex * 4 + slot];
        const i = index.array[vertex * 4 + slot];
        if (!Number.isFinite(w) || w < 0 || i < 0 || i >= 28)
          throw new Error(`Bad skin at ${vertex}`);
        total += w;
      }
      maxError = Math.max(maxError, Math.abs(total - 1));
    }
    expect(maxError).toBeLessThan(1e-6);
  });

  it('keeps the thigh surface from being dragged into spikes by the swinging hands', () => {
    const positions = mesh.geometry.getAttribute('position');
    const skinIndex = mesh.geometry.getAttribute('skinIndex');
    const skinWeight = mesh.geometry.getAttribute('skinWeight');
    let checked = 0;
    // At these heights the leg is inside |X|=.16 and the hanging hands outside it.
    // This is intentionally independent of the authoring connectivity classifier.
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      if (y < 0.8 || y > 1.04 || Math.abs(positions.getX(i)) > 0.16) continue;
      checked++;
      for (let slot = 0; slot < 4; slot++) {
        const name = mesh.skeleton.bones[skinIndex.array[i * 4 + slot]].name;
        if (/Clavicle|Arm|Hand/.test(name)) expect(skinWeight.array[i * 4 + slot]).toBe(0);
      }
    }
    expect(checked).toBeGreaterThan(1000);
    const indices = mesh.geometry.index!;
    const edges: [number, number, number][] = [];
    const a = new THREE.Vector3(),
      b = new THREE.Vector3();
    for (let i = 0; i < indices.count; i += 3)
      for (let j = 0; j < 3; j++) {
        const u = indices.getX(i + j),
          v = indices.getX(i + ((j + 1) % 3));
        if ([u, v].some((n) => positions.getY(n) < 0.8 || positions.getY(n) > 1.12)) continue;
        a.fromBufferAttribute(positions, u);
        b.fromBufferAttribute(positions, v);
        const length = a.distanceTo(b);
        if (length > 0.001) edges.push([u, v, length]);
      }
    const player = new CharacterPlayback(gltf.scene, gltf.animations);
    let maximumStretch = 0;
    for (let frame = 0; frame < 16; frame++) {
      player.seek(frame / 16);
      for (const [u, v, length] of edges) {
        mesh.applyBoneTransform(u, a.fromBufferAttribute(positions, u));
        mesh.applyBoneTransform(v, b.fromBufferAttribute(positions, v));
        maximumStretch = Math.max(maximumStretch, a.distanceTo(b) / length);
      }
    }
    expect(maximumStretch).toBeLessThan(3);
    player.dispose();
  });

  it('does not let shin deformation collapse or curl the rounded soles', () => {
    const positions = mesh.geometry.getAttribute('position');
    const indices = mesh.geometry.getAttribute('skinIndex');
    const weights = mesh.geometry.getAttribute('skinWeight');
    const sole: number[] = [];
    for (let i = 0; i < positions.count; i++) {
      if (positions.getY(i) >= 0.1 || positions.getX(i) <= 0) continue;
      sole.push(i);
      for (let slot = 0; slot < 4; slot++) {
        if (weights.array[i * 4 + slot] < 1e-6) continue;
        const name = mesh.skeleton.bones[indices.array[i * 4 + slot]].name;
        if (name !== 'LeftFoot' && name !== 'LeftToes') throw new Error(`Sole pulled by ${name}`);
      }
    }
    // Surface landmarks at the heel, toe, inner and outer edge, not just bones.
    const landmarks = [
      sole.reduce((a, b) => (positions.getX(a) < positions.getX(b) ? a : b)),
      sole.reduce((a, b) => (positions.getX(a) > positions.getX(b) ? a : b)),
      sole.reduce((a, b) => (positions.getZ(a) < positions.getZ(b) ? a : b)),
      sole.reduce((a, b) => (positions.getZ(a) > positions.getZ(b) ? a : b)),
    ];
    const rest = landmarks.map((i) => new THREE.Vector3().fromBufferAttribute(positions, i));
    const player = new CharacterPlayback(gltf.scene, gltf.animations);
    for (const phase of [0, 0.125, 0.25, 0.375, 0.5, 0.75]) {
      player.seek(phase);
      const posed = landmarks.map((i) =>
        mesh.applyBoneTransform(i, new THREE.Vector3().fromBufferAttribute(positions, i)),
      );
      for (let i = 0; i < 4; i++)
        for (let j = i + 1; j < 4; j++)
          expect(posed[i].distanceTo(posed[j])).toBeCloseTo(rest[i].distanceTo(rest[j]), 4);
    }
    player.dispose();
  });

  it('closes the loop without a pose seam and keeps neighbouring rotations smooth', () => {
    for (const track of gltf.animations[0].tracks) {
      const stride = track.getValueSize();
      const first = Array.from(track.values.slice(0, stride));
      const last = Array.from(track.values.slice(-stride));
      for (let i = 0; i < stride; i++) expect(last[i]).toBeCloseTo(first[i], 5);
      if (stride !== 4) continue;
      const a = new THREE.Quaternion(),
        b = new THREE.Quaternion();
      let largest = 0;
      for (let i = 4; i < track.values.length; i += 4) {
        a.fromArray(track.values, i - 4);
        b.fromArray(track.values, i);
        largest = Math.max(largest, a.angleTo(b));
      }
      expect(largest, track.name).toBeLessThan(0.14);
    }
  });

  it('bakes ground contact, swing clearance and constant stance speed into the GLB', () => {
    const player = new CharacterPlayback(gltf.scene, gltf.animations);
    const vertices = mesh.geometry.getAttribute('position');
    const soles = { Left: [] as number[], Right: [] as number[] };
    for (let i = 0; i < vertices.count; i++) {
      if (vertices.getY(i) < 0.16) soles[vertices.getX(i) > 0 ? 'Left' : 'Right'].push(i);
    }
    const point = new THREE.Vector3();
    let maxSwingError = 0;
    let minimum = Infinity,
      maxContactError = 0,
      maxAnklePathError = 0;
    for (let frame = 0; frame < WALK.samples; frame++) {
      player.seek(frame / WALK.samples);
      const hips = gltf.scene.getObjectByName('Hips')!;
      expect(Math.abs(hips.position.x)).toBeLessThan(0.019);
      for (const [side, offset] of [
        ['Left', 0],
        ['Right', 0.5],
      ] as const) {
        const phase = (frame / WALK.samples + offset) % 1;
        let bottom = Infinity;
        for (const vertex of soles[side]) {
          point.fromBufferAttribute(vertices, vertex);
          mesh.applyBoneTransform(vertex, point);
          bottom = Math.min(bottom, point.y);
        }
        minimum = Math.min(minimum, bottom);
        if (phase < WALK.stance) {
          maxContactError = Math.max(maxContactError, Math.abs(bottom - 0.002));
          const ankle = gltf.scene.getObjectByName(side + 'Foot')!.getWorldPosition(point);
          const expectedZ =
            WALK.stride * WALK.contactAdvance - WALK.stride * phase + measured.pelvis[2];
          maxAnklePathError = Math.max(maxAnklePathError, Math.abs(ankle.z - expectedZ));
        } else {
          const u = (phase - WALK.stance) / (1 - WALK.stance);
          const expectedClearance = WALK.clearance * Math.sin(Math.PI * u) ** 2;
          maxSwingError = Math.max(maxSwingError, Math.abs(bottom - 0.002 - expectedClearance));
        }
      }
    }
    expect(maxSwingError).toBeLessThan(0.006);
    expect(minimum).toBeGreaterThan(-0.002);
    expect(maxContactError).toBeLessThan(0.004);
    expect(maxAnklePathError).toBeLessThan(0.001);
    player.dispose();
  });

  it('keeps the support leg upright and both feet in separate lanes throughout the cycle', () => {
    // Regression for v1: a low pelvis forced 50° support-knee flexion and
    // 72° swing flexion. Contact alone passed while the character crouch-walked.
    const player = new CharacterPlayback(gltf.scene, gltf.animations);
    const position = (name: string) =>
      gltf.scene.getObjectByName(name)!.getWorldPosition(new THREE.Vector3());
    let largestSupportBend = 0,
      largestSwingBend = 0;
    let smallestSeparation = Infinity;
    for (let frame = 0; frame < WALK.samples; frame++) {
      const phase = frame / WALK.samples;
      player.seek(phase);
      smallestSeparation = Math.min(
        smallestSeparation,
        position('LeftFoot').x - position('RightFoot').x,
      );
      for (const [side, offset] of [
        ['Left', 0],
        ['Right', 0.5],
      ] as const) {
        const hip = position(side + 'Thigh'),
          knee = position(side + 'Shin'),
          ankle = position(side + 'Foot');
        const flex = THREE.MathUtils.radToDeg(Math.PI - hip.sub(knee).angleTo(ankle.sub(knee)));
        if ((phase + offset) % 1 < WALK.stance)
          largestSupportBend = Math.max(largestSupportBend, flex);
        else largestSwingBend = Math.max(largestSwingBend, flex);
      }
    }
    expect(largestSupportBend).toBeLessThan(28);
    // Higher clearance is deliberate: v2's restricted swing was rejected.
    expect(largestSwingBend).toBeGreaterThan(55);
    expect(largestSwingBend).toBeLessThan(75);
    expect(smallestSeparation).toBeGreaterThan(0.24);
    player.dispose();
  });

  it('supports pause, seek, speed-scaled gameplay playback and blending back to bind', () => {
    const player = new CharacterPlayback(gltf.scene, gltf.animations);
    player.seek(0.25);
    player.playing = false;
    player.update(0.1);
    expect(player.phase).toBeCloseTo(0.25, 5);
    player.playing = true;
    player.speed = 0.5;
    player.update(0.1);
    expect(player.phase).toBeCloseTo(0.25 + 0.05 / WALK.duration, 5);
    for (let i = 0; i < 120; i++) player.locomotion(1 / 60, 0, true, WALK.stride / WALK.duration);
    expect(player.mode).toBe('bind');
    expect(gltf.scene.getObjectByName('Hips')!.position.y).toBeGreaterThan(1.1);
    expect(gltf.scene.getObjectByName('Hips')!.position.y).toBeLessThan(1.14);
    for (let i = 0; i < 60; i++)
      player.locomotion(1 / 60, WALK.stride / WALK.duration, true, WALK.stride / WALK.duration);
    expect(player.mode).toBe('walk');
    expect(player.speed).toBeCloseTo(1, 2);
    player.locomotion(0.1, 1, false, 1);
    expect(player.mode).toBe('bind');
    player.dispose();
  });
  it('accelerates a planted first step into the exact Walking pose without a join snap', () => {
    const player = new CharacterPlayback(gltf.scene, gltf.animations);
    const body = new THREE.Group();
    body.add(gltf.scene);
    player.rootMotionEnabled = true;
    player.setMode('bind', true);
    const initial = mesh.skeleton.bones.map((b) => b.quaternion.clone().normalize());
    player.setMode('walk');
    const plan = player.startPlan!;
    expect(plan.clip.name).toBe('Starting');
    expect(player.isStarting).toBe(true);
    const positions = mesh.geometry.getAttribute('position');
    const sole: number[] = [];
    for (let i = 0; i < positions.count; i++) if (positions.getY(i) < 0.1) sole.push(i);
    const vertex = (i: number) =>
      mesh.localToWorld(
        mesh.applyBoneTransform(i, new THREE.Vector3().fromBufferAttribute(positions, i)),
      );
    body.updateMatrixWorld(true);
    const anchor = vertex(plan.supportVertex);
    let previous = initial,
      worstAngle = 0,
      pin = 0,
      floor = Infinity,
      lift = 0;
    const n = Math.ceil(plan.clip.duration * 120);
    for (let frame = 1; frame <= n; frame++) {
      player.update(plan.clip.duration / n);
      body.position.add(player.consumeRootMotion());
      body.updateMatrixWorld(true);
      const contact = vertex(plan.supportVertex);
      pin = Math.max(pin, Math.hypot(contact.x - anchor.x, contact.z - anchor.z));
      for (const [i, b] of mesh.skeleton.bones.entries())
        worstAngle = Math.max(worstAngle, b.quaternion.clone().normalize().angleTo(previous[i]));
      previous = mesh.skeleton.bones.map((b) => b.quaternion.clone().normalize());
      if (frame % 5 === 0) {
        let leadFloor = Infinity;
        for (const i of sole) {
          const p = vertex(i);
          floor = Math.min(floor, p.y);
          if (positions.getX(i) > 0 === (plan.lead === 'Left'))
            leadFloor = Math.min(leadFloor, p.y);
        }
        lift = Math.max(lift, leadFloor);
      }
    }
    player.update(1e-7);
    body.position.add(player.consumeRootMotion());
    body.updateMatrixWorld(true);
    expect(player.isStarting).toBe(false);
    expect(pin).toBeLessThan(0.003);
    expect(floor).toBeGreaterThan(-0.002);
    expect(lift).toBeGreaterThan(0.07);
    expect(worstAngle).toBeLessThan(0.1);
    expect(body.position.z).toBeCloseTo(plan.rootEnd.z, 5);
    const endPose = mesh.skeleton.bones.map((b) => b.quaternion.clone().normalize());
    player.seek(plan.joinPhase);
    mesh.skeleton.bones.forEach((b, i) =>
      expect(b.quaternion.clone().normalize().angleTo(endPose[i])).toBeLessThan(1e-5),
    );
    player.dispose();
  });

  it('preserves the sampled pose when releasing mid-start and restarting mid-stop', () => {
    const player = new CharacterPlayback(gltf.scene, gltf.animations);
    player.rootMotionEnabled = true;
    for (const fraction of [0.05, 0.3, 0.7, 0.95]) {
      player.speed = 1;
      player.setMode('bind', true);
      player.setMode('walk');
      player.update(player.startPlan!.clip.duration * fraction);
      player.consumeRootMotion();
      const pose = mesh.skeleton.bones.map((b) => b.quaternion.clone().normalize());
      player.setMode('bind');
      player.update(0);
      mesh.skeleton.bones.forEach((b, i) =>
        expect(b.quaternion.clone().normalize().angleTo(pose[i])).toBeLessThan(1e-5),
      );
      player.update(0.22);
      player.consumeRootMotion();
      const stopped = mesh.skeleton.bones.map((b) => b.quaternion.clone().normalize());
      player.setMode('walk');
      player.update(0);
      mesh.skeleton.bones.forEach((b, i) =>
        expect(b.quaternion.clone().normalize().angleTo(stopped[i])).toBeLessThan(1e-5),
      );
      for (let i = 0; i < 150; i++) {
        player.update(1 / 120);
        const delta = player.consumeRootMotion();
        expect(delta.z).toBeGreaterThan(-0.001);
      }
      expect(player.isStarting).toBe(false);
    }
    player.dispose();
  });

  it('never plans a backwards launch when restarting different closing-step phases', () => {
    const player = new CharacterPlayback(gltf.scene, gltf.animations);
    player.rootMotionEnabled = true;
    for (const phase of [0.02, 0.25, 0.49, 0.52, 0.75, 0.98])
      for (const progress of [0.15, 0.45, 0.75]) {
        player.setMode('walk', true);
        player.speed = 1;
        player.seek(phase);
        player.setMode('bind');
        player.update(player.stopPlan!.clip.duration * progress);
        player.consumeRootMotion();
        player.setMode('walk');
        expect(
          player.startPlan!.rootEnd.z,
          `release ${phase}, restart ${progress}`,
        ).toBeGreaterThanOrEqual(0);
      }
    player.dispose();
  });

  it('continues Walking arm and torso cadence at release instead of freezing the captured pose', () => {
    const player = new CharacterPlayback(gltf.scene, gltf.animations);
    const names = ['Spine', 'Chest', 'LeftUpperArm', 'RightUpperArm'];
    player.seek(0.12 + 0.04 / WALK.duration);
    const expected = names.map((n) =>
      gltf.scene.getObjectByName(n)!.quaternion.clone().normalize(),
    );
    player.seek(0.12);
    player.setMode('bind');
    player.update(0.04);
    names.forEach((name, i) =>
      expect(
        gltf.scene.getObjectByName(name)!.quaternion.clone().normalize().angleTo(expected[i]),
      ).toBeLessThan(0.002),
    );
    player.dispose();
  });
  it('uses only launch root motion, including leftover frame time at the Walking handoff', () => {
    const player = new CharacterPlayback(gltf.scene, gltf.animations);
    const body = new THREE.Group();
    body.add(gltf.scene);
    body.scale.setScalar(1.4);
    const speed = (WALK.stride / WALK.duration) * 1.4;
    const drive = new CharacterTestDrive(body, player, speed);
    drive.resetMotion();
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 1, 0);
    camera.updateMatrixWorld(true);
    drive.update(0.001, 0, 1, camera);
    const plan = player.startPlan!;
    expect(body.position.length()).toBeLessThan(0.0001);
    drive.update(plan.clip.duration + 0.039, 0, 1, camera);
    expect(player.isStarting).toBe(false);
    expect(body.position.z).toBeCloseTo(-1.4 * plan.rootEnd.z - speed * player.speed * 0.04, 5);
    player.dispose();
  });

  it('loads exact contact markers from GLB animation extras, independently of legacy metadata', () => {
    const gait = resolveWalkingGait(gltf.scene, gltf.animations[0]);
    expect(gait.source).toBe('markers');
    expect(gait.feet.Left.contact).toBe(0);
    expect(gait.feet.Right.contact).toBe(0.5);
    expect(gait.feet.Left.liftOff).toBe(WALK.stance);
    expect(gait.speed).toBeCloseTo(WALK.stride / WALK.duration, 6);
  });

  it('automatically adapts start, stop, foot locks and motor speed to a slower re-phased Walking', () => {
    const walk = changedWalking(gltf.animations[0], 1.65, 0.23);
    // Deliberately stale rig metadata must not drive the replacement gait.
    const legacy = gltf.scene.getObjectByName('HEA_101172')!.userData.heaCharacter;
    legacy.walkSpeed = 999;
    legacy.walkStance = 0.01;
    const player = new CharacterPlayback(gltf.scene, [walk]);
    const gait = player.gait;
    expect(gait.source).toBe('analysis');
    expect(gait.speed).toBeCloseTo(WALK.stride / WALK.duration / 1.65, 2);
    const phaseError = (a: number, b: number) => Math.min(phaseDistance(a, b), phaseDistance(b, a));
    expect(phaseError(gait.feet.Left.contact, 0.77)).toBeLessThan(0.02);
    expect(phaseError(gait.feet.Right.contact, 0.27)).toBeLessThan(0.02);
    const body = new THREE.Group();
    body.add(gltf.scene);
    player.rootMotionEnabled = true;
    player.setMode('bind', true);
    player.setMode('walk');
    const launch = player.startPlan!;
    expect(phaseError(launch.joinPhase, 0.77)).toBeLessThan(0.02);
    const positions = mesh.geometry.getAttribute('position');
    const vertex = (i: number) =>
      mesh.localToWorld(
        mesh.applyBoneTransform(i, new THREE.Vector3().fromBufferAttribute(positions, i)),
      );
    body.updateMatrixWorld(true);
    const anchor = vertex(launch.supportVertex);
    let pin = 0;
    for (let frame = 0; frame < 150; frame++) {
      player.update(launch.clip.duration / 150);
      body.position.add(player.consumeRootMotion());
      body.updateMatrixWorld(true);
      const p = vertex(launch.supportVertex);
      pin = Math.max(pin, Math.hypot(p.x - anchor.x, p.z - anchor.z));
    }
    expect(pin).toBeLessThan(0.003);
    player.update(1e-6);
    body.position.add(player.consumeRootMotion());
    expect(player.isStarting).toBe(false);
    player.speed = 1;
    player.seek(0.4);
    player.setMode('bind');
    const stop = player.stopPlan!;
    // Old fixed-half-cycle selection would wrongly choose Right here.
    expect(stop.lead).toBe('Left');
    expect(stop.firstContact).toBeGreaterThan(0.55);
    const support = 'RightFoot';
    const original = gltf.scene.getObjectByName(support)!.getWorldPosition(new THREE.Vector3());
    let drift = 0;
    for (let i = 0; i < 120; i++) {
      player.update(stop.clip.duration / 120);
      body.position.add(player.consumeRootMotion());
      body.updateMatrixWorld(true);
      if (((i + 1) * stop.clip.duration) / 120 < stop.followStart - 0.02)
        drift = Math.max(
          drift,
          gltf.scene
            .getObjectByName(support)!
            .getWorldPosition(new THREE.Vector3())
            .distanceTo(original),
        );
    }
    expect(drift).toBeLessThan(0.003);
    expect(player.isStopping).toBe(false);
    player.dispose();
  });

  it('uses asymmetric contact markers and wrapping stance windows rather than half-cycle assumptions', () => {
    const gait: WalkingGaitSpec = {
      speed: 0.8,
      feet: { Left: { contact: 0.81, liftOff: 0.56 }, Right: { contact: 0.43, liftOff: 0.94 } },
    };
    expect(nextFootContact(gait, 0.35)).toBe('Right');
    expect(nextFootContact(gait, 0.6)).toBe('Left');
    expect(nextFootContact(gait, 0.9)).toBe('Right');
    expect(isFootPlanted(gait, 'Left', 0.02)).toBe(true);
    expect(isFootPlanted(gait, 'Left', 0.7)).toBe(false);
    expect(phaseDistance(gait.feet.Right.contact, gait.feet.Left.contact)).toBeCloseTo(0.38);
  });

  it('schedules a 70/30 contact pattern without clamping it to a half-cycle', () => {
    const player = new CharacterPlayback(gltf.scene, gltf.animations);
    player.seek(0.05);
    const gait = {
      ...player.gait,
      feet: { Left: { contact: 0, liftOff: 0.78 }, Right: { contact: 0.7, liftOff: 0.08 } },
    };
    // Isolate the event scheduler; these supplied events are not a new visual clip.
    const plan = makeCharacterStop(
      gltf.scene,
      gltf.animations[0],
      0.05,
      gait.speed,
      undefined,
      gait,
    );
    expect(plan.lead).toBe('Right');
    expect(plan.firstContact).toBeCloseTo(0.65 * player.duration, 5);
    expect(plan.secondContact - plan.followStart).toBeCloseTo(0.3 * player.duration * 0.86, 5);
    const body = new THREE.Group();
    body.scale.setScalar(0.76);
    const motor = new CharacterTestDrive(body, player);
    const old = motor.walkSpeed;
    player.setMode('bind', true);
    player.replaceWalking(changedWalking(gltf.animations[0], 2, 0.1));
    expect(motor.walkSpeed).toBeCloseTo(old / 2, 2);
    player.dispose();
  });

  it('invalidates stale embedded markers when keyframes change and replaces clips only while idle', () => {
    const original = gltf.animations[0].clone();
    const player = new CharacterPlayback(gltf.scene, [original]);
    expect(player.gait.source).toBe('markers');
    expect(() => player.replaceWalking(original)).toThrow(/Stop completely/);
    player.setMode('bind', true);
    const metadata = (original as THREE.AnimationClip & { userData: Record<string, unknown> })
      .userData;
    const replacement = changedWalking(original, 0.8, 0.37);
    Object.assign(replacement, { userData: metadata }); // old signature intentionally copied
    player.replaceWalking(replacement);
    expect(player.gait.source).toBe('analysis');
    expect(player.authoredWalkSpeed).toBeCloseTo(WALK.stride / WALK.duration / 0.8, 2);
    expect(
      Math.min(
        phaseDistance(player.gait.feet.Left.contact, 0.63),
        phaseDistance(0.63, player.gait.feet.Left.contact),
      ),
    ).toBeLessThan(0.02);
    expect(player.mode).toBe('bind');
    expect(player.action.getClip()).toBe(replacement);
    // Invalid input must not destroy the working clip.
    const bad = replacement.clone();
    bad.tracks.push(
      new THREE.VectorKeyframeTrack('Root.position', [0, bad.duration], [0, 0, 0, 0, 0, 1]),
    );
    expect(() => player.replaceWalking(bad)).toThrow(/in-place/);
    expect(player.action.getClip()).toBe(replacement);
    player.dispose();
  });

  it('rejects invalid profiles and unsupported clips instead of silently using the old Walking phases', () => {
    const clip = gltf.animations[0].clone();
    expect(() =>
      stampWalkingGait(clip, {
        speed: 0,
        feet: { Left: { contact: 0, liftOff: 0.6 }, Right: { contact: 0.5, liftOff: 0.1 } },
      }),
    ).toThrow(/positive/);
    expect(() =>
      stampWalkingGait(clip, {
        speed: 1,
        feet: { Left: { contact: 0, liftOff: 0.3 }, Right: { contact: 0.5, liftOff: 0.8 } },
      }),
    ).toThrow(/double support/);
    const staticClip = new THREE.AnimationClip('Walking', 1, [
      new THREE.QuaternionKeyframeTrack('Root.quaternion', [0, 1], [0, 0, 0, 1, 0, 0, 0, 1]),
    ]);
    expect(() => resolveWalkingGait(gltf.scene, staticClip)).toThrow(
      /identify planted|lifted step/,
    );
  });

  it('bakes a compact flight envelope with height, pinned takeoff/landing feet and smooth poses', () => {
    const player = new CharacterPlayback(gltf.scene, gltf.animations);
    player.rootMotionEnabled = true;
    const body = new THREE.Group();
    body.add(gltf.scene);
    const positions = mesh.geometry.getAttribute('position');
    const soles: number[] = [];
    for (let i = 0; i < positions.count; i++) if (positions.getY(i) < 0.1) soles.push(i);
    for (const phase of [undefined, 0.12, 0.49, 0.74]) {
      body.position.set(0, 0, 0);
      player.setMode('bind', true);
      player.speed = 1;
      if (phase !== undefined) {
        player.setMode('walk', true);
        player.seek(phase);
      }
      const initial = mesh.skeleton.bones.map((b) => b.quaternion.clone().normalize());
      expect(player.fly(phase === undefined ? 0 : 0.65)).toBe(true);
      expect(player.fly()).toBe(false);
      // Force an idle exit; held movement is covered by the motor test below.
      player.setMode('bind');
      player.land();
      const plan = player.flightPlan!;
      mesh.skeleton.bones.forEach((b, i) =>
        expect(b.quaternion.clone().normalize().angleTo(initial[i])).toBeLessThan(1e-5),
      );
      let previous = initial,
        worstAngle = 0,
        minFloor = Infinity,
        maxHeight = 0,
        pin = 0;
      const foot = (s: string) =>
        gltf.scene.getObjectByName(s + 'Foot')!.getWorldPosition(new THREE.Vector3());
      body.updateMatrixWorld(true);
      const anchors = { Left: foot('Left'), Right: foot('Right') };
      let landed: typeof anchors | undefined;
      const n = 240;
      for (let frame = 1; frame <= n; frame++) {
        const t = (plan.clip.duration * frame) / n;
        player.update(plan.clip.duration / n);
        body.position.add(player.consumeRootMotion());
        body.updateMatrixWorld(true);
        maxHeight = Math.max(maxHeight, body.position.y);
        for (const side of ['Left', 'Right'] as const) {
          const p = foot(side);
          if (t < plan.takeoff)
            pin = Math.max(pin, Math.hypot(p.x - anchors[side].x, p.z - anchors[side].z));
          if (t > plan.landing + 0.02) {
            landed ??= { Left: foot('Left'), Right: foot('Right') };
            pin = Math.max(pin, p.distanceTo(landed[side]));
          }
        }
        mesh.skeleton.bones.forEach((b, i) => {
          const angle = b.quaternion.clone().normalize().angleTo(previous[i]);
          worstAngle = Math.max(worstAngle, angle);
        });
        previous = mesh.skeleton.bones.map((b) => b.quaternion.clone().normalize());
        if (frame % 12 === 0)
          for (const i of soles) {
            const p = mesh.localToWorld(
              mesh.applyBoneTransform(i, new THREE.Vector3().fromBufferAttribute(positions, i)),
            );
            minFloor = Math.min(minFloor, p.y);
          }
      }
      expect(player.isFlying).toBe(false);
      expect(maxHeight).toBeGreaterThan(0.6);
      expect(minFloor).toBeGreaterThan(-0.003);
      expect(pin).toBeLessThan(0.003);
      expect(worstAngle).toBeLessThan(0.17);
      expect(body.position.y).toBeCloseTo(0, 6);
      expect(body.position.z).toBeCloseTo(plan.rootEnd.z, 5);
      expect(foot('Left').z).toBeCloseTo(foot('Right').z, 3);
      const held = foot('Left');
      player.update(0.5);
      body.position.add(player.consumeRootMotion());
      body.updateMatrixWorld(true);
      expect(foot('Left').distanceTo(held)).toBeLessThan(1e-6);
    }
    player.dispose();
  });
  it('hovers with straight neutral-spaced legs and relaxed arms, then restores the captured stopped stance', () => {
    const player = new CharacterPlayback(gltf.scene, gltf.animations);
    player.rootMotionEnabled = true;
    player.setMode('walk', true);
    player.seek(0.31);
    player.setMode('bind');
    player.update(3);
    const initial = mesh.skeleton.bones.map((b) => ({
      q: b.quaternion.clone(),
      p: b.position.clone(),
    }));
    const point = (name: string) =>
      gltf.scene.getObjectByName(name)!.getWorldPosition(new THREE.Vector3());
    const before = ['LeftFoot', 'RightFoot'].map(point);
    player.fly();
    const plan = player.flightPlan!;
    player.update(plan.apex);
    gltf.scene.updateMatrixWorld(true);
    for (const side of ['Left', 'Right']) {
      const hip = point(side + 'Thigh'),
        knee = point(side + 'Shin'),
        ankle = point(side + 'Foot');
      expect(knee.clone().sub(hip).angleTo(ankle.clone().sub(knee))).toBeLessThan(0.005);
      const armClearance = Math.abs(point(side + 'Hand').x - point(side + 'UpperArm').x);
      expect(armClearance).toBeGreaterThan(0.08);
      expect(armClearance).toBeLessThan(0.14);
    }
    const ankleSpacing = point('LeftFoot').x - point('RightFoot').x;
    expect(ankleSpacing).toBeGreaterThan(0.24);
    expect(ankleSpacing).toBeLessThan(0.28);
    const pos = mesh.geometry.getAttribute('position');
    const index = mesh.geometry.index!;
    let worst = 0,
      checked = 0;
    for (let i = 0; i < index.count; i += 3)
      for (let j = 0; j < 3; j++) {
        const a = index.getX(i + j),
          b = index.getX(i + ((j + 1) % 3));
        const pa = new THREE.Vector3().fromBufferAttribute(pos, a);
        const pb = new THREE.Vector3().fromBufferAttribute(pos, b);
        if (pa.y < 0.3 || pa.y > 1.57) continue;
        const length = pa.distanceTo(pb);
        if (length < 0.004) continue;
        const ratio =
          mesh.applyBoneTransform(a, pa).distanceTo(mesh.applyBoneTransform(b, pb)) / length;
        worst = Math.max(worst, ratio);
        checked++;
      }
    expect(checked).toBeGreaterThan(1000);
    expect(worst).toBeLessThan(2);
    player.land();
    player.update(plan.clip.duration - plan.apex);
    gltf.scene.updateMatrixWorld(true);
    ['LeftFoot', 'RightFoot'].forEach((name, i) =>
      expect(point(name).distanceTo(before[i])).toBeLessThan(0.0001),
    );
    mesh.skeleton.bones.forEach((b, i) => {
      expect(
        b.quaternion.clone().normalize().angleTo(initial[i].q.clone().normalize()),
      ).toBeLessThan(0.00001);
      expect(b.position.distanceTo(initial[i].p)).toBeLessThan(0.00001);
    });
    player.dispose();
  });
  it('holds flight in a scaled motor, lands on request, resumes Walking and resets midair', () => {
    const body = new THREE.Group();
    body.scale.setScalar(0.76);
    body.add(gltf.scene);
    const player = new CharacterPlayback(gltf.scene, gltf.animations),
      drive = new CharacterTestDrive(body, player);
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 1, 0);
    camera.updateMatrixWorld(true);
    drive.resetMotion();
    for (let i = 0; i < 100; i++) drive.update(1 / 60, 0, 1, camera);
    expect(drive.requestFlight()).toBe(true);
    const plan = player.flightPlan!;
    const initial = body.position.clone();
    for (let i = 0; i < 50; i++) drive.update(0.02, 0, 0, camera);
    expect(body.position.y).toBeGreaterThan(0.4);
    expect(drive.requestFlight()).toBe(true);
    expect(drive.requestFlight()).toBe(false);
    for (let i = 0; i < 47; i++) drive.update(0.02, 0, 1, camera);
    expect(body.position.y).toBeCloseTo(0, 5);
    const nextTrack = player.startPlan!.clip.tracks.find((t) => t.name === 'Root.position')!;
    const carry = new THREE.Vector3().fromArray(
      new THREE.LinearInterpolant(nextTrack.times, nextTrack.values, 3).evaluate(
        0.02 * player.speed,
      ),
    );
    expect(body.position.z - initial.z).toBeCloseTo(-(plan.rootEnd.z + carry.z) * 0.76, 5);
    expect(player.isStarting).toBe(true);
    drive.update(0.6, 0, 1, camera);
    drive.requestFlight();
    drive.update(0.8, 0, 0, camera);
    expect(body.position.y).toBeGreaterThan(0.3);
    // resetMotion clears animation/motion; owner resets the body's position.
    drive.resetMotion();
    body.position.set(0, 0, 0);
    drive.update(0.1, 0, 0, camera);
    expect(player.isFlying).toBe(false);
    expect(body.position.length()).toBe(0);
    player.dispose();
  });
  it('pauses sustained flight without root rollback or a second airborne impulse', () => {
    const player = new CharacterPlayback(gltf.scene, gltf.animations);
    player.rootMotionEnabled = true;
    player.setMode('bind', true);
    player.fly();
    player.update(0.8);
    player.consumeRootMotion();
    const phase = player.phase;
    player.playing = false;
    player.update(0.4);
    expect(player.phase).toBe(phase);
    expect(player.consumeRootMotion().length()).toBe(0);
    expect(player.fly()).toBe(false);
    player.setMode('bind', true);
    expect(player.isFlying).toBe(false);
    player.dispose();
  });

  it('exports white derivative materials without overwriting source geometry', () => {
    const file = readFileSync('public/models/101172-rigged.glb');
    const length = file.readUInt32LE(12);
    const json = JSON.parse(file.subarray(20, 20 + length).toString());
    expect(json.materials[0].pbrMetallicRoughness.baseColorFactor ?? [1, 1, 1, 1]).toEqual([
      1, 1, 1, 1,
    ]);
    expect(json.materials[0].pbrMetallicRoughness.baseColorTexture).toBeUndefined();
  });
  it('isolates shoulder vertices from head pitch/yaw and separates forearm/thigh influences', () => {
    const positions = mesh.geometry.getAttribute('position'),
      weights = mesh.geometry.getAttribute('skinWeight'),
      indices = mesh.geometry.getAttribute('skinIndex');
    const shoulder: number[] = [];
    let arms = 0;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i),
        x = Math.abs(positions.getX(i));
      if (y > 1.38 && y < 1.59) {
        shoulder.push(i);
        for (let slot = 0; slot < 4; slot++) {
          const name = mesh.skeleton.bones[indices.array[i * 4 + slot]].name;
          if (['Neck', 'Head'].includes(name)) expect(weights.array[i * 4 + slot]).toBe(0);
        }
      }
      if (y > 0.93 && y < 1.2 && x > 0.2) {
        arms++;
        let armWeight = 0;
        for (let slot = 0; slot < 4; slot++)
          if (/Clavicle|Arm|Hand/.test(mesh.skeleton.bones[indices.array[i * 4 + slot]].name))
            armWeight += weights.array[i * 4 + slot];
        expect(armWeight).toBeGreaterThan(0.999);
      }
    }
    expect(arms).toBeGreaterThan(500);
    expect(shoulder.length).toBeGreaterThan(1000);
    const before = shoulder.map((i) =>
      mesh.applyBoneTransform(i, new THREE.Vector3().fromBufferAttribute(positions, i)),
    );
    const look = new CharacterLook(gltf.scene);
    for (const pitch of [-Math.PI / 6, Math.PI / 6]) {
      look.apply(0.7, pitch);
      let worst = 0;
      shoulder.forEach((i, j) => {
        const p = mesh.applyBoneTransform(i, new THREE.Vector3().fromBufferAttribute(positions, i));
        worst = Math.max(worst, p.distanceTo(before[j]));
      });
      expect(worst).toBeLessThan(1e-6);
      look.clear();
    }
  });
  it('keeps hovering until descent is explicitly requested', () => {
    const player = new CharacterPlayback(gltf.scene, gltf.animations);
    player.rootMotionEnabled = true;
    player.setMode('bind', true);
    player.fly();
    let height = 0;
    for (let i = 0; i < 500; i++) {
      player.update(0.02);
      height += player.consumeRootMotion().y;
    }
    expect(player.isFlying).toBe(true);
    expect(player.flightStage).toBe('hover');
    expect(height).toBeGreaterThan(0.59);
    expect(height).toBeLessThan(0.65);
    const hoverPose = mesh.skeleton.bones.map((b) => b.quaternion.clone().normalize());
    expect(player.land()).toBe(true);
    expect(player.land()).toBe(false);
    player.update(0);
    expect(player.consumeRootMotion().length()).toBeLessThan(1e-9);
    mesh.skeleton.bones.forEach((b, i) =>
      expect(b.quaternion.clone().normalize().angleTo(hoverPose[i])).toBeLessThan(1e-6),
    );
    player.update(2);
    height += player.consumeRootMotion().y;
    expect(height).toBeCloseTo(0, 5);
    expect(player.isFlying).toBe(false);
    player.dispose();
  });

  it('lands the phase-selected foot first, closes the other beside it, and pins planted feet', () => {
    const player = new CharacterPlayback(gltf.scene, gltf.animations);
    const positions = mesh.geometry.getAttribute('position');
    const sole: number[] = [];
    for (let i = 0; i < positions.count; i++) if (positions.getY(i) < 0.1) sole.push(i);
    const foot = (side: string) =>
      gltf.scene.getObjectByName(side + 'Foot')!.getWorldPosition(new THREE.Vector3());
    let worstPin = 0,
      worstFloor = 0,
      worstAngle = 0;
    for (const phase of [0.02, 0.12, 0.25, 0.49, 0.52, 0.68, 0.85, 0.98]) {
      player.setMode('walk');
      player.playing = true;
      player.update(1);
      player.seek(phase);
      const start = { Left: foot('Left'), Right: foot('Right') };
      let previous = mesh.skeleton.bones.map((b) => b.quaternion.clone().normalize());
      player.setMode('bind');
      player.playing = false;
      player.update(0);
      mesh.skeleton.bones.forEach((bone, i) =>
        expect(bone.quaternion.clone().normalize().angleTo(previous[i])).toBeLessThan(1e-6),
      );
      const plan = player.stopPlan!;
      expect(plan.clip.name).toBe('Stopping');
      expect(plan.lead).toBe(phase < 0.5 ? 'Right' : 'Left');
      expect(plan.secondContact).toBeGreaterThan(plan.firstContact + 0.4);
      const follow = plan.lead === 'Left' ? 'Right' : 'Left';
      let leadAnchor: THREE.Vector3 | undefined,
        followAnchor: THREE.Vector3 | undefined,
        followMax = 0;
      for (let frame = 1; frame <= 100; frame++) {
        const time = (plan.clip.duration * frame) / 100;
        player.update(plan.clip.duration / 100);
        const lead = foot(plan.lead),
          closing = foot(follow);
        if (time < plan.followStart - 0.02)
          worstPin = Math.max(worstPin, closing.distanceTo(start[follow]));
        if (time > plan.firstContact + 0.02) {
          if (!leadAnchor) leadAnchor = lead.clone();
          worstPin = Math.max(worstPin, lead.distanceTo(leadAnchor));
        }
        if (time > plan.secondContact + 0.02) {
          if (!followAnchor) followAnchor = closing.clone();
          worstPin = Math.max(worstPin, closing.distanceTo(followAnchor));
        }
        if (time > plan.followStart && time < plan.secondContact)
          followMax = Math.max(followMax, closing.y);
        mesh.skeleton.bones.forEach((bone, i) => {
          worstAngle = Math.max(
            worstAngle,
            bone.quaternion.clone().normalize().angleTo(previous[i]),
          );
        });
        previous = mesh.skeleton.bones.map((b) => b.quaternion.clone().normalize());
        if (frame % 10 === 0)
          for (const i of sole) {
            const point = mesh.applyBoneTransform(
              i,
              new THREE.Vector3().fromBufferAttribute(positions, i),
            );
            worstFloor = Math.min(worstFloor, point.y);
          }
      }
      expect(player.isStopping).toBe(false);
      expect(foot('Left').z).toBeCloseTo(foot('Right').z, 3);
      expect(foot('Left').x - foot('Right').x).toBeGreaterThan(0.23);
      expect(followMax).toBeGreaterThan(0.27);
      expect(player.action.getEffectiveWeight()).toBe(0);
      const held = foot('Left');
      player.update(0.5);
      expect(foot('Left').distanceTo(held)).toBeLessThan(1e-6);
    }
    expect(worstPin).toBeLessThan(0.002);
    expect(worstFloor).toBeGreaterThan(-0.004);
    expect(worstAngle).toBeLessThan(0.25);
    player.setMode('walk');
    expect(player.isStopping).toBe(false);
    player.dispose();
  }, 20000);

  it('applies stop root displacement once in a rotated, scaled gameplay body without sliding support', () => {
    const player = new CharacterPlayback(gltf.scene, gltf.animations);
    const body = new THREE.Group();
    body.scale.setScalar(0.76);
    body.rotation.y = Math.PI / 2;
    body.add(gltf.scene);
    const drive = new CharacterTestDrive(body, player, (WALK.stride / WALK.duration) * 0.76);
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(5, 1, 0);
    camera.lookAt(0, 1, 0);
    player.seek(0.25);
    gltf.scene.updateMatrixWorld(true);
    const before = gltf.scene.getObjectByName('LeftFoot')!.getWorldPosition(new THREE.Vector3());
    let elapsed = 0,
      maxPin = 0;
    for (let frame = 0; frame < 100; frame++) {
      drive.update(1 / 60, 0, 0, camera);
      elapsed += 1 / 60;
      if (elapsed < player.stopPlan!.followStart - 0.02)
        maxPin = Math.max(
          maxPin,
          before.distanceTo(
            gltf.scene.getObjectByName('LeftFoot')!.getWorldPosition(new THREE.Vector3()),
          ),
        );
    }
    expect(maxPin).toBeLessThan(0.002);
    expect(body.position.x).toBeGreaterThan(0.05);
    expect(Math.abs(body.position.z)).toBeLessThan(0.001);
    const final = body.position.clone();
    drive.update(0.5, 0, 0, camera);
    expect(body.position.distanceTo(final)).toBeLessThan(1e-6);
    expect(gltf.scene.getObjectByName('Root')!.position.length()).toBeLessThan(1e-6);
    player.dispose();
  });

  it('loads the same exported GLB through the actual gameplay AvatarModel adapter', async () => {
    const loader = vi.spyOn(GLTFLoader.prototype, 'loadAsync').mockResolvedValue(gltf);
    try {
      const playerRoot = new THREE.Group();
      const avatar = new AvatarModel(playerRoot, '/models/101172-rigged.glb');
      await avatar.load();
      expect(avatar.ready).toBe(true);
      expect(avatar.clipNames).toEqual(['walk']);
      expect(gltf.scene.rotation.y).toBeCloseTo(Math.PI, 6);
      const hip = playerRoot.getObjectByName('Hips')!;
      const bindY = hip.position.y;
      for (let i = 0; i < 60; i++)
        avatar.update(1 / 60, { speed: 1.4, airborne: false, dead: false });
      expect(avatar.current).toBe('walk');
      expect(
        playerRoot.getObjectByName('LeftThigh')!.quaternion.angleTo(new THREE.Quaternion()),
      ).toBeGreaterThan(0.1);
      for (let i = 0; i < 60; i++)
        avatar.update(1 / 60, { speed: 0, airborne: false, dead: false });
      expect(hip.position.y).toBeCloseTo(bindY, 5);
      for (let i = 0; i < 40; i++)
        avatar.update(1 / 60, { speed: 2, airborne: false, dead: false });
      for (let i = 0; i < 40; i++) avatar.update(1 / 60, { speed: 2, airborne: true, dead: false });
      expect(avatar.current).toBe('air');
      expect(hip.position.y).toBeCloseTo(bindY, 5);
      expect(playerRoot.position.toArray()).toEqual([0, 0, 0]);
      expect(avatar.measured.height).toBeCloseTo(1.52, 2);
    } finally {
      loader.mockRestore();
    }
  });
});
