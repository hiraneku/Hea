import * as T from 'three';

/** Pull the camera IN immediately at walls, then ease out only in clear space.
 * Five rays protect the near-plane corners as well as the central sightline. */
export function cameraClearance(
  target: T.Vector3,
  direction: T.Vector3,
  geometry: T.Object3D,
  desired = 2.25,
) {
  geometry.updateMatrixWorld(true);
  const ray = new T.Raycaster();
  const right = new T.Vector3(direction.z, 0, -direction.x).normalize();
  let distance = desired;
  for (const [side, up] of [
    [0, 0],
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ]) {
    const start = target.clone().addScaledVector(right, side * 0.12);
    start.y += up * 0.1;
    ray.set(start, direction);
    ray.near = 0;
    ray.far = desired + 0.18;
    for (const hit of ray.intersectObject(geometry, true)) {
      const mesh = hit.object as T.Mesh;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      if (mats.every((m) => m.transparent)) continue;
      distance = Math.min(distance, Math.max(0.12, hit.distance - 0.18));
      break;
    }
  }
  return distance;
}
export class HouseFollowCamera {
  distance = 2.25;
  reset() {
    this.distance = 2.25;
  }
  update(
    camera: T.PerspectiveCamera,
    dt: number,
    x: number,
    y: number,
    z: number,
    yaw: number,
    pitch: number,
    geometry: T.Object3D,
    baseFov = 67,
  ) {
    const target = new T.Vector3(x, y + 1.04, z);
    const direction = new T.Vector3(
      Math.sin(yaw) * Math.cos(pitch),
      0.36 - Math.sin(pitch) * 1.2,
      Math.cos(yaw) * Math.cos(pitch),
    ).normalize();
    const limit = cameraClearance(target, direction, geometry);
    this.distance = limit < this.distance ? limit : T.MathUtils.damp(this.distance, limit, 7, dt);
    camera.position.copy(target).addScaledVector(direction, this.distance);
    // Preserve the whole silhouette when a bedroom wall shortens the boom.
    const compression = 1 - T.MathUtils.smoothstep(this.distance, 0.75, 1.65);
    const fov = T.MathUtils.lerp(baseFov, 100, compression);
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    camera.lookAt(target);
    return this.distance > 0.66;
  }
}
