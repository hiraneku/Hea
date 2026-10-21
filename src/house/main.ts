import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import './style.css';
import * as T from 'three';
import { HouseCharacter } from './HouseCharacter';
import { HouseFollowCamera } from './followCamera';
import { buildHouse } from './scene';
import { HOUSE, ROOMS, moveInside, type RoomId } from './layout';

const app = document.querySelector<HTMLDivElement>('#house-app')!;
const rootURL = new URL(
  '../',
  location.href.endsWith('/') ? location.href : location.href.replace(/[^/]*$/, ''),
);
app.innerHTML = `
  <div id="view" aria-label="Interior rumah dua lantai, seret untuk melihat" tabindex="0"></div>
  <div class="vignette" aria-hidden="true"></div>
  <header class="house-header">
    <a class="brand" href="${rootURL.href}" aria-label="Kembali ke HEA">HEA<span>.</span><small>RUANG & CERITA</small></a>
    <div class="header-right"><span class="live"><i></i> SORE DI DESA</span><a class="back-link" href="${rootURL.href}">Kembali ke arena <span>↗</span></a></div>
  </header>
  <section class="intro" aria-label="Rumah Senja">
    <p class="eyebrow"><span class="tiny-line"></span> SEBUAH RUMAH KELUARGA</p>
    <h1>Rumah <em>Senja.</em></h1>
    <p class="intro-copy">Di antara hangatnya kayu<br>dan cerita yang dibawa pulang.</p>
    <div class="spec"><span>02 <small>LANTAI</small></span><b>·</b><span>05 <small>RUANG</small></span><b>·</b><span>01 <small>KELUARGA</small></span></div>
  </section>
  <div id="loading" class="loading" role="status"><span></span>Menyalakan perapian…</div>
  <div class="scene-tools"><button id="camera-toggle" class="tool" aria-pressed="true" aria-label="Kamera mengikuti karakter">Kamera: Ikuti</button><button id="plan-toggle" class="tool" aria-haspopup="dialog"><span>▦</span> Denah rumah</button><button id="help-toggle" class="tool" aria-haspopup="dialog" aria-label="Petunjuk kontrol">?</button></div>
  <section class="room-caption" aria-live="polite"><p id="floor-label" class="eyebrow">LANTAI 01 <span>/</span> RUANG KELUARGA</p><h2 id="room-title">Tempat cerita pulang</h2><p id="room-description">Perapian batu, bangku berlapis linen, dan secangkir teh.</p><span class="material-note"><i></i> KAYU · BATU · LINEN · CAHAYA SORE</span></section>
  <div class="look-hint" aria-hidden="true"><span>↔</span> Seret untuk melihat sekeliling</div>
  <nav class="room-nav" aria-label="Pindah ruangan"><span class="nav-label">JELAJAHI RUMAH <span>↗</span></span>${ROOMS.map((r) => `<button data-room="${r.id}" aria-pressed="${r.id === 'living'}"><small>${r.icon}</small><span>${r.name}</span><b>↗</b></button>`).join('')}</nav>
  <button id="mobile-rooms" class="mobile-rooms" aria-expanded="false">Pilih ruangan <span>⌃</span></button>
  <div id="walk-pad" class="walk-pad" role="group" aria-label="Joystick berjalan"><span class="pad-label">GERAK</span><div id="walk-stick"></div><i class="pad-cross-x"></i><i class="pad-cross-y"></i></div>
  <div class="walk-hint"><kbd>W</kbd><span><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span><small>BERJALAN</small></div>
  <footer class="house-footer"><span>HEA / ENVIRONMENT STUDY <b>01</b></span><span id="visit-status">RUMAH SENJA · STICKMAN 1</span></footer>
  <dialog id="plan-dialog"><div class="dialog-head"><div><p class="eyebrow">RUMAH SENJA</p><h2>Ruang untuk hidup.</h2></div><button data-close aria-label="Tutup denah">✕</button></div><div class="plan-tabs"><button data-floor="0" aria-pressed="true">01 · Lantai bawah</button><button data-floor="1" aria-pressed="false">02 · Lantai atas</button></div><p class="dialog-copy">Pilih ruangan pada denah untuk masuk ke dalamnya.</p><div id="floor-plan"></div><div class="plan-legend"><span><i></i> Ruang keluarga</span><span>10 × 8 m · dua lantai</span></div></dialog>
  <dialog id="help-dialog"><div class="dialog-head"><div><p class="eyebrow">SILAKAN MASUK</p><h2>Jadikan dirimu di rumah.</h2></div><button data-close aria-label="Tutup petunjuk">✕</button></div><ul class="help-list"><li><strong>Lihat sekeliling</strong><span>Seret layar dengan jari atau mouse. Kamera mengikuti stickman; tombol Kamera mengganti ke sudut mata.</span></li><li><strong>Berjalan</strong><span>Gerakkan stickman dengan joystick di kiri bawah, WASD, atau tombol panah. Furnitur dan dinding menghalangi jalan.</span></li><li><strong>Naik ke lantai dua</strong><span>Tangga berada di sebelah kanan pintu masuk. Dekati anak tangga dari ujung bawah dan berjalan naik.</span></li><li><strong>Pindah ruangan</strong><span>Pilih nama ruangan atau gunakan denah untuk langsung berpindah.</span></li></ul></dialog>
  <div id="transition" aria-hidden="true"></div>`;

const view = document.querySelector<HTMLDivElement>('#view')!;
const loading = document.querySelector<HTMLDivElement>('#loading')!;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const scene = new T.Scene();
scene.background = new T.Color('#c9d5ca');
scene.fog = new T.Fog('#c9d5ca', 25, 85);
const camera = new T.PerspectiveCamera(67, 1, 0.07, 100);
camera.rotation.order = 'YXZ';
let baseFov = 67;
let renderer: T.WebGLRenderer;
try {
  renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch {
  loading.textContent = 'WebGL tidak tersedia. Buka halaman ini di browser yang mendukung WebGL 2.';
  throw new Error('House requires WebGL');
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputColorSpace = T.SRGBColorSpace;
view.append(renderer.domElement);
renderer.domElement.setAttribute('aria-label', 'Pemandangan interior Rumah Senja');
scene.add(new T.HemisphereLight('#f2edd8', '#a6977e', 1.8));
const sun = new T.DirectionalLight('#ffe1af', 3.4);
sun.position.set(-9, 10, 8);
sun.target.position.set(0, 1, 0);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -10;
sun.shadow.camera.right = 10;
sun.shadow.camera.top = 10;
sun.shadow.camera.bottom = -10;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 35;
sun.shadow.normalBias = 0.025;
sun.shadow.bias = -0.00015;
// Architecture is static: reuse its shadow map on mobile instead of redrawing it every frame.
sun.shadow.autoUpdate = false;
sun.shadow.needsUpdate = true;
scene.add(sun, sun.target);
const fill = new T.PointLight('#ffe7c2', 10, 14, 2);
fill.position.set(-0.8, 2.7, 0.8);
scene.add(fill);
const upperFill = new T.PointLight('#ffedcf', 12, 13, 2);
upperFill.position.set(0.6, 5.9, 0.4);
scene.add(upperFill);
let house: ReturnType<typeof buildHouse>;
try {
  house = buildHouse(scene);
} catch (error) {
  loading.textContent = 'Interior gagal dimuat. Silakan buka ulang halaman.';
  throw error;
}
let x = 0,
  z = 0,
  height = 0,
  yaw = 0,
  pitch = 0,
  activeRoom: RoomId = 'living',
  activeFloor = 0,
  planFloor = 0;
let moving = false,
  tourTimer: ReturnType<typeof setTimeout> | undefined;
let character: HouseCharacter | undefined;
let characterError = false;
let following = true;
const followCamera = new HouseFollowCamera();
const keys = new Set<string>();
const stick = { x: 0, y: 0 };
const dialogs = [...document.querySelectorAll<HTMLDialogElement>('dialog')];
function closeRooms() {
  document.querySelector('.room-nav')!.classList.remove('open');
  document.querySelector('#mobile-rooms')!.setAttribute('aria-expanded', 'false');
}
function updateCaption(id: RoomId) {
  const r = ROOMS.find((r) => r.id === id)!;
  activeRoom = id;
  document.querySelector('#floor-label')!.innerHTML =
    `LANTAI ${r.floor === 0 ? '01' : '02'} <span>/</span> ${r.name.toUpperCase()}`;
  document.querySelector('#room-title')!.textContent = r.subtitle;
  document.querySelector('#room-description')!.textContent = r.description;
  document
    .querySelectorAll<HTMLButtonElement>('[data-room]')
    .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.room === id)));
}
function putInRoom(id: RoomId, immediate = false) {
  const r = ROOMS.find((r) => r.id === id)!;
  keys.clear();
  releaseStick();
  closeRooms();
  dialogs.forEach((d) => d.close());
  if (tourTimer) clearTimeout(tourTimer);
  const curtain = document.querySelector<HTMLDivElement>('#transition')!;
  if (!immediate) document.body.classList.add('experienced');
  const place = () => {
    [x, height, z] = r.position;
    activeFloor = r.floor;
    camera.position.set(x, height + HOUSE.eye, z);
    camera.lookAt(new T.Vector3(...r.target));
    yaw = camera.rotation.y;
    pitch = camera.rotation.x;
    character?.reset(x, height, z, yaw);
    followCamera.reset();
    moving = false;
    updateCaption(id);
    view.focus({ preventScroll: true });
    curtain.classList.remove('fade');
  };
  if (immediate || reduced) place();
  else {
    curtain.classList.add('fade');
    tourTimer = setTimeout(place, 180);
  }
}
document
  .querySelectorAll<HTMLButtonElement>('[data-room]')
  .forEach((b) => (b.onclick = () => putInRoom(b.dataset.room as RoomId)));
document.querySelector<HTMLButtonElement>('#mobile-rooms')!.onclick = () => {
  const open = document.querySelector('.room-nav')!.classList.toggle('open');
  document.querySelector('#mobile-rooms')!.setAttribute('aria-expanded', String(open));
};
function openDialog(id: string) {
  keys.clear();
  releaseStick();
  closeRooms();
  document.querySelector<HTMLDialogElement>(id)!.showModal();
}
document.querySelector<HTMLButtonElement>('#camera-toggle')!.onclick = () => {
  following = !following;
  const b = document.querySelector<HTMLButtonElement>('#camera-toggle')!;
  b.textContent = following ? 'Kamera: Ikuti' : 'Kamera: Mata';
  b.setAttribute('aria-pressed', String(following));
  followCamera.reset();
  view.focus({ preventScroll: true });
};
document.querySelector<HTMLButtonElement>('#help-toggle')!.onclick = () =>
  openDialog('#help-dialog');
document.querySelector<HTMLButtonElement>('#plan-toggle')!.onclick = () => {
  renderPlan(activeFloor);
  openDialog('#plan-dialog');
};
document
  .querySelectorAll<HTMLButtonElement>('[data-close]')
  .forEach((b) => (b.onclick = () => b.closest('dialog')!.close()));
dialogs.forEach((d) =>
  d.addEventListener('click', (e) => {
    if (e.target === d) {
      const r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
        d.close();
    }
  }),
);
function renderPlan(floor: number) {
  planFloor = floor;
  document
    .querySelectorAll<HTMLButtonElement>('[data-floor]')
    .forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.floor) === floor)));
  const ground = `<rect x="30" y="30" width="250" height="300" class="plan-room living"/><rect x="280" y="30" width="220" height="150" class="plan-room kitchen"/><rect x="280" y="180" width="220" height="150" class="plan-room hall"/><rect x="46" y="46" width="90" height="25" class="furniture"/><rect x="55" y="192" width="145" height="35" class="furniture"/><rect x="80" y="125" width="95" height="38" class="furniture"/><rect x="310" y="85" width="90" height="52" class="furniture"/><text x="155" y="270">Ruang keluarga</text><text x="370" y="58">Dapur & makan</text><text x="335" y="295">Pintu masuk</text><g data-plan-room="living" role="button" tabindex="0" aria-label="Masuk ruang keluarga"><rect x="30" y="30" width="250" height="300" class="plan-hit"/></g><g data-plan-room="kitchen" role="button" tabindex="0" aria-label="Masuk dapur"><rect x="280" y="30" width="140" height="150" class="plan-hit"/></g>`;
  const upstairs = `<rect x="30" y="30" width="250" height="145" class="plan-room children"/><rect x="30" y="175" width="250" height="155" class="plan-room parents"/><rect x="280" y="30" width="220" height="300" class="plan-room hall"/><rect x="55" y="45" width="46" height="80" class="furniture"/><rect x="124" y="45" width="46" height="80" class="furniture"/><rect x="64" y="205" width="115" height="95" class="furniture"/><rect x="300" y="43" width="80" height="20" class="furniture"/><text x="160" y="153">Kamar anak</text><text x="158" y="195">Kamar orang tua</text><text x="353" y="93">Sudut baca</text><text x="343" y="205" class="small">KORIDOR</text><g data-plan-room="parents" role="button" tabindex="0" aria-label="Masuk kamar orang tua"><rect x="30" y="175" width="250" height="155" class="plan-hit"/></g><g data-plan-room="children" role="button" tabindex="0" aria-label="Masuk kamar anak"><rect x="30" y="30" width="250" height="145" class="plan-hit"/></g><g data-plan-room="reading" role="button" tabindex="0" aria-label="Masuk sudut baca"><rect x="280" y="30" width="135" height="120" class="plan-hit"/></g>`;
  const stairs = Array.from(
    { length: 14 },
    (_, i) => `<path d="M 427 ${154 + i * 11} h 60"/>`,
  ).join('');
  document.querySelector('#floor-plan')!.innerHTML =
    `<svg viewBox="0 0 530 365" role="group" aria-label="Denah lantai ${floor + 1}">${floor ? upstairs : ground}<rect x="420" y="145" width="73" height="174" class="stair-void"/>${stairs}<path d="M 455 290 V 165 m -5 8 5 -8 5 8" class="stair-arrow"/><text x="455" y="341" class="small">TANGGA</text><rect x="29" y="29" width="472" height="302" class="outline"/></svg>`;
  document.querySelectorAll<SVGGElement>('[data-plan-room]').forEach((g) => {
    const go = () => putInRoom(g.dataset.planRoom as RoomId);
    g.onclick = go;
    g.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        go();
      }
    };
  });
}
document
  .querySelectorAll<HTMLButtonElement>('[data-floor]')
  .forEach((b) => (b.onclick = () => renderPlan(Number(b.dataset.floor))));
// Mouse and touch share the same relative look controller; no pointer lock needed.
let lookPointer: number | null = null,
  lastLookX = 0,
  lastLookY = 0;
view.addEventListener('pointerdown', (e) => {
  if (dialogs.some((d) => d.open)) return;
  lookPointer = e.pointerId;
  lastLookX = e.clientX;
  lastLookY = e.clientY;
  view.setPointerCapture(e.pointerId);
  closeRooms();
  view.focus({ preventScroll: true });
  document.body.classList.add('looking');
});
view.addEventListener('pointermove', (e) => {
  if (e.pointerId !== lookPointer) return;
  yaw -= (e.clientX - lastLookX) * 0.0035;
  pitch = T.MathUtils.clamp(pitch - (e.clientY - lastLookY) * 0.003, -1.15, 1.1);
  lastLookX = e.clientX;
  lastLookY = e.clientY;
  document.body.classList.add('experienced');
});
const endLook = () => {
  lookPointer = null;
  document.body.classList.remove('looking');
};
view.addEventListener('pointerup', endLook);
view.addEventListener('pointercancel', endLook);
view.addEventListener('lostpointercapture', endLook);
const pad = document.querySelector<HTMLDivElement>('#walk-pad')!;
const knob = document.querySelector<HTMLDivElement>('#walk-stick')!;
let padPointer: number | null = null;
function releaseStick() {
  stick.x = stick.y = 0;
  padPointer = null;
  knob.style.transform = 'translate(-50%, -50%)';
  pad.classList.remove('active');
}
function stickMove(e: PointerEvent) {
  const r = pad.getBoundingClientRect();
  let dx = (e.clientX - r.left - r.width / 2) / 36,
    dy = (e.clientY - r.top - r.height / 2) / 36;
  const length = Math.hypot(dx, dy);
  if (length > 1) {
    dx /= length;
    dy /= length;
  }
  stick.x = dx;
  stick.y = -dy;
  knob.style.transform = `translate(calc(-50% + ${dx * 30}px), calc(-50% + ${dy * 30}px))`;
}
pad.addEventListener('pointerdown', (e) => {
  padPointer = e.pointerId;
  pad.setPointerCapture(e.pointerId);
  pad.classList.add('active');
  stickMove(e);
});
pad.addEventListener('pointermove', (e) => {
  if (e.pointerId === padPointer) stickMove(e);
});
for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
  pad.addEventListener(event, releaseStick);
window.addEventListener('keydown', (e) => {
  if (dialogs.some((d) => d.open)) return;
  if (
    ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
      e.code,
    )
  ) {
    if ((e.target as HTMLElement).closest('button,a')) return;
    e.preventDefault();
    keys.add(e.code);
  }
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
const clearInput = () => {
  keys.clear();
  releaseStick();
  endLook();
};
window.addEventListener('blur', clearInput);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) clearInput();
});
function resize() {
  const w = view.clientWidth,
    h = view.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  baseFov = w < 650 ? 76 : 67;
  camera.fov = baseFov;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();
putInRoom('living', true);
loading.innerHTML = '<span></span>Memunculkan stickman…';
HouseCharacter.load(new URL('models/101172-rigged.glb', rootURL).href)
  .then((hero) => {
    character = hero;
    scene.add(hero.root);
    hero.reset(x, height, z, yaw);
    document.body.classList.add('with-character', 'experienced');
  })
  .catch((error) => {
    characterError = true;
    loading.innerHTML = 'Stickman gagal dimuat. <button id="retry-character">Coba lagi</button>';
    document.querySelector<HTMLButtonElement>('#retry-character')!.onclick = () =>
      location.reload();
    console.error('House character required:', error);
  });
let last = performance.now();
let frames = 0;
let disposed = false;
function frame(now: number) {
  if (disposed) return;
  requestAnimationFrame(frame);
  if (document.hidden) {
    last = now;
    return;
  }
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  const beforeX = x,
    beforeZ = z;
  if (character && !dialogs.some((d) => d.open)) {
    let forward =
      stick.y +
      Number(keys.has('KeyW') || keys.has('ArrowUp')) -
      Number(keys.has('KeyS') || keys.has('ArrowDown'));
    let right =
      stick.x +
      Number(keys.has('KeyD') || keys.has('ArrowRight')) -
      Number(keys.has('KeyA') || keys.has('ArrowLeft'));
    const length = Math.hypot(forward, right);
    if (length > 1) {
      forward /= length;
      right /= length;
    }
    moving = length > 0.04;
    if (moving) {
      const speed = 1.65 * dt;
      const p = moveInside(
        x,
        z,
        height,
        (-Math.sin(yaw) * forward + Math.cos(yaw) * right) * speed,
        (-Math.cos(yaw) * forward - Math.sin(yaw) * right) * speed,
      );
      x = p.x;
      z = p.z;
      height = p.height;
      document.body.classList.add('experienced');
      const floor = height > 2.6 ? 1 : 0;
      if (floor !== activeFloor) {
        activeFloor = floor;
        updateCaption(floor ? 'reading' : 'living');
      }
      if (height >= 3.35) {
        if (x < 0.1 && z > 0.35 && activeRoom !== 'parents') updateCaption('parents');
        else if (x < 0.1 && z < 0.1 && activeRoom !== 'children') updateCaption('children');
        else if (x > 0.4 && activeRoom !== 'reading') updateCaption('reading');
      } else if (height < 0.1) {
        if (x > 0.5 && z < 0.15 && activeRoom !== 'kitchen') updateCaption('kitchen');
        else if (x < 0.1 && activeRoom !== 'living') updateCaption('living');
      }
    }
  }
  character?.update(
    dt,
    x,
    height,
    z,
    (x - beforeX) / Math.max(dt, 0.0001),
    (z - beforeZ) / Math.max(dt, 0.0001),
    yaw,
    pitch,
  );
  if (character && following) {
    character.setVisible(
      followCamera.update(camera, dt, x, height, z, yaw, pitch, house.cameraGeometry, baseFov),
    );
  } else {
    camera.fov = baseFov;
    camera.updateProjectionMatrix();
    camera.position.set(x, height + HOUSE.eye, z);
    camera.rotation.set(pitch, yaw, 0);
    character?.setVisible(false);
  }
  if (!reduced) {
    house.fire.intensity = 3.2 + Math.sin(now * 0.004) * 0.18 + Math.sin(now * 0.013) * 0.1;
    house.ember.scale.y = 1 + Math.sin(now * 0.008) * 0.08;
  }
  renderer.render(scene, camera);
  frames++;
  if (frames >= 2 && character && !characterError) loading.hidden = true;
}
requestAnimationFrame(frame);
// Read-only diagnostics: room controls remain the only application-facing API.
if (new URLSearchParams(location.search).has('test')) {
  Object.defineProperty(window, '__HEA_HOUSE__', {
    value: {
      snapshot: () => ({
        x,
        z,
        height,
        yaw,
        pitch,
        activeRoom,
        activeFloor,
        planFloor,
        moving,
        frames,
        drawCalls: renderer.info.render.calls,
        staticBatches: house.meshCount,
        character: character?.snapshot() ?? { loaded: false, visible: false },
        cameraMode: following ? 'follow' : 'eyes',
        cameraDistance: followCamera.distance,
      }),
    },
  });
}
window.addEventListener('pagehide', () => {
  clearInput();
  if (tourTimer) clearTimeout(tourTimer);
});
window.addEventListener(
  'beforeunload',
  () => {
    disposed = true;
    character?.dispose();
    house.dispose();
    renderer.dispose();
  },
  { once: true },
);
