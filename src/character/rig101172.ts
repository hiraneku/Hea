import * as THREE from 'three';

/** Authored landmarks for 101172, in metres after normalizing to a 2 m stature.
 * The source is a single mesh in a splayed A-pose; its feet point toward -Z.
 * This asset is authored facing +Z, with the floor at Y=0 and no root translation.
 * Do not apply these weights/landmarks to an arbitrary humanoid.
 */
export const WALK = {
  duration: 1.2,
  stride: 0.82,
  height: 2,
  samples: 120,
  stance: 0.52,
  contactAdvance: 0.25,
  clearance: 0.055,
} as const;
export const RIG_REVISION = 2;
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
const joints: Joint[] = [
  { name: 'Root', parent: null, at: [0, 0, 0] },
  { name: 'Hips', parent: 'Root', at: [0, 0.97, -0.025] },
  { name: 'Spine', parent: 'Hips', at: [0, 1.1, -0.02] },
  { name: 'SpineUpper', parent: 'Spine', at: [0, 1.29, -0.01] },
  { name: 'Chest', parent: 'SpineUpper', at: [0, 1.44, -0.005] },
  { name: 'Neck', parent: 'Chest', at: [0, 1.6, 0] },
  { name: 'Head', parent: 'Neck', at: [0, 1.7, 0] },
  { name: 'HeadEnd', parent: 'Head', at: [0, 1.97, 0] },
];
for (const [side, sign] of [
  ['Left', 1],
  ['Right', -1],
] as const) {
  joints.push(
    { name: `${side}Clavicle`, parent: 'Chest', at: [sign * 0.065, 1.48, -0.005] },
    { name: `${side}UpperArm`, parent: `${side}Clavicle`, at: [sign * 0.12, 1.46, -0.005] },
    { name: `${side}ForeArm`, parent: `${side}UpperArm`, at: [sign * 0.205, 1.17, -0.02] },
    { name: `${side}Hand`, parent: `${side}ForeArm`, at: [sign * 0.255, 0.91, -0.025] },
    { name: `${side}HandEnd`, parent: `${side}Hand`, at: [sign * 0.26, 0.82, -0.025] },
    { name: `${side}Thigh`, parent: 'Hips', at: [sign * 0.075, 0.95, -0.03] },
    { name: `${side}Shin`, parent: `${side}Thigh`, at: [sign * 0.16, 0.51, -0.01] },
    { name: `${side}Foot`, parent: `${side}Shin`, at: [sign * 0.24, 0.16, 0.03] },
    { name: `${side}Toes`, parent: `${side}Foot`, at: [sign * 0.25, 0.045, 0.12] },
    { name: `${side}ToeEnd`, parent: `${side}Toes`, at: [sign * 0.25, 0.04, 0.145] },
  );
}
export const JOINT_NAMES = joints.map((joint) => joint.name);
const smooth = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b);

/** A true skinned mesh with four normalized influences per vertex. UVs, normals,
 * indices, texture and material survive; the original source is never mutated.
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
  geometry.rotateY(Math.PI);
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
      clip: 'Walking',
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
  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.name = 'CharacterSkin';
  mesh.add(bones.get('Root')!);
  scene.add(mesh);
  scene.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton([...bones.values()]);
  mesh.bind(skeleton);
  weightSkin(geometry);
  mesh.normalizeSkinWeights();
  mesh.frustumCulled = false; // animated bounds must not use the static A-pose box
  mesh.castShadow = mesh.receiveShadow = true;
  const animations = [makeWalk(bones, scene, mesh)];
  return { scene, mesh, skeleton, animations };
}

function weightSkin(geometry: THREE.BufferGeometry) {
  const position = geometry.getAttribute('position');
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
    // Midway between the surface of the trunk and the arm centreline at each height.
    const armBorder = THREE.MathUtils.lerp(0.14, 0.095, smooth(1.0, 1.5, p.y));
    const armMask =
      smooth(armBorder - 0.018, armBorder + 0.035, ax) *
      (1 - smooth(1.5, 1.59, p.y)) *
      smooth(0.76, 0.85, p.y);
    const legMask = (1 - smooth(0.88, 1.01, p.y)) * (1 - armMask);
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
        if (leg) {
          // Distance alone let the shin pull the sole when bending the knee.
          // Keep the heel/sole on the foot and blend only through the ankle.
          const footMask = 1 - smooth(0.12, 0.23, p.y);
          const toeMask = smooth(0.055, 0.115, p.z);
          if (segment.name.endsWith('Foot')) mask *= footMask * (1 - toeMask);
          else if (segment.name.endsWith('Toes')) mask *= footMask * toeMask;
          else mask *= 1 - footMask;
        }
        new THREE.Line3(segment.a, segment.b).closestPointToPoint(p, true, nearest);
        const d2 = p.distanceToSquared(nearest);
        // Compact smooth falloff around each segment; a small finite kernel blends joints.
        const radius = segment.name === 'Head' ? 0.09 : 0.038;
        return { index: segment.index, weight: mask * Math.exp(-d2 / (2 * radius * radius)) };
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

/** Flat-floor two-bone IK in the sagittal plane, with knees always bending forward.
 * Rotations are solved relative to the authored A-pose, so gait is not tied to the viewer.
 */
function solveLeg(
  side: string,
  ankle: THREE.Vector3,
  bones: Map<string, THREE.Bone>,
  scene: THREE.Object3D,
) {
  const thigh = bones.get(side + 'Thigh')!,
    shin = bones.get(side + 'Shin')!,
    foot = bones.get(side + 'Foot')!;
  scene.updateMatrixWorld(true);
  const hip = thigh.getWorldPosition(new THREE.Vector3());
  const l1 = shin.position.length(),
    l2 = foot.position.length();
  const direction = ankle.clone().sub(hip);
  const distance = Math.min(direction.length(), l1 + l2 - 0.002);
  direction.normalize();
  const along = (l1 * l1 + distance * distance - l2 * l2) / (2 * distance);
  const bend = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  const pole = new THREE.Vector3(0, 0, 1).addScaledVector(direction, -direction.z).normalize();
  const knee = hip.clone().addScaledVector(direction, along).addScaledVector(pole, bend);
  const parentWorld = thigh.parent!.getWorldQuaternion(new THREE.Quaternion());
  const upperDirection = knee
    .clone()
    .sub(hip)
    .normalize()
    .applyQuaternion(parentWorld.clone().invert());
  thigh.quaternion.setFromUnitVectors(shin.position.clone().normalize(), upperDirection);
  scene.updateMatrixWorld(true);
  const thighWorld = thigh.getWorldQuaternion(new THREE.Quaternion());
  const lowerDirection = ankle.clone().sub(knee).normalize().applyQuaternion(thighWorld.invert());
  shin.quaternion.setFromUnitVectors(foot.position.clone().normalize(), lowerDirection);
}

function makeWalk(bones: Map<string, THREE.Bone>, scene: THREE.Group, mesh: THREE.SkinnedMesh) {
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
  for (let frame = 0; frame <= frames; frame++) {
    const phase = frame === frames ? 0 : frame / frames;
    const t = phase * Math.PI * 2;
    for (const [name, bone] of bones) {
      bone.quaternion.identity();
      bone.position.copy(original.get(name)!);
    }
    // Double support at contacts, body highest over the planted foot. Small lateral
    // transfer, pelvis yaw and counter-rotating chest make the gait read as weight.
    // The old 0.91 m pelvis shortened the supporting leg by ~8 cm and
    // forced a permanent crouch. Mid-stance now approaches full extension.
    hips.position.y = 0.965 - 0.012 * Math.cos(2 * t);
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
        roll = -0.06 * (1 - smooth(0, 0.18, u)) + 0.04 * smooth(0.72, 1, u);
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
        roll = THREE.MathUtils.lerp(0.04, -0.06, smooth(0, 1, u)) + 0.08 * Math.sin(Math.PI * u);
      }
      const ankle = new THREE.Vector3(
        sign * (0.135 + 0.006 * Math.sin(Math.PI * p) ** 2),
        0.16 + lift + Math.abs(Math.sin(roll)) * 0.065,
        z - 0.03,
      );
      // Bake flat-floor IK and sole contact into ordinary quaternion tracks. The
      // gameplay runtime does not need this authoring solver or the source mesh.
      for (let correction = 0; correction < 3; correction++) {
        solveLeg(side, ankle, bones, scene);
        scene.updateMatrixWorld(true);
        const foot = bones.get(side + 'Foot')!;
        const parentQ = foot.parent!.getWorldQuaternion(new THREE.Quaternion());
        foot.quaternion
          .copy(parentQ.invert())
          .multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(roll, sign * -0.04, 0)));
        bones.get(side + 'Toes')!.rotation.x = 0;
        scene.updateMatrixWorld(true);
        if (correction < 2) {
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
      bones.get(side + 'UpperArm')!.rotation.set(0.25 * swing - 0.03, sign * 0.015, sign * -0.12);
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
  return new THREE.AnimationClip(
    'Walking',
    WALK.duration,
    [...values].map(([key, data]) =>
      key.endsWith('.position')
        ? new THREE.VectorKeyframeTrack(key, times, data)
        : new THREE.QuaternionKeyframeTrack(key, times, data),
    ),
  );
}
