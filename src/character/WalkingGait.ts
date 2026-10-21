import * as THREE from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import type { CharacterAnatomy } from './anatomy101172';

export type FootSide = 'Left' | 'Right';
export interface FootEvents {
  /** Normalized clip phases, not seconds. One contact/lift-off per foot/cycle. */
  contact: number;
  liftOff: number;
}
export interface WalkingGaitSpec {
  speed: number;
  feet: Record<FootSide, FootEvents>;
}
export interface WalkingGait extends WalkingGaitSpec {
  duration: number;
  clearance: Record<FootSide, number>;
  source: 'markers' | 'analysis';
}
const sides: FootSide[] = ['Left', 'Right'];
export const wrapPhase = (phase: number) => ((phase % 1) + 1) % 1;
export const phaseDistance = (from: number, to: number) => wrapPhase(to - from);
export function isFootPlanted(gait: WalkingGaitSpec, side: FootSide, phase: number) {
  const foot = gait.feet[side];
  return phaseDistance(foot.contact, phase) < phaseDistance(foot.contact, foot.liftOff);
}
export function nextFootContact(gait: WalkingGaitSpec, phase: number) {
  return sides.reduce((a, b) => {
    const distance = (s: FootSide) => phaseDistance(phase, gait.feet[s].contact) || 1;
    return distance(a) <= distance(b) ? a : b;
  });
}
export function doubleSupportAfter(gait: WalkingGaitSpec, lead: FootSide) {
  const support = lead === 'Left' ? 'Right' : 'Left';
  const contact = gait.feet[lead].contact;
  return isFootPlanted(gait, support, contact + 1e-6)
    ? Math.min(
        phaseDistance(contact, gait.feet[support].liftOff),
        phaseDistance(contact, gait.feet[lead].liftOff),
      )
    : 0;
}
type ClipMetadata = THREE.AnimationClip & { userData?: Record<string, unknown> };
interface StoredGait extends WalkingGaitSpec {
  version: 1;
  fingerprint: string;
}
const cache = new WeakMap<
  THREE.AnimationClip,
  WeakMap<THREE.BufferGeometry, { fingerprint: string; gait: WalkingGait }>
>();
/** Detect stale authored markers when duration, phase, keyframes or bone names change. */
function fingerprint(clip: THREE.AnimationClip) {
  let hash = 2166136261;
  const add = (v: number) => {
    hash = Math.imul(hash ^ v, 16777619);
  };
  add(Math.round(clip.duration * 1e5));
  for (const track of clip.tracks) {
    for (let i = 0; i < track.name.length; i++) add(track.name.charCodeAt(i));
    for (const a of [track.times, track.values])
      for (const b of new Uint8Array(a.buffer, a.byteOffset, a.byteLength)) add(b);
  }
  return (hash >>> 0).toString(16);
}
/** Stored as glTF animation extras by GLTFExporter, restored by GLTFLoader. */
export function stampWalkingGait(clip: THREE.AnimationClip, spec: WalkingGaitSpec) {
  validate(spec);
  const target = clip as ClipMetadata;
  target.userData = {
    ...target.userData,
    heaGait: {
      version: 1,
      fingerprint: fingerprint(clip),
      speed: spec.speed,
      feet: structuredClone(spec.feet),
    } satisfies StoredGait,
  };
  cache.delete(clip);
}

function validate(spec: WalkingGaitSpec) {
  if (!Number.isFinite(spec.speed) || spec.speed <= 0)
    throw new Error('Walking gait needs a positive forward speed (asset units/second).');
  for (const side of sides) {
    const events = spec.feet?.[side];
    if (
      !events ||
      ![events.contact, events.liftOff].every((p) => Number.isFinite(p) && p >= 0 && p < 1) ||
      phaseDistance(events.contact, events.liftOff) < 0.1 ||
      phaseDistance(events.contact, events.liftOff) > 0.9
    )
      throw new Error(`Invalid ${side} Walking contact/lift-off markers.`);
  }
  const separation = phaseDistance(spec.feet.Left.contact, spec.feet.Right.contact);
  if (
    separation < 0.1 ||
    separation > 0.9 ||
    sides.some((s) => doubleSupportAfter(spec, s) < 0.008)
  )
    throw new Error(
      'Walking needs alternating contacts and double support; airborne/run gait is unsupported.',
    );
}

/** Analyze the loaded clip, never the legacy walkSpeed/walkStance metadata.
 * Supported: cyclic, forward +Z, in-place walking on the 101172 rig on flat ground.
 * Known authored clips may supply exact events; uncertain analysis fails explicitly.
 * Cache is by clip identity + geometry. Use a new clip / replaceWalking for edits.
 */
export function resolveWalkingGait(
  model: THREE.Object3D,
  clip: THREE.AnimationClip,
  markers?: WalkingGaitSpec,
): WalkingGait {
  let geometry!: THREE.BufferGeometry;
  model.traverse((o) => {
    if (o instanceof THREE.SkinnedMesh) geometry = o.geometry;
  });
  if (!geometry || !Number.isFinite(clip.duration) || clip.duration <= 0)
    throw new Error('Walking gait requires a skinned rig and a positive clip duration.');
  const signature = fingerprint(clip);
  const stored = (clip as ClipMetadata).userData?.heaGait as StoredGait | undefined;
  const suppliedMarkers = markers;
  if (!markers && stored?.version === 1 && stored.fingerprint === signature) markers = stored;
  const cached = cache.get(clip)?.get(geometry);
  if (cached?.fingerprint === signature && !suppliedMarkers) return cached.gait;
  if (markers) validate(markers);
  for (const track of clip.tracks) {
    if (
      !track.times.length ||
      !Array.from(track.times).every(Number.isFinite) ||
      !Array.from(track.values).every(Number.isFinite)
    )
      throw new Error('Walking contains empty or non-finite keyframes.');
    if (track.name === 'Root.position' && Array.from(track.values).some((v) => Math.abs(v) > 1e-5))
      throw new Error(
        'Walking must be in-place; remove authored root translation before gait analysis.',
      );
    const boneName = track.name.split('.')[0];
    if (!model.getObjectByName(boneName))
      throw new Error(`Walking track targets missing bone: ${boneName}`);
  }
  const scene = clone(model);
  scene.position.set(0, 0, 0);
  scene.quaternion.identity();
  scene.scale.setScalar(1);
  let skin!: THREE.SkinnedMesh;
  scene.traverse((o) => {
    if (o instanceof THREE.SkinnedMesh) skin = o;
  });
  skin.skeleton.pose();
  for (const name of [
    'Root',
    'Hips',
    ...sides.flatMap((s) => ['Thigh', 'Shin', 'Foot', 'Toes'].map((part) => s + part)),
  ]) {
    if (!scene.getObjectByName(name))
      throw new Error(`Walking needs the 101172 rig; missing ${name}.`);
  }
  scene.getObjectByName('Root')!.position.set(0, 0, 0);
  for (const track of clip.tracks)
    if (
      track.name.endsWith('.position') &&
      !['Root.position', 'Hips.position'].includes(track.name)
    ) {
      const bind = scene.getObjectByName(track.name.split('.')[0])!.position.toArray();
      if (Array.from(track.values).some((v, i) => Math.abs(v - bind[i % 3]) > 1e-4))
        throw new Error('Retarget limb translations to the bind rig before using Walking IK.');
    }
  const anatomy = scene.getObjectByName('HEA_101172')?.userData.heaCharacter?.anatomy as
    CharacterAnatomy | undefined;
  if (!anatomy) throw new Error('Walking analysis requires 101172 anatomy metadata.');
  const soles = { Left: [] as THREE.Vector3[], Right: [] as THREE.Vector3[] };
  const positions = geometry.getAttribute('position');
  for (let i = 0; i < positions.count; i++)
    if (positions.getY(i) < 0.1) {
      const side = positions.getX(i) > 0 ? 'Left' : 'Right';
      soles[side].push(
        new THREE.Vector3()
          .fromBufferAttribute(positions, i)
          .sub(new THREE.Vector3(...(side === 'Left' ? anatomy.left : anatomy.right).ankle)),
      );
    }
  if (sides.some((s) => !soles[s].length))
    throw new Error('Walking analysis could not locate both sole patches.');
  const samples = 480;
  const frames = {
    Left: [] as { z: number; forefootZ: number; y: number }[],
    Right: [] as { z: number; forefootZ: number; y: number }[],
  };
  const mixer = new THREE.AnimationMixer(scene),
    action = mixer.clipAction(clip).play();
  try {
    for (let frame = 0; frame < samples; frame++) {
      action.time = (frame / samples) * clip.duration;
      mixer.update(0);
      scene.updateMatrixWorld(true);
      for (const side of sides) {
        const foot = scene.getObjectByName(side + 'Foot')!;
        const p = foot.getWorldPosition(new THREE.Vector3());
        const normal = new THREE.Vector3(0, 1, 0).applyQuaternion(
          foot.getWorldQuaternion(new THREE.Quaternion()).invert(),
        );
        let bottom = Infinity;
        for (const v of soles[side]) bottom = Math.min(bottom, p.y + v.dot(normal));
        const leg = side === 'Left' ? anatomy.left : anatomy.right;
        // Heel rise moves the ankle even when the forefoot stays planted.
        // Use the measured ball projected onto the sole plane as a second
        // rigid-foot reference, not a relaxed ankle-velocity tolerance.
        const forefoot = new THREE.Vector3(
          leg.ball[0] - leg.ankle[0],
          -leg.ankle[1],
          leg.ball[2] - leg.ankle[2],
        )
          .applyQuaternion(foot.getWorldQuaternion(new THREE.Quaternion()))
          .add(p);
        frames[side].push({ z: p.z, forefootZ: forefoot.z, y: bottom });
      }
    }
  } finally {
    mixer.stopAllAction();
    mixer.uncacheRoot(scene);
  }
  const differentiate = (side: FootSide, key: 'z' | 'forefootZ') =>
    frames[side].map(
      (_, i) =>
        (frames[side][(i + 1) % samples][key] - frames[side][(i + samples - 1) % samples][key]) /
        ((2 * clip.duration) / samples),
    );
  const forefootVelocities = Object.fromEntries(
    sides.map((side) => [side, differentiate(side, 'forefootZ')]),
  ) as Record<FootSide, number[]>;
  const velocities = Object.fromEntries(
    sides.map((side) => [
      side,
      frames[side].map(
        (_, i) =>
          (frames[side][(i + 1) % samples].z - frames[side][(i + samples - 1) % samples].z) /
          ((2 * clip.duration) / samples),
      ),
    ]),
  ) as Record<FootSide, number[]>;
  const backwards = sides
    .flatMap((side) => velocities[side].filter((v, i) => v < -0.02 && frames[side][i].y < 0.012))
    .sort((a, b) => a - b);
  if (!markers && backwards.length < samples * 0.25)
    throw new Error(
      'Cannot identify planted forward-walk speed; supply gait markers or a supported in-place walk.',
    );
  const speed = markers?.speed ?? -backwards[Math.floor(backwards.length / 2)];
  const feet = {} as Record<FootSide, FootEvents>;
  const clearance = {} as Record<FootSide, number>;
  for (const side of sides) {
    clearance[side] = Math.max(...frames[side].map((p) => p.y)) - 0.002;
    if (clearance[side] < 0.025)
      throw new Error(`${side} Walking has no identifiable lifted step.`);
    if (markers) {
      feet[side] = { ...markers.feet[side] };
      const foot = feet[side];
      const at = (phase: number) => Math.round(wrapPhase(phase) * samples) % samples;
      const middle = at(foot.contact + phaseDistance(foot.contact, foot.liftOff) * 0.5);
      if (
        frames[side][at(foot.contact)].y > 0.025 ||
        frames[side][at(foot.liftOff)].y > 0.025 ||
        Math.abs(velocities[side][middle] + speed) > speed * 0.15
      )
        throw new Error(
          `${side} gait markers/speed disagree with the loaded Walking; re-author the profile.`,
        );
      continue;
    }
    const stance = frames[side].map(
      (p, i) =>
        p.y < 0.008 &&
        Math.min(
          Math.abs(velocities[side][i] + speed),
          Math.abs(forefootVelocities[side][i] + speed),
        ) <
          speed * 0.035,
    );
    // Longest cyclic planted interval; isolated threshold noise is not a contact.
    let longest = 0,
      start = -1;
    for (let i = 0; i < samples; i++)
      if (stance[i] && !stance[(i + samples - 1) % samples]) {
        let length = 0;
        while (length < samples && stance[(i + length) % samples]) length++;
        if (length > longest) {
          longest = length;
          start = i;
        }
      }
    if (longest < samples * 0.2 || longest > samples * 0.9)
      throw new Error(`Ambiguous ${side} Walking contacts; supply exact gait markers.`);
    feet[side] = { contact: start / samples, liftOff: ((start + longest) % samples) / samples };
  }
  const result: WalkingGait = {
    speed,
    feet,
    duration: clip.duration,
    clearance,
    source: markers ? 'markers' : 'analysis',
  };
  validate(result);
  const entries =
    cache.get(clip) ??
    new WeakMap<THREE.BufferGeometry, { fingerprint: string; gait: WalkingGait }>();
  entries.set(geometry, { fingerprint: signature, gait: result });
  cache.set(clip, entries);
  return result;
}
