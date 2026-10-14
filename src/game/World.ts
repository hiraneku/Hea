import * as THREE from 'three';
import { Effects } from './Effects';
import { DestructibleVolume, TerrainDeformation } from './destruction';
import { seededRandom, type Obstacle } from './math';

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
  texture.repeat.set(100, 100);
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
  constructor(
    private scene: THREE.Scene,
    private fx: Effects,
  ) {
    scene.background = new THREE.Color('#b4cbd6');
    scene.fog = new THREE.Fog('#b6c5cf', 65, 190);
    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(280, 32, 20),
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
    this.sun.position.set(26, 48, 20);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = this.sun.shadow.camera.bottom = -43;
    this.sun.shadow.camera.right = this.sun.shadow.camera.top = 43;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 130;
    this.sun.shadow.normalBias = 0.035;
    this.sun.shadow.bias = -0.00015;
    this.sun.shadow.radius = 3;
    scene.add(this.sun, this.sun.target);
    const floor = new THREE.MeshStandardMaterial({
      map: gridTexture(),
      roughness: 1,
      metalness: 0,
    });
    const outer = new THREE.Shape();
    outer.moveTo(-400, -400);
    outer.lineTo(400, -400);
    outer.lineTo(400, 400);
    outer.lineTo(-400, 400);
    outer.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-56, -56);
    hole.lineTo(-56, 56);
    hole.lineTo(56, 56);
    hole.lineTo(56, -56);
    hole.closePath();
    outer.holes.push(hole);
    const outerGeometry = new THREE.ShapeGeometry(outer);
    const outerPositions = outerGeometry.attributes.position,
      outerUV = outerGeometry.attributes.uv;
    for (let i = 0; i < outerPositions.count; i++)
      outerUV.setXY(i, (outerPositions.getX(i) + 400) / 800, (outerPositions.getY(i) + 400) / 800);
    const outerGround = new THREE.Mesh(outerGeometry, floor);
    outerGround.rotation.x = -Math.PI / 2;
    outerGround.receiveShadow = true;
    scene.add(outerGround);
    const innerMap = gridTexture();
    innerMap.repeat.set(14, 14);
    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(112, 112, 112, 112),
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
      scene.add(mesh);
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
      const volume = new DestructibleVolume(bounds, this.buildings.length);
      this.buildings.push({ mesh, volume });
      this.obstacles.push(bounds);
      return mesh;
    };
    block(-2, -10, 4.5, 8.2, 1.7, dark);
    block(-2, -10, 5.4, 0.25, 3, light);
    block(-8.5, -16, 4.6, 14.5, 4, light);
    block(10, -19, 4.3, 12.5, 4.2, dark, -0.17);
    block(-17, -5, 5.7, 8.2, 5, material);
    block(16, 3, 4.2, 9.5, 4.5, material);
    block(-12, 12, 5.5, 2.5, 5, dark);
    block(7.8, -3.7, 4.5, 3.1, 3.4, dark);
    block(2.5, -24, 6, 5, 5, material);
    block(-22, -21, 4, 11, 4, dark);
    block(24, -12, 4, 6, 6, material);
    block(19, 23, 7, 3.5, 7, dark);
    block(-26, 21, 5, 7, 5, light);
    block(6, 29, 3, 10, 3, material);
    block(-22, -35, 6, 4, 4, dark);
    // The tilted prism keeps the intentionally simple greybox silhouette of the reference.
    const wedge = new THREE.Mesh(new THREE.ConeGeometry(4.6, 5.7, 4), light);
    wedge.position.set(6.5, 2.5, -14);
    wedge.rotation.y = Math.PI / 4;
    wedge.castShadow = true;
    wedge.receiveShadow = true;
    scene.add(wedge);
    this.fixedObstacles.push({ minX: 3.25, maxX: 9.75, minZ: -17.25, maxZ: -10.75, top: 5.35 });
    this.obstacles.push(...this.fixedObstacles);
    const random = seededRandom(137);
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2,
        r = 58 + random() * 28,
        h = 5 + random() * 18;
      const mesh = new THREE.Mesh(geometry, i % 3 === 0 ? dark : material);
      mesh.scale.set(3 + random() * 6, h, 3 + random() * 4);
      mesh.position.set(Math.cos(a) * r, h * 0.5, Math.sin(a) * r);
      scene.add(mesh);
    }
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(46.75, 46.88, 128),
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
    marker.position.set(-16.9, 2.5, -2.48);
    this.buildings[4].mesh.attach(marker);
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
    const rubble = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: '#646b70', roughness: 1 }),
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
  surfaceHeight(x: number, z: number) {
    // Sample the rendered triangles, not the ideal crater curve: feet and debris sit on the mesh.
    if (Math.abs(x) >= 56 || Math.abs(z) >= 56) return 0;
    const gx = x + 56,
      gz = z + 56,
      ix = Math.floor(gx),
      iz = Math.floor(gz),
      u = gx - ix,
      v = gz - iz;
    const vertices = this.ground.geometry.attributes.position,
      a = iz * 113 + ix;
    const h00 = vertices.getZ(a),
      h10 = vertices.getZ(a + 1),
      h01 = vertices.getZ(a + 113),
      h11 = vertices.getZ(a + 114);
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
  }
  damageWall(obstacle: Obstacle, at: THREE.Vector3, force: THREE.Vector3, radius = 2.05): boolean {
    if (obstacle.owner === undefined) return false;
    const b = this.buildings[obstacle.owner];
    const removed = b.volume.breakAt(at, radius);
    if (!removed.length) return false;
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
    return true;
  }
  crater(at: THREE.Vector3, speed: number) {
    this.terrain.add(
      at.x,
      at.z,
      Math.min(4.2, 1.5 + speed * 0.055),
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
  traceGround(start: THREE.Vector3, end: THREE.Vector3): number | null {
    const steps = Math.min(24, Math.max(1, Math.ceil(start.distanceTo(end) / 0.35)));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps,
        x = start.x + (end.x - start.x) * t,
        z = start.z + (end.z - start.z) * t;
      if (start.y + (end.y - start.y) * t <= this.surfaceHeight(x, z) + 0.025) {
        let a = Math.max(0, (i - 1) / steps),
          b = t;
        for (let j = 0; j < 7; j++) {
          const mid = (a + b) / 2,
            mx = start.x + (end.x - start.x) * mid,
            mz = start.z + (end.z - start.z) * mid;
          if (start.y + (end.y - start.y) * mid <= this.surfaceHeight(mx, mz) + 0.025) b = mid;
          else a = mid;
        }
        return b;
      }
    }
    return null;
  }
}
