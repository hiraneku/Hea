import * as THREE from 'three';
import { FALL } from './combat';
import { clamp, seededRandom } from './math';

export type FallPhase = 'idle' | 'build' | 'slam' | 'press';

/**
 * The visible half of FALL: a column of falling gravity lines over the locked boss, the
 * radial crack that spreads and sinks under it, the loose stones the pressure first lifts
 * and then crushes flat, and the purple light the column throws on the world. The game
 * owns the timings, the energy and the damage; this system only dresses them, following
 * the same host-seam pattern as the Prisma system. No circles anywhere: the column and
 * the crack are the whole signature.
 */
export class FallSystem {
  private group = new THREE.Group();
  private lines!: THREE.LineSegments;
  private lineData: { x: number; z: number; y: number; length: number; speed: number }[] = [];
  private shaft!: THREE.Mesh;
  private crack!: THREE.Mesh;
  private glow!: THREE.Mesh;
  private stones!: THREE.InstancedMesh;
  private stoneData: { x: number; z: number; size: number; seed: number; lift: number }[] = [];
  private light = new THREE.PointLight('#a678ff', 0, 44, 1.8);
  /** The column's centre on the ground (the boss is locked to its x/z once slammed). */
  readonly center = new THREE.Vector3();
  private fade = 0;
  private age = 0;
  private pulse = 0;
  private stoneLift = 0;
  private dummy = new THREE.Object3D();
  private time = 0;

  constructor(
    scene: THREE.Scene,
    private groundHeight: (x: number, z: number) => number,
    reducedEffects: boolean,
  ) {
    this.buildLines(reducedEffects ? 48 : 110);
    this.buildCrack();
    this.buildStones(reducedEffects ? 18 : 34);
    this.shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(7.6, 9.4, 19, 32, 1, true),
      new THREE.MeshBasicMaterial({
        color: '#8a5cff',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.shaft.position.y = 9.5;
    this.group.add(this.shaft, this.light);
    this.light.position.y = 3;
    this.group.visible = false;
    scene.add(this.group);
  }

  private buildLines(count: number) {
    const random = seededRandom(1379);
    const positions = new Float32Array(count * 6);
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2,
        radius = Math.sqrt(random()) * 8.5;
      this.lineData.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        y: random() * 15,
        length: 0.8 + random() * 1.6,
        speed: 17 + random() * 14,
      });
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.lines = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({
        color: '#cdb2ff',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.lines.frustumCulled = false;
    this.group.add(this.lines);
  }

  private buildCrack() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const random = seededRandom(7331);
    ctx.translate(256, 256);
    // Radial jagged cracks with short branches: drawn dark with a lit core, so the same
    // texture reads as broken stone at rest and as glowing fissures under pressure.
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2 + (random() - 0.5) * 0.3;
      let x = 0,
        y = 0;
      const reach = 120 + random() * 120;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const steps = 7;
      for (let s = 1; s <= steps; s++) {
        const wobble = angle + (random() - 0.5) * 0.35;
        x += Math.cos(wobble) * (reach / steps);
        y += Math.sin(wobble) * (reach / steps);
        ctx.lineTo(x, y);
        if (random() < 0.55) {
          const branch = wobble + (random() < 0.5 ? 0.7 : -0.7);
          ctx.moveTo(x, y);
          ctx.lineTo(
            x + Math.cos(branch) * (14 + random() * 26),
            y + Math.sin(branch) * (14 + random() * 26),
          );
          ctx.moveTo(x, y);
        }
      }
      ctx.strokeStyle = 'rgba(12,7,20,0.92)';
      ctx.lineWidth = 5 + random() * 3;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(190,150,255,0.85)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    this.crack = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    this.crack.rotation.x = -Math.PI / 2;
    this.crack.rotation.z = random() * Math.PI;
    this.crack.renderOrder = 3;
    this.glow = new THREE.Mesh(
      new THREE.CircleGeometry(1, 28),
      new THREE.MeshBasicMaterial({
        color: '#7a3cff',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.glow.rotation.x = -Math.PI / 2;
    this.glow.renderOrder = 2;
    this.group.add(this.crack, this.glow);
  }

  private buildStones(count: number) {
    const random = seededRandom(2917);
    this.stones = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(0.17),
      new THREE.MeshStandardMaterial({ color: '#8d8578', roughness: 0.95, metalness: 0 }),
      count,
    );
    this.stones.frustumCulled = false;
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2,
        radius = 1.5 + Math.sqrt(random()) * 9;
      this.stoneData.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        size: 0.5 + random() * 1.1,
        seed: random() * Math.PI * 2,
        lift: 0.3 + random() * 0.7,
      });
    }
    this.group.add(this.stones);
  }

  /** The press begins: the column locks onto this ground point. */
  begin(at: THREE.Vector3) {
    this.age = 0;
    this.center.set(at.x, this.groundHeight(at.x, at.z), at.z);
    this.group.position.set(this.center.x, this.center.y, this.center.z);
    this.fade = 0;
    this.pulse = 0;
    this.stoneLift = 0;
    this.group.visible = true;
    this.crack.position.y = 0.06;
    this.glow.position.y = 0.04;
  }

  /** One crush pulse while held: the crack flares and the stones shudder. */
  crushPulse() {
    this.pulse = 1;
  }

  /** The hold ends: everything settles and fades where it lies. */
  end() {
    this.pulse = 0;
  }

  update(dt: number, phase: FallPhase, pressure: number, follow: THREE.Vector3 | null) {
    this.time += dt;
    this.age += dt;
    if (phase !== 'idle' && follow) {
      // During the build the column rides the boss — it is locked on, not aimed at a point.
      this.center.set(follow.x, this.groundHeight(follow.x, follow.z), follow.z);
      this.group.position.set(this.center.x, this.center.y, this.center.z);
    }
    const active = phase !== 'idle';
    this.fade = clamp(this.fade + (active ? dt * 3.2 : -dt * 0.7), 0, 1);
    this.group.visible = this.fade > 0.01;
    if (!this.group.visible) return;
    this.pulse = Math.max(0, this.pulse - dt * 3);
    const speedScale = phase === 'slam' ? 7 : phase === 'build' ? 0.55 : 1;
    // The word stands alone first: during the build the column only gathers in the
    // second half of the wait, so the title and the impact never arrive together.
    const gather = phase === 'build' ? clamp((this.age - 0.35) / 0.45, 0, 1) : 1;
    const attribute = this.lines.geometry.getAttribute('position') as THREE.BufferAttribute;
    const array = attribute.array as Float32Array;
    for (let i = 0; i < this.lineData.length; i++) {
      const line = this.lineData[i];
      line.y -= line.speed * speedScale * dt;
      if (line.y < 0) line.y += 15;
      const o = i * 6;
      array[o] = line.x;
      array[o + 1] = line.y;
      array[o + 2] = line.z;
      array[o + 3] = line.x;
      array[o + 4] = Math.max(0, line.y - line.length * (phase === 'press' ? 1 + pressure : 1));
      array[o + 5] = line.z;
    }
    attribute.needsUpdate = true;
    (this.lines.material as THREE.LineBasicMaterial).opacity =
      this.fade * gather * (phase === 'build' ? 0.6 : 0.55 + pressure * 0.4);
    (this.shaft.material as THREE.MeshBasicMaterial).opacity =
      this.fade * gather * (0.06 + pressure * 0.08 + this.pulse * 0.04);
    this.light.intensity = this.fade * gather * (40 + pressure * 110 + this.pulse * 40);
    // The crack spreads and deepens its glow with stored pressure; after release it keeps
    // its full shape while it fades, a record of how long the boss was held.
    const radius =
      FALL.crackRadius.start + (FALL.crackRadius.full - FALL.crackRadius.start) * pressure;
    this.crack.scale.setScalar(active ? radius : this.crack.scale.x);
    (this.crack.material as THREE.MeshBasicMaterial).opacity = this.fade * 0.96;
    this.glow.scale.setScalar(radius * (0.55 + this.pulse * 0.15));
    (this.glow.material as THREE.MeshBasicMaterial).opacity =
      this.fade * (0.16 + pressure * 0.3 + this.pulse * 0.2);
    // Stones: lifted trembling while the pressure builds, crushed flat at the slam, then
    // shuddering in the ground on every crush pulse for as long as the hold lasts.
    this.stoneLift = clamp(
      this.stoneLift + (phase === 'build' ? dt * 1.6 : phase === 'idle' ? -dt * 2 : -dt * 14),
      0,
      1,
    );
    for (let i = 0; i < this.stoneData.length; i++) {
      const stone = this.stoneData[i];
      const ground = this.groundHeight(this.center.x + stone.x, this.center.z + stone.z);
      const trembling = Math.sin(this.time * 31 + stone.seed) * 0.02 * (0.4 + pressure);
      const liftY =
        this.stoneLift * stone.lift * (0.7 + 0.3 * Math.sin(this.time * 7 + stone.seed));
      this.dummy.position.set(
        stone.x,
        ground - this.center.y + 0.05 + liftY + (phase === 'press' ? trembling : 0),
        stone.z,
      );
      this.dummy.rotation.set(stone.seed, stone.seed * 1.7, stone.seed * 0.6);
      this.dummy.scale.setScalar(stone.size * (phase === 'press' ? 0.92 : 1));
      this.dummy.updateMatrix();
      this.stones.setMatrixAt(i, this.dummy.matrix);
    }
    this.stones.instanceMatrix.needsUpdate = true;
  }
}
