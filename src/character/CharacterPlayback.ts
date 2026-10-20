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
    this.targetWeight = mode === 'walk' ? 1 : 0;
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
    this.weight = THREE.MathUtils.damp(this.weight, this.targetWeight, 12, dt);
    this.action.setEffectiveWeight(this.weight);
    this.action.paused = !this.playing;
    this.action.timeScale = this.speed;
    this.mixer.update(dt);
    this.model.updateMatrixWorld(true);
  }

  dispose() {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.model);
  }
}
