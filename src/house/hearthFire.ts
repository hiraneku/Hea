import * as T from 'three';
/** Curved, turbulent low flames over visible charred logs; light remains a separate real point light. */
export function hearthFire(scene: T.Scene) {
  const group = new T.Group();
  group.position.set(3.43, 0.22, -2.1);
  scene.add(group);
  const geometry = new T.LatheGeometry(
    [
      new T.Vector2(0.018, 0),
      new T.Vector2(0.105, 0.055),
      new T.Vector2(0.145, 0.14),
      new T.Vector2(0.126, 0.24),
      new T.Vector2(0.092, 0.35),
      new T.Vector2(0.052, 0.47),
      new T.Vector2(0.025, 0.56),
      new T.Vector2(0, 0.66),
    ],
    24,
  );
  const materials: T.ShaderMaterial[] = [];
  for (let i = 0; i < 5; i++) {
    const material = new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: T.DoubleSide,
      blending: T.NormalBlending,
      uniforms: { time: { value: 0 }, phase: { value: i * 1.79 } },
      vertexShader: `uniform float time;uniform float phase;varying float h;varying float radius;varying vec3 localP;void main(){vec3 p=position;h=clamp(p.y/.66,0.,1.);float sway=sin(time*4.2+phase+p.y*5.2);p.x+=sway*.055*h*h;p.z+=cos(time*3.6+phase+p.y*4.1)*.038*h;p.y*=.96+.04*sin(time*6.+phase);radius=length(position.xz);localP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
      fragmentShader: `uniform float time;uniform float phase;varying float h;varying float radius;varying vec3 localP;float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}void main(){float edge=1.-smoothstep(.115,.165,radius);float turbulence=hash(floor(vec3(localP.x*28.,localP.y*22.-time*2.4+phase,localP.z*28.)));float flicker=.90+.10*sin(time*12.+phase+localP.y*15.);float alpha=edge*(.60+.16*turbulence)*flicker*(1.-smoothstep(.79,1.,h));vec3 ember=vec3(1.,.13,.012);vec3 amber=vec3(1.,.43,.035);vec3 core=vec3(1.,.84,.27);vec3 col=mix(core,amber,smoothstep(.03,.48,h));col=mix(col,ember,smoothstep(.50,.98,h));col*=.93+.07*turbulence;gl_FragColor=vec4(col,alpha);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`,
    });
    materials.push(material);
    const o = new T.Mesh(geometry, material);
    o.position.set(((i % 2) - 0.5) * 0.1, 0, (i - 2) * 0.12);
    o.scale.set(0.78 + (i % 3) * 0.12, 0.78 + (i % 2) * 0.12, 0.78 + (i % 3) * 0.12);
    group.add(o);
  }
  const sparkGeometry = new T.SphereGeometry(0.007, 5, 4),
    sparkMaterial = new T.MeshBasicMaterial({ color: '#ffb24a' });
  const sparks = Array.from({ length: 4 }, () => {
    const s = new T.Mesh(sparkGeometry, sparkMaterial);
    group.add(s);
    return s;
  });
  const update = (time: number) => {
    materials.forEach((m) => (m.uniforms.time.value = time));
    sparks.forEach((s, i) => {
      const t = (time * 0.34 + i * 0.271) % 1;
      s.position.set(
        Math.sin(time * 1.7 + i) * 0.095,
        0.12 + t * 0.54,
        Math.cos(i * 3 + time) * 0.2,
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
