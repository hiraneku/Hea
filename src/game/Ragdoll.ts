import * as THREE from 'three';
import { clamp, type Obstacle } from './math';

/**
 * An articulated Verlet ragdoll for the player's blocky avatar.
 *
 * Fifteen mass points joined by rigid bones (torso, head, two arms, two legs) with joint
 * limits that stop the figure folding through itself, colliding with the warped ground and
 * the arena blocks with friction. The game's rigid tumble (`BodyTumble`) keeps owning the
 * root motion — launches, wall breaks, furrows, the camera — and this ragdoll is tethered to
 * that root at the pelvis: the body is dragged by the hit, every limb and the head trail,
 * whip and crumple on their own, and the whole figure is blended back into the standing
 * pose while the body gets up. The figure is drawn as oriented boxes in the avatar's style.
 */

export interface RagdollSurface {
  height(x: number, z: number): number;
  /** Broad-phase candidate query, so a body never scans every collider in the arena. */
  obstaclesNear(x: number, z: number, radius: number): Obstacle[];
}

const PELVIS = 0,
  CHEST = 1,
  HEAD = 2,
  SHOULDER_L = 3,
  SHOULDER_R = 4,
  ELBOW_L = 5,
  ELBOW_R = 6,
  HAND_L = 7,
  HAND_R = 8,
  HIP_L = 9,
  HIP_R = 10,
  KNEE_L = 11,
  KNEE_R = 12,
  FOOT_L = 13,
  FOOT_R = 14;

/** Standing pose, feet on y = 0, facing −Z (the avatar's face points down −Z). */
const POSE: [number, number, number][] = [
  [0, 0.64, 0],
  [0, 1.0, 0],
  [0, 1.19, 0],
  [-0.23, 1.02, 0],
  [0.23, 1.02, 0],
  [-0.29, 0.77, 0.02],
  [0.29, 0.77, 0.02],
  [-0.31, 0.53, -0.02],
  [0.31, 0.53, -0.02],
  [-0.13, 0.6, 0],
  [0.13, 0.6, 0],
  [-0.145, 0.31, -0.02],
  [0.145, 0.31, -0.02],
  [-0.15, 0.05, 0.02],
  [0.15, 0.05, 0.02],
];
/** Height of the standing pose's centre above the feet (matches the avatar box pivot). */
export const RAGDOLL_CENTER = 0.65;

/** Rigid links. Torso links are duplicated diagonally so the trunk behaves as one slab. */
const BONES: [number, number][] = [
  [PELVIS, CHEST],
  [CHEST, HEAD],
  [CHEST, SHOULDER_L],
  [CHEST, SHOULDER_R],
  [SHOULDER_L, SHOULDER_R],
  [PELVIS, SHOULDER_L],
  [PELVIS, SHOULDER_R],
  [PELVIS, HIP_L],
  [PELVIS, HIP_R],
  [HIP_L, HIP_R],
  [CHEST, HIP_L],
  [CHEST, HIP_R],
  [SHOULDER_L, ELBOW_L],
  [SHOULDER_R, ELBOW_R],
  [ELBOW_L, HAND_L],
  [ELBOW_R, HAND_R],
  [HIP_L, KNEE_L],
  [HIP_R, KNEE_R],
  [KNEE_L, FOOT_L],
  [KNEE_R, FOOT_R],
];
/** Joint limits: pairs that may never come closer than this (metres). */
const LIMITS: [number, number, number][] = [
  [HEAD, PELVIS, 0.5],
  [HEAD, HIP_L, 0.5],
  [HEAD, HIP_R, 0.5],
  [HIP_L, FOOT_L, 0.3],
  [HIP_R, FOOT_R, 0.3],
  [SHOULDER_L, HAND_L, 0.2],
  [SHOULDER_R, HAND_R, 0.2],
  [KNEE_L, CHEST, 0.42],
  [KNEE_R, CHEST, 0.42],
  [KNEE_L, HEAD, 0.6],
  [KNEE_R, HEAD, 0.6],
  [FOOT_L, CHEST, 0.45],
  [FOOT_R, CHEST, 0.45],
  [FOOT_L, PELVIS, 0.32],
  [FOOT_R, PELVIS, 0.32],
  [KNEE_L, KNEE_R, 0.12],
  [FOOT_L, FOOT_R, 0.12],
  [HAND_L, HAND_R, 0.14],
  [ELBOW_L, ELBOW_R, 0.3],
  [ELBOW_L, PELVIS, 0.22],
  [ELBOW_R, PELVIS, 0.22],
  [HAND_L, HEAD, 0.18],
  [HAND_R, HEAD, 0.18],
  [HAND_L, CHEST, 0.14],
  [HAND_R, CHEST, 0.14],
];
/** Inverse masses: the trunk is heavy and hard to swing, hands and feet fly easily. */
const INVERSE_MASS = [0.35, 0.5, 0.8, 0.7, 0.7, 1, 1, 1.2, 1.2, 0.6, 0.6, 1, 1, 1.2, 1.2];
const RADII = [
  0.17, 0.17, 0.16, 0.1, 0.1, 0.08, 0.08, 0.07, 0.07, 0.1, 0.1, 0.09, 0.09, 0.07, 0.07,
];

interface Node {
  pos: THREE.Vector3;
  prev: THREE.Vector3;
}
interface Bone {
  a: number;
  b: number;
  rest: number;
}
interface Part {
  mesh: THREE.Mesh;
  a: number;
  b: number;
  /** Fraction of the bone length the box covers (joints overlap a little). */
  cover: number;
  width: number;
  depth: number;
}

const GRAVITY = 22;
const SUBSTEPS = 4;
const ITERATIONS = 6;
const v1 = new THREE.Vector3(),
  v2 = new THREE.Vector3(),
  v3 = new THREE.Vector3(),
  up = new THREE.Vector3(0, 1, 0),
  basis = new THREE.Matrix4();

export class Ragdoll {
  readonly group = new THREE.Group();
  readonly nodes: Node[] = [];
  private bones: Bone[] = [];
  private parts: Part[] = [];
  private head: THREE.Mesh;
  private torso: THREE.Mesh;
  private hips: THREE.Mesh;
  active = false;
  /** Running tally of ground contacts (for diagnostics). */
  contacts = 0;
  spawns = 0;

  constructor(scene: THREE.Scene, material: THREE.Material) {
    this.group.name = 'player-ragdoll';
    for (const [x, y, z] of POSE)
      this.nodes.push({ pos: new THREE.Vector3(x, y, z), prev: new THREE.Vector3(x, y, z) });
    for (const [a, b] of BONES)
      this.bones.push({ a, b, rest: this.nodes[a].pos.distanceTo(this.nodes[b].pos) });
    const box = (w: number, h: number, d: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.castShadow = mesh.receiveShadow = true;
      this.group.add(mesh);
      return mesh;
    };
    this.torso = box(0.58, 0.42, 0.36);
    this.hips = box(0.5, 0.2, 0.32);
    this.head = box(0.34, 0.32, 0.34);
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.2, 0.05),
      new THREE.MeshBasicMaterial({ color: '#ffd8ba' }),
    );
    face.position.set(0, 0.03, -0.171);
    face.rotation.y = Math.PI;
    this.head.add(face);
    const limb = (a: number, b: number, width: number, depth = width, cover = 1.05) => {
      const length = this.nodes[a].pos.distanceTo(this.nodes[b].pos) * cover;
      this.parts.push({ mesh: box(width, length, depth), a, b, cover, width, depth });
    };
    limb(SHOULDER_L, ELBOW_L, 0.15);
    limb(SHOULDER_R, ELBOW_R, 0.15);
    limb(ELBOW_L, HAND_L, 0.13);
    limb(ELBOW_R, HAND_R, 0.13);
    limb(HIP_L, KNEE_L, 0.2);
    limb(HIP_R, KNEE_R, 0.2);
    limb(KNEE_L, FOOT_L, 0.17);
    limb(KNEE_R, FOOT_R, 0.17);
    this.group.visible = false;
    scene.add(this.group);
  }

  /** The standing pose with its centre at `center`, turned by `orientation`. */
  private standing(center: THREE.Vector3, orientation: THREE.Quaternion, into: THREE.Vector3[]) {
    POSE.forEach(([x, y, z], i) => {
      into[i]
        .set(x, y - RAGDOLL_CENTER, z)
        .applyQuaternion(orientation)
        .add(center);
    });
  }

  /**
   * Starts the ragdoll from the standing pose centred on `center` (the avatar box's centre),
   * facing `orientation`. The hit's direction gives every point an initial shove and `spin`
   * whips the extremities around the trunk, so the figure leaves already turning.
   */
  spawn(
    center: THREE.Vector3,
    orientation: THREE.Quaternion,
    incoming: THREE.Vector3,
    spin: THREE.Vector3,
  ) {
    const targets = this.nodes.map(() => new THREE.Vector3());
    this.standing(center, orientation, targets);
    const pelvis = targets[PELVIS],
      shove = incoming.clone().normalize().multiplyScalar(5.5),
      h = 1 / 240;
    this.nodes.forEach((node, i) => {
      node.pos.copy(targets[i]);
      v1.crossVectors(spin, v2.copy(targets[i]).sub(pelvis)).multiplyScalar(0.8);
      // Hands and feet get a little extra random fling, so no two falls look alike.
      v1.addScaledVector(
        v2.set(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5),
        i >= HAND_L ? 2.2 : 0.8,
      );
      node.prev.copy(node.pos).sub(v1.add(shove).multiplyScalar(h));
    });
    this.active = true;
    this.spawns++;
    this.group.visible = true;
  }

  /**
   * One frame: free Verlet motion with the pelvis tethered to `anchor` (the physics root plus
   * the lying-height offset), constraints, then ground and block contact with friction. During
   * recovery the whole figure is pulled towards the standing pose centred on `center` with
   * `orientation` by `rise` (0 = loose, 1 = standing), after which the avatar takes over.
   */
  step(
    dt: number,
    anchor: THREE.Vector3,
    surface: RagdollSurface,
    rise: number,
    center: THREE.Vector3,
    orientation: THREE.Quaternion,
  ) {
    if (!this.active || dt <= 0) return;
    const h = dt / SUBSTEPS,
      // Both framerate-independent: ~2 % velocity lost per 60 Hz frame, and the pelvis closes
      // ~92 % of its gap to the root per frame.
      damping = Math.pow(0.98, h * 60),
      tether = 1 - Math.pow(0.08, h * 60);
    for (let s = 0; s < SUBSTEPS; s++) {
      this.nodes.forEach((node, i) => {
        v1.copy(node.pos).sub(node.prev).multiplyScalar(damping);
        node.prev.copy(node.pos);
        node.pos.add(v1);
        node.pos.y -= GRAVITY * h * h * (i === PELVIS ? 0.3 : 1);
      });
      // The tether: the pelvis follows the physics root, the chest more loosely.
      const pelvis = this.nodes[PELVIS].pos,
        chest = this.nodes[CHEST].pos;
      v1.copy(anchor).sub(pelvis);
      pelvis.addScaledVector(v1, tether);
      chest.addScaledVector(v1, tether * 0.3);
      for (let k = 0; k < ITERATIONS; k++) {
        for (const bone of this.bones) this.relax(bone.a, bone.b, bone.rest, 1, 1);
        for (const [a, b, min] of LIMITS) this.relax(a, b, min, 0, 0.7);
      }
      this.collide(surface, h);
    }
    if (rise > 0) {
      const targets = this.nodes.map(() => new THREE.Vector3());
      this.standing(center, orientation, targets);
      const k = clamp(rise, 0, 1);
      this.nodes.forEach((node, i) => {
        node.pos.lerp(targets[i], k * k);
        node.prev.lerp(node.pos, k);
      });
    }
    this.present();
  }

  /** Distance constraint between two nodes; `mode` 1 keeps `rest`, 0 only pushes apart. */
  private relax(a: number, b: number, rest: number, mode: 0 | 1, stiffness: number) {
    const na = this.nodes[a],
      nb = this.nodes[b];
    v1.copy(nb.pos).sub(na.pos);
    const d = v1.length();
    if (d < 1e-6) return;
    if (mode === 0 && d >= rest) return;
    const wa = INVERSE_MASS[a],
      wb = INVERSE_MASS[b],
      correction = ((d - rest) / d) * (stiffness / (wa + wb));
    na.pos.addScaledVector(v1, correction * wa);
    nb.pos.addScaledVector(v1, -correction * wb);
  }

  private collide(surface: RagdollSurface, h: number) {
    this.nodes.forEach((node, i) => {
      const r = RADII[i],
        floor = surface.height(node.pos.x, node.pos.z) + r;
      let touching = false;
      if (node.pos.y < floor) {
        node.pos.y = floor;
        touching = true;
      }
      for (const b of surface.obstaclesNear(node.pos.x, node.pos.z, r + 0.1)) {
        const bottom = b.bottom ?? -Infinity;
        if (
          node.pos.x < b.minX - r ||
          node.pos.x > b.maxX + r ||
          node.pos.z < b.minZ - r ||
          node.pos.z > b.maxZ + r ||
          node.pos.y > b.top + r ||
          node.pos.y < bottom - r
        )
          continue;
        // Push out along the shallowest face: the top for a body landing on a slab, a side
        // for one slammed against it.
        const dx = Math.min(node.pos.x - (b.minX - r), b.maxX + r - node.pos.x),
          dz = Math.min(node.pos.z - (b.minZ - r), b.maxZ + r - node.pos.z),
          dy = b.top + r - node.pos.y;
        if (dy <= dx && dy <= dz) node.pos.y = b.top + r;
        else if (dx <= dz)
          node.pos.x =
            node.pos.x - (b.minX - r) < b.maxX + r - node.pos.x ? b.minX - r : b.maxX + r;
        else
          node.pos.z =
            node.pos.z - (b.minZ - r) < b.maxZ + r - node.pos.z ? b.minZ - r : b.maxZ + r;
        touching = true;
      }
      if (touching) {
        // Friction: most of the tangential velocity is lost in the contact, all of it when slow.
        v1.copy(node.pos).sub(node.prev);
        const speed = v1.length() / h,
          keep = speed > 4 ? 0.55 : 0.2;
        node.prev.copy(node.pos).addScaledVector(v1, -keep);
        this.contacts++;
      }
    });
  }

  /** Places the body boxes on the skeleton. */
  private present() {
    const n = this.nodes;
    // Trunk frame: up along the spine, right across the shoulders.
    const spine = v1.copy(n[CHEST].pos).sub(n[PELVIS].pos).normalize(),
      across = v2.copy(n[SHOULDER_R].pos).sub(n[SHOULDER_L].pos),
      forward = v3.crossVectors(across, spine).normalize();
    across.crossVectors(spine, forward).normalize();
    basis.makeBasis(across, spine, forward);
    const trunk = new THREE.Quaternion().setFromRotationMatrix(basis);
    this.torso.position.lerpVectors(n[PELVIS].pos, n[CHEST].pos, 0.62);
    this.torso.quaternion.copy(trunk);
    this.hips.position.lerpVectors(n[PELVIS].pos, n[CHEST].pos, 0.05);
    this.hips.quaternion.copy(trunk);
    // The head keeps the trunk's roll and bows along the neck.
    const neck = v1.copy(n[HEAD].pos).sub(n[CHEST].pos).normalize();
    this.head.position.copy(n[CHEST].pos).addScaledVector(neck, 0.21);
    this.head.quaternion
      .copy(trunk)
      .premultiply(
        new THREE.Quaternion().setFromUnitVectors(v2.copy(up).applyQuaternion(trunk), neck),
      );
    for (const part of this.parts) {
      const a = n[part.a].pos,
        b = n[part.b].pos;
      part.mesh.position.lerpVectors(a, b, 0.5);
      const dir = v1.copy(b).sub(a).normalize();
      part.mesh.quaternion
        .copy(trunk)
        .premultiply(
          new THREE.Quaternion().setFromUnitVectors(v2.copy(up).applyQuaternion(trunk), dir),
        );
    }
  }

  finish() {
    this.active = false;
    this.group.visible = false;
  }
  reset() {
    this.finish();
    this.contacts = this.spawns = 0;
  }
  /** Head-to-foot span and lowest point, for tests. */
  get shape() {
    const head = this.nodes[HEAD].pos,
      span = Math.max(
        head.distanceTo(this.nodes[FOOT_L].pos),
        head.distanceTo(this.nodes[FOOT_R].pos),
      );
    return {
      span,
      lowest: Math.min(...this.nodes.map((node) => node.pos.y)),
      pelvis: this.nodes[PELVIS].pos.toArray(),
      nodes: this.nodes.map((node) => node.pos.toArray().map((v) => Math.round(v * 100) / 100)),
    };
  }
}
