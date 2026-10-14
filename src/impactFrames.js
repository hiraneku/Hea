import * as THREE from 'three';

// ============================================================================
// Anime-style Impact Frames — screen-space post-processing pass.
// Renders the 3D scene into a render target, then draws a fullscreen shader
// quad that can briefly replace the image with high-contrast, hand-drawn
// inspired compositions: jagged radial speed-lines, hard monochrome
// silhouettes and black/white inversion. No gameplay systems are touched;
// this module only changes how the already-rendered frame is presented.
//
// Public interface (also exposed on window by main.js for testing):
//   triggerImpactFrame({
//     intensity,   // 0..1 (default .7) — density, radius & contrast
//     position,    // THREE.Vector3 (world) or {x,y} in 0..1 screen UV
//     direction,   // THREE.Vector3 (world dir) or radians — biases the burst
//     style,       // 'radial' | 'invert' | 'silhouette' | 'alternating'
//     duration,    // frames (preferred) — or use durationMs
//     durationMs,  // alternative duration in milliseconds (~16.7ms/frame)
//   })
// ============================================================================

export const IMPACT_PRESETS = {
  subtle: { intensity: 0.35, style: 'radial', duration: 2 },
  strong: { intensity: 0.75, style: 'silhouette', duration: 3 },
  cinematic: { intensity: 1.0, style: 'alternating', duration: 6 },
};

const STYLE_IDS = { radial: 1, invert: 2, silhouette: 3, alternating: 4 };

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D tDiffuse;
  uniform int uMode;        // 0 off, 1 radial, 2 invert, 3 silhouette, 4 alternating
  uniform float uIntensity; // 0..1
  uniform float uProgress;  // 0..1 across the effect
  uniform vec2 uCenter;     // impact point in UV
  uniform float uAngle;     // preferred burst direction (radians, UV space)
  uniform float uSeed;
  uniform float uAspect;

  float hash(float n) { return fract(sin(n * 127.1 + uSeed * 311.7) * 43758.5453); }

  float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

  // Hard two/three-tone monochrome of the scene: the "silhouette" look.
  vec3 monoHard(vec3 c, float jag) {
    float l = lum(c) + jag;
    float v = l > 0.62 ? 1.0 : (l > 0.34 ? 0.55 : 0.0);
    return vec3(v);
  }

  void main() {
    vec4 base = texture2D(tDiffuse, vUv);
    if (uMode == 0 || uIntensity <= 0.001) {
      gl_FragColor = base;
      #include <colorspace_fragment>
      return;
    }

    vec2 p = vUv - uCenter;
    p.x *= uAspect;
    float r = length(p);
    float ang = atan(p.y, p.x);

    int mode = uMode;
    float localProgress = uProgress;
    if (mode == 4) { // alternating: black burst -> inversion -> white burst
      float phase = floor(uProgress * 3.0);
      mode = phase < 0.5 ? 5 : (phase < 1.5 ? 2 : 6);
      localProgress = fract(uProgress * 3.0);
    }
    float fade = 1.0 - localProgress; // effect is strongest on its first frame

    vec3 col = base.rgb;

    if (mode == 2) {
      // --- B/W inversion: inverted, hard-posterised monochrome ---
      float jag = (hash(floor(vUv.y * 90.0)) - 0.5) * 0.06;
      vec3 inv = monoHard(vec3(1.0) - base.rgb, jag);
      col = mix(col, inv, clamp(0.35 + uIntensity * 0.65, 0.0, 1.0));
    } else if (mode == 3) {
      // --- High-contrast silhouette: scene crushed to black/white ---
      vec2 dirv = vec2(cos(uAngle), sin(uAngle));
      float bands = hash(floor(dot(vUv, dirv) * 26.0)) - 0.5;
      float jag = bands * 0.22 + (hash(floor(ang * 9.0)) - 0.5) * 0.08;
      vec3 sil = monoHard(base.rgb, jag * uIntensity);
      col = mix(col, sil, clamp(0.45 + uIntensity * 0.55, 0.0, 1.0));
    }

    // Alternating extremes: crush the frame to near-black / near-white first,
    // then let the burst carve through it (like the reference's cut frames).
    if (mode == 5) col = vec3(0.02);
    if (mode == 6) col = vec3(0.98);

    if (mode == 1 || mode == 3 || mode == 5 || mode == 6) {
      // --- Radial burst: clustered speed-lines, giant jagged shards, huge core ---
      // (Skala mengikuti video referensi: bentuk menutupi 30-60% layar.)
      float lines = mode == 1 ? 56.0 : 36.0;
      float seg = floor((ang + 3.14159265) / 6.2831853 * lines);
      float segHash = hash(seg * 3.7);
      float dirBoost = 1.0 + 0.8 * max(0.0, cos(ang - uAngle));
      float lineLen = (0.35 + segHash * 1.5) * (0.4 + uIntensity * 1.1) * dirBoost;
      float angFrac = fract((ang + 3.14159265) / 6.2831853 * lines);
      float lineWidth = 0.16 + 0.22 * hash(seg * 9.1);
      float lineMask = step(abs(angFrac - 0.5), lineWidth)
        * step(0.04 + 0.08 * hash(seg * 5.3), r)
        * step(r, lineLen)
        * step(segHash, 0.2 + uIntensity * 0.8); // density follows intensity
      vec3 lineCol = segHash > 0.4 ? vec3(1.0) : vec3(0.0);
      if (mode == 5) lineCol = vec3(1.0);       // alternating p1: white on black
      if (mode == 6) lineCol = vec3(0.0);       // alternating p3: black on white
      col = mix(col, lineCol, lineMask * clamp(0.6 + 0.4 * fade + uIntensity * 0.35, 0.0, 1.0));

      // Giant jagged shards: segitiga-cakar lebar yang meledak dari titik tumbuk.
      float shardCount = 9.0;
      float shardSeg = floor((ang + 3.14159265) / 6.2831853 * shardCount);
      float shardHash = hash(shardSeg * 13.7);
      float shardFrac = fract((ang + 3.14159265) / 6.2831853 * shardCount);
      float shardLen = (0.45 + shardHash * 1.15) * (0.35 + uIntensity * 0.95) * dirBoost;
      float shardWidth = 0.16 + shardHash * 0.42;
      float shardMask = step(shardFrac, shardWidth)
        * step(0.03, r) * step(r, shardLen)
        * step(shardHash, 0.15 + uIntensity * 0.85)
        * step(0.35, uIntensity + (mode == 3 || mode == 5 || mode == 6 ? 0.35 : 0.0));
      vec3 shardCol = mode == 6 ? vec3(0.0) : vec3(1.0);
      if (mode == 3 && shardHash > 0.62) shardCol = vec3(0.0);
      col = mix(col, shardCol, shardMask * 0.96);

      // Jagged star core around the impact point (irregular, never a circle).
      float starSeg = floor((ang + 3.14159265) / 6.2831853 * 14.0);
      float starR = (0.10 + hash(starSeg * 7.3) * 0.30) * (0.55 + uIntensity * 0.95) * (0.65 + 0.35 * fade);
      float starMask = step(r, starR);
      vec3 starCol = mode == 6 ? vec3(0.0) : vec3(1.0);
      if (mode == 3 && hash(starSeg * 3.1) > 0.5) starCol = vec3(0.0);
      col = mix(col, starCol, starMask * 0.95);
    }

    gl_FragColor = vec4(col, base.a);
    #include <colorspace_fragment>
  }
`;

/**
 * Create the impact-frame post-processing system.
 * @param {THREE.WebGLRenderer} renderer
 */
export function createImpactFrameSystem(renderer) {
  const settings = {
    enabled: true,       // master switch
    reducedFlash: false, // accessibility: caps intensity, disables alternating
    intensityScale: 1,   // global multiplier 0..1
  };

  const size = new THREE.Vector2();
  renderer.getSize(size);
  const pixelRatio = renderer.getPixelRatio();
  const renderTarget = new THREE.WebGLRenderTarget(size.x * pixelRatio, size.y * pixelRatio, {
    samples: renderer.capabilities.isWebGL2 && !navigator.maxTouchPoints ? 4 : 0,
    depthBuffer: true,
  });

  const uniforms = {
    tDiffuse: { value: renderTarget.texture },
    uMode: { value: 0 },
    uIntensity: { value: 0 },
    uProgress: { value: 0 },
    uCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uAngle: { value: 0 },
    uSeed: { value: 0 },
    uAspect: { value: size.x / Math.max(1, size.y) },
  };
  const quadMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
  const quadScene = new THREE.Scene();
  const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), quadMaterial));

  // Reused temporaries — no per-frame allocations in the render path.
  const tmpV = new THREE.Vector3();
  const tmpV2 = new THREE.Vector3();

  let active = null; // { mode, totalFrames, elapsed, intensity }
  let lastCamera = null;

  function resolveCenter(position, camera) {
    if (!position) return { x: 0.5, y: 0.5 };
    if (position.isVector3 && camera) {
      tmpV.copy(position).project(camera);
      if (tmpV.z > 1) return { x: 0.5, y: 0.5 };
      return { x: tmpV.x * 0.5 + 0.5, y: tmpV.y * 0.5 + 0.5 };
    }
    if (typeof position.x === 'number' && typeof position.y === 'number') {
      return { x: THREE.MathUtils.clamp(position.x, 0, 1), y: THREE.MathUtils.clamp(position.y, 0, 1) };
    }
    return { x: 0.5, y: 0.5 };
  }

  function resolveAngle(direction, position, camera) {
    if (typeof direction === 'number') return direction;
    if (direction?.isVector3 && position?.isVector3 && camera) {
      tmpV.copy(position).project(camera);
      tmpV2.copy(position).add(direction).project(camera);
      return Math.atan2(tmpV2.y - tmpV.y, tmpV2.x - tmpV.x);
    }
    return -Math.PI / 2;
  }

  /**
   * Trigger one impact frame. Overlapping triggers restart cleanly with the
   * newest parameters, so the screen can never get stuck inverted.
   */
  function trigger(options = {}, camera = lastCamera) {
    if (!settings.enabled) return false;
    let intensity = THREE.MathUtils.clamp((options.intensity ?? 0.7) * settings.intensityScale, 0, 1);
    let style = options.style || 'radial';
    if (settings.reducedFlash) {
      intensity = Math.min(intensity, 0.4);
      if (style === 'alternating' || style === 'invert') style = 'radial';
    }
    if (!STYLE_IDS[style]) style = 'radial';

    let totalFrames;
    if (Number.isFinite(options.duration)) totalFrames = Math.round(options.duration);
    else if (Number.isFinite(options.durationMs)) totalFrames = Math.round(options.durationMs / 16.7);
    else totalFrames = style === 'alternating' ? 6 : intensity > 0.8 ? 3 : 2;
    totalFrames = THREE.MathUtils.clamp(totalFrames, 1, 12);

    const center = resolveCenter(options.position, camera);
    uniforms.uCenter.value.set(center.x, center.y);
    uniforms.uAngle.value = resolveAngle(options.direction, options.position, camera);
    uniforms.uSeed.value = Math.random() * 100;
    uniforms.uIntensity.value = intensity;
    uniforms.uProgress.value = 0;
    uniforms.uMode.value = STYLE_IDS[style];
    active = { totalFrames, elapsed: 0, intensity };
    return true;
  }

  function setSize(width, height, pr = renderer.getPixelRatio()) {
    if (!width || !height) return;
    renderTarget.setSize(Math.round(width * pr), Math.round(height * pr));
    uniforms.uAspect.value = width / height;
  }

  /** Render the game scene through the impact-frame pass. */
  function render(scene, camera) {
    lastCamera = camera;
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    if (active) {
      active.elapsed += 1;
      uniforms.uProgress.value = active.elapsed / active.totalFrames;
      if (active.elapsed >= active.totalFrames) {
        active = null;
        uniforms.uMode.value = 0; // guaranteed clean restoration
        uniforms.uIntensity.value = 0;
      }
    }
    renderer.render(quadScene, quadCamera);
  }

  return { trigger, render, setSize, settings, presets: IMPACT_PRESETS };
}
