/**
 * The arena's surfaces: procedural albedo, roughness and normal maps built from the tileable
 * fields in `pattern.ts`, plus the triplanar material that keeps every monolith's texel density
 * the same however tall or wide it is — the city is drawn as three instanced batches sharing one
 * unit box, so per-mesh UVs are not available and world-space sampling is the honest answer.
 *
 * Nothing is fetched: a few hundred kilobytes of canvas is generated at boot, and every texture
 * is deterministic (seeded), so a screenshot taken today matches one taken next week.
 */
import * as THREE from 'three';
import { fractalNoise, gridLines, normalFromHeight, stack } from './pattern';

type Canvas = HTMLCanvasElement;

function canvas(size: number): { canvas: Canvas; ctx: CanvasRenderingContext2D } {
  const element = document.createElement('canvas');
  element.width = element.height = size;
  return { canvas: element, ctx: element.getContext('2d')! };
}

/** Paint an RGB byte map from a per-texel colour function. */
function paint(size: number, shade: (x: number, y: number) => [number, number, number]) {
  const { canvas: element, ctx } = canvas(size);
  const image = ctx.createImageData(size, size),
    data = image.data;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const [r, g, b] = shade(x, y),
        i = (y * size + x) * 4;
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
      data[i + 3] = 255;
    }
  ctx.putImageData(image, 0, 0);
  return element;
}

/** Paint the normal map that a height field implies. */
function paintNormals(size: number, height: Float32Array, strength: number) {
  const normals = normalFromHeight(height, size, strength);
  return paint(size, (x, y) => {
    const i = (y * size + x) * 3;
    return [
      (normals[i] * 0.5 + 0.5) * 255,
      (normals[i + 1] * 0.5 + 0.5) * 255,
      (normals[i + 2] * 0.5 + 0.5) * 255,
    ];
  });
}

function texture(element: Canvas, repeat = 1) {
  const result = new THREE.CanvasTexture(element);
  result.wrapS = result.wrapT = THREE.RepeatWrapping;
  result.repeat.set(repeat, repeat);
  result.anisotropy = 4;
  return result;
}

export interface SurfaceSet {
  map: THREE.Texture;
  roughnessMap: THREE.Texture;
  normalMap: THREE.Texture;
  /** Metres covered by one tile of the texture. */
  metres: number;
}

let stone: SurfaceSet | undefined;

/**
 * The plaza floor: poured slabs one metre across, heavier joints every four, mottled stone with
 * damp patches and chips. The one-metre survey grid that has always drawn this arena is kept —
 * it is the only thing giving the ground scale — but it now sits in a real surface.
 */
export function stoneSurface(): SurfaceSet {
  if (stone) return stone;
  const size = 512;
  // One tile is eight metres across eight slabs: a slab per square metre, a heavy joint every
  // four, which is the survey grid this plaza has always been read by.
  const metres = 8,
    texel = metres / size,
    slabs = 8;
  const chips = fractalNoise(size, { cells: 20, seed: 771, octaves: 3, gain: 0.55 }),
    mottle = fractalNoise(size, { cells: 4, seed: 913, octaves: 4, gain: 0.5 }),
    damp = fractalNoise(size, { cells: 3, seed: 401, octaves: 3, gain: 0.6 }),
    joints = gridLines(size, 2, 1, 5),
    grain = gridLines(size, slabs, 0.5, 2),
    crack = fractalNoise(size, { cells: 11, seed: 233, octaves: 2, gain: 0.5, smooth: false });

  // Heights in metres: a joint is a centimetre deep, weathering a few millimetres.
  const height = stack(size, [
    { field: joints, amplitude: -0.014 },
    { field: grain, amplitude: -0.007 },
    { field: chips, amplitude: 0.0035 },
    { field: crack, amplitude: 0.002 },
  ]);

  const albedo = paint(size, (x, y) => {
    const i = y * size + x,
      // The slab itself: pale weathered stone, mottled and chipped.
      base = 172 + mottle[i] * 26 + chips[i] * 13 + crack[i] * 6,
      // Damp patches read darker and cooler; they follow their own slow noise.
      wet = Math.max(0, damp[i] - 0.35) * 0.9,
      value = base - wet * 20 - joints[i] * 30 - grain[i] * 16;
    return [value * (1 - wet * 0.1), value * (1 - wet * 0.02), value * (1 + wet * 0.07)];
  });

  const roughness = paint(size, (x, y) => {
    const i = y * size + x,
      value = 230 + chips[i] * 22 + joints[i] * 18 + Math.max(0, damp[i]) * 10;
    return [value, value, value];
  });

  stone = {
    map: texture(albedo),
    roughnessMap: texture(roughness),
    normalMap: texture(paintNormals(size, height, texel)),
    metres,
  };
  stone.map.colorSpace = THREE.SRGBColorSpace;
  return stone;
}

let concrete: SurfaceSet | undefined;

/**
 * The monoliths: board-formed concrete, forty centimetre boards running horizontally, form-tie
 * marks, streaked weathering and a chalky surface that varies in roughness so the sun glances off
 * it unevenly. Sampled in world space by the material below, so a 6 m wall and a 44 m tower show
 * the same grain.
 */
export function concreteSurface(): SurfaceSet {
  if (concrete) return concrete;
  const size = 512;
  // One tile is four metres: ten boards of forty centimetres across it.
  const metres = 4,
    texel = metres / size,
    boards = 10;
  const joints = gridLines(size, boards, 1, 2),
    boardNoise = fractalNoise(size, { cells: 24, seed: 61, octaves: 3, gain: 0.5, smooth: false }),
    mottle = fractalNoise(size, { cells: 3, seed: 158, octaves: 4, gain: 0.52 }),
    streak = fractalNoise(size, { cells: 2, seed: 977, octaves: 4, gain: 0.62 }),
    pits = fractalNoise(size, { cells: 40, seed: 449, octaves: 2, gain: 0.5 });

  const height = stack(size, [
    { field: joints, amplitude: -0.011 },
    { field: pits, amplitude: 0.0016 },
    { field: boardNoise, amplitude: 0.0012 },
  ]);

  // A near-white detail map: the tone comes from the material's colour, and this only weathers
  // it — cast lines between the boards, form-tie stains, and dirt running down the face.
  const albedo = paint(size, (x, y) => {
    const i = y * size + x,
      // Weathering runs down the face: the streak noise is stretched along the columns.
      column = streak[(y % size) * size + ((x * 9) % size)],
      dirt = Math.max(0, column - 0.26) * 0.8,
      value = 247 + mottle[i] * 15 + pits[i] * 6 - joints[i] * 34 - dirt * 30,
      cool = 1 - dirt * 0.06;
    return [value * cool * 1.01, value * cool * 0.995, value * (1 + dirt * 0.03)];
  });

  // Also a near-white multiplier: the tone materials carry their own roughness.
  const roughness = paint(size, (x, y) => {
    const i = y * size + x,
      value = 247 + mottle[i] * 12 + joints[i] * 10 - Math.max(0, streak[i]) * 10;
    return [value, value, value];
  });

  concrete = {
    map: texture(albedo),
    roughnessMap: texture(roughness),
    normalMap: texture(paintNormals(size, height, texel)),
    metres,
  };
  concrete.map.colorSpace = THREE.SRGBColorSpace;
  return concrete;
}

export interface TriplanarOptions {
  surface: SurfaceSet;
  color: THREE.ColorRepresentation;
  /** Metres of texture per world unit, on top of the surface's own tile size. */
  scale?: number;
  roughness?: number;
  metalness?: number;
  /** How dark the wall gets at the ground, 0 for none. */
  grime?: number;
  /** The height the grime fades out by, metres. */
  grimeHeight?: number;
}

/**
 * The three projections of a world position, in texels. Shared by the samples below: a fragment on
 * a wall leans on one axis, a fragment in a corner on two, and the weights say how much of each.
 */
const TRI_WEIGHTS = `vec3 triWeights(vec3 n) {
  vec3 w = abs(normalize(n));
  w = pow(w, vec3(4.0));
  return w / max(1e-4, w.x + w.y + w.z);
}`;

/**
 * A world-space triplanar standard material. The city is instanced from one unit box, so its UVs
 * are per-face 0-1 and a texture would stretch with the building; sampling the generated surface
 * from the world position instead keeps the grain the same on every block, whatever its size.
 *
 * Each chunk samples where three has declared its texture uniforms — `map` and `roughnessMap`
 * appear in the fragment prefix, `normalMap`/`normalScale` only in `normal_pars_fragment` — so the
 * functions above carry no texture references of their own.
 */
export function triplanarMaterial(options: TriplanarOptions): THREE.MeshStandardMaterial {
  const { surface, color, scale = 1, roughness = 0.92, metalness = 0.02 } = options;
  const material = new THREE.MeshStandardMaterial({
    color,
    map: surface.map,
    roughnessMap: surface.roughnessMap,
    normalMap: surface.normalMap,
    roughness,
    metalness,
  });
  const tile = 1 / (surface.metres / scale);
  material.onBeforeCompile = (shader) => {
    shader.uniforms.triTile = { value: tile };
    shader.uniforms.triGrime = { value: options.grime ?? 0.55 };
    shader.uniforms.triGrimeHeight = { value: options.grimeHeight ?? 3.2 };
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vTriPos;
varying vec3 vTriNormal;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vTriPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
vTriNormal = normal;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vTriPos;
varying vec3 vTriNormal;
uniform float triTile;
uniform float triGrime;
uniform float triGrimeHeight;
${TRI_WEIGHTS}`,
      )
      .replace(
        '#include <map_fragment>',
        `vec3 triW = triWeights(vTriNormal);
vec3 triP = vTriPos * triTile;
#ifdef USE_MAP
  {
    vec4 triX = texture2D(map, triP.zy);
    vec4 triY = texture2D(map, triP.xz);
    vec4 triZ = texture2D(map, triP.xy);
    diffuseColor *= triX * triW.x + triY * triW.y + triZ * triW.z;
  }
#endif
// Weathering climbs the wall: the bottom of every block is dirtier, which is what tells the eye
// where the wall meets the ground without paying for a single extra polygon.
diffuseColor.rgb *= 1.0 - triGrime * (1.0 - smoothstep(0.0, triGrimeHeight, vTriPos.y));`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
  roughnessFactor *=
    (texture2D(roughnessMap, triP.zy) * triW.x +
     texture2D(roughnessMap, triP.xz) * triW.y +
     texture2D(roughnessMap, triP.xy) * triW.z).g;
#endif`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#ifdef USE_NORMALMAP
  {
    // Every monolith is an axis-aligned box, so the dominant axis is exact: read the map in that
    // face's plane and carry its own tangent frame back into object space.
    vec2 triUv;
    vec3 triT;
    vec3 triB;
    vec3 triN;
    if (triW.x >= triW.y && triW.x >= triW.z) {
      float s = vTriNormal.x < 0.0 ? -1.0 : 1.0;
      triUv = triP.zy;
      triT = vec3(0.0, 0.0, s);
      triB = vec3(0.0, 1.0, 0.0);
      triN = vec3(s, 0.0, 0.0);
    } else if (triW.y >= triW.z) {
      float s = vTriNormal.y < 0.0 ? -1.0 : 1.0;
      triUv = triP.xz;
      triT = vec3(s, 0.0, 0.0);
      triB = vec3(0.0, 0.0, 1.0);
      triN = vec3(0.0, s, 0.0);
    } else {
      float s = vTriNormal.z < 0.0 ? -1.0 : 1.0;
      triUv = triP.xy;
      triT = vec3(1.0, 0.0, 0.0);
      triB = vec3(0.0, s, 0.0);
      triN = vec3(0.0, 0.0, s);
    }
    vec3 triSampled = texture2D(normalMap, triUv).xyz * 2.0 - 1.0;
    triSampled.xy *= normalScale;
    normal = normalize(
      (viewMatrix * vec4(triT * triSampled.x + triB * triSampled.y + triN * triSampled.z, 0.0)).xyz
    );
  }
#endif`,
      );
  };
  // Every variant shares one program, so the cache key must not vary with the uniforms.
  material.customProgramCacheKey = () => 'triplanar';
  return material;
}
