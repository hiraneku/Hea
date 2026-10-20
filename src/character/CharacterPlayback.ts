import * as THREE from 'three';
import { makeCharacterStop, type StopPlan } from './CharacterStop';

/** DOM-independent mixer controller. Stop tracks are baked from the current
 * phase and pose, then played like an ordinary AnimationClip (no runtime IK).
 */
export class CharacterPlayback {
  readonly mixer: THREE.AnimationMixer;
  readonly action: THREE.AnimationAction;
  playing = true;
  speed = 1;
  rootMotionEnabled = false;
  private targetWeight = 1;
  private weight = 1;
  private stopAction?: THREE.AnimationAction;
  private plan?: StopPlan;
  private stopTime = 0;
  private fadeTime = 0;
  private rootCurve?: THREE.LinearInterpolant;
  private readonly root?: THREE.Object3D;
  private readonly previousRoot = new THREE.Vector3();
  private readonly motion = new THREE.Vector3();

  get isStopping() {
    return this.targetWeight === 0 && !!this.plan && this.stopTime < this.plan.clip.duration - 1e-6;
  }
  get stopPlan() {
    return this.plan;
  }
  get duration() {
    return this.action.getClip().duration;
  }
  get phase() {
    return this.targetWeight === 0 && this.plan
      ? Math.min(1, this.stopTime / this.plan.clip.duration)
      : this.action.time / this.duration;
  }
  get mode() {
    return this.targetWeight === 1 ? 'walk' : 'bind';
  }

  constructor(
    readonly model: THREE.Object3D,
    clips: THREE.AnimationClip[],
  ) {
    const walk = THREE.AnimationClip.findByName(clips, 'Walking');
    if (!walk) throw new Error('Character has no Walking animation.');
    this.mixer = new THREE.AnimationMixer(model);
    this.action = this.mixer.clipAction(walk).setLoop(THREE.LoopRepeat, Infinity).play();
    this.root = model.getObjectByName('Root');
    this.mixer.update(0);
  }
  private discardStop() {
    if (this.stopAction) {
      const clip = this.stopAction.getClip();
      this.stopAction.stop();
      this.mixer.uncacheClip(clip);
    }
    this.rootCurve = undefined;
    this.stopAction = undefined;
    this.plan = undefined;
    this.stopTime = 0;
    this.fadeTime = 0;
  }
  /** immediate=true is ONLY for initial bind inspection/reset, never locomotion stop. */
  setMode(mode: 'walk' | 'bind', immediate = false) {
    const target = mode === 'walk' ? 1 : 0;
    if (immediate) {
      this.discardStop();
      this.targetWeight = target;
      this.weight = target;
      this.motion.set(0, 0, 0);
      this.previousRoot.set(0, 0, 0);
      if (target === 0) this.action.time = 0;
      this.action.setEffectiveWeight(target);
      this.action.paused = target === 0;
      this.mixer.update(0);
      this.model.updateMatrixWorld(true);
      return;
    }
    if (target === this.targetWeight) return;
    this.targetWeight = target;
    if (target === 1) {
      if (this.stopAction) {
        this.stopAction.fadeOut(0.24);
        this.fadeTime = 0.26;
        this.action.setEffectiveWeight(1).fadeIn(0.24);
        this.weight = 1;
      }
    } else if (this.weight > 0.001) {
      // Capture before disabling any action: sample zero of Stopping is identical.
      const plan = makeCharacterStop(
        this.model,
        this.action.getClip(),
        this.action.time / this.duration,
        this.model.getObjectByName('HEA_101172')!.userData.heaCharacter.walkSpeed *
          THREE.MathUtils.clamp(this.speed, 0.35, 1.8),
      );
      this.discardStop();
      this.plan = plan;
      const rootTrack = plan.clip.tracks.find((t) => t.name === 'Root.position')!;
      this.rootCurve = new THREE.LinearInterpolant(rootTrack.times, rootTrack.values, 3);
      this.previousRoot.set(0, 0, 0);
      this.action.setEffectiveWeight(0);
      this.action.paused = true;
      this.weight = 0;
      this.stopAction = this.mixer.clipAction(plan.clip).setLoop(THREE.LoopOnce, 1);
      this.stopAction.clampWhenFinished = true;
      this.stopAction.play();
      this.stopAction.paused = true;
      this.stopAction.setEffectiveWeight(1);
      this.mixer.update(0);
    }
  }
  seek(phase: number) {
    this.action.time = THREE.MathUtils.clamp(phase, 0, 0.999999) * this.duration;
    this.mixer.update(0);
    this.model.updateMatrixWorld(true);
  }
  /** Return and clear asset-local displacement. A motor applies it to its body
   * using body orientation and scale; do not also apply ordinary walk translation. */
  consumeRootMotion() {
    const result = this.motion.clone();
    this.motion.set(0, 0, 0);
    return result;
  }
  locomotion(dt: number, speed: number, grounded: boolean, authoredWalkSpeed: number) {
    this.setMode(grounded && Math.abs(speed) > 0.05 ? 'walk' : 'bind');
    const target = THREE.MathUtils.clamp(Math.abs(speed) / authoredWalkSpeed, 0.35, 1.8);
    this.speed = THREE.MathUtils.damp(this.speed, target, 8, dt);
    this.update(dt);
  }
  update(dt: number) {
    dt = Math.max(0, dt);
    if (this.targetWeight === 0 && this.stopAction && this.plan) {
      this.stopTime = Math.min(this.plan.clip.duration, this.stopTime + dt);
      this.stopAction.time = this.stopTime;
      this.stopAction.paused = true;
      this.mixer.update(0);
    } else {
      this.weight = THREE.MathUtils.damp(this.weight, this.targetWeight, 12, dt);
      this.action.setEffectiveWeight(this.weight);
      this.action.paused = !this.playing || this.targetWeight === 0;
      this.action.timeScale = this.speed;
      this.mixer.update(dt);
      if (this.fadeTime > 0) {
        this.fadeTime -= dt;
        if (this.fadeTime <= 0) this.discardStop();
      }
    }
    if (this.rootMotionEnabled && this.root) {
      if (this.targetWeight === 0 && this.plan) {
        // PropertyMixer caches identical samples. The Root bone is zeroed after
        // extraction, so read the track itself (also when holding its last frame).
        const authored = new THREE.Vector3().fromArray(this.rootCurve!.evaluate(this.stopTime));
        this.motion.add(authored.clone().sub(this.previousRoot));
        this.previousRoot.copy(authored);
      }
      this.root.position.set(0, 0, 0);
    }
    this.model.updateMatrixWorld(true);
  }
  dispose() {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.model);
  }
}
