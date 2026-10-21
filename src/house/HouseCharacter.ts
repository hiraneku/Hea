import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CharacterPlayback } from '../character/CharacterPlayback';
import { CharacterLocomotion } from '../character/CharacterLocomotion';
import { CharacterFacing } from '../character/CharacterFacing';
import { CharacterArmSpace } from '../character/CharacterArmSpace';
import { CharacterLook } from '../character/CharacterLook';
import { M } from './materials';

/** House motor owns world translation. The existing private rig supplies poses only. */
export class HouseCharacter {
  readonly root = new T.Group();
  readonly facing = new CharacterFacing();
  readonly playback: CharacterPlayback;
  private readonly gait: CharacterLocomotion;
  private readonly arms: CharacterArmSpace;
  private readonly look: CharacterLook;
  private readonly contact: T.Mesh;
  readonly scale = 0.82; // Original normalized 2 m rig -> 1.64 m household stature.
  private constructor(
    readonly model: T.Group,
    animations: T.AnimationClip[],
  ) {
    model.scale.setScalar(this.scale);
    this.root.name = 'HouseStickman';
    this.root.add(model);
    model.traverse((o) => {
      if (o instanceof T.Mesh) {
        // The house caches its architectural shadow map. A moving contact decal
        // anchors the avatar without forcing the complete house shadow to redraw.
        o.castShadow = false;
        o.receiveShadow = true;
        if (o instanceof T.SkinnedMesh) o.frustumCulled = false;
      }
    });
    this.playback = new CharacterPlayback(model, animations);
    this.playback.rootMotionEnabled = true;
    this.playback.setMode('bind', true);
    this.gait = new CharacterLocomotion(model);
    this.arms = new CharacterArmSpace(model);
    this.look = new CharacterLook(model);
    const mat = M.ao.clone();
    mat.opacity = 0.8;
    this.contact = new T.Mesh(new T.PlaneGeometry(0.7, 0.6), mat);
    this.contact.rotation.x = -Math.PI / 2;
    this.contact.position.y = 0.035;
    this.root.add(this.contact);
  }
  static async load(url: string) {
    const gltf = await new GLTFLoader().loadAsync(url);
    if (
      !gltf.scene.getObjectByName('HEA_101172')?.userData.heaCharacter?.anatomy ||
      !gltf.animations.some((a) => a.name === 'Walking')
    )
      throw new Error('Rig stickman/Walking tidak tersedia');
    return new HouseCharacter(gltf.scene, gltf.animations);
  }
  reset(x: number, y: number, z: number, viewYaw: number) {
    this.look.clear();
    this.gait.reset();
    this.playback.setMode('bind', true);
    this.facing.reset(viewYaw + Math.PI);
    this.root.position.set(x, y, z);
    this.model.rotation.y = this.facing.yaw;
  }
  update(
    dt: number,
    x: number,
    y: number,
    z: number,
    vx: number,
    vz: number,
    viewYaw: number,
    pitch: number,
  ) {
    const speed = Math.hypot(vx, vz),
      moving = speed > 0.025;
    this.look.clear();
    this.facing.update(
      dt,
      viewYaw + Math.PI,
      moving,
      moving ? Math.atan2(vx, vz) : this.facing.yaw,
      false,
    );
    this.model.rotation.y = this.facing.yaw;
    this.root.position.set(x, y, z);
    this.playback.playing = true;
    if (moving)
      this.playback.speed = T.MathUtils.clamp(
        speed / (this.playback.authoredWalkSpeed * this.scale),
        0.5,
        2.2,
      );
    this.playback.setMode(moving ? 'walk' : 'bind');
    this.playback.update(dt);
    this.playback.consumeRootMotion(); // House collision/ramp is the only position authority.
    const local = new T.Vector3(vx / this.scale, 0, vz / this.scale).applyAxisAngle(
      new T.Vector3(0, 1, 0),
      -this.facing.yaw,
    );
    this.gait.apply(dt, {
      x: local.x,
      forward: local.z,
      pace: 0,
      airborne: false,
      turnRate: this.facing.turnRate,
    });
    this.arms.apply();
    this.look.apply(this.facing.headYaw, pitch * 0.4, dt);
  }
  setVisible(visible: boolean) {
    this.root.visible = visible;
  }
  snapshot() {
    return {
      loaded: true,
      position: { x: this.root.position.x, y: this.root.position.y, z: this.root.position.z },
      visible: this.root.visible,
      bodyYaw: this.facing.yaw,
      walkPhase: this.playback.phase,
      stature: 1.64,
    };
  }
  dispose() {
    this.playback.dispose();
    this.contact.geometry.dispose();
    (this.contact.material as T.Material).dispose();
    this.model.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.geometry.dispose();
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.dispose();
      }
    });
  }
}
