/**
 * Stickman skeleton + procedural poses, Hyun's-Dojo (RHG) style.
 *
 * Proportions are measured off the reference art (pixel-measured, in head
 * diameters): total height 3.66 heads — head 1.0, torso 1.28, legs 1.37;
 * torso column only ~0.4 heads wide (the head dwarfs the shoulders);
 * limbs ~0.26 heads thick, near-uniform tubes ending in rounded stumps.
 *
 * A pose is a flat bag of numbers: pelvis height/orientation, spine lean,
 * head tilt, and target positions for both hands and feet in character
 * space (origin at the ground, facing +Z, up +Y, left at +X). Elbows and
 * knees come from analytic two-bone IK, so poses are authored by where
 * the fists/feet go, never by joint angles. Poses lerp key-by-key, which
 * makes keyframed cast gestures trivial.
 *
 * Pure three.js maths, no renderer — tests pin bone lengths / IK reach /
 * ground contact headlessly before anything is drawn.
 */
import * as THREE from 'three';

// One head diameter D = 0.46 m. Figure stands ~1.65 m = 3.6 heads.
export const PROP = {
  torso: 0.44, // pelvis -> chest joints (surface torso reads ~1.28 D with radii)
  neck: 0.10,
  headR: 0.23, // D/2 — the signature giant round head
  shoulderHalf: 0.11,
  upperArm: 0.26,
  foreArm: 0.25,
  hipHalf: 0.07,
  thigh: 0.34,
  shin: 0.34,
  ankleH: 0.055, // ankle height planted (rounded leg-end touches down)
};

/** Joint pairs drawn as bones, and used as ragdoll constraints. */
export const BONES = [
  ['pelvis', 'chest'],
  ['chest', 'neck'],
  ['neck', 'head'],
  ['chest', 'shoulderL'], ['chest', 'shoulderR'],
  ['shoulderL', 'elbowL'], ['elbowL', 'handL'],
  ['shoulderR', 'elbowR'], ['elbowR', 'handR'],
  ['pelvis', 'hipL'], ['pelvis', 'hipR'],
  ['hipL', 'kneeL'], ['kneeL', 'ankleL'],
  ['hipR', 'kneeR'], ['kneeR', 'ankleR'],
];

export const JOINTS = [
  'pelvis', 'chest', 'neck', 'head',
  'shoulderL', 'elbowL', 'handL', 'shoulderR', 'elbowR', 'handR',
  'hipL', 'kneeL', 'ankleL', 'hipR', 'kneeR', 'ankleR',
];

/**
 * The reference stance: standing tall, katana hand up by the shoulder (the
 * blade rides over it), free hand crossed to the opposite hip.
 * Every pose in this file is BASE plus overrides.
 */
export const BASE = {
  rootY: 0.71,
  pelvisPitch: 0.0, pelvisYaw: 0.05, pelvisRoll: 0.0,
  lean: 0.06, spineYaw: 0.04, spineRoll: 0.0,
  headPitch: 0.10, headYaw: 0.08,
  hLx: -0.04, hLy: 0.78, hLz: 0.15, // left hand crossed in front of the right hip
  hRx: -0.19, hRy: 1.12, hRz: 0.10, // sword hand up at the shoulder
  fLx: 0.13, fLy: PROP.ankleH, fLz: 0.05,
  fRx: -0.13, fRy: PROP.ankleH, fRz: -0.03,
};

export function makePose(overrides = {}) {
  return { ...BASE, ...overrides };
}

export function lerpPose(a, b, t) {
  const out = {};
  for (const k of Object.keys(BASE)) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}

export const EASE = {
  linear: (t) => t,
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
  inout: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2),
};

/* ------------------------------------------------------------------ IK -- */

const _dir = new THREE.Vector3();
const _perp = new THREE.Vector3();
const _tmp = new THREE.Vector3();

/**
 * Analytic two-bone IK. Writes the mid joint into `midOut` and the
 * actually-reached end point into `endOut` (short of an unreachable
 * target). `pole` says which way the mid joint bulges.
 */
export function solve2Bone(root, target, l1, l2, pole, midOut, endOut) {
  _dir.subVectors(target, root);
  let d = _dir.length();
  const maxD = l1 + l2 - 1e-4;
  const minD = Math.abs(l1 - l2) + 1e-3;
  d = THREE.MathUtils.clamp(d, minD, maxD);
  _dir.normalize();
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(l1 * l1 - a * a, 0));
  _perp.copy(pole).addScaledVector(_dir, -pole.dot(_dir));
  if (_perp.lengthSq() < 1e-6) {
    _perp.set(0, 0, 1).addScaledVector(_dir, -_dir.z);
    if (_perp.lengthSq() < 1e-6) _perp.set(1, 0, 0);
  }
  _perp.normalize();
  midOut.copy(root).addScaledVector(_dir, a).addScaledVector(_perp, h);
  endOut.copy(root).addScaledVector(_dir, d);
  return endOut;
}

/* ------------------------------------------------------------- skeleton -- */

const q = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, 'YXZ'));
const axis = (x, y, z, quat) => new THREE.Vector3(x, y, z).applyQuaternion(quat);

/**
 * Pose -> joint positions (character space), plus head/spine orientations
 * for attachments (face, headband).
 */
export function computeSkeleton(p) {
  const J = {};
  for (const name of JOINTS) J[name] = new THREE.Vector3();

  const qPelvis = q(p.pelvisPitch, p.pelvisYaw, p.pelvisRoll);
  const upP = axis(0, 1, 0, qPelvis);
  const rightP = axis(1, 0, 0, qPelvis);
  const fwdP = axis(0, 0, 1, qPelvis);

  J.pelvis.set(0, p.rootY, 0);
  J.hipL.copy(J.pelvis).addScaledVector(rightP, PROP.hipHalf);
  J.hipR.copy(J.pelvis).addScaledVector(rightP, -PROP.hipHalf);

  const qSpine = qPelvis.clone().multiply(q(p.lean, p.spineYaw, p.spineRoll));
  const upS = axis(0, 1, 0, qSpine);
  const rightS = axis(1, 0, 0, qSpine);
  J.chest.copy(J.pelvis).addScaledVector(upS, PROP.torso);
  J.neck.copy(J.chest).addScaledVector(upS, PROP.neck * 0.6);
  J.shoulderL.copy(J.chest).addScaledVector(rightS, PROP.shoulderHalf).addScaledVector(upS, -0.02);
  J.shoulderR.copy(J.chest).addScaledVector(rightS, -PROP.shoulderHalf).addScaledVector(upS, -0.02);

  const qHead = qSpine.clone().multiply(q(p.headPitch, p.headYaw, 0));
  J.head.copy(J.chest).addScaledVector(axis(0, 1, 0, qHead), PROP.neck + PROP.headR * 0.72);

  // Arms: elbows bulge down-back-out, the relaxed human hang.
  for (const s of ['L', 'R']) {
    const side = s === 'L' ? 1 : -1;
    const pole = _tmp.set(0, 0, 0)
      .addScaledVector(rightP, side * 0.4)
      .addScaledVector(upP, -1)
      .addScaledVector(fwdP, -0.5)
      .clone();
    solve2Bone(
      J[`shoulder${s}`],
      new THREE.Vector3(p[`h${s}x`], p[`h${s}y`], p[`h${s}z`]),
      PROP.upperArm, PROP.foreArm, pole, J[`elbow${s}`], J[`hand${s}`],
    );
  }

  // Legs: knees bulge forward. The ankle IS the foot — a rounded stump.
  for (const s of ['L', 'R']) {
    const side = s === 'L' ? 1 : -1;
    const pole = _tmp.set(0, 0, 0)
      .addScaledVector(fwdP, 1)
      .addScaledVector(rightP, side * 0.08)
      .clone();
    solve2Bone(
      J[`hip${s}`],
      new THREE.Vector3(p[`f${s}x`], p[`f${s}y`], p[`f${s}z`]),
      PROP.thigh, PROP.shin, pole, J[`knee${s}`], J[`ankle${s}`],
    );
  }

  return { joints: J, headQuat: qHead, spineQuat: qSpine, pelvisQuat: qPelvis };
}

/* -------------------------------------------------------- pose factories -- */

/** Breathing reference stance: barely moves, confident and still. */
export function idlePose(t) {
  const p = makePose();
  p.lean += 0.02 * Math.sin(t * 1.5);
  p.rootY += 0.008 * Math.sin(t * 3.0);
  p.hRy += 0.012 * Math.sin(t * 3.0 + 0.4);
  p.hLy += 0.012 * Math.sin(t * 3.0);
  p.headYaw = 0.08 + 0.06 * Math.sin(t * 0.45);
  return p;
}

/**
 * Walk (run=0) → sprint (run=1) gait. Feet travel an ellipse: lifted while
 * swinging forward, planted while pushing back. Arms counter-swing (the
 * katana hand pumps with the rest).
 */
export function gaitPose(phase, run) {
  const L = THREE.MathUtils.lerp;
  const stride = L(0.26, 0.40, run);
  const lift = L(0.10, 0.22, run);
  const armSwing = L(0.16, 0.26, run);
  const p = makePose();

  const foot = (ph) => ({
    z: -stride * Math.cos(ph),
    y: PROP.ankleH + lift * Math.pow(Math.max(0, Math.sin(ph)), 0.8),
    xOut: 0.02 * Math.max(0, Math.sin(ph)),
  });
  const fl = foot(phase);
  const fr = foot(phase + Math.PI);
  p.fLx = 0.11 + fl.xOut; p.fLy = fl.y; p.fLz = fl.z;
  p.fRx = -0.11 - fr.xOut; p.fRy = fr.y; p.fRz = fr.z;

  const bob = L(0.015, 0.035, run);
  p.rootY = L(0.68, 0.60, run) + bob * Math.sin(2 * phase + 0.8) - bob * 0.3
    + run * 0.04 * Math.pow(Math.max(0, Math.sin(2 * phase + 2.2)), 2); // flight
  p.lean = L(0.10, 0.30, run) + 0.03 * Math.sin(2 * phase);
  p.pelvisRoll = 0.05 * Math.sin(phase) * (1 - run * 0.5);
  p.pelvisYaw = 0.08 * Math.sin(phase);
  p.spineYaw = -0.10 * Math.sin(phase);
  p.headPitch = 0.10;
  p.headYaw = 0;

  const handY = L(0.78, 0.84, run) + 0.02 * Math.sin(2 * phase);
  p.hLx = 0.17; p.hLy = handY; p.hLz = armSwing * Math.cos(phase) + 0.04;
  p.hRx = -0.17; p.hRy = handY + 0.06; p.hRz = -armSwing * Math.cos(phase) + 0.04;
  return p;
}

/** Airborne: k=+1 rising (split kick), k=-1 falling (braced to land). */
export function airPose(k) {
  const rise = makePose({
    rootY: 0.70, lean: 0.16, headPitch: -0.02, headYaw: 0,
    hLx: 0.36, hLy: 1.32, hLz: 0.08, hRx: -0.30, hRy: 1.38, hRz: -0.06,
    fLx: 0.12, fLy: 0.45, fLz: 0.28, fRx: -0.12, fRy: 0.40, fRz: -0.26,
  });
  const fall = makePose({
    rootY: 0.68, lean: 0.24, headPitch: 0.16, headYaw: 0,
    hLx: 0.40, hLy: 0.88, hLz: 0.12, hRx: -0.34, hRy: 0.96, hRz: 0.02,
    fLx: 0.13, fLy: 0.26, fLz: 0.07, fRx: -0.13, fRy: 0.29, fRz: -0.04,
  });
  return lerpPose(fall, rise, THREE.MathUtils.clamp((k + 1) / 2, 0, 1));
}

/** Deep crouch, the landing absorb. */
export function crouchPose() {
  return makePose({
    rootY: 0.52, lean: 0.38, headYaw: 0,
    hLx: 0.22, hLy: 0.70, hLz: 0.24, hRx: -0.24, hRy: 0.78, hRz: 0.10,
    fLx: 0.15, fLz: 0.11, fRx: -0.15, fRz: -0.09,
  });
}

/* ------------------------------------------------------------ cast poses -- */

/**
 * Keyframed gestures. Each key overrides BASE cumulatively; `d` is the time
 * to travel INTO that key from the previous one. `fxAt` = seconds from the
 * start when the spell visually fires; glow ramps toward it.
 */
export const CASTS = {
  bara: {
    label: 'Bara', color: '#ff7a26', fx: 'fireball', fxAt: 0.27, glow: 'R',
    keys: [
      { d: 0.18, ease: 'out', p: { hRx: -0.22, hRy: 0.98, hRz: -0.18, hLx: 0.20, hLy: 0.92, hLz: 0.18, spineYaw: -0.35, lean: 0.05, rootY: 0.69, headYaw: 0 } },
      { d: 0.09, ease: 'out', p: { hRx: -0.08, hRy: 1.08, hRz: 0.50, hLx: 0.18, hLy: 0.84, hLz: 0.02, spineYaw: 0.32, pelvisYaw: 0.16, lean: 0.34, rootY: 0.68 } },
      { d: 0.14, ease: 'linear', p: {} },
      { d: 0.32, ease: 'inout', p: { ...BASE } },
    ],
  },
  prisma: {
    label: 'Prisma', color: '#57e6ff', fx: 'ring', fxAt: 0.30, glow: 'both',
    keys: [
      { d: 0.30, ease: 'out', p: { hLx: 0.52, hLy: 1.28, hLz: 0.05, hRx: -0.52, hRy: 1.28, hRz: 0.05, lean: -0.06, rootY: 0.74, headPitch: -0.10, headYaw: 0, spineYaw: 0 } },
      { d: 0.38, ease: 'linear', p: { hLy: 1.31, hRy: 1.31 } },
      { d: 0.35, ease: 'inout', p: { ...BASE } },
    ],
  },
  nova: {
    label: 'Nova', color: '#b78cff', fx: 'shell', fxAt: 0.45, glow: 'both',
    keys: [
      { d: 0.35, ease: 'inout', p: { hLx: 0.26, hLy: 0.76, hLz: -0.06, hRx: -0.26, hRy: 0.76, hRz: -0.06, rootY: 0.60, lean: 0.22, spineYaw: 0, headYaw: 0 } },
      { d: 0.10, ease: 'out', p: { hLx: 0.10, hLy: 1.04, hLz: 0.44, hRx: -0.10, hRy: 1.04, hRz: 0.44, lean: 0.38, rootY: 0.68 } },
      { d: 0.16, ease: 'linear', p: {} },
      { d: 0.35, ease: 'inout', p: { ...BASE } },
    ],
  },
  fall: {
    label: 'FALL', color: '#a64dff', fx: 'shockwave', fxAt: 0.41, glow: 'both',
    keys: [
      { d: 0.30, ease: 'out', p: { hLx: 0.22, hLy: 1.58, hLz: 0.12, hRx: -0.22, hRy: 1.58, hRz: 0.12, rootY: 0.75, lean: -0.08, headPitch: -0.08, headYaw: 0, spineYaw: 0 } },
      { d: 0.11, ease: 'in', p: { hLx: 0.18, hLy: 0.16, hLz: 0.36, hRx: -0.18, hRy: 0.16, hRz: 0.36, rootY: 0.38, lean: 0.95, headPitch: 0.30, fLx: 0.19, fLz: -0.04, fRx: -0.19, fRz: -0.04 } },
      { d: 0.28, ease: 'linear', p: {} },
      { d: 0.48, ease: 'inout', p: { ...BASE } },
    ],
  },
};

const castCache = new Map();
function compiled(cast) {
  let c = castCache.get(cast);
  if (!c) {
    const poses = [makePose()];
    let acc = makePose();
    for (const k of cast.keys) {
      acc = { ...acc, ...k.p };
      poses.push(acc);
    }
    c = { poses, total: cast.keys.reduce((s, k) => s + k.d, 0) };
    castCache.set(cast, c);
  }
  return c;
}

export function castDuration(cast) {
  return compiled(cast).total;
}

/** Pose of a cast at time t (clamped). */
export function castPoseAt(cast, t) {
  const { poses } = compiled(cast);
  let acc = 0;
  for (let i = 0; i < cast.keys.length; i++) {
    const k = cast.keys[i];
    if (t <= acc + k.d || i === cast.keys.length - 1) {
      const local = k.d === 0 ? 1 : THREE.MathUtils.clamp((t - acc) / k.d, 0, 1);
      return lerpPose(poses[i], poses[i + 1], (EASE[k.ease] || EASE.linear)(local));
    }
    acc += k.d;
  }
  return poses[poses.length - 1];
}
