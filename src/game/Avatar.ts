/**
 * The player's silhouette. The arena's physics body stays the box it has always been — every
 * collision, camera and ragdoll calculation is written against it — and this rides on top of it as
 * a child: an articulated model with its own animation clips, hidden while the jointed ragdoll
 * takes over or the camera sits in the player's eyes.
 *
 * The asset is CC0 (see public/models/AVATAR-LICENSE.txt). If it cannot be fetched the box is left
 * exactly as it was: the game plays the same without it.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export type AvatarPose = 'idle' | 'walk' | 'run' | 'air' | 'dead';

export interface AvatarState {
  /** Ground speed in m/s, the sum of every motion the body is carrying. */
  speed: number;
  /** Off the ground: jumping, flying, or thrown. */
  airborne: boolean;
  /** Health is gone. */
  dead: boolean;
}

/**
 * Which clip a body in this state should be playing. Pure and total, so the tests can pin the
 * behaviour without a renderer: death outranks everything, then air, then speed bands whose
 * thresholds sit either side of a walk (GROUND.speed) and just under the flight cruise.
 */
export function avatarPose(state: AvatarState): AvatarPose {
  if (state.dead) return 'dead';
  if (state.airborne) return 'air';
  if (state.speed > 9) return 'run';
  if (state.speed > 1.2) return 'walk';
  return 'idle';
}

/** Clip names in the model, per pose. The asset ships with all of these. */
export const POSE_CLIPS: Record<AvatarPose, string> = {
  idle: 'Idle',
  walk: 'Walking',
  run: 'Running',
  air: 'Jump',
  dead: 'Death',
};

/** How long each change of clip takes to cross-fade. */
const FADE = { idle: 0.35, walk: 0.25, run: 0.18, air: 0.14, dead: 0.1 } as const;

export class AvatarModel {
  /** Everything the model owns; empty until the asset arrives. */
  readonly group = new THREE.Group();
  private mixer?: THREE.AnimationMixer;
  private actions = new Map<AvatarPose, THREE.AnimationAction>();
  private pose: AvatarPose = 'idle';
  private speedBlend = 1;
  /** What the asset measured at load, for the diagnostics. */
  private loadInfo: { height?: number; offset?: number } = {};

  constructor(
    parent: THREE.Object3D,
    private readonly url = '/models/101172.glb',
    /** Metres from the soles to the crown the model is scaled to. */
    private readonly height = 1.52,
  ) {
    this.group.visible = false;
    parent.add(this.group);
  }

  get ready() {
    return !!this.mixer;
  }

  get current(): AvatarPose {
    return this.pose;
  }

  get measured() {
    return this.loadInfo;
  }

  get clipNames(): string[] {
    return [...this.actions.keys()];
  }

  /** Load the asset and line it up on the body. Failures are silent: the box stays. */
  async load() {
    try {
      const gltf = await new GLTFLoader().loadAsync(this.url);
      const model = gltf.scene;
      // The body is a 1.3 m box standing on its own origin, so the model is measured, scaled to
      // `height`, and stood on the box's floor rather than wherever the asset's origin happens
      // to be.
      const bounds = new THREE.Box3().setFromObject(model),
        size = new THREE.Vector3();
      bounds.getSize(size);
      if (size.y > 0) {
        model.scale.setScalar(this.height / size.y);
        bounds.setFromObject(model);
        // Feet on the box's floor (-0.65, the box being 1.3 m tall), centred on it.
        model.position.set(0, -0.65 - bounds.min.y, 0);
        this.loadInfo = {
          height: Math.round((bounds.max.y - bounds.min.y) * 100) / 100,
          offset: Math.round(model.position.y * 100) / 100,
        };
      }
      model.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        // A dim warm key on the armour, so the player reads warm in an arena of cold stone.
        const material = mesh.material as THREE.MeshStandardMaterial;
        if (material && 'emissive' in material && material.emissive)
          material.emissive.setHex(0x2a0a06);
      });
      this.group.add(model);
      this.group.visible = true;
      this.mixer = new THREE.AnimationMixer(model);
      for (const pose of Object.keys(POSE_CLIPS) as AvatarPose[]) {
        const clip = THREE.AnimationClip.findByName(gltf.animations, POSE_CLIPS[pose]);
        if (!clip) continue;
        const action = this.mixer.clipAction(clip);
        if (pose === 'dead') {
          action.setLoop(THREE.LoopOnce, 1);
          action.clampWhenFinished = true;
        }
        this.actions.set(pose, action);
      }
      this.actions.get('idle')?.play();
      this.pose = 'idle';
    } catch {
      /* The asset is optional: without it the body stays the grey box. */
    }
  }

  /**
   * Drive the clips. The walk and run cycles are played faster the quicker the body moves, so the
   * feet keep up with the physics rather than skating through it.
   */
  update(dt: number, state: AvatarState) {
    if (!this.mixer) return;
    const next = avatarPose(state);
    if (next !== this.pose) this.blend(next);
    const action = this.actions.get(this.pose);
    if (action && (this.pose === 'walk' || this.pose === 'run')) {
      const target =
        this.pose === 'run' ? 1.25 : THREE.MathUtils.clamp(state.speed / 3.4, 0.7, 1.6);
      this.speedBlend += (target - this.speedBlend) * Math.min(1, dt * 6);
      action.timeScale = this.speedBlend;
    }
    this.mixer.update(dt);
  }

  private blend(next: AvatarPose) {
    const from = this.actions.get(this.pose),
      target = this.actions.get(next);
    const fade = FADE[next];
    if (target) {
      target.reset();
      if (from && !(this.pose === 'dead')) from.crossFadeTo(target, fade, false);
      target.fadeIn(fade).play();
    }
    if (from && next === 'dead') from.fadeOut(fade);
    this.pose = next;
  }
}

/**
 * A one-line summary of the model for the diagnostics block. The height is the one measured at
 * load, not a live bounding box: a skinned rig's box follows the mesh node rather than the
 * skeleton, so it says nothing useful about where the body is actually drawn.
 */
export function avatarReport(model: AvatarModel) {
  return {
    ready: model.ready,
    pose: model.current,
    clips: model.clipNames,
    height: model.measured.height ?? 0,
    /** How far down the model was moved to stand its feet on the box's floor, metres. */
    offset: model.measured.offset ?? 0,
  };
}
