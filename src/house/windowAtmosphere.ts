import * as T from 'three';
/** Sparse sunlit dust, not a fog/postprocessing pass over the whole phone screen. */
export function windowAtmosphere(scene: T.Scene) {
  const origin = new T.Vector3(1.2, 4.2, -4.12),
    end = new T.Vector3(0.2, 0.15, -0.85);
  const positions = new Float32Array(48 * 3),
    geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.BufferAttribute(positions, 3));
  const material = new T.PointsMaterial({
    color: '#fff0bf',
    size: 0.014,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const points = new T.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);
  const update = (time: number) => {
    for (let i = 0; i < 48; i++) {
      const t = (i * 0.61803398875 + time * 0.009) % 1,
        r = 0.24 + t * 0.35,
        a = i * 2.399 + time * 0.035;
      positions[i * 3] = T.MathUtils.lerp(origin.x, end.x, t) + Math.cos(a) * r;
      positions[i * 3 + 1] = T.MathUtils.lerp(origin.y, end.y, t) + Math.sin(i * 9.1) * 0.08;
      positions[i * 3 + 2] = T.MathUtils.lerp(origin.z, end.z, t) + Math.sin(a) * r;
    }
    geometry.attributes.position.needsUpdate = true;
  };
  update(0);
  return {
    update,
    dispose() {
      scene.remove(points);
      geometry.dispose();
      material.dispose();
    },
  };
}
