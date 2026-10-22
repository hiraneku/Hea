import { MathUtils } from 'three';
/** Distance-driven indoor head motion; no motion when blocked or reduced-motion is on. */
export class WalkCamera {
  private phase = 0;
  private weight = 0;
  reset() {
    this.phase = 0;
    this.weight = 0;
  }
  update(dt: number, distance: number, enabled: boolean) {
    const moving = enabled && distance > 0.0001;
    this.weight = MathUtils.damp(this.weight, moving ? 1 : 0, moving ? 7 : 12, dt);
    if (!enabled) {
      this.reset();
      return { side: 0, y: 0, roll: 0, pitch: 0 };
    }
    if (moving) this.phase = (this.phase + (distance / 0.52) * Math.PI * 2) % (Math.PI * 2);
    return {
      side: Math.sin(this.phase) * 0.008 * this.weight,
      y: Math.cos(this.phase * 2) * 0.016 * this.weight,
      roll: Math.sin(this.phase) * 0.0035 * this.weight,
      pitch: Math.sin(this.phase * 2) * 0.003 * this.weight,
    };
  }
}
