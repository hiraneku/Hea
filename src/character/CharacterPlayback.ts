import * as THREE from 'three';

/** Renderer/DOM independent playback for the same GLB in preview or gameplay.
 * No runtime IK or per-vertex edits: only the exported skeleton and Walking clip.
 */
export class CharacterPlayback {
  readonly mixer: THREE.AnimationMixer;
  readonly action: THREE.AnimationAction;
  playing = true;
  speed = 1;
  private targetWeight = 1;
  private weight = 1;
  private stopRemaining = 0;
  private stopElapsed = -1;
  private stopWeight = 1;
  private stopRate = 1;
  readonly settleDuration = 0.38;

  get isStopping() {
    return this.stopRemaining > 0 || this.stopElapsed >= 0;
  }

  constructor(
    readonly model: THREE.Object3D,
    clips: THREE.AnimationClip[],
  ) {
    const walk = THREE.AnimationClip.findByName(clips, 'Walking');
    if (!walk) throw new Error('Character has no Walking animation.');
    this.mixer = new THREE.AnimationMixer(model);
    this.action = this.mixer.clipAction(walk).setLoop(THREE.LoopRepeat, Infinity).play();
    this.mixer.update(0);
  }

  get duration() {
    return this.action.getClip().duration;
  }
  get phase() {
    return this.action.time / this.duration;
  }
  get mode() {
    return this.targetWeight === 1 ? 'walk' : 'bind';
  }

  setMode(mode: 'walk' | 'bind') {
    const target = mode === 'walk' ? 1 : 0;
    if (target === this.targetWeight) return;
    this.targetWeight = target;
    if (target === 1) {
      this.stopRemaining = 0;
      this.stopElapsed = -1;
    } else if (this.weight > 0.001) {
      // Complete the current half-stride to a double-support contact before
      // settling. Never fade a lifted foot straight into the standing pose.
      const half = this.duration / 2;
      const phaseTime = this.action.time % half;
      this.stopRemaining = phaseTime < 1e-6 ? 0 : half - phaseTime;
      this.stopElapsed = 0;
      this.stopWeight = this.weight;
      this.stopRate = THREE.MathUtils.clamp(this.speed, 0.8, 1.4);
    }
  }
  seek(phase: number) {
    this.action.time = THREE.MathUtils.clamp(phase, 0, 0.999999) * this.duration;
    this.mixer.update(0);
    this.model.updateMatrixWorld(true);
  }

  /** Gameplay can call this with actual travelled speed, in the asset's units/s.
   * Keep world translation in the character motor: this is an in-place cycle.
   * Speeds above walking range require a future running clip, not a sped-up fake run.
   */
  locomotion(dt: number, speed: number, grounded: boolean, authoredWalkSpeed: number) {
    this.setMode(grounded && Math.abs(speed) > 0.05 ? 'walk' : 'bind');
    const target = THREE.MathUtils.clamp(Math.abs(speed) / authoredWalkSpeed, 0.35, 1.8);
    this.speed = THREE.MathUtils.damp(this.speed, target, 8, dt);
    this.update(dt);
  }

  update(dt: number) {
    dt = Math.max(0, dt);
    if (this.isStopping) {
      // The final step must continue even if the UI has switched playing off.
      const consumed = Math.min(dt, this.stopRemaining / this.stopRate);
      this.action.time += consumed * this.stopRate;
      this.stopRemaining = Math.max(0, this.stopRemaining - consumed * this.stopRate);
      if (this.stopRemaining < 1e-7) {
        this.stopRemaining = 0;
        this.stopElapsed += dt - consumed;
        const t = THREE.MathUtils.clamp(this.stopElapsed / this.settleDuration, 0, 1);
        this.weight = this.stopWeight * (1 - THREE.MathUtils.smootherstep(t, 0, 1));
        if (t === 1) this.stopElapsed = -1;
      }
      this.action.paused = true;
      this.action.setEffectiveWeight(this.weight);
      this.mixer.update(0);
    } else {
      this.weight = THREE.MathUtils.damp(this.weight, this.targetWeight, 12, dt);
      this.action.setEffectiveWeight(this.weight);
      this.action.paused = !this.playing;
      this.action.timeScale = this.speed;
      this.mixer.update(dt);
    }
    this.model.updateMatrixWorld(true);
  }

  dispose() {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.model);
  }
}
