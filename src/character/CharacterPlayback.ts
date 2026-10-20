import * as THREE from 'three';
import { makeCharacterStart, type StartPlan } from './CharacterStart';
import { makeCharacterStop, type StopPlan } from './CharacterStop';
import { resolveWalkingGait, type WalkingGait, type WalkingGaitSpec } from './WalkingGait';

/** DOM-independent mixer controller. Start/stop tracks are baked from the current
 * phase and pose, then played like ordinary AnimationClips (no runtime IK).
 */
export class CharacterPlayback {
  readonly mixer: THREE.AnimationMixer;
  private walkAction: THREE.AnimationAction;
  get action() {
    return this.walkAction;
  }
  private walkGait: WalkingGait;
  get gait() {
    return this.walkGait;
  }
  get authoredWalkSpeed() {
    return this.walkGait.speed;
  }
  playing = true;
  speed = 1;
  rootMotionEnabled = false;
  private targetWeight = 1;
  private weight = 1;
  private stopAction?: THREE.AnimationAction;
  private startAction?: THREE.AnimationAction;
  private launch?: StartPlan;
  private startTime = 0;
  get isStarting() {
    return this.targetWeight === 1 && !!this.launch;
  }
  get startPlan() {
    return this.launch;
  }
  private plan?: StopPlan;
  private stopTime = 0;
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
    if (this.isStarting) return this.startTime / this.launch!.clip.duration;
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
    markers?: WalkingGaitSpec,
  ) {
    const walk = THREE.AnimationClip.findByName(clips, 'Walking');
    if (!walk) throw new Error('Character has no Walking animation.');
    this.walkGait = resolveWalkingGait(model, walk, markers);
    this.mixer = new THREE.AnimationMixer(model);
    this.walkAction = this.mixer.clipAction(walk).setLoop(THREE.LoopRepeat, Infinity).play();
    this.root = model.getObjectByName('Root');
    this.mixer.update(0);
  }
  /** Replace a clip only while idle. Analyze first so invalid input leaves the
   * current playback untouched. Pass exact authoring markers if analysis is uncertain. */
  replaceWalking(clip: THREE.AnimationClip, markers?: WalkingGaitSpec) {
    if (this.mode === 'walk' || this.isStopping)
      throw new Error('Stop completely or reset to bind before replacing Walking.');
    const gait = resolveWalkingGait(this.model, clip, markers);
    this.setMode('bind', true);
    const old = this.action.getClip();
    this.action.stop();
    this.mixer.uncacheClip(old);
    this.walkAction = this.mixer.clipAction(clip).setLoop(THREE.LoopRepeat, Infinity).play();
    this.action.setEffectiveWeight(0);
    this.action.paused = true;
    this.speed = 1;
    this.walkGait = gait;
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
  }
  private discardStart() {
    if (this.startAction) {
      const clip = this.startAction.getClip();
      this.startAction.stop();
      this.mixer.uncacheClip(clip);
    }
    this.startAction = undefined;
    this.launch = undefined;
    this.startTime = 0;
  }
  private rootSample(time: number) {
    if (this.rootMotionEnabled && this.root && this.rootCurve) {
      const authored = new THREE.Vector3().fromArray(this.rootCurve.evaluate(time));
      this.motion.add(authored.clone().sub(this.previousRoot));
      this.previousRoot.copy(authored);
    }
  }
  /** immediate=true is ONLY for initial bind inspection/reset, never locomotion stop. */
  setMode(mode: 'walk' | 'bind', immediate = false) {
    const target = mode === 'walk' ? 1 : 0;
    if (immediate) {
      this.discardStart();
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
      const launch = makeCharacterStart(this.model, this.action.getClip(), this.walkGait);
      this.discardStop();
      this.discardStart();
      this.launch = launch;
      this.startTime = 0;
      const track = launch.clip.tracks.find((t) => t.name === 'Root.position')!;
      this.rootCurve = new THREE.LinearInterpolant(track.times, track.values, 3);
      this.previousRoot.set(0, 0, 0);
      this.action.setEffectiveWeight(0);
      this.action.paused = true;
      this.weight = 0;
      this.startAction = this.mixer.clipAction(launch.clip).setLoop(THREE.LoopOnce, 1);
      this.startAction.clampWhenFinished = true;
      this.startAction.play();
      this.startAction.paused = true;
      this.mixer.update(0);
    } else if (this.weight > 0.001 || this.startAction) {
      const incoming = this.launch
        ? {
            clip: this.launch.clip,
            time: this.startTime,
            joinPhase: this.launch.joinPhase,
            lead: this.launch.lead,
            endRate: this.launch.endRate,
          }
        : undefined;
      const phase = this.action.time / this.duration;
      let incomingSpeed = this.authoredWalkSpeed * Math.max(0.05, this.speed);
      if (this.launch && this.rootCurve) {
        const before = new THREE.Vector3().fromArray(
          this.rootCurve.evaluate(Math.max(0, this.startTime - 0.002)),
        );
        const after = new THREE.Vector3().fromArray(
          this.rootCurve.evaluate(Math.min(this.launch.clip.duration, this.startTime + 0.002)),
        );
        incomingSpeed = Math.max(0, (after.z - before.z) / 0.004) * this.speed;
      }
      const plan = makeCharacterStop(
        this.model,
        this.action.getClip(),
        phase,
        incomingSpeed,
        incoming,
        this.walkGait,
        Math.max(0.05, this.speed),
      );
      this.discardStart();
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
    if (this.launch) {
      this.discardStart();
      this.targetWeight = 1;
      this.weight = 1;
      this.action.setEffectiveWeight(1);
      this.action.paused = !this.playing;
      this.rootCurve = undefined;
      this.previousRoot.set(0, 0, 0);
    }
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
    if (this.targetWeight === 1 && this.launch && this.startAction) {
      const launch = this.launch,
        rate = Math.max(0.02, this.speed),
        previous = this.startTime;
      this.startTime = Math.min(
        launch.clip.duration,
        this.startTime + (this.playing ? dt : 0) * rate,
      );
      this.startAction.time = this.startTime;
      this.startAction.paused = true;
      this.mixer.update(0);
      this.rootSample(this.startTime);
      if (this.startTime >= launch.clip.duration) {
        const carry = Math.max(0, dt - (launch.clip.duration - previous) / rate);
        const joinPhase = launch.joinPhase;
        this.speed *= launch.endRate;
        this.discardStart();
        this.rootCurve = undefined;
        this.previousRoot.set(0, 0, 0);
        this.weight = 1;
        this.action.setEffectiveWeight(1);
        this.action.time = joinPhase * this.duration + carry * this.speed;
        this.action.paused = !this.playing;
        this.action.timeScale = this.speed;
        this.mixer.update(0);
        if (this.rootMotionEnabled) this.motion.z += this.authoredWalkSpeed * this.speed * carry;
      }
    } else if (this.targetWeight === 0 && this.stopAction && this.plan) {
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
