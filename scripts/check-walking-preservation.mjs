// Compare a saved pre-walking GLB with the regenerated derivative. Animation and
// its explicitly versioned metadata may change; the character itself must not.
// node scripts/check-walking-preservation.mjs before.glb [after.glb]
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

function load(path) {
  const file = readFileSync(path);
  const length = file.readUInt32LE(12);
  return { json: JSON.parse(file.subarray(20, 20 + length)), binary: file.subarray(28 + length) };
}
function accessor(asset, index) {
  const a = asset.json.accessors[index];
  assert.equal(a.sparse, undefined, 'Sparse accessor requires explicit comparison');
  const view = asset.json.bufferViews[a.bufferView];
  const width =
    { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[a.type] *
    { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }[a.componentType];
  assert.ok(width);
  const start = (view.byteOffset || 0) + (a.byteOffset || 0);
  return {
    type: a.type,
    count: a.count,
    componentType: a.componentType,
    normalized: !!a.normalized,
    data: Buffer.concat(
      Array.from({ length: a.count }, (_, i) => {
        const offset = start + i * (view.byteStride || width);
        return asset.binary.subarray(offset, offset + width);
      }),
    ),
  };
}
const before = load(process.argv[2]);
const after = load(process.argv[3] || 'public/models/101172-rigged.glb');
for (const key of ['meshes', 'skins', 'materials', 'textures', 'samplers', 'scenes', 'scene'])
  assert.deepEqual(after.json[key], before.json[key], key);
const nodes = (asset) =>
  structuredClone(asset.json.nodes).map((node) => {
    if (node.extras?.heaCharacter) delete node.extras.heaCharacter.walkingRevision;
    return node;
  });
assert.deepEqual(nodes(after), nodes(before), 'Rest transforms, hierarchy and anatomy');
let checked = 0;
const compareAccessor = (index) => {
  assert.deepEqual(accessor(after, index), accessor(before, index), `Accessor ${index}`);
  checked++;
};
for (const mesh of before.json.meshes)
  for (const primitive of mesh.primitives) {
    for (const index of Object.values(primitive.attributes)) compareAccessor(index);
    if (primitive.indices !== undefined) compareAccessor(primitive.indices);
    for (const target of primitive.targets || [])
      for (const index of Object.values(target)) compareAccessor(index);
  }
for (const skin of before.json.skins) compareAccessor(skin.inverseBindMatrices);
assert.equal(after.json.images?.length, before.json.images?.length);
for (let i = 0; i < (before.json.images?.length || 0); i++) {
  const a = before.json.images[i],
    b = after.json.images[i];
  assert.equal(b.mimeType, a.mimeType);
  assert.equal(b.uri, a.uri);
  if (a.bufferView !== undefined) {
    const bytes = (asset, image) => {
      const view = asset.json.bufferViews[image.bufferView];
      return asset.binary.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
    };
    assert.deepEqual(bytes(after, b), bytes(before, a), `Embedded texture ${i}`);
  }
}
assert.equal(after.json.skins[0].joints.length, 28);
assert.equal(
  createHash('sha256').update(readFileSync('public/models/101172.glb')).digest('hex'),
  '1dd246fbac2e45209b97648018093b643d49624e288f3c87b1b26317e058e9c8',
  'Immutable source',
);
console.log(
  `Preserved exactly: ${checked} non-animation accessors, topology, 28 joints, rest transforms, anatomy, skin, materials, UVs, embedded textures and immutable source.`,
);
