import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './preview.css';

// This is a separate build entry inside HEA, deliberately independent of Game.
// Resolve against the document, not BASE_URL ('./' is nested here on Pages).
const siteRoot = new URL(
  '../',
  window.location.href.endsWith('/') ? window.location.href : `${window.location.href}/`,
);
const app = document.querySelector<HTMLDivElement>('#preview-app')!;
app.innerHTML = `
  <header><a class="wordmark" href="${siteRoot.href}">HEA<span>.</span></a><span class="breadcrumb">LAB / KARAKTER</span><a class="back" href="${siteRoot.href}">← Kembali ke game</a></header>
  <main>
    <section class="stage" aria-label="Preview karakter 3D">
      <div class="stage-heading"><span class="eyebrow">MODEL STUDY / 001</span><h1>KENALI<br><em>KARAKTERMU.</em></h1><p>101172.glb <span>·</span> Preview sementara</p></div>
      <div id="viewport"></div>
      <div id="load-status" role="status">Memuat model…</div>
      <div class="stage-footer"><span><i></i> MODEL ASLI · TANPA ANIMASI TAMBAHAN</span><span>Y ↑</span></div>
    </section>
    <aside>
      <span class="eyebrow">INSPEKSI MODEL</span><h2>Character preview</h2><p class="intro">Periksa bentuk dan material sebelum integrasi. Halaman ini tidak mengubah karakter dalam game.</p>
      <dl id="model-info"><div><dt>Status</dt><dd>Memuat…</dd></div></dl>
      <h3>SUDUT PANDANG</h3><div class="view-buttons"><button data-view="front">Depan</button><button data-view="side">Samping</button><button data-view="back">Belakang</button><button id="reset">Reset kamera</button></div>
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
  renderer.setAnimationLoop(() => {
    controls.update();
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
    const gltf = await new GLTFLoader().loadAsync(
      new URL('models/101172.glb', siteRoot).href,
      (event) => {
        status.textContent = event.total
          ? `Memuat model… ${Math.round((event.loaded / event.total) * 100)}%`
          : 'Memuat model…';
      },
    );
    const model = gltf.scene;
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
    const materials = new Set<THREE.MeshStandardMaterial>();
    let meshes = 0,
      bones = 0,
      skinned = 0,
      triangles = 0;
    model.traverse((object) => {
      if (object instanceof THREE.Bone) bones++;
      if (object instanceof THREE.SkinnedMesh) skinned++;
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
      ['Mesh', String(meshes)],
      ['Segitiga', Math.round(triangles).toLocaleString('id-ID')],
      ['Rig / tulang', bones ? `${bones} tulang · ${skinned} skinned mesh` : 'Tidak ada'],
      ['Animasi bawaan', String(gltf.animations.length)],
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
    note.textContent = bones
      ? 'Rig terdeteksi. Animasi baru belum dibuat atau diputar di preview ini.'
      : 'Model ini belum memiliki rig maupun tulang. Rigging diperlukan untuk animasi tubuh bersendi. Belum ada animasi yang ditambahkan.';
    document.querySelector<HTMLInputElement>('#wireframe')!.onchange = (e) => {
      for (const material of materials) material.wireframe = (e.target as HTMLInputElement).checked;
    };
    status.hidden = true;
  } catch (error) {
    console.error('Preview model failed:', error);
    status.textContent = 'Model gagal dimuat. Muat ulang halaman untuk mencoba lagi.';
    info.textContent = 'Model belum tersedia.';
    note.textContent = 'Pastikan models/101172.glb tersedia pada situs HEA.';
  }
}
void boot().catch((error: unknown) => {
  console.error(error);
  status.textContent =
    'Preview membutuhkan WebGL 2. Aktifkan akselerasi grafis atau gunakan browser terbaru.';
});
