import * as THREE from 'three';
import { createImpactFrameSystem } from './impactFrames.js';
import './style.css';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const isTouch = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;

const canvas = $('#scene');
const app = $('#app');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isTouch, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.35 : 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x91ced9);
scene.fog = new THREE.Fog(0x91ced9, 22, 67);

const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.08, 110);
camera.rotation.order = 'YXZ';
scene.add(camera);

// Anime impact frames: post-processing pass (visual only, no gameplay hooks).
const impactFrames = createImpactFrameSystem(renderer);
function triggerImpactFrame(options) { return impactFrames.trigger(options, camera); }
window.triggerImpactFrame = triggerImpactFrame;
window.impactFrameSettings = impactFrames.settings;

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const centerScreen = new THREE.Vector2(0, 0);
const tempV = new THREE.Vector3();
const tempV2 = new THREE.Vector3();
const dummy = new THREE.Object3D();

const palette = {
  grass: 0x77a96c,
  grassDark: 0x56835b,
  wheat: 0xd9b761,
  soil: 0x9b7958,
  wood: 0x5d4235,
  plaster: 0xeadcae,
  roof: 0x455e65,
  ink: 0x21333a,
  gold: 0xf4c65a,
  spirit: 0xef6f68,
  spiritBlue: 0x8ddbd2,
};

function toon(color, extra = {}) {
  return new THREE.MeshToonMaterial({ color, ...extra });
}

const mat = {
  ground: toon(palette.grass),
  grassDark: toon(palette.grassDark),
  path: toon(0xb9976b),
  plaster: toon(palette.plaster),
  wood: toon(palette.wood),
  roof: toon(palette.roof),
  leaf: toon(0x4e8b62),
  leafLight: toon(0x70ad6c),
  rock: toon(0x647579),
  dark: toon(palette.ink),
  wheat: toon(palette.wheat),
  gold: toon(palette.gold, { emissive: 0x6d4b10, emissiveIntensity: 0.4 }),
};

function mesh(geometry, material, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, scale = 1, shadow = true } = {}) {
  const item = new THREE.Mesh(geometry, material);
  item.position.set(x, y, z);
  item.rotation.set(rx, ry, rz);
  item.scale.setScalar(scale);
  item.castShadow = shadow;
  item.receiveShadow = shadow;
  return item;
}

function outlinedMesh(geometry, material, options = {}, outlineScale = 1.035) {
  const item = mesh(geometry, material, options);
  const outline = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: palette.ink, side: THREE.BackSide }));
  outline.scale.setScalar(outlineScale);
  outline.castShadow = false;
  item.add(outline);
  return item;
}

// Lighting
const hemi = new THREE.HemisphereLight(0xd9fbff, 0x4a553f, 2.15);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe8b0, 3.1);
sun.position.set(-18, 27, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(isTouch ? 1024 : 1536, isTouch ? 1024 : 1536);
sun.shadow.camera.left = -30;
sun.shadow.camera.right = 30;
sun.shadow.camera.top = 30;
sun.shadow.camera.bottom = -30;
sun.shadow.camera.near = 2;
sun.shadow.camera.far = 70;
sun.shadow.bias = -0.0004;
scene.add(sun);

const world = new THREE.Group();
scene.add(world);
const colliders = [];
const swayers = []; // objects that sway gently in the wind (tree crowns, etc.)

// --- Gradient sky dome + sun disc (kept fog-free so the horizon stays soft) ---
const skyUniforms = {
  topColor: { value: new THREE.Color(0x5fb2cf) },
  horizonColor: { value: new THREE.Color(0xd9eec9) },
};
const skyDome = new THREE.Mesh(
  new THREE.SphereGeometry(92, 24, 14),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: skyUniforms,
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 topColor; uniform vec3 horizonColor; varying vec3 vP; void main(){ float h = clamp(normalize(vP).y * 1.6 + 0.12, 0.0, 1.0); gl_FragColor = vec4(mix(horizonColor, topColor, pow(h, 0.75)), 1.0); }',
  }),
);
scene.add(skyDome);
const sunDisc = mesh(new THREE.CircleGeometry(3.4, 24), new THREE.MeshBasicMaterial({ color: 0xfff0ae, fog: false }), { x: -34, y: 30, z: -58, shadow: false });
sunDisc.lookAt(0, 4, 0);
scene.add(sunDisc);
const sunGlow = mesh(new THREE.CircleGeometry(7.5, 24), new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.28, fog: false, depthWrite: false }), { x: -34, y: 30, z: -58.5, shadow: false });
sunGlow.lookAt(0, 4, 0);
scene.add(sunGlow);

function createWorld() {
  const ground = mesh(new THREE.PlaneGeometry(92, 92), mat.ground, { rx: -Math.PI / 2, shadow: false });
  ground.receiveShadow = true;
  world.add(ground);

  // Soft terrain patches and a winding path.
  const patchGeo = new THREE.CircleGeometry(1, 20);
  for (let i = 0; i < 26; i++) {
    const patch = mesh(patchGeo, i % 3 ? mat.grassDark : toon(0x88b778), {
      x: seeded(i * 9.7, -36, 36), y: 0.006, z: seeded(i * 3.1, -36, 36), rx: -Math.PI / 2,
      scale: seeded(i * 1.9, 1.2, 4.2), shadow: false,
    });
    patch.material.transparent = true;
    patch.material.opacity = 0.32;
    world.add(patch);
  }
  for (let i = 0; i < 15; i++) {
    const z = 16 - i * 2.25;
    const path = mesh(new THREE.CircleGeometry(1, 18), mat.path, {
      x: Math.sin(i * 0.55) * 1.05, y: 0.012, z, rx: -Math.PI / 2,
      scale: 1.25 + (i % 3) * 0.13, shadow: false,
    });
    world.add(path);
  }

  createHouse(-8, 8, 0.18, 0x5b6e74);
  createHouse(8.5, 11, -0.18, 0x7d5550);
  createHouse(-14, 16, 0.4, 0x4f6a70, 0.86);
  createHouse(15, 18, -0.32, 0x735750, 0.9);
  createHouse(14, 2.5, -0.58, 0x52696b, 0.75);

  createTree(-15, 3, 1.1);
  createTree(16, -6, 1.25);
  createTree(-18, -8, 1.4);
  createTree(19, 10, 1.15);
  createTree(-11, 20, 1.25);
  createTree(10, 23, 1.05);
  for (let i = 0; i < 11; i++) createTree(seeded(i * 4.1, -32, 32), seeded(i * 8.2, -32, -21), seeded(i * 7.3, 0.8, 1.35));

  createBell(-5.2, -3.5);
  createField();
  createMountains();
  createClouds();
  createVillageDetails();
  createPollen();
  createBirds();

  // Small shrine/marker behind the enemy.
  const shrine = new THREE.Group();
  const stone = outlinedMesh(new THREE.BoxGeometry(1.2, 1.65, 0.42), mat.rock, { y: 0.82 }, 1.025);
  stone.rotation.z = -0.04;
  shrine.add(stone);
  const seal = mesh(new THREE.TorusGeometry(0.25, 0.035, 8, 20), mat.gold, { y: 1.03, z: 0.24, rx: Math.PI / 2 });
  shrine.add(seal);
  shrine.position.set(0, 0, -17.5);
  world.add(shrine);
  colliders.push({ x: 0, z: -17.5, r: 1.0 }); // kuil = permukaan tabrakan knockback
}

// Village dressing: fences along the path, flowers, rocks and warm lanterns.
function createVillageDetails() {
  const postGeo = new THREE.BoxGeometry(0.14, 0.85, 0.14);
  const railGeo = new THREE.BoxGeometry(0.09, 0.11, 2.1);
  for (let side of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const z = 12 - i * 3.4;
      const x = side * (2.3 + Math.sin(i * 0.8) * 0.25);
      world.add(
        mesh(postGeo, mat.wood, { x, y: 0.42, z, ry: seeded(i * side, -0.12, 0.12) }),
        mesh(railGeo, mat.wood, { x, y: 0.58, z: z - 1.05, rx: 0.02 }),
      );
    }
  }
  [0xf49ac1, 0xfff3f6, 0xffd267].forEach((color, ci) => {
    const flowers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.09, 0), toon(color, { emissive: color, emissiveIntensity: 0.25 }), 26);
    flowers.castShadow = false;
    for (let i = 0; i < 26; i++) {
      dummy.position.set(seeded(i * 7.3 + ci * 31, -24, 24), 0.16, seeded(i * 3.9 + ci * 17, -22, 24));
      if (Math.abs(dummy.position.x) < 2) dummy.position.x += 3.4;
      dummy.rotation.set(0, seeded(i, 0, 3), 0);
      dummy.scale.setScalar(seeded(i * 1.7 + ci, 0.7, 1.5));
      dummy.updateMatrix();
      flowers.setMatrixAt(i, dummy.matrix);
    }
    flowers.instanceMatrix.needsUpdate = true;
    world.add(flowers);
  });
  for (let i = 0; i < 9; i++) {
    const rock = outlinedMesh(new THREE.DodecahedronGeometry(seeded(i * 2.2, 0.25, 0.65), 0), mat.rock, {
      x: seeded(i * 11.1, -26, 26), y: 0.18, z: seeded(i * 5.7, -24, 25), ry: seeded(i, 0, 3),
    }, 1.02);
    if (Math.abs(rock.position.x) < 2.4) rock.position.x += 5;
    world.add(rock);
  }
  const lanternGlass = toon(0xffc37a, { emissive: 0xff9a3c, emissiveIntensity: 1.6 });
  [[-3.4, 6], [3.6, -1], [-4.2, -6.5]].forEach(([x, z]) => {
    const lamp = new THREE.Group();
    lamp.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.3, 6), mat.wood, { y: 1.15 }));
    lamp.add(mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), lanternGlass, { y: 2.42, shadow: false }));
    lamp.add(mesh(new THREE.ConeGeometry(0.42, 0.3, 4), mat.dark, { y: 2.78, ry: Math.PI / 4 }));
    const light = new THREE.PointLight(0xffb45e, 5, 9, 1.8);
    light.position.y = 2.42;
    lamp.add(light);
    lamp.position.set(x, 0, z);
    world.add(lamp);
  });
}

let pollen = null;
function createPollen() {
  const count = isTouch ? 90 : 170;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = seeded(i * 13.7, -30, 30);
    positions[i * 3 + 1] = seeded(i * 7.1, 0.3, 7.5);
    positions[i * 3 + 2] = seeded(i * 3.3, -28, 26);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pollen = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xfff0a6, size: 0.085, transparent: true, opacity: 0.65, depthWrite: false }));
  scene.add(pollen);
}

const birds = [];
function createBirds() {
  const birdMat = new THREE.MeshBasicMaterial({ color: 0x2c4750, side: THREE.DoubleSide });
  for (let i = 0; i < 4; i++) {
    const bird = new THREE.Group();
    const mkWing = (dir) => {
      const geo = new THREE.PlaneGeometry(0.85, 0.22);
      geo.translate(dir * 0.42, 0, 0);
      const w = new THREE.Mesh(geo, birdMat);
      w.castShadow = false;
      return w;
    };
    const left = mkWing(-1);
    const right = mkWing(1);
    bird.add(left, right);
    bird.position.set(-38 + i * 9, 16.5 + (i % 3) * 1.8, -14 - i * 4);
    bird.userData = { speed: 1.1 + i * 0.16, phase: i * 1.7, left, right };
    scene.add(bird);
    birds.push(bird);
  }
}

function createHouse(x, z, rotation = 0, roofColor = 0x53676b, scale = 1) {
  const g = new THREE.Group();
  const base = outlinedMesh(new THREE.BoxGeometry(4.4, 2.9, 3.5), mat.plaster, { y: 1.45 }, 1.012);
  g.add(base);
  const beams = [
    [-1.72, 1.45, 1.78, 0.13, 2.8, 0.12], [1.72, 1.45, 1.78, 0.13, 2.8, 0.12],
    [0, 2.45, 1.79, 3.5, 0.12, 0.1], [0, .48, 1.79, 3.5, 0.12, 0.1],
  ];
  beams.forEach(([bx, by, bz, sx, sy, sz]) => {
    const b = mesh(new THREE.BoxGeometry(sx, sy, sz), mat.wood, { x: bx, y: by, z: bz });
    g.add(b);
  });
  const roof = outlinedMesh(new THREE.ConeGeometry(3.25, 2.0, 4), toon(roofColor), { y: 3.85, ry: Math.PI / 4 }, 1.018);
  roof.scale.z = 0.82;
  g.add(roof);
  const door = mesh(new THREE.BoxGeometry(0.95, 1.7, 0.15), mat.wood, { y: 0.86, z: 1.82 });
  g.add(door);
  const windowMat = toon(0x9bd9cc, { emissive: 0x31564f, emissiveIntensity: 0.5 });
  const window = mesh(new THREE.BoxGeometry(0.82, 0.72, 0.13), windowMat, { x: 1.35, y: 1.62, z: 1.84 });
  g.add(window);
  g.position.set(x, 0, z);
  g.rotation.y = rotation;
  g.scale.setScalar(scale);
  world.add(g);
  colliders.push({ x, z, r: 2.25 * scale });
}

function createTree(x, z, scale = 1) {
  const g = new THREE.Group();
  const trunk = outlinedMesh(new THREE.CylinderGeometry(.28, .43, 3.1, 7), mat.wood, { y: 1.55 }, 1.04);
  g.add(trunk);
  const crown1 = outlinedMesh(new THREE.IcosahedronGeometry(1.65, 1), mat.leaf, { y: 3.5, x: -.25 }, 1.025);
  const crown2 = outlinedMesh(new THREE.IcosahedronGeometry(1.35, 1), mat.leafLight, { y: 4.2, x: .48 }, 1.025);
  g.add(crown1, crown2);
  swayers.push({ obj: crown1, phase: x * 1.7 + z, amp: 0.035 }, { obj: crown2, phase: x - z * 1.3, amp: 0.05 });
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  world.add(g);
  colliders.push({ x, z, r: 1.15 * scale });
}

let bell;
function createBell(x, z) {
  bell = new THREE.Group();
  const left = outlinedMesh(new THREE.CylinderGeometry(.16, .2, 3.4, 7), mat.wood, { x: -1.05, y: 1.7 }, 1.04);
  const right = outlinedMesh(new THREE.CylinderGeometry(.16, .2, 3.4, 7), mat.wood, { x: 1.05, y: 1.7 }, 1.04);
  const top = outlinedMesh(new THREE.CylinderGeometry(.17, .17, 2.45, 7), mat.wood, { y: 3.23, rz: Math.PI / 2 }, 1.04);
  const bellBody = outlinedMesh(new THREE.ConeGeometry(.47, .8, 12, 1, true), mat.gold, { y: 2.62, rx: Math.PI }, 1.035);
  const clapper = mesh(new THREE.SphereGeometry(.11, 8, 6), mat.dark, { y: 2.2 });
  bell.add(left, right, top, bellBody, clapper);
  bell.userData.body = bellBody;
  bell.position.set(x, 0, z);
  world.add(bell);
  colliders.push({ x, z, r: 1.05 });
}

function createField() {
  const geo = new THREE.ConeGeometry(.055, .62, 4);
  geo.translate(0, .31, 0);
  const wheat = new THREE.InstancedMesh(geo, mat.wheat, 260);
  wheat.castShadow = false;
  wheat.receiveShadow = true;
  let count = 0;
  for (let i = 0; i < 340 && count < 260; i++) {
    const x = seeded(i * 15.11, -13, 13);
    const z = seeded(i * 4.83, -20, -7);
    if (Math.abs(x) < 1.7 || (x * x + (z + 13.3) * (z + 13.3)) < 7) continue;
    dummy.position.set(x, 0, z);
    dummy.rotation.y = seeded(i, 0, Math.PI);
    const s = seeded(i * 2.4, .75, 1.25);
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    wheat.setMatrixAt(count++, dummy.matrix);
  }
  wheat.count = count;
  wheat.instanceMatrix.needsUpdate = true;
  world.add(wheat);
}

function createMountains() {
  const mountainMat = toon(0x738c8b);
  const farMat = toon(0x81999a);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const dist = 49 + (i % 3) * 4;
    const h = 8 + (i % 4) * 2.8;
    const mountain = mesh(new THREE.ConeGeometry(6.5, h, 5), i % 2 ? mountainMat : farMat, {
      x: Math.cos(angle) * dist, y: h / 2 - 1, z: Math.sin(angle) * dist, ry: angle, shadow: false,
    });
    world.add(mountain);
  }
}

function createClouds() {
  const cloudMat = toon(0xeaf8ef, { transparent: true, opacity: .72 });
  for (let i = 0; i < 7; i++) {
    const cloud = new THREE.Group();
    for (let j = 0; j < 4; j++) {
      const puff = mesh(new THREE.IcosahedronGeometry(1 + j * .13, 1), cloudMat, {
        x: j * 1.25, y: Math.sin(j) * .25, scale: 1 + (j % 2) * .18, shadow: false,
      });
      cloud.add(puff);
    }
    cloud.position.set(-28 + i * 11, 15 + (i % 3) * 2.2, -25 + (i % 2) * 18);
    cloud.userData.speed = .25 + i * .025;
    scene.add(cloud);
    clouds.push(cloud);
  }
}

function seeded(seed, min, max) {
  const value = Math.sin(seed * 91.3458 + 17.123) * 43758.5453;
  return min + (value - Math.floor(value)) * (max - min);
}

const clouds = [];
createWorld();

// Enemy: the field spirit.
const enemy = {
  group: new THREE.Group(),
  head: null,
  eye: null,
  aura: null,
  anchor: new THREE.Vector3(0, 0, -13.2),
  active: false,
  revealed: false,
  resolved: false,
  stunnedUntil: 0,
  bellRecentUntil: 0,
  rushRecentUntil: 0,
  rushing: false,
  rushEnd: 0,
  enragedUntil: 0,
  attackTimer: 2.1,
  hp: 120,
  maxHp: 120,
  kbVel: null,
  kbY: 0,
  kbVy: 0,
  kbActive: false,
  kbWallHitDone: false,
  kbStaggerUntil: 0,
  reactUntil: 0,
  reactPower: 0,
  vel: null,
  lastPos: null,
};

function createEnemy() {
  const g = enemy.group;
  const strawMat = toon(0xc59b4f);
  const clothMat = toon(0x8d4a46);
  const maskMat = toon(0xe6d5a8);
  const pole = outlinedMesh(new THREE.CylinderGeometry(.11, .15, 3.6, 7), mat.wood, { y: 1.8 }, 1.05);
  const cross = outlinedMesh(new THREE.CylinderGeometry(.1, .12, 3.1, 7), mat.wood, { y: 2.65, rz: Math.PI / 2 }, 1.05);
  const torso = outlinedMesh(new THREE.ConeGeometry(.72, 1.3, 7), clothMat, { y: 2.5, rx: Math.PI }, 1.035);
  torso.scale.z = .58;
  const head = outlinedMesh(new THREE.SphereGeometry(.48, 12, 8), maskMat, { y: 3.42 }, 1.045);
  head.scale.z = .72;
  const hatBrim = outlinedMesh(new THREE.CylinderGeometry(.9, .9, .1, 12), mat.dark, { y: 3.78, rz: -.08 }, 1.025);
  hatBrim.scale.z = .62;
  const hatTop = outlinedMesh(new THREE.ConeGeometry(.52, .9, 9), mat.dark, { y: 4.15, rz: -.15 }, 1.025);
  const eyeMat = toon(0xff6d5f, { emissive: 0xff2a1b, emissiveIntensity: 1.7 });
  const eye = mesh(new THREE.SphereGeometry(.075, 8, 6), eyeMat, { x: .16, y: 3.47, z: .4, shadow: false });
  const eye2 = mesh(new THREE.SphereGeometry(.055, 8, 6), eyeMat, { x: -.17, y: 3.47, z: .4, shadow: false });
  const strawLeft = mesh(new THREE.ConeGeometry(.23, .8, 6), strawMat, { x: -1.55, y: 2.65, rz: -Math.PI / 2 });
  const strawRight = mesh(new THREE.ConeGeometry(.23, .8, 6), strawMat, { x: 1.55, y: 2.65, rz: Math.PI / 2 });
  const auraMat = new THREE.MeshBasicMaterial({ color: palette.spirit, transparent: true, opacity: .33, side: THREE.DoubleSide, depthWrite: false });
  const aura = mesh(new THREE.TorusGeometry(1.25, .035, 8, 48), auraMat, { y: .16, rx: Math.PI / 2, shadow: false });
  const threads = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const thread = mesh(new THREE.CylinderGeometry(.018, .018, 1.4 + i * .14, 5), toon(0xd8504e, { emissive: 0x8d1818, emissiveIntensity: .8 }), {
      x: Math.cos(i / 6 * Math.PI * 2) * .7,
      y: .85,
      z: Math.sin(i / 6 * Math.PI * 2) * .7,
      rz: Math.sin(i) * .3,
      shadow: false,
    });
    threads.add(thread);
  }
  g.add(pole, cross, torso, head, hatBrim, hatTop, eye, eye2, strawLeft, strawRight, aura, threads);
  g.position.copy(enemy.anchor);
  g.scale.setScalar(.92);
  enemy.head = head;
  enemy.eye = eye;
  enemy.aura = aura;
  enemy.threads = threads;
  scene.add(g);
}
createEnemy();
enemy.kbVel = new THREE.Vector3();

// Bayangan masa depan (Future Sight): ghost musuh + garis lintasan proyektil.
const fsGhost = new THREE.Group();
{
  const ghostMat = new THREE.MeshBasicMaterial({ color: 0xbfefff, transparent: true, opacity: 0.32, depthWrite: false });
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.72, 1.6, 7), ghostMat);
  body.position.y = 2.4; body.rotation.x = Math.PI;
  const headG = new THREE.Mesh(new THREE.SphereGeometry(0.48, 10, 8), ghostMat);
  headG.position.y = 3.4;
  fsGhost.add(body, headG);
  fsGhost.visible = false;
  scene.add(fsGhost);
}
const FS_MAX_LINES = 14;
const fsLinePos = new Float32Array(FS_MAX_LINES * 2 * 3);
const fsLineGeo = new THREE.BufferGeometry();
fsLineGeo.setAttribute('position', new THREE.BufferAttribute(fsLinePos, 3));
const fsLines = new THREE.LineSegments(fsLineGeo, new THREE.LineBasicMaterial({ color: 0xffb199, transparent: true, opacity: 0.75 }));
fsLines.visible = false;
fsLines.frustumCulled = false;
scene.add(fsLines);
const enemyVelHistory = [];

// --- First-person viewmodel: sleeve, hand and the interpreter's charm. ---
const viewmodel = new THREE.Group();
const vmParts = {};
function createViewmodel() {
  const sleeve = mesh(new THREE.CylinderGeometry(0.075, 0.095, 0.34, 7), toon(0x35566b, { emissive: 0x0d1c26, emissiveIntensity: 0.4 }), { rx: 1.15, rz: -0.35, shadow: false });
  sleeve.position.set(0.02, -0.1, 0.1);
  const hand = mesh(new THREE.SphereGeometry(0.075, 10, 8), toon(0xd9a06b), { shadow: false });
  hand.scale.set(0.85, 0.65, 1.15);
  hand.position.set(0.1, 0.02, -0.05);
  const ring = mesh(new THREE.TorusGeometry(0.11, 0.016, 8, 24), mat.gold, { shadow: false });
  ring.position.set(0.13, 0.07, -0.14);
  ring.rotation.set(0.4, 0.25, 0);
  const gem = mesh(new THREE.IcosahedronGeometry(0.045, 0), toon(0x8ddbd2, { emissive: 0x2fbfae, emissiveIntensity: 1.8 }), { shadow: false });
  gem.position.copy(ring.position);
  const gemLight = new THREE.PointLight(0x8ddbd2, 0.7, 1.4, 2);
  gemLight.position.copy(ring.position);
  const cord = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 5), mat.dark, { shadow: false });
  cord.position.set(0.12, -0.03, -0.12);
  cord.rotation.z = 0.5;
  viewmodel.add(sleeve, hand, ring, gem, gemLight, cord);
  viewmodel.position.set(0.37, -0.36, -0.58);
  viewmodel.scale.setScalar(0.78);
  viewmodel.rotation.set(0.15, -0.22, 0.06);
  camera.add(viewmodel);
  Object.assign(vmParts, { ring, gem, gemLight, basePos: viewmodel.position.clone() });
}
createViewmodel();

// Particles and projectile effects.
const projectiles = [];
const bursts = [];
const rings = [];

function spawnProjectile(now) {
  const projectileMat = new THREE.MeshBasicMaterial({ color: 0xff6259 });
  const core = mesh(new THREE.IcosahedronGeometry(.17, 0), projectileMat, { shadow: false });
  core.position.copy(enemy.group.position).add(new THREE.Vector3(0, 2.4, 0));
  const target = player.position.clone();
  const velocity = target.sub(core.position).normalize().multiplyScalar(6.9);
  const light = new THREE.PointLight(0xff5149, 1.7, 3.5);
  core.add(light);
  scene.add(core);
  projectiles.push({ mesh: core, velocity, born: now, life: 4 });
  tone(155, .12, 'sawtooth', .035);
}

function spawnDebris(position, normal, power = 1) {
  // Puing tanah/batu gelap beterbangan mengikuti arah pantul permukaan.
  const n = normal.clone();
  const count = Math.round(16 + power * 10);
  const positions = new Float32Array(count * 3);
  const velocities = [];
  for (let i = 0; i < count; i++) {
    positions[i * 3] = position.x; positions[i * 3 + 1] = position.y; positions[i * 3 + 2] = position.z;
    const v = new THREE.Vector3(seeded(i * 3.1, -1, 1), seeded(i * 5.7, 0.2, 1.5), seeded(i * 7.9, -1, 1)).normalize()
      .multiplyScalar(seeded(i * 9.3, 1, 2.6 + power));
    v.addScaledVector(n, 1.6 + power * 0.5);
    velocities.push(v);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0x35302a, size: 0.21, transparent: true, opacity: 1, depthWrite: false });
  const points = new THREE.Points(geometry, material);
  scene.add(points);
  bursts.push({ points, velocities, age: 0, gravity: 5.5, life: 1.1 });
  // Debu terang yang menyertainya.
  spawnBurst(position, 0xd8d2c4, Math.round(10 + power * 5), 1.5 + power * 0.4);
  const dust = bursts[bursts.length - 1];
  if (dust) { dust.gravity = 0.4; dust.points.material.size = 0.3; dust.points.material.opacity = 0.55; dust.life = 0.9; dust.baseOpacity = 0.55; }
}
function spawnGroundMark(position, radius = 0.6, life = 4) {
  const mat = new THREE.MeshBasicMaterial({ color: 0x2c2620, transparent: true, opacity: 0.55, depthWrite: false });
  const mark = new THREE.Mesh(new THREE.CircleGeometry(radius, 14), mat);
  mark.rotation.x = -Math.PI / 2;
  mark.position.set(position.x, 0.02 + Math.random() * 0.01, position.z);
  mark.scale.set(1.4, 0.8, 1);
  mark.rotation.z = Math.random() * Math.PI;
  scene.add(mark);
  wallMarks.push({ group: mark, mat, age: 0, life, grow: 0.06, baseOpacity: 0.55 });
}
function spawnBurst(position, color = 0xffd267, count = 20, force = 1.6) {
  const positions = new Float32Array(count * 3);
  const velocities = [];
  for (let i = 0; i < count; i++) {
    positions[i * 3] = position.x;
    positions[i * 3 + 1] = position.y;
    positions[i * 3 + 2] = position.z;
    velocities.push(new THREE.Vector3(seeded(i * 2.1 + performance.now(), -1, 1), seeded(i * 4.3, -.1, 1.4), seeded(i * 6.7, -1, 1)).normalize().multiplyScalar(seeded(i * 8.1, .5, force)));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color, size: .12, transparent: true, opacity: 1, depthWrite: false });
  const points = new THREE.Points(geometry, material);
  scene.add(points);
  bursts.push({ points, velocities, age: 0, gravity: 0.65 });
}

function spawnRing(position, color = 0xffd267, maxScale = 8) {
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .75, side: THREE.DoubleSide, depthWrite: false });
  const ring = mesh(new THREE.RingGeometry(.92, 1, 64), material, { x: position.x, y: .08, z: position.z, rx: -Math.PI / 2, shadow: false });
  scene.add(ring);
  rings.push({ mesh: ring, age: 0, maxScale });
}

// Player state and input.
const player = {
  position: new THREE.Vector3(0, 1.68, 13),
  yaw: 0,
  pitch: -.05,
  clarity: 100,
  mana: 60,
  maxMana: 60,
  pdCharges: 3,
  pdReadyAt: 0,
  stamina: 100,
  sprintExhausted: false,
  sprinting: false,
  bobPhase: 0,
  roll: 0,
  fovKick: 0,
  stepDistance: 0,
  invulnerableUntil: 0,
  dodgeVelocity: new THREE.Vector3(),
  lastMove: new THREE.Vector3(),
  testMode: null,
  testStartDistance: 0,
  retreatDeadline: 0,
  saveTimer: 0,
};

let paused = false;
let muted = false;
let masterGain = null;

const keys = new Set();
const joystick = { id: null, x: 0, y: 0 };
let lookPointer = null;
let lookLast = { x: 0, y: 0 };
let gameState = 'menu';
let modalOpen = false;
let actionLock = false;
let toastTimer = 0;
let audioCtx = null;
let checkpoint = null;
const evidence = new Set(); // (lama) digantikan Archive di bawah

// === Sistem Empat Kemampuan (Playtest 0.3) ===
const archive = { formula: 0, mechanism: 0, identity: 0 }; // progres 0..100 per data
const archiveTierName = (v) => v >= 100 ? 'Terverifikasi' : v >= 75 ? 'Analisis Mendalam' : v >= 40 ? 'Analisis' : v > 0 ? 'Observasi' : 'Belum direkam';
const ownedFormulas = new Set();
const spellSlots = [null, null, null, null];
let selectedSlot = 0;
const spellCooldowns = {};
let granted = false;
let appraisalOn = false;
let futureSightOn = false;
let temporalLoad = 0;   // detik beban Future Sight (tahap: 30 / 60 / 120)
let cognitiveLoad = 0;  // beban Appraisal 0..130 (lelah menumpuk > 60)
let fsLocked = false;
let shieldUntil = 0;
let synthesisOpen = false;
let enemyBroken = false;
const playerProjectiles = [];

const FORMULAS = {
  cahaya: { name: 'Pecahan Cahaya', cost: 10, cd: 0.55, dmg: 16, speed: 27, color: 0xffe9a8, kind: 'bolt' },
  angin: { name: 'Hembusan Aster', cost: 14, cd: 1.1, dmg: 7, speed: 20, color: 0xbfeee2, kind: 'knock' },
  perisai: { name: 'Perisai Sekejap', cost: 18, cd: 6, dmg: 0, color: 0x8ddbd2, kind: 'shield' },
  proyektilRoh: { name: 'Proyektil Roh', cost: 12, cd: 0.8, dmg: 13, speed: 21, color: 0xff8d84, kind: 'bolt' },
  jarumCahaya: { name: 'Jarum Cahaya Ladang', cost: 16, cd: 0.7, dmg: 27, speed: 30, color: 0xfff3b0, kind: 'bolt' },
  badaiJarum: { name: 'Badai Jarum', cost: 20, cd: 1.3, dmg: 15, speed: 23, color: 0xd8ffd8, kind: 'knock' },
  perisaiDuri: { name: 'Perisai Berduri', cost: 22, cd: 7, dmg: 0, color: 0xa8f0d8, kind: 'shield' },
};
export const KNOCKBACK_CONFIG = {
  lightImpulse: 1.7, mediumImpulse: 3.6, heavyImpulse: 6.8, launchImpulse: 13.5,
  launchVertical: 5.0, maxSpeed: 15,
  dampingAir: 1.1, dampingGround: 2.1, dampingLaunched: 0.55, gravity: 20,
  wallImpactSpeed: 4.2,      // kecepatan menabrak minimum agar jadi wall impact
  wallRecoil: 2.4, wallRecoilPerSpeed: 0.18,
  staggerLight: 0.1, staggerMedium: 0.25, staggerHeavy: 0.5, staggerWall: 0.85,
  enemyRadius: 0.85,
};
window.KNOCKBACK_CONFIG = KNOCKBACK_CONFIG;
const wallMarks = [];

const RECIPES = {
  'cahaya+proyektilRoh': 'jarumCahaya',
  'angin+proyektilRoh': 'badaiJarum',
  'perisai+proyektilRoh': 'perisaiDuri',
};

const clueText = {
  guard: 'Ia selalu kembali menghadap batu penanda di belakangnya.',
  departure: 'Amarahnya berubah menjadi panik ketika kamu menjauh.',
  bell: 'Suara lonceng menghentikannya—bukan karena sakit, tetapi karena sedih.',
};

function updateCamera() {
  camera.position.copy(player.position);
  camera.rotation.set(player.pitch, player.yaw, player.roll);
}

function updateStaminaUI() {
  const el = $('#staminaFill');
  if (!el) return;
  el.style.width = `${Math.max(0, Math.round(player.stamina))}%`;
  el.style.opacity = player.sprintExhausted ? 0.45 : 1;
}

function startGame() {
  initAudio();
  fitViewport();
  $('#startScreen').classList.remove('active');
  app.classList.add('playing');
  gameState = 'playing';
  player.position.set(0, 1.68, 13);
  player.yaw = 0;
  player.pitch = -.05;
  updateCamera();
  restoreCheckpoint();
  modalOpen = true;
  $('#tutorialCard').classList.remove('hidden');
  $('#touchControls').setAttribute('aria-hidden', isTouch ? 'false' : 'true');
  updateObjective();
  tone(392, .18, 'sine', .04);
  setTimeout(() => tone(523, .35, 'sine', .035), 130);
}

function resetEncounter(clearSave = true) {
  if (clearSave) localStorage.removeItem('duel-interpretasi-checkpoint');
  Object.keys(archive).forEach((k) => { archive[k] = 0; });
  ownedFormulas.clear();
  spellSlots.fill(null);
  selectedSlot = 0;
  granted = false;
  enemyBroken = false;
  appraisalOn = false;
  futureSightOn = false;
  temporalLoad = 0;
  cognitiveLoad = 0;
  player.mana = player.maxMana;
  player.pdCharges = 3;
  enemy.hp = enemy.maxHp;
  lastArchiveSnapshot = '__reset__';
  updateArchiveUI(true);
  updateSpellBar();
  player.position.set(0, 1.68, 13);
  player.yaw = 0;
  player.pitch = -.05;
  player.clarity = 100;
  player.stamina = 100;
  player.sprintExhausted = false;
  player.testMode = null;
  player.dodgeVelocity.set(0, 0, 0);
  enemy.group.position.copy(enemy.anchor);
  enemy.group.scale.setScalar(.92);
  enemy.active = false;
  enemy.revealed = false;
  enemy.resolved = false;
  enemy.rushing = false;
  enemy.hp = enemy.maxHp;
  enemy.stunnedUntil = 0;
  enemy.attackTimer = 2.1;
  projectiles.splice(0).forEach((p) => scene.remove(p.mesh));
  updateArchiveUI();
  updateClarity();
  updateObjective();
  gameState = 'playing';
  modalOpen = false;
  $('#resultScreen').classList.remove('active');
  $('#resolvePanel').classList.add('hidden');
  $('#synthesisPanel')?.classList.add('hidden');
  synthesisOpen = false;
  if (!granted) openModal('grantPanel');
  else if (!isTouch) setTimeout(lockPointer, 80);
}

function saveCheckpoint() {
  if (gameState !== 'playing' || enemy.resolved) return;
  checkpoint = {
    position: [player.position.x, player.position.y, player.position.z],
    archive: { ...archive },
    formulas: [...ownedFormulas],
    slots: [...spellSlots],
    granted,
    clarity: player.clarity,
  };
  localStorage.setItem('duel-interpretasi-checkpoint', JSON.stringify(checkpoint));
}

function restoreCheckpoint() {
  try {
    const saved = JSON.parse(localStorage.getItem('duel-interpretasi-checkpoint'));
    if (!saved) return;
    if (Array.isArray(saved.position)) player.position.fromArray(saved.position);
    if (saved.archive) Object.assign(archive, saved.archive);
    if (Array.isArray(saved.formulas)) saved.formulas.forEach((k) => { if (FORMULAS[k]) ownedFormulas.add(k); });
    if (Array.isArray(saved.slots)) saved.slots.forEach((k, i) => { spellSlots[i] = k && FORMULAS[k] ? k : null; });
    granted = !!saved.granted || ownedFormulas.size > 0;
    updateArchiveUI(true);
    updateSpellBar();
    player.clarity = Math.max(45, saved.clarity || 100);
    updateArchiveUI();
    updateClarity();
    showToast('Checkpoint desa dipulihkan.');
  } catch {
    localStorage.removeItem('duel-interpretasi-checkpoint');
  }
}

function lockPointer() {
  if (!isTouch && gameState === 'playing' && !modalOpen && document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
}

let openModalId = null;
let modalOpenedAt = 0;
const closableModals = new Set(['synthesisPanel']);
function syncModalChrome() {
  const anyModal = !!document.querySelector('.modal-card:not(.hidden)') || paused;
  app.classList.toggle('modal-open', anyModal);
}
function releaseTouchControls() {
  joystick.id = null;
  joystick.x = 0;
  joystick.y = 0;
  const knobEl = $('#joystickKnob');
  if (knobEl) knobEl.style.transform = 'translate(0,0)';
  lookPointer = null;
}
function openModal(id) {
  modalOpen = true;
  openModalId = id;
  modalOpenedAt = performance.now();
  releaseTouchControls();
  document.exitPointerLock?.();
  $('#' + id).classList.remove('hidden');
  syncModalChrome();
}

function closeModal(id) {
  $('#' + id).classList.add('hidden');
  if (openModalId === id) openModalId = null;
  modalOpen = !!document.querySelector('.modal-card:not(.hidden)');
  syncModalChrome();
  if (!modalOpen && !isTouch) setTimeout(lockPointer, 80);
}

// Ketuk di luar kartu menutup panel yang boleh ditutup (UJI / TAFSIR).
document.addEventListener('pointerup', (event) => {
  if (!openModalId || !closableModals.has(openModalId)) return;
  if (performance.now() - modalOpenedAt < 450) return;
  if (event.target.closest?.('.modal-card, .round-action, .sys-btn, .modal-card *')) return;
  const card = $('#' + openModalId);
  if (card && !card.contains(event.target)) {
    if (openModalId === 'synthesisPanel') closeSynthesis();
    else closeModal(openModalId);
  }
});

function showToast(text, duration = 3100) {
  const toast = $('#toast');
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

function setPrompt(text = '') {
  const prompt = $('#worldPrompt');
  prompt.textContent = text;
  prompt.classList.toggle('show', !!text);
}

function updateObjective() {
  const objective = $('#objective');
  if (enemy.resolved) objective.textContent = 'Jelajahi desa setelah keputusanmu';
  else if (enemyBroken) objective.textContent = 'Tentukan nasib Roh Ladang';
  else if (!granted) objective.textContent = 'Terima pemberian pertamamu';
  else if (archive.formula < 100) objective.textContent = 'Analisis Roh Ladang (Q) hingga formulanya Terverifikasi';
  else objective.textContent = 'Lumpuhkan mekanisme Roh Ladang dengan sihirmu';
}

const archiveText = {
  formula: ['Formula proyektil roh — belum direkam', 'Terekam: proyektil energi merah, lintasan lurus ke target.', 'Struktur terbaca: inti energi terbentuk di dada roh sebelum ditembakkan.', 'TERVERIFIKASI — formula tersimpan di Archive dan siap dipakai.'],
  mechanism: ['Mekanisme roh — belum dianalisis', 'Teramati: roh terikat pada batu penanda di belakangnya.', 'Mekanisme: penanda adalah jangkar; roh kembali ke sana di antara serangan.', 'TERVERIFIKASI — kelemahan: serang saat ia tertegun (lonceng) untuk kerusakan besar.'],
  identity: ['Identitas roh — serpihan cerita (bonus)', 'Serpihan: ia menunggu seseorang yang tak pernah kembali.', 'Serpihan: amarahnya adalah takut ditinggalkan yang membusuk.', '“Aku tetap menjaga… karena jika pergi, siapa yang akan menunggunya?”'],
};
function tierIndex(v) { return v >= 100 ? 3 : v >= 75 ? 2 : v >= 40 ? 1 : 0; }
let lastArchiveSnapshot = '';
function updateArchiveUI(force = false) {
  const snap = `${tierIndex(archive.formula)}|${tierIndex(archive.mechanism)}|${tierIndex(archive.identity)}`;
  if (snap === lastArchiveSnapshot && !force) return;
  lastArchiveSnapshot = snap;
  const verified = [archive.formula, archive.mechanism, archive.identity].filter((v) => v >= 100).length;
  $('#evidenceCount').textContent = `${verified} / 3`;
  $$('.evidence').forEach((item) => {
    const key = item.dataset.key;
    const v = archive[key] ?? 0;
    item.classList.toggle('locked', v < 100);
    item.classList.toggle('revealed', v >= 100);
    item.querySelector('p').textContent = archiveText[key][tierIndex(v)];
  });
  updateObjective();
}
function archiveGain(key, amount, now) {
  const before = tierIndex(archive[key]);
  archive[key] = Math.min(100, archive[key] + amount);
  const after = tierIndex(archive[key]);
  if (after > before) {
    cognitiveLoad = Math.min(130, cognitiveLoad + 11);
    tone(523, .14, 'sine', .04);
    showToast(`Archive · ${key === 'formula' ? 'Formula proyektil' : key === 'mechanism' ? 'Mekanisme roh' : 'Identitas roh'}: ${archiveTierName(archive[key])}`, 2600);
    if (key === 'formula' && archive[key] >= 100 && !ownedFormulas.has('proyektilRoh')) {
      ownFormula('proyektilRoh');
      showToast('Formula Terverifikasi masuk Archive: “Proyektil Roh” kini bisa kamu pakai & sintesis.', 4200);
    }
    if (key === 'mechanism' && archive[key] >= 100) showToast('Kelemahan terverifikasi: roh menerima kerusakan besar saat tertegun lonceng.', 4200);
  }
  updateArchiveUI();
}
function ownFormula(key, silent = false) {
  if (ownedFormulas.has(key)) return;
  ownedFormulas.add(key);
  const empty = spellSlots.indexOf(null);
  if (empty >= 0) spellSlots[empty] = key;
  updateSpellBar();
  if (!silent) tone(659, .2, 'sine', .04);
}
function updateSpellBar() {
  $$('.spell-slot').forEach((el, i) => {
    const key = spellSlots[i];
    el.classList.toggle('selected', i === selectedSlot);
    el.classList.toggle('empty', !key);
    el.querySelector('span').textContent = key ? FORMULAS[key].name : 'Kosong';
  });
}
function updateResourceUI() {
  $('#manaValue').textContent = Math.round(player.mana);
  $('#manaFill').style.width = `${(player.mana / player.maxMana) * 100}%`;
  $('#temporalFill').style.width = `${Math.min(100, (temporalLoad / 120) * 100)}%`;
  $('#cognitiveFill').style.width = `${Math.min(100, (cognitiveLoad / 130) * 100)}%`;
  $$('#pdDots i').forEach((dot, i) => dot.classList.toggle('on', i < player.pdCharges));
  const hpFill = $('#enemyHpFill');
  if (hpFill) hpFill.style.width = `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%`;
}

function updateClarity() {
  const value = Math.max(0, Math.round(player.clarity));
  $('#clarityValue').textContent = value;
  $('#clarityFill').style.width = `${value}%`;
  $('#clarityFill').style.background = value < 35 ? 'linear-gradient(90deg,#e85c59,#ff9b78)' : 'linear-gradient(90deg,#70dfba,#c4ffdb)';
  app.classList.toggle('low-clarity', value < 35 && gameState === 'playing');
}

// --- Compass: cardinal points plus markers for the spirit and the bell. ---
function wrapAngle(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }
function yawTowards(target) { return Math.atan2(-(target.x - player.position.x), -(target.z - player.position.z)); }
function placeCompassMark(el, worldYaw, hide) {
  if (!el) return;
  const rel = wrapAngle(worldYaw - player.yaw);
  const x = (rel / Math.PI) * 165;
  el.style.transform = `translate(calc(-50% + ${x.toFixed(1)}px), -50%)`;
  el.style.opacity = hide || Math.abs(rel) > 2.55 ? 0 : 1;
}
const cardinalYaws = { N: 0, E: -Math.PI / 2, S: Math.PI, W: Math.PI / 2 };
function updateCompass() {
  if (gameState === 'menu') return;
  $$('#compassStrip .cardinal').forEach((el) => placeCompassMark(el, cardinalYaws[el.dataset.mark], false));
  placeCompassMark($('#compassEnemy'), yawTowards(enemy.group.position), enemy.resolved || !enemy.group.visible);
  if (bell) placeCompassMark($('#compassBell'), yawTowards(bell.position), false);
}

// --- Pause & mute ---
function setPaused(value) {
  if (value && (gameState !== 'playing' || modalOpen)) return;
  if (!value && !paused) return;
  paused = value;
  modalOpen = value;
  $('#pauseScreen').classList.toggle('active', value);
  if (value) document.exitPointerLock?.();
  else if (!isTouch) setTimeout(lockPointer, 80);
}
function setMuted(value) {
  muted = value;
  if (masterGain) masterGain.gain.value = value ? 0 : 1;
  const btn = $('#muteBtn');
  if (btn) { btn.classList.toggle('off', value); btn.textContent = value ? '\u2715' : '\u266A'; }
}

function damage(amount) {
  const now = performance.now() / 1000;
  if (now < player.invulnerableUntil || gameState !== 'playing') return;
  if (now < shieldUntil) {
    spawnRing(player.position, 0x8ddbd2, 1.6);
    tone(660, .1, 'sine', .04);
    showToast('Perisai menahan serangan.', 900);
    return;
  }
  player.clarity -= amount;
  player.invulnerableUntil = now + .55;
  updateClarity();
  $('#damageFlash').classList.add('hit');
  setTimeout(() => $('#damageFlash').classList.remove('hit'), 170);
  tone(82, .22, 'sawtooth', .07);
  if (player.clarity <= 0) loseClarity();
}

function loseClarity() {
  gameState = 'fading';
  showToast('Kamu pingsan dan dibangunkan di penanda desa. Archive-mu utuh — pengetahuan tidak ikut hilang.', 2800);
  document.exitPointerLock?.();
  setTimeout(() => {
    player.position.set(0, 1.68, 10);
    player.clarity = 100;
    player.mana = player.maxMana;
    player.pdCharges = 3;
    enemy.hp = enemy.maxHp;
    enemyBroken = false;
    enemy.kbActive = false;
    enemy.kbVel.set(0, 0, 0);
    enemy.kbY = 0;
    enemy.group.rotation.x = 0;
    updateResourceUI();
    player.invulnerableUntil = performance.now() / 1000 + 2;
    enemy.group.position.copy(enemy.anchor);
    enemy.rushing = false;
    projectiles.splice(0).forEach((p) => scene.remove(p.mesh));
    updateClarity();
    gameState = 'playing';
    if (!isTouch) lockPointer();
  }, 1800);
}

function isAimingAtEnemy(threshold = .91, maxDistance = 28) {
  camera.getWorldDirection(tempV);
  tempV2.copy(enemy.group.position).add(new THREE.Vector3(0, 2.45, 0)).sub(camera.position);
  const distance = tempV2.length();
  tempV2.normalize();
  return distance < maxDistance && tempV.dot(tempV2) > threshold;
}

// === Mata kiri: Appraisal (toggle) ===
function toggleAppraisal() {
  if (gameState !== 'playing' || modalOpen) return;
  appraisalOn = !appraisalOn;
  $('#observeBtn')?.classList.toggle('eye-on', appraisalOn);
  setPrompt(appraisalOn ? 'Appraisal aktif — arahkan pandangan ke roh…' : '');
  tone(appraisalOn ? 330 : 220, .12, 'sine', .03);
}

// === Mata kanan: Future Sight (toggle) ===
function toggleFutureSight() {
  if (gameState !== 'playing' || modalOpen) return;
  if (!futureSightOn && fsLocked) { showToast('Mata kanan masih gelap. Biarkan beban temporalnya turun dulu.'); return; }
  futureSightOn = !futureSightOn;
  $('#testBtn')?.classList.toggle('eye-on', futureSightOn);
  tone(futureSightOn ? 392 : 262, .12, 'sine', .03);
}

function fsStage() { return temporalLoad >= 120 ? 3 : temporalLoad >= 60 ? 2 : temporalLoad >= 30 ? 1 : 0; }

function updateEyes(dt, now) {
  // Beban & pemulihan temporal (bertahap: ringan cepat, berat lambat)
  if (futureSightOn) temporalLoad += dt;
  else {
    const rate = temporalLoad < 30 ? 4 : temporalLoad < 60 ? 1.1 : 0.45;
    temporalLoad = Math.max(0, temporalLoad - rate * dt);
  }
  if (temporalLoad >= 120 && futureSightOn) {
    futureSightOn = false;
    fsLocked = true;
    $('#testBtn')?.classList.remove('eye-on');
    showToast('TEMPORAL SHUTDOWN — mata kanan gelap sementara. Beban harus turun di bawah separuh.', 4200);
    tone(90, .5, 'sawtooth', .05);
  }
  if (fsLocked && temporalLoad < 55) { fsLocked = false; showToast('Penglihatan mata kanan kembali jernih.'); }
  const stage = fsStage();
  app.classList.toggle('fs-stage1', futureSightOn && stage === 1);
  app.classList.toggle('fs-stage2', futureSightOn && stage >= 2);

  // Beban kognitif Appraisal (menumpuk, tanpa shutdown — hanya memperlambat)
  if (appraisalOn) cognitiveLoad = Math.min(130, cognitiveLoad + dt * 2.1);
  else cognitiveLoad = Math.max(0, cognitiveLoad - dt * 4.5);
  const cogFactor = cognitiveLoad > 90 ? 0.3 : cognitiveLoad > 60 ? 0.55 : 1;

  // Kemajuan Archive saat Appraisal aktif
  if (appraisalOn && gameState === 'playing' && !modalOpen && enemy.group.visible && !enemy.resolved) {
    const dist = horizontalDistance(player.position, enemy.group.position);
    if (dist < 30 && isAimingAtEnemy(0.72, 32)) {
      archiveGain('mechanism', dt * 8.5 * cogFactor, now);
      if (projectiles.length) archiveGain('formula', dt * 11 * cogFactor, now);
      if (now < enemy.stunnedUntil) archiveGain('identity', dt * 13 * cogFactor, now);
    }
  }

  // Ghost & lintasan Future Sight
  const showFs = futureSightOn && gameState !== 'menu';
  fsGhost.visible = showFs && enemy.group.visible;
  fsLines.visible = showFs;
  if (showFs) {
    if (enemy.lastPos) enemyVelHistory.push({ t: now, v: enemy.group.position.clone().sub(enemy.lastPos).divideScalar(Math.max(dt, 0.001)) });
    while (enemyVelHistory.length && now - enemyVelHistory[0].t > 0.6) enemyVelHistory.shift();
    let vel = new THREE.Vector3();
    if (enemyVelHistory.length) {
      vel = stage >= 2
        ? (enemyVelHistory[0]?.v.clone() || vel) // tahap 2: prediksi memakai data lama -> menyesatkan
        : enemyVelHistory[enemyVelHistory.length - 1].v.clone();
    }
    fsGhost.position.copy(enemy.group.position).addScaledVector(vel, 1);
    fsGhost.rotation.y = enemy.group.rotation.y;
    if (stage >= 2) fsGhost.position.x += Math.sin(now * 7.3) * 0.22;
    let li = 0;
    for (const pr of projectiles) {
      if (li >= FS_MAX_LINES) break;
      const from = pr.mesh.position;
      const to = from.clone().addScaledVector(pr.velocity, 1);
      if (stage >= 2) to.x += Math.sin(now * 9 + li) * 0.3;
      fsLinePos[li * 6] = from.x; fsLinePos[li * 6 + 1] = from.y; fsLinePos[li * 6 + 2] = from.z;
      fsLinePos[li * 6 + 3] = to.x; fsLinePos[li * 6 + 4] = to.y; fsLinePos[li * 6 + 5] = to.z;
      li++;
    }
    for (let i = li * 6; i < fsLinePos.length; i++) fsLinePos[i] = 0;
    fsLineGeo.attributes.position.needsUpdate = true;
  }
  enemy.lastPos = enemy.group.position.clone();
  updateResourceUI();
}

// === Sihir pemain ===
function castSelected() {
  if (gameState !== 'playing' || modalOpen) return;
  const key = spellSlots[selectedSlot];
  const now = performance.now() / 1000;
  if (!key) { showToast('Slot ini kosong. Terima pemberian atau rancang formula lewat Synthesis (T).'); return; }
  const f = FORMULAS[key];
  if ((spellCooldowns[key] || 0) > now) return;
  if (player.mana < f.cost) { showToast('Mana tidak cukup.'); tone(140, .12, 'square', .03); return; }
  player.mana -= f.cost;
  spellCooldowns[key] = now + f.cd;
  tone(key === 'perisai' || key === 'perisaiDuri' ? 520 : 740, .09, 'triangle', .035);
  if (f.kind === 'shield') {
    shieldUntil = now + (key === 'perisaiDuri' ? 3.6 : 2.5);
    spawnRing(player.position, 0x8ddbd2, 2.2);
    showToast('Perisai Sekejap aktif — proyektil roh tertahan.', 1500);
    updateResourceUI();
    return;
  }
  camera.getWorldDirection(tempV);
  const proj = mesh(new THREE.IcosahedronGeometry(0.13, 0), new THREE.MeshBasicMaterial({ color: f.color }), { shadow: false });
  proj.position.copy(camera.position).addScaledVector(tempV, 0.7);
  proj.add(new THREE.PointLight(f.color, 1.2, 3, 2));
  scene.add(proj);
  playerProjectiles.push({ mesh: proj, velocity: tempV.clone().multiplyScalar(f.speed), formula: key, born: now });
  spawnBurst(proj.position, f.color, 5, 0.7);
}

function hitEnemy(formulaKey, atPos, dirVel = null) {
  if (enemyBroken || enemy.resolved) return;
  const f = FORMULAS[formulaKey];
  const now = performance.now() / 1000;
  let dmg = f.dmg;
  const weaknessHit = now < enemy.stunnedUntil && archive.mechanism >= 100;
  if (weaknessHit) { dmg *= 1.8; setPrompt('KELEMAHAN TERKENA!'); setTimeout(() => setPrompt(''), 700); }
  enemy.hp = Math.max(0, enemy.hp - dmg);
  spawnBurst(atPos, f.color, 16, 2);
  tone(180, .1, 'sawtooth', .04);
  applyHitReaction(formulaKey, dmg, dirVel, weaknessHit, now);
  updateResourceUI();
  if (enemy.hp <= 0) breakMechanism(now);
}

// Reaksi kena: flinch -> recoil -> knockback -> launch, sesuai kekuatan serangan.
function applyHitReaction(formulaKey, dmg, dirVel, weaknessHit, now) {
  const cfg = KNOCKBACK_CONFIG;
  const f = FORMULAS[formulaKey];
  if (!f || f.dmg <= 0) return;
  const dir = new THREE.Vector3();
  if (dirVel) dir.copy(dirVel).setY(0);
  if (dir.lengthSq() < 0.01) dir.copy(enemy.group.position).sub(player.position).setY(0);
  dir.normalize();

  let tier = 'light';
  if ((weaknessHit && dmg >= 24) || dmg >= 30) tier = 'launch';
  else if (f.kind === 'knock' || dmg >= 20) tier = 'heavy';
  else if (dmg >= 12) tier = 'medium';

  const impulse = tier === 'launch' ? cfg.launchImpulse : tier === 'heavy' ? cfg.heavyImpulse : tier === 'medium' ? cfg.mediumImpulse : cfg.lightImpulse;
  enemy.kbVel.addScaledVector(dir, impulse);
  if (enemy.kbVel.length() > cfg.maxSpeed) enemy.kbVel.setLength(cfg.maxSpeed);
  if (tier === 'launch') {
    enemy.kbVy = Math.max(enemy.kbVy, cfg.launchVertical);
    enemy.launched = true;
    enemy.bounced = false;
    enemy.skidTimer = 0;
  }
  enemy.kbActive = true;
  enemy.kbWallHitDone = false;
  enemy.reactUntil = now + (tier === 'launch' ? 0.7 : tier === 'heavy' ? 0.5 : tier === 'medium' ? 0.35 : 0.22);
  enemy.reactPower = tier === 'launch' ? 1 : tier === 'heavy' ? 0.75 : tier === 'medium' ? 0.45 : 0.2;
  const stagger = tier === 'launch' || tier === 'heavy' ? cfg.staggerHeavy : tier === 'medium' ? cfg.staggerMedium : cfg.staggerLight;
  enemy.kbStaggerUntil = Math.max(enemy.kbStaggerUntil, now + stagger);
  enemy.attackTimer += tier === 'heavy' || tier === 'launch' ? 1.4 : tier === 'medium' ? 0.8 : 0.25;
  if (tier !== 'light') setPrompt(tier === 'launch' ? 'TERLONTAR!' : tier === 'heavy' ? 'HANTAMAN KERAS' : '');
  if (tier !== 'light') setTimeout(() => setPrompt(''), 650);
}

function breakMechanism(now) {
  enemyBroken = true;
  enemy.kbActive = false;
  enemy.kbVel.set(0, 0, 0);
  enemy.kbY = 0;
  enemy.group.rotation.x = 0;
  enemy.revealed = true;
  futureSightOn = false;
  archive.identity = 100;
  updateArchiveUI(true);
  $('#enemyState').textContent = 'Penjaga yang tak pernah dibebaskan';
  spawnBurst(enemy.group.position.clone().add(new THREE.Vector3(0, 2.2, 0)), 0x9ef2c9, 52, 3.2);
  spawnRing(enemy.group.position, 0x9ef2c9, 8);
  chord([392, 494, 659], .8);
  showToast('Mekanisme lumpuh. Identitasnya terbaca: penjaga yang takut ditinggalkan. Tentukan nasibnya.', 4200);
  setTimeout(() => { if (!enemy.resolved) openModal('resolvePanel'); }, 1600);
}

// === Interaksi konteks (F): lonceng & penanda ===
function interact() {
  if (gameState !== 'playing' || modalOpen) return;
  const now = performance.now() / 1000;
  if (bell && horizontalDistance(player.position, bell.position) < 4.5) { ringBell(now); return; }
  if (horizontalDistance(player.position, enemy.anchor) < 5) { archiveGain('identity', 18, now); showToast('Batu penanda: nama yang ditunggu terukir di sini, hampir terhapus waktu.', 3200); return; }
  showToast('Tidak ada yang bisa diajak berinteraksi di dekat sini. Lonceng tua ada di barat ladang.', 2600);
}

function ringBell(now) {
  enemy.stunnedUntil = now + 4.6;
  enemy.bellRecentUntil = now + 6.3;
  enemy.rushing = false;
  if (bell?.userData.body) {
    bell.userData.body.rotation.z = .35;
    setTimeout(() => { if (bell?.userData.body) bell.userData.body.rotation.z = 0; }, 650);
  }
  spawnRing(bell.position, 0xffd267, 12);
  setTimeout(() => spawnRing(enemy.group.position, 0xffd267, 5), 230);
  spawnBurst(enemy.group.position.clone().add(new THREE.Vector3(0, 2.3, 0)), 0xffd267, 25, 1.7);
  bellSound();
  if (appraisalOn) archiveGain('identity', 22, now);
  showToast('Suara lonceng mencapai ladang. Roh itu berhenti… dan menunduk. Serang sekarang bila Mekanismenya sudah terverifikasi.', 3800);
}

function dodge() {
  if (gameState !== 'playing' || modalOpen) return;
  const now = performance.now() / 1000;
  if (now < player.invulnerableUntil - .2) return;
  let dir = player.lastMove.clone();
  if (dir.lengthSq() < .08) {
    dir.copy(player.position).sub(enemy.group.position).setY(0).normalize();
  } else dir.normalize();
  player.dodgeVelocity.copy(dir).multiplyScalar(8.2);
  player.fovKick = 8;
  player.invulnerableUntil = now + .58;
  tone(240, .08, 'sine', .025);
}

// Penyelamat terakhir: hanya saat serangan di luar pandangan atau pemain terkunci fokus.
function tryPerfectDodge(projectilePos, now) {
  if (player.pdCharges <= 0 || now < player.pdReadyAt) return false;
  camera.getWorldDirection(tempV);
  tempV2.copy(projectilePos).sub(player.position).setY(0).normalize();
  const fromBlindSide = tempV.setY(0).normalize().dot(tempV2) < 0.15;
  const lockedInFocus = appraisalOn || synthesisOpen;
  if (!fromBlindSide && !lockedInFocus) return false;
  player.pdCharges--;
  player.pdReadyAt = now + 2;
  tempV2.copy(player.position).sub(projectilePos).setY(0).normalize();
  player.dodgeVelocity.copy(tempV2).multiplyScalar(10.5);
  player.fovKick = 10;
  player.invulnerableUntil = now + .7;
  setPrompt('PERFECT DODGE');
  setTimeout(() => setPrompt(''), 800);
  spawnBurst(player.position.clone().add(new THREE.Vector3(0, 1, 0)), 0xffd267, 18, 2.2);
  tone(880, .16, 'sine', .05);
  setTimeout(() => tone(1174, .22, 'sine', .04), 70);
  updateResourceUI();
  return true;
}

// === Synthesis ===
let synthPicks = [];
function openSynthesis() {
  if (gameState !== 'playing' || modalOpen) return;
  synthesisOpen = true;
  synthPicks = [];
  renderSynthesis();
  openModal('synthesisPanel');
}
function synthesisResultKey() {
  if (synthPicks.length !== 2) return null;
  if (synthPicks[0] === synthPicks[1]) return null;
  return RECIPES[[...synthPicks].sort().join('+')] || null;
}
function renderSynthesis() {
  const list = $('#synthList');
  list.innerHTML = '';
  const owned = [...ownedFormulas];
  if (!owned.length) list.innerHTML = '<p class="modal-copy">Archive masih kosong. Analisis roh (Q) atau terima pemberian dulu.</p>';
  owned.forEach((key) => {
    const b = document.createElement('button');
    if (synthPicks.includes(key)) b.classList.add('picked');
    b.innerHTML = `<i>${synthPicks.includes(key) ? '✓' : '·'}</i><span><b>${FORMULAS[key].name}</b><small>Mana ${FORMULAS[key].cost} · kerusakan ${FORMULAS[key].dmg}</small></span>`;
    onTap(b, () => {
      if (synthPicks.includes(key)) synthPicks = synthPicks.filter((k) => k !== key);
      else { synthPicks.push(key); if (synthPicks.length > 2) synthPicks.shift(); }
      renderSynthesis();
    });
    list.appendChild(b);
  });
  const resultKey = synthesisResultKey();
  const resultEl = $('#synthResult');
  const craftBtn = $('#synthCraft');
  if (synthPicks.length === 2) {
    if (resultKey) {
      resultEl.textContent = `Kombinasi terbaca jelas → “${FORMULAS[resultKey].name}” (kerusakan ${FORMULAS[resultKey].dmg}, mana ${FORMULAS[resultKey].cost}).`;
      craftBtn.disabled = ownedFormulas.has(resultKey);
      if (craftBtn.disabled) resultEl.textContent += ' Sudah kamu miliki.';
    } else {
      resultEl.textContent = 'Kombinasi ini belum punya hubungan mekanis yang jelas. Tetap bisa dirancang — hasilnya versi lemah dan tidak stabil.';
      craftBtn.disabled = false;
    }
  } else {
    resultEl.textContent = owned.length ? `Pilih ${2 - synthPicks.length} formula lagi.` : 'Belum ada kombinasi dipilih.';
    craftBtn.disabled = true;
  }
}
function craftSynthesis() {
  if (synthPicks.length !== 2) return;
  const resultKey = synthesisResultKey();
  if (resultKey) {
    ownFormula(resultKey);
    showToast(`Formula baru dirancang: “${FORMULAS[resultKey].name}”.`, 3600);
    chord([523, 659, 784], .6);
  } else {
    const [a, b] = synthPicks.map((k) => FORMULAS[k]);
    const weakKey = 'lemah' + Date.now();
    FORMULAS[weakKey] = { name: `Sintesis Belum Stabil`, cost: Math.round((a.cost + b.cost) / 2), cd: 1.2, dmg: Math.max(3, Math.round(((a.dmg + b.dmg) / 2) * 0.45)), speed: 20, color: 0xcfd8dc, kind: 'bolt' };
    ownFormula(weakKey);
    showToast('Rancangan dipaksakan: hasilnya lemah dan tidak stabil. Sempurnakan di tempat aman kelak.', 3800);
    tone(160, .3, 'sawtooth', .04);
  }
  closeSynthesis();
}
function closeSynthesis() {
  synthesisOpen = false;
  closeModal('synthesisPanel');
}

const outcomes = {
  purify: {
    sigil: '○', title: 'Penjaga yang Memilih',
    text: 'Kamu memisahkan rasa takut dari tugasnya. Roh itu tetap berada di ladang—bukan karena terikat, tetapi karena untuk pertama kalinya ia memilih sendiri.',
    quote: '“Menunggu dan memilih untuk tinggal ternyata bukan hal yang sama.”',
    sky: 0xa8dbd8,
  },
  bind: {
    sigil: '◇', title: 'Saksi yang Dibawa Pergi',
    text: 'Kamu mengikat ingatannya sebagai Saksi. Ia akan membantumu membaca rasa kehilangan, tetapi sejak malam itu lonceng Desa Aster tidak pernah lagi menghasilkan suara.',
    quote: '“Jika aku ikut denganmu, biarkan tempat ini belajar menunggu tanpa aku.”',
    sky: 0x8cbcc8,
  },
  destroy: {
    sigil: '×', title: 'Ladang Tanpa Penunggu',
    text: 'Ancaman berakhir seketika. Keesokan harinya ladang terasa aman, tetapi tak seorang pun di desa dapat mengingat siapa yang dahulu mereka tunggu.',
    quote: '“Sesuatu telah hilang. Tidak ada yang dapat mengatakan apa.”',
    sky: 0x8297a5,
  },
};

function resolveEnemy(type) {
  if (!enemy.revealed || $('#resolvePanel').classList.contains('hidden')) return;
  $('#resolvePanel').classList.add('hidden');
  openModalId = null;
  syncModalChrome();
  enemy.resolved = true;
  enemy.revealed = true;
  gameState = 'resolved';
  modalOpen = true;
  const outcome = outcomes[type];
  $('#resultSigil').textContent = outcome.sigil;
  $('#resultTitle').textContent = outcome.title;
  $('#resultText').textContent = outcome.text;
  $('#resultQuote').textContent = outcome.quote;
  scene.background.setHex(outcome.sky);
  scene.fog.color.setHex(outcome.sky);
  skyUniforms.topColor.value.setHex(outcome.sky);
  enemy.group.userData.outcome = type;
  if (type === 'destroy') {
    spawnBurst(enemy.group.position.clone().add(new THREE.Vector3(0, 2, 0)), 0xff776d, 70, 4.4);
    enemy.group.visible = false;
    tone(70, .65, 'sawtooth', .06);
  } else {
    enemy.group.visible = true;
    spawnBurst(enemy.group.position.clone().add(new THREE.Vector3(0, 2, 0)), type === 'purify' ? 0x9ef2c9 : 0xffd267, 65, 3.6);
    enemy.group.scale.setScalar(type === 'purify' ? .76 : .64);
    chord(type === 'purify' ? [392, 523, 659] : [330, 440, 554], 1.0);
  }
  localStorage.setItem('duel-interpretasi-outcome', type);
  localStorage.removeItem('duel-interpretasi-checkpoint');
  setTimeout(() => $('#resultScreen').classList.add('active'), 1000);
}

function horizontalDistance(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.hypot(dx, dz);
}

function resolveWorldCollisions(next) {
  const limit = 30;
  next.x = THREE.MathUtils.clamp(next.x, -limit, limit);
  next.z = THREE.MathUtils.clamp(next.z, -29, 27);
  for (const col of colliders) {
    const dx = next.x - col.x;
    const dz = next.z - col.z;
    const dist = Math.hypot(dx, dz);
    const min = col.r + .42;
    if (dist < min && dist > .001) {
      next.x = col.x + (dx / dist) * min;
      next.z = col.z + (dz / dist) * min;
    }
  }
}

function getMoveInput() {
  let x = joystick.x;
  let y = -joystick.y;
  if (keys.has('KeyA')) x -= 1;
  if (keys.has('KeyD')) x += 1;
  if (keys.has('KeyW')) y += 1;
  if (keys.has('KeyS')) y -= 1;
  const length = Math.hypot(x, y);
  if (length > 1) { x /= length; y /= length; }
  return { x, y };
}

function updatePlayer(dt, now) {
  if (gameState !== 'playing' || modalOpen || actionLock) {
    player.lastMove.multiplyScalar(.75);
    updateCamera();
    return;
  }
  const input = getMoveInput();
  const forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  const right = new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
  const move = forward.multiplyScalar(input.y).add(right.multiplyScalar(input.x));
  if (move.lengthSq() > 1) move.normalize();
  player.lastMove.lerp(move, Math.min(1, dt * 10));

  // Sprint with stamina, head-bob, camera roll and a dynamic FOV.
  const wantsSprint = (keys.has('ShiftLeft') || keys.has('ShiftRight')) && input.y > 0.25 && move.length() > 0.2;
  if (player.sprintExhausted && player.stamina > 25) player.sprintExhausted = false;
  player.sprinting = wantsSprint && !player.sprintExhausted && player.stamina > 1;
  player.stamina = THREE.MathUtils.clamp(player.stamina + (player.sprinting ? -26 : 17) * dt, 0, 100);
  if (player.stamina <= 0) player.sprintExhausted = true;
  const speed = player.sprinting ? 6.4 : 4.15;
  const stepBefore = player.position.clone();
  const next = player.position.clone().addScaledVector(move, speed * dt).addScaledVector(player.dodgeVelocity, dt);
  player.dodgeVelocity.multiplyScalar(Math.pow(.03, dt));
  const moveAmount = Math.min(1, move.length());
  player.bobPhase += dt * (player.sprinting ? 11.5 : 8.2) * moveAmount;
  next.y = 1.68 + Math.sin(player.bobPhase * 2) * 0.028 * moveAmount;
  player.roll = THREE.MathUtils.lerp(player.roll, -input.x * 0.016 - player.dodgeVelocity.x * 0.004, Math.min(1, dt * 9));
  player.fovKick = THREE.MathUtils.lerp(player.fovKick, 0, Math.min(1, dt * 5));
  const targetFov = 68 + (player.sprinting ? 7 : 0) + player.fovKick;
  if (Math.abs(camera.fov - targetFov) > 0.02) {
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, Math.min(1, dt * 8));
    camera.updateProjectionMatrix();
  }
  resolveWorldCollisions(next);
  player.position.copy(next);

  // Soft synthesized footsteps, alternating pitch.
  player.stepDistance += stepBefore.setY(0).distanceTo(player.position.clone().setY(0));
  if (player.stepDistance > (player.sprinting ? 3.1 : 2.35) && moveAmount > 0.25) {
    player.stepDistance = 0;
    tone(player.bobPhase % 2 < 1 ? 82 : 71, 0.07, 'triangle', 0.012);
  }
  updateStaminaUI();
  updateCamera();

  const enemyDist = horizontalDistance(player.position, enemy.group.position);
  if (enemyDist < 24) enemy.active = true;
  if (player.testMode === 'retreat' && (enemyDist > player.testStartDistance + 3.2 || now > player.retreatDeadline)) {
    player.testMode = null;
    enemy.rushing = true;
    enemy.rushEnd = now + 4.5;
    enemy.rushRecentUntil = now + 6.5;
    enemy.enragedUntil = now + 3;
    showToast('Roh itu meninggalkan posnya dan mengejarmu dengan panik. Berbalik dan AMATI!', 4200);
    updateObjective();
    tone(110, .4, 'sawtooth', .06);
  }
  player.mana = Math.min(player.maxMana, player.mana + dt * 7);
  if (horizontalDistance(player.position, new THREE.Vector3(0, 0, 13)) < 4 && horizontalDistance(player.position, enemy.group.position) > 20 && player.pdCharges < 3) {
    player.pdCharges = 3;
    updateResourceUI();
  }
  player.saveTimer += dt;
  if (player.saveTimer > 6) { player.saveTimer = 0; saveCheckpoint(); }
}

// --- Knockback controller: momentum, sub-step anti-tunneling, dinding nyata ---
function onWallImpact(contact, normal, speed, now) {
  const cfg = KNOCKBACK_CONFIG;
  enemy.kbWallHitDone = true;
  const n = normal.clone();
  const into = -enemy.kbVel.dot(n);
  const tangential = enemy.kbVel.clone().addScaledVector(n, into); // vel - (vel.n)n  (into = -vel.n)
  enemy.kbVel.copy(tangential.multiplyScalar(0.35)).addScaledVector(n, cfg.wallRecoil + speed * cfg.wallRecoilPerSpeed);
  enemy.kbStaggerUntil = Math.max(enemy.kbStaggerUntil, now + cfg.staggerWall);
  enemy.reactUntil = now + 0.6;
  enemy.reactPower = 1;
  spawnWallImpact(contact, n, speed);
  spawnDebris(contact, n, Math.min(3, speed * 0.35));
  triggerImpactFrame({
    intensity: THREE.MathUtils.clamp(0.45 + speed * 0.055, 0.5, 0.95),
    position: contact.clone(),
    direction: n.clone(),
    style: speed > 7 ? 'silhouette' : 'radial',
    duration: speed > 7 ? 4 : 3,
  });
  tone(70, .25, 'sawtooth', .06);
  setPrompt('TABRAKAN DINDING!');
  setTimeout(() => setPrompt(''), 800);
}

function spawnWallImpact(contact, normal, speed) {
  spawnBurst(contact, 0xffffff, Math.round(10 + speed * 2), 2.4);
  spawnBurst(contact, 0x21333a, Math.round(8 + speed), 1.8);
  const groundRing = contact.clone(); groundRing.y = 0.09;
  spawnRing(groundRing, 0xffffff, 3 + speed * 0.35);
  // Retakan singkat yang menempel mengikuti arah normal permukaan.
  const crackMat = new THREE.MeshBasicMaterial({ color: 0x14202a, transparent: true, opacity: 0.85, depthWrite: false });
  const crack = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const shard = new THREE.Mesh(new THREE.BoxGeometry(0.34 + (i % 3) * 0.16, 0.028, 0.012), crackMat);
    shard.position.set((seeded(i * 3.3, -0.2, 0.2)), seeded(i * 7.7, -0.25, 0.3), 0);
    shard.rotation.z = seeded(i * 5.1, -1.1, 1.1);
    crack.add(shard);
  }
  crack.position.copy(contact);
  crack.lookAt(contact.clone().add(normal));
  scene.add(crack);
  wallMarks.push({ group: crack, mat: crackMat, age: 0, life: 2.4, grow: 0.22, baseOpacity: 0.85 });
}

function resolveKnockbackWalls(now) {
  const cfg = KNOCKBACK_CONFIG;
  const pos = enemy.group.position;
  const r = cfg.enemyRadius;
  // Batas dunia (dinding tak terlihat di tepi arena)
  const bounds = [
    { hit: pos.x > 30 - r, nx: -1, nz: 0, cx: 30, cz: pos.z },
    { hit: pos.x < -30 + r, nx: 1, nz: 0, cx: -30, cz: pos.z },
    { hit: pos.z > 27 - r, nx: 0, nz: -1, cx: pos.x, cz: 27 },
    { hit: pos.z < -29 + r, nx: 0, nz: 1, cx: pos.x, cz: -29 },
  ];
  for (const b of bounds) {
    if (!b.hit) continue;
    if (b.nx < 0) pos.x = 30 - r; else if (b.nx > 0) pos.x = -30 + r;
    if (b.nz < 0) pos.z = 27 - r; else if (b.nz > 0) pos.z = -29 + r;
    const normal = new THREE.Vector3(b.nx, 0, b.nz);
    const speed = -enemy.kbVel.dot(normal);
    const contact = new THREE.Vector3(b.cx, 1.6, b.cz);
    if (speed > cfg.wallImpactSpeed && !enemy.kbWallHitDone) onWallImpact(contact, normal, speed, now);
    else if (speed > 0) enemy.kbVel.addScaledVector(normal, speed); // hilangkan komponen menembus
  }
  // Collider lingkaran rumah/pohon yang sama dengan yang dipakai pemain
  for (const col of colliders) {
    const dx = pos.x - col.x;
    const dz = pos.z - col.z;
    const dist = Math.hypot(dx, dz);
    const min = col.r + r;
    if (dist >= min || dist < 0.0001) continue;
    const normal = new THREE.Vector3(dx / dist, 0, dz / dist);
    pos.x = col.x + normal.x * min;
    pos.z = col.z + normal.z * min;
    const speed = -enemy.kbVel.dot(normal);
    const contact = new THREE.Vector3(col.x + normal.x * col.r, 1.6, col.z + normal.z * col.r);
    if (speed > cfg.wallImpactSpeed && !enemy.kbWallHitDone) onWallImpact(contact, normal, speed, now);
    else if (speed > 0) enemy.kbVel.addScaledVector(normal, speed);
  }
}

function updateKnockback(dt, now) {
  const cfg = KNOCKBACK_CONFIG;
  const pos = enemy.group.position;
  const speed = enemy.kbVel.length();
  const steps = Math.max(1, Math.ceil((speed * dt) / 0.3)); // anti-tunneling
  const sdt = dt / steps;
  for (let i = 0; i < steps; i++) {
    pos.addScaledVector(enemy.kbVel, sdt);
    resolveKnockbackWalls(now);
  }
  // Vertikal: jatuh, menghantam tanah, dan memantul sekali bila masih kencang
  const wasAirborne = enemy.kbY > 0 || enemy.kbVy > 0;
  const vyBefore = enemy.kbVy;
  if (wasAirborne) {
    enemy.kbVy -= cfg.gravity * dt;
    enemy.kbY += enemy.kbVy * dt;
    if (enemy.kbY <= 0) {
      enemy.kbY = 0;
      const landingHard = vyBefore < -3.5;
      if (landingHard) {
        const at = pos.clone(); at.y = 0.4;
        spawnDebris(at, new THREE.Vector3(0, 1, 0), Math.min(3, speed * 0.3));
        spawnGroundMark(pos, 0.55 + Math.min(1.2, speed * 0.09), 4);
        spawnRing(pos.clone().setY(0.09), 0xd8d2c4, 3.5);
        tone(65, .2, 'sawtooth', .05);
        if (speed > 6 && !enemy.bounced) { enemy.kbVy = 2.3; enemy.bounced = true; }
      }
      if (enemy.kbVy <= 0) enemy.kbVy = 0;
      if (!enemy.bounced || enemy.kbVy === 0) enemy.launched = enemy.launched && speed > 5;
    }
  }
  pos.y = Math.sin(now * 2.1) * 0.055 + enemy.kbY;
  // Gesekan: sangat licin selagi terlontar (seperti video), normal setelahnya
  const damping = enemy.kbY > 0 ? cfg.dampingAir : enemy.launched ? cfg.dampingLaunched : cfg.dampingGround;
  enemy.kbVel.multiplyScalar(Math.exp(-damping * dt));
  // Menyeret tanah: puing kecil + bekas gesekan selama meluncur kencang di tanah
  if (enemy.kbY === 0 && enemy.kbVel.length() > 4) {
    enemy.skidTimer = (enemy.skidTimer || 0) - dt;
    if (enemy.skidTimer <= 0) {
      enemy.skidTimer = 0.07;
      const at = pos.clone(); at.y = 0.25;
      spawnDebris(at, enemy.kbVel.clone().normalize().negate(), 0.7);
      if (!enemy.lastSkidPos || enemy.lastSkidPos.distanceTo(pos) > 1.1) {
        enemy.lastSkidPos = pos.clone();
        spawnGroundMark(pos, 0.42, 5);
      }
    }
  }
  if (enemy.kbVel.length() < 2) enemy.launched = false;
  // Reaksi prosedural: tubuh condong & kepala tersentak mengikuti kekuatan
  const react = now < enemy.reactUntil ? enemy.reactPower : 0;
  enemy.group.rotation.x = -Math.min(0.45, enemy.kbVel.length() * 0.04) - react * 0.12;
  if (enemy.head) enemy.head.rotation.x = -react * 0.55;
  if (enemy.kbVel.length() < 0.45 && enemy.kbY === 0) {
    enemy.kbActive = false;
    enemy.kbVel.set(0, 0, 0);
    enemy.group.rotation.x = 0;
  }
}

function updateEnemy(dt, now) {
  const distance = horizontalDistance(player.position, enemy.group.position);
  const aimed = isAimingAtEnemy(.79);
  $('#crosshair').classList.toggle('target', aimed && distance < 28);
  $('#enemyTag').classList.toggle('visible', aimed && distance < 26 && enemy.group.visible);

  if (enemy.resolved) {
    enemy.group.rotation.y += dt * .12;
    enemy.group.position.y = Math.sin(now * 1.3) * .07;
    return;
  }
  if (gameState === 'revelation') {
    enemy.group.rotation.y += dt * .7;
    enemy.group.position.y = Math.sin(now * 2.5) * .14;
    enemy.aura.material.color.setHex(0x9ef2c9);
    enemy.aura.material.opacity = .55;
    enemy.aura.scale.setScalar(1.3 + Math.sin(now * 3) * .12);
    return;
  }

  enemy.group.position.y = Math.sin(now * 2.1) * .055;
  enemy.head.rotation.z = Math.sin(now * 1.7) * .045;
  enemy.aura.rotation.z += dt * .3;
  enemy.aura.scale.setScalar(1 + Math.sin(now * 3.2) * .08);
  enemy.threads.rotation.y -= dt * .22;
  if (enemy.runes) {
    enemy.runes.rotation.y += dt * (now < enemy.enragedUntil ? 1.6 : 0.45);
    enemy.runes.material.color.setHex(enemy.revealed ? 0x9ef2c9 : now < enemy.enragedUntil ? 0xff5a4e : 0xff8d84);
  }

  const flatTarget = tempV.set(player.position.x, enemy.group.position.y, player.position.z);
  enemy.group.lookAt(flatTarget);
  if (gameState === 'playing' && !modalOpen && enemy.kbActive && !enemyBroken) updateKnockback(dt, now);

  if (gameState !== 'playing' || modalOpen || !enemy.active || enemyBroken) return;
  if (now < enemy.stunnedUntil) {
    enemy.head.rotation.x = .42;
    $('#enemyState').textContent = 'Mengingat sesuatu';
    return;
  }
  if (now >= enemy.reactUntil && enemy.head) enemy.head.rotation.x = 0;
  $('#enemyState').textContent = enemyBroken ? 'Mekanisme lumpuh' : now < enemy.kbStaggerUntil ? 'Terpental…' : appraisalOn ? archiveTierName(Math.max(archive.mechanism, archive.formula)) : 'Tidak terbaca';
  if (enemy.kbActive || now < enemy.kbStaggerUntil) return; // knockback/stagger menguasai tubuh; serangan berhenti dulu

  if (enemy.rushing) {
    tempV.copy(player.position).sub(enemy.group.position).setY(0);
    const d = tempV.length();
    if (d > .01) enemy.group.position.addScaledVector(tempV.normalize(), dt * 7.1);
    if (d < 2.1) {
      damage(24);
      enemy.rushing = false;
      enemy.group.position.copy(enemy.anchor);
    } else if (now > enemy.rushEnd) {
      enemy.rushing = false;
      enemy.group.position.lerp(enemy.anchor, .35);
    }
    return;
  }

  // Drift back toward the marker after being displaced.
  const anchorDistance = horizontalDistance(enemy.group.position, enemy.anchor);
  if (anchorDistance > .15) {
    tempV.copy(enemy.anchor).sub(enemy.group.position).setY(0);
    enemy.group.position.addScaledVector(tempV.normalize(), Math.min(anchorDistance, dt * 1.4));
  }

  enemy.attackTimer -= dt * (now < enemy.enragedUntil ? 1.8 : 1);
  if (enemy.attackTimer <= 0 && distance < 25) {
    spawnProjectile(now);
    enemy.attackTimer = 2.85;
  }
}

function updateEffects(dt, now) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.mesh.position.addScaledVector(p.velocity, dt);
    p.mesh.rotation.x += dt * 8;
    p.mesh.rotation.y += dt * 5;
    if (p.mesh.position.distanceTo(player.position) < .55) {
      if (tryPerfectDodge(p.mesh.position.clone(), now)) {
        scene.remove(p.mesh);
        projectiles.splice(i, 1);
        continue;
      }
      player.dodgeVelocity.addScaledVector(p.velocity.clone().setY(0).normalize(), 2.0);
      damage(18);
      spawnBurst(p.mesh.position, 0xff6259, 14, 1.8);
      scene.remove(p.mesh);
      projectiles.splice(i, 1);
      continue;
    }
    if (now - p.born > p.life) {
      scene.remove(p.mesh);
      projectiles.splice(i, 1);
    }
  }
  for (let i = playerProjectiles.length - 1; i >= 0; i--) {
    const pp = playerProjectiles[i];
    pp.mesh.position.addScaledVector(pp.velocity, dt);
    pp.mesh.rotation.x += dt * 9;
    const target = enemy.group.position.clone().add(new THREE.Vector3(0, 2.2, 0));
    if (enemy.group.visible && pp.mesh.position.distanceTo(target) < 1.15) {
      const preHp = enemy.hp;
      const fDmg = FORMULAS[pp.formula]?.dmg || 10;
      triggerImpactFrame({
        intensity: preHp <= fDmg ? 1 : fDmg >= 20 ? 0.85 : fDmg >= 13 ? 0.6 : 0.4,
        position: pp.mesh.position.clone(),
        style: preHp <= fDmg ? 'alternating' : fDmg >= 20 ? 'silhouette' : 'radial',
        duration: preHp <= fDmg ? 6 : 3,
      });
      hitEnemy(pp.formula, pp.mesh.position.clone(), pp.velocity.clone());
      scene.remove(pp.mesh);
      playerProjectiles.splice(i, 1);
      continue;
    }
    if (now - pp.born > 2.6 || pp.mesh.position.y < 0) {
      scene.remove(pp.mesh);
      playerProjectiles.splice(i, 1);
    }
  }
  for (let i = bursts.length - 1; i >= 0; i--) {
    const burst = bursts[i];
    burst.age += dt;
    const attr = burst.points.geometry.attributes.position;
    for (let j = 0; j < burst.velocities.length; j++) {
      attr.array[j * 3] += burst.velocities[j].x * dt;
      attr.array[j * 3 + 1] += burst.velocities[j].y * dt;
      attr.array[j * 3 + 2] += burst.velocities[j].z * dt;
      burst.velocities[j].y -= dt * (burst.gravity ?? 0.65);
    }
    attr.needsUpdate = true;
    burst.points.material.opacity = Math.max(0, (burst.baseOpacity ?? 1) * (1 - burst.age / (burst.life ?? 1.35)));
    if (burst.age > (burst.life ?? 1.35)) {
      scene.remove(burst.points);
      burst.points.geometry.dispose();
      burst.points.material.dispose();
      bursts.splice(i, 1);
    }
  }
  for (let i = rings.length - 1; i >= 0; i--) {
    const ring = rings[i];
    ring.age += dt;
    const t = Math.min(1, ring.age / 1.15);
    ring.mesh.scale.setScalar(1 + t * ring.maxScale);
    ring.mesh.material.opacity = (1 - t) * .72;
    if (t >= 1) {
      scene.remove(ring.mesh);
      ring.mesh.geometry.dispose();
      ring.mesh.material.dispose();
      rings.splice(i, 1);
    }
  }
  for (let i = wallMarks.length - 1; i >= 0; i--) {
    const m = wallMarks[i];
    m.age += dt;
    const life = m.life ?? 0.9;
    m.mat.opacity = Math.max(0, (m.baseOpacity ?? 0.85) * (1 - m.age / life));
    m.group.scale.multiplyScalar(1 + (m.grow ?? 0.7) * dt);
    if (m.age > life) { scene.remove(m.group); m.mat.dispose(); wallMarks.splice(i, 1); }
  }
  clouds.forEach((cloud) => {
    cloud.position.x += dt * cloud.userData.speed;
    if (cloud.position.x > 42) cloud.position.x = -42;
  });
  swayers.forEach((sw) => { sw.obj.rotation.z = Math.sin(now * 1.1 + sw.phase) * sw.amp; });
  if (pollen) {
    pollen.rotation.y = now * 0.014;
    pollen.position.y = Math.sin(now * 0.35) * 0.35;
  }
  birds.forEach((bird) => {
    bird.position.x += dt * bird.userData.speed;
    bird.position.y += Math.sin(now * 1.4 + bird.userData.phase) * dt * 0.35;
    const flap = Math.sin(now * 9 + bird.userData.phase) * 0.55;
    bird.userData.left.rotation.z = flap;
    bird.userData.right.rotation.z = -flap;
    if (bird.position.x > 44) bird.position.x = -44;
  });
}

// Viewmodel animation: idle sway, walk bob, raised charm while observing.
function updateViewmodel(dt, now) {
  if (!vmParts.gem) return;
  const inGame = gameState !== 'menu';
  viewmodel.visible = inGame;
  if (!inGame) return;
  const scanning = actionLock;
  const dodging = player.dodgeVelocity.length() > 1.2;
  const target = vmParts.basePos.clone();
  if (scanning) target.set(0.14, -0.16, -0.48);
  if (dodging) target.x -= 0.1;
  target.y += Math.sin(player.bobPhase * 2) * 0.012 * Math.min(1, player.lastMove.length() + 0.25);
  target.x += Math.sin(player.bobPhase) * 0.008;
  viewmodel.position.lerp(target, Math.min(1, dt * (scanning ? 10 : 6)));
  viewmodel.rotation.z = 0.06 + Math.sin(now * 1.3) * 0.02 - player.roll * 1.6;
  viewmodel.rotation.x = 0.15 + (scanning ? -0.25 : Math.sin(player.bobPhase * 2) * 0.02);
  vmParts.ring.rotation.z += dt * (scanning ? 2.6 : 0.5);
  const aimed = isAimingAtEnemy(0.88, 30);
  const ready = archive.formula >= 100 && !enemy.resolved;
  const gemColor = ready ? 0x9ef2c9 : aimed ? 0xffd267 : 0x8ddbd2;
  vmParts.gem.material.color.setHex(gemColor);
  vmParts.gem.material.emissive.setHex(gemColor);
  vmParts.gemLight.color.setHex(gemColor);
  const pulse = scanning ? 1 + Math.sin(now * 10) * 0.22 : 1 + Math.sin(now * 2.2) * 0.08;
  vmParts.gem.scale.setScalar(pulse);
  vmParts.gemLight.intensity = (aimed || ready ? 1.6 : 0.7) * pulse;
}

function updateMenuCamera(now) {
  viewmodel.visible = false;
  const radius = 14.5;
  camera.position.set(8 + Math.sin(now * .08) * 2.2, 5.3 + Math.sin(now * .18) * .25, 12 + Math.cos(now * .08) * 1.6);
  camera.lookAt(0, 2.0, -7.5);
  enemy.group.position.y = Math.sin(now * 1.6) * .05;
  enemy.aura.rotation.z += .003;
}

let fpsFrames = 0;
let fpsElapsed = 0;
function trackPerformance(dt) {
  fpsFrames++;
  fpsElapsed += dt;
  if (fpsElapsed < 1) return;
  const fps = Math.round(fpsFrames / fpsElapsed);
  fpsFrames = 0;
  fpsElapsed = 0;
  const el = $('#fpsValue');
  if (el) el.textContent = fps;
  const current = renderer.getPixelRatio();
  if (fps < 38 && current > 1) renderer.setPixelRatio(Math.max(1, current - 0.25));
  const ratio = renderer.getPixelRatio();
  const q = $('#qualityValue');
  if (q) q.textContent = ratio > 1.5 ? 'TINGGI' : ratio > 1.15 ? 'SEDANG' : 'HEMAT';
}

function animate() {
  requestAnimationFrame(animate);
  const rawDt = Math.min(clock.getDelta(), .05);
  const dt = rawDt * (synthesisOpen ? 0.12 : 1);
  const now = performance.now() / 1000;
  trackPerformance(rawDt);
  if (paused) { impactFrames.render(scene, camera); return; }
  if (gameState === 'menu') updateMenuCamera(now);
  else {
    updatePlayer(dt, now);
    updateEnemy(dt, now);
    updateEffects(dt, now);
    updateViewmodel(dt, now);
    updateCompass();
    updateEyes(dt, now);
  }
  impactFrames.render(scene, camera);
}
animate();

// Audio synthesis keeps the prototype self-contained.
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = muted ? 0 : 1;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function tone(frequency, duration = .2, type = 'sine', gain = .035, delay = 0) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const amp = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, t);
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(Math.max(.0002, gain), t + .018);
  amp.gain.exponentialRampToValueAtTime(.0001, t + duration);
  osc.connect(amp).connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + duration + .04);
}

function chord(notes, duration = .65) {
  notes.forEach((note, i) => tone(note, duration, 'sine', .025, i * .035));
}

function bellSound() {
  [523, 784, 1046, 1318].forEach((note, i) => tone(note, 1.25 - i * .08, 'sine', .035 / (1 + i * .25), i * .025));
}

// Desktop input.
let impactTestIndex = 0;
addEventListener('keydown', (event) => {
  keys.add(event.code);
  if (event.code === 'KeyI' && !event.repeat) {
    const styles = ['radial', 'invert', 'silhouette', 'alternating'];
    const style = styles[impactTestIndex++ % styles.length];
    triggerImpactFrame({ intensity: 0.9, position: enemy.group.position.clone().add(new THREE.Vector3(0, 2.2, 0)), style, duration: style === 'alternating' ? 6 : 3 });
    showToast(`Uji impact frame: ${style} (tekan I lagi untuk gaya berikutnya)`, 1400);
  }
  if (event.repeat) return;
  if (event.code === 'KeyQ') toggleAppraisal();
  if (event.code === 'KeyE') toggleFutureSight();
  if (event.code === 'KeyT') openSynthesis();
  if (event.code === 'KeyF') interact();
  if (event.code === 'Space') { event.preventDefault(); dodge(); }
  if (event.code.startsWith('Digit')) {
    const n = Number(event.code.slice(5));
    if (n >= 1 && n <= 4) { selectedSlot = n - 1; updateSpellBar(); }
  }
  if (event.code === 'KeyP') setPaused(!paused);
  if (event.code === 'Escape') {
    if (openModalId === 'synthesisPanel') closeSynthesis();
    else if (openModalId && closableModals.has(openModalId)) closeModal(openModalId);
    else if (paused) setPaused(false);
  }
  if (event.code === 'KeyM') { initAudio(); setMuted(!muted); }
});
addEventListener('keyup', (event) => keys.delete(event.code));
addEventListener('mousemove', (event) => {
  if (document.pointerLockElement !== canvas || modalOpen || gameState !== 'playing') return;
  player.yaw -= event.movementX * .00215;
  player.pitch -= event.movementY * .00185;
  player.pitch = THREE.MathUtils.clamp(player.pitch, -1.22, 1.22);
});
canvas.addEventListener('click', lockPointer);
canvas.addEventListener('mousedown', (e) => {
  if (e.button === 0 && document.pointerLockElement === canvas && gameState === 'playing' && !modalOpen) castSelected();
});
addEventListener('wheel', (e) => {
  if (gameState !== 'playing' || modalOpen) return;
  selectedSlot = (selectedSlot + (e.deltaY > 0 ? 1 : 3)) % 4;
  updateSpellBar();
}, { passive: true });

// Touch joystick and camera.
const joystickEl = $('#joystick');
const knob = $('#joystickKnob');
function updateJoystick(event) {
  const rect = joystickEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let dx = event.clientX - cx;
  let dy = event.clientY - cy;
  const max = rect.width * .32;
  const len = Math.hypot(dx, dy);
  if (len > max) { dx = dx / len * max; dy = dy / len * max; }
  joystick.x = dx / max;
  joystick.y = dy / max;
  knob.style.transform = `translate(${dx}px, ${dy}px)`;
}
joystickEl.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  joystick.id = event.pointerId;
  joystickEl.setPointerCapture(event.pointerId);
  updateJoystick(event);
});
joystickEl.addEventListener('pointermove', (event) => {
  if (event.pointerId === joystick.id) updateJoystick(event);
});
function releaseJoystick(event) {
  if (event.pointerId !== joystick.id) return;
  joystick.id = null;
  joystick.x = joystick.y = 0;
  knob.style.transform = 'translate(0,0)';
}
joystickEl.addEventListener('pointerup', releaseJoystick);
joystickEl.addEventListener('pointercancel', releaseJoystick);

const lookZone = $('#lookZone');
lookZone.addEventListener('pointerdown', (event) => {
  if (modalOpen) return;
  lookPointer = event.pointerId;
  lookLast = { x: event.clientX, y: event.clientY };
  lookZone.setPointerCapture(event.pointerId);
});
lookZone.addEventListener('pointermove', (event) => {
  if (event.pointerId !== lookPointer || modalOpen) return;
  const dx = event.clientX - lookLast.x;
  const dy = event.clientY - lookLast.y;
  lookLast = { x: event.clientX, y: event.clientY };
  player.yaw -= dx * .0045;
  player.pitch -= dy * .0038;
  player.pitch = THREE.MathUtils.clamp(player.pitch, -1.18, 1.18);
});
lookZone.addEventListener('pointerup', (event) => { if (event.pointerId === lookPointer) lookPointer = null; });
lookZone.addEventListener('pointercancel', (event) => { if (event.pointerId === lookPointer) lookPointer = null; });

// UI events — onTap memakai pointerup + click (anti dobel) agar tap di HP selalu terdaftar,
// dan semua pendaftaran dijaga null agar satu elemen hilang tidak mematikan tombol lain.
function onTap(el, handler) {
  if (!el) return;
  let last = 0;
  const fire = (event) => {
    const now = performance.now();
    if (now - last < 450) return;
    last = now;
    event.preventDefault?.();
    event.stopPropagation?.();
    handler(event);
  };
  el.addEventListener('pointerup', fire);
  el.addEventListener('click', fire);
}

onTap($('#startBtn'), startGame);
onTap($('#resetBtn'), () => {
  localStorage.removeItem('duel-interpretasi-checkpoint');
  localStorage.removeItem('duel-interpretasi-outcome');
  $('#resetBtn').textContent = 'Checkpoint dihapus';
});
onTap($('#tutorialOk'), () => {
  $('#tutorialCard').classList.add('hidden');
  modalOpen = false;
  openModalId = null;
  syncModalChrome();
  if (!granted) openModal('grantPanel');
  else if (!isTouch) lockPointer();
});
$$('[data-grant]').forEach((button) => onTap(button, () => {
  ownFormula(button.dataset.grant);
  granted = true;
  selectedSlot = 0;
  updateSpellBar();
  closeModal('grantPanel');
  saveCheckpoint();
  showToast(`Pemberian diterima: “${FORMULAS[button.dataset.grant].name}”. Sekarang analisis roh itu (Q) — jangan hanya menyerangnya.`, 4600);
}));
onTap($('#synthCraft'), craftSynthesis);
$('#synthesisPanel')?.addEventListener('pointerup', () => { /* menjaga modal tetap sinkron */ syncModalChrome(); });
$('#observeBtn')?.addEventListener('pointerdown', (e) => { e.preventDefault(); toggleAppraisal(); });
$('#testBtn')?.addEventListener('pointerdown', (e) => { e.preventDefault(); toggleFutureSight(); });
$('#castBtn')?.addEventListener('pointerdown', (e) => { e.preventDefault(); castSelected(); });
$('#dodgeBtn')?.addEventListener('pointerdown', (e) => { e.preventDefault(); dodge(); });
$('#interpretBtn')?.addEventListener('pointerdown', (e) => { e.preventDefault(); openSynthesis(); });
onTap($('#evidenceToggle'), () => $('#evidencePanel')?.classList.toggle('collapsed'));
onTap($('#pauseBtn'), () => setPaused(true));
onTap($('#muteBtn'), () => { initAudio(); setMuted(!muted); });
onTap($('#fullscreenBtn'), toggleFullscreen);
onTap($('#resumeBtn'), () => setPaused(false));
onTap($('#restartBtn'), () => { setPaused(false); resetEncounter(true); showToast('Encounter dimulai ulang dari penanda desa.'); });
$$('[data-close]').forEach((button) => onTap(button, () => {
  if (button.dataset.close === 'synthesisPanel') closeSynthesis();
  else closeModal(button.dataset.close);
}));
$$('.spell-slot').forEach((el) => onTap(el, () => { selectedSlot = Number(el.dataset.slot); updateSpellBar(); }));
$$('[data-resolve]').forEach((button) => onTap(button, () => resolveEnemy(button.dataset.resolve)));
onTap($('#replayBtn'), () => {
  scene.background.setHex(0x91ced9);
  scene.fog.color.setHex(0x91ced9);
  skyUniforms.topColor.value.setHex(0x5fb2cf);
  enemy.group.visible = true;
  resetEncounter(true);
});
onTap($('#continueExploreBtn'), () => {
  $('#resultScreen').classList.remove('active');
  modalOpen = false;
  openModalId = null;
  syncModalChrome();
  gameState = 'playing';
  updateObjective();
  if (!isTouch) lockPointer();
  showToast('Prototipe selesai. Kamu masih dapat menjelajahi Desa Aster.');
});

function fitViewport() {
  const vv = window.visualViewport;
  const w = Math.round(vv?.width || innerWidth);
  const h = Math.round(vv?.height || innerHeight);
  if (!w || !h) return;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.35 : 1.8));
  renderer.setSize(w, h);
  impactFrames.setSize(w, h, renderer.getPixelRatio());
}
addEventListener('resize', fitViewport);
addEventListener('orientationchange', () => { setTimeout(fitViewport, 60); setTimeout(fitViewport, 350); });
window.visualViewport?.addEventListener('resize', fitViewport);
document.addEventListener('fullscreenchange', () => setTimeout(fitViewport, 120));
fitViewport();

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        try { await el.requestFullscreen({ navigationUI: 'hide' }); }
        catch { await el.requestFullscreen(); }
      }
      if (isTouch && screen.orientation?.lock) {
        try { await screen.orientation.lock('landscape'); } catch { /* tidak didukung */ }
      }
    }
  } catch { /* abaikan */ }
  setTimeout(fitViewport, 120);
  setTimeout(fitViewport, 450);
}
addEventListener('contextmenu', (event) => event.preventDefault());

updateArchiveUI(true);
updateClarity();
updateSpellBar();
updateResourceUI();
if (isTouch) $('#evidencePanel')?.classList.add('collapsed');
