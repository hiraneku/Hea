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
    player.setMode('bind');
    player.playing = false;
    player.update(1);
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
    expect(gltf.scene.getObjectByName('Hips')!.position.y).toBeCloseTo(measured.pelvis[1], 4);
    for (let i = 0; i < 60; i++)
      player.locomotion(1 / 60, WALK.stride / WALK.duration, true, WALK.stride / WALK.duration);
    expect(player.mode).toBe('walk');
    expect(player.speed).toBeCloseTo(1, 2);
    player.locomotion(0.1, 1, false, 1);
    expect(player.mode).toBe('bind');
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
