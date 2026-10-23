import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const UP = new THREE.Vector3(0, 1, 0);
const ASSEMBLY_TIME = 1.34;
const RETRACTION_TIME = 0.62;

function smooth01(value: number) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

interface StonePiece {
  mesh: THREE.Mesh;
  start: THREE.Vector3;
  target: THREE.Vector3;
  startRotation: THREE.Euler;
  targetRotation: THREE.Euler;
  delay: number;
  duration: number;
  progress: number;
  fromProgress: number;
}

interface EarthFistAssembly {
  side: number;
  group: THREE.Group;
  pieces: StonePiece[];
  originStones: THREE.Mesh[];
  groundHeight: number;
  handHeight: number;
}

/** Small coherent stones are gathered off the surface and fitted together into a fist. */
function stoneGeometry(width: number, height: number, depth: number, roundness = 0.07) {
  return new RoundedBoxGeometry(width, height, depth, 2, roundness);
}

/**
 * The Earth Battle summon is assembled from solid rock pieces visibly pulled off the ground.
 * Palm, four curled fingers, raised knuckles, thumb, and a short stony wrist arrive in order;
 * the fist faces the player's forward direction. There is deliberately no continuous soil arm.
 */
export class EarthFists {
  readonly group = new THREE.Group();
  private assemblies: EarthFistAssembly[] = [];
  private enabled = false;
  private elapsed = 0;
  private progress = 0;
  private readonly targetPosition = new THREE.Vector3();
  private readonly facing = new THREE.Quaternion();
  private readonly sideOffset = new THREE.Vector3();
  private readonly materials = [
    new THREE.MeshStandardMaterial({ color: '#77634d', roughness: 0.96, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: '#927a5b', roughness: 0.94, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: '#a68b65', roughness: 0.93, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: '#665440', roughness: 0.98, flatShading: true }),
  ];

  constructor(private readonly scene: THREE.Scene) {
    this.group.name = 'earth-battle-fists';
    this.group.visible = false;
    for (const side of [-1, 1]) this.assemblies.push(this.createAssembly(side));
    this.scene.add(this.group);
  }

  private createAssembly(side: number): EarthFistAssembly {
    const assemblyGroup = new THREE.Group();
    assemblyGroup.name = `earth-fist-${side < 0 ? 'left' : 'right'}`;
    assemblyGroup.position.set(side * 0.83, 0, -0.2);
    this.group.add(assemblyGroup);
    const pieces: StonePiece[] = [];
    let order = 0;

    const addStone = (
      name: string,
      geometry: THREE.BufferGeometry,
      materialIndex: number,
      target: [number, number, number],
      rotation: [number, number, number] = [0, 0, 0],
      assemblyDelay?: number,
    ) => {
      const mesh = new THREE.Mesh(geometry, this.materials[materialIndex % this.materials.length]);
      mesh.name = name;
      mesh.castShadow = mesh.receiveShadow = true;
      const index = order++;
      const targetPosition = new THREE.Vector3(...target);
      // Every substantial piece begins low, in the dirt around the fist's source point,
      // then travels on a short arcing path to its specific place in the hand.
      const start = new THREE.Vector3(
        THREE.MathUtils.clamp(target[0] * 0.35 + Math.sin(index * 2.21) * 0.38, -0.62, 0.62),
        0.09 + (index % 3) * 0.025,
        0.12 + Math.cos(index * 1.73) * 0.36,
      );
      const startRotation = new THREE.Euler(
        0.25 + Math.sin(index * 1.3) * 0.3,
        Math.cos(index * 1.9) * 0.55,
        Math.sin(index * 2.7) * 0.6,
      );
      assemblyGroup.add(mesh);
      pieces.push({
        mesh,
        start,
        target: targetPosition,
        startRotation,
        targetRotation: new THREE.Euler(...rotation),
        delay: assemblyDelay ?? 0.03 + index * 0.045,
        duration: 0.58,
        progress: 0,
        fromProgress: 0,
      });
    };

    // A broad palm slab is the anchor stone. It arrives first, then the wrist braces settle in.
    addStone(
      'earth-palm-stone',
      stoneGeometry(0.74, 0.66, 0.48, 0.14),
      0,
      [0, 0, 0],
      [0, 0, 0],
      0.1,
    );
    for (let index = 0; index < 3; index++) {
      const x = (index - 1) * 0.21;
      addStone(
        'earth-wrist-stone',
        stoneGeometry(0.24, 0.2, 0.34, 0.06),
        index + 1,
        [x, -0.35, 0.015],
        [0, side * (index - 1) * 0.1, side * (index - 1) * 0.06],
        0.16 + index * 0.075,
      );
    }

    // Four distinct curled fingers and four raised knuckles make the hand read as a fist,
    // not as a lump. The fist thrusts along local -Z; these dorsal details stay visible to the camera.
    for (let index = 0; index < 4; index++) {
      const x = (index - 1.5) * 0.175;
      addStone(
        'earth-curled-finger',
        stoneGeometry(0.145, 0.225, 0.17, 0.052),
        1 + (index % 2),
        [x, -0.045, 0.31],
        [0, 0, side * (index - 1.5) * 0.025],
        0.32 + index * 0.075,
      );
      addStone(
        'earth-knuckle',
        new THREE.DodecahedronGeometry(0.13, 0),
        2,
        [x, 0.235, 0.305],
        [0, 0, side * (index - 1.5) * 0.035],
        0.54 + index * 0.07,
      );
    }

    // Thin dark stone seams keep each finger separate and visible from behind the guard.
    for (let index = 0; index < 3; index++) {
      addStone(
        'earth-finger-seam',
        stoneGeometry(0.018, 0.09, 0.016, 0.004),
        3,
        [(index - 1) * 0.175 + 0.0875, 0.015, 0.405],
        [0, 0, 0],
        0.84 + index * 0.035,
      );
    }

    // The thumb folds across the inside of the fingers, mirrored toward the player for each fist.
    addStone(
      'earth-thumb',
      stoneGeometry(0.17, 0.34, 0.18, 0.062),
      2,
      [-side * 0.255, -0.035, 0.39],
      [0.03, 0, side * 0.72],
      0.88,
    );

    // A few low source stones stay on the surface under each assembly: a visible origin mark,
    // not a pillar or a trail of airborne debris.
    const originStones: THREE.Mesh[] = [];
    for (let index = 0; index < 3; index++) {
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25, 0), this.materials[3]);
      stone.name = 'earth-origin-stone';
      stone.position.set((index - 1) * 0.25, 0.08, 0.22 + (index % 2) * 0.12);
      stone.scale.set(1, 0.32, 0.7);
      stone.rotation.y = index * 0.8;
      stone.castShadow = stone.receiveShadow = true;
      assemblyGroup.add(stone);
      originStones.push(stone);
    }

    return {
      side,
      group: assemblyGroup,
      pieces,
      originStones,
      groundHeight: 0,
      handHeight: 1.5,
    };
  }

  get active() {
    return this.enabled;
  }

  setActive(active: boolean) {
    if (this.enabled === active) return;
    this.enabled = active;
    this.elapsed = 0;
    for (const assembly of this.assemblies)
      for (const piece of assembly.pieces) piece.fromProgress = piece.progress;
    if (active) this.group.visible = true;
  }

  reset() {
    this.enabled = false;
    this.elapsed = 0;
    this.progress = 0;
    this.group.visible = false;
    for (const assembly of this.assemblies) {
      for (const piece of assembly.pieces) {
        piece.progress = piece.fromProgress = 0;
        piece.mesh.position.copy(piece.start);
        piece.mesh.rotation.copy(piece.startRotation);
        piece.mesh.scale.setScalar(0.38);
      }
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
    const transition = smooth01(this.elapsed / (this.enabled ? ASSEMBLY_TIME : RETRACTION_TIME));
    this.targetPosition.set(player.x, 0, player.z);
    this.group.position.lerp(this.targetPosition, 1 - Math.exp(-12 * dt));
    this.group.rotation.y = yaw;
    this.facing.setFromAxisAngle(UP, yaw);

    let maxProgress = 0;
    for (const assembly of this.assemblies) {
      const offset = this.sideOffset
        .set(assembly.side * 0.83, 0, -0.2)
        .applyQuaternion(this.facing);
      assembly.groundHeight = groundAt(player.x + offset.x, player.z + offset.z);
      assembly.handHeight = Math.max(1.55, player.y - assembly.groundHeight + 0.52);
      assembly.group.position.y = assembly.groundHeight;

      const ready = this.enabled && assembly.pieces.every((piece) => piece.progress > 0.99);
      const bob = ready ? Math.sin(time * 2.3 + (assembly.side > 0 ? Math.PI : 0)) * 0.035 : 0;
      assembly.group.position.y += bob;
      assembly.group.rotation.x = ready ? Math.sin(time * 1.3 + assembly.side) * 0.025 : 0;
      assembly.group.rotation.z = ready
        ? -assembly.side * 0.035 + Math.sin(time * 1.7 + assembly.side) * 0.018
        : 0;

      for (const piece of assembly.pieces) {
        const rise = smooth01((this.elapsed - piece.delay) / piece.duration);
        piece.progress = this.enabled
          ? piece.fromProgress + (1 - piece.fromProgress) * rise
          : piece.fromProgress * (1 - transition);
        const amount = piece.progress;
        const arc = Math.sin(amount * Math.PI) * 0.32;
        piece.mesh.position.set(
          THREE.MathUtils.lerp(piece.start.x, piece.target.x, amount),
          THREE.MathUtils.lerp(piece.start.y, assembly.handHeight + piece.target.y, amount) + arc,
          THREE.MathUtils.lerp(piece.start.z, piece.target.z, amount),
        );
        piece.mesh.rotation.set(
          THREE.MathUtils.lerp(piece.startRotation.x, piece.targetRotation.x, amount),
          THREE.MathUtils.lerp(piece.startRotation.y, piece.targetRotation.y, amount),
          THREE.MathUtils.lerp(piece.startRotation.z, piece.targetRotation.z, amount),
        );
        piece.mesh.scale.setScalar(THREE.MathUtils.lerp(0.38, 1, amount));
        maxProgress = Math.max(maxProgress, amount);
      }
      for (const stone of assembly.originStones)
        stone.visible = this.enabled || assembly.pieces.some((piece) => piece.progress > 0);
    }

    this.progress = maxProgress;
    if (!this.enabled && maxProgress <= 0.001) this.group.visible = false;
  }
}
