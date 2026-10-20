import * as THREE from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import type { CharacterAnatomy } from './anatomy101172';
import { solveLeg } from './legIK';
import {
  resolveWalkingGait,
  nextFootContact,
  isFootPlanted,
  phaseDistance,
  type WalkingGait,
  type FootSide,
} from './WalkingGait';

const smooth = (u: number) => THREE.MathUtils.smootherstep(THREE.MathUtils.clamp(u, 0, 1), 0, 1);
function hermite(a: number, b: number, v0: number, v1: number, t: number, duration: number) {
  return (
    (2 * t * t * t - 3 * t * t + 1) * a +
    (t * t * t - 2 * t * t + t) * v0 * duration +
    (-2 * t * t * t + 3 * t * t) * b +
    (t * t * t - t * t) * v1 * duration
  );
}
export interface StopPlan {
  clip: THREE.AnimationClip;
  lead: 'Left' | 'Right';
  firstContact: number;
  followStart: number;
  secondContact: number;
  rootEnd: THREE.Vector3;
}

/** Bake a phase-specific, two-step stop into ordinary glTF-compatible bone tracks.
 * Lead foot lands first; the other foot then closes beside it. Targets stay in
 * one fixed authoring/world frame, never move with the pelvis after contact.
 * Geometry/materials are shared read-only. No viewer code or per-frame vertex edits.
 */
export function makeCharacterStop(
  model: THREE.Object3D,
  walk: THREE.AnimationClip,
  phase: number,
  speed: number,
  incoming?: {
    clip: THREE.AnimationClip;
    time: number;
    joinPhase: number;
    lead: FootSide;
    endRate: number;
  },
  gait: WalkingGait = resolveWalkingGait(model, walk),
  cadenceRate = 1,
): StopPlan {
  const scene = clone(model);
  scene.position.set(0, 0, 0);
  scene.quaternion.identity();
  scene.scale.setScalar(1);
  const data = scene.getObjectByName('HEA_101172')?.userData.heaCharacter;
  if (!data?.anatomy) throw new Error('Two-step stopping requires 101172 anatomy metadata.');
  const anatomy = data.anatomy as CharacterAnatomy;
  const bones = new Map<string, THREE.Bone>();
  let skin!: THREE.SkinnedMesh;
  scene.traverse((o) => {
    if (o instanceof THREE.Bone) bones.set(o.name, o);
    if (o instanceof THREE.SkinnedMesh) skin = o;
  });
  const rest = new Map(
    [...bones].map(([n, b]) => [n, { q: b.quaternion.clone(), p: b.position.clone() }]),
  );
  const root = bones.get('Root')!,
    hips = bones.get('Hips')!;
  root.position.set(0, 0, 0);
  scene.updateMatrixWorld(true);
  const sides = ['Left', 'Right'] as const;
  const lead = incoming?.lead ?? nextFootContact(gait, phase);
  const follow = lead === 'Left' ? 'Right' : 'Left';
  const start = Object.fromEntries(
    sides.map((side) => [
      side,
      {
        p: bones.get(side + 'Foot')!.getWorldPosition(new THREE.Vector3()),
        q: bones.get(side + 'Foot')!.getWorldQuaternion(new THREE.Quaternion()),
        velocity: new THREE.Vector3(),
      },
    ]),
  ) as Record<'Left' | 'Right', { p: THREE.Vector3; q: THREE.Quaternion; velocity: THREE.Vector3 }>;
  // Estimate incoming swing velocity from the original authored clip. Planted
  // feet have zero world velocity, not the in-place clip's backwards velocity.
  const probe = clone(scene),
    probeMixer = new THREE.AnimationMixer(probe);
  const probeAction = probeMixer.clipAction(walk).play();
  const incomingAction = incoming ? probeMixer.clipAction(incoming.clip).play() : undefined;
  if (incomingAction) probeAction.setEffectiveWeight(0);
  const sampleContinuation = (elapsed: number) => {
    elapsed *= cadenceRate;
    if (incoming && incomingAction && incoming.time + elapsed < incoming.clip.duration) {
      incomingAction.setEffectiveWeight(1);
      probeAction.setEffectiveWeight(0);
      incomingAction.time = THREE.MathUtils.clamp(
        incoming.time + elapsed,
        0,
        incoming.clip.duration,
      );
    } else {
      incomingAction?.setEffectiveWeight(0);
      probeAction.setEffectiveWeight(1);
      const time = incoming
        ? incoming.joinPhase * walk.duration +
          (incoming.time + elapsed - incoming.clip.duration) * incoming.endRate
        : phase * walk.duration + elapsed;
      probeAction.time = ((time % walk.duration) + walk.duration) % walk.duration;
    }
    probeMixer.update(0);
    probe.updateMatrixWorld(true);
  };
  const samples: THREE.Vector3[] = [];
  for (const offset of [-0.002, 0.002]) {
    sampleContinuation(offset);
    samples.push(probe.getObjectByName(lead + 'Foot')!.getWorldPosition(new THREE.Vector3()));
  }
  if (incoming || !isFootPlanted(gait, lead, phase)) {
    start[lead].velocity.copy(samples[1]).sub(samples[0]).divideScalar(0.004);
    if (!incoming) start[lead].velocity.z += speed;
    start[lead].velocity.clampLength(0, 2.5);
  }
  sampleContinuation(0);
  const releasePose = new Map(
    [...bones.keys()].map((name) => [
      name,
      {
        q: probe.getObjectByName(name)!.quaternion.clone(),
        p: probe.getObjectByName(name)!.position.clone(),
      },
    ]),
  );
  const cadence = Math.max(0.05, cadenceRate);
  const remaining = incoming
    ? incoming.clip.duration - incoming.time
    : (phaseDistance(phase, gait.feet[lead].contact) || 1) * walk.duration;
  const previousStep =
    phaseDistance(gait.feet[follow].contact, gait.feet[lead].contact) * walk.duration;
  const nextStep =
    phaseDistance(gait.feet[lead].contact, gait.feet[follow].contact) * walk.duration;
  const t1 = THREE.MathUtils.clamp(remaining, previousStep * 0.31, previousStep * 0.966) / cadence;
  const transfer = (nextStep * 0.07) / cadence,
    t2 = (nextStep * 0.86) / cadence,
    settle = (nextStep * 0.3448) / cadence;
  const followStart = t1 + transfer,
    secondContact = followStart + t2,
    duration = secondContact + settle;
  const leadZ = Math.min(
    Math.max(start.Left.p.z, start.Right.p.z) +
      THREE.MathUtils.clamp(speed * t1 * 0.55, 0.04, 0.25),
    start[follow].p.z + 0.56,
  );
  const targets = { Left: start.Left.p.clone(), Right: start.Right.p.clone() };
  targets.Left.z = targets.Right.z = leadZ;
  const rootEnd = new THREE.Vector3(
    (targets.Left.x + targets.Right.x) / 2,
    0,
    leadZ - (anatomy.left.ankle[2] + anatomy.right.ankle[2]) / 2,
  );
  const rootAtContact = Math.max(0, (start[follow].p.z + leadZ) / 2 - anatomy.pelvis[2]);
  const contactSpeed = Math.min(0.35, (rootEnd.z - rootAtContact) / (transfer + t2));
  const incomingSpeed = Math.min(speed, (3 * rootAtContact) / t1);
  const standingY =
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
  const solePoints = { Left: [] as THREE.Vector3[], Right: [] as THREE.Vector3[] };
  const positions = skin.geometry.getAttribute('position');
  for (let i = 0; i < positions.count; i++)
    if (positions.getY(i) < 0.1) {
      const side = positions.getX(i) > 0 ? 'Left' : 'Right';
      const ankle = side === 'Left' ? anatomy.left.ankle : anatomy.right.ankle;
      solePoints[side].push(
        new THREE.Vector3().fromBufferAttribute(positions, i).sub(new THREE.Vector3(...ankle)),
      );
    }
  const point = new THREE.Vector3();
  function floorY(side: 'Left' | 'Right', q: THREE.Quaternion) {
    let min = Infinity;
    // Rotate the floor normal once rather than thousands of sole vertices.
    point.set(0, 1, 0).applyQuaternion(q.clone().invert());
    for (const p of solePoints[side]) min = Math.min(min, p.dot(point));
    return 0.002 - min;
  }
  for (const side of sides) targets[side].y = floorY(side, new THREE.Quaternion());
  const values = new Map<string, number[]>(),
    times: number[] = [];
  const frames = Math.ceil(duration * 60);
  for (let frame = 0; frame <= frames; frame++) {
    const time = (duration * frame) / frames;
    for (const [name, bone] of bones) {
      bone.position.copy(rest.get(name)!.p);
      bone.quaternion.copy(rest.get(name)!.q);
    }
    const u = time / duration;
    const cadenceElapsed = duration * (u - u * u * u + 0.5 * u * u * u * u);
    sampleContinuation(cadenceElapsed);
    const delay = (walk.duration * 0.0517) / cadence;
    const relax = smooth((time - delay) / (duration - delay));
    for (const [name, bone] of bones) {
      if (/Thigh|Shin|Foot|Toes|ToeEnd/.test(name)) continue;
      const neutral = new THREE.Quaternion();
      if (name.endsWith('UpperArm'))
        neutral.setFromEuler(new THREE.Euler(-0.015, 0, name.startsWith('Left') ? -0.04 : 0.04));
      if (name.endsWith('ForeArm')) neutral.setFromEuler(new THREE.Euler(-0.1, 0, 0));
      // Keep the walking counter-swing and torso cadence alive before damping
      // them out. Capture correction handles partially blended/interrupted starts.
      const sampled = probe.getObjectByName(name)!.quaternion.clone();
      const correction = releasePose.get(name)!.q.clone().invert().multiply(rest.get(name)!.q);
      correction.slerp(new THREE.Quaternion(), smooth(time / ((walk.duration * 0.1724) / cadence)));
      bone.quaternion.copy(sampled.multiply(correction)).slerp(neutral, relax);
    }
    if (time <= t1) {
      root.position.z = hermite(0, rootAtContact, incomingSpeed, contactSpeed, time / t1, t1);
    } else if (time < secondContact) {
      root.position.z = hermite(
        rootAtContact,
        rootEnd.z,
        contactSpeed,
        0,
        (time - t1) / (secondContact - t1),
        secondContact - t1,
      );
    } else root.position.z = rootEnd.z;
    root.position.x = rootEnd.x * smooth(time / secondContact);
    const hipStart = rest.get('Hips')!.p;
    hips.position.x = THREE.MathUtils.lerp(hipStart.x, 0, relax);
    const contactY = Math.min(hipStart.y, standingY - 0.035);
    hips.position.y =
      time < t1
        ? THREE.MathUtils.lerp(hipStart.y, contactY, smooth(time / t1))
        : THREE.MathUtils.lerp(contactY, standingY, smooth((time - t1) / (duration - t1)));
    const hipWave = probe.getObjectByName('Hips')!.position.clone().sub(releasePose.get('Hips')!.p);
    hips.position.x += hipWave.x * (1 - relax);
    hips.position.y += hipWave.y * (1 - smooth(time / ((walk.duration * 0.207) / cadence)));
    hips.position.z = THREE.MathUtils.lerp(hipStart.z, anatomy.pelvis[2], relax);
    if (frame > 0)
      for (const side of sides) {
        const beginning = side === lead ? 0 : followStart,
          ending = side === lead ? t1 : secondContact;
        const u = THREE.MathUtils.clamp((time - beginning) / (ending - beginning), 0, 1),
          eased = smooth(u);
        const q = start[side].q.clone().slerp(new THREE.Quaternion(), eased);
        const ankle = start[side].p.clone();
        if (time >= beginning) {
          if (side === lead) {
            ankle.z = hermite(
              start[side].p.z,
              targets[side].z,
              start[side].velocity.z,
              0,
              u,
              ending - beginning,
            );
            ankle.y = hermite(
              start[side].p.y,
              targets[side].y,
              start[side].velocity.y,
              0,
              u,
              ending - beginning,
            );
          } else ankle.lerp(targets[side], eased);
          const lift =
            THREE.MathUtils.clamp(
              gait.clearance[side] * (side === lead ? 0.375 : 0.7083),
              0.025,
              0.14,
            ) *
            Math.sin(Math.PI * u) ** 3;
          ankle.y = Math.max(ankle.y, floorY(side, q)) + lift;
        }
        solveLeg(side, ankle, bones, scene);
        scene.updateMatrixWorld(true);
        bones
          .get(side + 'Foot')!
          .quaternion.copy(
            bones
              .get(side + 'Shin')!
              .getWorldQuaternion(new THREE.Quaternion())
              .invert(),
          )
          .multiply(q);
        bones.get(side + 'Toes')!.quaternion.identity();
      }
    scene.updateMatrixWorld(true);
    times.push(time);
    for (const [name, bone] of bones) {
      const key = name + '.quaternion',
        array = values.get(key) ?? [];
      const q = bone.quaternion.clone().normalize();
      if (array.length && q.dot(new THREE.Quaternion().fromArray(array, array.length - 4)) < 0)
        q.set(-q.x, -q.y, -q.z, -q.w);
      array.push(...q.toArray());
      values.set(key, array);
    }
    for (const bone of [root, hips]) {
      const key = bone.name + '.position';
      const array = values.get(key) ?? [];
      array.push(...bone.position.toArray());
      values.set(key, array);
    }
  }
  probeMixer.stopAllAction();
  probeMixer.uncacheRoot(probe);
  return {
    lead,
    firstContact: t1,
    followStart,
    secondContact,
    rootEnd,
    clip: new THREE.AnimationClip(
      'Stopping',
      duration,
      [...values].map(([key, v]) =>
        key.endsWith('.position')
          ? new THREE.VectorKeyframeTrack(key, times, v)
          : new THREE.QuaternionKeyframeTrack(key, times, v),
      ),
    ),
  };
}
