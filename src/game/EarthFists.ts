import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const UP = new THREE.Vector3(0, 1, 0);
const FORMATION_TIME = 1.05;
const RETRACTION_TIME = 0.48;

function smooth01(value: number) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

/** A gently bent, continuous forearm grown as one mesh from the ground to the wrist. */
function makeForearmGeometry(side: number) {
  const radial = 16;
  const rings = 12;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rings; row++) {
    const t = row / rings;
    const radius = THREE.MathUtils.lerp(0.53, 0.36, t) * (1 + 0.07 * Math.sin(t * Math.PI * 2));
    const centerX = side * (0.4 - 0.7 * t + 0.3 * Math.sin(t * Math.PI));
    const centerZ = THREE.MathUtils.lerp(0.32, -0.26, t) + 0.08 * Math.sin(t * Math.PI);
    for (let segment = 0; segment < radial; segment++) {
      const angle = (segment / radial) * Math.PI * 2;
      const organic = 1 + 0.045 * Math.sin(angle * 3 + t * 7) + 0.025 * Math.cos(angle * 5 - t * 4);
      positions.push(
        centerX + Math.cos(angle) * radius * organic,
        t,
        centerZ + Math.sin(angle) * radius * 0.9 * organic,
      );
    }
  }
  for (let row = 0; row < rings; row++) {
    for (let segment = 0; segment < radial; segment++) {
      const a = row * radial + segment;
      const b = row * radial + ((segment + 1) % radial);
      const c = (row + 1) * radial + segment;
      const d = (row + 1) * radial + ((segment + 1) % radial);
      indices.push(a, c, b, b, c, d);
    }
  }
  const base = positions.length / 3;
  positions.push(0, 0, 0);
  const top = positions.length / 3;
  positions.push(-side * 0.3, 1, -0.26);
  for (let segment = 0; segment < radial; segment++) {
    const next = (segment + 1) % radial;
    indices.push(base, next, segment);
    const a = rings * radial + segment;
    const b = rings * radial + next;
    indices.push(top, a, b);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeEarthFist(side: number, materials: THREE.MeshStandardMaterial[]) {
  const fist = new THREE.Group();
  const [palm, knuckle, finger, thumb] = materials;
  const palmGeometry = new RoundedBoxGeometry(0.78, 0.72, 0.54, 3, 0.12);
  const palmMesh = new THREE.Mesh(palmGeometry, palm);
  palmMesh.castShadow = palmMesh.receiveShadow = true;
  fist.add(palmMesh);

  // Four separated finger pads and a raised knuckle row create a recognisable closed hand
  // even from the camera-facing side; shallow dark seams stop the pads reading as stone bumps.
  const fingerGeometry = new RoundedBoxGeometry(0.135, 0.22, 0.16, 3, 0.05);
  const seamGeometry = new RoundedBoxGeometry(0.012, 0.075, 0.012, 1, 0.004);
  const creaseGeometry = new RoundedBoxGeometry(0.075, 0.014, 0.012, 1, 0.004);
  const knuckleGeometry = new THREE.SphereGeometry(1, 14, 10);
  const seamMaterial = materials[4];
  for (let index = 0; index < 4; index++) {
    const x = (index - 1.5) * 0.175;
    const curledFinger = new THREE.Mesh(fingerGeometry, finger);
    curledFinger.position.set(x, -0.04, 0.285);
    curledFinger.rotation.z = side * (index - 1.5) * 0.025;
    curledFinger.castShadow = curledFinger.receiveShadow = true;
    fist.add(curledFinger);

    const raisedKnuckle = new THREE.Mesh(knuckleGeometry, knuckle);
    raisedKnuckle.position.set(x, 0.225, 0.31);
    raisedKnuckle.scale.set(0.105, 0.12, 0.115);
    raisedKnuckle.castShadow = raisedKnuckle.receiveShadow = true;
    fist.add(raisedKnuckle);

    const crease = new THREE.Mesh(creaseGeometry, seamMaterial);
    crease.position.set(x, 0.13, 0.414);
    fist.add(crease);
    if (index < 3) {
      const seam = new THREE.Mesh(seamGeometry, seamMaterial);
      seam.position.set(x + 0.0875, -0.045, 0.373);
      fist.add(seam);
    }
  }

  // The inward thumb deliberately crosses the folded finger pads, not the outer edge of the wrist.
  const thumbGeometry = new RoundedBoxGeometry(0.16, 0.31, 0.17, 3, 0.065);
  const thumbMesh = new THREE.Mesh(thumbGeometry, thumb);
  thumbMesh.position.set(-side * 0.255, -0.015, 0.39);
  thumbMesh.rotation.z = side * 0.72;
  thumbMesh.castShadow = thumbMesh.receiveShadow = true;
  fist.add(thumbMesh);

  // A compact, embedded wrist ridge joins the sculpted fist to its continuous forearm.
  const wrist = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.035, 8, 18), palm);
  wrist.rotation.x = Math.PI / 2;
  wrist.position.y = -0.35;
  wrist.castShadow = wrist.receiveShadow = true;
  fist.add(wrist);
  return fist;
}

interface EarthArm {
  side: number;
  root: THREE.Group;
  forearm: THREE.Mesh;
  fist: THREE.Group;
  mound: THREE.Mesh;
  handHeight: number;
  progress: number;
  fromProgress: number;
}

/**
 * Battle Mode's earth summons. Each forearm is a single tapered mesh anchored to the sampled
 * floor; it lengthens into place before the separately readable palm, fingers, and thumb finish
 * forming. No airborne chunks are used to fake the emergence.
 */
export class EarthFists {
  readonly group = new THREE.Group();
  private arms: EarthArm[] = [];
  private enabled = false;
  private elapsed = 0;
  private progress = 0;
  private readonly targetPosition = new THREE.Vector3();
  private readonly facing = new THREE.Quaternion();
  private readonly sideOffset = new THREE.Vector3();
  private readonly materials = [
    new THREE.MeshStandardMaterial({ color: '#79654f', roughness: 0.96, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: '#a58a67', roughness: 0.93, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: '#897253', roughness: 0.97, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: '#927956', roughness: 0.94, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: '#63513e', roughness: 1, flatShading: true }),
  ];

  constructor(private readonly scene: THREE.Scene) {
    this.group.name = 'earth-battle-fists';
    this.group.visible = false;
    for (const side of [-1, 1]) {
      const root = new THREE.Group();
      root.position.x = side * 1.06;
      root.position.z = 0.15;
      root.name = `earth-arm-${side > 0 ? 'right' : 'left'}`;
      const forearm = new THREE.Mesh(makeForearmGeometry(side), this.materials[0]);
      forearm.name = 'earth-forearm';
      forearm.castShadow = forearm.receiveShadow = true;
      forearm.scale.y = 0;
      root.add(forearm);

      const fist = makeEarthFist(side, this.materials);
      fist.name = 'earth-fist';
      fist.scale.setScalar(0);
      root.add(fist);

      const mound = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 10), this.materials[4]);
      mound.position.y = 0.11;
      mound.scale.set(0, 0, 0);
      mound.castShadow = mound.receiveShadow = true;
      root.add(mound);
      this.group.add(root);
      this.arms.push({
        side,
        root,
        forearm,
        fist,
        mound,
        handHeight: 1.7,
        progress: 0,
        fromProgress: 0,
      });
    }
    this.scene.add(this.group);
  }

  get active() {
    return this.enabled;
  }

  setActive(active: boolean) {
    if (this.enabled === active) return;
    this.enabled = active;
    this.elapsed = 0;
    for (const arm of this.arms) arm.fromProgress = arm.progress;
    if (active) this.group.visible = true;
  }

  reset() {
    this.enabled = false;
    this.elapsed = 0;
    this.progress = 0;
    this.group.visible = false;
    for (const arm of this.arms) {
      arm.progress = arm.fromProgress = 0;
      arm.forearm.scale.y = 0;
      arm.fist.position.set(0, 0, -0.02);
      arm.fist.scale.setScalar(0);
      arm.mound.scale.set(0, 0, 0);
    }
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse((object) => {
      if (object instanceof THREE.Mesh) object.geometry.dispose();
    });
    this.materials.forEach((material) => material.dispose());
  }

  update(
    dt: number,
    player: THREE.Vector3,
    yaw: number,
    groundAt: (x: number, z: number) => number,
    time: number,
  ) {
    if (!this.enabled && this.progress <= 0) {
      this.group.visible = false;
      return;
    }
    this.group.visible = true;
    this.elapsed += dt;
    const transition = smooth01(
      this.elapsed / (this.enabled ? FORMATION_TIME + 0.12 : RETRACTION_TIME),
    );
    this.targetPosition.set(player.x, 0, player.z);
    this.group.position.lerp(this.targetPosition, 1 - Math.exp(-12 * dt));
    this.group.rotation.y = yaw;

    this.facing.setFromAxisAngle(UP, yaw);
    for (const arm of this.arms) {
      const sideOffset = this.sideOffset.set(arm.side * 1.06, 0, 0.15).applyQuaternion(this.facing);
      const ground = groundAt(player.x + sideOffset.x, player.z + sideOffset.z);
      arm.root.position.y = ground;
      arm.handHeight = Math.max(1.62, player.y - ground + 0.72);

      const rise = smooth01((this.elapsed - (arm.side > 0 ? 0.12 : 0)) / FORMATION_TIME);
      arm.progress = this.enabled
        ? arm.fromProgress + (1 - arm.fromProgress) * rise
        : arm.fromProgress * (1 - transition);
      const amount = arm.progress;
      arm.forearm.scale.y = Math.max(0, arm.handHeight - 0.31) * amount;
      arm.fist.position.set(-arm.side * 0.3 * amount, arm.handHeight * amount, -0.26 * amount);
      arm.fist.scale.setScalar(amount);
      arm.mound.scale.set(0.78 * amount, 0.14 * amount, 0.68 * amount);
      arm.mound.rotation.y = arm.side * -0.18;

      const ready = this.enabled && arm.progress >= 0.999;
      const bob = ready ? Math.sin(time * 2.25 + (arm.side > 0 ? Math.PI : 0)) * 0.045 : 0;
      arm.fist.position.y += bob;
      arm.fist.rotation.set(
        ready ? 0.035 + Math.sin(time * 1.35 + arm.side) * 0.018 : -0.12 * (1 - rise),
        ready ? Math.sin(time * 1.1 + arm.side) * 0.025 : 0,
        ready ? -arm.side * 0.045 + Math.sin(time * 1.7 + arm.side) * 0.018 : 0,
      );
      arm.forearm.rotation.z = ready ? arm.side * 0.018 : 0;
    }

    this.progress = Math.max(...this.arms.map((arm) => arm.progress));
    if (!this.enabled && this.progress <= 0.001) this.group.visible = false;
  }
}
