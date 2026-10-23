import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const UP = new THREE.Vector3(0, 1, 0);
const ASSEMBLY_TIME = 2.85;
const RETRACTION_TIME = 0.72;
const FIST_SCALE = 1.18;
const FIST_SPACING = 0.36;
/** Rolls the fist onto a horizontal punch axis: dorsal knuckles now project forward along -Z. */
const PUNCH_ROTATION = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

function smooth01(value: number) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

interface StonePiece {
  mesh: THREE.Mesh;
  start: THREE.Vector3;
  startWorld: THREE.Vector3;
  liftedWorld: THREE.Vector3;
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
  source: THREE.Group;
  pieces: StonePiece[];
  originStones: THREE.Mesh[];
  groundHeight: number;
  handHeight: number;
}

function stoneGeometry(width: number, height: number, depth: number, roundness = 0.09) {
  return new RoundedBoxGeometry(width, height, depth, 2, roundness);
}

/**
 * A pair of oversized stone fists assembled in a staged lift-and-flight sequence. The fists
 * follow the player, but their source stones are anchored directly in the scene at the summon
 * location and never inherit the player's later movement.
 */
export class EarthFists {
  readonly group = new THREE.Group();
  private assemblies: EarthFistAssembly[] = [];
  private enabled = false;
  private anchored = false;
  private elapsed = 0;
  private progress = 0;
  private readonly targetPosition = new THREE.Vector3();
  private readonly facing = new THREE.Quaternion();
  private readonly yawRotation = new THREE.Quaternion();
  private readonly sideOffset = new THREE.Vector3();
  private readonly targetWorld = new THREE.Vector3();
  private readonly startRotation = new THREE.Quaternion();
  private readonly targetRotation = new THREE.Quaternion();
  private readonly materials = [
    new THREE.MeshStandardMaterial({ color: '#77634d', roughness: 0.96, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: '#927a5b', roughness: 0.94, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: '#a68b65', roughness: 0.93, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: '#665440', roughness: 0.98, flatShading: true }),
  ];

  constructor(private readonly scene: THREE.Scene) {
    this.group.name = 'earth-battle-fists';
    this.group.visible = false;
    this.group.scale.setScalar(FIST_SCALE);
    for (const side of [-1, 1]) this.assemblies.push(this.createAssembly(side));
    this.scene.add(this.group);
  }

  private createAssembly(side: number): EarthFistAssembly {
    const assemblyGroup = new THREE.Group();
    assemblyGroup.name = `earth-fist-${side < 0 ? 'left' : 'right'}`;
    assemblyGroup.position.set(side * FIST_SPACING, 0, -0.18);
    this.group.add(assemblyGroup);

    // This group is deliberately a sibling in world space, not a child of the moving fist rig.
    const source = new THREE.Group();
    source.name = `earth-source-${side < 0 ? 'left' : 'right'}`;
    source.visible = false;
    this.scene.add(source);

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
      mesh.visible = false;
      mesh.castShadow = mesh.receiveShadow = true;
      const index = order++;
      const start = new THREE.Vector3(
        THREE.MathUtils.clamp(target[0] * 0.35 + Math.sin(index * 2.21) * 0.4, -0.72, 0.72),
        0.08 + (index % 3) * 0.025,
        0.12 + Math.cos(index * 1.73) * 0.4,
      );
      const startRotation = new THREE.Euler(
        0.25 + Math.sin(index * 1.3) * 0.3,
        Math.cos(index * 1.9) * 0.55,
        Math.sin(index * 2.7) * 0.6,
      );
      this.scene.add(mesh);
      const targetOrientation = new THREE.Quaternion()
        .setFromEuler(new THREE.Euler(...rotation))
        .premultiply(PUNCH_ROTATION);
      pieces.push({
        mesh,
        start,
        startWorld: new THREE.Vector3(),
        liftedWorld: new THREE.Vector3(),
        target: new THREE.Vector3(...target).applyQuaternion(PUNCH_ROTATION),
        startRotation,
        targetRotation: new THREE.Euler().setFromQuaternion(targetOrientation),
        delay: assemblyDelay ?? 0.12 + index * 0.075,
        duration: ASSEMBLY_TIME * 0.38,
        progress: 0,
        fromProgress: 0,
      });
    };

    // Wide, faceted palm, then a short braced wrist — no continuous arm or soil column.
    addStone('earth-palm-stone', stoneGeometry(0.88, 0.76, 0.59, 0.16), 0, [0, 0, 0], [0, 0, 0], 0.2);
    for (let index = 0; index < 3; index++) {
      const x = (index - 1) * 0.24;
      addStone(
        'earth-wrist-stone',
        stoneGeometry(0.29, 0.23, 0.37, 0.08),
        index + 1,
        [x, -0.39, 0.02],
        [0, side * (index - 1) * 0.1, side * (index - 1) * 0.06],
        0.56 + index * 0.13,
      );
    }

    // Four separate curled fingers, each with a second segment and a bold raised knuckle.
    for (let index = 0; index < 4; index++) {
      const x = (index - 1.5) * 0.2;
      const curl = (index - 1.5) * 0.045;
      addStone(
        'earth-curled-finger',
        stoneGeometry(0.175, 0.235, 0.19, 0.065),
        1 + (index % 2),
        [x, -0.06, 0.34],
        [curl, 0, side * (index - 1.5) * 0.035],
        0.88 + index * 0.11,
      );
      addStone(
        'earth-finger-tip',
        stoneGeometry(0.16, 0.17, 0.19, 0.055),
        index % 2 === 0 ? 0 : 2,
        [x * 0.92, -0.2, 0.42],
        [0.15 + curl, 0, side * (index - 1.5) * 0.03],
        1.22 + index * 0.1,
      );
      addStone(
        'earth-knuckle',
        new THREE.DodecahedronGeometry(0.17, 0),
        2,
        [x, 0.275, 0.34],
        [0, 0, side * (index - 1.5) * 0.04],
        1.57 + index * 0.12,
      );
    }

    // Dark seams make the four knuckles and folded fingers legible from the front.
    for (let index = 0; index < 3; index++) {
      addStone(
        'earth-finger-seam',
        stoneGeometry(0.022, 0.11, 0.02, 0.005),
        3,
        [(index - 1) * 0.2 + 0.1, 0.035, 0.445],
        [0, 0, 0],
        1.92 + index * 0.06,
      );
    }

    // The thumb folds diagonally across the fist's front, so the silhouette reads as a punch.
    addStone(
      'earth-thumb',
      stoneGeometry(0.21, 0.38, 0.22, 0.075),
      2,
      [-side * 0.31, -0.015, 0.43],
      [0.08, 0, side * 0.78],
      2.15,
    );

    const originStones: THREE.Mesh[] = [];
    for (let index = 0; index < 4; index++) {
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), this.materials[3]);
      stone.name = 'earth-origin-stone';
      stone.position.set((index - 1.5) * 0.28, 0.08, 0.18 + (index % 2) * 0.16);
      stone.scale.set(1, 0.33, 0.72);
      stone.rotation.y = index * 0.8;
      stone.castShadow = stone.receiveShadow = true;
      source.add(stone);
      originStones.push(stone);
    }

    return {
      side,
      group: assemblyGroup,
      source,
      pieces,
      originStones,
      groundHeight: 0,
      handHeight: 1.6,
    };
  }

  get active() {
    return this.enabled;
  }

  setActive(active: boolean) {
    if (this.enabled === active) return;
    this.enabled = active;
    this.elapsed = 0;
    if (active) this.group.visible = true;
    for (const assembly of this.assemblies) {
      assembly.source.visible = active || assembly.pieces.some((piece) => piece.progress > 0);
      for (const piece of assembly.pieces) piece.fromProgress = piece.progress;
    }
  }

  reset() {
    this.enabled = false;
    this.anchored = false;
    this.elapsed = 0;
    this.progress = 0;
    this.group.visible = false;
    for (const assembly of this.assemblies) {
      assembly.source.visible = false;
      for (const piece of assembly.pieces) {
        piece.progress = piece.fromProgress = 0;
        piece.mesh.position.copy(piece.startWorld);
        piece.mesh.visible = false;
      }
    }
  }

  dispose() {
    this.scene.remove(this.group);
    for (const assembly of this.assemblies) this.scene.remove(assembly.source);
    for (const assembly of this.assemblies)
      for (const piece of assembly.pieces) {
        this.scene.remove(piece.mesh);
        piece.mesh.geometry.dispose();
      }
    this.assemblies.forEach((assembly) =>
      assembly.source.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose();
      }),
    );
    this.materials.forEach((material) => material.dispose());
  }

  private anchorSources(
    player: THREE.Vector3,
    yaw: number,
    groundAt: (x: number, z: number) => number,
  ) {
    this.yawRotation.setFromAxisAngle(UP, yaw);
    this.group.position.set(player.x, 0, player.z);
    this.group.rotation.y = yaw;
    this.group.updateMatrixWorld(true);

    for (const assembly of this.assemblies) {
      const offset = this.sideOffset
        .set(assembly.side * FIST_SPACING * FIST_SCALE, 0, -0.18 * FIST_SCALE)
        .applyQuaternion(this.yawRotation);
      const x = player.x + offset.x;
      const z = player.z + offset.z;
      const ground = groundAt(x, z);
      assembly.groundHeight = ground;
      assembly.source.position.set(x, ground, z);
      assembly.source.rotation.y = yaw;
      assembly.source.visible = true;
      assembly.source.updateMatrixWorld(true);
      for (const piece of assembly.pieces) {
        piece.startWorld.copy(piece.start).applyQuaternion(this.yawRotation);
        piece.startWorld.add(assembly.source.position);
        piece.liftedWorld.copy(piece.startWorld).add(new THREE.Vector3(0, 0.62, 0));
        piece.mesh.position.copy(piece.startWorld);
        piece.mesh.quaternion.setFromEuler(piece.startRotation).premultiply(this.yawRotation);
        piece.mesh.scale.setScalar(0.48 * FIST_SCALE);
        piece.mesh.visible = true;
      }
    }
    this.anchored = true;
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
    if (this.enabled && !this.anchored) this.anchorSources(player, yaw, groundAt);

    this.targetPosition.set(player.x, 0, player.z);
    this.group.position.lerp(this.targetPosition, 1 - Math.exp(-12 * dt));
    this.group.rotation.y = yaw;
    this.group.updateMatrixWorld(true);
    this.facing.setFromAxisAngle(UP, yaw);

    let maxProgress = 0;
    for (const assembly of this.assemblies) {
      const offset = this.sideOffset
        .set(assembly.side * FIST_SPACING, 0, -0.18)
        .applyQuaternion(this.facing);
      assembly.groundHeight = groundAt(player.x + offset.x, player.z + offset.z);
      assembly.handHeight = Math.max(1.12, player.y - assembly.groundHeight + 0.3);
      assembly.group.position.y = assembly.groundHeight / FIST_SCALE;
      assembly.group.updateMatrixWorld(true);

      const ready = this.enabled && assembly.pieces.every((piece) => piece.progress > 0.99);
      const bob = ready ? Math.sin(time * 2.3 + (assembly.side > 0 ? Math.PI : 0)) * 0.035 : 0;
      assembly.group.position.y += bob;
      assembly.group.rotation.x = ready ? Math.sin(time * 1.3 + assembly.side) * 0.025 : 0;
      assembly.group.rotation.z = ready
        ? -assembly.side * 0.035 + Math.sin(time * 1.7 + assembly.side) * 0.018
        : 0;
      assembly.group.updateMatrixWorld(true);

      for (const piece of assembly.pieces) {
        const rise = smooth01((this.elapsed - piece.delay) / piece.duration);
        piece.progress = this.enabled
          ? piece.fromProgress + (1 - piece.fromProgress) * rise
          : piece.fromProgress * (1 - smooth01(this.elapsed / RETRACTION_TIME));

        this.targetWorld.set(
          piece.target.x,
          assembly.handHeight + piece.target.y,
          piece.target.z,
        );
        assembly.group.localToWorld(this.targetWorld);
        if (this.enabled) {
          const pieceTime = THREE.MathUtils.clamp((this.elapsed - piece.delay) / piece.duration, 0, 1);
          const lifted = smooth01(Math.min(1, pieceTime / 0.36));
          const assembled = smooth01(Math.max(0, (pieceTime - 0.36) / 0.64));
          if (pieceTime < 0.36) {
            piece.mesh.position.lerpVectors(piece.startWorld, piece.liftedWorld, lifted);
          } else {
            piece.mesh.position.lerpVectors(piece.liftedWorld, this.targetWorld, assembled);
            piece.mesh.position.y += Math.sin(assembled * Math.PI) * 0.24;
          }
        } else {
          piece.mesh.position.lerpVectors(piece.startWorld, this.targetWorld, piece.progress);
        }

        this.startRotation.setFromEuler(piece.startRotation).premultiply(this.facing);
        this.targetRotation.setFromEuler(piece.targetRotation).premultiply(this.facing);
        piece.mesh.quaternion.slerpQuaternions(
          this.startRotation,
          this.targetRotation,
          piece.progress,
        );
        piece.mesh.scale.setScalar(THREE.MathUtils.lerp(0.48, 1, piece.progress) * FIST_SCALE);
        maxProgress = Math.max(maxProgress, piece.progress);
      }
      for (const stone of assembly.originStones)
        stone.visible = this.enabled || assembly.pieces.some((piece) => piece.progress > 0);
    }

    this.progress = maxProgress;
    if (!this.enabled && maxProgress <= 0.001) {
      this.group.visible = false;
      for (const assembly of this.assemblies) assembly.source.visible = false;
      this.anchored = false;
      for (const piece of this.assemblies.flatMap((assembly) => assembly.pieces))
        piece.mesh.visible = false;
    }
  }
}
