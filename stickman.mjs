/**
 * Stickman skeleton + procedural poses, built to the supplied 100-unit spec
 * (1 unit = 1.75 cm, total height 1.75 m):
 *
 *   head 17w x 19h x 14d ellipsoid, center Y88 · neck ~0 exposed
 *   torso 22 long, 9 wide, 7 deep · shoulder span 15 at Y72
 *   arms 17+17, diameters 5.0/4.5, hand a rounded continuation
 *   legs 24+24, diameters 6.0/5.0, ankle Y5, knee Y25, hip Y49
 *   foot 5 long x 4 wide, simple rounded shape
 *
 * A pose is a flat bag of numbers: pelvis height/orientation, spine lean,
 * head tilt, and target positions for both hands and feet in character
 * space (origin at the ground, facing +Z, up +Y, left at +X). Elbows and
 * knees come from analytic two-bone IK. The rendered body is NOT built
 * from these as primitives — see sweepTube(): each limb and the torso are
 * single smooth tubes swept along the joint curve, so bends never show
 * joints, gaps, or intersections.
 *
 * Pure three.js maths, no renderer — tests pin the spec landmarks, bone
 * lengths, IK reach, ground contact, and tube sanity headlessly.
 */
import * as THREE from 'three';

export const PROP = {
  torso: 0.40, // pelvis -> chest joints (Y49 -> ~Y72 plus radii)
  neck: 0.09,
  headR: 0.166, // vertical radius: head height 19u = 0.3325 m
  headRX: 0.149, // head width 17u
  headRZ: 0.1225, // head depth 14u
  headLift: 0.28, // chest -> head center (Y72 -> Y88)
  shoulderHalf: 0.131, // shoulder span 15u
  upperArm: 0.30, // 17u
  foreArm: 0.30, // 17u (the rounded hand is tube extension, ~3u)
  hipHalf: 0.055,
  thigh: 0.42, // 24u
  shin: 0.42, // 24u
  ankleH: 0.088, // ankle center Y5u
  foot: 0.09, // foot length 5u
};

/** Limb radii from the spec diameters, per control point of each tube. */
export const RADII = {
  arm: [0.048, 0.0437, 0.041, 0.0394, 0.030, 0.004], // root-in, shoulder, elbow, wrist, hand, tip
  leg: [0.055, 0.0525, 0.047, 0.0437, 0.020], // hip-in, hip, knee, ankle, below-ankle cap
  torso: [0.004, 0.045, 0.072, 0.066, 0.079, 0.052, 0.040], // bottom cap, pelvis low, pelvis, waist, chest, neck, into head
};

/** Joint pairs used as ragdoll constraints. */
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
 * Sword-holding stance (the reference pose): standing tall, sword hand up
 * by the shoulder, free hand crossed low in front.
 * Every pose in this file is BASE plus overrides.
 */
export const BASE = {
  rootY: 0.88,
  pelvisPitch: 0.0, pelvisYaw: 0.05, pelvisRoll: 0.0,
  lean: 0.06, spineYaw: 0.04, spineRoll: 0.0,
  headPitch: 0.10, headYaw: 0.08,
  hLx: -0.05, hLy: 0.92, hLz: 0.16,
  hRx: -0.20, hRy: 1.24, hRz: 0.11,
  fLx: 0.10, fLy: PROP.ankleH, fLz: 0.04,
  fRx: -0.10, fRy: PROP.ankleH, fRz: -0.02,
  toeL: 0.30, toeR: 0.30, // foot pitch, + = toe tips down
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

/** Analytic two-bone IK: writes mid joint + reached end point. */
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

/** Pose -> joint positions (character space) + head/spine orientations. */
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
  J.head.copy(J.chest).addScaledVector(axis(0, 1, 0, qHead), PROP.headLift);

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

/* ------------------------------------------------------------ tube sweep -- */

/**
 * Sweep a smooth tube along the curve through `points`, with per-control-
 * point `radii`, writing positions/normals into preallocated arrays shaped
 * [rings x radial]. This is what makes the body one continuous surface:
 * at a bent elbow the tube simply curves — no joint geometry exists.
 * Cross-sections are circles, so parallel-transport frames suffice.
 */
export function sweepTube(points, radii, rings, radial, outPos, outNorm) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const pts = curve.getSpacedPoints(rings - 1);
  const cum = [0];
  for (let k = 1; k < points.length; k++) cum.push(cum[k - 1] + points[k].distanceTo(points[k - 1]));
  const total = cum[cum.length - 1] || 1;
  const radiusAt = (f) => {
    const d = f * total;
    let k = 1;
    while (k < cum.length - 1 && cum[k] < d) k++;
    const span = (cum[k] - cum[k - 1]) || 1;
    const t = THREE.MathUtils.clamp((d - cum[k - 1]) / span, 0, 1);
    return radii[k - 1] + (radii[k] - radii[k - 1]) * t;
  };
  const T = new THREE.Vector3();
  const N = new THREE.Vector3(1, 0, 0);
  const B = new THREE.Vector3();
  T.subVectors(pts[1], pts[0]);
  if (T.lengthSq() > 1e-10) {
    T.normalize();
    if (Math.abs(T.x) > 0.9) N.set(0, 0, 1);
    N.addScaledVector(T, -N.dot(T)).normalize();
  }
  for (let i = 0; i < rings; i++) {
    const iP = Math.max(i - 1, 0);
    const iN = Math.min(i + 1, rings - 1);
    T.subVectors(pts[iN], pts[iP]);
    if (T.lengthSq() < 1e-10) T.set(0, 1, 0); else T.normalize();
    N.addScaledVector(T, -N.dot(T));
    if (N.lengthSq() < 1e-8) {
      N.set(1, 0, 0);
      if (Math.abs(T.x) > 0.9) N.set(0, 0, 1);
      N.addScaledVector(T, -N.dot(T));
    }
    N.normalize();
    B.crossVectors(T, N);
    const r = radiusAt(i / (rings - 1));
    const P = pts[i];
    for (let j = 0; j < radial; j++) {
      const th = (j / radial) * Math.PI * 2;
      const cx = Math.cos(th);
      const sx = Math.sin(th);
      const dx = N.x * cx + B.x * sx;
      const dy = N.y * cx + B.y * sx;
      const dz = N.z * cx + B.z * sx;
      const o = (i * radial + j) * 3;
      outPos[o] = P.x + dx * r;
      outPos[o + 1] = P.y + dy * r;
      outPos[o + 2] = P.z + dz * r;
      outNorm[o] = dx;
      outNorm[o + 1] = dy;
      outNorm[o + 2] = dz;
    }
  }
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

/** Walk (run=0) → sprint (run=1): elliptical foot paths, counter-swing arms. */
export function gaitPose(phase, run) {
  const L = THREE.MathUtils.lerp;
  const stride = L(0.30, 0.46, run);
  const lift = L(0.11, 0.24, run);
  const armSwing = L(0.20, 0.32, run);
  const p = makePose();

  const foot = (ph) => ({
    z: -stride * Math.cos(ph),
    y: PROP.ankleH + lift * Math.pow(Math.max(0, Math.sin(ph)), 0.8),
    xOut: 0.02 * Math.max(0, Math.sin(ph)),
  });
  const fl = foot(phase);
  const fr = foot(phase + Math.PI);
  p.fLx = 0.10 + fl.xOut; p.fLy = fl.y; p.fLz = fl.z;
  p.fRx = -0.10 - fr.xOut; p.fRy = fr.y; p.fRz = fr.z;
  p.toeL = 0.30 + 0.45 * Math.pow(Math.max(0, Math.sin(phase - 0.6)), 2) * run;
  p.toeR = 0.30 + 0.45 * Math.pow(Math.max(0, Math.sin(phase + Math.PI - 0.6)), 2) * run;

  const bob = L(0.018, 0.04, run);
  p.rootY = L(0.85, 0.78, run) + bob * Math.sin(2 * phase + 0.8) - bob * 0.3
    + run * 0.04 * Math.pow(Math.max(0, Math.sin(2 * phase + 2.2)), 2);
  p.lean = L(0.10, 0.30, run) + 0.03 * Math.sin(2 * phase);
  p.pelvisRoll = 0.05 * Math.sin(phase) * (1 - run * 0.5);
  p.pelvisYaw = 0.08 * Math.sin(phase);
  p.spineYaw = -0.10 * Math.sin(phase);
  p.headPitch = 0.10;
  p.headYaw = 0;

  const handY = L(0.92, 0.98, run) + 0.02 * Math.sin(2 * phase);
  p.hLx = 0.19; p.hLy = handY; p.hLz = armSwing * Math.cos(phase) + 0.04;
  p.hRx = -0.19; p.hRy = handY + 0.05; p.hRz = -armSwing * Math.cos(phase) + 0.04;
  return p;
}

/** Airborne: k=+1 rising (split), k=-1 falling (braced to land). */
export function airPose(k) {
  const rise = makePose({
    rootY: 0.86, lean: 0.16, headPitch: -0.02, headYaw: 0,
    hLx: 0.42, hLy: 1.52, hLz: 0.08, hRx: -0.36, hRy: 1.56, hRz: -0.06,
    fLx: 0.11, fLy: 0.52, fLz: 0.32, fRx: -0.11, fRy: 0.47, fRz: -0.30,
    toeL: 0.55, toeR: 0.55,
  });
  const fall = makePose({
    rootY: 0.84, lean: 0.24, headPitch: 0.16, headYaw: 0,
    hLx: 0.46, hLy: 1.02, hLz: 0.13, hRx: -0.40, hRy: 1.10, hRz: 0.02,
    fLx: 0.12, fLy: 0.30, fLz: 0.08, fRx: -0.12, fRy: 0.33, fRz: -0.05,
    toeL: 0.4, toeR: 0.4,
  });
  return lerpPose(fall, rise, THREE.MathUtils.clamp((k + 1) / 2, 0, 1));
}

/** Deep crouch / squat, the landing absorb. */
export function crouchPose() {
  return makePose({
    rootY: 0.58, lean: 0.38, headYaw: 0,
    hLx: 0.24, hLy: 0.80, hLz: 0.26, hRx: -0.26, hRy: 0.86, hRz: 0.12,
    fLx: 0.14, fLz: 0.12, fRx: -0.14, fRz: -0.10,
  });
}

/* ------------------------------------------------------------ cast poses -- */

/**
 * Keyframed gestures. Each key overrides BASE cumulatively; `d` is the time
 * to travel INTO that key. `fxAt` = when the spell visually fires.
 */
export const CASTS = {
  bara: {
    label: 'Bara', color: '#ff7a26', fx: 'fireball', fxAt: 0.27, glow: 'R',
    keys: [
      { d: 0.18, ease: 'out', p: { hRx: -0.24, hRy: 1.10, hRz: -0.20, hLx: 0.22, hLy: 1.04, hLz: 0.20, spineYaw: -0.35, lean: 0.05, rootY: 0.86, headYaw: 0 } },
      { d: 0.09, ease: 'out', p: { hRx: -0.09, hRy: 1.20, hRz: 0.55, hLx: 0.20, hLy: 0.98, hLz: 0.02, spineYaw: 0.32, pelvisYaw: 0.16, lean: 0.34, rootY: 0.84 } },
      { d: 0.14, ease: 'linear', p: {} },
      { d: 0.32, ease: 'inout', p: { ...BASE } },
    ],
  },
  prisma: {
    label: 'Prisma', color: '#57e6ff', fx: 'ring', fxAt: 0.30, glow: 'both',
    keys: [
      { d: 0.30, ease: 'out', p: { hLx: 0.58, hLy: 1.44, hLz: 0.06, hRx: -0.58, hRy: 1.44, hRz: 0.06, lean: -0.06, rootY: 0.90, headPitch: -0.10, headYaw: 0, spineYaw: 0 } },
      { d: 0.38, ease: 'linear', p: { hLy: 1.47, hRy: 1.47 } },
      { d: 0.35, ease: 'inout', p: { ...BASE } },
    ],
  },
  nova: {
    label: 'Nova', color: '#b78cff', fx: 'shell', fxAt: 0.45, glow: 'both',
    keys: [
      { d: 0.35, ease: 'inout', p: { hLx: 0.28, hLy: 0.86, hLz: -0.07, hRx: -0.28, hRy: 0.86, hRz: -0.07, rootY: 0.66, lean: 0.22, spineYaw: 0, headYaw: 0 } },
      { d: 0.10, ease: 'out', p: { hLx: 0.11, hLy: 1.16, hLz: 0.50, hRx: -0.11, hRy: 1.16, hRz: 0.50, lean: 0.38, rootY: 0.84 } },
      { d: 0.16, ease: 'linear', p: {} },
      { d: 0.35, ease: 'inout', p: { ...BASE } },
    ],
  },
  fall: {
    label: 'FALL', color: '#a64dff', fx: 'shockwave', fxAt: 0.41, glow: 'both',
    keys: [
      { d: 0.30, ease: 'out', p: { hLx: 0.24, hLy: 1.78, hLz: 0.13, hRx: -0.24, hRy: 1.78, hRz: 0.13, rootY: 0.92, lean: -0.08, headPitch: -0.08, headYaw: 0, spineYaw: 0 } },
      { d: 0.11, ease: 'in', p: { hLx: 0.20, hLy: 0.18, hLz: 0.40, hRx: -0.20, hRy: 0.18, hRz: 0.40, rootY: 0.42, lean: 0.95, headPitch: 0.30, fLx: 0.20, fLz: -0.04, fRx: -0.20, fRz: -0.04 } },
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
