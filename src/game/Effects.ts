import * as THREE from 'three';
import { seededRandom } from './math';

const UP = new THREE.Vector3(0, 1, 0);
const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const dummy = new THREE.Object3D();

export function sigilTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const c = canvas.getContext('2d')!;
  c.translate(256, 256);
  c.strokeStyle = '#fff';
  c.fillStyle = '#fff';
  const circle = (r: number, width: number) => {
    c.lineWidth = width;
    c.beginPath();
    c.arc(0, 0, r, 0, Math.PI * 2);
    c.stroke();
  };
  circle(238, 2);
  circle(230, 4);
  circle(199, 2);
  circle(188, 2);
  circle(136, 2);
  circle(129, 3);
  for (let i = 0; i < 60; i++) {
    c.save();
    c.rotate((i * Math.PI) / 30);
    c.lineWidth = i % 5 === 0 ? 3 : 1.2;
    c.beginPath();
    c.moveTo(0, 231);
    c.lineTo(0, i % 5 === 0 ? 246 : 237);
    c.stroke();
    c.restore();
  }
  for (let j = 0; j < 2; j++) {
    c.save();
    c.rotate((j * Math.PI) / 3);
    c.lineWidth = 2;
    c.beginPath();
    for (let i = 0; i <= 3; i++) {
      const a = (i * Math.PI * 2) / 3 - Math.PI / 2;
      c.lineTo(Math.cos(a) * 187, Math.sin(a) * 187);
    }
    c.stroke();
    c.restore();
  }
  const random = seededRandom(123);
  for (let i = 0; i < 24; i++) {
    c.save();
    c.rotate((i * Math.PI) / 12);
    c.translate(0, -212);
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-5, 7);
    c.lineTo(0, -7);
    c.lineTo(5, 7);
    c.moveTo(-6, random() * 8 - 4);
    c.lineTo(6, random() * 8 - 4);
    c.stroke();
    if (i % 3 === 0) {
      c.beginPath();
      c.arc(0, -11, 2, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
  for (let i = 0; i < 6; i++) {
    c.save();
    c.rotate((i * Math.PI) / 3);
    c.translate(0, -151);
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, -14);
    c.lineTo(9, 0);
    c.lineTo(0, 14);
    c.lineTo(-9, 0);
    c.closePath();
    c.stroke();
    c.restore();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function makeSigil(
  texture: THREE.Texture,
  radius: number,
  color: THREE.ColorRepresentation,
): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    color: new THREE.Color(color).multiplyScalar(2),
    side: THREE.DoubleSide,
    transparent: true,
    blending: THREE.NormalBlending,
    depthWrite: false,
  });
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), material);
  const inner = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.35, radius * 0.36, 48),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(3),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  inner.position.z = 0.01;
  group.add(outer, inner);
  return group;
}

export function makeHexField(radius = 0.25, layers = 2): THREE.Group {
  const vertices: number[] = [],
    faces: number[] = [];
  for (let q = -layers; q <= layers; q++) {
    for (let r = Math.max(-layers, -q - layers); r <= Math.min(layers, -q + layers); r++) {
      const x = radius * Math.sqrt(3) * (q + r / 2),
        y = radius * 1.5 * r;
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + Math.PI / 6,
          b = a + Math.PI / 3;
        const ax = x + Math.cos(a) * radius * 0.88,
          ay = y + Math.sin(a) * radius * 0.88;
        const bx = x + Math.cos(b) * radius * 0.88,
          by = y + Math.sin(b) * radius * 0.88;
        vertices.push(ax, ay, 0, bx, by, 0);
        faces.push(x, y, -0.008, ax, ay, -0.008, bx, by, -0.008);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  const fill = new THREE.BufferGeometry();
  fill.setAttribute('position', new THREE.Float32BufferAttribute(faces, 3));
  const group = new THREE.Group();
  group.add(
    new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({
        color: new THREE.Color('#3ee0fa').multiplyScalar(2.4),
        transparent: true,
        opacity: 0.9,
        blending: THREE.NormalBlending,
        depthWrite: false,
      }),
    ),
  );
  group.add(
    new THREE.Mesh(
      fill,
      new THREE.MeshBasicMaterial({
        color: '#7ce8ed',
        transparent: true,
        opacity: 0.075,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    ),
  );
  return group;
}

/** Camera-facing tapered ribbon: a real mesh, not a screen-space line. */
export class Ribbon {
  mesh: THREE.Mesh;
  private points: THREE.Vector3[];
  private positions: Float32Array;
  private geometry: THREE.BufferGeometry;
  private count = 0;
  constructor(
    private length = 52,
    private width = 0.075,
    color: THREE.ColorRepresentation = '#f3fcff',
  ) {
    this.points = Array.from({ length }, () => new THREE.Vector3());
    this.positions = new Float32Array(length * 6);
    const alpha = new Float32Array(length * 2),
      indices: number[] = [];
    for (let i = 0; i < length; i++) {
      alpha[i * 2] = alpha[i * 2 + 1] = Math.pow(1 - i / length, 0.6);
      if (i < length - 1)
        indices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage),
    );
    this.geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    this.geometry.setIndex(indices);
    const material = new THREE.ShaderMaterial({
      uniforms: { tint: { value: new THREE.Color(color).multiplyScalar(1.8) } },
      vertexShader:
        'attribute float aAlpha; varying float vAlpha; void main() { vAlpha = aAlpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader:
        'uniform vec3 tint; varying float vAlpha; void main() { gl_FragColor = vec4(tint, vAlpha * 0.85); }',
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.frustumCulled = false;
    this.geometry.setDrawRange(0, 0);
  }
  reset(point: THREE.Vector3) {
    this.points.forEach((p) => p.copy(point));
    this.count = 0;
    this.geometry.setDrawRange(0, 0);
  }
  push(point: THREE.Vector3, camera: THREE.Vector3) {
    for (let i = this.length - 1; i > 0; i--) this.points[i].copy(this.points[i - 1]);
    this.points[0].copy(point);
    this.count = Math.min(this.count + 1, this.length);
    for (let i = 0; i < this.length; i++) {
      const p = this.points[i];
      const next = this.points[Math.min(i + 1, this.length - 1)];
      const prev = this.points[Math.max(0, i - 1)];
      v1.subVectors(prev, next).normalize();
      v2.subVectors(camera, p).normalize();
      v1.cross(v2)
        .normalize()
        .multiplyScalar(this.width * (1 - i / this.length));
      const offset = i * 6;
      this.positions[offset] = p.x + v1.x;
      this.positions[offset + 1] = p.y + v1.y;
      this.positions[offset + 2] = p.z + v1.z;
      this.positions[offset + 3] = p.x - v1.x;
      this.positions[offset + 4] = p.y - v1.y;
      this.positions[offset + 5] = p.z - v1.z;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.setDrawRange(0, Math.max(0, this.count - 1) * 6);
  }
  dispose() {
    this.mesh.removeFromParent();
    this.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

interface Particle {
  p: THREE.Vector3;
  v: THREE.Vector3;
  color: THREE.Color;
  life: number;
  max: number;
  size: number;
  gravity: number;
}
interface Debris {
  p: THREE.Vector3;
  v: THREE.Vector3;
  r: THREE.Vector3;
  life: number;
  max: number;
  size: number;
}
interface TimedEffect {
  object: THREE.Object3D;
  life: number;
  max: number;
  grow: number;
  baseScale: number;
  spin: number;
}

export class Effects {
  readonly sigilMap = sigilTexture();
  private sparks: Particle[] = [];
  private rocks: Debris[] = [];
  private timed: TimedEffect[] = [];
  private sparkMesh: THREE.Points;
  private rockMesh: THREE.InstancedMesh;
  private position: Float32Array;
  private color: Float32Array;
  private size: Float32Array;
  private alpha: Float32Array;
  private cursor = 0;
  private rockCursor = 0;
  private capacity = 440;
  private particleBudget = 440;
  private rockCapacity = 150;
  private groundAt = (_x: number, _z: number) => 0;
  private dustMesh: THREE.Points;
  private dustClouds = Array.from({ length: 64 }, () => ({
    p: new THREE.Vector3(),
    v: new THREE.Vector3(),
    life: 0,
    max: 1,
    size: 1,
  }));
  private dustCursor = 0;
  private dustPositions = new Float32Array(64 * 3);
  private dustSizes = new Float32Array(64);
  private dustAlphas = new Float32Array(64);
  constructor(private scene: THREE.Scene) {
    this.position = new Float32Array(this.capacity * 3);
    this.color = new Float32Array(this.capacity * 3);
    this.size = new Float32Array(this.capacity);
    this.alpha = new Float32Array(this.capacity);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.position, 3).setUsage(THREE.DynamicDrawUsage),
    );
    geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(this.color, 3).setUsage(THREE.DynamicDrawUsage),
    );
    geometry.setAttribute(
      'aSize',
      new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage),
    );
    geometry.setAttribute(
      'aAlpha',
      new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage),
    );
    const material = new THREE.ShaderMaterial({
      uniforms: { screenScale: { value: 500 } },
      vertexShader: `attribute vec3 color; attribute float aSize; attribute float aAlpha; uniform float screenScale; varying vec3 vColor; varying float vAlpha;
      void main() { vColor = color; vAlpha = aAlpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = clamp(aSize * screenScale / max(0.5, -mv.z), 0.0, 90.0); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying vec3 vColor; varying float vAlpha; void main() { float d = length(gl_PointCoord - 0.5) * 2.0; if (d > 1.0) discard; float glow = pow(1.0 - d, 2.4); gl_FragColor = vec4(vColor * 2.4, glow * vAlpha); }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.sparkMesh = new THREE.Points(geometry, material);
    this.sparkMesh.frustumCulled = false;
    scene.add(this.sparkMesh);
    const smoke = new THREE.BufferGeometry();
    smoke.setAttribute(
      'position',
      new THREE.BufferAttribute(this.dustPositions, 3).setUsage(THREE.DynamicDrawUsage),
    );
    smoke.setAttribute(
      'aSize',
      new THREE.BufferAttribute(this.dustSizes, 1).setUsage(THREE.DynamicDrawUsage),
    );
    smoke.setAttribute(
      'aAlpha',
      new THREE.BufferAttribute(this.dustAlphas, 1).setUsage(THREE.DynamicDrawUsage),
    );
    this.dustMesh = new THREE.Points(
      smoke,
      new THREE.ShaderMaterial({
        uniforms: { screenScale: { value: 500 } },
        vertexShader:
          'attribute float aSize; attribute float aAlpha; uniform float screenScale; varying float vAlpha; void main(){vAlpha=aAlpha;vec4 p=modelViewMatrix*vec4(position,1.0);gl_PointSize=clamp(aSize*screenScale/max(0.5,-p.z),0.0,220.0);gl_Position=projectionMatrix*p;}',
        fragmentShader:
          'varying float vAlpha; void main(){float d=length(gl_PointCoord-0.5)*2.0;if(d>1.0)discard;gl_FragColor=vec4(vec3(0.44,0.45,0.46),pow(1.0-d,1.3)*vAlpha);}',
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
      }),
    );
    this.dustMesh.frustumCulled = false;
    scene.add(this.dustMesh);
    this.rockMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: '#67696a', roughness: 1 }),
      this.rockCapacity,
    );
    this.rockMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.rockMesh.frustumCulled = false;
    scene.add(this.rockMesh);
    for (let i = 0; i < this.capacity; i++)
      this.sparks.push({
        p: new THREE.Vector3(0, -1000, 0),
        v: new THREE.Vector3(),
        color: new THREE.Color(),
        life: 0,
        max: 1,
        size: 0,
        gravity: 0,
      });
    for (let i = 0; i < this.rockCapacity; i++) {
      this.rocks.push({
        p: new THREE.Vector3(),
        v: new THREE.Vector3(),
        r: new THREE.Vector3(),
        life: 0,
        max: 1,
        size: 0,
      });
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      this.rockMesh.setMatrixAt(i, dummy.matrix);
    }
  }
  setGroundSampler(sampler: (x: number, z: number) => number) {
    this.groundAt = sampler;
  }
  dust(at: THREE.Vector3, count = 12, radius = 1.5, force?: THREE.Vector3) {
    for (let i = 0; i < count; i++) {
      const p = this.dustClouds[this.dustCursor++ % this.dustClouds.length];
      p.p
        .copy(at)
        .add(
          new THREE.Vector3(
            (Math.random() - 0.5) * radius,
            Math.random() * 0.4,
            (Math.random() - 0.5) * radius,
          ),
        );
      p.v.set((Math.random() - 0.5) * 2, 0.5 + Math.random() * 1.3, (Math.random() - 0.5) * 2);
      if (force) p.v.addScaledVector(force, 0.045);
      p.size = radius * (0.6 + Math.random());
      p.life = p.max = 1.1 + Math.random();
    }
  }
  block(at: THREE.Vector3, incoming: THREE.Vector3) {
    const patch = makeHexField(0.27, 2);
    patch.position.copy(at);
    patch.lookAt(at.clone().sub(incoming.clone().normalize()));
    this.add(patch, 0.38, 0.1);
    this.burst(at, '#7af1ff', 18, 3, 0.28, 0.5);
  }
  quality(low: boolean) {
    this.particleBudget = low ? 180 : this.capacity;
  }
  resize(height: number, pixelRatio: number) {
    (this.dustMesh.material as THREE.ShaderMaterial).uniforms.screenScale.value =
      height * pixelRatio * 0.75;
    (this.sparkMesh.material as THREE.ShaderMaterial).uniforms.screenScale.value =
      height * pixelRatio * 0.75;
  }
  burst(
    at: THREE.Vector3,
    tint: THREE.ColorRepresentation,
    count = 24,
    force = 5,
    size = 0.35,
    gravity = 5,
  ) {
    const color = new THREE.Color(tint);
    const n = this.particleBudget < this.capacity ? Math.ceil(count * 0.55) : count;
    for (let i = 0; i < n; i++) {
      const p = this.sparks[this.cursor++ % this.particleBudget];
      p.p.copy(at);
      p.v
        .set(Math.random() - 0.5, Math.random() - 0.25, Math.random() - 0.5)
        .normalize()
        .multiplyScalar(force * (0.2 + Math.random() * 0.8));
      p.color.copy(color);
      p.life = p.max = 0.3 + Math.random() * 0.65;
      p.size = size * (0.4 + Math.random());
      p.gravity = gravity;
    }
  }
  debris(at: THREE.Vector3, count = 10, force = 4, scale = 1, direction?: THREE.Vector3) {
    for (let i = 0; i < count; i++) {
      const d = this.rocks[this.rockCursor++ % this.rockCapacity];
      d.p.copy(at);
      d.p.y = Math.max(this.groundAt(at.x, at.z) + 0.1, d.p.y);
      d.v.set(
        (Math.random() - 0.5) * force * 1.6,
        1.5 + Math.random() * force,
        (Math.random() - 0.5) * force * 1.6,
      );
      if (direction) d.v.addScaledVector(direction, 0.12);
      d.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      d.life = d.max = 1.0 + Math.random() * 1.5;
      d.size = (0.08 + Math.random() * 0.2) * scale;
    }
  }
  add(object: THREE.Object3D, life: number, grow = 0, spin = 0) {
    if (this.timed.length > 45) this.removeEffect(this.timed.shift()!);
    this.scene.add(object);
    object.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments)
        o.userData.baseOpacity = (o.material as THREE.Material).opacity;
    });
    this.timed.push({ object, life, max: life, grow, baseScale: object.scale.x, spin });
  }
  glyph(
    at: THREE.Vector3,
    direction: THREE.Vector3,
    color: THREE.ColorRepresentation,
    radius = 0.7,
    life = 0.35,
  ) {
    const glyph = makeSigil(this.sigilMap, radius, color);
    glyph.position.copy(at);
    glyph.lookAt(v1.copy(at).add(direction));
    this.add(glyph, life, 0.5, 0.7);
  }
  hex(at: THREE.Vector3, camera: THREE.Vector3, radius = 0.32, life = 0.6) {
    const hex = makeHexField(radius);
    hex.position.copy(at);
    hex.lookAt(camera);
    this.add(hex, life, 0.2, 0);
  }
  beam(
    start: THREE.Vector3,
    end: THREE.Vector3,
    color: THREE.ColorRepresentation = '#7bedff',
    width = 0.045,
    life = 0.23,
  ) {
    const direction = v1.subVectors(end, start);
    const length = direction.length();
    if (length < 0.01) return;
    const group = new THREE.Group();
    const geometry = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
    const beam = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(3),
        blending: THREE.NormalBlending,
        transparent: true,
        depthWrite: false,
      }),
    );
    beam.scale.set(width, length, width);
    const core = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    core.scale.set(width * 0.28, length, width * 0.28);
    group.add(beam, core);
    group.position.copy(start).lerp(end, 0.5);
    group.quaternion.setFromUnitVectors(UP, direction.normalize());
    this.add(group, life);
  }
  shock(at: THREE.Vector3, color: THREE.ColorRepresentation, radius = 6) {
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(0.96, 1, 64),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(2),
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    mesh.position.copy(at);
    mesh.position.y = Math.max(at.y, 0.04);
    mesh.rotation.x = -Math.PI / 2;
    mesh.scale.setScalar(0.2);
    this.add(mesh, 0.6, radius / 0.6);
  }
  impact(at: THREE.Vector3, color: THREE.ColorRepresentation, large = false) {
    this.burst(at, color, large ? 70 : 28, large ? 9 : 4, large ? 0.65 : 0.35);
    this.debris(at, large ? 20 : 7, large ? 6 : 3);
    if (large) {
      this.shock(at, color, 7);
      this.burst(at, '#ffffff', 18, 5, 0.5, 1);
    }
  }
  update(dt: number) {
    this.dustClouds.forEach((p, i) => {
      p.life = Math.max(0, p.life - dt);
      p.p.addScaledVector(p.v, dt);
      p.v.multiplyScalar(Math.exp(-dt));
      this.dustPositions.set(p.p.toArray(), i * 3);
      this.dustSizes[i] = p.life > 0 ? p.size * (1 + (1 - p.life / p.max) * 1.3) : 0;
      this.dustAlphas[i] = Math.min(0.5, (p.life / p.max) * 0.65);
    });
    Object.values(this.dustMesh.geometry.attributes).forEach((a) => {
      a.needsUpdate = true;
    });
    for (let i = 0; i < this.capacity; i++) {
      const p = this.sparks[i];
      p.life = Math.max(0, p.life - dt);
      if (p.life > 0) {
        p.v.y -= p.gravity * dt;
        p.p.addScaledVector(p.v, dt);
        p.v.multiplyScalar(Math.exp(-dt * 1.7));
        this.position[i * 3] = p.p.x;
        this.position[i * 3 + 1] = p.p.y;
        this.position[i * 3 + 2] = p.p.z;
        this.color[i * 3] = p.color.r;
        this.color[i * 3 + 1] = p.color.g;
        this.color[i * 3 + 2] = p.color.b;
        this.size[i] = p.size;
        this.alpha[i] = Math.min(1, p.life * 5);
      } else {
        this.size[i] = 0;
        this.alpha[i] = 0;
      }
    }
    for (const attribute of Object.values(this.sparkMesh.geometry.attributes))
      attribute.needsUpdate = true;
    for (let i = 0; i < this.rockCapacity; i++) {
      const d = this.rocks[i];
      d.life = Math.max(0, d.life - dt);
      if (d.life > 0) {
        d.v.y -= 15 * dt;
        d.p.addScaledVector(d.v, dt);
        const ground = this.groundAt(d.p.x, d.p.z) + d.size * 0.5;
        if (d.p.y < ground) {
          d.p.y = ground;
          d.v.y *= -0.3;
          d.v.x *= 0.88;
          d.v.z *= 0.88;
        }
        d.r.x += dt * 4;
        d.r.y += dt * 2;
        dummy.position.copy(d.p);
        dummy.rotation.set(d.r.x, d.r.y, d.r.z);
        dummy.scale.setScalar(d.size * Math.min(1, d.life * 3));
      } else dummy.scale.setScalar(0);
      dummy.updateMatrix();
      this.rockMesh.setMatrixAt(i, dummy.matrix);
    }
    this.rockMesh.instanceMatrix.needsUpdate = true;
    for (let i = this.timed.length - 1; i >= 0; i--) {
      const e = this.timed[i];
      e.life -= dt;
      if (e.life <= 0) {
        this.removeEffect(e);
        this.timed.splice(i, 1);
        continue;
      }
      const progress = 1 - e.life / e.max;
      e.object.scale.setScalar(e.baseScale + progress * e.grow * e.max);
      e.object.rotation.z += e.spin * dt;
      e.object.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
          const material = o.material as THREE.Material & { opacity: number };
          material.opacity = (o.userData.baseOpacity ?? 1) * Math.min(1, (e.life / e.max) * 1.6);
        }
      });
    }
  }
  clear() {
    this.dustClouds.forEach((p) => {
      p.life = 0;
    });
    this.sparks.forEach((p) => {
      p.life = 0;
    });
    this.rocks.forEach((d) => {
      d.life = 0;
    });
    this.timed.forEach((e) => this.removeEffect(e));
    this.timed = [];
  }
  private removeEffect(e: TimedEffect) {
    e.object.removeFromParent();
    const geometries = new Set<THREE.BufferGeometry>();
    e.object.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
        geometries.add(o.geometry);
        const materials = Array.isArray(o.material) ? o.material : [o.material];
        materials.forEach((m) => m.dispose());
      }
    });
    geometries.forEach((g) => g.dispose());
  }
}
