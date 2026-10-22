import * as T from 'three';
/** Layered, tapering 3D tongues with independent sway and rising sparks. No billboard ball. */
export function hearthFire(scene: T.Scene) {
  const group = new T.Group();
  group.position.set(3.43, 0.22, -2.1);
  scene.add(group);
  const geometry = new T.LatheGeometry(
    [
      new T.Vector2(0.055, 0),
      new T.Vector2(0.11, 0.13),
      new T.Vector2(0.075, 0.27),
      new T.Vector2(0.035, 0.44),
      new T.Vector2(0, 0.62),
    ],
    10,
  );
  const materials: T.ShaderMaterial[] = [];
  for (let i = 0; i < 7; i++) {
    const material = new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: T.DoubleSide,
      blending: T.NormalBlending,
      uniforms: { time: { value: 0 }, phase: { value: i * 1.79 } },
      vertexShader: `uniform float time;uniform float phase;varying float h;void main(){vec3 p=position;h=p.y/.62;float sway=sin(time*5.+phase+p.y*8.);p.x+=sway*.065*h*h;p.z+=cos(time*4.+phase+p.y*6.)*.05*h;p.y*=.85+.15*sin(time*7.+phase);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
      fragmentShader: `varying float h;void main(){vec3 col=mix(vec3(1.,.8,.24),vec3(1.,.14,.015),smoothstep(.05,1.,h));float alpha=(1.-smoothstep(.65,1.,h))*.72;gl_FragColor=vec4(col,alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
    });
    materials.push(material);
    const o = new T.Mesh(geometry, material);
    o.position.set(((i % 2) - 0.5) * 0.07, 0, (i - 3) * 0.095);
    o.scale.setScalar(0.7 + (i % 3) * 0.15);
    group.add(o);
  }
  const sparkGeometry = new T.SphereGeometry(0.009, 5, 4),
    sparkMaterial = new T.MeshBasicMaterial({ color: '#ffb24a' });
  const sparks = Array.from({ length: 5 }, () => {
    const s = new T.Mesh(sparkGeometry, sparkMaterial);
    group.add(s);
    return s;
  });
  const update = (time: number) => {
    materials.forEach((m) => (m.uniforms.time.value = time));
    sparks.forEach((s, i) => {
      const t = (time * 0.45 + i * 0.173) % 1;
      s.position.set(
        Math.sin(time * 2 + i) * 0.065,
        0.12 + t * 0.65,
        Math.cos(i * 3 + time) * 0.22,
      );
      s.scale.setScalar(1 - t);
    });
  };
  update(0);
  return {
    group,
    update,
    dispose() {
      scene.remove(group);
      geometry.dispose();
      sparkGeometry.dispose();
      sparkMaterial.dispose();
      materials.forEach((m) => m.dispose());
    },
  };
}
