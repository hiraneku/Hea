import * as THREE from 'three';
import { seededRandom } from './math';
import {
  HEX_DEPTH,
  HEX_NEIGHBORS,
  HEX_RADIUS,
  cellPoint,
  crackGeometry,
  type ShieldReveal,
  hexPrismGeometry,
  makeShieldPatch,
  nearestCell,
  shieldPattern,
  type HexCell,
} from './ShieldVisual';
import { FurrowTrail } from './Furrows';
import { ScorchMarks } from './Scorches';
import { projectileNose, type ProjectileKind } from './combat';

/**
 * One step of the adaptive particle density for a measured frame rate: down fast
 * (−0.15 per sample) below 30 fps, half density in the 30–42 band, back up slowly
 * (+0.05 per sample) above that. Never below 0.3 so impacts always read.
 */
export function adaptDensity(current: number, fps: number): number {
  const target = fps < 30 ? 0.3 : fps < 42 ? 0.6 : 1;
  if (target < current) return Math.max(target, current - 0.15);
  return Math.min(target, current + 0.05);
}

const UP = new THREE.Vector3(0, 1, 0);
const PLANE_FORWARD = new THREE.Vector3(0, 0, 1);
const v1 = new THREE.Vector3();
const shaftX = new THREE.Vector3(),
  shaftY = new THREE.Vector3(),
  shaftZ = new THREE.Vector3(),
  shaftEye = new THREE.Vector3(),
  shaftBasis = new THREE.Matrix4();
/**
 * Lean a bar of light towards the eye while its length stays on the beam. The mesh lives in
 * the beam group's own frame — where the beam runs up its local +y and the eye is at `eye`
 * pulled into that frame — so no parent world matrix is involved and the first frame is right.
 */
function orientShaft(mesh: THREE.Mesh, group: THREE.Group, eye: THREE.Vector3) {
  shaftEye.copy(eye).sub(group.position).applyQuaternion(group.quaternion.clone().invert());
  const local = mesh.position;
  shaftZ.copy(shaftEye).sub(local);
  if (shaftZ.lengthSq() < 1e-6) return;
  shaftZ.normalize();
  shaftY.set(0, 1, 0);
  shaftX.crossVectors(shaftY, shaftZ);
  if (shaftX.lengthSq() < 1e-6) shaftX.set(1, 0, 0);
  shaftX.normalize();
  shaftY.crossVectors(shaftZ, shaftX).normalize();
  shaftBasis.makeBasis(shaftX, shaftY, shaftZ);
  mesh.quaternion.setFromRotationMatrix(shaftBasis);
}
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

/**
 * A soft round bloom, bright at the middle and falling away to nothing at the rim: the light
 * a beam throws at its muzzle and its hit, drawn as a camera-facing sprite.
 */
export function glowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const c = canvas.getContext('2d')!;
  const wash = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  wash.addColorStop(0, 'rgba(255,255,255,1)');
  wash.addColorStop(0.28, 'rgba(255,255,255,0.55)');
  wash.addColorStop(0.6, 'rgba(255,255,255,0.16)');
  wash.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = wash;
  c.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * The wash a shaft of light casts: bright through the middle of the bar, falling away to
 * nothing at either edge, with the tips eased so the bar does not end in a hard line.
 */
function shaftTexture(): THREE.CanvasTexture {
  const width = 64,
    height = 32,
    canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext('2d')!;
  const image = c.createImageData(width, height);
  for (let y = 0; y < height; y++) {
    const along = 1 - Math.abs(y / (height - 1) - 0.5) * 0.7;
    for (let x = 0; x < width; x++) {
      const across = Math.pow(Math.sin((x / (width - 1)) * Math.PI), 1.6),
        i = (y * width + x) * 4;
      image.data[i] = image.data[i + 1] = image.data[i + 2] = 255;
      image.data[i + 3] = Math.round(255 * Math.min(1, across * along));
    }
  }
  c.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * The scar a lance presses into stone or earth: a small burst of hairline scratches with a
 * faint crust of light around them, drawn dark-to-bright from the middle outwards.
 */
function scarTexture(): THREE.CanvasTexture {
  const size = 64,
    canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const c = canvas.getContext('2d')!,
    middle = size / 2;
  c.clearRect(0, 0, size, size);
  c.lineCap = 'round';
  // Hairline scratches: a fan of long, slightly bent strokes off the centre.
  for (let i = 0; i < 9; i++) {
    const angle = (i / 9) * Math.PI * 2 + Math.random() * 0.5,
      length = middle * (0.55 + Math.random() * 0.42),
      bend = (Math.random() - 0.5) * 0.5,
      alpha = 0.35 + Math.random() * 0.4;
    c.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    c.lineWidth = 0.7 + Math.random() * 0.9;
    c.beginPath();
    c.moveTo(middle, middle);
    c.quadraticCurveTo(
      middle + Math.cos(angle + bend) * length * 0.55,
      middle + Math.sin(angle + bend) * length * 0.55,
      middle + Math.cos(angle) * length,
      middle + Math.sin(angle) * length,
    );
    c.stroke();
  }
  // Two pale rings of crust where the light pooled.
  for (const [radius, alpha, width] of [
    [0.3, 0.3, 1.4],
    [0.58, 0.18, 2.2],
  ] as const) {
    c.strokeStyle = `rgba(210,244,255,${alpha})`;
    c.lineWidth = width;
    c.beginPath();
    c.arc(middle, middle, middle * radius, 0, Math.PI * 2);
    c.stroke();
  }
  // The hot centre, scaled back so the mark does not read as a light source.
  const core = c.createRadialGradient(middle, middle, 0, middle, middle, middle * 0.42);
  core.addColorStop(0, 'rgba(235,252,255,0.5)');
  core.addColorStop(0.45, 'rgba(120,215,255,0.3)');
  core.addColorStop(1, 'rgba(90,190,255,0)');
  c.fillStyle = core;
  c.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * The Prisma circle: a glass-like ring built from triangles — a hexagram of two thin
 * triangles, a bolder inner triangle turned against them, a scale of prism ticks on the rim
 * and a small lens at the centre the beam leaves from. Drawn white; the material tints it.
 */
export function prismTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const c = canvas.getContext('2d')!;
  c.translate(256, 256);
  c.strokeStyle = '#fff';
  c.fillStyle = '#fff';
  c.lineJoin = 'miter';
  const ring = (r: number, width: number) => {
    c.lineWidth = width;
    c.beginPath();
    c.arc(0, 0, r, 0, Math.PI * 2);
    c.stroke();
  };
  const triangle = (r: number, turn: number, width: number) => {
    c.lineWidth = width;
    c.beginPath();
    for (let i = 0; i <= 3; i++) {
      const a = (i * Math.PI * 2) / 3 - Math.PI / 2 + turn;
      c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    c.stroke();
  };
  ring(240, 5.6);
  ring(227, 2.2);
  ring(92, 2.6);
  triangle(213, 0, 3.4);
  triangle(213, Math.PI / 3, 3.4);
  triangle(120, Math.PI, 4.6);
  triangle(60, 0, 2.8);
  // Prism ticks around the rim, every fifth one a small filled wedge.
  for (let i = 0; i < 48; i++) {
    c.save();
    c.rotate((i * Math.PI) / 24);
    if (i % 4 === 0) {
      c.beginPath();
      c.moveTo(-5, -244);
      c.lineTo(5, -244);
      c.lineTo(0, -254);
      c.closePath();
      c.fill();
    } else {
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(0, -228);
      c.lineTo(0, -239);
      c.stroke();
    }
    c.restore();
  }
  // Spokes from the lens to the hexagram's points.
  c.lineWidth = 1.9;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 2;
    c.beginPath();
    c.moveTo(Math.cos(a) * 96, Math.sin(a) * 96);
    c.lineTo(Math.cos(a) * 206, Math.sin(a) * 206);
    c.stroke();
  }
  c.beginPath();
  c.arc(0, 0, 9, 0, Math.PI * 2);
  c.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** A small glass splinter for the Prisma shards. */
function splinterGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([0, 0.62, 0, -0.42, -0.38, 0, 0.5, -0.3, 0], 3),
  );
  geometry.computeVertexNormals();
  return geometry;
}
/** The spectrum a prism throws: mostly cyan-white, with magenta and amber splinters among it. */
const PRISM_TINTS = ['#aef7ff', '#ffffff', '#8cedf7', '#f2b8ff', '#fff2b0', '#d9fbff'];

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
    forceSinglePass: true,
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
  push(point: THREE.Vector3, camera: THREE.Vector3, widthScale = 1) {
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
        .multiplyScalar(this.width * widthScale * (1 - i / this.length));
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

/** Seconds a shield patch takes to materialise cell by cell, and to dissolve again. */
export const SHIELD_APPEAR = 0.14;
export const SHIELD_DISSOLVE = 0.16;
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
  /** Optional per-frame driver for effects with their own choreography (shards, remnants). */
  animate?: (e: TimedEffect, progress: number, dt: number) => void;
}
interface Attractor {
  center: THREE.Vector3;
  radius: number;
  strength: number;
  swirl: number;
}
const IMPACT_TINT: Record<ProjectileKind, string> = {
  player: '#ffd9a8',
  fire: '#ffb169',
  missile: '#ffd7a4',
  hammer: '#fff4cf',
  vortex: '#ff9c9c',
};

export class Effects {
  readonly sigilMap = sigilTexture();
  readonly prismMap = prismTexture();
  private readonly glowMap = glowTexture();
  private readonly shaftMap = shaftTexture();
  private readonly scarMap = scarTexture();
  private readonly scarPlane = new THREE.PlaneGeometry(2, 2);
  private readonly paneRing = new THREE.RingGeometry(0.94, 1, 64);
  private readonly reticleRing = new THREE.RingGeometry(0.86, 1, 48);
  /** How many lance scars have been pressed into the world since the arena was last reset. */
  prismScars = 0;
  /** How many curtains have shown themselves where a shot ran into them. */
  prismPanes = 0;
  /** How many threads of light have been left standing along a lance. */
  lightVeins = 0;
  private aimLine: {
    group: THREE.Group;
    core: THREE.Mesh;
    halo: THREE.Mesh;
    tip: THREE.Mesh;
    flare: THREE.Sprite;
  } | null = null;
  /** The eye the camera-facing effects lean towards; set by the game once it has one. */
  eye: THREE.Camera | null = null;
  private readonly splinter = splinterGeometry();
  private readonly tube = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true);
  private prismShatters = 0;
  private sparks: Particle[] = [];
  private rocks: Debris[] = [];
  private timed: TimedEffect[] = [];
  private shieldSerial = 0;
  get shieldEchoes() {
    return this.timed
      .filter((e) => e.object.userData.kind === 'shield-echo')
      .map((e) => ({
        serial: e.object.userData.serial as number,
        pattern: e.object.userData.pattern as string,
        cells: e.object.userData.count as number,
        // The anchored world position (patches never move once raised).
        position: (
          (e.object.userData.base as THREE.Vector3 | undefined) ?? e.object.position
        ).toArray(),
        remaining: e.life,
        hits: (e.object.userData.hits ?? 0) as number,
        shattered: !!e.object.userData.shattered,
      }));
  }
  /** Live particle counts for diagnostics (skid trails, bursts, dust plumes, furrows). */
  get activity() {
    return {
      sparks: this.sparks.filter((p) => p.life > 0).length,
      dust: this.dustClouds.filter((p) => p.life > 0).length,
      skids: this.skidCalls,
      furrow: this.furrows.count,
      furrows: this.furrows.furrows,
      clods: this.clods,
      airRecoveries: this.airRecoveries,
      afterimages: this.afterimages,
      shieldImpacts: this.shieldImpacts,
      shards: this.timed.filter((e) => e.object.userData.kind === 'shield-shards').length,
      prismShards: this.timed.filter((e) => e.object.userData.kind === 'prism-shards').length,
      prismShatters: this.prismShatters,
      prismScars: this.prismScars,
      prismPanes: this.prismPanes,
      lightVeins: this.lightVeins,
      aimLine: this.aimLine?.group.visible ?? false,
      scorches: this.scorches.count,
      density: this.density,
      budget: this.particleBudget,
    };
  }
  private skidCalls = 0;
  private clods = 0;
  private airRecoveries = 0;
  private afterimages = 0;
  private shieldImpacts = 0;
  private time = 0;
  readonly furrows = new FurrowTrail();
  readonly scorches = new ScorchMarks();
  private attractors: Attractor[] = [];
  private readonly shardGeometry = hexPrismGeometry();
  private readonly shardRim = new THREE.RingGeometry(HEX_RADIUS * 0.78, HEX_RADIUS, 6);
  /** Slightly proud hex plate laid over a struck cell while it flashes. */
  private readonly flashGeometry = hexPrismGeometry(HEX_RADIUS * 0.97, HEX_DEPTH * 1.35);
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
  /** Live particle density (0.3–1): the quality setting's ceiling, lowered under frame-rate load. */
  private density = 1;
  private baseDensity = 1;
  private adaptive = 1;
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
      // White base: each instance carries its own colour (grey stone chips, brown earth clods).
      new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1 }),
      this.rockCapacity,
    );
    this.rockMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.rockMesh.frustumCulled = false;
    // Per-instance colour lets the same pool serve grey stone chips and brown earth clods.
    this.rockMesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(this.rockCapacity * 3).fill(1),
      3,
    );
    this.rockMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.rockMesh);
    scene.add(this.furrows.mesh);
    scene.add(this.scorches.mesh);
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
    this.furrows.setGroundSampler(sampler);
    this.scorches.setGroundSampler(sampler);
  }
  /**
   * A gravity well for loose matter: for this frame, sparks, dust and debris inside `radius`
   * fall towards `center` (with a sideways swirl), so a vortex visibly drinks the arena.
   */
  attract(center: THREE.Vector3, radius: number, strength: number, swirl = 0.6) {
    this.attractors.push({ center: center.clone(), radius, strength, swirl });
  }
  /** Embers born on a ring around a well and streaming inwards: the pull made visible. */
  inflow(center: THREE.Vector3, radius: number, count: number, tint = '#ff9a5a') {
    const color = new THREE.Color(tint);
    const n = this.emit(count);
    for (let i = 0; i < n; i++) {
      const p = this.sparks[this.cursor++ % this.particleBudget];
      const direction = new THREE.Vector3(
        Math.random() - 0.5,
        (Math.random() - 0.5) * 0.7,
        Math.random() - 0.5,
      ).normalize();
      p.p.copy(center).addScaledVector(direction, radius * (0.55 + Math.random() * 0.45));
      // Inward with a sideways component, so the stream spirals in rather than falling straight.
      const tangent = new THREE.Vector3(-direction.z, 0, direction.x);
      p.v
        .copy(direction)
        .multiplyScalar(-radius * (0.8 + Math.random() * 0.5))
        .addScaledVector(tangent, radius * (0.35 + Math.random() * 0.35));
      p.color.copy(color);
      p.life = p.max = 0.6 + Math.random() * 0.45;
      p.size = 0.16 + Math.random() * 0.14;
      p.gravity = 0;
    }
  }
  /** The well bursting: a hot flash, a flat hexagonal shockwave and matter flung back out. */
  detonate(at: THREE.Vector3, radius: number) {
    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(1, 20, 14),
      new THREE.MeshBasicMaterial({
        color: '#fff1d6',
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    flash.position.copy(at);
    flash.scale.setScalar(0.6);
    this.add(flash, 0.28, 9 / 0.28);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1, 6),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ff8c4a').multiplyScalar(2.2),
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    ring.position.copy(at);
    ring.rotation.x = -Math.PI / 2;
    ring.scale.setScalar(0.5);
    this.add(ring, 0.55, radius / 0.55, 1.2);
    this.burst(at, '#ffb378', 60, 11, 0.55, 3);
    this.burst(at, '#ffffff', 20, 7, 0.4, 1);
    this.dust(at, 18, 3);
    this.attract(at, radius, -90, 0);
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
  /** The serial the next raised patch will get: lets placement be planned around its layout. */
  get nextShieldSerial() {
    return this.shieldSerial;
  }
  block(at: THREE.Vector3, orientation: THREE.Quaternion, scale = 1, life = 1.5) {
    const serial = this.shieldSerial++,
      patch = makeShieldPatch(serial);
    patch.position.copy(at);
    patch.quaternion.copy(orientation);
    patch.scale.setScalar(scale);
    patch.userData.base = at.clone();
    patch.userData.hits = 0;
    patch.userData.age = 0;
    // This remains in WORLD space. It is a visual afterimage, never a moving player attachment.
    // It materialises cell by cell over the next fifth of a second (see ShieldVisual).
    this.add(patch, life, 0, 0);
    this.burst(at, '#7af1ff', scale > 2 ? 14 : 6, 2.4, 0.2 * Math.sqrt(scale), 0.4);
    return { serial, pattern: shieldPattern(serial), life };
  }
  /** The cells of a dissolving patch each leave a curl of grey vapour and glittering motes. */
  private shieldDissolve(patch: THREE.Object3D) {
    const cells = (patch.userData.cells ?? []) as HexCell[],
      centroid = (patch.userData.centroid ?? [0, 0]) as number[],
      scale = patch.scale.x || 1;
    patch.updateMatrixWorld(true);
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(
      patch.getWorldQuaternion(new THREE.Quaternion()),
    );
    cells.forEach((cell, index) => {
      const point = cellPoint(cell.q, cell.r),
        at = patch.localToWorld(new THREE.Vector3(point.x - centroid[0], point.y - centroid[1], 0));
      const wisp = this.dustClouds[this.dustCursor++ % this.dustClouds.length];
      wisp.p.copy(at).addScaledVector(normal, (Math.random() - 0.5) * 0.1);
      wisp.v
        .set((Math.random() - 0.5) * 0.4, 0.35 + Math.random() * 0.3, (Math.random() - 0.5) * 0.4)
        .addScaledVector(normal, 0.2);
      wisp.size = (0.26 + Math.random() * 0.1) * scale;
      wisp.life = wisp.max = 0.45 + Math.random() * 0.2;
      const motes = index % 2 === 0 ? 2 : 1;
      for (let i = 0; i < motes; i++) {
        const p = this.sparks[this.cursor++ % this.particleBudget];
        p.p.copy(at);
        p.v.set(
          (Math.random() - 0.5) * 0.9,
          0.2 + Math.random() * 0.6,
          (Math.random() - 0.5) * 0.9,
        );
        p.color.set(i ? '#ffffff' : '#bdf6ff');
        p.life = p.max = 0.35 + Math.random() * 0.3;
        p.size = (0.035 + Math.random() * 0.03) * scale;
        p.gravity = 1.4;
      }
    });
  }
  private findEcho(serial: number) {
    return this.timed.find(
      (e) => e.object.userData.kind === 'shield-echo' && e.object.userData.serial === serial,
    );
  }
  /**
   * A shot connecting with a standing patch. The projectile is not simply deleted: its body is
   * crushed flat against the surface and fades, the struck hex cell flashes white-hot (its
   * neighbours a little), the patch's fade restarts, and from the second hit on a glass
   * spiderweb of cracks spreads from the strike while the hex pieces glow brighter — so a
   * patch under sustained fire visibly carries that load right up to the hit that breaks it.
   * Deliberately no pulsing, no expanding ring and no recoil: the plate is anchored and
   * rigid; only its surface reacts.
   */
  shieldImpact(
    serial: number,
    at: THREE.Vector3,
    normal: THREE.Vector3,
    kind: ProjectileKind,
    scale = 1,
    hits = 1,
    remnant?: THREE.Object3D,
  ): boolean {
    this.shieldImpacts++;
    const tint = IMPACT_TINT[kind],
      size = Math.sqrt(scale) * (kind === 'hammer' ? 1.5 : 1);
    if (remnant) this.crush(remnant, normal, kind, size);
    const echo = this.findEcho(serial);
    const frame = echo
      ? echo.object.getWorldQuaternion(new THREE.Quaternion())
      : new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    if (echo) this.cellFlash(echo.object, at, tint, kind);
    else this.looseFlash(at, frame, tint, size);
    const ex = new THREE.Vector3(1, 0, 0).applyQuaternion(frame),
      ey = new THREE.Vector3(0, 1, 0).applyQuaternion(frame);
    const n = this.emit(kind === 'hammer' ? 26 : 14);
    for (let i = 0; i < n; i++) {
      const p = this.sparks[this.cursor++ % this.particleBudget],
        angle = Math.random() * Math.PI * 2,
        speed = (2.5 + Math.random() * 5) * size;
      p.p.copy(at).addScaledVector(normal, 0.03);
      p.v
        .copy(ex)
        .multiplyScalar(Math.cos(angle) * speed)
        .addScaledVector(ey, Math.sin(angle) * speed)
        .addScaledVector(normal, 0.4 + Math.random() * 0.8);
      p.color.set(i % 3 ? tint : '#ffffff');
      p.life = p.max = 0.22 + Math.random() * 0.3;
      p.size = (0.1 + Math.random() * 0.1) * size;
      p.gravity = 2.5;
    }
    // A few slow licks crawl across the surface and rise: fire clinging to glass.
    for (let i = 0; i < 4; i++) {
      const p = this.sparks[this.cursor++ % this.particleBudget],
        angle = Math.random() * Math.PI * 2;
      p.p.copy(at).addScaledVector(normal, 0.04);
      p.v
        .copy(ex)
        .multiplyScalar(Math.cos(angle) * 1.4 * size)
        .addScaledVector(ey, Math.sin(angle) * 1.4 * size);
      p.color.set(tint);
      p.life = p.max = 0.45 + Math.random() * 0.3;
      p.size = 0.22 * size;
      p.gravity = -1.2;
    }
    if (!echo) return false;
    echo.life = echo.max;
    const data = echo.object.userData;
    data.hits = hits;
    if (hits >= 2) {
      // Cracks live in patch-local space, clipped to the patch's own cells.
      const local = echo.object.worldToLocal(at.clone());
      const cracks = new THREE.Mesh(
        crackGeometry(
          local.x,
          local.y,
          0.3 + hits * 0.09,
          serial * 31 + hits,
          (data.cells ?? []) as HexCell[],
          (data.centroid ?? [0, 0]) as number[],
        ),
        new THREE.MeshBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: Math.min(1, 0.45 + hits * 0.12),
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          toneMapped: false,
        }),
      );
      cracks.userData.baseOpacity = cracks.material.opacity;
      cracks.userData.crack = true;
      echo.object.add(cracks);
    }
    return true;
  }
  /**
   * A shot met by a curtain of light rather than by a patch: the body itself piles up flat
   * against that plane and fades, and the fire it was carrying goes off in its own colour at
   * the point of contact. Without this the shot would simply be pulled out of the simulation
   * and left hanging in mid-air, whole, where the lance caught it.
   */
  lightBreak(remnant: THREE.Object3D, travel: THREE.Vector3, kind: ProjectileKind, scale = 1) {
    const size = Math.sqrt(scale) * (kind === 'hammer' ? 1.5 : 1),
      // The surface the shot ran into faces back the way it came, so its nose is driven in.
      normal = travel.clone().negate().normalize(),
      at = remnant.position.clone();
    // Slightly longer than a patch's crush: the break is watched at a distance, and on a phone
    // a two-frame splash reads as a shot that simply stopped.
    this.crush(remnant, normal, kind, size, kind === 'hammer' ? 0.34 : 0.24);
    this.impact(at, IMPACT_TINT[kind], kind === 'hammer', size);
  }
  /**
   * The scar a lance presses into whatever stops it: hairline scratches and a faint crust of
   * light on the surface, with a short flash as it lands. Masonry and ground keep the mark for
   * a few seconds after the beam is gone, so a small beam leaves a trace of where it struck.
   */
  prismScar(at: THREE.Vector3, normal: THREE.Vector3, scale = 0.5) {
    this.prismScars++;
    const n = normal.clone().normalize(),
      mesh = new THREE.Mesh(
        this.scarPlane,
        new THREE.MeshBasicMaterial({
          map: this.scarMap,
          // Saturated, not white: the arena's stone is nearly white, and a white mark on it
          // reads as glare rather than as a scar.
          color: new THREE.Color('#5ec8ff').multiplyScalar(1.5),
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
          toneMapped: false,
        }),
      );
    mesh.position.copy(at).addScaledVector(n, 0.04);
    mesh.quaternion.setFromUnitVectors(PLANE_FORWARD, n);
    mesh.rotateZ(Math.random() * Math.PI * 2);
    mesh.scale.setScalar((1.8 + Math.random() * 0.9) * scale);
    mesh.userData.keepGeometry = true;
    this.add(mesh, 3.6 + Math.random() * 1.8);
    const effect = this.timed[this.timed.length - 1];
    effect.animate = (e, progress) => {
      // It bites in over the first frames, then bleaches away with the light.
      const bite = Math.min(1, progress * 8);
      (mesh.material as THREE.MeshBasicMaterial).opacity =
        0.85 * bite * Math.pow(1 - progress, 1.5);
    };
    this.flare(at, 0.5 * scale, 0.16, '#dff6ff', 1);
  }
  /**
   * The pane of a curtain of light catching a shot: a soft disc square to the lance with a thin
   * rim, flashing once where the shot ran into it. Without it a break reads as a shot that blew
   * up on its own, with nothing to say what stopped it.
   */
  lancePane(at: THREE.Vector3, axis: THREE.Vector3, radius: number, heavy = false) {
    this.prismPanes++;
    const punch = heavy ? 1.25 : 1,
      tint = new THREE.Color(heavy ? '#eaf9ff' : '#cfefff'),
      disc = new THREE.Mesh(
        this.scarPlane,
        new THREE.MeshBasicMaterial({
          map: this.glowMap,
          color: tint.clone().multiplyScalar(0.75),
          transparent: true,
          opacity: 0.4,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
          toneMapped: false,
        }),
      ),
      rim = new THREE.Mesh(
        this.paneRing,
        new THREE.MeshBasicMaterial({
          color: new THREE.Color('#ffffff').multiplyScalar(2.1),
          transparent: true,
          opacity: 0.6,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
          toneMapped: false,
        }),
      ),
      group = new THREE.Group();
    group.add(disc, rim);
    group.position.copy(at);
    group.quaternion.setFromUnitVectors(PLANE_FORWARD, axis.clone().normalize());
    group.userData.kind = 'lance-pane';
    this.add(group, 0.24);
    const effect = this.timed[this.timed.length - 1];
    effect.animate = (e, progress) => {
      const fade = Math.pow(1 - progress, 1.6),
        grow = 1 + 0.3 * progress;
      disc.scale.setScalar(radius * 1.25 * punch * grow);
      rim.scale.setScalar(radius * punch * (0.7 + 0.45 * progress));
      (disc.material as THREE.MeshBasicMaterial).opacity = 0.4 * fade;
      (rim.material as THREE.MeshBasicMaterial).opacity = 0.6 * fade;
    };
    this.flare(at, radius * 0.45 * punch, 0.2, '#ffffff', 1.1);
  }
  /**
   * The thread of light a lance leaves standing along its own length: faint, but enough to show
   * the corridor a beam is holding open for as long as it lasts.
   */
  lightVein(start: THREE.Vector3, end: THREE.Vector3, radius: number, life: number, heavy = false) {
    const direction = v1.subVectors(end, start),
      length = direction.length();
    if (length < 0.5) return;
    this.lightVeins++;
    const line = (width: number, tint: string, opacity: number) => {
      const mesh = new THREE.Mesh(
        this.tube,
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(tint).multiplyScalar(1.6),
          transparent: true,
          opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      mesh.userData.keepGeometry = true;
      mesh.position.y = 0.5;
      mesh.scale.set(width, 1, width);
      return mesh;
    };
    const core = line(Math.max(0.05, radius * 0.03), '#eafbff', heavy ? 0.34 : 0.26),
      halo = line(Math.max(0.16, radius * 0.09), '#63d6ff', heavy ? 0.16 : 0.12),
      group = new THREE.Group();
    group.add(core, halo);
    group.position.copy(start);
    group.quaternion.setFromUnitVectors(UP, direction.normalize());
    group.scale.set(1, length, 1);
    group.userData.kind = 'lance-vein';
    this.add(group, life);
    const effect = this.timed[this.timed.length - 1];
    effect.animate = (e) => {
      // It arrives with the beam and thins away over the lance's life.
      const fade = Math.min(1, (e.max - e.life) / 0.05) * Math.pow(e.life / e.max, 1.2);
      (core.material as THREE.MeshBasicMaterial).opacity = 0.27 * (heavy ? 1.25 : 1) * fade;
      (halo.material as THREE.MeshBasicMaterial).opacity = 0.13 * (heavy ? 1.25 : 1) * fade;
    };
  }
  /**
   * The sight of a charging heavy lance: a hairline from the circle to wherever the crosshair
   * points, brightening as the charge fills, closed by a ring where it lands. It is a sight and
   * nothing else — no shot leaves along it, and it blocks nothing.
   */
  aimTrace(start: THREE.Vector3, end: THREE.Vector3, charge: number) {
    const line = this.aimLine ?? this.createAimLine(),
      direction = v1.subVectors(end, start),
      length = direction.length();
    if (length < 0.5) {
      line.group.visible = false;
      return;
    }
    direction.normalize();
    const core = line.core,
      halo = line.halo;
    // A needle, not a bar: the chase camera sits on the axis of this line and looks straight
    // down it whenever the aim is level, so the thread is the least of the read-out — the ring
    // at the far end is what carries the message.
    core.scale.set(0.024, length, 0.024);
    halo.scale.set(0.075, length, 0.075);
    core.position.y = halo.position.y = length / 2;
    line.tip.position.y = length;
    line.flare.position.y = length;
    // The landing mark: a ring around the point the lance would reach, growing and brightening
    // with the charge — and growing with distance, because at 30 m a fixed metre across is a
    // dot on screen, and the chase camera looks straight down the thread itself.
    const reach = Math.min(2.4, 1 + start.distanceTo(end) * 0.04);
    line.tip.scale.setScalar((0.5 + 0.4 * charge) * reach);
    line.flare.scale.setScalar((0.35 + 0.45 * charge) * reach);
    const bright = 0.3 + 0.7 * Math.min(1, Math.max(0, charge));
    (core.material as THREE.MeshBasicMaterial).opacity = 0.4 * bright;
    (halo.material as THREE.MeshBasicMaterial).opacity = 0.09 * bright;
    (line.tip.material as THREE.MeshBasicMaterial).opacity = 0.5 * bright;
    (line.flare.material as THREE.SpriteMaterial).opacity = 0.35 * bright;
    line.group.visible = true;
    line.group.position.copy(start);
    line.group.quaternion.setFromUnitVectors(UP, direction);
  }
  private createAimLine() {
    // Drawn over everything the way a sight is: the circle being charged stands between the eye
    // and the landing point, so a depth-tested mark would vanish exactly when it is wanted. The
    // thread still ends where the lance would land — it never reaches through a wall.
    const line = (width: number, tint: string, opacity: number) => {
      const mesh = new THREE.Mesh(
        this.tube,
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(tint).multiplyScalar(1.5),
          transparent: true,
          opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: false,
          toneMapped: false,
        }),
      );
      mesh.userData.keepGeometry = true;
      mesh.position.y = 0.5;
      mesh.scale.set(width, 1, width);
      mesh.renderOrder = 8;
      return mesh;
    };
    const core = line(0.024, '#eafbff', 0.4),
      halo = line(0.075, '#63d6ff', 0.09),
      tip = new THREE.Mesh(
        this.reticleRing,
        new THREE.MeshBasicMaterial({
          color: new THREE.Color('#dff6ff').multiplyScalar(1.8),
          transparent: true,
          opacity: 0.4,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: false,
          side: THREE.DoubleSide,
          toneMapped: false,
        }),
      ),
      flare = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: this.glowMap,
          color: '#dff6ff',
          transparent: true,
          opacity: 0.4,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: false,
          toneMapped: false,
        }),
      ),
      group = new THREE.Group();
    // The ring lies across the line rather than in it.
    tip.rotation.x = -Math.PI / 2;
    tip.renderOrder = 8;
    flare.renderOrder = 8;
    tip.userData.keepGeometry = true;
    flare.userData.keepGeometry = true;
    group.add(core, halo, tip, flare);
    group.visible = false;
    group.userData.kind = 'aim-line';
    this.scene.add(group);
    this.aimLine = { group, core, halo, tip, flare };
    return this.aimLine;
  }
  /** Put the lance sight away (released, cancelled, or the arena reset). */
  hideAimTrace() {
    if (this.aimLine) this.aimLine.group.visible = false;
  }
  /** The projectile's body flattening against the patch and fading — contact you can see. */
  private crush(
    remnant: THREE.Object3D,
    normal: THREE.Vector3,
    kind: ProjectileKind,
    size: number,
    life = kind === 'hammer' ? 0.26 : 0.16,
  ) {
    remnant.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        // Projectile materials and geometries are shared: fade a private copy, keep the mesh data.
        const material = (o.material as THREE.Material).clone() as THREE.Material & {
          opacity: number;
        };
        material.transparent = true;
        material.depthWrite = false;
        o.material = material;
        o.userData.keepGeometry = true;
      }
    });
    remnant.position.addScaledVector(normal, 0.02);
    remnant.lookAt(remnant.position.clone().sub(normal));
    const base = remnant.scale.clone(),
      origin = remnant.position.clone(),
      nose = projectileNose(kind);
    remnant.userData.kind = 'crush';
    this.add(remnant, life, 0, 0);
    const effect = this.timed[this.timed.length - 1];
    effect.animate = (e, progress) => {
      // The body piles up against the surface: wider, flatter, and sliding in toward the plane.
      const squash = Math.min(1, progress * 1.6);
      e.object.scale.set(
        base.x * (1 + squash * 0.7 * size),
        base.y * (1 + squash * 0.7 * size),
        base.z * Math.max(0.08, 1 - squash * 0.92),
      );
      e.object.position.copy(origin).addScaledVector(normal, -nose * squash * 0.85);
    };
  }
  /**
   * The struck cell lights up: a white-hot hex plate over the cell the shot landed on, its
   * neighbours catching a dimmer, shorter flash. Children of the patch, so they sit exactly on
   * the lattice — no circle, no ring, nothing travels across the plate.
   */
  private cellFlash(patch: THREE.Object3D, at: THREE.Vector3, tint: string, kind: ProjectileKind) {
    const data = patch.userData,
      cells = (data.cells ?? []) as HexCell[],
      centroid = (data.centroid ?? [0, 0]) as number[];
    if (!cells.length) return;
    const local = patch.worldToLocal(at.clone());
    const guess = nearestCell(local.x + centroid[0], local.y + centroid[1]);
    let hit = cells.find((c) => c.q === guess.q && c.r === guess.r);
    if (!hit) {
      // Struck on the rim between cells: light the nearest real one.
      let best = Infinity;
      for (const c of cells) {
        const p = cellPoint(c.q, c.r),
          d = Math.hypot(p.x - centroid[0] - local.x, p.y - centroid[1] - local.y);
        if (d < best) {
          best = d;
          hit = c;
        }
      }
    }
    if (!hit) return;
    const strong = kind === 'hammer' ? 1 : 0.85;
    const plate = (cell: HexCell, opacity: number, life: number, colour: THREE.Color) => {
      const mesh = new THREE.Mesh(
        this.flashGeometry,
        new THREE.MeshBasicMaterial({
          color: colour,
          transparent: true,
          opacity,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          toneMapped: false,
        }),
      );
      const point = cellPoint(cell.q, cell.r);
      mesh.position.set(point.x - centroid[0], point.y - centroid[1], 0);
      mesh.userData.flash = { age: 0, life, opacity };
      mesh.userData.keepGeometry = true;
      patch.add(mesh);
    };
    plate(hit, strong, 0.3, new THREE.Color('#ffffff').lerp(new THREE.Color(tint), 0.25));
    for (const [dq, dr] of HEX_NEIGHBORS) {
      const q = hit.q + dq,
        r = hit.r + dr;
      if (cells.some((c) => c.q === q && c.r === r))
        plate(
          { q, r },
          0.3 * strong,
          0.2,
          new THREE.Color(tint).lerp(new THREE.Color('#ffffff'), 0.5),
        );
    }
  }
  /** The same single-cell flash for a hit with no visible patch to parent it to. */
  private looseFlash(at: THREE.Vector3, frame: THREE.Quaternion, tint: string, size: number) {
    const mesh = new THREE.Mesh(
      this.flashGeometry,
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ffffff').lerp(new THREE.Color(tint), 0.25),
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    );
    mesh.position.copy(at);
    mesh.quaternion.copy(frame);
    mesh.translateZ(0.02);
    mesh.scale.setScalar(Math.max(1, size));
    mesh.userData.kind = 'shield-flash';
    mesh.userData.keepGeometry = true;
    this.add(mesh, 0.26, 0, 0);
  }
  /**
   * The last hit a patch can take. The pieces do not just vanish: for a beat the whole patch
   * locks white with its cracks blazing, then the hex cells peel off one after another in a
   * wave spreading from the strike, tumbling away along the normal with glowing trails, while
   * a hexagonal shockwave (not a circle — the signature of this shield) runs out across the
   * plane and the empty outline lingers as a ghost before it is gone.
   */
  shatterEcho(serial: number, at: THREE.Vector3, scale = 1) {
    const echo = this.findEcho(serial);
    if (echo) {
      const patch = echo.object,
        data = patch.userData;
      data.shattered = true;
      echo.max = echo.life = 0.45;
      echo.grow = 0;
      patch.updateMatrixWorld(true);
      const frame = patch.getWorldQuaternion(new THREE.Quaternion()),
        cells = (data.cells ?? []) as HexCell[],
        centroid = (data.centroid ?? [0, 0]) as number[];
      this.shards(patch, frame, cells, centroid, at, scale);
      this.hexWave(at, frame, scale, 1, '#ffffff', 0.42);
      this.hexWave(at, frame, scale, 0.55, '#7af1ff', 0.6);
    }
    this.burst(at, '#c8fbff', scale > 2 ? 40 : 24, 7, 0.26 * Math.sqrt(scale), 0.55);
    this.burst(at, '#7af1ff', 14, 3.2, 0.42 * Math.sqrt(scale), 0.25);
    // Glass dust: fine motes that glitter and sink.
    for (let i = 0; i < 18; i++) {
      const p = this.sparks[this.cursor++ % this.particleBudget];
      p.p
        .copy(at)
        .add(
          new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5,
          ).multiplyScalar(1.2 * scale),
        );
      p.v.set((Math.random() - 0.5) * 1.5, Math.random() * 0.5, (Math.random() - 0.5) * 1.5);
      p.color.set('#e8fdff');
      p.life = p.max = 0.6 + Math.random() * 0.6;
      p.size = 0.06 + Math.random() * 0.06;
      p.gravity = 1.6;
    }
  }
  /** The hex cells of a broken patch as individual prisms, peeling away in a wave. */
  private shards(
    patch: THREE.Object3D,
    frame: THREE.Quaternion,
    cells: HexCell[],
    centroid: number[],
    strike: THREE.Vector3,
    scale: number,
  ) {
    if (!cells.length) return;
    const count = cells.length,
      fill = new THREE.InstancedMesh(
        this.shardGeometry,
        new THREE.MeshBasicMaterial({
          color: '#bff7ff',
          transparent: true,
          opacity: 0.55,
          side: THREE.DoubleSide,
          depthWrite: false,
          toneMapped: false,
        }),
        count,
      ),
      rim = new THREE.InstancedMesh(
        this.shardRim,
        new THREE.MeshBasicMaterial({
          color: '#ffffff',
          transparent: true,
          opacity: 1,
          side: THREE.DoubleSide,
          depthWrite: false,
          toneMapped: false,
        }),
        count,
      );
    fill.frustumCulled = rim.frustumCulled = false;
    const group = new THREE.Group();
    group.add(fill, rim);
    group.userData.kind = 'shield-shards';
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(frame),
      origin = patch.position.clone(),
      random = seededRandom(1 + count * 17 + Math.floor(strike.x * 10));
    const local = cells.map((c) => {
      const point = cellPoint(c.q, c.r);
      return new THREE.Vector3((point.x - centroid[0]) * scale, (point.y - centroid[1]) * scale, 0);
    });
    const world = local.map((l) => l.clone().applyQuaternion(frame).add(origin));
    const farthest = Math.max(0.2, ...world.map((w) => w.distanceTo(strike)));
    const pieces = world.map((w, i) => {
      const radial = w.clone().sub(strike);
      radial.sub(normal.clone().multiplyScalar(radial.dot(normal)));
      if (radial.lengthSq() < 1e-4)
        radial.set(random() - 0.5, random() - 0.5, 0).applyQuaternion(frame);
      radial.normalize();
      return {
        start: w,
        delay: 0.09 + (w.distanceTo(strike) / farthest) * 0.16,
        // Mostly outward across the plane (readable from any angle), a little back towards
        // the body the way struck glass goes, and the strike's own kick along the normal.
        velocity: radial
          .clone()
          .multiplyScalar(3.8 + random() * 3.2)
          .addScaledVector(normal, -(0.6 + random() * 1.4))
          .add(new THREE.Vector3(0, 1.2 + random() * 1.4, 0)),
        axis: new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize(),
        spin: 9 + random() * 11,
        trail: i % 2 === 0,
      };
    });
    const life = 0.75,
      quaternion = new THREE.Quaternion(),
      tumble = new THREE.Quaternion();
    const place = (time: number) => {
      pieces.forEach((piece, i) => {
        const t = Math.max(0, time - piece.delay);
        dummy.position
          .copy(piece.start)
          .addScaledVector(piece.velocity, t)
          .add(new THREE.Vector3(0, -4.5 * t * t, 0));
        quaternion.copy(frame);
        if (t > 0) quaternion.multiply(tumble.setFromAxisAngle(piece.axis, piece.spin * t));
        dummy.quaternion.copy(quaternion);
        const shrink = t > 0.35 ? Math.max(0, 1 - (t - 0.35) / 0.3) : 1;
        dummy.scale.setScalar(scale * shrink);
        dummy.updateMatrix();
        fill.setMatrixAt(i, dummy.matrix);
        rim.setMatrixAt(i, dummy.matrix);
        if (piece.trail && t > 0 && t < 0.3 && Math.random() < 0.6) {
          const p = this.sparks[this.cursor++ % this.particleBudget];
          p.p.copy(dummy.position);
          p.v.copy(piece.velocity).multiplyScalar(0.15);
          p.color.set('#9cf6ff');
          p.life = p.max = 0.18;
          p.size = 0.14 * scale;
          p.gravity = 0;
        }
      });
      fill.instanceMatrix.needsUpdate = rim.instanceMatrix.needsUpdate = true;
    };
    place(0);
    this.add(group, life, 0, 0);
    const effect = this.timed[this.timed.length - 1];
    effect.animate = (e) => {
      const time = e.max - e.life;
      place(time);
      // Held white for the first beat, then cooling back to cyan as the pieces fly.
      const heat = Math.max(0, 1 - time / 0.2);
      (fill.material as THREE.MeshBasicMaterial).color.setRGB(0.75 + heat * 0.25, 0.97, 1);
    };
  }
  /** A six-sided shockwave in the patch plane, aligned with the hex grid of the pieces. */
  private hexWave(
    at: THREE.Vector3,
    frame: THREE.Quaternion,
    scale: number,
    strength: number,
    color: string,
    life: number,
  ) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 0.8 + 0.12 * strength, 6),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9 * strength,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    ring.position.copy(at);
    ring.quaternion.copy(frame);
    ring.rotateZ(Math.PI / 6);
    ring.translateZ(0.03);
    ring.userData.kind = 'shield-wave';
    ring.scale.setScalar(0.3 * Math.sqrt(scale));
    this.add(ring, life, (2.8 * Math.sqrt(scale)) / life, 0);
  }
  /**
   * The body righting itself in mid-air: a soft ring of displaced air around the hips and a
   * few flakes, so the moment reads even against an empty sky.
   */
  /**
   * A ghost of `mesh` left where it is right now: an additive, unlit copy of the same geometry
   * that fades over a quarter of a second. Used for the dash's afterimage trail.
   */
  afterimage(mesh: THREE.Mesh) {
    this.afterimages++;
    const ghost = new THREE.Mesh(
      mesh.geometry,
      new THREE.MeshBasicMaterial({
        color: '#8fe3ff',
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    ghost.userData.keepGeometry = true;
    ghost.userData.kind = 'afterimage';
    mesh.updateWorldMatrix(true, false);
    mesh.matrixWorld.decompose(ghost.position, ghost.quaternion, ghost.scale);
    this.add(ghost, 0.26, 0.3, 0);
  }
  airRecover(at: THREE.Vector3, scale = 1) {
    this.airRecoveries++;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.78, 36),
      new THREE.MeshBasicMaterial({
        color: '#dffbff',
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    ring.position.copy(at);
    ring.rotation.x = -Math.PI / 2;
    ring.userData.kind = 'air-recover';
    const life = 0.42;
    ring.scale.setScalar(0.8 * scale);
    this.add(ring, life, (2.6 * scale) / life, 0);
    this.dust(at, 4, 0.9 * scale);
    this.burst(at, '#bff6ff', 10, 2.2, 0.2 * scale, 0.35);
  }
  /**
   * A body dragged across the ground ploughs a furrow: the strip of lifted earth is extended
   * along the direction of travel, clods are thrown up from both flanks, and a little dust and
   * grit trail behind. `actor` keeps each body's furrow continuous between calls.
   */
  skid(at: THREE.Vector3, velocity: THREE.Vector3, scale = 1, actor = 'player') {
    const speed = Math.hypot(velocity.x, velocity.z);
    if (speed < 0.6) return;
    this.skidCalls++;
    const back = v1.set(-velocity.x, 0, -velocity.z).normalize(),
      side = v2.set(-back.z, 0, back.x);
    const base = new THREE.Vector3(at.x, this.groundAt(at.x, at.z) + 0.06 * scale, at.z);
    const intensity = Math.min(1, speed / 22);
    this.furrows.extend(actor, base, velocity, scale, intensity, this.time);
    // Earth lifted off both flanks: clods arc up and outwards, a touch forward with the slide.
    const clods = 2 + Math.round(intensity * 1.5);
    for (let i = 0; i < clods; i++) {
      const flank = i % 2 ? 1 : -1,
        d = this.rocks[this.rockCursor++ % this.rockCapacity];
      d.p.copy(base).addScaledVector(side, flank * 0.6 * scale);
      d.v
        .copy(side)
        .multiplyScalar(flank * (1.8 + Math.random() * 2.6) * scale)
        .addScaledVector(back, -speed * (0.08 + Math.random() * 0.12))
        .add(new THREE.Vector3(0, (2.4 + Math.random() * 3.2) * (0.4 + intensity), 0));
      d.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      d.life = d.max = 0.9 + Math.random() * 0.9;
      d.size = (0.1 + Math.random() * 0.2) * scale;
      this.tintRock(this.rockCursor - 1, Math.random() < 0.6 ? '#8a6a4a' : '#a8876a');
      this.clods++;
    }
    this.dust(base.clone().addScaledVector(back, 0.6 * scale), 1, 1.1 * scale, velocity);
    const sparks = this.emit(1 + intensity * 2);
    for (let i = 0; i < sparks; i++) {
      const p = this.sparks[this.cursor++ % this.particleBudget];
      p.p.copy(base).addScaledVector(side, (Math.random() - 0.5) * 0.9 * scale);
      p.v
        .copy(back)
        .multiplyScalar(speed * (0.1 + Math.random() * 0.25))
        .addScaledVector(side, (Math.random() - 0.5) * 3)
        .add(new THREE.Vector3(0, 0.8 + Math.random() * 2.6 * (0.5 + intensity), 0));
      p.color.set(Math.random() < 0.4 ? '#8c6238' : '#5c5955');
      p.life = p.max = 0.16 + Math.random() * 0.34;
      p.size = (0.06 + Math.random() * 0.08) * scale;
      p.gravity = 12;
    }
  }
  private tintRock(cursor: number, tint: string) {
    const index = ((cursor % this.rockCapacity) + this.rockCapacity) % this.rockCapacity,
      color = new THREE.Color(tint);
    this.rockMesh.instanceColor!.setXYZ(index, color.r, color.g, color.b);
    this.rockMesh.instanceColor!.needsUpdate = true;
  }
  contact(at: THREE.Vector3, incoming: THREE.Vector3, scale = 1) {
    const points: number[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6,
        length = (i % 3 === 0 ? 1.4 : 0.8) * scale;
      const x = Math.cos(angle),
        y = Math.sin(angle),
        w = 0.065 * scale;
      points.push(
        x * 0.15,
        y * 0.15,
        0,
        x * length,
        y * length,
        0,
        x * 0.35 - y * w,
        y * 0.35 + x * w,
        0,
      );
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    const flash = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: '#e7fcff',
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    flash.position.copy(at);
    flash.lookAt(at.clone().sub(incoming.clone().normalize()));
    this.add(flash, 0.22, 1.5);
    this.burst(at, '#e5fcff', 18, 5, 0.23, 1);
  }
  quality(low: boolean) {
    this.baseDensity = low ? 0.45 : 1;
    this.applyDensity();
  }
  /**
   * Adaptive budget: feed the measured frame rate about once a second. Density sinks quickly
   * when frames sag and climbs back slowly once they recover, so a long salvo on a weak phone
   * thins its sparks instead of stuttering — and a fast machine keeps every particle.
   */
  load(fps: number) {
    this.adaptive = adaptDensity(this.adaptive, fps);
    this.applyDensity();
  }
  get particleDensity() {
    return this.density;
  }
  private applyDensity() {
    this.density = Math.min(this.baseDensity, this.adaptive);
    this.particleBudget = Math.max(120, Math.round(this.capacity * this.density));
  }
  /** How many of `count` particles to actually emit under the current density (at least one). */
  private emit(count: number) {
    return Math.max(1, Math.round(count * Math.pow(this.density, 0.75)));
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
    drift?: THREE.Vector3,
  ) {
    const color = new THREE.Color(tint);
    const n = this.emit(count);
    for (let i = 0; i < n; i++) {
      const p = this.sparks[this.cursor++ % this.particleBudget];
      p.p.copy(at);
      p.v
        .set(Math.random() - 0.5, Math.random() - 0.25, Math.random() - 0.5)
        .normalize()
        .multiplyScalar(force * (0.2 + Math.random() * 0.8));
      if (drift) p.v.add(drift);
      p.color.copy(color);
      p.life = p.max = 0.3 + Math.random() * 0.65;
      p.size = size * (0.4 + Math.random());
      p.gravity = gravity;
    }
  }
  debris(at: THREE.Vector3, count = 10, force = 4, scale = 1, direction?: THREE.Vector3) {
    const n = this.emit(count);
    for (let i = 0; i < n; i++) {
      const d = this.rocks[this.rockCursor++ % this.rockCapacity];
      this.tintRock(this.rockCursor - 1, '#67696a');
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
  private readonly dashRingGeometry = new THREE.CircleGeometry(1, 72);
  /**
   * The dash launch disc. At the instant of the burst a solid white circle hangs at the
   * take-off point, square to the dash direction, and stays there as the body leaves it. Over
   * the next fifth of a second it widens from about 2.2 m to 4.5 m in radius while its middle
   * erodes away, so it turns into a torn ring with pale blue-grey radial creases and jagged
   * spikes around the rim, and is gone before the dash ends.
   */
  /**
   * `flat` lays the disc on a surface instead of hanging it across the path (used when the
   * take-off point is too close to the ground for a vertical disc to clear it).
   */
  dashRing(at: THREE.Vector3, direction: THREE.Vector3, scale = 1, flat = false) {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPhase: { value: 0 },
        uSeed: { value: Math.random() * 100 },
        // A ring lying on the ground is seen at a grazing angle, so its rim is kept broader.
        uThick: { value: flat ? 0.17 : 0.06 },
      },
      vertexShader: `varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `uniform float uPhase;
        uniform float uSeed;
        uniform float uThick;
        varying vec2 vUv;
        float hash(float n) { return fract(sin(n * 127.1 + uSeed) * 43758.5453); }
        // Angular noise with a number of jagged steps around the circle, smoothed a little.
        float banded(float angle, float bands, float salt) {
          float x = angle / 6.28318 * bands;
          float i = floor(x), f = fract(x);
          f = f * f * (3.0 - 2.0 * f);
          return mix(hash(i + salt), hash(i + 1.0 + salt), f);
        }
        void main() {
          vec2 p = (vUv - 0.5) * 2.0;
          float r = length(p);
          float angle = atan(p.y, p.x) + 3.14159;
          // The rim: a few broad lobes plus fine tears, growing more ragged as it spreads.
          float lobes = banded(angle, 7.0, 1.0), tears = banded(angle, 41.0, 2.0);
          float rim = 0.78 + 0.1 * lobes + (0.04 + 0.1 * uPhase) * tears;
          float body = smoothstep(rim, rim - uThick, r);
          // Radial spikes shooting past the rim.
          float spikeMask = step(0.9, banded(angle, 23.0, 3.0));
          float spikes = spikeMask * smoothstep(rim + 0.22 + 0.12 * uPhase, rim - 0.02, r) * step(rim - 0.05, r);
          // The middle erodes from the centre outwards along an uneven front.
          float front = uPhase * 1.05 * (0.72 + 0.42 * banded(angle, 11.0, 4.0));
          float hole = smoothstep(front - 0.08, front + 0.03, r);
          float alpha = max(body, spikes) * hole;
          // Pale blue-grey creases radiating from the centre within the white.
          float crease = smoothstep(0.55, 0.9, banded(angle, 90.0, 5.0)) * smoothstep(0.15, 0.6, r);
          vec3 colour = mix(vec3(1.0), vec3(0.78, 0.86, 0.92), crease * 0.9);
          float fade = 1.0 - smoothstep(0.55, 1.0, uPhase);
          gl_FragColor = vec4(colour, alpha * fade);
          if (gl_FragColor.a < 0.01) discard;
        }`,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    if (flat) {
      material.depthWrite = false;
      material.polygonOffset = true;
      material.polygonOffsetFactor = -2;
      material.polygonOffsetUnits = -2;
    }
    const ring = new THREE.Mesh(this.dashRingGeometry, material);
    ring.position.copy(at);
    ring.lookAt(at.clone().add(direction));
    ring.scale.setScalar(2.2 * scale);
    ring.userData.kind = 'dash-ring';
    ring.userData.keepGeometry = true;
    this.add(ring, flat ? 0.3 : 0.2, 0, 0);
    const effect = this.timed[this.timed.length - 1];
    effect.animate = (e, progress) => {
      material.uniforms.uPhase.value = flat ? Math.pow(progress, 1.3) : progress;
      const grow = 1 - Math.pow(1 - progress, 2.2);
      e.object.scale.setScalar((2.2 + 2.3 * grow) * scale);
    };
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
  /**
   * A Prisma circle at unit radius, facing +z: the triangle plate, a counter-turning inner
   * plate, a faint glass fill, a bright rim and the lens the beam leaves from. The caller
   * scales, orients and spins it (`spinPrism`) and tears it down with `shatterPrism`.
   */
  prismCircle(big = false): THREE.Group {
    const group = new THREE.Group();
    const tint = new THREE.Color(big ? '#b4f0ff' : '#7fdcff');
    const plate = (size: number, opacity: number) =>
      new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshBasicMaterial({
          map: this.prismMap,
          color: tint.clone().multiplyScalar(big ? 3.6 : 3.4),
          transparent: true,
          opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
          toneMapped: false,
        }),
      );
    const outer = plate(2, 1),
      inner = plate(1.26, 0.85);
    inner.userData.counter = true;
    inner.position.z = 0.004;
    // The light the circle itself throws: a soft wash under the plates, so it reads as lit.
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(3.1, 3.1),
      new THREE.MeshBasicMaterial({
        map: this.glowMap,
        color: tint.clone().multiplyScalar(big ? 1.5 : 1.2),
        transparent: true,
        opacity: big ? 0.5 : 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    );
    halo.position.z = -0.008;
    const glass = new THREE.Mesh(
      new THREE.CircleGeometry(0.97, 48),
      new THREE.MeshBasicMaterial({
        color: tint.clone().multiplyScalar(0.55),
        transparent: true,
        opacity: big ? 0.16 : 0.1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    glass.position.z = -0.004;
    glass.userData.glass = true;
    const rim = new THREE.Mesh(
      new THREE.RingGeometry(0.975, 1.03, 72),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ffffff').multiplyScalar(2.4),
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    );
    rim.position.z = 0.006;
    const lens = new THREE.Mesh(
      new THREE.CircleGeometry(0.12, 24),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ffffff').multiplyScalar(3.2),
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    );
    lens.position.z = 0.008;
    lens.userData.lens = true;
    group.add(halo, glass, outer, inner, rim, lens);
    group.traverse((o) => {
      if (o instanceof THREE.Mesh) o.userData.baseOpacity = (o.material as THREE.Material).opacity;
    });
    return group;
  }
  /** Turn a Prisma circle about its own axis: the inner plate runs the other way. */
  spinPrism(group: THREE.Group, angle: number, brightness = 1, lens = 1) {
    for (const child of group.children) {
      const mesh = child as THREE.Mesh;
      mesh.rotation.z = mesh.userData.counter ? -angle * 1.6 : angle;
      const material = mesh.material as THREE.Material & { opacity: number };
      const base = mesh.userData.baseOpacity ?? 1;
      material.opacity = Math.min(1, base * (mesh.userData.lens ? lens : brightness));
    }
  }
  /**
   * The light of a beam as a shader: a soft sheath that runs from the muzzle outwards, bright
   * where the tube turns away from the eye — the silhouette of a glass cylinder — with a soft
   * core through the middle and a slow roll of energy travelling down it. Additive, so the
   * bloom pass can spread it; the lengthwise gradient keeps it from reading as a flat bar.
   */
  private lightMaterial(tint: string, gain: number, roll: number, fringe = 0) {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(tint) },
        uGain: { value: gain },
        uFade: { value: 1 },
        uRoll: { value: roll },
        uFringe: { value: fringe },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vNormalW;
        varying vec3 vViewDir;
        varying vec2 vShade;
        void main() {
          vec4 world = modelMatrix * vec4(position, 1.0);
          vNormalW = normalize(mat3(modelMatrix) * normal);
          vViewDir = normalize(cameraPosition - world.xyz);
          vShade = uv;
          gl_Position = projectionMatrix * viewMatrix * world;
        }`,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uGain;
        uniform float uFade;
        uniform float uRoll;
        uniform float uFringe;
        uniform float uTime;
        varying vec3 vNormalW;
        varying vec3 vViewDir;
        varying vec2 vShade;
        void main() {
          float facing = abs(dot(normalize(vNormalW), normalize(vViewDir)));
          float rim = pow(1.0 - facing, 2.4);
          float core = pow(facing, 1.5);
          float muzzle = 1.0 - 0.4 * vShade.y;
          float roll = 1.0 + uRoll * 0.3 * sin(vShade.y * 22.0 - uTime * 9.0);
          vec3 tint = uColor;
          if (uFringe > 0.0) {
            // The spectrum the prism throws: magenta down one flank, amber down the other,
            // strongest where the tube turns away and the light has furthest to travel.
            float around = cos(vShade.x * 6.28318);
            vec3 flanks = around > 0.0
              ? vec3(1.0, 0.34, 0.95)
              : vec3(1.0, 0.82, 0.3);
            tint += uFringe * (rim * 0.8 + core * 0.25) * abs(around) * flanks;
          }
          gl_FragColor = vec4(tint * uGain * (core * 0.5 + rim * 0.85) * muzzle * roll * uFade, 1.0);
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    material.toneMapped = false;
    return material;
  }
  /**
   * A camera-facing shaft of glow along the whole beam: a stretched wash of light that keeps
   * the middle of the lance soft and rounded instead of glassy. It is a child of the beam, so
   * the beam's own stretch carries it; only its lean to the eye is recomputed each frame.
   */
  private shaft(width: number, tint: string, opacity: number) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: this.shaftMap,
        color: new THREE.Color(tint).multiplyScalar(1.35),
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    );
    mesh.position.y = 0.5;
    mesh.scale.set(width, 1, 1);
    mesh.userData.shaft = true;
    mesh.userData.width = width;
    return mesh;
  }
  /**
   * The Prisma beam: a white-hot core inside a soft-lit cyan sheath, wrapped in a wide halo,
   * with the thin spectral fringes a prism throws — magenta to one side, amber to the other —
   * and a camera-facing flare at the muzzle and at the hit. It extends from its circle to the
   * target over 60 ms, then holds and fades away over its tail (rather than blinking out);
   * the heavy lance is the same beam five times the radius, pinching as it dies.
   */
  prismBeam(start: THREE.Vector3, end: THREE.Vector3, radius: number, life: number, big = false) {
    const direction = v1.subVectors(end, start),
      length = direction.length();
    if (length < 0.01) return;
    direction.normalize();
    const side = new THREE.Vector3().crossVectors(direction, UP);
    if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
    side.normalize();
    const group = new THREE.Group();
    const tube = (
      width: number,
      color: string,
      opacity: number,
      multiply: number,
      offset: THREE.Vector3 | null,
    ) => {
      const mesh = new THREE.Mesh(
        this.tube,
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(color).multiplyScalar(multiply),
          transparent: true,
          opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      mesh.userData.keepGeometry = true;
      mesh.userData.width = width;
      // The unit cylinder sits on [0, 1] along y so the group can grow from the start.
      mesh.position.y = 0.5;
      if (offset) mesh.userData.offset = offset.clone();
      mesh.scale.set(width, 1, width);
      return mesh;
    };
    const sheath = (width: number, tint: string, gain: number, roll: number, fringe = 0) => {
      const mesh = new THREE.Mesh(this.tube, this.lightMaterial(tint, gain, roll, fringe));
      mesh.userData.keepGeometry = true;
      mesh.userData.width = width;
      mesh.position.y = 0.5;
      mesh.scale.set(width, 1, width);
      return mesh;
    };
    group.add(
      // The aura: a broad wash of blue light around the whole lance, well past its body.
      sheath(radius * (big ? 3.8 : 6.4), '#1fa8ff', big ? 0.34 : 0.3, 0.5),
      // The lit body of the beam, twice over: the sheath and its tighter core.
      sheath(radius * (big ? 2.2 : 3), '#4fcfff', big ? 0.8 : 0.75, 0.8),
      // The lit body of the beam, the outermost layer carrying the prism's dispersion.
      sheath(radius * 1.25, '#8fe8ff', big ? 1.3 : 1.2, 1, big ? 0.8 : 0.9),
      // The hot middle, straight down the axis; the shaft softens it into a rounded glow.
      tube(radius * 0.3, '#ffffff', 1, big ? 4.6 : 5.5, null),
      this.shaft(radius * (big ? 5 : 7), '#9fe4ff', big ? 0.26 : 0.2),
    );
    group.position.copy(start);
    group.quaternion.setFromUnitVectors(UP, direction);
    group.scale.set(1, 0.001, 1);
    group.userData.kind = 'prism-beam';
    this.add(group, life);
    const effect = this.timed[this.timed.length - 1];
    // Fire a flare at each end: the light bursting off the lens and off whatever it lands on.
    this.flare(start, radius * (big ? 3.2 : 4.4), life * 0.8, '#dff6ff', 1);
    this.flare(end, radius * (big ? 5 : 7), life * 0.75, '#ffffff', 1.25);
    // The heavy lance lands inside a contact freeze, so it is drawn whole at once; the small
    // beams extend over their first 60 ms.
    const drive = (age: number, left: number) => {
      const reach = big ? 1 : Math.min(1, age / 0.06),
        fade = Math.min(1, left / (big ? 0.24 : life * 0.6)),
        pinch = big ? 1 - 0.55 * Math.pow(1 - left / life, 2) : 1 - 0.3 * (1 - left / life);
      group.scale.y = Math.max(0.001, length * reach * reach * (3 - 2 * reach));
      for (const child of group.children) {
        const mesh = child as THREE.Mesh,
          width = (mesh.userData.width as number) * pinch;
        mesh.scale.set(width, 1, width);
        const offset = mesh.userData.offset as THREE.Vector3 | undefined;
        if (offset) {
          mesh.position.x = offset.x * pinch;
          mesh.position.z = offset.z * pinch;
        }
        const material = mesh.material as THREE.Material & {
          opacity: number;
          uniforms?: Record<string, { value: number }>;
        };
        const shader = material.uniforms;
        if (shader?.uFade) {
          shader.uFade.value = fade;
          if (shader.uTime) shader.uTime.value = age;
        } else material.opacity = (mesh.userData.baseOpacity ?? 1) * fade;
        if (mesh.userData.shaft && this.eye) orientShaft(mesh, group, this.eye.position);
      }
    };
    drive(0, life);
    effect.animate = (e) => drive(e.max - e.life, e.life);
  }
  /**
   * A camera-facing bloom of light at `at`, `radius` across the middle, swelling a touch as it
   * burns out. Sprites are not meshes, so it fades itself rather than leaning on `update`.
   */
  flare(
    at: THREE.Vector3,
    radius: number,
    life: number,
    tint: THREE.ColorRepresentation,
    punch = 1,
  ) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.glowMap,
        color: new THREE.Color(tint),
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    sprite.position.copy(at);
    sprite.scale.setScalar(radius * 2 * punch);
    sprite.userData.keepGeometry = true;
    this.add(sprite, life);
    const effect = this.timed[this.timed.length - 1];
    effect.animate = (e) => {
      const burn = 1 - e.life / e.max;
      sprite.scale.setScalar(radius * 2 * punch * (1 + 0.5 * burn));
      (sprite.material as THREE.SpriteMaterial).opacity = Math.pow(1 - burn, 1.6) * 0.85;
    };
  }
  /**
   * Prism splinters: small glass triangles in the spectrum's tints, thrown out across the
   * plane of `normal` (and a little along it), spinning and falling, gone within a second.
   * With `ring` they start spread over a disc of that radius instead of at a point, which is
   * how a circle shatters.
   */
  prismShards(at: THREE.Vector3, normal: THREE.Vector3, size: number, count: number, ring = 0) {
    count = Math.max(3, Math.round(count * Math.max(0.5, this.density)));
    const mesh = new THREE.InstancedMesh(
      this.splinter,
      new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
      count,
    );
    mesh.userData.keepGeometry = true;
    mesh.frustumCulled = false;
    const n = normal.clone().normalize(),
      u = new THREE.Vector3().crossVectors(n, UP);
    if (u.lengthSq() < 1e-6) u.set(1, 0, 0);
    u.normalize();
    const w = new THREE.Vector3().crossVectors(n, u).normalize();
    const random = seededRandom(Math.floor(at.x * 31 + at.y * 17 + at.z * 7) + count);
    const tint = new THREE.Color();
    const pieces = Array.from({ length: count }, (_, i) => {
      const angle = random() * Math.PI * 2,
        spread = ring ? ring * (0.35 + 0.65 * Math.sqrt(random())) : 0,
        radial = u.clone().multiplyScalar(Math.cos(angle)).addScaledVector(w, Math.sin(angle));
      tint.set(PRISM_TINTS[i % PRISM_TINTS.length]);
      mesh.setColorAt(i, tint);
      return {
        start: at.clone().addScaledVector(radial, spread),
        velocity: radial
          .clone()
          .multiplyScalar((ring ? 2.2 : 1.6) + random() * (ring ? 2.8 : 3.4))
          .addScaledVector(n, (0.4 + random() * 1.3) * (ring ? 1 : 2.2))
          .add(new THREE.Vector3(0, 0.6 + random() * 1.4, 0)),
        axis: new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize(),
        spin: 10 + random() * 14,
        scale: size * (0.06 + random() * 0.11),
        delay: ring ? random() * 0.05 : 0,
      };
    });
    const life = 0.7,
      quaternion = new THREE.Quaternion(),
      base = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
    const place = (time: number) => {
      pieces.forEach((piece, i) => {
        const t = Math.max(0, time - piece.delay);
        dummy.position
          .copy(piece.start)
          .addScaledVector(piece.velocity, t)
          .add(new THREE.Vector3(0, -5.5 * t * t, 0));
        quaternion
          .copy(base)
          .multiply(new THREE.Quaternion().setFromAxisAngle(piece.axis, piece.spin * t));
        dummy.quaternion.copy(quaternion);
        dummy.scale.setScalar(piece.scale * (t > 0.4 ? Math.max(0, 1 - (t - 0.4) / 0.3) : 1));
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };
    place(0);
    const group = new THREE.Group();
    group.add(mesh);
    group.userData.kind = 'prism-shards';
    this.add(group, life);
    const effect = this.timed[this.timed.length - 1];
    effect.animate = (e) => {
      place(e.max - e.life);
      (mesh.material as THREE.MeshBasicMaterial).opacity = 0.95 * Math.min(1, e.life / 0.2);
    };
  }
  /** A Prisma circle breaking: its plates vanish into splinters thrown out across its plane. */
  shatterPrism(group: THREE.Group, normal: THREE.Vector3, radius: number, count: number) {
    this.prismShatters++;
    this.prismShards(group.position, normal, radius * 1.4, count, radius);
    this.burst(group.position, '#dffbff', Math.round(count * 0.6), 2.2 * radius, 0.22, 1);
    this.discard(group);
  }
  /** Remove and dispose an object the caller has been managing itself. */
  discard(object: THREE.Object3D) {
    this.removeEffect({ object, life: 0, max: 0, grow: 0, baseScale: 1, spin: 0 });
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
  impact(at: THREE.Vector3, color: THREE.ColorRepresentation, large = false, scale = 1) {
    this.burst(at, color, large ? 70 : 28, (large ? 9 : 4) * scale, large ? 0.65 : 0.35);
    this.debris(at, large ? 20 : 7, (large ? 6 : 3) * scale);
    if (large) {
      this.shock(at, color, 7 * scale);
      this.burst(at, '#ffffff', 18, 5 * scale, 0.5, 1);
    }
  }
  /**
   * Fire reaching the ground leaves a burn: a ragged dark mark that lingers 6–8 s, plus a
   * short curl of smoke. Bolts scorch about a metre across, a seeker's blast a little more.
   */
  scorch(at: THREE.Vector3, kind: ProjectileKind) {
    const radius = (kind === 'missile' ? 1.7 : 1.15) * (0.85 + Math.random() * 0.3);
    this.scorches.add(at.x, at.z, radius, 6 + Math.random() * 2, this.time);
    const smoke = Math.max(1, Math.round(this.emit(kind === 'missile' ? 3 : 2)));
    for (let i = 0; i < smoke; i++) {
      const p = this.sparks[this.cursor++ % this.particleBudget];
      p.p
        .copy(at)
        .add(new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.15, (Math.random() - 0.5) * 0.5));
      p.v.set((Math.random() - 0.5) * 0.6, 0.9 + Math.random() * 0.8, (Math.random() - 0.5) * 0.6);
      p.color.set('#4a4440');
      p.life = p.max = 0.7 + Math.random() * 0.5;
      p.size = 0.3 + Math.random() * 0.25;
      p.gravity = -0.6;
    }
  }
  /** Pull every live particle inside each attractor towards it (or away, for a detonation). */
  private applyAttractors(p: THREE.Vector3, v: THREE.Vector3, dt: number, weight: number) {
    for (const a of this.attractors) {
      const offset = v1.subVectors(a.center, p),
        distance = offset.length();
      if (distance > a.radius || distance < 1e-3) continue;
      const falloff = 1 - distance / a.radius,
        pull = a.strength * weight * (0.25 + falloff * falloff * 0.75);
      offset.divideScalar(distance);
      v.addScaledVector(offset, pull * dt);
      if (a.swirl > 0) {
        const tangent = v2.crossVectors(UP, offset);
        v.addScaledVector(tangent, pull * a.swirl * dt);
      }
      // Nothing is allowed to overshoot through the core and fly out the far side.
      if (a.strength > 0 && distance < 1.2) v.multiplyScalar(Math.exp(-dt * 6));
    }
  }
  update(dt: number) {
    this.time += dt;
    this.furrows.update(dt);
    this.scorches.update(this.time);
    const attracting = this.attractors.length > 0;
    this.dustClouds.forEach((p, i) => {
      p.life = Math.max(0, p.life - dt);
      if (attracting && p.life > 0) this.applyAttractors(p.p, p.v, dt, 0.8);
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
        if (attracting) this.applyAttractors(p.p, p.v, dt, 1);
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
        if (attracting) this.applyAttractors(d.p, d.v, dt, 1.4);
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
    this.attractors.length = 0;
    for (let i = this.timed.length - 1; i >= 0; i--) {
      const e = this.timed[i];
      e.life -= dt;
      if (e.life <= 0) {
        this.removeEffect(e);
        this.timed.splice(i, 1);
        continue;
      }
      const progress = 1 - e.life / e.max,
        data = e.object.userData;
      if (e.animate) {
        e.animate(e, progress, dt);
        if (data.kind === 'shield-shards') {
          const fade = Math.min(1, e.life / 0.25);
          e.object.traverse((o) => {
            if (o instanceof THREE.Mesh) {
              const material = o.material as THREE.Material & { opacity: number };
              material.opacity = (o.userData.baseOpacity ?? 1) * fade;
            }
          });
        } else if (data.kind === 'crush') {
          const fade = Math.max(0, 1 - progress * 1.15);
          e.object.traverse((o) => {
            if (o instanceof THREE.Mesh)
              (o.material as THREE.Material & { opacity: number }).opacity = fade;
          });
        }
        continue;
      }
      const scale = e.baseScale + progress * e.grow * e.max;
      if (data.kind === 'shield-echo') {
        // Materialise cell by cell on arrival; dissolve the same way (in reverse) at the end,
        // each vanishing cell leaving a wisp of grey vapour and a few glittering motes.
        data.age = (data.age ?? 0) + dt;
        const reveal = data.reveal as ShieldReveal | undefined;
        if (reveal) {
          const appear = Math.min(1, (data.age as number) / SHIELD_APPEAR),
            vanish = data.shattered ? 1 : Math.min(1, e.life / SHIELD_DISSOLVE);
          if (vanish < 1 && !data.dissolving) {
            data.dissolving = true;
            this.shieldDissolve(e.object);
          }
          reveal.value = Math.min(appear, vanish);
        }
        // Cell flashes burn out fast and leave the patch as it was.
        for (let c = e.object.children.length - 1; c >= 0; c--) {
          const child = e.object.children[c];
          const flash = child.userData.flash as
            { age: number; life: number; opacity: number } | undefined;
          if (!flash) continue;
          flash.age += dt;
          if (flash.age >= flash.life) {
            e.object.remove(child);
            ((child as THREE.Mesh).material as THREE.Material).dispose();
            continue;
          }
          const k = 1 - flash.age / flash.life;
          ((child as THREE.Mesh).material as THREE.Material & { opacity: number }).opacity =
            flash.opacity * k * k;
        }
      }
      e.object.scale.setScalar(scale);
      e.object.rotation.z += e.spin * dt;
      const load = data.kind === 'shield-echo' ? Math.min(4, Math.max(0, (data.hits ?? 1) - 1)) : 0;
      e.object.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
          if (o.userData.flash) return;
          const material = o.material as THREE.Material & { opacity: number };
          if (data.kind === 'shield-echo' && data.shattered) {
            // Ghost outline: the pieces are gone (the shards carry them); only the wires linger.
            material.opacity =
              o instanceof THREE.LineSegments && !o.userData.crack
                ? (o.userData.baseOpacity ?? 1) * 0.5 * Math.min(1, e.life / 0.45)
                : 0;
            return;
          }
          const fade =
            data.kind === 'shield-echo'
              ? Math.min(1, e.life / SHIELD_DISSOLVE)
              : Math.min(1, (e.life / e.max) * 1.6);
          // Each absorbed hit brightens the patch: fill and glow step up with the load.
          const charge = 1 + load * (o.userData.glow ? 0.22 : 0.65);
          material.opacity = Math.min(1, (o.userData.baseOpacity ?? 1) * charge * fade);
        }
      });
    }
  }
  clear() {
    this.shieldSerial = 0;
    this.prismShatters = 0;
    this.prismScars = 0;
    this.prismPanes = 0;
    this.lightVeins = 0;
    this.hideAimTrace();
    this.skidCalls = 0;
    this.clods = 0;
    this.airRecoveries = 0;
    this.afterimages = 0;
    this.shieldImpacts = 0;
    this.attractors.length = 0;
    this.furrows.clear();
    this.scorches.clear();
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
      if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments || o instanceof THREE.Sprite) {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry && !o.userData.keepGeometry) geometries.add(mesh.geometry);
        const materials = Array.isArray(o.material) ? o.material : [o.material];
        materials.forEach((m) => m.dispose());
      }
    });
    geometries.forEach((g) => g.dispose());
  }
}
