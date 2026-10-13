import * as THREE from 'three';
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
  learnedDodge: false,
  dodgeCount: 0,
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

// --- First-person viewmodel: sleeve, hand and the interpreter's charm. ---
const viewmodel = new THREE.Group();
const vmParts = {};
function createViewmodel() {
  const sleeve = mesh(new THREE.CylinderGeometry(0.075, 0.095, 0.34, 7), toon(0x35566b, { emissive: 0x0d1c26, emissiveIntensity: 0.4 }), { rx: 1.15, rz: -0.35, shadow: false });
  sleeve.position.set(0.02, -0.1, 0.1);
  const hand = mesh(new THREE.SphereGeometry(0.075, 10, 8), toon(0xe8b98d), { shadow: false });
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
  viewmodel.position.set(0.34, -0.32, -0.55);
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
  const projectileMat = new THREE.MeshBasicMaterial({ color: enemy.learnedDodge ? 0xffba68 : 0xff6259 });
  const core = mesh(new THREE.IcosahedronGeometry(.17, 0), projectileMat, { shadow: false });
  core.position.copy(enemy.group.position).add(new THREE.Vector3(0, 2.4, 0));
  const target = player.position.clone();
  if (enemy.learnedDodge) target.add(player.lastMove.clone().multiplyScalar(1.6));
  const velocity = target.sub(core.position).normalize().multiplyScalar(enemy.learnedDodge ? 8.8 : 6.7);
  const light = new THREE.PointLight(0xff5149, 1.7, 3.5);
  core.add(light);
  scene.add(core);
  projectiles.push({ mesh: core, velocity, born: now, life: 4 });
  tone(155, .12, 'sawtooth', .035);
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
  bursts.push({ points, velocities, age: 0 });
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
const evidence = new Set();

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
  evidence.clear();
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
  enemy.learnedDodge = false;
  enemy.dodgeCount = 0;
  enemy.stunnedUntil = 0;
  enemy.attackTimer = 2.1;
  projectiles.splice(0).forEach((p) => scene.remove(p.mesh));
  updateEvidenceUI();
  updateClarity();
  updateObjective();
  gameState = 'playing';
  modalOpen = false;
  $('#resultScreen').classList.remove('active');
  $('#resolvePanel').classList.add('hidden');
  $('#interpretPanel').classList.add('hidden');
  if (!isTouch) setTimeout(lockPointer, 80);
}

function saveCheckpoint() {
  if (gameState !== 'playing' || enemy.resolved) return;
  checkpoint = {
    position: [player.position.x, player.position.y, player.position.z],
    evidence: [...evidence],
    clarity: player.clarity,
  };
  localStorage.setItem('duel-interpretasi-checkpoint', JSON.stringify(checkpoint));
}

function restoreCheckpoint() {
  try {
    const saved = JSON.parse(localStorage.getItem('duel-interpretasi-checkpoint'));
    if (!saved) return;
    if (Array.isArray(saved.position)) player.position.fromArray(saved.position);
    if (Array.isArray(saved.evidence)) saved.evidence.forEach((key) => evidence.add(key));
    player.clarity = Math.max(45, saved.clarity || 100);
    updateEvidenceUI();
    updateClarity();
    showToast('Checkpoint desa dipulihkan.');
  } catch {
    localStorage.removeItem('duel-interpretasi-checkpoint');
  }
}

function lockPointer() {
  if (!isTouch && gameState === 'playing' && !modalOpen && document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
}

function openModal(id) {
  modalOpen = true;
  document.exitPointerLock?.();
  $('#' + id).classList.remove('hidden');
}

function closeModal(id) {
  $('#' + id).classList.add('hidden');
  modalOpen = false;
  if (!isTouch) setTimeout(lockPointer, 80);
}

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
  else if (evidence.size >= 3) objective.textContent = 'Susun interpretasi tentang Roh Ladang';
  else if (player.testMode === 'retreat') objective.textContent = 'Mundur dan biarkan ia melihatmu pergi';
  else if (evidence.size === 0) objective.textContent = 'Hadapi Roh Ladang dan amati perilakunya';
  else objective.textContent = `Temukan jejak perilaku lainnya (${evidence.size}/3)`;
}

function addEvidence(key) {
  if (evidence.has(key)) {
    showToast('Jejak ini sudah kamu pahami. Cari respons yang berbeda.');
    return;
  }
  evidence.add(key);
  updateEvidenceUI();
  updateObjective();
  saveCheckpoint();
  spawnBurst(enemy.group.position.clone().add(new THREE.Vector3(0, 2.4, 0)), 0xffd267, 28, 2.2);
  tone(523, .16, 'sine', .045);
  setTimeout(() => tone(659, .26, 'sine', .04), 110);
  showToast(`Jejak dipahami: “${clueText[key]}”`, 4300);
}

function updateEvidenceUI() {
  $('#evidenceCount').textContent = `${evidence.size} / 3`;
  $$('.evidence').forEach((item) => {
    const key = item.dataset.key;
    const found = evidence.has(key);
    item.classList.toggle('locked', !found);
    item.classList.toggle('revealed', found);
    item.querySelector('p').textContent = found ? clueText[key] : 'Belum dipahami';
  });
  const ready = evidence.size >= 3;
  $('#interpretBtn').disabled = !ready;
  $('#interpretBtn').classList.toggle('ready', ready);
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
  showToast('Interpretasimu runtuh. Kamu kembali ke penanda desa…', 2600);
  document.exitPointerLock?.();
  setTimeout(() => {
    player.position.set(0, 1.68, 10);
    player.clarity = 100;
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

function observe() {
  if (gameState !== 'playing' || modalOpen || actionLock) return;
  const observationTime = performance.now() / 1000;
  const reactionInProgress = observationTime < enemy.rushRecentUntil || observationTime < enemy.bellRecentUntil;
  if (!isAimingAtEnemy(reactionInProgress ? .58 : .88, reactionInProgress ? 44 : 28)) {
    showToast('Arahkan pandangan ke Roh Ladang untuk mengamati.');
    return;
  }
  actionLock = true;
  $('#scanRing').classList.add('active');
  setPrompt('Membaca perubahan gerak dan niat…');
  tone(280, .55, 'sine', .025);
  setTimeout(() => {
    $('#scanRing').classList.remove('active');
    setPrompt('');
    actionLock = false;
    const now = performance.now() / 1000;
    if (now < enemy.rushRecentUntil) addEvidence('departure');
    else if (now < enemy.bellRecentUntil) addEvidence('bell');
    else if (!evidence.has('guard')) addEvidence('guard');
    else if (!evidence.has('departure')) showToast('Perilakunya saat kamu diam tidak berubah. Gunakan UJI untuk berpura-pura pergi.');
    else if (!evidence.has('bell')) showToast('Ada simbol lonceng pada tubuhnya. Gunakan UJI untuk meminjam suara lonceng.');
    else showToast('Seluruh jejak utama telah terbaca.');
  }, 820);
}

function openTest() {
  if (gameState !== 'playing' || modalOpen) return;
  openModal('testPanel');
}

function selectTest(type) {
  closeModal('testPanel');
  const now = performance.now() / 1000;
  if (type === 'retreat') {
    player.testMode = 'retreat';
    player.testStartDistance = horizontalDistance(player.position, enemy.group.position);
    player.retreatDeadline = now + 1.5;
    showToast('Uji dimulai: berpalinglah dan bergerak menjauh dari ladang.', 3700);
    updateObjective();
  } else if (type === 'bell') {
    ringBell(now);
  } else {
    enemy.enragedUntil = now + 5;
    enemy.attackTimer = .2;
    showToast('Batu itu hanya membuatnya marah. Respons ini tidak cukup menjelaskan niatnya.');
    tone(120, .18, 'square', .04);
  }
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
  showToast('Suara dipindahkan ke ladang. Roh itu berhenti… dan menunduk. Amati sekarang.', 4200);
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
  enemy.dodgeCount++;
  tone(240, .08, 'sine', .025);
  if (enemy.dodgeCount === 3 && !enemy.learnedDodge) {
    enemy.learnedDodge = true;
    showToast('Roh itu membaca pola hindarmu. Proyektil berikutnya akan memotong arah gerakmu.', 4300);
    $('#enemyState').textContent = 'Mempelajari kebiasaanmu';
  }
}

function tryInterpret() {
  if (gameState !== 'playing' || modalOpen) return;
  if (evidence.size < 3) {
    showToast(`Interpretasi belum stabil. Temukan ${3 - evidence.size} jejak lagi.`);
    return;
  }
  openModal('interpretPanel');
}

function chooseInterpretation(choice) {
  if (evidence.size < 3 || $('#interpretPanel').classList.contains('hidden')) return;
  $('#interpretPanel').classList.add('hidden');
  if (choice !== 'abandonment') {
    modalOpen = false;
    enemy.enragedUntil = performance.now() / 1000 + 7;
    player.clarity = Math.max(15, player.clarity - 18);
    updateClarity();
    const text = choice === 'power'
      ? 'Interpretasi ditolak: ia selalu kembali ke penanda, bukan memperluas wilayah.'
      : 'Interpretasi ditolak: lonceng menghentikan amarahnya; suara itu bukan hal yang dibenci.';
    showToast(text, 4400);
    tone(105, .28, 'sawtooth', .05);
    if (!isTouch) setTimeout(lockPointer, 80);
    return;
  }
  gameState = 'revelation';
  modalOpen = true;
  enemy.revealed = true;
  projectiles.splice(0).forEach((p) => scene.remove(p.mesh));
  $('#enemyState').textContent = 'Takut ditinggalkan';
  spawnBurst(enemy.group.position.clone().add(new THREE.Vector3(0, 2.2, 0)), 0x9ef2c9, 52, 3.2);
  spawnRing(enemy.group.position, 0x9ef2c9, 8);
  chord([392, 494, 659], .8);
  showToast('Identitas terbuka: Penjaga yang Tak Pernah Dibebaskan.', 3400);
  setTimeout(() => openModal('resolvePanel'), 2000);
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
  player.saveTimer += dt;
  if (player.saveTimer > 6) { player.saveTimer = 0; saveCheckpoint(); }
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

  if (gameState !== 'playing' || modalOpen || !enemy.active) return;
  if (now < enemy.stunnedUntil) {
    enemy.head.rotation.x = .42;
    $('#enemyState').textContent = 'Mengingat sesuatu';
    return;
  }
  enemy.head.rotation.x = 0;
  $('#enemyState').textContent = now < enemy.enragedUntil ? 'Interpretasi ditolak' : enemy.learnedDodge ? 'Mempelajari kebiasaanmu' : 'Tidak terbaca';

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
    enemy.attackTimer = enemy.learnedDodge ? 2.15 : 2.85;
  }
}

function updateEffects(dt, now) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.mesh.position.addScaledVector(p.velocity, dt);
    p.mesh.rotation.x += dt * 8;
    p.mesh.rotation.y += dt * 5;
    if (p.mesh.position.distanceTo(player.position) < .55) {
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
  for (let i = bursts.length - 1; i >= 0; i--) {
    const burst = bursts[i];
    burst.age += dt;
    const attr = burst.points.geometry.attributes.position;
    for (let j = 0; j < burst.velocities.length; j++) {
      attr.array[j * 3] += burst.velocities[j].x * dt;
      attr.array[j * 3 + 1] += burst.velocities[j].y * dt;
      attr.array[j * 3 + 2] += burst.velocities[j].z * dt;
      burst.velocities[j].y -= dt * .65;
    }
    attr.needsUpdate = true;
    burst.points.material.opacity = Math.max(0, 1 - burst.age / 1.35);
    if (burst.age > 1.35) {
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
  const ready = evidence.size >= 3 && !enemy.resolved;
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
  const dt = Math.min(clock.getDelta(), .05);
  const now = performance.now() / 1000;
  trackPerformance(dt);
  if (paused) { renderer.render(scene, camera); return; }
  if (gameState === 'menu') updateMenuCamera(now);
  else {
    updatePlayer(dt, now);
    updateEnemy(dt, now);
    updateEffects(dt, now);
    updateViewmodel(dt, now);
    updateCompass();
  }
  renderer.render(scene, camera);
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
addEventListener('keydown', (event) => {
  keys.add(event.code);
  if (event.repeat) return;
  if (event.code === 'KeyE') observe();
  if (event.code === 'KeyF') openTest();
  if (event.code === 'Space') { event.preventDefault(); dodge(); }
  if (event.code === 'KeyR') tryInterpret();
  if (event.code === 'KeyP') setPaused(!paused);
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

// UI events.
$('#startBtn').addEventListener('click', startGame);
$('#resetBtn').addEventListener('click', () => {
  localStorage.removeItem('duel-interpretasi-checkpoint');
  localStorage.removeItem('duel-interpretasi-outcome');
  $('#resetBtn').textContent = 'Checkpoint dihapus';
});
$('#tutorialOk').addEventListener('click', () => {
  $('#tutorialCard').classList.add('hidden');
  modalOpen = false;
  showToast('Temukan Roh Ladang di sepanjang jalan menuju ladang.', 3500);
  if (!isTouch) lockPointer();
});
$('#observeBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); observe(); });
$('#testBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); openTest(); });
$('#dodgeBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); dodge(); });
$('#interpretBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); tryInterpret(); });
$('#evidenceToggle').addEventListener('click', () => $('#evidencePanel').classList.toggle('collapsed'));
$('#pauseBtn').addEventListener('click', () => setPaused(true));
$('#muteBtn').addEventListener('click', () => { initAudio(); setMuted(!muted); });
$('#resumeBtn').addEventListener('click', () => setPaused(false));
$('#restartBtn').addEventListener('click', () => { setPaused(false); resetEncounter(true); showToast('Encounter dimulai ulang dari penanda desa.'); });
$$('[data-close]').forEach((button) => button.addEventListener('click', () => closeModal(button.dataset.close)));
$$('[data-test]').forEach((button) => button.addEventListener('click', () => selectTest(button.dataset.test)));
$$('[data-interpret]').forEach((button) => button.addEventListener('click', () => chooseInterpretation(button.dataset.interpret)));
$$('[data-resolve]').forEach((button) => button.addEventListener('click', () => resolveEnemy(button.dataset.resolve)));
$('#replayBtn').addEventListener('click', () => {
  scene.background.setHex(0x91ced9);
  scene.fog.color.setHex(0x91ced9);
  skyUniforms.topColor.value.setHex(0x5fb2cf);
  enemy.group.visible = true;
  resetEncounter(true);
});
$('#continueExploreBtn').addEventListener('click', () => {
  $('#resultScreen').classList.remove('active');
  modalOpen = false;
  gameState = 'playing';
  updateObjective();
  if (!isTouch) lockPointer();
  showToast('Prototipe selesai. Kamu masih dapat menjelajahi Desa Aster.');
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.35 : 1.8));
  renderer.setSize(innerWidth, innerHeight);
});
addEventListener('contextmenu', (event) => event.preventDefault());

updateEvidenceUI();
updateClarity();
