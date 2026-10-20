import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { CharacterPlayback } from '../../src/character/CharacterPlayback';
import { AvatarModel } from '../../src/game/Avatar';
import { JOINT_NAMES, WALK } from '../../src/character/rig101172';

/** Decode the actual exported asset, without browser-only texture decoding.
 * Leave buffers, geometry, skin and animations unchanged; strip only render materials.
 */
async function loadRig() {
  const file = readFileSync('public/models/101172-rigged.glb');
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
    expect(gltf.scene.getObjectByName('HEA_101172')!.userData.heaCharacter.rootMotion).toBe(false);
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
        if (phase < 0.62) {
          maxContactError = Math.max(maxContactError, Math.abs(bottom - 0.002));
          const ankle = gltf.scene.getObjectByName(side + 'Foot')!.getWorldPosition(point);
          const expectedZ = (WALK.stride * 0.62) / 2 - WALK.stride * phase + 0.045;
          maxAnklePathError = Math.max(maxAnklePathError, Math.abs(ankle.z - expectedZ));
        } else if (phase > 0.76 && phase < 0.88) expect(bottom).toBeGreaterThan(0.07);
      }
    }
    expect(minimum).toBeGreaterThan(-0.002);
    expect(maxContactError).toBeLessThan(0.004);
    expect(maxAnklePathError).toBeLessThan(0.001);
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
    expect(gltf.scene.getObjectByName('Hips')!.position.y).toBeCloseTo(0.97, 4);
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
      expect(Math.abs(hip.position.y - bindY)).toBeGreaterThan(0.02);
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
