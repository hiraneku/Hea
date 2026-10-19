import * as THREE from 'three';
import { FALL } from './combat';
import { clamp, seededRandom } from './math';

export type FallPhase = 'idle' | 'build' | 'slam' | 'press';

interface Ring {
  mesh: THREE.Mesh;
  age: number;
  life: number;
  speed: number;
  strength: number;
}

/**
 * The visible half of FALL, dressed in layers: a dark void hanging at the top of the
 * column, two flowing energy shafts (a vast outer one and a dense inner one wrapped
 * tight around the boss), hundreds of falling gravity streaks and motes, a pressing
 * cap that rides the boss down, the radial crack that spreads and sinks, impact rings
 * on every landing and crush pulse, and the loose stones the field first crushes flat
 * and then worries at its rim. Nothing shows while the word FALL stands alone — the
 * whole apparatus ignites the moment the boss hits the ground. The game owns timings,
 * energy and damage; this system only dresses them.
 */
export class FallSystem {
  private group = new THREE.Group();
  private lines!: THREE.LineSegments;
  private lineData: { x: number; z: number; y: number; length: number; speed: number }[] = [];
  private motes!: THREE.Points;
  private moteData: { x: number; z: number; y: number; speed: number }[] = [];
  private shaft!: THREE.Mesh;
  private innerShaft!: THREE.Mesh;
  private arcs!: THREE.LineSegments;
  private arcPositions!: Float32Array;
  private arcSegments = 22;
  private arcTimer = 0;
  private dome!: THREE.Mesh;
  private domeT = 1;
  private domePower = 1;
  private voidDisc!: THREE.Group;
  private cap!: THREE.Group;
  private rings: Ring[] = [];
  private crack!: THREE.Mesh;
  private glow!: THREE.Mesh;
  private stones!: THREE.InstancedMesh;
  private stoneData: { x: number; z: number; size: number; seed: number; lift: number }[] = [];
  private light = new THREE.PointLight('#a678ff', 0, 46, 1.8);
  /** The column's centre on the ground (the boss is locked to its x/z once slammed). */
  readonly center = new THREE.Vector3();
  private fade = 0;
  private pulse = 0;
  private stoneLift = 0;
  private dummy = new THREE.Object3D();
  private time = 0;

  constructor(
    scene: THREE.Scene,
    private groundHeight: (x: number, z: number) => number,
    reducedEffects: boolean,
  ) {
    this.buildLines(reducedEffects ? 60 : 130);
    this.buildMotes(reducedEffects ? 70 : 170);
    this.buildCrack();
    this.buildStones(reducedEffects ? 18 : 34);
    // The column is no longer a painted texture: a shader pours streams of violet energy
    // downward, brighter where the surface faces you, banded like falling weather.
    const shaftMaterial = (flow: number, density: number) =>
      new THREE.ShaderMaterial({
        uniforms: {
          uIntensity: { value: 0 },
          uTime: { value: 0 },
          uFlow: { value: flow },
          uDensity: { value: density },
        },
        vertexShader:
          'varying vec2 vUv; varying vec3 vN; varying vec3 vV;' +
          'void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0);' +
          ' vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);' +
          ' gl_Position = projectionMatrix * mv; }',
        fragmentShader:
          'uniform float uIntensity; uniform float uTime; uniform float uFlow; uniform float uDensity;' +
          'varying vec2 vUv; varying vec3 vN; varying vec3 vV;' +
          'void main(){ float facing = abs(dot(normalize(vN), normalize(vV)));' +
          ' float streams = 0.55 + 0.45 * sin(vUv.x * 6.28318 * uDensity + sin(vUv.y * 3.0 + uTime * 0.7) * 1.2);' +
          ' float fallP = fract(vUv.y * 2.0 + uTime * uFlow);' +
          ' float bands = smoothstep(0.0, 0.35, fallP) * smoothstep(1.0, 0.55, fallP);' +
          ' float energy = (0.32 + streams * 0.38 + bands * 0.9) * pow(facing, 1.35);' +
          ' vec3 c = mix(vec3(0.34, 0.16, 0.85), vec3(0.86, 0.72, 1.0), bands) * energy * 1.15;' +
          ' float ends = smoothstep(1.0, 0.72, vUv.y) * smoothstep(0.0, 0.16, vUv.y);' +
          ' gl_FragColor = vec4(c, energy * uIntensity * ends); }',
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
    this.shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(17, 21, 24, 32, 1, true),
      shaftMaterial(0.55, 7),
    );
    this.shaft.position.y = 12;
    this.innerShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(5.6, 6.5, 16, 24, 1, true),
      shaftMaterial(1.15, 11),
    );
    this.innerShaft.position.y = 8;
    // Violet lightning crawls down the column while the weight holds — regenerated in
    // jagged chains a few times a second, never the same shape twice.
    this.arcSegments = reducedEffects ? 10 : 22;
    this.arcPositions = new Float32Array(this.arcSegments * 3 * 2 * 3);
    const arcGeometry = new THREE.BufferGeometry();
    arcGeometry.setAttribute('position', new THREE.BufferAttribute(this.arcPositions, 3));
    this.arcs = new THREE.LineSegments(
      arcGeometry,
      new THREE.LineBasicMaterial({
        color: '#dcc6ff',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.arcs.frustumCulled = false;
    // The impact dome: a hemisphere of compressed gravity that swells at every slam and pulse.
    this.dome = new THREE.Mesh(
      new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.ShaderMaterial({
        uniforms: { uFade: { value: 0 } },
        vertexShader:
          'varying vec3 vN; varying vec3 vV;' +
          'void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0);' +
          ' vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);' +
          ' gl_Position = projectionMatrix * mv; }',
        fragmentShader:
          'uniform float uFade; varying vec3 vN; varying vec3 vV;' +
          'void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.8);' +
          ' vec3 c = vec3(0.62, 0.45, 1.0) * (f * 1.5 + 0.05) + vec3(0.9) * f * f;' +
          ' gl_FragColor = vec4(c, (f * 0.95 + 0.03) * uFade); }',
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    this.dome.visible = false;
    this.dome.position.y = 0.05;
    // The void the weight falls from: a dark disc with a lit rim, hanging over the column.
    this.voidDisc = new THREE.Group();
    const voidCore = new THREE.Mesh(
      new THREE.CircleGeometry(7, 36),
      new THREE.MeshBasicMaterial({ color: '#07040f', transparent: true, opacity: 0 }),
    );
    const voidRim = new THREE.Mesh(
      new THREE.RingGeometry(7, 7.9, 36),
      new THREE.MeshBasicMaterial({
        color: '#c9a6ff',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    voidCore.rotation.x = voidRim.rotation.x = -Math.PI / 2;
    this.voidDisc.add(voidCore, voidRim);
    this.voidDisc.position.y = 19;
    // The cap: a flattened dark mass with a lit rim that rides just over the boss and
    // bears down a little further with every crush pulse — the weight made visible.
    this.cap = new THREE.Group();
    const capMass = new THREE.Mesh(
      new THREE.SphereGeometry(2, 24, 12),
      new THREE.MeshStandardMaterial({
        color: '#17102a',
        roughness: 0.6,
        metalness: 0.2,
        emissive: '#2a1650',
        emissiveIntensity: 0.7,
        transparent: true,
        opacity: 0,
      }),
    );
    capMass.scale.set(1, 0.32, 1);
    const capRim = new THREE.Mesh(
      new THREE.TorusGeometry(2, 0.07, 8, 36),
      new THREE.MeshBasicMaterial({
        color: '#c9a6ff',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    capRim.rotation.x = Math.PI / 2;
    this.cap.add(capMass, capRim);
    this.cap.position.y = 4.6;
    for (let i = 0; i < 3; i++) {
      const mesh = new THREE.Mesh(
        new THREE.RingGeometry(0.92, 1, 48),
        new THREE.MeshBasicMaterial({
          color: '#b78cff',
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.12;
      mesh.visible = false;
      this.rings.push({ mesh, age: 0, life: 0.7, speed: 34, strength: 1 });
      this.group.add(mesh);
    }
    this.group.add(
      this.shaft,
      this.innerShaft,
      this.arcs,
      this.dome,
      this.voidDisc,
      this.cap,
      this.light,
    );
    this.light.position.y = 3;
    this.group.visible = false;
    scene.add(this.group);
  }

  private buildLines(count: number) {
    const random = seededRandom(1379);
    const positions = new Float32Array(count * 6);
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2,
        radius = Math.sqrt(random()) * 19;
      this.lineData.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        y: random() * 15,
        length: 0.8 + random() * 1.6,
        speed: 17 + random() * 14,
      });
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.lines = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({
        color: '#cdb2ff',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.lines.frustumCulled = false;
    this.group.add(this.lines);
  }

  private buildMotes(count: number) {
    const random = seededRandom(9973);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2,
        radius = Math.sqrt(random()) * 18;
      this.moteData.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        y: random() * 14,
        speed: 3 + random() * 6,
      });
      positions.set([this.moteData[i].x, this.moteData[i].y, this.moteData[i].z], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.motes = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: '#d9c6ff',
        size: 0.13,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.motes.frustumCulled = false;
    this.group.add(this.motes);
  }

  private buildCrack() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const random = seededRandom(7331);
    ctx.translate(256, 256);
    // Radial jagged cracks with short branches: drawn dark with a lit core, so the same
    // texture reads as broken stone at rest and as glowing fissures under pressure.
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2 + (random() - 0.5) * 0.3;
      let x = 0,
        y = 0;
      const reach = 120 + random() * 120;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const steps = 7;
      for (let s = 1; s <= steps; s++) {
        const wobble = angle + (random() - 0.5) * 0.35;
        x += Math.cos(wobble) * (reach / steps);
        y += Math.sin(wobble) * (reach / steps);
        ctx.lineTo(x, y);
        if (random() < 0.55) {
          const branch = wobble + (random() < 0.5 ? 0.7 : -0.7);
          ctx.moveTo(x, y);
          ctx.lineTo(
            x + Math.cos(branch) * (14 + random() * 26),
            y + Math.sin(branch) * (14 + random() * 26),
          );
          ctx.moveTo(x, y);
        }
      }
      ctx.strokeStyle = 'rgba(12,7,20,0.92)';
      ctx.lineWidth = 5 + random() * 3;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(190,150,255,0.85)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    this.crack = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    this.crack.rotation.x = -Math.PI / 2;
    this.crack.rotation.z = random() * Math.PI;
    this.crack.renderOrder = 3;
    this.glow = new THREE.Mesh(
      new THREE.CircleGeometry(1, 28),
      new THREE.MeshBasicMaterial({
        color: '#7a3cff',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.glow.rotation.x = -Math.PI / 2;
    this.glow.renderOrder = 2;
    this.group.add(this.crack, this.glow);
  }

  private buildStones(count: number) {
    const random = seededRandom(2917);
    this.stones = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(0.17),
      new THREE.MeshStandardMaterial({ color: '#8d8578', roughness: 0.95, metalness: 0 }),
      count,
    );
    this.stones.frustumCulled = false;
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2,
        radius = 3 + Math.sqrt(random()) * 20;
      this.stoneData.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        size: 0.5 + random() * 1.1,
        seed: random() * Math.PI * 2,
        lift: 0.3 + random() * 0.7,
      });
    }
    this.group.add(this.stones);
  }

  /** The press begins: the column locks onto this ground point. */
  begin(at: THREE.Vector3) {
    this.center.set(at.x, this.groundHeight(at.x, at.z), at.z);
    this.group.position.set(this.center.x, this.center.y, this.center.z);
    this.fade = 0;
    this.pulse = 0;
    this.stoneLift = 0;
    this.crack.position.y = 0.06;
    this.glow.position.y = 0.04;
  }

  /** One crush pulse while held: the crack flares, the cap bears down, a ring goes out. */
  crushPulse() {
    this.pulse = 1;
    this.impactRing(0.55);
  }

  /** An expanding pressure ring from the impact point (the slam lands at full strength). */
  impactRing(strength: number) {
    const ring = this.rings.find((r) => !r.mesh.visible) ?? this.rings[0];
    ring.age = 0;
    ring.life = 0.55 + strength * 0.25;
    ring.speed = 13 + strength * 9;
    ring.strength = strength;
    ring.mesh.visible = true;
    this.domeT = 0;
    this.domePower = strength;
  }

  /** The hold ends: everything settles and fades where it lies. */
  end() {
    this.pulse = 0;
  }

  update(dt: number, phase: FallPhase, pressure: number, follow: THREE.Vector3 | null) {
    this.time += dt;
    if (phase !== 'idle' && follow) {
      // During the build the (still invisible) column rides the boss — locked on, not aimed.
      this.center.set(follow.x, this.groundHeight(follow.x, follow.z), follow.z);
      this.group.position.set(this.center.x, this.center.y, this.center.z);
    }
    // Nothing of the gravity shows while the word FALL stands alone: the whole apparatus
    // ignites when the boss hits the ground, and dies away after the release.
    const target = phase === 'slam' || phase === 'press' ? 1 : 0;
    this.fade = clamp(this.fade + (target > this.fade ? dt * 6 : -dt * 0.7), 0, 1);
    this.group.visible = this.fade > 0.01;
    if (!this.group.visible) return;
    this.pulse = Math.max(0, this.pulse - dt * 3);
    const speedScale = phase === 'slam' ? 7 : 1;
    const lineAttribute = this.lines.geometry.getAttribute('position') as THREE.BufferAttribute;
    const lineArray = lineAttribute.array as Float32Array;
    for (let i = 0; i < this.lineData.length; i++) {
      const line = this.lineData[i];
      line.y -= line.speed * speedScale * dt;
      if (line.y < 0) line.y += 15;
      const o = i * 6;
      lineArray[o] = line.x;
      lineArray[o + 1] = line.y;
      lineArray[o + 2] = line.z;
      lineArray[o + 3] = line.x;
      lineArray[o + 4] = Math.max(0, line.y - line.length * (phase === 'press' ? 1 + pressure : 1));
      lineArray[o + 5] = line.z;
    }
    lineAttribute.needsUpdate = true;
    (this.lines.material as THREE.LineBasicMaterial).opacity = this.fade * (0.55 + pressure * 0.4);
    const moteAttribute = this.motes.geometry.getAttribute('position') as THREE.BufferAttribute;
    const moteArray = moteAttribute.array as Float32Array;
    for (let i = 0; i < this.moteData.length; i++) {
      const mote = this.moteData[i];
      mote.y -= mote.speed * (phase === 'press' ? 1.6 : 3.5) * dt;
      if (mote.y < 0) mote.y += 20;
      moteArray[i * 3 + 1] = mote.y;
    }
    moteAttribute.needsUpdate = true;
    (this.motes.material as THREE.PointsMaterial).opacity = this.fade * (0.35 + pressure * 0.35);
    const shaftUniforms = (this.shaft.material as THREE.ShaderMaterial).uniforms;
    shaftUniforms.uTime.value = this.time;
    shaftUniforms.uIntensity.value = this.fade * (0.1 + pressure * 0.1 + this.pulse * 0.05);
    const innerUniforms = (this.innerShaft.material as THREE.ShaderMaterial).uniforms;
    innerUniforms.uTime.value = this.time;
    innerUniforms.uIntensity.value = this.fade * (0.17 + pressure * 0.19 + this.pulse * 0.09);
    this.light.intensity = this.fade * (40 + pressure * 110 + this.pulse * 40);
    // The void hangs and slowly turns over the column; the cap bears down on the boss.
    this.voidDisc.rotation.y += dt * 0.4;
    const voidCore = this.voidDisc.children[0] as THREE.Mesh;
    (voidCore.material as THREE.MeshBasicMaterial).opacity = this.fade * 0.88;
    const voidRim = this.voidDisc.children[1] as THREE.Mesh;
    (voidRim.material as THREE.MeshBasicMaterial).opacity = this.fade * (0.5 + pressure * 0.4);
    this.cap.position.y = 4.6 - pressure * 0.5 - this.pulse * 0.35;
    const capMass = this.cap.children[0] as THREE.Mesh;
    (capMass.material as THREE.MeshStandardMaterial).opacity = this.fade * 0.94;
    const capRim = this.cap.children[1] as THREE.Mesh;
    (capRim.material as THREE.MeshBasicMaterial).opacity = this.fade * (0.6 + this.pulse * 0.3);
    // Lightning: while the weight presses, chains of violet arcs crawl down around the
    // boss, re-struck several times a second; the dome swells at every impact and pulse.
    const arcsLive = (phase === 'press' || phase === 'slam') && this.fade > 0.05;
    (this.arcs.material as THREE.LineBasicMaterial).opacity = arcsLive
      ? this.fade * (0.3 + pressure * 0.45)
      : 0;
    this.arcTimer -= dt;
    if (arcsLive && this.arcTimer <= 0) {
      this.arcTimer = 0.07;
      let cursor = 0;
      for (let a = 0; a < this.arcSegments; a++) {
        const angle = Math.random() * Math.PI * 2,
          radius = 0.8 + Math.random() * 2.8;
        let px = Math.cos(angle) * radius,
          pz = Math.sin(angle) * radius,
          py = 5.5 + Math.random() * 5;
        const stepsDown = 3;
        for (let s = 0; s < stepsDown; s++) {
          const ny = py - (5.5 / stepsDown) * (0.7 + Math.random() * 0.6),
            nx = px + (Math.random() - 0.5) * 0.8,
            nz = pz + (Math.random() - 0.5) * 0.8;
          this.arcPositions[cursor++] = px;
          this.arcPositions[cursor++] = py;
          this.arcPositions[cursor++] = pz;
          this.arcPositions[cursor++] = nx;
          this.arcPositions[cursor++] = Math.max(0.25, ny);
          this.arcPositions[cursor++] = nz;
          px = nx;
          pz = nz;
          py = ny;
        }
      }
      (this.arcs.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    }
    if (this.domeT < 1) {
      this.domeT = Math.min(1, this.domeT + dt / 0.55);
      const p = this.domeT,
        out = 1 - Math.pow(1 - p, 3);
      this.dome.visible = true;
      this.dome.scale.setScalar(Math.max(0.2, (2.5 + this.domePower * 6.5) * out));
      ((this.dome.material as THREE.ShaderMaterial).uniforms.uFade as { value: number }).value =
        Math.pow(1 - p, 1.3) * Math.min(1, this.fade + 0.35);
    } else this.dome.visible = false;
    for (const ring of this.rings) {
      if (!ring.mesh.visible) continue;
      ring.age += dt;
      const share = ring.age / ring.life;
      if (share >= 1) {
        ring.mesh.visible = false;
        continue;
      }
      const scale = 1 + ring.age * ring.speed;
      ring.mesh.scale.setScalar(scale);
      (ring.mesh.material as THREE.MeshBasicMaterial).opacity =
        this.fade * (1 - share) * 0.55 * ring.strength;
    }
    // The crack spreads and deepens its glow with stored pressure; after release it keeps
    // its full shape while it fades, a record of how long the boss was held.
    const radius =
      FALL.crackRadius.start + (FALL.crackRadius.full - FALL.crackRadius.start) * pressure;
    if (phase !== 'idle') this.crack.scale.setScalar(radius);
    (this.crack.material as THREE.MeshBasicMaterial).opacity = this.fade * 0.96;
    this.glow.scale.setScalar(radius * (0.55 + this.pulse * 0.15));
    (this.glow.material as THREE.MeshBasicMaterial).opacity =
      this.fade * (0.16 + pressure * 0.3 + this.pulse * 0.2);
    // Stones: crushed flat at the impact; while the field holds, the ones at its rim
    // hover and tremble against it — the inner ones stay pressed into the ground.
    this.stoneLift = clamp(
      this.stoneLift + (phase === 'press' ? dt * 1.8 : -dt * (phase === 'slam' ? 16 : 2)),
      0,
      1,
    );
    for (let i = 0; i < this.stoneData.length; i++) {
      const stone = this.stoneData[i];
      // Held stones slowly orbit, dragged around the column like debris in a whirlpool.
      if (phase === 'press') {
        const spin = dt * (0.3 + pressure * 0.5) * (i % 2 === 0 ? 1 : -1),
          c = Math.cos(spin),
          s = Math.sin(spin),
          nx = stone.x * c - stone.z * s;
        stone.z = stone.x * s + stone.z * c;
        stone.x = nx;
      }
      const ground = this.groundHeight(this.center.x + stone.x, this.center.z + stone.z);
      const trembling = Math.sin(this.time * 31 + stone.seed) * 0.02 * (0.4 + pressure);
      const rimShare = clamp((Math.hypot(stone.x, stone.z) - 3) / 6, 0, 1);
      const liftY =
        this.stoneLift * stone.lift * rimShare * (0.7 + 0.3 * Math.sin(this.time * 7 + stone.seed));
      this.dummy.position.set(
        stone.x,
        ground - this.center.y + 0.05 + liftY + (phase === 'press' ? trembling : 0),
        stone.z,
      );
      this.dummy.rotation.set(stone.seed, stone.seed * 1.7, stone.seed * 0.6);
      this.dummy.scale.setScalar(stone.size * (phase === 'press' && rimShare < 0.3 ? 0.9 : 1));
      this.dummy.updateMatrix();
      this.stones.setMatrixAt(i, this.dummy.matrix);
    }
    this.stones.instanceMatrix.needsUpdate = true;
  }
}
