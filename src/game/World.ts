import * as THREE from 'three';
import { Effects } from './Effects';
import { ARENA, HEAVY, WORLD_SCALE } from './config';
import { assessFiringLane, type FiringLane } from './AttackSight';
import { PROJECTILES, type AttackId } from './combat';
import { DestructibleVolume, TerrainDeformation, type Cell } from './destruction';
import { seededRandom, firstSolidSpan, type Obstacle } from './math';
import { gridCell, warpAxis } from './terrainGrid';

function gridTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#b1b3b1';
  c.fillRect(0, 0, 256, 256);
  const random = seededRandom(88);
  for (let i = 0; i < 10000; i++) {
    c.fillStyle = `rgba(${random() > 0.5 ? '255,255,255' : '20,25,30'},${random() * 0.032})`;
    c.fillRect(random() * 256, random() * 256, 1, 1);
  }
  c.strokeStyle = '#a1a5a5';
  c.lineWidth = 0.8;
  for (let i = 0; i < 256; i += 32) {
    c.beginPath();
    c.moveTo(i + 0.5, 0);
    c.lineTo(i + 0.5, 256);
    c.moveTo(0, i + 0.5);
    c.lineTo(256, i + 0.5);
    c.stroke();
  }
  c.strokeStyle = '#8e979a';
  c.lineWidth = 1;
  c.strokeRect(0.5, 0.5, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(162, 162);
  texture.anisotropy = 4;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function skyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const c = canvas.getContext('2d')!;
  const gradient = c.createLinearGradient(0, 0, 0, 850);
  gradient.addColorStop(0, '#3264a5');
  gradient.addColorStop(0.4, '#4e89c4');
  gradient.addColorStop(0.59, '#85b2d3');
  gradient.addColorStop(0.69, '#c4d6df');
  gradient.addColorStop(1, '#a8b8c0');
  c.fillStyle = gradient;
  c.fillRect(0, 0, 2048, 1024);
  const random = seededRandom(38);
  for (let cloud = 0; cloud < 45; cloud++) {
    const x = random() * 2048,
      y = 230 + random() * 230,
      span = 45 + random() * 130;
    for (let j = 0; j < 12; j++) {
      const px = x + (random() - 0.5) * span * 2.2,
        py = y + (random() - 0.5) * span * 0.4;
      const r = 12 + random() * span * 0.42;
      const glow = c.createRadialGradient(px, py, 0, px, py, r);
      glow.addColorStop(0, 'rgba(250,250,242,0.42)');
      glow.addColorStop(0.5, 'rgba(244,247,243,0.25)');
      glow.addColorStop(1, 'rgba(242,247,246,0)');
      c.fillStyle = glow;
      c.fillRect(px - r, py - r, r * 2, r * 2);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function labelTexture(title: string, subtitle: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#d1d4cf';
  c.globalAlpha = 0.65;
  c.font = 'bold 145px sans-serif';
  c.fillText(title, 24, 155);
  c.font = '17px monospace';
  c.fillText(subtitle, 30, 207);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

let contactMap: THREE.CanvasTexture | undefined;
export function contactShadowTexture(): THREE.CanvasTexture {
  if (contactMap) return contactMap;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const c = canvas.getContext('2d')!;
  const gradient = c.createRadialGradient(64, 64, 12, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(0,0,0,0.5)');
  gradient.addColorStop(0.42, 'rgba(0,0,0,0.32)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = gradient;
  c.fillRect(0, 0, 128, 128);
  contactMap = new THREE.CanvasTexture(canvas);
  return contactMap;
}

export class World {
  obstacles: Obstacle[] = [];
  readonly sun: THREE.DirectionalLight;
  readonly terrain = new TerrainDeformation();
  private buildings: {
    mesh: THREE.Mesh;
    volume: DestructibleVolume;
    fragments?: THREE.InstancedMesh;
  }[] = [];
  private fixedObstacles: Obstacle[] = [];
  private sky: THREE.Mesh;
  private ground: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  private fragmentStamp = new THREE.Object3D();
  private contactShadows: THREE.InstancedMesh;
  private intactBatches: { mesh: THREE.InstancedMesh; ids: number[] }[] = [];
  private wallLabel: THREE.Mesh;
  private labelBuilding = 0;
  constructor(
    private scene: THREE.Scene,
    private fx: Effects,
  ) {
    scene.background = new THREE.Color('#b4cbd6');
    scene.fog = new THREE.Fog('#b6c5cf', 150, 440);
    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(540, 32, 20),
      new THREE.MeshBasicMaterial({
        map: skyTexture(),
        side: THREE.BackSide,
        fog: false,
        depthWrite: false,
      }),
    );
    scene.add(this.sky);
    scene.add(new THREE.HemisphereLight('#d5ebff', '#646365', 2.1));
    this.sun = new THREE.DirectionalLight('#fff3d8', 2.8);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    // The shadow frustum follows the player (see focusShadow) instead of covering the whole
    // 284 m arena: ~8 cm per texel around the action instead of ~15 cm, so the ground contact
    // of walls no longer breaks into a jagged dark staircase.
    const shadowSpan = ARENA.shadowSpan;
    this.sun.shadow.camera.left = this.sun.shadow.camera.bottom = -shadowSpan;
    this.sun.shadow.camera.right = this.sun.shadow.camera.top = shadowSpan;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 300;
    this.sun.shadow.normalBias = 0.02;
    this.sun.shadow.bias = -0.0001;
    this.sun.shadow.radius = 2.5;
    scene.add(this.sun, this.sun.target);
    this.focusShadow(new THREE.Vector3());
    const floor = new THREE.MeshStandardMaterial({
      map: gridTexture(),
      roughness: 1,
      metalness: 0,
    });
    const outer = new THREE.Shape(),
      span = 650;
    outer.moveTo(-span, -span);
    outer.lineTo(span, -span);
    outer.lineTo(span, span);
    outer.lineTo(-span, span);
    outer.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-ARENA.terrainHalf, -ARENA.terrainHalf);
    hole.lineTo(-ARENA.terrainHalf, ARENA.terrainHalf);
    hole.lineTo(ARENA.terrainHalf, ARENA.terrainHalf);
    hole.lineTo(ARENA.terrainHalf, -ARENA.terrainHalf);
    hole.closePath();
    outer.holes.push(hole);
    const outerGeometry = new THREE.ShapeGeometry(outer);
    const outerPositions = outerGeometry.attributes.position,
      outerUV = outerGeometry.attributes.uv;
    for (let i = 0; i < outerPositions.count; i++)
      outerUV.setXY(
        i,
        (outerPositions.getX(i) + span) / (span * 2),
        (outerPositions.getY(i) + span) / (span * 2),
      );
    const outerGround = new THREE.Mesh(outerGeometry, floor);
    outerGround.rotation.x = -Math.PI / 2;
    outerGround.receiveShadow = true;
    scene.add(outerGround);
    const innerMap = gridTexture();
    innerMap.repeat.set(ARENA.terrainHalf / 4, ARENA.terrainHalf / 4);
    const terrainGeometry = new THREE.PlaneGeometry(
      ARENA.terrainHalf * 2,
      ARENA.terrainHalf * 2,
      ARENA.terrainSegments,
      ARENA.terrainSegments,
    );
    // Adaptive tessellation: dense where craters and skids happen, coarse towards the rim.
    {
      const position = terrainGeometry.attributes.position,
        uv = terrainGeometry.attributes.uv,
        half = ARENA.terrainHalf;
      for (let i = 0; i < position.count; i++) {
        const x = warpAxis(position.getX(i) / half) * half,
          y = warpAxis(position.getY(i) / half) * half;
        position.setXY(i, x, y);
        uv.setXY(i, (x + half) / (half * 2), (y + half) / (half * 2));
      }
      position.needsUpdate = uv.needsUpdate = true;
    }
    this.ground = new THREE.Mesh(
      terrainGeometry,
      new THREE.MeshStandardMaterial({ map: innerMap, roughness: 1, vertexColors: true }),
    );
    const colors = new Float32Array(this.ground.geometry.attributes.position.count * 3).fill(1);
    this.ground.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    scene.add(this.ground);
    const material = new THREE.MeshStandardMaterial({
      color: '#929695',
      roughness: 0.9,
      metalness: 0.035,
    });
    const dark = new THREE.MeshStandardMaterial({ color: '#515d69', roughness: 0.92 });
    const light = new THREE.MeshStandardMaterial({ color: '#a7aaa8', roughness: 0.9 });
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const block = (
      x: number,
      z: number,
      w: number,
      h: number,
      d: number,
      m = material,
      lean = 0,
    ) => {
      const mesh = new THREE.Mesh(geometry, m);
      mesh.position.set(x, h * 0.5, z);
      mesh.scale.set(w, h, d);
      mesh.rotation.z = lean;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      // Intact blocks share three instanced draws; this mesh stores only their transforms.
      mesh.updateMatrixWorld();
      const box = new THREE.Box3().setFromObject(mesh);
      const bounds: Obstacle = {
        minX: box.min.x,
        maxX: box.max.x,
        minZ: box.min.z,
        maxZ: box.max.z,
        bottom: 0,
        top: box.max.y,
        owner: this.buildings.length,
      };
      // Bigger monoliths use slightly larger voxels so a single block stays near 2k cells.
      const cell = Math.max(1.6, Math.min(2.4, Math.cbrt((w * h * d) / 1800)));
      const volume = new DestructibleVolume(bounds, this.buildings.length, cell);
      this.buildings.push({ mesh, volume });
      this.obstacles.push(bounds);
      return mesh;
    };
    // The whole layout is drawn at `K` times the v0.8 plan: fewer, broader and much thicker
    // monoliths on a wider ground, while the handful of thin slabs stay thin for solar piercing.
    const K = WORLD_SCALE;
    const big = (
      x: number,
      z: number,
      w: number,
      h: number,
      d: number,
      m = material,
      lean = 0,
      thin = false,
    ) => block(x * K, z * K, w * K, h * K, thin ? d : d * K, m, lean);
    big(-2, -10, 11, 19, 2.4, dark, 0, true);
    big(-2, -10, 12, 0.3 / K, 5, light);
    big(-12, -24, 16, 40, 12, light);
    big(16, -25, 16, 36, 11, dark, -0.1);
    this.labelBuilding = this.buildings.length;
    big(-27, -5, 15, 24, 13, material);
    big(29, 6, 18, 34, 14, material);
    big(-14, 12, 12, 16, 12, dark);
    big(3, -38, 22, 20, 14, material);
    big(-38, -30, 18, 42, 14, dark);
    big(40, -16, 18, 28, 15, material);
    big(31, 32, 22, 20, 15, dark);
    big(-33, 32, 18, 30, 15, light);
    big(10, 39, 16, 36, 11, material);
    // Two sparse rings of massive, destructible blocks with wide aerial/ground corridors.
    const layout = seededRandom(714);
    for (let ring = 0; ring < 2; ring++) {
      const count = ring === 0 ? 8 : 10,
        radius = ring === 0 ? 70 : 105;
      for (let i = 0; i < count; i++) {
        const angle = ((i + (ring ? 0.4 : 0.5)) / count) * Math.PI * 2;
        const x = Math.cos(angle) * radius,
          z = Math.sin(angle) * radius;
        const width = 20 + layout() * 10,
          height = 24 + layout() * 22,
          thin = i % 5 === 0,
          depth = thin ? 2.6 : 10 + layout() * 7;
        big(
          x,
          z,
          width,
          height,
          depth,
          i % 3 === 0 ? dark : i % 3 === 1 ? light : material,
          i % 9 === 0 ? 0.065 : 0,
          thin,
        );
      }
    }
    // Low cover in the empty bands between the central cluster and the rings (r ≈ 74 m and
    // 114 m): 1.5–2.6 m walls to duck behind on foot, low enough for every flight route to
    // pass over, each nudged inwards until it sits clear of the monoliths and the main lanes.
    const coverLayout = seededRandom(2201);
    const lowCover = (angle: number, radius: number, index: number) => {
      const long = 6 + coverLayout() * 4,
        height = 1.5 + coverLayout() * 1.1,
        thin = 1.2 + coverLayout() * 0.6,
        eastWest = Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle)),
        [w, d] = eastWest ? [thin, long] : [long, thin];
      for (let attempt = 0; attempt < 4; attempt++) {
        const r = radius - attempt * 3,
          x = Math.cos(angle) * r,
          z = Math.sin(angle) * r;
        const clear = this.obstacles.every(
          (o) =>
            x + w / 2 + 2 < o.minX ||
            x - w / 2 - 2 > o.maxX ||
            z + d / 2 + 2 < o.minZ ||
            z - d / 2 - 2 > o.maxZ,
        );
        if (!clear || Math.abs(x) < 8 || Math.abs(z) < 8) continue;
        block(x, z, w, height, d, index % 2 ? light : material);
        return;
      }
    };
    for (let i = 0; i < 8; i++) lowCover((i / 8) * Math.PI * 2 + 0.21, 57 * K, i);
    for (let i = 0; i < 6; i++) lowCover((i / 6) * Math.PI * 2 + 0.7, 88 * K, i);
    for (const m of [material, dark, light]) {
      const ids = this.buildings.flatMap((b, i) => (b.mesh.material === m ? [i] : []));
      const mesh = new THREE.InstancedMesh(geometry, m, ids.length);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      this.intactBatches.push({ mesh, ids });
      scene.add(mesh);
    }
    this.updateIntactBatches();
    // The tilted prism keeps the intentionally simple greybox silhouette of the reference.
    const wedge = new THREE.Mesh(new THREE.ConeGeometry(4.6 * K, 5.7 * K, 4), light);
    wedge.position.set(6.5 * K, 2.5 * K, -14 * K);
    wedge.rotation.y = Math.PI / 4;
    wedge.castShadow = true;
    wedge.receiveShadow = true;
    scene.add(wedge);
    this.fixedObstacles.push({
      minX: 3.25 * K,
      maxX: 9.75 * K,
      minZ: -17.25 * K,
      maxZ: -10.75 * K,
      top: 5.35 * K,
    });
    this.obstacles.push(...this.fixedObstacles);
    const random = seededRandom(137);
    const skyline = new THREE.InstancedMesh(geometry, material, 30),
      tower = new THREE.Object3D();
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2,
        r = ARENA.halfSize + 24 + random() * 46,
        h = (28 + random() * 34) * WORLD_SCALE;
      tower.scale.set((12 + random() * 12) * WORLD_SCALE, h, (10 + random() * 10) * WORLD_SCALE);
      tower.position.set(Math.cos(a) * r, h * 0.5, Math.sin(a) * r);
      tower.updateMatrix();
      skyline.setMatrixAt(i, tower.matrix);
    }
    scene.add(skyline);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(ARENA.halfSize - 0.4, ARENA.halfSize - 0.25, 192),
      new THREE.MeshBasicMaterial({
        color: '#d4dfd9',
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.015;
    scene.add(ring);
    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(9.4, 9.43, 96),
      new THREE.MeshBasicMaterial({
        color: '#e0e3d9',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      }),
    );
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.set(-2, 0.025, -2);
    scene.add(innerRing);
    const marker = new THREE.Mesh(
      new THREE.PlaneGeometry(4.8, 2.4),
      new THREE.MeshBasicMaterial({
        map: labelTexture('01', 'H E A   /   T E S T   S I T E'),
        transparent: true,
        depthWrite: false,
      }),
    );
    marker.position.set(
      -22.9 * WORLD_SCALE,
      3.5,
      this.buildings[this.labelBuilding].volume.bounds.maxZ + 0.02,
    );
    this.wallLabel = marker;
    scene.add(marker);
    const groundMark = new THREE.Mesh(
      new THREE.PlaneGeometry(4.8, 2.4),
      new THREE.MeshBasicMaterial({
        map: labelTexture('HEA', 'M O T I O N   I S   E V E R Y T H I N G'),
        transparent: true,
        depthWrite: false,
        opacity: 0.3,
      }),
    );
    groundMark.rotation.x = -Math.PI / 2;
    groundMark.position.set(1, 0.022, 13);
    scene.add(groundMark);
    this.addScars(random);
    // One instanced draw retains ground contact even with real-time shadows disabled on mobile.
    this.contactShadows = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: contactShadowTexture(),
        color: '#26323a',
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      }),
      this.obstacles.length,
    );
    this.contactShadows.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.contactShadows.frustumCulled = false;
    scene.add(this.contactShadows);
    this.updateContactShadows();
  }
  private updateIntactBatches() {
    const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
    for (const batch of this.intactBatches) {
      batch.ids.forEach((id, i) => {
        const b = this.buildings[id];
        batch.mesh.setMatrixAt(i, b.volume.damaged ? hidden : b.mesh.matrixWorld);
      });
      batch.mesh.instanceMatrix.needsUpdate = true;
    }
  }
  get buildingCount() {
    return this.buildings.length;
  }
  private updateContactShadows() {
    const original = [...this.buildings.map((b) => b.volume.bounds), ...this.fixedObstacles];
    original.forEach((obstacle, i) => {
      const body = this.buildings[i];
      const alive = body
        ? body.volume.cells.filter((c) => c.alive).length / body.volume.cells.length
        : 1;
      const stamp = this.fragmentStamp;
      stamp.position.set(
        (obstacle.minX + obstacle.maxX) / 2,
        0.019,
        (obstacle.minZ + obstacle.maxZ) / 2,
      );
      stamp.rotation.set(-Math.PI / 2, 0, 0);
      stamp.scale.set(
        (obstacle.maxX - obstacle.minX) * 2.1 * Math.sqrt(alive),
        (obstacle.maxZ - obstacle.minZ) * 2.1 * Math.sqrt(alive),
        1,
      );
      stamp.updateMatrix();
      this.contactShadows.setMatrixAt(i, stamp.matrix);
    });
    this.contactShadows.instanceMatrix.needsUpdate = true;
  }
  private addScars(random: () => number) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const c = canvas.getContext('2d')!;
    for (let i = 0; i < 34; i++) {
      const x = 55 + random() * 145,
        y = 55 + random() * 145,
        r = 14 + random() * 43;
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(37,41,43,0.15)');
      g.addColorStop(0.5, 'rgba(52,55,57,0.12)');
      g.addColorStop(1, 'rgba(52,55,57,0)');
      c.fillStyle = g;
      c.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      color: '#60646a',
      opacity: 0.65,
    });
    for (const [x, z, s] of [
      [4, 8, 7],
      [-8, 4, 5],
      [10, -7, 6],
      [-1, -4, 5],
    ]) {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(s, s), material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = random() * 6;
      mesh.position.set(x, 0.026, z);
      this.scene.add(mesh);
    }
    // Decorative rubble strip across the centre. Kept close to the ground tone: from a
    // distance the old darker pieces merged into what read as a jagged shadow artefact.
    const rubble = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: '#868d91', roughness: 1 }),
      130,
    );
    const obj = new THREE.Object3D();
    for (let i = 0; i < 130; i++) {
      const t = (i / 130) * 20 - 10,
        s = 0.055 + random() * 0.19;
      obj.position.set(t, s * 0.5, Math.sin(t * 0.27) * 2 + 1.6 + (random() - 0.5) * 0.45);
      obj.scale.set(s, s * (0.4 + random()), s * 1.3);
      obj.rotation.set(random(), random() * 6, random());
      obj.updateMatrix();
      rubble.setMatrixAt(i, obj.matrix);
    }
    rubble.receiveShadow = true;
    this.scene.add(rubble);
  }
  setQuality(low: boolean) {
    this.sun.castShadow = !low;
  }
  get wallsBroken() {
    return this.buildings.filter((b) => b.volume.damaged).length;
  }
  /** Where the sun's shadow map is centred; call with the player every frame. */
  focusShadow(focus: THREE.Vector3) {
    const direction = new THREE.Vector3(56, 100, 35).normalize(),
      texel = (ARENA.shadowSpan * 2) / this.sun.shadow.mapSize.x;
    // Snap the focus to shadow-map texels in light space so edges do not swim as it moves.
    const up =
        Math.abs(direction.y) > 0.99 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0),
      right = new THREE.Vector3().crossVectors(up, direction).normalize(),
      lightUp = new THREE.Vector3().crossVectors(direction, right).normalize();
    const flat = new THREE.Vector3(focus.x, 0, focus.z),
      a = Math.round(flat.dot(right) / texel) * texel,
      b = Math.round(flat.dot(lightUp) / texel) * texel,
      c = flat.dot(direction);
    const snapped = new THREE.Vector3()
      .addScaledVector(right, a)
      .addScaledVector(lightUp, b)
      .addScaledVector(direction, c);
    this.sun.target.position.copy(snapped);
    this.sun.position.copy(snapped).addScaledVector(direction, 150);
    this.sun.target.updateMatrixWorld();
  }
  surfaceHeight(x: number, z: number) {
    // Sample the rendered triangles, not the ideal crater curve: feet and debris sit on the mesh.
    if (Math.abs(x) >= ARENA.terrainHalf || Math.abs(z) >= ARENA.terrainHalf) return 0;
    const cx = gridCell(x, ARENA.terrainHalf, ARENA.terrainSegments),
      cz = gridCell(z, ARENA.terrainHalf, ARENA.terrainSegments),
      ix = cx.index,
      iz = cz.index,
      u = cx.fraction,
      v = cz.fraction;
    const vertices = this.ground.geometry.attributes.position,
      stride = ARENA.terrainSegments + 1,
      a = iz * stride + ix;
    const h00 = vertices.getZ(a),
      h10 = vertices.getZ(a + 1),
      h01 = vertices.getZ(a + stride),
      h11 = vertices.getZ(a + stride + 1);
    return u + v <= 1
      ? h00 * (1 - u - v) + h10 * u + h01 * v
      : h11 * (u + v - 1) + h01 * (1 - u) + h10 * (1 - v);
  }
  reset() {
    for (const b of this.buildings) {
      b.volume.reset();
      b.mesh.visible = true;
      if (b.fragments) b.fragments.visible = false;
    }
    this.terrain.reset();
    this.updateTerrain();
    this.rebuildColliders();
  }
  private rebuildColliders() {
    this.obstacles = [
      ...this.fixedObstacles,
      ...this.buildings.flatMap((b) => b.volume.colliders()),
    ];
    this.updateIntactBatches();
    this.updateContactShadows();
    this.wallLabel.visible = !this.buildings[this.labelBuilding].volume.damaged;
  }
  get wallBounds() {
    return this.buildings.map((b) => ({ ...b.volume.bounds }));
  }
  firingLane(from: THREE.Vector3, target: THREE.Vector3, attack: AttackId): FiringLane {
    const radius =
      PROJECTILES[attack === 'missiles' ? 'missile' : attack === 'fire' ? 'fire' : 'hammer'].radius;
    const toward = target.clone().sub(from),
      distance = toward.length();
    const end = from
      .clone()
      .addScaledVector(toward.normalize(), Math.max(0, distance - radius - 0.72));
    if (this.traceGround(from, end, radius) !== null)
      return { mode: 'blocked', walls: [], thickness: Infinity };
    return assessFiringLane(from, target, attack, this.obstacles);
  }
  pierceThin(
    obstacle: Obstacle,
    from: THREE.Vector3,
    direction: THREE.Vector3,
    contact: THREE.Vector3,
  ) {
    if (obstacle.owner === undefined) return null;
    const b = this.buildings[obstacle.owner],
      span = firstSolidSpan(from, direction, b.volume.colliders());
    const thickness = span ? span.exit - span.enter : 0;
    if (thickness > HEAVY.thinDepth) return null;
    const entry = span ? from.clone().addScaledVector(direction, span.enter) : contact.clone();
    const exit = span
      ? from.clone().addScaledVector(direction, span.exit)
      : contact.clone().addScaledVector(direction, 0.25);
    const removed = b.volume.breakSegment(
      entry.clone().addScaledVector(direction, -0.12),
      exit.clone().addScaledVector(direction, 0.12),
      HEAVY.tunnelRadius,
    );
    if (!removed.length) return null;
    this.showDamage(b, removed, entry, direction.clone().multiplyScalar(30));
    return { thickness, entry, exit };
  }
  damageWall(obstacle: Obstacle, at: THREE.Vector3, force: THREE.Vector3, radius = 2.05): boolean {
    if (obstacle.owner === undefined) return false;
    const b = this.buildings[obstacle.owner];
    const removed = b.volume.breakAt(at, radius);
    if (!removed.length) return false;
    this.showDamage(b, removed, at, force);
    return true;
  }
  private showDamage(
    b: { mesh: THREE.Mesh; volume: DestructibleVolume; fragments?: THREE.InstancedMesh },
    removed: Cell[],
    at: THREE.Vector3,
    force: THREE.Vector3,
  ) {
    b.mesh.visible = false;
    if (!b.fragments) {
      b.fragments = new THREE.InstancedMesh(
        new THREE.BoxGeometry(1, 1, 1),
        b.mesh.material,
        b.volume.cells.length,
      );
      b.fragments.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      b.fragments.castShadow = true;
      b.fragments.receiveShadow = true;
      b.fragments.frustumCulled = false;
      this.scene.add(b.fragments);
    }
    b.fragments.visible = true;
    b.volume.cells.forEach((cell, i) => {
      this.fragmentStamp.position.set(cell.x, cell.y, cell.z);
      this.fragmentStamp.rotation.set(0, 0, 0);
      this.fragmentStamp.scale.set(
        cell.alive ? cell.w : 0,
        cell.alive ? cell.h : 0,
        cell.alive ? cell.d : 0,
      );
      this.fragmentStamp.updateMatrix();
      b.fragments!.setMatrixAt(i, this.fragmentStamp.matrix);
    });
    b.fragments.instanceMatrix.needsUpdate = true;
    removed
      .slice(0, 28)
      .forEach((c) => this.fx.debris(new THREE.Vector3(c.x, c.y, c.z), 1, 7, 3.2, force));
    this.fx.dust(at, 15, 2.1, force);
    this.rebuildColliders();
  }
  crater(at: THREE.Vector3, speed: number) {
    this.terrain.add(
      at.x,
      at.z,
      Math.min(5, 2.3 + speed * 0.065),
      Math.min(1.35, 0.35 + speed * 0.026),
    );
    this.updateTerrain();
    this.fx.dust(at, 22, 2.5);
    this.fx.debris(at, 24, 7, 2.5);
  }
  private updateTerrain() {
    const p = this.ground.geometry.attributes.position,
      c = this.ground.geometry.attributes.color;
    for (let i = 0; i < p.count; i++) {
      const height = this.terrain.heightAt(p.getX(i), -p.getY(i));
      p.setZ(i, height);
      const shade = Math.max(0.5, 1 + height * 0.32);
      c.setXYZ(i, shade, shade, shade);
    }
    p.needsUpdate = c.needsUpdate = true;
    this.ground.geometry.computeVertexNormals();
    this.ground.geometry.computeBoundingSphere();
  }
  traceGround(start: THREE.Vector3, end: THREE.Vector3, radius = 0): number | null {
    const steps = Math.min(24, Math.max(1, Math.ceil(start.distanceTo(end) / 0.35)));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps,
        x = start.x + (end.x - start.x) * t,
        z = start.z + (end.z - start.z) * t;
      if (start.y + (end.y - start.y) * t <= this.surfaceHeight(x, z) + radius + 0.025) {
        let a = Math.max(0, (i - 1) / steps),
          b = t;
        for (let j = 0; j < 7; j++) {
          const mid = (a + b) / 2,
            mx = start.x + (end.x - start.x) * mid,
            mz = start.z + (end.z - start.z) * mid;
          if (start.y + (end.y - start.y) * mid <= this.surfaceHeight(mx, mz) + radius + 0.025)
            b = mid;
          else a = mid;
        }
        return b;
      }
    }
    return null;
  }
}
