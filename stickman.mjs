/**
 * Stickman skeleton + procedural poses, Hyun's-Dojo style.
 *
 * A pose is a flat bag of numbers: pelvis height/orientation, spine lean,
 * head tilt, and — most importantly — target positions for both hands and
 * both feet in character space (character at origin, facing +Z, up +Y,
 * character's left at +X). Elbows and knees are solved with analytic
 * two-bone IK, so a pose is authored by saying *where the fists and feet
 * go*, never by guessing joint angles. Poses lerp key-by-key, which makes
 * keyframed cast gestures trivial.
 *
 * Pure three.js maths, no renderer — the tests drive this headlessly and
 * pin bone lengths / IK reach / ground contact before anything is drawn.
 */
import * as THREE from 'three';

export const PROP = {
  torso: 0.52, // pelvis -> chest (shoulder line)
  neck: 0.13,
  headR: 0.155,
  shoulderHalf: 0.21,
  upperArm: 0.32,
  foreArm: 0.30,
  hipHalf: 0.11,
  thigh: 0.48,
  shin: 0.48,
  ankleH: 0.07, // ankle height when the foot is planted
  foot: 0.16, // ankle -> toe
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
  ['hipL', 'kneeL'], ['kneeL', 'ankleL'], ['ankleL', 'toeL'],
  ['hipR', 'kneeR'], ['kneeR', 'ankleR'], ['ankleR', 'toeR'],
];

export const JOINTS = [
  'pelvis', 'chest', 'neck', 'head',
  'shoulderL', 'elbowL', 'handL', 'shoulderR', 'elbowR', 'handR',
  'hipL', 'kneeL', 'ankleL', 'toeL', 'hipR', 'kneeR', 'ankleR', 'toeR',
];

/**
 * Fighting stance, Dojo-style: knees soft, feet staggered, fists up.
 * Every pose in this file is BASE plus overrides.
 */
export const BASE = {
  rootY: 0.94,
  pelvisPitch: 0.0, pelvisYaw: 0.10, pelvisRoll: 0.0,
  lean: 0.14, spineYaw: -0.06, spineRoll: 0.0,
  headPitch: 0.05, headYaw: 0.0,
  hLx: 0.27, hLy: 1.16, hLz: 0.30,
  hRx: -0.27, hRy: 1.08, hRz: 0.22,
  fLx: 0.16, fLy: PROP.ankleH, fLz: 0.14,
  fRx: -0.16, fRy: PROP.ankleH, fRz: -0.12,
  toeL: 0.38, toeR: 0.38, // toe pitch, + = toe tips down toward the ground
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
 * Analytic two-bone IK. Writes the mid joint (elbow/knee) into `midOut` and
 * the actually-reached end point into `endOut` (short of the target when the
 * target is beyond reach). `pole` says which way the mid joint bulges.
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
 * Pose -> joint world positions (character space). Returns fresh vectors in
 * `joints`, plus the head/spine orientation for attachments (headband...).
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
  J.neck.copy(J.chest).addScaledVector(upS, PROP.neck * 0.55);
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

  // Legs: knees bulge forward.
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
    const toeDir = fwdP.clone().multiplyScalar(Math.cos(p[`toe${s}`]))
      .addScaledVector(upP, -Math.sin(p[`toe${s}`]));
    J[`toe${s}`].copy(J[`ankle${s}`]).addScaledVector(toeDir, PROP.foot);
  }

  return { joints: J, headQuat: qHead, spineQuat: qSpine, pelvisQuat: qPelvis };
}

/* -------------------------------------------------------- pose factories -- */

/** Breathing, bouncing guard stance. */
export function idlePose(t) {
  const p = makePose();
  p.lean += 0.025 * Math.sin(t * 1.6);
  p.rootY += 0.012 * Math.sin(t * 3.2);
  p.pelvisYaw += 0.03 * Math.sin(t * 1.6);
  p.hLy += 0.02 * Math.sin(t * 3.2);
  p.hRy += 0.02 * Math.sin(t * 3.2 + 0.4);
  p.hLz += 0.015 * Math.sin(t * 1.6 + 1.0);
  p.headYaw = 0.07 * Math.sin(t * 0.5);
  return p;
}

/**
 * Walk (run=0) → sprint (run=1) gait. Feet travel an ellipse: lifted while
 * swinging forward, planted while pushing back. Arms counter-swing.
 */
export function gaitPose(phase, run) {
  const L = THREE.MathUtils.lerp;
  const stride = L(0.34, 0.52, run);
  const lift = L(0.12, 0.30, run);
  const armSwing = L(0.20, 0.34, run);
  const p = makePose();

  const foot = (ph) => ({
    z: -stride * Math.cos(ph),
    y: PROP.ankleH + lift * Math.pow(Math.max(0, Math.sin(ph)), 0.8),
    xOut: 0.03 * Math.max(0, Math.sin(ph)),
  });
  const fl = foot(phase);
  const fr = foot(phase + Math.PI);
  p.fLx = 0.15 + fl.xOut; p.fLy = fl.y; p.fLz = fl.z;
  p.fRx = -0.15 - fr.xOut; p.fRy = fr.y; p.fRz = fr.z;
  p.toeL = 0.38 + 0.35 * Math.pow(Math.max(0, Math.sin(phase - 0.6)), 2) * run;
  p.toeR = 0.38 + 0.35 * Math.pow(Math.max(0, Math.sin(phase + Math.PI - 0.6)), 2) * run;

  const bob = L(0.02, 0.045, run);
  p.rootY = L(0.93, 0.865, run) + bob * Math.sin(2 * phase + 0.8) - bob * 0.3
    + run * 0.05 * Math.pow(Math.max(0, Math.sin(2 * phase + 2.2)), 2); // flight
  p.lean = L(0.10, 0.30, run) + 0.03 * Math.sin(2 * phase);
  p.pelvisRoll = 0.05 * Math.sin(phase) * (1 - run * 0.5);
  p.pelvisYaw = 0.08 * Math.sin(phase);
  p.spineYaw = -0.10 * Math.sin(phase);
  p.headPitch = 0.08;

  const handY = L(0.98, 1.05, run) + 0.03 * Math.sin(2 * phase);
  p.hLx = 0.25; p.hLy = handY; p.hLz = armSwing * Math.cos(phase) + 0.05;
  p.hRx = -0.25; p.hRy = handY; p.hRz = -armSwing * Math.cos(phase) + 0.05;
  return p;
}

/** Airborne: k=+1 rising (split kick), k=-1 falling (braced to land). */
export function airPose(k) {
  const rise = makePose({
    rootY: 0.95, lean: 0.18, headPitch: -0.05,
    hLx: 0.50, hLy: 1.75, hLz: 0.10, hRx: -0.50, hRy: 1.75, hRz: 0.10,
    fLx: 0.16, fLy: 0.60, fLz: 0.38, fRx: -0.16, fRy: 0.52, fRz: -0.34,
    toeL: 0.6, toeR: 0.6,
  });
  const fall = makePose({
    rootY: 0.92, lean: 0.26, headPitch: 0.15,
    hLx: 0.55, hLy: 1.15, hLz: 0.15, hRx: -0.55, hRy: 1.15, hRz: 0.15,
    fLx: 0.17, fLy: 0.30, fLz: 0.10, fRx: -0.17, fRy: 0.34, fRz: -0.06,
    toeL: 0.3, toeR: 0.3,
  });
  return lerpPose(fall, rise, THREE.MathUtils.clamp((k + 1) / 2, 0, 1));
}

/** Deep crouch, the landing absorb. */
export function crouchPose() {
  return makePose({
    rootY: 0.72, lean: 0.38,
    hLx: 0.30, hLy: 0.95, hLz: 0.35, hRx: -0.30, hRy: 0.95, hRz: 0.35,
    fLx: 0.20, fLz: 0.16, fRx: -0.20, fRz: -0.14,
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
      { d: 0.18, ease: 'out', p: { hRx: -0.30, hRy: 1.25, hRz: -0.25, spineYaw: -0.35, lean: 0.05, rootY: 0.92 } },
      { d: 0.09, ease: 'out', p: { hRx: -0.10, hRy: 1.40, hRz: 0.62, hLx: 0.24, hLy: 1.05, hLz: 0.05, spineYaw: 0.32, pelvisYaw: 0.18, lean: 0.34, rootY: 0.90 } },
      { d: 0.14, ease: 'linear', p: {} },
      { d: 0.32, ease: 'inout', p: { ...BASE } },
    ],
  },
  prisma: {
    label: 'Prisma', color: '#57e6ff', fx: 'ring', fxAt: 0.30, glow: 'both',
    keys: [
      { d: 0.30, ease: 'out', p: { hLx: 0.74, hLy: 1.66, hLz: 0.06, hRx: -0.74, hRy: 1.66, hRz: 0.06, lean: -0.06, rootY: 0.97, headPitch: -0.12, spineYaw: 0 } },
      { d: 0.38, ease: 'linear', p: { hLy: 1.70, hRy: 1.70 } },
      { d: 0.35, ease: 'inout', p: { ...BASE } },
    ],
  },
  nova: {
    label: 'Nova', color: '#b78cff', fx: 'shell', fxAt: 0.45, glow: 'both',
    keys: [
      { d: 0.35, ease: 'inout', p: { hLx: 0.34, hLy: 1.00, hLz: -0.08, hRx: -0.34, hRy: 1.00, hRz: -0.08, rootY: 0.82, lean: 0.22, spineYaw: 0 } },
      { d: 0.10, ease: 'out', p: { hLx: 0.13, hLy: 1.35, hLz: 0.60, hRx: -0.13, hRy: 1.35, hRz: 0.60, lean: 0.38, rootY: 0.90 } },
      { d: 0.16, ease: 'linear', p: {} },
      { d: 0.35, ease: 'inout', p: { ...BASE } },
    ],
  },
  fall: {
    label: 'FALL', color: '#a64dff', fx: 'shockwave', fxAt: 0.41, glow: 'both',
    keys: [
      { d: 0.30, ease: 'out', p: { hLx: 0.30, hLy: 2.05, hLz: 0.15, hRx: -0.30, hRy: 2.05, hRz: 0.15, rootY: 1.00, lean: -0.08, headPitch: -0.10, spineYaw: 0 } },
      { d: 0.11, ease: 'in', p: { hLx: 0.24, hLy: 0.22, hLz: 0.50, hRx: -0.24, hRy: 0.22, hRz: 0.50, rootY: 0.50, lean: 0.95, headPitch: 0.30, fLx: 0.26, fLz: -0.05, fRx: -0.26, fRz: -0.05 } },
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
