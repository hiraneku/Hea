import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CharacterPlayback } from '../character/CharacterPlayback';
import type { CharacterAnatomy } from '../character/anatomy101172';
import { RIGGED_CHARACTER, RIG_REVISION } from '../character/rig101172';
import './preview.css';

// This is a separate build entry inside HEA, deliberately independent of Game.
// Resolve against the document, not BASE_URL ('./' is nested here on Pages).
const previewURL = new URL(window.location.href);
previewURL.search = '';
previewURL.hash = '';
if (!previewURL.pathname.endsWith('/') && !previewURL.pathname.endsWith('.html'))
  previewURL.pathname += '/';
const siteRoot = new URL('../', previewURL);
const modelURL = new URL(RIGGED_CHARACTER, siteRoot);
modelURL.searchParams.set('revision', String(RIG_REVISION));
const app = document.querySelector<HTMLDivElement>('#preview-app')!;
app.innerHTML = `
  <header><a class="wordmark" href="${siteRoot.href}">HEA<span>.</span></a><span class="breadcrumb">LAB / KARAKTER</span><a class="back" href="${siteRoot.href}">← Kembali ke game</a></header>
  <main>
    <section class="stage" aria-label="Preview karakter 3D">
      <div class="stage-heading"><span class="eyebrow">MODEL STUDY / 001</span><h1>KENALI<br><em>KARAKTERMU.</em></h1><p>101172-rigged.glb <span>·</span> Walk v${RIG_REVISION} · sendi terukur</p></div>
      <div id="viewport"></div><div id="joint-labels" class="joint-labels" aria-hidden="true" hidden></div>
      <div id="load-status" role="status">Memuat model…</div>
      <div class="stage-footer"><span><i></i> WALK V${RIG_REVISION} · IN-PLACE · SENDI DARI MESH</span><span>Y ↑</span></div>
    </section>
    <aside>
      <span class="eyebrow">INSPEKSI MODEL</span><h2>Character preview</h2><p class="intro">Periksa bentuk dan material sebelum integrasi. Halaman ini tidak mengubah karakter dalam game.</p>
      <dl id="model-info"><div><dt>Status</dt><dd>Memuat…</dd></div></dl>
      <h3>SUDUT PANDANG</h3><div class="view-buttons"><button data-view="front">Depan</button><button data-view="side">Samping</button><button data-view="back">Belakang</button><button id="reset">Reset kamera</button></div>
      <h3>ANIMASI / GAMEPLAY ASSET</h3>
      <label><span>Pose / animasi</span><select id="animation" disabled><option value="walk">Berjalan</option><option value="bind">Bind pose (A-pose)</option></select></label>
      <div class="view-buttons"><button id="play" disabled>Jeda animasi</button><button id="restart-animation" disabled>Ulangi siklus</button></div>
      <label><span>Kecepatan</span><output id="speed-value">1.00×</output></label><input id="speed" aria-label="Kecepatan animasi" type="range" min="0.25" max="1.5" step="0.05" value="1" disabled />
      <label><span>Siklus langkah</span><output id="phase-value">0%</output></label><input id="phase" aria-label="Posisi siklus langkah" type="range" min="0" max="1000" step="1" value="0" disabled />
      <label><span>Skeleton + titik sendi</span><input id="skeleton" type="checkbox" disabled /></label>
      <a class="download" href="${modelURL.href}" download="101172-rigged.glb">↓ Unduh GLB rig + Walking</a>
      <h3>TAMPILAN</h3><label><span>Putar otomatis</span><input id="rotate" type="checkbox" /></label><label><span>Wireframe</span><input id="wireframe" type="checkbox" /></label><label><span>Lantai & grid</span><input id="grid" type="checkbox" checked /></label>
      <label class="background"><span>Latar</span><select id="background"><option value="#182321">Gelap</option><option value="#d8dfdc">Terang</option><option value="#69736f">Abu-abu</option></select></label>
      <div class="note" id="rig-note">Membaca struktur GLB…</div>
      <div class="help"><h3>KONTROL</h3><p>Seret untuk memutar · Scroll / cubit untuk zoom · Klik kanan / dua jari untuk geser.</p><p>Depan mengikuti sumbu +Z model. Reset mengembalikan tampilan seluruh tubuh.</p></div>
    </aside>
  </main>`;

const viewport = document.querySelector<HTMLDivElement>('#viewport')!;
const status = document.querySelector<HTMLDivElement>('#load-status')!;
const info = document.querySelector<HTMLDListElement>('#model-info')!;
const note = document.querySelector<HTMLDivElement>('#rig-note')!;

async function boot() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  viewport.append(renderer.domElement);
  renderer.domElement.setAttribute(
    'aria-label',
    'Model 3D; seret untuk memutar dan cubit untuk zoom',
  );
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#182321');
  const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotateSpeed = 1.3;
  controls.minDistance = 0.5;
  controls.maxDistance = 14;
  scene.add(new THREE.HemisphereLight('#e5f5ff', '#687568', 2.6));
  const key = new THREE.DirectionalLight('#fff0da', 3.3);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#8ddcd2', 2);
  rim.position.set(-3, 2, -3);
  scene.add(rim);
  const ground = new THREE.Group();
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(7, 96),
    new THREE.MeshStandardMaterial({ color: '#26322f', roughness: 0.95 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.015;
  ground.add(floor, new THREE.GridHelper(14, 28, '#58796d', '#354b42'));
  scene.add(ground);
  let fitDistance = 4.5;
  const target = new THREE.Vector3(0, 1, 0);
  function view(angle = Math.PI / 6) {
    controls.target.copy(target);
    camera.position.set(
      Math.sin(angle) * fitDistance,
      target.y + fitDistance * 0.12,
      Math.cos(angle) * fitDistance,
    );
    controls.update();
  }
  let lastAspect = 0;
  const resize = () => {
    const { width, height } = viewport.getBoundingClientRect();
    renderer.setSize(width, height);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    if (lastAspect && Math.abs(camera.aspect - lastAspect) > 0.4) view();
    lastAspect = camera.aspect;
  };
  const observer = new ResizeObserver(resize);
  observer.observe(viewport);
  resize();
  view();
  let playback: CharacterPlayback | undefined;
  let helper: THREE.SkeletonHelper | undefined;
  const landmarks = new THREE.Group();
  landmarks.visible = false;
  scene.add(landmarks);
  const labels = document.querySelector<HTMLDivElement>('#joint-labels')!;
  const annotations: { bone: THREE.Object3D; marker: THREE.Mesh; label?: HTMLSpanElement }[] = [];
  const projected = new THREE.Vector3();
  let previousTime = performance.now();
  const phaseInput = document.querySelector<HTMLInputElement>('#phase')!;
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = Math.min((now - previousTime) / 1000, 0.05);
    previousTime = now;
    playback?.update(document.hidden ? 0 : dt);
    if (playback) {
      phaseInput.value = String(Math.round(playback.phase * 1000));
      document.querySelector<HTMLOutputElement>('#phase-value')!.value =
        `${Math.round(playback.phase * 100)}%`;
    }
    controls.update();
    helper?.updateMatrixWorld(true);
    if (landmarks.visible)
      for (const entry of annotations) {
        entry.bone.getWorldPosition(entry.marker.position);
        if (entry.label) {
          projected.copy(entry.marker.position).project(camera);
          entry.label.hidden = projected.z > 1 || projected.z < -1;
          entry.label.style.left = `${(projected.x * 0.5 + 0.5) * viewport.clientWidth + 9}px`;
          entry.label.style.top = `${(-projected.y * 0.5 + 0.5) * viewport.clientHeight - 10}px`;
        }
      }
    renderer.render(scene, camera);
  });
  document.querySelector<HTMLInputElement>('#rotate')!.onchange = (e) => {
    controls.autoRotate = (e.target as HTMLInputElement).checked;
  };
  document.querySelector<HTMLInputElement>('#grid')!.onchange = (e) => {
    ground.visible = (e.target as HTMLInputElement).checked;
  };
  document.querySelector<HTMLSelectElement>('#background')!.onchange = (e) => {
    scene.background = new THREE.Color((e.target as HTMLSelectElement).value);
  };
  document.querySelector<HTMLButtonElement>('#reset')!.onclick = () => view();
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((button) => {
    button.onclick = () =>
      view(
        button.dataset.view === 'side' ? Math.PI / 2 : button.dataset.view === 'back' ? Math.PI : 0,
      );
  });
  try {
    const gltf = await new GLTFLoader().loadAsync(modelURL.href, (event) => {
      status.textContent = event.total
        ? `Memuat model… ${Math.round((event.loaded / event.total) * 100)}%`
        : 'Memuat model…';
    });
    const model = gltf.scene;
    const metadata = model.getObjectByName('HEA_101172')?.userData.heaCharacter;
    if (metadata?.version !== RIG_REVISION) throw new Error('Wrong cached character revision.');
    const anatomy = metadata.anatomy as CharacterAnatomy;
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 2 / Math.max(size.y, size.x, size.z, 0.001);
    const holder = new THREE.Group();
    holder.scale.setScalar(scale);
    model.position.sub(new THREE.Vector3(center.x, bounds.min.y, center.z));
    holder.add(model);
    scene.add(holder);
    target.y = (size.y * scale) / 2;
    const normalized = size.clone().multiplyScalar(scale);
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    fitDistance =
      Math.max(
        normalized.y / 2 / Math.tan(halfFov),
        normalized.x / 2 / (Math.tan(halfFov) * camera.aspect),
      ) *
        1.4 +
      normalized.z / 2;
    view();
    playback = new CharacterPlayback(model, gltf.animations);
    helper = new THREE.SkeletonHelper(model);
    for (const material of Array.isArray(helper.material) ? helper.material : [helper.material]) {
      material.depthTest = false;
      material.transparent = true;
    }
    helper.renderOrder = 10;
    helper.visible = false;
    scene.add(helper);
    const markerGeometry = new THREE.SphereGeometry(0.015, 10, 8);
    for (const [joint, title, color] of [
      ['Thigh', 'PANGGUL', '#ffca80'],
      ['Shin', 'LUTUT', '#80d8ff'],
      ['Foot', 'PERGELANGAN', '#d5f38a'],
    ])
      for (const side of ['Left', 'Right']) {
        const marker = new THREE.Mesh(
          markerGeometry,
          new THREE.MeshBasicMaterial({ color, depthTest: false }),
        );
        marker.renderOrder = 11;
        landmarks.add(marker);
        let label: HTMLSpanElement | undefined;
        if (side === 'Left') {
          label = document.createElement('span');
          label.textContent = title;
          label.style.color = color;
          labels.append(label);
        }
        annotations.push({ bone: model.getObjectByName(side + joint)!, marker, label });
      }
    const forward = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0.42, 0.015, -0.15),
      0.65,
      '#d5f38a',
      0.08,
      0.05,
    );
    landmarks.add(forward);
    document
      .querySelectorAll<HTMLInputElement | HTMLButtonElement | HTMLSelectElement>(
        '#animation, #play, #restart-animation, #speed, #phase, #skeleton',
      )
      .forEach((el) => {
        el.disabled = false;
      });
    const playButton = document.querySelector<HTMLButtonElement>('#play')!;
    playButton.onclick = () => {
      playback!.playing = !playback!.playing;
      playButton.textContent = playback!.playing ? 'Jeda animasi' : 'Putar animasi';
      playButton.setAttribute('aria-pressed', String(!playback!.playing));
    };
    document.querySelector<HTMLButtonElement>('#restart-animation')!.onclick = () =>
      playback!.seek(0);
    document.querySelector<HTMLSelectElement>('#animation')!.onchange = (event) =>
      playback!.setMode((event.target as HTMLSelectElement).value as 'walk' | 'bind');
    document.querySelector<HTMLInputElement>('#speed')!.oninput = (event) => {
      playback!.speed = Number((event.target as HTMLInputElement).value);
      document.querySelector<HTMLOutputElement>('#speed-value')!.value =
        `${playback!.speed.toFixed(2)}×`;
    };
    phaseInput.oninput = () => {
      playback!.playing = false;
      playButton.textContent = 'Putar animasi';
      playback!.seek(Number(phaseInput.value) / 1000);
    };
    document.querySelector<HTMLInputElement>('#skeleton')!.onchange = (event) => {
      helper!.visible = (event.target as HTMLInputElement).checked;
      landmarks.visible = helper!.visible;
      labels.hidden = !helper!.visible;
    };
    // Read-only inspection hook, dev only; production exposes no editing harness.
    if (import.meta.env.DEV)
      Object.assign(window, {
        __HEA_CHARACTER__: {
          snapshot: () => ({
            phase: playback!.phase,
            playing: playback!.playing,
            mode: playback!.mode,
            bones: helper!.bones.map((bone) => ({
              name: bone.name,
              position: bone.getWorldPosition(new THREE.Vector3()).toArray(),
            })),
          }),
        },
      });
    const materials = new Set<THREE.MeshStandardMaterial>();
    let meshes = 0,
      bones = 0,
      skinned = 0,
      triangles = 0;
    model.traverse((object) => {
      if (object instanceof THREE.Bone) bones++;
      if (object instanceof THREE.SkinnedMesh) {
        skinned++;
        object.frustumCulled = false;
      }
      if (!(object instanceof THREE.Mesh)) return;
      meshes++;
      triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (material instanceof THREE.MeshStandardMaterial) materials.add(material);
      }
    });
    info.replaceChildren();
    for (const [label, value] of [
      ['Status', 'Siap diperiksa'],
      [
        'Revisi rig',
        `v${model.getObjectByName('HEA_101172')?.userData.heaCharacter.version ?? '?'}`,
      ],
      ['Pangkal kaki (tinggi)', `${((anatomy.left.hip[1] / 2) * 100).toFixed(1)}% H`],
      ['Lutut (tinggi)', `${((anatomy.left.knee[1] / 2) * 100).toFixed(1)}% H`],
      ['Arah kaki / langkah', '+Z / +Z'],
      ['Mesh', String(meshes)],
      ['Segitiga', Math.round(triangles).toLocaleString('id-ID')],
      ['Rig / tulang', bones ? `${bones} tulang · ${skinned} skinned mesh` : 'Tidak ada'],
      [
        'Animasi',
        gltf.animations.map((clip) => `${clip.name} · ${clip.duration.toFixed(2)} s`).join(', '),
      ],
      ['Ukuran asli (XYZ)', `${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}`],
    ]) {
      const row = document.createElement('div');
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = value;
      row.append(dt, dd);
      info.append(row);
    }
    note.textContent =
      'Aset gameplay sungguhan: 28 tulang, skin weights, dan clip Walking tersimpan di GLB. V3 mengukur kontur mesh asli untuk panggul, lutut dan pergelangan; tidak lagi membalik model 180°. Aktifkan skeleton untuk melihat titik sendi dan panah arah depan. Gerak in-place (+Z); perpindahan di dunia tetap dikendalikan motor gameplay. Rig & langkah ini masih tahap review, belum mengganti pemain aktif.';
    document.querySelector<HTMLInputElement>('#wireframe')!.onchange = (e) => {
      for (const material of materials) material.wireframe = (e.target as HTMLInputElement).checked;
    };
    status.hidden = true;
  } catch (error) {
    console.error('Preview model failed:', error);
    status.textContent = 'Model gagal dimuat. Muat ulang halaman untuk mencoba lagi.';
    info.textContent = 'Model belum tersedia.';
    note.textContent = 'Pastikan models/101172-rigged.glb tersedia pada situs HEA.';
  }
}
void boot().catch((error: unknown) => {
  console.error(error);
  status.textContent =
    'Preview membutuhkan WebGL 2. Aktifkan akselerasi grafis atau gunakan browser terbaru.';
});
