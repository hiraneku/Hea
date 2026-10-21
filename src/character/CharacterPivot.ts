import * as THREE from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { solveLeg } from './legIK';

const sides = ['Left', 'Right'] as const;
type Side = (typeof sides)[number];
const up = new THREE.Vector3(0, 1, 0);

/** Stationary pivot, not a forward walk cycle. The support foot counter-rotates
 * body yaw; the other foot briefly lifts and reorients, then support exchanges.
 * Solve pelvis height from leg reach rather than lowering it into a crouch. */
export class CharacterPivot {
  private readonly rig: THREE.Object3D;
  private readonly bones = new Map<string, THREE.Bone>();
  private readonly actual = new Map<string, THREE.Bone>();
  private readonly rest = new Map<string, { p: THREE.Vector3; q: THREE.Quaternion }>();
  private feet = { Left: new THREE.Vector3(), Right: new THREE.Vector3() };
  private yaw = { Left: 0, Right: 0 };
  private side?: Side;
  private from = new THREE.Vector3();
  private fromYaw = 0;
  private progress = 0;
  private weight = 0;
  private duration = 0.28;
  private readonly floor = { Left: 0.194, Right: 0.194 };
  constructor(private readonly model: THREE.Object3D) {
    this.rig = clone(model);
    this.rig.position.set(0, 0, 0);
    this.rig.quaternion.identity();
    this.rig.scale.setScalar(1);
    this.rig.traverse((o) => {
      if (o instanceof THREE.Bone) {
        this.bones.set(o.name, o);
        this.rest.set(o.name, { p: o.position.clone(), q: o.quaternion.clone() });
      }
    });
    model.traverse((o) => {
      if (o instanceof THREE.Bone) this.actual.set(o.name, o);
    });
    const anatomy = model.getObjectByName('HEA_101172')!.userData.heaCharacter.anatomy;
    model.traverse((o) => {
      if (!(o instanceof THREE.SkinnedMesh)) return;
      const p = o.geometry.getAttribute('position');
      for (const side of sides) {
        let low = Infinity;
        for (let i = 0; i < p.count; i++)
          if (p.getX(i) > 0 === (side === 'Left') && p.getY(i) < 0.1)
            low = Math.min(low, p.getY(i));
        this.floor[side] = (side === 'Left' ? anatomy.left : anatomy.right).ankle[1] - low + 0.003;
      }
    });
  }
  reset() {
    this.side = undefined;
    this.progress = this.weight = 0;
  }
  private neutral(side: Side) {
    return new THREE.Vector3(side === 'Left' ? 0.15 : -0.15, this.floor[side], -0.045);
  }
  private begin(side: Side, rate: number) {
    this.side = side;
    this.from.copy(this.feet[side]);
    this.fromYaw = this.yaw[side];
    this.progress = 0;
    this.duration = THREE.MathUtils.clamp(0.32 - Math.abs(rate) * 0.018, 0.18, 0.32);
  }
  apply(dt: number, rate: number) {
    if (dt <= 0) return this.weight > 0.001;
    const turning = Math.abs(rate) > 0.12;
    if (!this.side && turning && this.weight < 0.001) {
      this.model.updateMatrixWorld(true);
      const inverse = this.model.getWorldQuaternion(new THREE.Quaternion()).invert();
      for (const s of sides) {
        const foot = this.actual.get(s + 'Foot')!;
        this.feet[s].copy(this.model.worldToLocal(foot.getWorldPosition(new THREE.Vector3())));
        this.feet[s].y = this.floor[s];
        const q = foot.getWorldQuaternion(new THREE.Quaternion()).premultiply(inverse);
        this.yaw[s] = new THREE.Euler().setFromQuaternion(q, 'YXZ').y;
      }
      this.begin(rate > 0 ? 'Left' : 'Right', rate);
    }
    const delta = rate * dt;
    for (const s of sides) {
      this.feet[s].applyAxisAngle(up, -delta);
      this.yaw[s] -= delta;
    }
    if (this.side) {
      this.from.applyAxisAngle(up, -delta);
      this.fromYaw -= delta;
      this.progress = Math.min(1, this.progress + dt / this.duration);
      const blend = THREE.MathUtils.smootherstep(this.progress, 0, 1);
      const s = this.side;
      this.feet[s].copy(this.from).lerp(this.neutral(s), blend);
      this.feet[s].y += Math.sin(Math.PI * this.progress) ** 2 * 0.032;
      this.yaw[s] = THREE.MathUtils.lerp(this.fromYaw, 0, blend);
      if (this.progress >= 1) {
        const next = s === 'Left' ? 'Right' : 'Left';
        this.side = undefined;
        if (
          turning ||
          this.feet[next].distanceTo(this.neutral(next)) > 0.025 ||
          Math.abs(this.yaw[next]) > 0.08
        )
          this.begin(next, rate);
      }
    }
    this.weight += ((this.side || turning ? 1 : 0) - this.weight) * (1 - Math.exp(-14 * dt));
    if (this.weight < 0.001) return false;
    for (const [name, bone] of this.bones) {
      bone.position.copy(this.rest.get(name)!.p);
      bone.quaternion.copy(this.rest.get(name)!.q);
    }
    this.bones.get('Root')!.position.set(0, 0, 0);
    const hips = this.bones.get('Hips')!;
    // Both soles remain reachable; the planted leg is almost fully extended.
    const heights = sides.map((s) => {
      const thigh = this.bones.get(s + 'Thigh')!;
      const length =
        this.bones.get(s + 'Shin')!.position.length() +
        this.bones.get(s + 'Foot')!.position.length() -
        0.002;
      const ankle = this.feet[s];
      const dx = ankle.x - thigh.position.x,
        dz = ankle.z - hips.position.z - thigh.position.z;
      return (
        ankle.y + Math.sqrt(Math.max(0.1, length * length - dx * dx - dz * dz)) - thigh.position.y
      );
    });
    hips.position.y = Math.min(...heights);
    for (const s of sides) {
      solveLeg(s, this.feet[s], this.bones, this.rig);
      this.rig.updateMatrixWorld(true);
      const foot = this.bones.get(s + 'Foot')!;
      foot.quaternion
        .copy(foot.parent!.getWorldQuaternion(new THREE.Quaternion()).invert())
        .multiply(new THREE.Quaternion().setFromAxisAngle(up, this.yaw[s]));
    }
    for (const [name, bone] of this.actual) {
      if (/Root|Head|Neck/.test(name)) continue;
      bone.quaternion.slerp(this.bones.get(name)!.quaternion, this.weight);
      if (name === 'Hips') bone.position.lerp(hips.position, this.weight);
    }
    return true;
  }
}
