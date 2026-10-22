import * as T from 'three';
/** Sparse sunlit dust, not a fog/postprocessing pass over the whole phone screen. */
export function windowAtmosphere(scene: T.Scene) {
  const origin = new T.Vector3(0, 4.35, -4.12),
    end = new T.Vector3(-0.5, 0.15, -0.85);
  const positions = new Float32Array(48 * 3),
    geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.BufferAttribute(positions, 3));
  const material = new T.PointsMaterial({
    color: '#fff0bf',
    size: 0.014,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  });
  const points = new T.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);
  // A very faint, widening plane catches the high window's daylight in the air.
  const shaftMaterial = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: T.DoubleSide,
    uniforms: { time: { value: 0 } },
    vertexShader: `varying vec2 uvv;void main(){uvv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 uvv;void main(){float width=mix(.43,.17,uvv.y);float edge=abs(uvv.x-.5)*2.;float soft=1.-smoothstep(width,width+.22,edge);float endFade=smoothstep(0.,.16,uvv.y)*(1.-smoothstep(.82,1.,uvv.y));float haze=.91+.09*sin(uvv.y*33.+sin(uvv.x*18.));gl_FragColor=vec4(vec3(.96,.91,.81),soft*endFade*haze*.12);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
  });
  const shaft = new T.Mesh(new T.PlaneGeometry(1, 1), shaftMaterial);
  const direction = end.clone().sub(origin);
  shaft.position.copy(origin).add(end).multiplyScalar(0.5);
  shaft.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), direction.clone().normalize());
  shaft.scale.set(1.45, direction.length(), 1);
  shaft.renderOrder = 2;
  scene.add(shaft);
  const washMaterial = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader: `varying vec2 uvv;void main(){uvv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 uvv;void main(){float d=length((uvv-.5)*2.);float glow=1.-smoothstep(.04,1.,d);float edge=1.-smoothstep(.74,.99,d);gl_FragColor=vec4(vec3(.98,.91,.76),glow*edge*.085);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
  });
  const floorWash = new T.Mesh(new T.PlaneGeometry(1, 1), washMaterial);
  floorWash.rotation.x = -Math.PI / 2;
  floorWash.position.set(-1.72, 0.008, -1.75);
  floorWash.scale.set(1.75, 2.9, 1);
  floorWash.renderOrder = 1;
  scene.add(floorWash);
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
      shaft.geometry.dispose();
      shaftMaterial.dispose();
      scene.remove(shaft, floorWash);
      floorWash.geometry.dispose();
      washMaterial.dispose();
    },
  };
}
