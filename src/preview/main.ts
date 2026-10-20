import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CharacterLook } from '../character/CharacterLook';
import { CharacterArenaDrive } from '../character/CharacterArenaDrive';
import { PACE_LABELS } from '../character/CharacterFacing';
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
modelURL.searchParams.set('gait', '1');
const app = document.querySelector<HTMLDivElement>('#preview-app')!;
app.innerHTML = `
  <header><a class="wordmark" href="${siteRoot.href}">HEA<span>.</span></a><span class="breadcrumb">LAB / KARAKTER</span><a class="back" href="${siteRoot.href}">← Kembali ke game</a></header>
  <main>
    <section class="stage" aria-label="Preview karakter 3D">
      <div class="stage-heading"><p>KARAKTER <span>·</span> v${RIG_REVISION} · GERAK 1</p></div>
      <div id="viewport"></div><div id="joint-labels" class="joint-labels" aria-hidden="true" hidden></div>
      <div id="drive-pad" role="group" aria-label="Joystick gerak" hidden><span id="drive-knob"></span><small>GERAK</small></div>
      <button id="drive-flight" class="drive-flight" aria-label="Terbang" hidden disabled>TERBANG</button>
      <div id="load-status" role="status">Memuat model…</div>
      <div class="stage-footer"><span><i></i> HEA · PREVIEW</span><span>Y ↑</span></div>
    </section>
    <aside>
      <h2>Karakter</h2>
      <details class="asset-details"><summary>Info aset</summary><dl id="model-info"><div><dt>Status</dt><dd>Memuat…</dd></div></dl><output id="drive-status">Mode inspeksi · X 0.000 · Z 0.000</output></details>
      <h3>SUDUT PANDANG</h3><div class="view-buttons"><button data-view="front">Depan</button><button data-view="side">Samping</button><button data-view="back">Belakang</button><button id="reset">Reset kamera</button></div>
      <h3>MAIN</h3>
      <div class="view-buttons"><button id="drive-toggle" aria-pressed="false" disabled>Mainkan karakter</button><button id="drive-reset" disabled>Reset posisi</button></div>
      <p class="movement-help">Joystick / WASD · Spasi untuk terbang / turun.</p>
      <h3>ARAH KEPALA</h3>
      <label for="look-yaw"><span>Menoleh kiri / kanan</span><output id="look-yaw-value">0°</output></label><input id="look-yaw" type="range" min="-70" max="70" value="0" aria-label="Menoleh kiri kanan" disabled />
      <label for="look-pitch"><span>Tunduk / mendongak</span><output id="look-pitch-value">0°</output></label><input id="look-pitch" type="range" min="-30" max="30" value="0" aria-label="Tunduk mendongak" disabled />
      <button id="look-reset" disabled>Luruskan kepala</button>
      <h3>COBA GERAKAN</h3>
      <div class="view-buttons" id="movement-options" aria-label="Pilihan gerakan"><button id="movement-walk" aria-pressed="false" disabled>Jalan</button><button id="movement-flight" disabled>Terbang</button></div>
      <p class="movement-help">Klik untuk jalan, klik lagi untuk berhenti.</p>
      <h3>ANIMASI</h3>
      <label><span>Pose / animasi</span><select id="animation" disabled><option value="walk">Berjalan</option><option value="bind">Diam / berhenti</option></select></label>
      <div class="view-buttons"><button id="play" disabled>Jeda animasi</button><button id="restart-animation" disabled>Ulangi siklus</button></div>
      <label><span>Kecepatan</span><output id="speed-value">1.00×</output></label><input id="speed" aria-label="Kecepatan animasi" type="range" min="0.25" max="1.5" step="0.05" value="1" disabled />
      <label><span>Siklus langkah</span><output id="phase-value">0%</output></label><input id="phase" aria-label="Posisi siklus langkah" type="range" min="0" max="1000" step="1" value="0" disabled />
      <label><span>Skeleton + titik sendi</span><input id="skeleton" type="checkbox" disabled /></label>
      <a class="download" href="${modelURL.href}" download="101172-rigged.glb">↓ Unduh GLB rig + Walking</a>
      <h3>TAMPILAN</h3><label><span>Putar otomatis</span><input id="rotate" type="checkbox" /></label><label><span>Wireframe</span><input id="wireframe" type="checkbox" /></label><label><span>Lantai & grid</span><input id="grid" type="checkbox" checked /></label>
      <label class="background"><span>Latar</span><select id="background"><option value="#182321">Gelap</option><option value="#d8dfdc">Terang</option><option value="#69736f">Abu-abu</option></select></label>
      <details class="asset-details"><summary>Detail & bantuan</summary><div class="note" id="rig-note">Membaca struktur GLB…</div>
      <div class="help"><h3>KONTROL</h3><p>Seret untuk memutar · Scroll / cubit untuk zoom · Klik kanan / dua jari untuk geser.</p><p>Depan mengikuti sumbu +Z model. Reset mengembalikan tampilan seluruh tubuh.</p></div>
      </details>
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
    new THREE.CircleGeometry(9, 96),
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
      target.x + Math.sin(angle) * fitDistance,
      target.y + fitDistance * 0.12,
      target.z + Math.cos(angle) * fitDistance,
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
  let look: CharacterLook | undefined;
  let driving = false;
  let updateDrive: ((dt: number) => void) | undefined;
  let applyInspectionMotion: (() => void) | undefined;
  const yawInput = document.querySelector<HTMLInputElement>('#look-yaw')!;
  const pitchInput = document.querySelector<HTMLInputElement>('#look-pitch')!;
  let helper: THREE.SkeletonHelper | undefined;
  const landmarks = new THREE.Group();
  landmarks.visible = false;
  scene.add(landmarks);
  const labels = document.querySelector<HTMLDivElement>('#joint-labels')!;
  const annotations: { bone: THREE.Object3D; marker: THREE.Mesh; label?: HTMLSpanElement }[] = [];
  const projected = new THREE.Vector3();
  let headBone: THREE.Object3D | undefined;
  const headArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(),
    0.28,
    '#ffffff',
    0.06,
    0.035,
  );
  landmarks.add(headArrow);
  let previousTime = performance.now();
  const phaseInput = document.querySelector<HTMLInputElement>('#phase')!;
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = Math.min((now - previousTime) / 1000, 0.05);
    previousTime = now;
    const visibleDt = document.hidden ? 0 : dt;
    look?.clear();
    if (driving) updateDrive?.(visibleDt);
    else {
      playback?.update(visibleDt);
      applyInspectionMotion?.();
    }
    if (!driving)
      look?.apply(
        THREE.MathUtils.degToRad(Number(yawInput.value)),
        THREE.MathUtils.degToRad(Number(pitchInput.value)),
      );
    if (playback) {
      viewport.dataset.motion = playback.isFlying
        ? playback.flightStage
        : playback.isStarting
          ? 'starting'
          : playback.isStopping
            ? 'stopping'
            : playback.mode;
      for (const id of ['movement-flight', 'drive-flight']) {
        const button = document.getElementById(id) as HTMLButtonElement;
        button.disabled = playback.isLanding;
        button.textContent = playback.isFlying
          ? 'Turun'
          : id === 'drive-flight'
            ? 'TERBANG'
            : 'Terbang';
        button.setAttribute('aria-label', playback.isFlying ? 'Turun dan mendarat' : 'Terbang');
      }
      for (const id of ['animation', 'speed', 'phase', 'movement-walk', 'restart-animation'])
        (document.getElementById(id) as HTMLInputElement).disabled = driving || playback.isFlying;
      if (!driving)
        document.querySelector<HTMLButtonElement>('#play')!.textContent =
          playback.playing && (playback.isFlying || playback.mode === 'walk')
            ? 'Jeda animasi'
            : 'Putar animasi';
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
    if (landmarks.visible && headBone) {
      headBone.getWorldPosition(headArrow.position);
      // Place the guide at the centre of the featureless head, above neck labels.
      headArrow.position.add(
        new THREE.Vector3(0, 0.15, 0).applyQuaternion(
          headBone.getWorldQuaternion(new THREE.Quaternion()),
        ),
      );
      headArrow.setDirection(
        new THREE.Vector3(0, 0, 1).applyQuaternion(
          headBone.getWorldQuaternion(new THREE.Quaternion()),
        ),
      );
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
    playback.playing = false;
    playback.setMode('bind', true);
    playback.update(0);
    look = new CharacterLook(model);
    headBone = model.getObjectByName('Head');
    const drive = new CharacterArenaDrive(holder, playback);
    const paceButton = document.createElement('button');
    paceButton.id = 'drive-pace';
    paceButton.textContent = 'JALAN · T';
    paceButton.disabled = true;
    const lockButton = document.createElement('button');
    lockButton.id = 'drive-lock';
    lockButton.textContent = 'Lock arah · E';
    lockButton.disabled = true;
    lockButton.setAttribute('aria-pressed', 'false');
    const motionControls = document.createElement('div');
    motionControls.className = 'directional-controls';
    motionControls.append(paceButton, lockButton);
    document.querySelector('#drive-toggle')!.parentElement!.append(motionControls);
    paceButton.onclick = () => {
      if (driving) drive.cyclePace();
    };
    lockButton.onclick = () => {
      if (driving) drive.toggleLock();
    };
    window.addEventListener('keydown', (e) => {
      if (!driving || e.repeat || /INPUT|SELECT|TEXTAREA/.test((e.target as HTMLElement).tagName))
        return;
      if (e.code === 'KeyT') drive.cyclePace();
      if (e.code === 'KeyE') drive.toggleLock();
    });
    applyInspectionMotion = () => {
      const delta = playback!
        .consumeRootMotion()
        .multiply(holder.scale)
        .applyQuaternion(holder.quaternion);
      holder.position.add(delta);
      camera.position.add(delta);
      target.add(delta);
      controls.target.add(delta);
    };
    const keys = new Set<string>();
    const joystick = new THREE.Vector2();
    const pad = document.querySelector<HTMLDivElement>('#drive-pad')!;
    const knob = document.querySelector<HTMLSpanElement>('#drive-knob')!;
    let pointer: number | undefined;
    const release = () => {
      keys.clear();
      joystick.set(0, 0);
      knob.style.transform = '';
      pointer = undefined;
    };
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) release();
    });
    const toggleFlight = () => {
      look?.clear();
      if (driving) drive.requestFlight();
      else if (playback!.isFlying) playback!.land();
      else playback!.fly();
    };
    document.querySelector<HTMLButtonElement>('#movement-flight')!.onclick = toggleFlight;
    document.querySelector<HTMLButtonElement>('#drive-flight')!.onclick = toggleFlight;
    window.addEventListener('keydown', (e) => {
      if (
        !driving ||
        e.code !== 'Space' ||
        /INPUT|SELECT|TEXTAREA/.test((e.target as HTMLElement).tagName)
      )
        return;
      e.preventDefault();
      if (!e.repeat) toggleFlight();
    });
    const movementKeys = [
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD',
      'ArrowUp',
      'ArrowLeft',
      'ArrowDown',
      'ArrowRight',
    ];
    window.addEventListener('keydown', (e) => {
      if (
        !driving ||
        /INPUT|SELECT|TEXTAREA/.test((e.target as HTMLElement).tagName) ||
        !movementKeys.includes(e.code)
      )
        return;
      e.preventDefault();
      keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      keys.delete(e.code);
    });
    const movePointer = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      const r = pad.getBoundingClientRect();
      joystick.set(
        (e.clientX - r.left - r.width / 2) / 40,
        -(e.clientY - r.top - r.height / 2) / 40,
      );
      if (joystick.length() > 1) joystick.normalize();
      if (joystick.length() < 0.12) joystick.set(0, 0);
      knob.style.transform = `translate(${joystick.x * 35}px, ${-joystick.y * 35}px)`;
    };
    pad.onpointerdown = (e) => {
      if (!driving || pointer !== undefined) return;
      pointer = e.pointerId;
      pad.setPointerCapture(e.pointerId);
      e.preventDefault();
      movePointer(e);
    };
    pad.onpointermove = movePointer;
    pad.onpointerup = (e) => {
      if (e.pointerId === pointer) release();
    };
    pad.onpointercancel = release;
    pad.onlostpointercapture = release;
    updateDrive = (dt) => {
      const x =
        joystick.x +
        Number(keys.has('KeyD') || keys.has('ArrowRight')) -
        Number(keys.has('KeyA') || keys.has('ArrowLeft'));
      const y =
        joystick.y +
        Number(keys.has('KeyW') || keys.has('ArrowUp')) -
        Number(keys.has('KeyS') || keys.has('ArrowDown'));
      const delta = drive.update(dt, x, y, camera);
      paceButton.textContent = `${PACE_LABELS[drive.pace]} · T`;
      lockButton.textContent = drive.locked ? 'Lock arah ON · E' : 'Lock arah OFF · E';
      lockButton.setAttribute('aria-pressed', String(drive.locked));
      viewport.dataset.pace = String(drive.pace);
      viewport.dataset.locked = String(drive.locked);
      camera.position.add(delta);
      target.add(delta);
      controls.target.add(delta);
      document.querySelector<HTMLOutputElement>('#drive-status')!.value =
        `Mode main · X ${holder.position.x.toFixed(3)} · Z ${holder.position.z.toFixed(3)}`;
    };
    for (const input of [yawInput, pitchInput])
      input.oninput = () => {
        document.querySelector<HTMLOutputElement>(`#${input.id}-value`)!.value = `${input.value}°`;
      };
    document.querySelector<HTMLButtonElement>('#look-reset')!.onclick = () => {
      yawInput.value = pitchInput.value = '0';
      for (const id of ['look-yaw', 'look-pitch'])
        document.querySelector<HTMLOutputElement>(`#${id}-value`)!.value = '0°';
    };
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
      ['Neck', 'LEHER', '#ffffff'],
      ['UpperArm', 'BAHU', '#ff94bd'],
      ['ForeArm', 'SIKU', '#c4a7ff'],
      ['Thigh', 'PANGGUL', '#ffca80'],
      ['Shin', 'LUTUT', '#80d8ff'],
      ['Foot', 'PERGELANGAN', '#d5f38a'],
    ])
      for (const side of joint === 'Neck' ? [''] : ['Left', 'Right']) {
        const marker = new THREE.Mesh(
          markerGeometry,
          new THREE.MeshBasicMaterial({ color, depthTest: false }),
        );
        marker.renderOrder = 11;
        landmarks.add(marker);
        let label: HTMLSpanElement | undefined;
        if (side === 'Left' || side === '') {
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
        '#movement-flight, #drive-flight, #animation, #play, #restart-animation, #speed, #phase, #skeleton, #movement-walk, #drive-toggle, #drive-reset, #look-yaw, #look-pitch, #look-reset',
      )
      .forEach((el) => {
        el.disabled = false;
      });
    const playButton = document.querySelector<HTMLButtonElement>('#play')!;
    const movementButton = document.querySelector<HTMLButtonElement>('#movement-walk')!;
    const animationSelect = document.querySelector<HTMLSelectElement>('#animation')!;
    const syncMovement = () => {
      const walking = playback!.mode === 'walk';
      movementButton.setAttribute('aria-pressed', String(walking));
      animationSelect.value = walking ? 'walk' : 'bind';
      playButton.textContent = walking && playback!.playing ? 'Jeda animasi' : 'Putar animasi';
      playButton.setAttribute('aria-pressed', String(!playback!.playing));
    };
    const selectMovement = (mode: 'walk' | 'bind') => {
      // Capture animation pose without baking the additive look offset twice.
      look?.clear();
      const restart = !playback!.isStopping && playback!.action.getEffectiveWeight() < 0.001;
      playback!.setMode(mode);
      playback!.playing = mode === 'walk';
      // Starting owns its phase and root motion; do not overwrite it with seek(0).
      if (mode === 'walk' && restart && !playback!.isStarting) playback!.seek(0);
      syncMovement();
    };
    syncMovement();
    const driveButton = document.querySelector<HTMLButtonElement>('#drive-toggle')!;
    driveButton.onclick = () => {
      driving = !driving;
      paceButton.disabled = lockButton.disabled = !driving;
      release();
      const elevation = holder.position.y;
      drive.resetMotion();
      holder.position.y = 0;
      camera.position.y -= elevation;
      target.y -= elevation;
      controls.target.y -= elevation;
      pad.hidden = !driving;
      document.querySelector<HTMLButtonElement>('#drive-flight')!.hidden = !driving;
      driveButton.setAttribute('aria-pressed', String(driving));
      driveButton.textContent = driving ? 'Selesai main' : 'Mainkan karakter';
      controls.autoRotate = false;
      document.querySelector<HTMLInputElement>('#rotate')!.checked = false;
      for (const id of [
        'animation',
        'play',
        'restart-animation',
        'speed',
        'phase',
        'movement-walk',
      ])
        (document.getElementById(id) as HTMLInputElement).disabled = driving;
      selectMovement('bind');
      document.querySelector<HTMLOutputElement>('#drive-status')!.value = driving
        ? 'Mode main · X 0.000 · Z 0.000'
        : `Mode inspeksi · X ${holder.position.x.toFixed(3)} · Z ${holder.position.z.toFixed(3)}`;
      if (driving) renderer.domElement.focus();
    };
    renderer.domElement.tabIndex = 0;
    document.querySelector<HTMLButtonElement>('#drive-reset')!.onclick = () => {
      release();
      drive.resetMotion();
      camera.position.sub(holder.position);
      target.sub(holder.position);
      controls.target.sub(holder.position);
      holder.position.set(0, 0, 0);
      holder.quaternion.identity();
      drive.facing.reset(0);
      document.querySelector<HTMLOutputElement>('#drive-status')!.value =
        `${driving ? 'Mode main' : 'Mode inspeksi'} · X 0.000 · Z 0.000`;
    };
    movementButton.onclick = () => selectMovement(playback!.mode === 'walk' ? 'bind' : 'walk');
    playButton.onclick = () => {
      if (playback!.isFlying) {
        playback!.playing = !playback!.playing;
        playButton.textContent = playback!.playing ? 'Jeda animasi' : 'Putar animasi';
        return;
      }
      if (playback!.mode === 'bind') {
        selectMovement('walk');
        return;
      }
      playback!.playing = !playback!.playing;
      playButton.textContent = playback!.playing ? 'Jeda animasi' : 'Putar animasi';
      playButton.setAttribute('aria-pressed', String(!playback!.playing));
    };
    document.querySelector<HTMLButtonElement>('#restart-animation')!.onclick = () =>
      playback!.seek(0);
    animationSelect.onchange = () => selectMovement(animationSelect.value as 'walk' | 'bind');
    document.querySelector<HTMLInputElement>('#speed')!.oninput = (event) => {
      playback!.speed = Number((event.target as HTMLInputElement).value);
      document.querySelector<HTMLOutputElement>('#speed-value')!.value =
        `${playback!.speed.toFixed(2)}×`;
    };
    phaseInput.oninput = () => {
      playback!.setMode('walk');
      animationSelect.value = 'walk';
      movementButton.setAttribute('aria-pressed', 'true');
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
      'Aset gameplay sungguhan: 28 tulang, skin weights, dan clip Walking tersimpan di GLB. V9 memakai jarak kaki dan lengan netral saat terbang, dengan kaki lurus dan skin sambungan bahu/tungkai yang halus. Material tetap putih pada aset turunan. Leher dan kepala bisa diuji menoleh; mode main memakai clip Walking yang sama. Pemisahan weight lengan/paha tetap dipertahankan; tidak lagi membalik model 180°. Aktifkan skeleton untuk melihat titik sendi dan panah arah depan. Gerak in-place (+Z); perpindahan di dunia tetap dikendalikan motor gameplay. Rig & langkah ini masih tahap review, belum mengganti pemain aktif.';
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
