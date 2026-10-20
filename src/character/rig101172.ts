import * as THREE from 'three';
import { solveLeg } from './legIK';
import { stampWalkingGait } from './WalkingGait';
import { taperForearms101172 } from './shape101172';
import { armInfluence101172 } from './skinRegions101172';
import { measure101172, type CharacterAnatomy } from './anatomy101172';

/** Authored landmarks for 101172, in metres after normalizing to a 2 m stature.
 * The source is a single mesh in a splayed A-pose; its knee/forefoot point toward +Z (measured, not guessed).
 * This asset is authored facing +Z, with the floor at Y=0 and no root translation.
 * Do not apply these weights/landmarks to an arbitrary humanoid.
 */
export const WALK = {
  duration: 1.16,
  stride: 0.94,
  height: 2,
  samples: 120,
  stance: 0.58,
  contactAdvance: 0.25,
  clearance: 0.12,
} as const;
export const RIG_REVISION = 8;
export const RIGGED_CHARACTER = 'models/101172-rigged.glb';
export interface RiggedCharacter {
  scene: THREE.Group;
  mesh: THREE.SkinnedMesh;
  skeleton: THREE.Skeleton;
  animations: THREE.AnimationClip[];
}
type Point = [number, number, number];
interface Joint {
  name: string;
  parent: string | null;
  at: Point;
}
function createJoints(anatomy: CharacterAnatomy): Joint[] {
  const shoulderY = (anatomy.arms.left.shoulder[1] + anatomy.arms.right.shoulder[1]) / 2;
  const joints: Joint[] = [
    { name: 'Root', parent: null, at: [0, 0, 0] },
    { name: 'Hips', parent: 'Root', at: anatomy.pelvis },
    { name: 'Spine', parent: 'Hips', at: [0, 1.24, 0.008] },
    { name: 'SpineUpper', parent: 'Spine', at: [0, (1.24 + shoulderY - 0.015) / 2, 0.008] },
    { name: 'Chest', parent: 'SpineUpper', at: [0, shoulderY - 0.015, 0.005] },
    { name: 'Neck', parent: 'Chest', at: [0, 1.65, 0.002] },
    { name: 'Head', parent: 'Neck', at: [0, 1.7, 0] },
    { name: 'HeadEnd', parent: 'Head', at: [0, 1.97, 0] },
  ];
  for (const [side, leg] of [
    ['Left', anatomy.left],
    ['Right', anatomy.right],
  ] as const) {
    const arm = anatomy.arms[side === 'Left' ? 'left' : 'right'];
    joints.push(
      {
        name: `${side}Clavicle`,
        parent: 'Chest',
        at: [arm.shoulder[0] * 0.45, shoulderY - 0.005, arm.shoulder[2]],
      },
      { name: `${side}UpperArm`, parent: `${side}Clavicle`, at: arm.shoulder },
      { name: `${side}ForeArm`, parent: `${side}UpperArm`, at: arm.elbow },
      { name: `${side}Hand`, parent: `${side}ForeArm`, at: arm.wrist },
      { name: `${side}HandEnd`, parent: `${side}Hand`, at: arm.tip },
      { name: `${side}Thigh`, parent: 'Hips', at: leg.hip },
      { name: `${side}Shin`, parent: `${side}Thigh`, at: leg.knee },
      { name: `${side}Foot`, parent: `${side}Shin`, at: leg.ankle },
      { name: `${side}Toes`, parent: `${side}Foot`, at: leg.ball },
      { name: `${side}ToeEnd`, parent: `${side}Toes`, at: leg.tip },
    );
  }
  return joints;
}
export const JOINT_NAMES = [
  'Root',
  'Hips',
  'Spine',
  'SpineUpper',
  'Chest',
  'Neck',
  'Head',
  'HeadEnd',
  ...['Left', 'Right'].flatMap((side) =>
    [
      'Clavicle',
      'UpperArm',
      'ForeArm',
      'Hand',
      'HandEnd',
      'Thigh',
      'Shin',
      'Foot',
      'Toes',
      'ToeEnd',
    ].map((joint) => side + joint),
  ),
];
const smooth = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b);

/** A true skinned mesh with four normalized influences per vertex. UVs,
 * indices, texture and material survive; derivative taper normals are recomputed; the original source is never mutated.
 * Anatomical masks prevent adjacent arms/torso or opposite legs sharing weights.
 */
export function rig101172(source: THREE.Object3D): RiggedCharacter {
  source.updateMatrixWorld(true);
  const meshes: THREE.Mesh[] = [];
  source.traverse((o) => {
    if (o instanceof THREE.Mesh) meshes.push(o);
  });
  if (meshes.length !== 1 || meshes[0] instanceof THREE.SkinnedMesh)
    throw new Error('Expected the unrigged, single-mesh 101172 source.');
  const original = meshes[0];
  const geometry = original.geometry.clone().applyMatrix4(original.matrixWorld);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const height = box.max.y - box.min.y;
  const center = box.getCenter(new THREE.Vector3());
  geometry.translate(-center.x, -box.min.y, -center.z);
  geometry.scale(2 / height, 2 / height, 2 / height);
  // v1/v2 flipped the source by PI on an unverified "front" assumption.
  // The unmodified source's knee bow AND forefoot establish +Z as forward.
  const anatomy = measure101172(geometry);
  taperForearms101172(geometry, anatomy);
  const joints = createJoints(anatomy);
  const scene = new THREE.Group();
  scene.name = 'HEA_101172';
  scene.userData = {
    heaCharacter: {
      version: RIG_REVISION,
      height: 2,
      forward: '+Z',
      up: '+Y',
      rootMotion: false,
      walkSpeed: WALK.stride / WALK.duration,
      walkDuration: WALK.duration,
      walkStance: WALK.stance,
      source: '101172.glb',
      rig: 'HEA humanoid 28',
      shape: { forearmRadialReduction: 0.12, elbowLowering: 0.04 },
      look: { bones: ['Neck', 'Head'], yawDegrees: 70, pitchDegrees: 30 },
      clip: 'Walking',
      anatomy,
    },
  };
  const bones = new Map<string, THREE.Bone>();
  for (const joint of joints) {
    const bone = new THREE.Bone();
    bone.name = joint.name;
    bone.position.fromArray(joint.at);
    if (joint.parent) {
      const parent = bones.get(joint.parent)!;
      const parentAt = joints.find((j) => j.name === joint.parent)!.at;
      bone.position.sub(new THREE.Vector3(...parentAt));
      parent.add(bone);
    }
    bones.set(joint.name, bone);
  }
  const material = Array.isArray(original.material)
    ? original.material.map((m) => m.clone())
    : original.material.clone();
  for (const m of Array.isArray(material) ? material : [material])
    if (m instanceof THREE.MeshStandardMaterial) {
      m.color.set('#ffffff');
      m.map = null;
      m.emissive.set(0);
      m.roughness = 0.68;
      m.metalness = 0;
    }
  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.name = 'CharacterSkin';
  mesh.add(bones.get('Root')!);
  scene.add(mesh);
  scene.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton([...bones.values()]);
  mesh.bind(skeleton);
  weightSkin(geometry, joints, anatomy);
  mesh.normalizeSkinWeights();
  mesh.frustumCulled = false; // animated bounds must not use the static A-pose box
  mesh.castShadow = mesh.receiveShadow = true;
  const animations = [makeWalk(bones, scene, mesh, anatomy)];
  return { scene, mesh, skeleton, animations };
}

function weightSkin(geometry: THREE.BufferGeometry, joints: Joint[], anatomy: CharacterAnatomy) {
  const position = geometry.getAttribute('position');
  const armRegions = armInfluence101172(geometry);
  const indices = new Uint16Array(position.count * 4);
  const weights = new Float32Array(position.count * 4);
  // Skin a joint along the segment to its child, not its parent segment.
  const ends: Record<string, string> = {
    Hips: 'Spine',
    Spine: 'SpineUpper',
    SpineUpper: 'Chest',
    Chest: 'Neck',
    Neck: 'Head',
    Head: 'HeadEnd',
  };
  for (const side of ['Left', 'Right']) {
    for (const [a, b] of [
      ['Clavicle', 'UpperArm'],
      ['UpperArm', 'ForeArm'],
      ['ForeArm', 'Hand'],
      ['Hand', 'HandEnd'],
      ['Thigh', 'Shin'],
      ['Shin', 'Foot'],
      ['Foot', 'Toes'],
      ['Toes', 'ToeEnd'],
    ])
      ends[side + a] = side + b;
  }
  const segments = joints.flatMap((joint, index) => {
    if (!ends[joint.name]) return [];
    return [
      {
        name: joint.name,
        index,
        a: new THREE.Vector3(...joint.at),
        b: new THREE.Vector3(...joints.find((j) => j.name === ends[joint.name])!.at),
      },
    ];
  });
  const p = new THREE.Vector3(),
    nearest = new THREE.Vector3();
  for (let vertex = 0; vertex < position.count; vertex++) {
    p.fromBufferAttribute(position, vertex);
    const ax = Math.abs(p.x);
    const armMask = armRegions[vertex];
    const seam = smooth(anatomy.crotch - 0.055, anatomy.crotch + 0.015, p.y);
    const seamSupport = 1 - seam * (1 - smooth(0.0, 0.055, ax));
    const legMask =
      (1 - smooth(anatomy.crotch - 0.03, anatomy.pelvis[1] + 0.03, p.y)) *
      (1 - armMask) *
      seamSupport;
    const candidates = segments
      .map((segment) => {
        const side = segment.name.startsWith('Left')
          ? 1
          : segment.name.startsWith('Right')
            ? -1
            : 0;
        const arm = /Clavicle|UpperArm|ForeArm|Hand/.test(segment.name);
        const leg = /Thigh|Shin|Foot|Toes/.test(segment.name);
        let mask = arm ? armMask : leg ? legMask : (1 - armMask) * (1 - legMask);
        if (side && side * p.x < 0) mask = 0;
        // Head's wide distance kernel must never pull the shoulder/trapezius.
        // Neck flex is confined to the neck shaft, not the chest surface.
        if (segment.name === 'Head') mask *= smooth(1.665, 1.715, p.y);
        if (segment.name === 'Neck')
          mask *= smooth(1.59, 1.655, p.y) * (1 - smooth(1.705, 1.75, p.y));
        if (['Root', 'Hips', 'Spine', 'SpineUpper', 'Chest'].includes(segment.name))
          mask *= 1 - smooth(1.665, 1.73, p.y);
        if (arm) {
          const limb = anatomy.arms[side > 0 ? 'left' : 'right'];
          const upper = smooth(limb.elbow[1] - 0.04, limb.elbow[1] + 0.04, p.y);
          const hand = 1 - smooth(limb.wrist[1] - 0.035, limb.wrist[1] + 0.035, p.y);
          if (segment.name.endsWith('Clavicle'))
            mask *= smooth(limb.shoulder[1] - 0.055, limb.shoulder[1] + 0.025, p.y);
          if (segment.name.endsWith('UpperArm'))
            mask *= upper * (1 - smooth(limb.shoulder[1] - 0.055, limb.shoulder[1] + 0.025, p.y));
          else if (segment.name.endsWith('ForeArm')) mask *= (1 - upper) * (1 - hand);
          else if (segment.name.endsWith('Hand')) mask *= hand;
        }
        if (leg) {
          // Distance alone let the shin pull the sole when bending the knee.
          // Keep the heel/sole on the foot and blend only through the ankle.
          const limb = side > 0 ? anatomy.left : anatomy.right;
          const footMask = 1 - smooth(limb.ankle[1] - 0.06, limb.ankle[1] + 0.06, p.y);
          const toeMask = smooth(limb.ball[2] - 0.035, limb.ball[2] + 0.035, p.z);
          const thighMask = smooth(limb.knee[1] - 0.045, limb.knee[1] + 0.045, p.y);
          if (segment.name.endsWith('Foot')) mask *= footMask * (1 - toeMask);
          else if (segment.name.endsWith('Toes')) mask *= footMask * toeMask;
          else
            mask *= (1 - footMask) * (segment.name.endsWith('Thigh') ? thighMask : 1 - thighMask);
        }
        new THREE.Line3(segment.a, segment.b).closestPointToPoint(p, true, nearest);
        const d2 = p.distanceToSquared(nearest);
        // Limb partitions are longitudinal, constant across the shaft section.
        // Distance kernels here caused cross-section shear/fins near bent joints.
        // Keep distance falloff only for axial/torso influences.
        const radius = segment.name === 'Head' ? 0.09 : 0.038;
        return {
          index: segment.index,
          weight: mask * (arm || leg ? 1 : Math.exp(-d2 / (2 * radius * radius))),
        };
      })
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 4);
    const sum = candidates.reduce((n, c) => n + c.weight, 0);
    if (sum < 1e-20) throw new Error(`No valid skin influence at vertex ${vertex}`);
    candidates.forEach((candidate, slot) => {
      indices[vertex * 4 + slot] = candidate.index;
      weights[vertex * 4 + slot] = candidate.weight / sum;
    });
  }
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
}

function makeWalk(
  bones: Map<string, THREE.Bone>,
  scene: THREE.Group,
  mesh: THREE.SkinnedMesh,
  anatomy: CharacterAnatomy,
) {
  const positions = mesh.geometry.getAttribute('position');
  const soles = { Left: [] as number[], Right: [] as number[] };
  for (let i = 0; i < positions.count; i++) {
    if (positions.getY(i) < 0.16) soles[positions.getX(i) > 0 ? 'Left' : 'Right'].push(i);
  }
  const solePoint = new THREE.Vector3();
  const values = new Map<string, number[]>();
  const times: number[] = [];
  const original = new Map([...bones].map(([name, bone]) => [name, bone.position.clone()]));
  const hips = bones.get('Hips')!;
  const frames = WALK.samples;
  const standingHeight =
    (['Left', 'Right'] as const).reduce((sum, side) => {
      const leg = side === 'Left' ? anatomy.left : anatomy.right;
      return (
        sum +
        bones.get(side + 'Shin')!.position.length() +
        bones.get(side + 'Foot')!.position.length() +
        leg.ankle[1] +
        anatomy.pelvis[1] -
        leg.hip[1]
      );
    }, 0) / 2;
  for (let frame = 0; frame <= frames; frame++) {
    const phase = frame === frames ? 0 : frame / frames;
    const t = phase * Math.PI * 2;
    for (const [name, bone] of bones) {
      bone.quaternion.identity();
      bone.position.copy(original.get(name)!);
    }
    // Double support at contacts, body highest over the planted foot. Small lateral
    // transfer, pelvis yaw and counter-rotating chest make the gait read as weight.
    // Reach is derived from this mesh's measured leg lengths and sole height.
    hips.position.y = standingHeight - 0.025 - 0.018 * Math.cos(2 * t);
    hips.position.x = 0.008 * Math.sin(t);
    hips.rotation.set(0.018, 0.045 * Math.cos(t), -0.018 * Math.sin(t));
    bones.get('Spine')!.rotation.set(0.012, -0.018 * Math.cos(t), 0.012 * Math.sin(t));
    bones.get('SpineUpper')!.rotation.set(-0.008, -0.03 * Math.cos(t), 0.009 * Math.sin(t));
    bones.get('Chest')!.rotation.set(0.008, -0.018 * Math.cos(t), 0.006 * Math.sin(t));
    bones.get('Neck')!.rotation.set(-0.008, 0.008 * Math.cos(t), -0.006 * Math.sin(t));
    bones.get('Head')!.rotation.set(-0.016, 0.01 * Math.cos(t), 0.003 * Math.sin(t));
    scene.updateMatrixWorld(true);
    for (const [side, sign, offset] of [
      ['Left', 1, 0],
      ['Right', -1, 0.5],
    ] as const) {
      const p = (phase + offset) % 1;
      const stance = WALK.stance;
      // A half-cycle separates contacts: at contact the front and rear ankles
      // must straddle the hips. Centring on stance/2 biases both feet forward.
      const front = WALK.stride * WALK.contactAdvance;
      const back = WALK.stride * (WALK.contactAdvance - stance);
      let z: number, lift: number, roll: number;
      if (p < stance) {
        const u = p / stance;
        z = front - WALK.stride * p;
        lift = 0;
        // Small ankle roll only: this source has a rounded foot, not a flat human sole.
        roll = -0.1 * (1 - smooth(0, 0.18, u)) + 0.3 * smooth(0.72, 1, u);
      } else {
        const u = (p - stance) / (1 - stance);
        // Cubic Hermite keeps fore/aft velocity continuous at toe-off and contact.
        const m = -WALK.stride * (1 - stance);
        z =
          (2 * u * u * u - 3 * u * u + 1) * back +
          (u * u * u - 2 * u * u + u) * m +
          (-2 * u * u * u + 3 * u * u) * front +
          (u * u * u - u * u) * m;
        lift = WALK.clearance * Math.sin(Math.PI * u) ** 2;
        roll = THREE.MathUtils.lerp(0.3, -0.1, smooth(0, 1, u)) + 0.12 * Math.sin(Math.PI * u);
      }
      const leg = side === 'Left' ? anatomy.left : anatomy.right;
      const ankle = new THREE.Vector3(
        leg.hip[0] + sign * (0.07 + 0.006 * Math.sin(Math.PI * p) ** 2),
        leg.ankle[1] + lift + Math.abs(Math.sin(roll)) * 0.1,
        z + anatomy.pelvis[2],
      );
      // Bake flat-floor IK and sole contact into ordinary quaternion tracks. The
      // gameplay runtime does not need this authoring solver or the source mesh.
      for (let correction = 0; correction < 5; correction++) {
        solveLeg(side, ankle, bones, scene);
        scene.updateMatrixWorld(true);
        const foot = bones.get(side + 'Foot')!;
        const parentQ = foot.parent!.getWorldQuaternion(new THREE.Quaternion());
        foot.quaternion
          .copy(parentQ.invert())
          .multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(roll, sign * -0.04, 0)));
        bones.get(side + 'Toes')!.rotation.x = 0;
        scene.updateMatrixWorld(true);
        if (correction < 4) {
          let bottom = Infinity;
          for (const vertex of soles[side]) {
            solePoint.fromBufferAttribute(positions, vertex);
            mesh.applyBoneTransform(vertex, solePoint);
            bottom = Math.min(bottom, solePoint.y);
          }
          ankle.y += lift + 0.002 - bottom;
        }
      }
      // Swing the opposite arm, with relaxed elbow flexion and a delayed wrist.
      const swing = Math.cos(t + offset * Math.PI * 2);
      bones.get(side + 'Clavicle')!.rotation.set(0, 0.025 * swing, sign * 0.025);
      bones.get(side + 'UpperArm')!.rotation.set(0.25 * swing - 0.03, sign * 0.015, sign * -0.04);
      bones.get(side + 'ForeArm')!.rotation.set(-0.16 - 0.09 * (1 - swing), 0, sign * 0.02);
      bones
        .get(side + 'Hand')!
        .rotation.set(0.035 * Math.sin(t + offset * Math.PI * 2 - 0.4), 0, sign * 0.025);
    }
    times.push((frame / frames) * WALK.duration);
    for (const [name, bone] of bones) {
      const key = name + '.quaternion';
      if (!values.has(key)) values.set(key, []);
      const array = values.get(key)!;
      const q = bone.quaternion.clone().normalize();
      // q and -q encode the same rotation; keep adjacent samples on one hemisphere.
      if (array.length && q.dot(new THREE.Quaternion().fromArray(array, array.length - 4)) < 0)
        q.set(-q.x, -q.y, -q.z, -q.w);
      array.push(q.x, q.y, q.z, q.w);
    }
    const key = 'Hips.position';
    if (!values.has(key)) values.set(key, []);
    values.get(key)!.push(hips.position.x, hips.position.y, hips.position.z);
  }
  for (const [name, bone] of bones) {
    bone.quaternion.identity();
    bone.position.copy(original.get(name)!);
  }
  scene.updateMatrixWorld(true);
  const clip = new THREE.AnimationClip(
    'Walking',
    WALK.duration,
    [...values].map(([key, data]) =>
      key.endsWith('.position')
        ? new THREE.VectorKeyframeTrack(key, times, data)
        : new THREE.QuaternionKeyframeTrack(key, times, data),
    ),
  );
  stampWalkingGait(clip, {
    speed: WALK.stride / WALK.duration,
    feet: {
      Left: { contact: 0, liftOff: WALK.stance },
      Right: { contact: 0.5, liftOff: (WALK.stance + 0.5) % 1 },
    },
  });
  return clip;
}
