import * as THREE from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import type { CharacterAnatomy } from './anatomy101172';
import { solveLeg } from './legIK';
import {
  resolveWalkingGait,
  doubleSupportAfter,
  wrapPhase,
  phaseDistance,
  type WalkingGait,
} from './WalkingGait';

const smooth = (t: number) => THREE.MathUtils.smootherstep(THREE.MathUtils.clamp(t, 0, 1), 0, 1);
const hermite = (a: number, b: number, v0: number, v1: number, u: number, duration: number) =>
  (2 * u * u * u - 3 * u * u + 1) * a +
  (u * u * u - 2 * u * u + u) * v0 * duration +
  (-2 * u * u * u + 3 * u * u) * b +
  (u * u * u - u * u) * v1 * duration;
export interface StartPlan {
  clip: THREE.AnimationClip;
  lead: 'Left' | 'Right';
  support: 'Left' | 'Right';
  supportVertex: number;
  joinPhase: number;
  endRate: number;
  rootEnd: THREE.Vector3;
}

/** A weight transfer and first step baked from the current standing pose.
 * Last frame matches Walking at the selected contact; root velocity matches its
 * incoming cadence. The motor
 * consumes root motion during the launch instead of instantly setting velocity.
 */
export function makeCharacterStart(
  model: THREE.Object3D,
  walk: THREE.AnimationClip,
  gait: WalkingGait = resolveWalkingGait(model, walk),
): StartPlan {
  const scene = clone(model);
  scene.position.set(0, 0, 0);
  scene.quaternion.identity();
  scene.scale.setScalar(1);
  const data = scene.getObjectByName('HEA_101172')!.userData.heaCharacter;
  const anatomy = data.anatomy as CharacterAnatomy;
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
    [...bones].map(([n, b]) => [n, { q: b.quaternion.clone(), p: b.position.clone() }]),
  );
  const sides = ['Left', 'Right'] as const;
  const positions = skin.geometry.getAttribute('position');
  const soles = {
    Left: [] as { p: THREE.Vector3; i: number }[],
    Right: [] as { p: THREE.Vector3; i: number }[],
  };
  for (let i = 0; i < positions.count; i++)
    if (positions.getY(i) < 0.1) {
      const s = positions.getX(i) > 0 ? 'Left' : 'Right';
      const a = s === 'Left' ? anatomy.left : anatomy.right;
      soles[s].push({
        i,
        p: new THREE.Vector3().fromBufferAttribute(positions, i).sub(new THREE.Vector3(...a.ankle)),
      });
    }
  const up = new THREE.Vector3();
  const floorY = (s: 'Left' | 'Right', q: THREE.Quaternion) => {
    up.set(0, 1, 0).applyQuaternion(q.clone().invert());
    let min = Infinity;
    for (const p of soles[s]) min = Math.min(min, p.p.dot(up));
    return 0.002 - min;
  };
  const start = {
    Left: {
      p: bones.get('LeftFoot')!.getWorldPosition(new THREE.Vector3()),
      q: bones.get('LeftFoot')!.getWorldQuaternion(new THREE.Quaternion()),
    },
    Right: {
      p: bones.get('RightFoot')!.getWorldPosition(new THREE.Vector3()),
      q: bones.get('RightFoot')!.getWorldQuaternion(new THREE.Quaternion()),
    },
  };
  const lead = start.Right.p.y - floorY('Right', start.Right.q) > 0.025 ? 'Right' : 'Left';
  const support = lead === 'Left' ? 'Right' : 'Left';
  let joinPhase = gait.feet[lead].contact;
  const probe = clone(scene),
    mixer = new THREE.AnimationMixer(probe),
    action = mixer.clipAction(walk).play();
  action.time = joinPhase * walk.duration;
  mixer.update(0);
  probe.updateMatrixWorld(true);
  let endFoot = Object.fromEntries(
    sides.map((s) => [
      s,
      {
        p: probe.getObjectByName(s + 'Foot')!.getWorldPosition(new THREE.Vector3()),
        q: probe.getObjectByName(s + 'Foot')!.getWorldQuaternion(new THREE.Quaternion()),
      },
    ]),
  ) as typeof start;
  // Roll the supporting foot around its eventual contact patch, not its ankle.
  up.set(0, 1, 0).applyQuaternion(endFoot[support].q.clone().invert());
  let pivot = soles[support].reduce((a, b) => (a.p.dot(up) < b.p.dot(up) ? a : b));
  let anchor = start[support].p.clone().add(pivot.p.clone().applyQuaternion(start[support].q));
  const endContact = endFoot[support].p
    .clone()
    .add(pivot.p.clone().applyQuaternion(endFoot[support].q));
  const rootEnd = anchor.clone().sub(endContact);
  // An interrupted closing step can already have the support foot farther back
  // than the normal contact pose. Join slightly later in double support instead
  // of ever pulling the character backwards to fit a fixed phase.
  const contactPhase = joinPhase;
  for (
    let offset = 0.005;
    rootEnd.z < 0.01 && offset <= doubleSupportAfter(gait, lead) * 0.95;
    offset += 0.005
  ) {
    joinPhase = wrapPhase(contactPhase + offset);
    action.time = joinPhase * walk.duration;
    mixer.update(0);
    probe.updateMatrixWorld(true);
    endFoot = Object.fromEntries(
      sides.map((s) => [
        s,
        {
          p: probe.getObjectByName(s + 'Foot')!.getWorldPosition(new THREE.Vector3()),
          q: probe.getObjectByName(s + 'Foot')!.getWorldQuaternion(new THREE.Quaternion()),
        },
      ]),
    ) as typeof start;
    up.set(0, 1, 0).applyQuaternion(endFoot[support].q.clone().invert());
    pivot = soles[support].reduce((a, b) => (a.p.dot(up) < b.p.dot(up) ? a : b));
    anchor = start[support].p.clone().add(pivot.p.clone().applyQuaternion(start[support].q));
    rootEnd
      .copy(anchor)
      .sub(endFoot[support].p.clone().add(pivot.p.clone().applyQuaternion(endFoot[support].q)));
  }
  rootEnd.y = 0;
  const stepDuration =
    phaseDistance(gait.feet[support].contact, gait.feet[lead].contact) * walk.duration;
  const duration = THREE.MathUtils.clamp(
    (2 * Math.max(0.005, rootEnd.z)) / gait.speed,
    stepDuration * 0.724,
    stepDuration * 1.414,
  );
  const endRate = THREE.MathUtils.clamp(
    (2 * Math.max(0.005, rootEnd.z)) / (duration * gait.speed),
    0.02,
    1,
  );
  const endVelocity = gait.speed * endRate;
  const anticipation = Math.min(stepDuration * 0.1552, duration * 0.18);
  const times: number[] = [],
    values = new Map<string, number[]>();
  const frames = Math.ceil(duration * 90);
  for (let frame = 0; frame <= frames; frame++) {
    const time = (duration * frame) / frames,
      u = time / duration,
      blend = smooth(u);
    // Integral of accelerating cadence: v(u)=endRate*(3u²-2u³).
    const elapsed = duration * endRate * (u * u * u - 0.5 * u * u * u * u);
    action.time =
      (((joinPhase * walk.duration - duration * endRate * 0.5 + elapsed) % walk.duration) +
        walk.duration) %
      walk.duration;
    mixer.update(0);
    probe.updateMatrixWorld(true);
    for (const [name, b] of bones) {
      b.position.copy(rest.get(name)!.p);
      b.quaternion.copy(rest.get(name)!.q);
      if (!/Thigh|Shin|Foot|Toes|ToeEnd/.test(name))
        b.quaternion.slerp(probe.getObjectByName(name)!.quaternion, blend);
    }
    root.position.set(rootEnd.x * smooth(u), 0, hermite(0, rootEnd.z, 0, endVelocity, u, duration));
    const walkHip = probe.getObjectByName('Hips')!;
    hips.position.lerp(walkHip.position, blend);
    hips.position.x += (support === 'Left' ? 1 : -1) * 0.012 * Math.sin(Math.PI * u) ** 2;
    // Small forward intent, disappearing with zero slope at the handoff.
    bones
      .get('Spine')!
      .quaternion.multiply(
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(0.025 * Math.sin(Math.PI * u) ** 2, 0, 0),
        ),
      );
    if (frame > 0)
      for (const s of sides) {
        const step = THREE.MathUtils.clamp((time - anticipation) / (duration - anticipation), 0, 1);
        const q = start[s].q.clone().slerp(endFoot[s].q, smooth(s === support ? u : step));
        let ankle: THREE.Vector3;
        if (s === support) {
          ankle = anchor.clone().sub(pivot.p.clone().applyQuaternion(q));
          ankle.y = floorY(s, q);
        } else {
          const destination = endFoot[s].p.clone().add(rootEnd);
          ankle = start[s].p.clone().lerp(destination, smooth(step));
          ankle.y =
            Math.max(ankle.y, floorY(s, q)) +
            THREE.MathUtils.clamp(gait.clearance[lead] * 0.92, 0.03, 0.22) *
              Math.sin(Math.PI * step) ** 3;
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
    // Exact authored pose at the join; the preceding IK targets converge to it.
    if (frame === frames) {
      for (const [name, b] of bones) {
        b.quaternion.copy(probe.getObjectByName(name)!.quaternion);
        if (name !== 'Root') b.position.copy(probe.getObjectByName(name)!.position);
      }
      root.position.copy(rootEnd);
    }
    scene.updateMatrixWorld(true);
    times.push(time);
    for (const [name, b] of bones) {
      const key = name + '.quaternion',
        v = values.get(key) ?? [],
        q = b.quaternion.clone().normalize();
      if (v.length && q.dot(new THREE.Quaternion().fromArray(v, v.length - 4)) < 0)
        q.set(-q.x, -q.y, -q.z, -q.w);
      v.push(...q.toArray());
      values.set(key, v);
    }
    for (const b of [root, hips]) {
      const key = b.name + '.position',
        v = values.get(key) ?? [];
      v.push(...b.position.toArray());
      values.set(key, v);
    }
  }
  mixer.stopAllAction();
  mixer.uncacheRoot(probe);
  return {
    lead,
    support,
    supportVertex: pivot.i,
    joinPhase,
    endRate,
    rootEnd,
    clip: new THREE.AnimationClip(
      'Starting',
      duration,
      [...values].map(([key, v]) =>
        key.endsWith('.position')
          ? new THREE.VectorKeyframeTrack(key, times, v)
          : new THREE.QuaternionKeyframeTrack(key, times, v),
      ),
    ),
  };
}
