/**
 * Stickman skeleton + procedural poses, measured pixel-by-pixel off the
 * supplied reference render (front view, neutral stance). All values in
 * metres; the figure stands 1.75 m = 100 reference units (1u = 1.75 cm):
 *
 *   head: plain sphere, diameter 17.1u, center Y91.4, no face
 *   neck: short pinch, 4.1u wide at Y82.5
 *   torso: 5.4u wide mid-chest, widening to 10.5u at the hips (Y54)
 *   shoulders (joints) at +/-5.2u, Y74 · pelvis Y56 · crotch Y53.1
 *   arms: hang straight, diameter 4.2u, tips at Y45.5 beside the thighs
 *   legs: diameter ~5.3u, hip joints +/-3u, ankles +/-12u at Y5 (slight V)
 *   feet: rounded blobs ~6.9u wide pointing forward
 *   body colour sampled from the render: #9806f5
 *
 * A pose is a flat bag of numbers: pelvis height/orientation, spine lean,
 * head tilt, and target positions for both hands and feet in character
 * space (origin at the ground, facing +Z, up +Y, left at +X). Elbows and
 * knees come from analytic two-bone IK. The body is rendered as smooth
 * tubes swept along the joint curves (see sweepTube) — no joint geometry,
 * no gaps, no primitive intersections.
 */
import * as THREE from 'three';

export const PROP = {
  torso: 0.335, // pelvis Y56 -> chest Y75
  neck: 0.15,
  headR: 0.150, // sphere radius: diameter 17.1u
  headLift: 0.287, // chest -> head center (Y75 -> Y91.4)
  shoulderHalf: 0.0945, // shoulder joints +/-5.4u
  upperArm: 0.23, // 13.1u
  foreArm: 0.23, // 13.1u (+ ~4.5u rounded hand from the tube extension)
  hipHalf: 0.0525, // hip joints +/-3u
  thigh: 0.455, // 26u
  shin: 0.455, // 26u
  ankleH: 0.0875, // ankle center Y5u
  foot: 0.10, // ankle -> toe
};

/** Tube radii per control point, from the measured silhouette widths. */
export const RADII = {
  arm: [0.042, 0.0385, 0.038, 0.037, 0.036, 0.030, 0.004], // root-in, shoulder, mid-upper, elbow, wrist, hand, tip (dia 4.4u)
  leg: [0.048, 0.044, 0.045, 0.046, 0.050, 0.030], // hip-in, hip, mid-thigh, knee, ankle, cap (5.0u flaring to 5.7u at the foot)
  torso: [0.010, 0.092, 0.086, 0.052, 0.056, 0.088, 0.042], // cap, pelvis-low (10.5u), pelvis, waist (5.9u), chest (6.4u), shoulder cone (10.1u — head sits in sloped shoulder mass), into head
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
 * The reference stance itself: perfectly neutral — arms hanging straight
 * down, legs straight in a slight V, facing forward. Every pose in this
 * file is BASE plus overrides.
 */
export const BASE = {
  rootY: 0.98,
  pelvisPitch: 0.0, pelvisYaw: 0.0, pelvisRoll: 0.0,
  lean: 0.0, spineYaw: 0.0, spineRoll: 0.0,
  headPitch: 0.02, headYaw: 0.0,
  hLx: 0.180, hLy: 0.869, hLz: 0.005,
  hRx: -0.180, hRy: 0.869, hRz: 0.005,
  fLx: 0.21, fLy: PROP.ankleH, fLz: 0.0,
  fRx: -0.21, fRy: PROP.ankleH, fRz: 0.0,
  toeL: 0.28, toeR: 0.28,
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
  J.shoulderL.copy(J.chest).addScaledVector(rightS, PROP.shoulderHalf).addScaledVector(upS, -0.01);
  J.shoulderR.copy(J.chest).addScaledVector(rightS, -PROP.shoulderHalf).addScaledVector(upS, -0.01);

  const qHead = qSpine.clone().multiply(q(p.headPitch, p.headYaw, 0));
  J.head.copy(J.chest).addScaledVector(axis(0, 1, 0, qHead), PROP.headLift);

  for (const s of ['L', 'R']) {
    const side = s === 'L' ? 1 : -1;
    // Elbows bulge mostly BACKWARD (barely out), exactly as the render's
    // straight-looking hanging arms read from the front.
    const pole = _tmp.set(0, 0, 0)
      .addScaledVector(rightP, side * 0.12)
      .addScaledVector(upP, -1)
      .addScaledVector(fwdP, -0.65)
      .clone();
    solve2Bone(
      J[`shoulder${s}`],
      new THREE.Vector3(p[`h${s}x`], p[`h${s}y`], p[`h${s}z`]),
      PROP.upperArm, PROP.foreArm, pole, J[`elbow${s}`], J[`hand${s}`],
    );
  }

  for (const s of ['L', 'R']) {
    const side = s === 'L' ? 1 : -1;
    // Knees bulge straight forward, no sideways splay.
    const pole = _tmp.set(0, 0, 0)
      .addScaledVector(fwdP, 1)
      .addScaledVector(rightP, side * 0.02)
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
 * [rings x radial]. One continuous surface per body part: at a bent elbow
 * the tube simply curves — no joint geometry exists.
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

/**
 * The five body tubes for a joint set: control points + radii per part.
 * Roots start inside the torso so nothing intersects visibly; a guide
 * point a quarter along each upper limb pins the sweep to the straight
 * joint line (no outward bow at the root).
 */
export function bodyTubes(J) {
  const up = J.chest.clone().sub(J.pelvis).normalize();
  const headUp = J.head.clone().sub(J.neck).normalize();
  const tubes = {
    torso: {
      radii: RADII.torso,
      points: [
        J.pelvis.clone().addScaledVector(up, -0.085),
        J.pelvis.clone().addScaledVector(up, -0.05),
        J.pelvis.clone(),
        J.pelvis.clone().lerp(J.chest, 0.45),
        J.chest.clone(),
        J.neck.clone(),
        J.head.clone().addScaledVector(headUp, -0.06),
      ],
    },
  };
  for (const s of ['L', 'R']) {
    const fore = J[`hand${s}`].clone().sub(J[`elbow${s}`]);
    if (fore.lengthSq() < 1e-8) fore.set(0, -1, 0); else fore.normalize();
    tubes[`arm${s}`] = {
      radii: RADII.arm,
      points: [
        J.chest.clone().lerp(J[`shoulder${s}`], 0.35),
        J[`shoulder${s}`].clone(),
        J[`shoulder${s}`].clone().lerp(J[`elbow${s}`], 0.3),
        J[`elbow${s}`].clone(),
        J[`hand${s}`].clone(),
        J[`hand${s}`].clone().addScaledVector(fore, 0.05),
        J[`hand${s}`].clone().addScaledVector(fore, 0.078),
      ],
    };
    const shin = J[`ankle${s}`].clone().sub(J[`knee${s}`]);
    if (shin.lengthSq() < 1e-8) shin.set(0, -1, 0); else shin.normalize();
    tubes[`leg${s}`] = {
      radii: RADII.leg,
      points: [
        J.pelvis.clone().lerp(J[`hip${s}`], 0.3),
        J[`hip${s}`].clone(),
        J[`hip${s}`].clone().lerp(J[`knee${s}`], 0.3),
        J[`knee${s}`].clone(),
        J[`ankle${s}`].clone(),
        J[`ankle${s}`].clone().addScaledVector(shin, 0.035),
      ],
    };
  }
  return tubes;
}

/* -------------------------------------------------------- pose factories -- */

/** The neutral reference stance, breathing almost imperceptibly. */
export function idlePose(t) {
  const p = makePose();
  p.lean += 0.008 * Math.sin(t * 1.5);
  p.rootY += 0.004 * Math.sin(t * 3.0);
  p.hLy += 0.006 * Math.sin(t * 3.0);
  p.hRy += 0.006 * Math.sin(t * 3.0 + 0.4);
  p.headYaw = 0.03 * Math.sin(t * 0.45);
  return p;
}

/** Walk (run=0) → sprint (run=1): elliptical foot paths, counter-swing arms. */
export function gaitPose(phase, run) {
  const L = THREE.MathUtils.lerp;
  const stride = L(0.34, 0.52, run);
  const lift = L(0.12, 0.26, run);
  const armSwing = L(0.18, 0.28, run);
  const p = makePose();

  const foot = (ph) => ({
    z: -stride * Math.cos(ph),
    y: PROP.ankleH + lift * Math.pow(Math.max(0, Math.sin(ph)), 0.8),
    xOut: 0.02 * Math.max(0, Math.sin(ph)),
  });
  const fl = foot(phase);
  const fr = foot(phase + Math.PI);
  p.fLx = 0.15 + fl.xOut; p.fLy = fl.y; p.fLz = fl.z;
  p.fRx = -0.15 - fr.xOut; p.fRy = fr.y; p.fRz = fr.z;
  p.toeL = 0.28 + 0.45 * Math.pow(Math.max(0, Math.sin(phase - 0.6)), 2) * run;
  p.toeR = 0.28 + 0.45 * Math.pow(Math.max(0, Math.sin(phase + Math.PI - 0.6)), 2) * run;

  const bob = L(0.02, 0.045, run);
  p.rootY = L(0.92, 0.82, run) + bob * Math.sin(2 * phase + 0.8) - bob * 0.3
    + run * 0.045 * Math.pow(Math.max(0, Math.sin(2 * phase + 2.2)), 2);
  p.lean = L(0.08, 0.26, run) + 0.03 * Math.sin(2 * phase);
  p.pelvisRoll = 0.05 * Math.sin(phase) * (1 - run * 0.5);
  p.pelvisYaw = 0.08 * Math.sin(phase);
  p.spineYaw = -0.10 * Math.sin(phase);
  p.headPitch = 0.08;
  p.headYaw = 0;

  const handY = L(0.95, 1.00, run) + 0.02 * Math.sin(2 * phase);
  p.hLx = 0.17; p.hLy = handY; p.hLz = armSwing * Math.cos(phase) + 0.03;
  p.hRx = -0.17; p.hRy = handY; p.hRz = -armSwing * Math.cos(phase) + 0.03;
  return p;
}

/** Airborne: k=+1 rising (split), k=-1 falling (braced to land). */
export function airPose(k) {
  const rise = makePose({
    rootY: 0.94, lean: 0.14, headPitch: -0.02, headYaw: 0,
    hLx: 0.34, hLy: 1.52, hLz: 0.08, hRx: -0.34, hRy: 1.52, hRz: 0.08,
    fLx: 0.14, fLy: 0.55, fLz: 0.34, fRx: -0.14, fRy: 0.50, fRz: -0.32,
    toeL: 0.55, toeR: 0.55,
  });
  const fall = makePose({
    rootY: 0.92, lean: 0.22, headPitch: 0.14, headYaw: 0,
    hLx: 0.38, hLy: 1.06, hLz: 0.12, hRx: -0.38, hRy: 1.06, hRz: 0.12,
    fLx: 0.15, fLy: 0.32, fLz: 0.08, fRx: -0.15, fRy: 0.35, fRz: -0.05,
    toeL: 0.4, toeR: 0.4,
  });
  return lerpPose(fall, rise, THREE.MathUtils.clamp((k + 1) / 2, 0, 1));
}

/** Deep crouch / squat, the landing absorb. */
export function crouchPose() {
  return makePose({
    rootY: 0.62, lean: 0.36, headYaw: 0,
    hLx: 0.22, hLy: 0.82, hLz: 0.24, hRx: -0.22, hRy: 0.82, hRz: 0.24,
    fLx: 0.17, fLz: 0.12, fRx: -0.17, fRz: -0.10,
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
      { d: 0.18, ease: 'out', p: { hRx: -0.20, hRy: 1.14, hRz: -0.17, hLx: 0.20, hLy: 1.06, hLz: 0.18, spineYaw: -0.35, lean: 0.05, rootY: 0.96, headYaw: 0 } },
      { d: 0.09, ease: 'out', p: { hRx: -0.07, hRy: 1.24, hRz: 0.44, hLx: 0.18, hLy: 1.00, hLz: 0.02, spineYaw: 0.32, pelvisYaw: 0.16, lean: 0.32, rootY: 0.94 } },
      { d: 0.14, ease: 'linear', p: {} },
      { d: 0.32, ease: 'inout', p: { ...BASE } },
    ],
  },
  prisma: {
    label: 'Prisma', color: '#57e6ff', fx: 'ring', fxAt: 0.30, glow: 'both',
    keys: [
      { d: 0.30, ease: 'out', p: { hLx: 0.44, hLy: 1.48, hLz: 0.05, hRx: -0.44, hRy: 1.48, hRz: 0.05, lean: -0.06, rootY: 1.00, headPitch: -0.10, headYaw: 0, spineYaw: 0 } },
      { d: 0.38, ease: 'linear', p: { hLy: 1.51, hRy: 1.51 } },
      { d: 0.35, ease: 'inout', p: { ...BASE } },
    ],
  },
  nova: {
    label: 'Nova', color: '#b78cff', fx: 'shell', fxAt: 0.45, glow: 'both',
    keys: [
      { d: 0.35, ease: 'inout', p: { hLx: 0.24, hLy: 0.92, hLz: -0.06, hRx: -0.24, hRy: 0.92, hRz: -0.06, rootY: 0.72, lean: 0.22, spineYaw: 0, headYaw: 0 } },
      { d: 0.10, ease: 'out', p: { hLx: 0.09, hLy: 1.20, hLz: 0.42, hRx: -0.09, hRy: 1.20, hRz: 0.42, lean: 0.38, rootY: 0.92 } },
      { d: 0.16, ease: 'linear', p: {} },
      { d: 0.35, ease: 'inout', p: { ...BASE } },
    ],
  },
  fall: {
    label: 'FALL', color: '#a64dff', fx: 'shockwave', fxAt: 0.41, glow: 'both',
    keys: [
      { d: 0.30, ease: 'out', p: { hLx: 0.20, hLy: 1.70, hLz: 0.12, hRx: -0.20, hRy: 1.70, hRz: 0.12, rootY: 0.99, fLx: 0.16, fRx: -0.16, lean: -0.08, headPitch: -0.08, headYaw: 0, spineYaw: 0 } },
      { d: 0.11, ease: 'in', p: { hLx: 0.16, hLy: 0.21, hLz: 0.36, hRx: -0.16, hRy: 0.21, hRz: 0.36, rootY: 0.47, lean: 1.00, headPitch: 0.30, fLx: 0.22, fLz: -0.04, fRx: -0.22, fRz: -0.04 } },
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
