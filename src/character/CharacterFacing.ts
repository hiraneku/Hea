import * as THREE from 'three';

export const angleDelta = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
export const HEAD_LIMIT = Math.PI / 3;
export const GROUND_PACES = [1.6, 3.4, 5.6] as const;
export const PACE_LABELS = ['JALAN', 'LARI', 'SPRINT'] as const;
export function directionalSpeed(forward: number) {
  // Backwards is most constrained; sideways lies between backwards and forwards.
  return THREE.MathUtils.lerp(0.62, 1, (THREE.MathUtils.clamp(forward, -1, 1) + 1) / 2);
}

/** World yaw only. Never pitch the entire body to follow a camera. */
export class CharacterFacing {
  yaw = 0;
  headYaw = 0;
  turnRate = 0;
  private previousView = 0;
  reset(yaw = 0) {
    this.yaw = this.previousView = yaw;
    this.headYaw = this.turnRate = 0;
  }
  update(dt: number, view: number, moving: boolean, travel: number, locked: boolean) {
    if (dt <= 0) return;
    const cameraRate = Math.abs(angleDelta(view, this.previousView)) / dt;
    this.previousView = view;
    const delta = angleDelta(view, this.yaw);
    let target = this.yaw;
    if (moving) {
      // Lock-on keeps chest mostly camera-facing, with a small diagonal allowance.
      target = locked ? view + THREE.MathUtils.clamp(angleDelta(travel, view), -0.3, 0.3) : travel;
    } else if (Math.abs(delta) > HEAD_LIMIT) {
      target = view - Math.sign(delta) * HEAD_LIMIT;
    }
    const before = this.yaw;
    const response = THREE.MathUtils.clamp(12 + cameraRate * 3, 12, 45);
    const step = angleDelta(target, this.yaw) * (1 - Math.exp(-response * dt));
    const maxStep = THREE.MathUtils.clamp(3 + cameraRate * 1.5, 3, 12) * dt;
    this.yaw += THREE.MathUtils.clamp(step, -maxStep, maxStep);
    this.turnRate = angleDelta(this.yaw, before) / dt;
    let desiredHead = THREE.MathUtils.clamp(angleDelta(view, this.yaw), -HEAD_LIMIT, HEAD_LIMIT);
    if (Math.abs(angleDelta(view, this.yaw)) > 2.7 && Math.abs(this.headYaw) > 0.01)
      desiredHead = Math.sign(this.headYaw) * HEAD_LIMIT;
    this.headYaw += (desiredHead - this.headYaw) * (1 - Math.exp(-22 * dt));
  }
}
