import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import './style.css';
import './duel.css';
import referenceUrl from '../reference.mp4?url';
import reference2Url from '../reference2.mp4?url';
import { icons } from './icons';
import { Game } from './game/Game';
import {
  readSettings,
  saveSettings,
  SPELLS,
  type GameEvent,
  type Mode,
  type Snapshot,
} from './game/types';

const app = document.querySelector<HTMLDivElement>('#app')!;
const settings = readSettings();
const isTouch = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
const spellIcons = [icons.flame, icons.prism, icons.nova];

app.innerHTML = `
  <div id="experience" data-mode="menu" class="${isTouch ? 'has-touch' : ''}">
    <canvas id="arena" aria-label="Arena pertarungan sihir tiga dimensi" tabindex="-1"></canvas>
    <div id="scene-shade" aria-hidden="true"></div>
    <header class="topbar">
      <button id="brand" class="brand" aria-label="HEA — menu permainan" title="Menu permainan">
        <svg class="brand-symbol" viewBox="0 0 36 40" fill="none" aria-hidden="true"><path d="m5 7 8-4v13l10-5V3l8-3v29l-8 5V21l-10 5v10l-8 4V7Z" fill="currentColor"/><path d="m16 7 5-3v7l-5 3V7Z" fill="#ff976b"/></svg>
        <span class="wordmark">HEA<span class="wordmark-dot">.</span></span>
        <span class="brand-divider"></span><span class="brand-subtitle">ARCANE<br>ARENA</span>
      </button>
      <div class="topbar-right">
        <span class="live-label"><i></i> LIVE 3D</span>
        <button id="help-button" class="text-button" title="Panduan bermain" aria-label="Panduan bermain">PANDUAN <span class="help-key">?</span></button>
        <span class="nav-divider"></span>
        <button id="sound-button" class="icon-button" aria-label="Matikan suara" title="Suara">${icons.volume}</button>
        <button id="settings-button" class="icon-button" aria-label="Pengaturan" title="Pengaturan">${icons.settings}</button>
        <button id="fullscreen-button" class="icon-button" aria-label="Layar penuh" title="Layar penuh">${icons.fullscreen}</button>
        <button id="pause-button" class="icon-button" aria-label="Jeda permainan" title="Jeda · Esc" hidden>${icons.pause}</button>
      </div>
    </header>
    <main id="menu" class="menu-screen">
      <div class="menu-copy">
        <div class="eyebrow"><span class="orange-line"></span> 01 / THE SOLAR DUEL</div>
        <h1>PURE<br><span>MOMENTUM.</span></h1>
        <p class="intro">Satu boss. Sihir tanpa ampun.<br>Hadapi IGNIS. Hancurkan batas arena.</p>
        <div class="menu-actions">
          <button id="start-button" class="primary-button"><span>MASUK ARENA</span>${icons.arrow}</button>
          <button id="demo-button" class="demo-button">${icons.play}<span>LIHAT DEMO</span></button>
        </div>
        <div class="input-note">${isTouch ? '<span class="small-cross">✦</span> KONTROL SENTUH · BANTUAN BIDIK AKTIF' : `${icons.mouse}<span>KEYBOARD + MOUSE <b>/</b> KONTROL SENTUH</span>`}</div>
      </div>
      <aside class="element-index" aria-label="Tiga jenis sihir">
        <div class="index-heading">ONE BOSS.<br>NO SECOND GUESS.</div>
        ${SPELLS.map((s, i) => `<div class="element-row" style="--element:${s.color}"><span class="element-number">0${i + 1}</span><span class="element-icon">${spellIcons[i]}</span><span class="element-name">${s.name}<small>${s.subtitle}</small></span><span class="element-dot"></span></div>`).join('')}
        <div class="element-footnote"><span></span> GERAK ADALAH SEGALANYA.</div>
      </aside>
      <div class="scene-caption"><span class="caption-cross">+</span><span>SECTOR 01<br><b>THE ARENA IS ALIVE.</b></span></div>
      <footer class="menu-footer"><span>WEB PROTOTYPE <b>—</b> V0.13</span><button id="reference-button">VIDEO REFERENSI <span>↗</span></button><span class="render-status"><i></i> WEBGL 2 <b>/</b> <span id="menu-fps">—</span> FPS</span></footer>
    </main>
    <section id="hud" aria-label="Status permainan" hidden>
      <div class="vitals"><div class="vitals-label"><span><i class="health-cross">+</i> INTEGRITAS</span><strong id="health-value">100</strong></div><div class="meter health-meter"><i id="health-fill"></i></div><span class="vitals-caption">TETAP BERGERAK. TETAP HIDUP.</span></div>
      <div class="boss-hud" aria-label="Kesehatan boss IGNIS">
        <div class="boss-kicker"><span>ADVERSARY / 01</span><b id="boss-phase">SOLAR WARDEN</b></div>
        <div class="boss-heading"><strong>IGNIS</strong><span id="boss-health-value">1440 / 1440</span></div>
        <div class="meter boss-meter" role="progressbar" aria-label="Kesehatan IGNIS" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><i id="boss-health-fill"></i></div>
        <div class="boss-action"><span id="boss-action">MEMBACA GERAKMU</span><b id="boss-distance">16 M</b></div><div class="boss-charge"><i id="boss-charge-fill"></i></div>
      </div>
      <div class="aegis-hud" id="aegis-hud" data-phase="ready"><div class="aegis-title">${icons.shield}<span>AEGIS <b>∞</b></span><button id="shield-toggle" class="aegis-toggle" aria-label="Perisai otomatis ON" aria-pressed="true"><kbd>G</kbd><strong id="shield-state">ON</strong></button></div><div class="meter aegis-meter"><i id="shield-fill"></i></div><small id="shield-caption">DEPAN + SAMPING · BELAKANG TERBUKA</small></div>
      <div class="duel-stats"><span>DAMAGE</span><strong id="damage-value">0000</strong><small>PROYEKTIL DIBLOKIR <b id="block-count">0</b></small></div>
      <div id="reticle" aria-hidden="true"><i></i><i></i><i></i><i></i><span></span></div>
      <div id="hit-marker" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <div id="score-pop" aria-live="polite"></div>
      <div id="duel-announcement"><span>ONE ON ONE</span><strong>HADAPI <b>IGNIS.</b></strong><small>Aegis aktif otomatis. Baca pola serangannya.</small></div><div id="impact-caption" role="status"></div><div id="block-feedback">AEGIS / INTERSEPSI</div><div id="focus-badge">FOKUS BOSS</div>
      <div id="pointer-tip">KLIK ARENA UNTUK MEMBIDIK <span>·</span> ESC UNTUK JEDA</div>
      <div class="desktop-hints"><div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>GERAK</span></div><div><kbd>SPACE / C</kbd><span>NAIK / TURUN</span><kbd>F</kbd><span>MODE</span><kbd>E</kbd><span>FOKUS BOSS</span></div><div class="hints-muted"><kbd>V</kbd><span>SUDUT PANDANG</span><kbd>R</kbd><span>ULANGI</span><kbd>Q</kbd><span>GANTI SIHIR</span></div></div>
      <div class="spell-dock">
        <div class="spell-dock-label"><span>PILIH SIHIR</span><span class="cast-hint">${isTouch ? 'TAHAN TOMBOL SERANG' : 'KLIK KIRI UNTUK MENYERANG'}</span></div>
        <div class="spell-slots">${SPELLS.map((s, i) => `<button class="spell-slot ${i === 0 ? 'selected' : ''}" data-spell="${i}" style="--element:${s.color};--cooldown:0" aria-label="Pilih ${s.name} — ${s.subtitle}" aria-pressed="${i === 0}"><span class="slot-key">${i + 1}</span><span class="slot-icon">${spellIcons[i]}</span><span class="slot-name">${s.name}</span><span class="slot-cost">${s.cost}</span><span class="slot-cooldown"></span></button>`).join('')}</div>
        <div class="energy-row"><span>ENERGI</span><div class="meter energy-meter"><i id="energy-fill"></i></div><b id="energy-value">100</b></div>
      </div>
      <div class="dash-hud"><div class="dash-symbol">${icons.dash}</div><div><span>DASH <kbd>SHIFT</kbd></span><strong id="dash-value">SIAP</strong><div class="meter dash-meter"><i id="dash-fill"></i></div></div></div>
      <button class="movement-toggle" id="flight-toggle" aria-label="Ganti mode terbang atau jalan" aria-pressed="true"><span><kbd>F</kbd><b id="movement-mode">TERBANG</b><small>⇄</small></span><span class="flight-telemetry"><span id="flight-state">MELAYANG</span><i>·</i><strong id="flight-altitude">2 M</strong></span></button><div class="session-info"><span id="session-time">00:00</span><i></i><span id="hud-fps">60 FPS</span></div>
    </section>
    <div id="touch-controls" aria-label="Kontrol sentuh" hidden>
      <div id="touch-look" aria-label="Geser untuk menggerakkan kamera"></div>
      <div id="joystick" aria-label="Joystick gerakan"><span class="stick-ring"></span><span class="stick-axis axis-x"></span><span class="stick-axis axis-y"></span><span id="stick-knob"></span><span class="stick-label">GERAK</span></div>
      <div class="touch-actions">
        <button id="touch-fire" aria-label="Tahan untuk menyerang"><span id="touch-fire-icon">${icons.flame}</span><small>SERANG</small></button>
        <button id="touch-dash" aria-label="Dash">${icons.dash}<small>DASH</small></button>
        <button id="touch-rise" aria-label="Tahan untuk terbang naik">${icons.jump}<small>NAIK</small></button><button id="touch-descend" aria-label="Tahan untuk terbang turun">${icons.jump}<small>TURUN</small></button>
        <button id="touch-focus" aria-label="Kunci pandangan ke boss" aria-pressed="false">${icons.target}<small>FOKUS</small></button>
        <button id="touch-view" aria-label="Ganti sudut pandang kamera" aria-pressed="false">${icons.eye}<small>MATA</small></button>
      </div>
      <span class="look-label">GESER LAYAR UNTUK MELIHAT</span>
    </div>
    <div id="demo-ui" hidden><div class="demo-tag"><i></i><span>DEMONSTRASI LANGSUNG<small>Kamera otomatis · Efek real-time</small></span></div><button id="demo-play" class="primary-button"><span>GILIRANMU</span>${icons.arrow}</button><button id="demo-exit" class="icon-button" aria-label="Keluar dari demo">${icons.close}</button></div>
    <div id="damage-vignette" aria-hidden="true"></div><div id="speed-lines" aria-hidden="true"></div>
    <div id="toast" role="status"></div>
    <dialog id="panel-dialog" aria-labelledby="panel-title"></dialog>
    <div id="boot" role="status"><span class="boot-wordmark">HEA.</span><span class="boot-loader"></span><span id="boot-status">MENYIAPKAN ARENA</span></div>
  </div>`;

const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
const experience = $('#experience');
const dialog = $<HTMLDialogElement>('#panel-dialog');
let game: Game;
let panel: 'help' | 'settings' | 'reference' | 'pause' | 'gameover' | 'victory' | null = null;
let panelBackToPause = false;
let previousMode: Mode = 'menu';
let toastTimer: ReturnType<typeof setTimeout>;
let duelTimer: ReturnType<typeof setTimeout>;
let hitTimer: ReturnType<typeof setTimeout>;
let scoreTimer: ReturnType<typeof setTimeout>;
let damageTimer: ReturnType<typeof setTimeout>;
let lastSpell = -1;
let blockTimer: ReturnType<typeof setTimeout>;
let impactTimer: ReturnType<typeof setTimeout>;

function toast(text: string) {
  $('#toast').textContent = text;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3400);
}
function timeLabel(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}
function dismissPanel() {
  panel = null;
  panelBackToPause = false;
  if (dialog.open) dialog.close();
  dialog.innerHTML = '';
}
function closePanel() {
  if (panelBackToPause && panel !== 'pause') {
    panelBackToPause = false;
    renderPanel('pause');
    return;
  }
  const old = panel;
  dismissPanel();
  if (old === 'gameover' || old === 'victory') game.menu();
  else if (game.snapshot.mode === 'paused') game.resume();
}
function start() {
  dismissPanel();
  game.start();
}
function menu() {
  dismissPanel();
  game.menu();
}
function openPanel(type: Exclude<typeof panel, null>) {
  if (!game) return;
  panelBackToPause = panel === 'pause';
  panel = type;
  if (game.snapshot.mode === 'playing' || game.snapshot.mode === 'demo') game.pause();
  renderPanel(type);
}

function event(event: GameEvent) {
  if (event.type === 'mode') {
    experience.dataset.mode = event.mode;
    $('#menu').hidden = event.mode !== 'menu';
    $('#hud').hidden =
      !['playing', 'gameover', 'victory'].includes(event.mode) &&
      !(event.mode === 'paused' && previousMode !== 'demo');
    $('#touch-controls').hidden = !isTouch || event.mode !== 'playing';
    $('#demo-ui').hidden =
      event.mode !== 'demo' && !(event.mode === 'paused' && previousMode === 'demo');
    $('#pause-button').hidden = !['playing', 'demo'].includes(event.mode);
    if (event.mode === 'paused' && !panel) renderPanel('pause');
    if (event.mode === 'gameover' || event.mode === 'victory') renderPanel(event.mode);
    if (event.mode === 'menu') {
      $('#duel-announcement').classList.remove('visible');
      $('#pointer-tip').classList.remove('visible');
    }
    if (event.mode === 'playing')
      $('#pointer-tip').classList.toggle('visible', !isTouch && !document.pointerLockElement);
    if (event.mode !== 'paused') previousMode = event.mode;
  } else if (event.type === 'toast') toast(event.text);
  else if (event.type === 'duel') {
    $('#duel-announcement').classList.add('visible');
    clearTimeout(duelTimer);
    duelTimer = setTimeout(() => $('#duel-announcement').classList.remove('visible'), 2700);
  } else if (event.type === 'hit') {
    $('#hit-marker').classList.add('active');
    $('#hit-marker').classList.toggle('kill', event.kill);
    clearTimeout(hitTimer);
    hitTimer = setTimeout(() => $('#hit-marker').classList.remove('active'), 160);
    $('#score-pop').textContent = event.kill ? 'IGNIS DITAKLUKKAN' : `−${event.damage} / IGNIS`;
    $('#score-pop').classList.add('visible');
    clearTimeout(scoreTimer);
    scoreTimer = setTimeout(() => $('#score-pop').classList.remove('visible'), 700);
  } else if (event.type === 'contact') {
    $('#impact-caption').textContent = event.actor === 'boss' ? 'NOVA / KONTAK' : 'KONTAK / IMPULS';
    $('#impact-caption').classList.add('visible');
    clearTimeout(impactTimer);
    impactTimer = setTimeout(() => $('#impact-caption').classList.remove('visible'), 650);
  } else if (event.type === 'damage') {
    $('#damage-vignette').classList.add('active');
    clearTimeout(damageTimer);
    damageTimer = setTimeout(() => $('#damage-vignette').classList.remove('active'), 300);
  } else if (event.type === 'impact') {
    $('#impact-caption').textContent =
      `${event.actor === 'boss' ? 'BOSS TERHEMPAS' : 'TERHEMPAS'} / ${event.surface === 'wall' ? 'BENTURAN DINDING' : 'BENTURAN TANAH'}`;
    $('#impact-caption').classList.add('visible');
    clearTimeout(impactTimer);
    impactTimer = setTimeout(() => $('#impact-caption').classList.remove('visible'), 1200);
  } else if (event.type === 'dodge') {
    $('#impact-caption').textContent = 'ELAKAN SEMPURNA';
    $('#impact-caption').classList.add('visible');
    clearTimeout(impactTimer);
    impactTimer = setTimeout(() => $('#impact-caption').classList.remove('visible'), 700);
  } else if (event.type === 'block') {
    $('#block-feedback').classList.add('visible');
    clearTimeout(blockTimer);
    blockTimer = setTimeout(() => $('#block-feedback').classList.remove('visible'), 450);
  } else if (event.type === 'camera') {
    // The in-game toggle (V / the MATA button) is a settings change like any other.
    settings.camera = event.camera;
    applySettings();
    toast(
      event.camera === 'first' ? 'SUDUT PANDANG: ORANG PERTAMA' : 'SUDUT PANDANG: ORANG KETIGA',
    );
  } else if (event.type === 'lock')
    $('#pointer-tip').classList.toggle(
      'visible',
      !event.locked && !isTouch && game?.snapshot.mode === 'playing',
    );
}

function applySettings() {
  saveSettings(settings);
  game?.applySettings(settings);
  $('#sound-button').innerHTML = settings.sound ? icons.volume : icons.mute;
  $('#sound-button').setAttribute(
    'aria-label',
    settings.sound ? 'Matikan suara' : 'Aktifkan suara',
  );
  $('#sound-button').setAttribute('aria-pressed', String(settings.sound));
  experience.classList.toggle('reduced-effects', settings.reducedEffects);
}

function renderPanel(type: Exclude<typeof panel, null>) {
  panel = type;
  const heading = {
    help: 'KUASAI ARENA.',
    settings: 'SESUAIKAN RITMEMU.',
    reference: 'TITIK AWAL.',
    pause: 'AMBIL NAPAS.',
    gameover: 'DUEL BELUM USAI.',
    victory: 'IGNIS TUMBANG.',
  }[type];
  const overline = {
    help: 'FIELD MANUAL / 01',
    settings: 'PENGATURAN',
    reference: 'VIDEO REFERENSI',
    pause: 'SIMULASI DIJEDA',
    gameover: 'DUEL / DEFEAT',
    victory: 'DUEL / VICTORY',
  }[type];
  let content = '';
  if (type === 'help') {
    content = `<p class="panel-description">Hadapi satu boss terbang, IGNIS. Ganti antara terbang dan jalan. Di mode jalan, Space/tombol Lompat dapat digunakan dua kali; di mode terbang tahan Naik/Turun. IGNIS berganti posisi serta ketinggian, menembak lewat lingkaran di sekelilingnya, melepas 12 orb homing, dan mengisi bola surya besar. Nova dapat menghempaskan boss; serangan beratnya juga bisa melontarkanmu menembus dinding atau menghantam tanah.</p>
      <div class="control-tabs"><button id="desktop-tab" class="${!isTouch ? 'active' : ''}">KEYBOARD + MOUSE</button><button id="mobile-tab" class="${isTouch ? 'active' : ''}">LAYAR SENTUH</button></div>
      <div id="desktop-guide" class="control-guide" ${isTouch ? 'hidden' : ''}>
        <div><span>Bergerak</span><b><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></b></div><div><span>Arahkan kamera / serang</span><b>MOUSE / KLIK KIRI</b></div><div><span>Terbang naik / turun</span><b>TAHAN <kbd>SPACE</kbd> / <kbd>C</kbd></b></div><div><span>Dash · kebal pada awal luncuran</span><b><kbd>SHIFT</kbd></b></div><div><span>Kunci / lepas pandangan boss</span><b><kbd>E</kbd> / KLIK KANAN</b></div><div><span>Perisai ON / OFF</span><b><kbd>G</kbd> / TOMBOL AEGIS</b></div><div><span>Mode terbang / jalan</span><b><kbd>F</kbd> / TOMBOL MODE</b></div><div><span>Pilih sihir</span><b><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> / <kbd>Q</kbd></b></div><div><span>Jeda / ulangi arena</span><b><kbd>ESC</kbd> / <kbd>R</kbd></b></div>
      </div>
      <div id="mobile-guide" class="control-guide" ${!isTouch ? 'hidden' : ''}>
        <div><span>Bergerak</span><b>JOYSTICK KIRI</b></div><div><span>Arahkan kamera</span><b>GESER AREA KANAN</b></div><div><span>Serang berulang</span><b>TAHAN TOMBOL SERANG</b></div><div><span>Ganti sihir</span><b>SENTUH SLOT SIHIR</b></div><div><span>Terbang naik / turun</span><b>TAHAN NAIK / TURUN</b></div><div><span>Menghindar / kunci kamera</span><b>DASH / FOKUS</b></div><div><span>Perisai ON / OFF</span><b><kbd>G</kbd> / TOMBOL AEGIS</b></div><div><span>Mode terbang / jalan</span><b><kbd>F</kbd> / TOMBOL MODE</b></div><div><span>Bantuan bidik</span><b>OTOMATIS AKTIF</b></div>
      </div>
      <div class="guide-spells">${SPELLS.map((s, i) => `<div style="--element:${s.color}">${spellIcons[i]}<strong>${s.name}</strong><span>${['Proyektil cepat. Ikuti target dengan crosshair.', 'Sinar instan. Tepat untuk target yang bergerak.', 'Ledakan kuat. Hempaskan boss dan hancurkan penghalang.'][i]}</span></div>`).join('')}</div>
      <p class="panel-note">Bidang Aegis muncul pada lintasan proyektil dekat tubuh, termasuk sisi dan atas—bukan selalu di pusat. Aegis melindungi depan dan samping sesuai arah tubuh, bukan arah gerak. Belakang adalah titik buta: shield tidak muncul di sana, bahkan saat aktif. Saat ON, intersepsi terus aktif tanpa cooldown. Tekan G atau tombol Aegis untuk ON/OFF. Jejak shield diam di ruang lalu memudar; selama masih berdiri, jejak itu ikut menahan tembakan berikutnya pada lintasan yang sama, dan saat OFF jejak lama tidak memblokir serangan baru. Patch yang muncul berdampingan menyusun diri rapat seperti kepingan puzzle, tidak menumpuk. Proyektil benar-benar menghantam permukaannya: tubuhnya gepeng dan memercik di sana, patch terdorong dan beriak. Satu patch hanya kuat menahan lima hit: kepingnya makin menyala dan retak, lalu pecah berhamburan dan menyisakan lubang di arah itu selama sesaat—bergeraklah. Tanpa biaya energi. Saat terkena hit ada jeda kontak singkat; hit berat membeku sejenak lalu lepas dalam gerak lambat sebelum hempasan cepat. Nova membuat boss terlempar dan berputar seperti ragdoll; skill ketiga boss memberi reaksi itu pada player. Benturan berikutnya merusak dinding atau tanah dan memicu impact frame. Hit berat memberi jeda kontak, lalu luncuran cepat. Tubuh menyerap benturan tanah tanpa memantul, berguling singkat dan terseret: tanah terbelah membentuk alur lurus searah seretan dengan gundukan terangkat di kiri-kanannya, bongkahan tanah berhamburan, lalu tubuh langsung bangkit; bila melayang lama tanpa menyentuh apa pun, ia menegakkan diri di udara. Homing dapat dihindari setelah orb berkomitmen pada lintasannya. Bola surya dapat melubangi dinding tipis. Pusaran Surya: benih gelap meluncur ke dekatmu lalu membuka sumur gravitasi yang menyedot tubuh dan segala percikan selama hampir dua detik, kemudian meledak menjadi cincin bara mendatar—jangan kabur lurus (punggungmu buta), tapi naik atau menukik keluar dari bidang cincinnya. Seret kamera untuk melepas fokus.</p>
      <button class="primary-button full-width" id="panel-done"><span>MENGERTI</span>${icons.arrow}</button>`;
  } else if (type === 'settings') {
    content = `<p class="panel-description">Preferensimu tersimpan di perangkat ini.</p>
      <div class="settings-row"><div><label for="quality">Kualitas visual</label><p>Otomatis mengutamakan performa di mobile.</p></div><select id="quality"><option value="auto" ${settings.quality === 'auto' ? 'selected' : ''}>Otomatis</option><option value="high" ${settings.quality === 'high' ? 'selected' : ''}>Tinggi</option><option value="low" ${settings.quality === 'low' ? 'selected' : ''}>Ringan</option></select></div>
      <div class="settings-row slider-row"><div><label for="sensitivity">Sensitivitas kamera</label><b id="sensitivity-label">${settings.sensitivity.toFixed(1)}×</b></div><input id="sensitivity" type="range" min="0.3" max="2.5" step="0.1" value="${settings.sensitivity}" /></div>
      <div class="settings-row"><div><label for="sound-toggle">Audio</label><p>Efek suara sihir dan gerakan.</p></div><label class="switch"><input id="sound-toggle" type="checkbox" ${settings.sound ? 'checked' : ''} aria-label="Audio"/><span></span></label></div>
      <div class="settings-row slider-row"><div><label for="volume">Volume efek</label><b id="volume-label">${Math.round(settings.volume * 100)}%</b></div><input id="volume" type="range" min="0" max="1" step="0.05" value="${settings.volume}" /></div>
      <div class="settings-row"><div><label for="camera-mode">Sudut pandang</label><p>Kamera pengejar di belakang tubuh,<br>atau dari mata avatar (<kbd>V</kbd> saat bermain).</p></div><select id="camera-mode"><option value="third" ${settings.camera === 'third' ? 'selected' : ''}>Orang ketiga</option><option value="first" ${settings.camera === 'first' ? 'selected' : ''}>Orang pertama</option></select></div>
      <div class="settings-row"><div><label for="comfort">Efek nyaman</label><p>Kurangi kilatan, goyangan kamera,<br>dan perubahan bidang pandang.</p></div><label class="switch"><input id="comfort" type="checkbox" ${settings.reducedEffects ? 'checked' : ''} aria-label="Efek nyaman"/><span></span></label></div>
      <p class="panel-note">Mode Tinggi mengaktifkan bayangan dinamis dan bloom. Mode Ringan mengurangi partikel dan resolusi render.</p>
      <button class="primary-button full-width" id="panel-done"><span>SIMPAN & KEMBALI</span>${icons.arrow}</button>`;
  } else if (type === 'reference') {
    content = `<div class="control-tabs"><button id="reference-one">REFERENSI 1</button><button id="reference-two" class="active">REFERENSI 2</button></div><video class="reference-video" src="${reference2Url}" controls playsinline autoplay muted loop preload="metadata" aria-label="Video referensi asli dari repositori"></video><p class="panel-note">Referensi 2 dari repo, 11,75 detik: kepingan shield heksagonal dan rentetan api. Referensi 1 tetap tersedia. Pilihan fisika dan timing yang tidak terlihat di video tetap berupa tuning prototipe.</p>`;
  } else if (type === 'pause') {
    content = `<p class="panel-description">Arena akan menunggu. Lanjutkan saat kamu siap.</p><div class="pause-actions"><button id="resume-button" class="primary-button full-width"><span>LANJUTKAN</span>${icons.play}</button><button id="restart-button" class="secondary-button">${icons.reset}<span>ULANGI DUEL</span></button><button id="pause-settings" class="secondary-button">${icons.settings}<span>PENGATURAN</span></button><button id="menu-button" class="quiet-button">KEMBALI KE MENU ${icons.arrow}</button></div>`;
  } else {
    const s = game.snapshot;
    content = `<p class="panel-description">${type === 'victory' ? 'Satu lawan. Satu duel. Kamu yang bertahan.' : 'Baca salvo api, hindari lintasan orb, dan jaga arah tubuh saat Aegis aktif.'}</p><div class="result-stats"><div><span>DAMAGE</span><strong>${s.damageDealt}</strong></div><div><span>DIBLOKIR</span><strong>${s.shield.blocked}</strong></div><div><span>WAKTU</span><strong>${timeLabel(s.elapsed)}</strong></div></div><div class="result-best">DINDING HANCUR / KAWAH <b>${s.wallsBroken} / ${s.craters}</b></div><div class="result-best">${type === 'victory' ? 'WAKTU TERBAIK' : 'SISA HP IGNIS'} <b>${type === 'victory' ? timeLabel(s.bestTime) : Math.ceil(s.boss.health)}</b></div><div class="pause-actions"><button id="restart-button" class="primary-button full-width"><span>ULANGI DUEL</span>${icons.reset}</button><button id="menu-button" class="quiet-button">KEMBALI KE MENU ${icons.arrow}</button></div>`;
  }
  dialog.className = `panel panel-${type}`;
  dialog.innerHTML = `<div class="panel-top"><span class="eyebrow">${overline}</span><button id="panel-close" class="icon-button" aria-label="Tutup">${icons.close}</button></div><h2 id="panel-title">${heading}</h2>${content}<div class="panel-corner" aria-hidden="true"></div>`;
  if (!dialog.open) dialog.showModal();
  $('#panel-close').onclick = closePanel;
  if (document.querySelector('#panel-done')) $('#panel-done').onclick = closePanel;
  if (type === 'reference') {
    for (const [id, url] of [
      ['#reference-one', referenceUrl],
      ['#reference-two', reference2Url],
    ])
      $(id).onclick = () => {
        const video = $<HTMLVideoElement>('.reference-video');
        video.src = url;
        void video.play().catch(() => {});
        $('#reference-one').classList.toggle('active', id === '#reference-one');
        $('#reference-two').classList.toggle('active', id === '#reference-two');
      };
  }
  if (type === 'help') {
    $('#desktop-tab').onclick = () => {
      $('#desktop-tab').classList.add('active');
      $('#mobile-tab').classList.remove('active');
      $('#desktop-guide').hidden = false;
      $('#mobile-guide').hidden = true;
    };
    $('#mobile-tab').onclick = () => {
      $('#mobile-tab').classList.add('active');
      $('#desktop-tab').classList.remove('active');
      $('#mobile-guide').hidden = false;
      $('#desktop-guide').hidden = true;
    };
  }
  if (type === 'settings') {
    $<HTMLSelectElement>('#quality').onchange = (e) => {
      settings.quality = (e.target as HTMLSelectElement).value as typeof settings.quality;
      applySettings();
    };
    $<HTMLInputElement>('#sensitivity').oninput = (e) => {
      settings.sensitivity = Number((e.target as HTMLInputElement).value);
      $('#sensitivity-label').textContent = `${settings.sensitivity.toFixed(1)}×`;
      applySettings();
    };
    $<HTMLInputElement>('#volume').oninput = (e) => {
      settings.volume = Number((e.target as HTMLInputElement).value);
      $('#volume-label').textContent = `${Math.round(settings.volume * 100)}%`;
      game.audio.unlock();
      applySettings();
    };
    $<HTMLInputElement>('#sound-toggle').onchange = (e) => {
      settings.sound = (e.target as HTMLInputElement).checked;
      if (settings.sound) game.audio.unlock();
      applySettings();
    };
    $<HTMLInputElement>('#comfort').onchange = (e) => {
      settings.reducedEffects = (e.target as HTMLInputElement).checked;
      applySettings();
    };
    $<HTMLSelectElement>('#camera-mode').onchange = (e) => {
      settings.camera = (e.target as HTMLSelectElement).value === 'first' ? 'first' : 'third';
      applySettings();
    };
  }
  if (type === 'pause') {
    $('#resume-button').onclick = closePanel;
    $('#pause-settings').onclick = () => openPanel('settings');
  }
  if (type === 'pause' || type === 'gameover' || type === 'victory') {
    $('#restart-button').onclick = start;
    $('#menu-button').onclick = menu;
  }
}

dialog.addEventListener('cancel', (e) => {
  e.preventDefault();
  closePanel();
});
dialog.addEventListener('click', (e) => {
  if (e.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (
    e.clientX < rect.left ||
    e.clientX > rect.right ||
    e.clientY < rect.top ||
    e.clientY > rect.bottom
  )
    closePanel();
});

function updateHud(s: Snapshot) {
  $('#health-value').textContent = String(Math.ceil(s.health));
  $('#health-fill').style.transform = `scaleX(${s.health / 100})`;
  $('.vitals').classList.toggle('critical', s.health <= 30);
  $('#energy-value').textContent = String(Math.floor(s.energy));
  $('#energy-fill').style.transform = `scaleX(${s.energy / 100})`;
  $('#boss-health-value').textContent = `${Math.ceil(s.boss.health)} / ${s.boss.maxHealth}`;
  $('#boss-health-fill').style.transform = `scaleX(${s.boss.health / s.boss.maxHealth})`;
  $('.boss-meter').setAttribute(
    'aria-valuenow',
    String(Math.ceil((s.boss.health / s.boss.maxHealth) * 100)),
  );
  $('#boss-phase').textContent = s.boss.enraged
    ? 'OVERDRIVE'
    : {
        strafe: 'MENGITARI',
        flank: 'MEMUTAR SAYAP',
        press: 'MENDEKAT',
        'low-pass': 'LINTAS RENDAH',
        rise: 'MENANJAK',
        recover: 'MEMULIHKAN POSISI',
      }[s.boss.maneuver];
  $('#boss-action').textContent = !s.boss.alive
    ? 'DITAKLUKKAN'
    : s.boss.stage === 'search'
      ? 'TERHALANG / MENCARI SUDUT'
      : s.boss.stage === 'stagger'
        ? 'TERHEMPAS / MEMULIHKAN POSISI'
        : s.boss.stage === 'recover'
          ? 'MEMPOSISIKAN ULANG'
          : `${s.boss.stage === 'telegraph' ? 'MENGISI' : 'MENEMBAK'} / ${s.boss.attack}`;
  $('.boss-hud').dataset.stage = s.boss.stage;
  $('#boss-charge-fill').style.transform = `scaleX(${s.boss.charge})`;
  $('#boss-distance').textContent = `${Math.round(s.boss.distance)} M`;
  $('#damage-value').textContent = String(s.damageDealt).padStart(4, '0');
  $('#block-count').textContent = String(s.shield.blocked);
  $('#aegis-hud').dataset.phase = s.shield.phase;
  $('#shield-state').textContent = s.shield.enabled ? 'ON' : 'OFF';
  $('#shield-toggle').setAttribute('aria-pressed', String(s.shield.enabled));
  $('#shield-toggle').setAttribute(
    'aria-label',
    `Perisai otomatis ${s.shield.enabled ? 'ON' : 'OFF'}`,
  );
  $('#shield-fill').style.transform = `scaleX(${s.shield.enabled ? 1 : 0})`;
  $('#aegis-hud').dataset.blind = String(s.shield.blindWarning);
  $('#shield-caption').textContent = !s.shield.enabled
    ? 'PERISAI OFF · TEKAN UNTUK AKTIFKAN'
    : s.shield.blindWarning
      ? 'TITIK BUTA / PUTAR ARAH TUBUH'
      : 'TANPA COOLDOWN · BELAKANG TERBUKA';
  $('#flight-toggle').setAttribute('aria-pressed', String(s.flight.enabled));
  $('#movement-mode').textContent = s.flight.enabled ? 'TERBANG' : 'JALAN';
  $('#touch-rise small').textContent = s.flight.enabled ? 'NAIK' : 'LOMPAT ×2';
  $('#touch-rise').setAttribute(
    'aria-label',
    s.flight.enabled ? 'Tahan untuk terbang naik' : 'Lompat / lompat kedua',
  );
  $('#touch-descend').hidden = !s.flight.enabled;
  $('#focus-badge').classList.toggle('visible', s.lockedOn && s.boss.alive);
  $('#touch-focus').classList.toggle('held', s.lockedOn);
  $('#touch-focus').setAttribute('aria-pressed', String(s.lockedOn));
  $('#touch-view').classList.toggle('held', settings.camera === 'first');
  $('#touch-view').setAttribute('aria-pressed', String(settings.camera === 'first'));
  experience.classList.toggle('first-person', s.camera === 'first');
  $('#dash-value').textContent = s.dash >= 1 ? 'SIAP' : `${((1 - s.dash) * 1.65).toFixed(1)}s`;
  $('#dash-fill').style.transform = `scaleX(${s.dash})`;
  $('#dash-value').classList.toggle('not-ready', s.dash < 1);
  $('#reticle').classList.toggle('on-target', s.aimTarget);
  $('#reticle').classList.toggle('shielding', s.shield.phase === 'active');
  $('#session-time').textContent = timeLabel(s.elapsed);
  $('#hud-fps').textContent = `${s.fps} FPS`;
  $('#menu-fps').textContent = String(s.fps);
  $('#speed-lines').classList.toggle(
    'active',
    (s.flight.speed > 25.5 || s.launched) && s.mode === 'playing' && !settings.reducedEffects,
  );
  document.querySelectorAll<HTMLElement>('.spell-slot').forEach((button, i) => {
    button.classList.toggle('selected', i === s.spell);
    button.classList.toggle('empty', s.energy < SPELLS[i].cost);
    button.setAttribute('aria-pressed', String(i === s.spell));
    button.style.setProperty('--cooldown', String(s.cooldowns[i]));
  });
  if (s.spell !== lastSpell) {
    $('#touch-fire-icon').innerHTML = spellIcons[s.spell];
    $('#touch-fire').style.setProperty('--element', SPELLS[s.spell].color);
    lastSpell = s.spell;
  }
  $('#touch-fire').classList.toggle(
    'cooling',
    s.cooldowns[s.spell] > 0 || s.energy < SPELLS[s.spell].cost,
  );
  $('#touch-dash').classList.toggle('cooling', s.dash < 1);
  $('#flight-state').textContent = {
    contact: 'KONTAK',
    ragdoll: 'TERSERET',
    dash: 'MELAJU',
    launch: 'TERHEMPAS',
    hover: 'MELAYANG',
    flying: 'TERBANG',
    walking: 'BERJALAN',
    grounded: 'DI TANAH',
    falling: 'DI UDARA',
  }[s.flight.phase];
  $('#flight-altitude').textContent = `${s.flight.altitude.toFixed(1)} M`;
}

async function boot() {
  try {
    await document.fonts.ready;
    game = new Game($<HTMLCanvasElement>('#arena'), settings, event);
    applySettings();
    $('#start-button').onclick = start;
    $('#demo-play').onclick = start;
    $('#demo-button').onclick = () => game.demo();
    $('#demo-exit').onclick = menu;
    $('#brand').onclick = () => {
      if (game.snapshot.mode === 'playing') game.pause();
      else if (game.snapshot.mode === 'demo') menu();
    };
    $('#help-button').onclick = () => openPanel('help');
    $('#settings-button').onclick = () => openPanel('settings');
    $('#reference-button').onclick = () => openPanel('reference');
    $('#pause-button').onclick = () => game.pause();
    $('#sound-button').onclick = () => {
      settings.sound = !settings.sound;
      if (settings.sound) game.audio.unlock();
      applySettings();
    };
    $('#fullscreen-button').onclick = async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (experience.requestFullscreen) await experience.requestFullscreen();
        else toast('Layar penuh tidak tersedia di browser ini.');
      } catch {
        toast('Browser tidak mengizinkan layar penuh pada preview ini.');
      }
    };
    document.querySelectorAll<HTMLElement>('[data-spell]').forEach((button) => {
      button.onclick = () => game.selectSpell(Number(button.dataset.spell));
    });
    window.addEventListener('keydown', (e) => {
      if (e.repeat || dialog.open) return;
      if (e.code === 'KeyR' && game.snapshot.mode === 'playing') {
        e.preventDefault();
        start();
      }
      if (e.key === '?' && !['gameover', 'victory'].includes(game.snapshot.mode)) openPanel('help');
      if (
        e.code === 'Enter' &&
        game.snapshot.mode === 'menu' &&
        (document.activeElement === document.body || document.activeElement === $('#arena'))
      )
        start();
    });
    if (import.meta.env.DEV)
      Object.assign(window, {
        __HEA_DEBUG__: {
          snapshot: () => game.snapshot,
          diagnostics: () => game.diagnostics,
          harness: game.testHarness(),
        },
      });
    setInterval(() => {
      if (!document.hidden) updateHud(game.snapshot);
    }, 100);
    requestAnimationFrame(() => {
      $('#boot').classList.add('loaded');
      setTimeout(() => {
        $('#boot').hidden = true;
      }, 550);
    });
  } catch (error) {
    console.error('Unable to initialize HEA:', error);
    $('#boot').innerHTML =
      `<span class="boot-wordmark">HEA.</span><h2>ARENA BELUM BISA DIMUAT.</h2><p>Browser ini memerlukan WebGL 2 dan akselerasi grafis.<br>Coba Chrome terbaru atau aktifkan akselerasi perangkat keras.</p><button id="reload-button" class="primary-button">MUAT ULANG ${icons.reset}</button>`;
    $('#reload-button').onclick = () => location.reload();
  }
}

void boot();
