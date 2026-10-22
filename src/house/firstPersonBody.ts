import * as T from 'three';
/** Private render geometry only: omit head-weighted triangles, never deform the rig. */
export function firstPersonBody(mesh: T.SkinnedMesh) {
  const source = mesh.geometry,
    geo = source.clone(),
    skin = source.getAttribute('skinIndex'),
    weights = source.getAttribute('skinWeight');
  const head = mesh.skeleton.bones.findIndex((b) => b.name === 'Head');
  if (head < 0 || !skin || !weights) throw new Error('First person requires Head skin weights');
  const hidden = (v: number) => {
    let w = 0;
    for (let c = 0; c < 4; c++)
      if (skin.getComponent(v, c) === head) w += weights.getComponent(v, c);
    return w > 0.35;
  };
  const index = source.index,
    indices: number[] = [];
  geo.clearGroups();
  for (const group of source.groups.length
    ? source.groups
    : [{ start: 0, count: index?.count ?? skin.count, materialIndex: 0 }]) {
    const start = indices.length;
    for (let i = group.start; i < group.start + group.count; i += 3) {
      const a = index ? index.getX(i) : i,
        b = index ? index.getX(i + 1) : i + 1,
        c = index ? index.getX(i + 2) : i + 2;
      if (!hidden(a) && !hidden(b) && !hidden(c)) indices.push(a, b, c);
    }
    geo.addGroup(start, indices.length - start, group.materialIndex);
  }
  geo.setIndex(indices);
  return geo;
}
