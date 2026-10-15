import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

/**
 * The impact frame: for a quarter of a second the whole picture is redrawn as two-tone ink
 * on paper, the way the reference cuts to a graphic frame on a heavy hit. It runs in real time
 * (so it plays through the hit-pause), centred on the point of contact:
 *
 *   A   (1 frame)   white paper, the scene as black silhouettes with hatched edges and a
 *                   burst of thin black spokes from the contact point;
 *   B   (3 frames)  the negative: black paper, white silhouettes, and white tapered wedge
 *                   speed lines racing out from the contact point;
 *   A'  (3 frames)  white paper with black hatched silhouettes again;
 *   then a short crossfade back to the live picture.
 *
 * Saturated emissive elements (glyphs, bolts, the red avatar) keep their colour throughout,
 * so the frame reads as a stylised cut, not a monochrome filter. With reduced effects on,
 * only the paper frame plays, without the inversion.
 */
const ImpactShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uPhase: { value: 0 },
    uMix: { value: 0 },
    uSeed: { value: 0 },
    uSpokes: { value: 1 },
  },
  vertexShader: `varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `uniform sampler2D tDiffuse;
    uniform vec2 uCenter;
    uniform vec2 uResolution;
    uniform float uPhase;
    uniform float uMix;
    uniform float uSeed;
    uniform float uSpokes;
    varying vec2 vUv;
    float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
    float sampleLuma(vec2 uv) { return luma(texture2D(tDiffuse, uv).rgb); }
    float hash(float n) { return fract(sin(n * 91.17 + uSeed * 7.0) * 43758.5453); }
    void main() {
      vec4 src = texture2D(tDiffuse, vUv);
      vec3 colour = src.rgb;
      float l = luma(colour);
      // Luminance edges (Sobel) become ink outlines, hatched in screen space.
      vec2 px = 1.0 / uResolution;
      float tl = sampleLuma(vUv + px * vec2(-1.0, 1.0)), t = sampleLuma(vUv + px * vec2(0.0, 1.0)),
        tr = sampleLuma(vUv + px * vec2(1.0, 1.0)), l0 = sampleLuma(vUv + px * vec2(-1.0, 0.0)),
        r0 = sampleLuma(vUv + px * vec2(1.0, 0.0)), bl = sampleLuma(vUv + px * vec2(-1.0, -1.0)),
        b = sampleLuma(vUv + px * vec2(0.0, -1.0)), br = sampleLuma(vUv + px * vec2(1.0, -1.0));
      float gx = (tr + 2.0 * r0 + br) - (tl + 2.0 * l0 + bl);
      float gy = (tl + 2.0 * t + tr) - (bl + 2.0 * b + br);
      float edge = smoothstep(0.08, 0.3, length(vec2(gx, gy)));
      float aspect = uResolution.x / uResolution.y;
      vec2 screen = vec2(vUv.x * aspect, vUv.y);
      float lines = step(0.55, fract((screen.x - screen.y) * 120.0));
      float hatch = edge * lines;
      // Silhouettes: everything darker than the paper, with a soft edge at the threshold.
      float ink = smoothstep(0.56, 0.47, l);
      float tone = max(ink, hatch);
      // Spokes from the contact point: thin black lines on the paper frame, white tapered
      // wedges (narrow at the centre, wider outwards, random length) on the negative.
      vec2 d = vec2((vUv.x - uCenter.x) * aspect, vUv.y - uCenter.y);
      float r = length(d), ang = atan(d.y, d.x);
      float spokes = uPhase == 1.0 ? 96.0 : 72.0;
      float a = (ang / 6.2831853 + 0.5) * spokes;
      float i = floor(a), f = fract(a) - 0.5;
      float h1 = hash(i), h2 = hash(i + 11.0), h3 = hash(i + 29.0);
      float present = step(uPhase == 1.0 ? 0.4 : 0.55, h1);
      float start = 0.07 + h2 * 0.2, len = 0.2 + h3 * 0.9;
      float along = clamp((r - start) / len, 0.0, 1.0);
      float halfWidth = uPhase == 1.0 ? (0.003 + 0.014 * h2) * along + 0.0008 : 0.0017;
      float cells = halfWidth / max(r * 6.2831853 / spokes, 1e-4);
      float wedge = present * step(start, r) * step(r, start + len) * uSpokes
        * (1.0 - smoothstep(cells * 0.6, cells * 1.4, abs(f)));
      // Paper and ink swap on the negative frame.
      vec3 paper = uPhase == 1.0 ? vec3(0.02) : vec3(1.0);
      vec3 inkColour = uPhase == 1.0 ? vec3(0.98) : vec3(0.03);
      vec3 graphic = mix(paper, inkColour, max(tone, wedge));
      // Saturated emissive colour survives the cut (glyphs, bolts, the avatar).
      float mx = max(colour.r, max(colour.g, colour.b)), mn = min(colour.r, min(colour.g, colour.b));
      float sat = mx > 1e-4 ? (mx - mn) / mx : 0.0;
      float keep = smoothstep(0.45, 0.66, sat) * step(0.22, mx);
      vec3 cut = mix(graphic, colour, keep);
      gl_FragColor = vec4(mix(colour, cut, uMix), src.a);
    }`,
};

export type ImpactPhase = 'paper' | 'negative' | 'paper-again' | 'fade';

export class ImpactFrame {
  readonly pass = new ShaderPass(ImpactShader);
  private time = -1;
  private readonly center = new THREE.Vector3();
  private reduced = false;
  private readonly projected = new THREE.Vector3();
  constructor() {
    this.pass.enabled = false;
  }
  get active() {
    return this.time >= 0;
  }
  /** Which beat is playing, for diagnostics. */
  get phase(): ImpactPhase | null {
    if (!this.active) return null;
    const t = this.time;
    if (this.reduced) return t < 0.16 ? 'paper-again' : 'fade';
    if (t < 0.033) return 'paper';
    if (t < 0.133) return 'negative';
    if (t < 0.233) return 'paper-again';
    return 'fade';
  }
  get elapsed() {
    return this.time;
  }
  /** Start (or restart) the frame around a world-space point of contact. */
  trigger(at: THREE.Vector3, reduced: boolean) {
    this.time = 0;
    this.reduced = reduced;
    this.center.copy(at);
    this.pass.uniforms.uSeed.value = Math.random() * 10;
    this.pass.enabled = true;
  }
  cancel() {
    this.time = -1;
    this.pass.enabled = false;
  }
  /** Advance in real seconds (independent of hit-pause and slow motion). */
  update(realDt: number) {
    if (!this.active) return;
    this.time += realDt;
    const t = this.time,
      u = this.pass.uniforms;
    let mix = 1,
      phase = 2,
      end;
    if (this.reduced) {
      end = 0.24;
      if (t > 0.16) mix = 1 - (t - 0.16) / 0.08;
    } else {
      end = 0.3;
      if (t < 0.033) phase = 0;
      else if (t < 0.133) phase = 1;
      else if (t > 0.233) mix = 1 - (t - 0.233) / 0.067;
    }
    if (t >= end) {
      this.cancel();
      return;
    }
    u.uPhase.value = phase;
    u.uMix.value = Math.max(0, Math.min(1, mix));
    // Spokes only on the first paper frame and the negative; the last paper frame is calm.
    u.uSpokes.value = !this.reduced && t < 0.133 ? 1 : 0;
  }
  /** Project the contact point with the final camera of the frame, just before rendering. */
  prepare(camera: THREE.Camera, width: number, height: number) {
    if (!this.active) return;
    const p = this.projected.copy(this.center).project(camera);
    const behind = p.z > 1;
    const x = behind ? 0.5 : (p.x + 1) / 2,
      y = behind ? 0.5 : (p.y + 1) / 2;
    this.pass.uniforms.uCenter.value.set(
      Math.max(-0.3, Math.min(1.3, x)),
      Math.max(-0.3, Math.min(1.3, y)),
    );
    this.pass.uniforms.uResolution.value.set(width, height);
  }
  dispose() {
    this.pass.dispose();
  }
}
