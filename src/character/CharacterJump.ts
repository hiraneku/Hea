import * as THREE from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import type { CharacterAnatomy } from './anatomy101172';
import { solveLeg } from './legIK';

const ease = (u: number) => THREE.MathUtils.smootherstep(THREE.MathUtils.clamp(u, 0, 1), 0, 1);
const hermite = (a: number, b: number, v0: number, v1: number, u: number, t: number) =>
  (2 * u ** 3 - 3 * u * u + 1) * a +
  (u ** 3 - 2 * u * u + u) * v0 * t +
  (-2 * u ** 3 + 3 * u * u) * b +
  (u ** 3 - u * u) * v1 * t;
export interface JumpPlan {
  clip: THREE.AnimationClip;
  gather: number;
  charge: number;
  takeoff: number;
  apex: number;
  landing: number;
  impact: number;
  height: number;
  rootEnd: THREE.Vector3;
}
/** Flat-floor arcane vault: gather/coil, palm-driven release, asymmetric airborne
 * silhouette, impact absorption and recovery. Standard baked tracks, no viewer IK.
 * Root Y is the trajectory; a motor must consume it exactly once, without gravity
 * or a second vertical impulse. Not a collision/terrain/air-control implementation.
 */
export function makeCharacterJump(model: THREE.Object3D, forwardSpeed = 0): JumpPlan {
  if (!Number.isFinite(forwardSpeed)) throw new Error('Jump speed must be finite.');
  const scene = clone(model);
  scene.position.set(0, 0, 0);
  scene.quaternion.identity();
  scene.scale.setScalar(1);
  const anatomy = scene.getObjectByName('HEA_101172')?.userData.heaCharacter?.anatomy as
    CharacterAnatomy | undefined;
  if (!anatomy) throw new Error('Arcane jump requires the 101172 anatomy.');
  const bones = new Map<string, THREE.Bone>();
  let skin!: THREE.SkinnedMesh;
  scene.traverse((o) => {
    if (o instanceof THREE.Bone) bones.set(o.name, o);
    if (o instanceof THREE.SkinnedMesh) skin = o;
  });
  const root = bones.get('Root')!,
    hips = bones.get('Hips')!;
  root.position.set(0, 0, 0);
  scene.updateMatrixWorld(true);
  const rest = new Map(
    [...bones].map(([n, b]) => [n, { p: b.position.clone(), q: b.quaternion.clone() }]),
  );
  const sides = ['Left', 'Right'] as const;
  const sole = { Left: [] as THREE.Vector3[], Right: [] as THREE.Vector3[] };
  const positions = skin.geometry.getAttribute('position');
  for (let i = 0; i < positions.count; i++)
    if (positions.getY(i) < 0.1) {
      const side = positions.getX(i) > 0 ? 'Left' : 'Right';
      sole[side].push(
        new THREE.Vector3()
          .fromBufferAttribute(positions, i)
          .sub(new THREE.Vector3(...(side === 'Left' ? anatomy.left : anatomy.right).ankle)),
      );
    }
  const floorY = (side: 'Left' | 'Right', q: THREE.Quaternion) => {
    const normal = new THREE.Vector3(0, 1, 0).applyQuaternion(q.clone().invert());
    let low = Infinity;
    for (const p of sole[side]) low = Math.min(low, p.dot(normal));
    return 0.002 - low;
  };
  const start = Object.fromEntries(
    sides.map((s) => [
      s,
      {
        p: bones.get(s + 'Foot')!.getWorldPosition(new THREE.Vector3()),
        q: bones.get(s + 'Foot')!.getWorldQuaternion(new THREE.Quaternion()),
      },
    ]),
  ) as Record<'Left' | 'Right', { p: THREE.Vector3; q: THREE.Quaternion }>;
  const gather = 0.18,
    charge = 0.36,
    takeoff = 0.5,
    landing = 1.4,
    impact = 1.54,
    duration = 1.94,
    height = 0.72;
  const flight = landing - takeoff,
    apex = takeoff + flight / 2,
    velocity = (4 * height) / flight;
  const speed = THREE.MathUtils.clamp(forwardSpeed, 0, 1.5);
  const prepTravel = speed * 0.08 * (1 - Math.exp(-takeoff / 0.08));
  const rootEnd = new THREE.Vector3(0, 0, prepTravel + speed * 0.65);
  let standingY =
    sides.reduce(
      (sum, s) =>
        sum +
        bones.get(s + 'Shin')!.position.length() +
        bones.get(s + 'Foot')!.position.length() +
        (s === 'Left' ? anatomy.left : anatomy.right).ankle[1] +
        anatomy.pelvis[1] -
        (s === 'Left' ? anatomy.left : anatomy.right).hip[1],
      0,
    ) /
      2 -
    0.012;
  const chargedY = Math.min(rest.get('Hips')!.p.y, standingY) - 0.22;
  const targets = Object.fromEntries(
    sides.map((s) => [
      s,
      new THREE.Vector3(
        (s === 'Left' ? anatomy.left : anatomy.right).ankle[0],
        floorY(s, new THREE.Quaternion()),
        (s === 'Left' ? anatomy.left : anatomy.right).ankle[2] + rootEnd.z,
      ),
    ]),
  ) as Record<'Left' | 'Right', THREE.Vector3>;
  const reachableHipY = (side: 'Left' | 'Right', ankle: THREE.Vector3, rootZ: number) => {
    const thigh = bones.get(side + 'Thigh')!;
    const length =
      bones.get(side + 'Shin')!.position.length() +
      bones.get(side + 'Foot')!.position.length() -
      0.018;
    const dx = ankle.x - thigh.position.x,
      dz = ankle.z - rootZ - anatomy.pelvis[2] - thigh.position.z;
    return (
      ankle.y + Math.sqrt(Math.max(0.01, length * length - dx * dx - dz * dz)) - thigh.position.y
    );
  };
  standingY = Math.min(standingY, ...sides.map((s) => reachableHipY(s, targets[s], rootEnd.z)));
  const launchY = Math.min(
    standingY - 0.025,
    ...sides.map(
      (s) =>
        reachableHipY(
          s,
          new THREE.Vector3(start[s].p.x, floorY(s, start[s].q), start[s].p.z),
          prepTravel,
        ) - 0.008,
    ),
  );
  // Keyed upper-body poses: the palms coil in front, sweep down on release,
  // then spread asymmetrically to shape the airborne arc (not a generic squat).
  const poses = [
    {
      t: gather,
      spine: 0.08,
      twist: 0.04,
      arm: [-0.22, -0.18],
      elbow: [-0.45, -0.36],
      spread: [-0.1, 0.1],
    },
    {
      t: charge,
      spine: 0.18,
      twist: 0.1,
      arm: [-0.76, -0.58],
      elbow: [-1.05, -0.9],
      spread: [-0.17, 0.12],
    },
    {
      t: takeoff,
      spine: -0.045,
      twist: -0.035,
      arm: [0.18, 0.24],
      elbow: [-0.2, -0.16],
      spread: [0.14, -0.17],
    },
    {
      t: apex,
      spine: -0.025,
      twist: -0.075,
      arm: [-0.32, -0.08],
      elbow: [-0.74, -0.4],
      spread: [0.3, -0.22],
    },
    {
      t: landing,
      spine: 0.055,
      twist: 0,
      arm: [-0.18, -0.2],
      elbow: [-0.36, -0.32],
      spread: [0.08, -0.08],
    },
    {
      t: impact,
      spine: 0.17,
      twist: 0,
      arm: [-0.4, -0.37],
      elbow: [-0.63, -0.58],
      spread: [-0.04, 0.04],
    },
    {
      t: duration,
      spine: 0,
      twist: 0,
      arm: [-0.015, -0.015],
      elbow: [-0.1, -0.1],
      spread: [-0.04, 0.04],
    },
  ];
  const upperPose = (name: string, index: number) => {
    const p = poses[index];
    const side = name.startsWith('Left') ? 0 : 1;
    if (name === 'Spine')
      return new THREE.Quaternion().setFromEuler(new THREE.Euler(p.spine, p.twist, 0));
    if (name === 'Chest')
      return new THREE.Quaternion().setFromEuler(
        new THREE.Euler(-p.spine * 0.28, -p.twist * 0.5, 0),
      );
    if (name === 'Neck' || name === 'Head')
      return new THREE.Quaternion().setFromEuler(new THREE.Euler(-p.spine * 0.25, 0, 0));
    if (name.endsWith('UpperArm'))
      return new THREE.Quaternion().setFromEuler(new THREE.Euler(p.arm[side], 0, p.spread[side]));
    if (name.endsWith('ForeArm'))
      return new THREE.Quaternion().setFromEuler(new THREE.Euler(p.elbow[side], 0, 0));
    if (name.endsWith('Hand'))
      return new THREE.Quaternion().setFromEuler(new THREE.Euler(index === 1 ? -0.12 : 0, 0, 0));
    return new THREE.Quaternion();
  };
  const values = new Map<string, number[]>(),
    times: number[] = [];
  const frames = Math.ceil(duration * 120);
  for (let frame = 0; frame <= frames; frame++) {
    const t = (duration * frame) / frames;
    for (const [n, b] of bones) {
      b.position.copy(rest.get(n)!.p);
      b.quaternion.copy(rest.get(n)!.q);
    }
    let key = poses.findIndex((p) => p.t >= t);
    if (key < 0) key = poses.length - 1;
    const previous = key === 0 ? 0 : poses[key - 1].t;
    const blend = ease((t - previous) / (poses[key].t - previous));
    for (const [n, b] of bones)
      if (!/Thigh|Shin|Foot|Toes|ToeEnd/.test(n)) {
        const from = key === 0 ? rest.get(n)!.q : upperPose(n, key - 1);
        b.quaternion.copy(from).slerp(upperPose(n, key), blend);
      }
    const u = THREE.MathUtils.clamp((t - takeoff) / flight, 0, 1);
    root.position.set(
      0,
      t > takeoff && t < landing
        ? 4 * height * u * (1 - u) + 0.055 * Math.sin(Math.PI * u) ** 4
        : 0,
      t < takeoff
        ? speed * 0.08 * (1 - Math.exp(-t / 0.08))
        : prepTravel + (rootEnd.z - prepTravel) * ease(u),
    );
    if (t <= charge)
      hips.position.y = THREE.MathUtils.lerp(rest.get('Hips')!.p.y, chargedY, ease(t / charge));
    else if (t < takeoff)
      hips.position.y = hermite(
        chargedY,
        launchY,
        0,
        velocity,
        (t - charge) / (takeoff - charge),
        takeoff - charge,
      );
    else if (t < landing)
      hips.position.y =
        THREE.MathUtils.lerp(launchY, standingY, ease(u / 0.18)) - 0.03 * ease((u - 0.75) / 0.25);
    else if (t < impact)
      hips.position.y = hermite(
        standingY - 0.03,
        standingY - 0.19,
        -velocity,
        0,
        (t - landing) / (impact - landing),
        impact - landing,
      );
    else
      hips.position.y = THREE.MathUtils.lerp(
        standingY - 0.19,
        standingY,
        ease((t - impact) / (duration - impact)),
      );
    hips.position.x = rest.get('Hips')!.p.x * (1 - ease(t / takeoff));
    hips.position.z = THREE.MathUtils.lerp(
      rest.get('Hips')!.p.z,
      anatomy.pelvis[2],
      ease(t / takeoff),
    );
    if (frame > 0)
      for (const [i, s] of sides.entries()) {
        const q = start[s].q.clone();
        let ankle: THREE.Vector3;
        if (t <= takeoff) {
          ankle = start[s].p.clone();
          ankle.y = THREE.MathUtils.lerp(start[s].p.y, floorY(s, q), ease(t / gather));
          ankle.y = Math.max(ankle.y, floorY(s, q));
        } else {
          ankle = start[s].p.clone().lerp(targets[s], ease(u));
          const tuck = Math.sin(Math.PI * u) ** 2;
          const airQ = new THREE.Quaternion().setFromEuler(
            new THREE.Euler((i === 0 ? 0.22 : 0.14) * tuck, 0, 0),
          );
          q.slerp(airQ, ease(u / 0.18));
          ankle.z -= (i === 0 ? 0.1 : 0.055) * tuck;
          ankle.y = floorY(s, q) + root.position.y + (i === 0 ? 0.18 : 0.105) * tuck;
          if (t >= landing) ankle.copy(targets[s]);
        }
        solveLeg(s, ankle, bones, scene);
        scene.updateMatrixWorld(true);
        bones
          .get(s + 'Foot')!
          .quaternion.copy(
            bones
              .get(s + 'Shin')!
              .getWorldQuaternion(new THREE.Quaternion())
              .invert(),
          )
          .multiply(q);
        bones.get(s + 'Toes')!.quaternion.identity();
      }
    scene.updateMatrixWorld(true);
    times.push(t);
    for (const [n, b] of bones) {
      const name = n + '.quaternion',
        v = values.get(name) ?? [],
        q = b.quaternion.clone().normalize();
      if (v.length && q.dot(new THREE.Quaternion().fromArray(v, v.length - 4)) < 0)
        q.set(-q.x, -q.y, -q.z, -q.w);
      v.push(...q.toArray());
      values.set(name, v);
    }
    for (const b of [root, hips]) {
      const n = b.name + '.position',
        v = values.get(n) ?? [];
      v.push(...b.position.toArray());
      values.set(n, v);
    }
  }
  return {
    gather,
    charge,
    takeoff,
    apex,
    landing,
    impact,
    height: height + 0.055,
    rootEnd,
    clip: new THREE.AnimationClip(
      'ArcaneJump',
      duration,
      [...values].map(([n, v]) =>
        n.endsWith('.position')
          ? new THREE.VectorKeyframeTrack(n, times, v)
          : new THREE.QuaternionKeyframeTrack(n, times, v),
      ),
    ),
  };
}
