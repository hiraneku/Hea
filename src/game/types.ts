export type Mode = 'menu' | 'playing' | 'paused' | 'demo' | 'gameover' | 'victory';
export type Quality = 'auto' | 'low' | 'high';
export type CameraMode = 'third' | 'first';
export type SpellId = 0 | 1 | 2;
/** HUD/telegraph palette: the standard one, or a colour-vision-safe alternative. */
export type ColorVision = 'standard' | 'deuteranopia' | 'protanopia' | 'tritanopia';

/**
 * The remappable keyboard actions, as `KeyboardEvent.code` values. Movement keeps the arrow
 * keys as a fixed secondary, and Esc/P (pause), Tab (cycle) and 1/2/3 (spell slots) stay
 * fixed so a remap can never lock the player out of the game.
 */
export interface KeyBindings {
  forward: string;
  back: string;
  left: string;
  right: string;
  rise: string;
  descend: string;
  dash: string;
  focus: string;
  shield: string;
  flight: string;
  view: string;
  cycle: string;
}

export const DEFAULT_BINDINGS: KeyBindings = {
  forward: 'KeyW',
  back: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  rise: 'Space',
  descend: 'KeyC',
  dash: 'ShiftLeft',
  focus: 'KeyE',
  shield: 'KeyG',
  flight: 'KeyF',
  view: 'KeyV',
  cycle: 'KeyQ',
};

/** The binding actions in the order the settings panel lists them. */
export const BINDING_ACTIONS: { id: keyof KeyBindings; label: string }[] = [
  { id: 'forward', label: 'Maju' },
  { id: 'back', label: 'Mundur' },
  { id: 'left', label: 'Geser kiri' },
  { id: 'right', label: 'Geser kanan' },
  { id: 'rise', label: 'Naik / lompat' },
  { id: 'descend', label: 'Turun' },
  { id: 'dash', label: 'Dash' },
  { id: 'focus', label: 'Fokus boss' },
  { id: 'shield', label: 'Aegis ON/OFF' },
  { id: 'flight', label: 'Mode terbang / jalan' },
  { id: 'view', label: 'Sudut pandang' },
  { id: 'cycle', label: 'Ganti sihir' },
];

const KEY_CODE = /^[A-Za-z][A-Za-z0-9]*$/;

/**
 * Stored bindings, made safe: unknown or malformed codes fall back to the defaults, and a
 * code already claimed by an earlier action falls back too, so two actions never share a
 * key and a corrupt save can never strand the player without a dash.
 */
export function normalizeBindings(raw: unknown): KeyBindings {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const result = { ...DEFAULT_BINDINGS };
  const taken = new Set<string>();
  for (const { id } of BINDING_ACTIONS) {
    const candidate = source[id];
    let code =
      typeof candidate === 'string' && KEY_CODE.test(candidate) && candidate.length <= 24
        ? candidate
        : DEFAULT_BINDINGS[id];
    if (taken.has(code))
      // Its own default may be the very key another action claimed (a swap in the panel);
      // then take whichever default is still free, so the action keeps a working key.
      code =
        [DEFAULT_BINDINGS[id], ...Object.values(DEFAULT_BINDINGS)].find((c) => !taken.has(c)) ??
        code;
    taken.add(code);
    result[id] = code;
  }
  return result;
}

export interface Settings {
  sound: boolean;
  volume: number;
  sensitivity: number;
  quality: Quality;
  reducedEffects: boolean;
  /** Chase camera or a first-person view from the avatar's eyes (V toggles it in play). */
  camera: CameraMode;
  /** Resting field of view of the chase camera, degrees; speed and dashes widen it further. */
  fovThird: number;
  /** Resting field of view from the eyes, degrees. */
  fovFirst: number;
  /** How far behind the body the chase camera rests, metres. */
  cameraDistance: number;
  /** Show frame time, draw calls and render scale beside the clock, for judging performance. */
  perfHud: boolean;
  /** Snap spells to the boss in the sights (and let Bara seekers home) — on by default. */
  aimAssist: boolean;
  /** A shaped, labelled arrow pointing at the boss when it leaves the view. */
  threatIndicator: boolean;
  /** HUD/telegraph palette; anything but `standard` also stripes the boss charge bar. */
  colorVision: ColorVision;
  /** Scale of the duel HUD clusters (their corners stay anchored). */
  hudScale: number;
  /** Remappable keyboard actions. */
  bindings: KeyBindings;
}

/** The ranges the camera sliders cover (also the clamps applied to stored values). */
export const CAMERA_RANGES = {
  fovThird: { min: 65, max: 90 },
  fovFirst: { min: 75, max: 105 },
  cameraDistance: { min: 5, max: 8 },
} as const;

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  volume: 0.45,
  sensitivity: 1,
  quality: 'auto',
  reducedEffects: false,
  camera: 'third',
  fovThird: 74,
  fovFirst: 82,
  cameraDistance: 6.2,
  perfHud: false,
  aimAssist: true,
  threatIndicator: true,
  colorVision: 'standard',
  hudScale: 1,
  bindings: { ...DEFAULT_BINDINGS },
};

/** The range the HUD scale slider covers (also the clamp applied to stored values). */
export const HUD_SCALE_RANGE = { min: 0.85, max: 1.3 } as const;

export const SPELLS = [
  { name: 'BARA', subtitle: 'Proyektil api', color: '#ff8b54', cost: 7, cooldown: 0.3, damage: 36 },
  {
    name: 'PRISMA',
    subtitle: 'Lingkaran cahaya',
    color: '#8cedf7',
    cost: 2,
    cooldown: 0.3,
    damage: 15,
  },
  { name: 'NOVA', subtitle: 'Ledakan area', color: '#e5eacb', cost: 30, cooldown: 1.7, damage: 86 },
] as const;

export interface Snapshot {
  mode: Mode;
  health: number;
  energy: number;
  shield: {
    phase: 'off' | 'ready' | 'active';
    enabled: boolean;
    blocked: number;
    blindWarning: boolean;
  };
  boss: {
    health: number;
    maxHealth: number;
    alive: boolean;
    attack: string;
    stage: string;
    charge: number;
    distance: number;
    /** Direction of the boss around the view: 0 ahead, ±π behind, positive to the right. */
    bearing: number;
    enraged: boolean;
    maneuver: 'strafe' | 'flank' | 'press' | 'low-pass' | 'rise' | 'recover';
  };
  dash: number;
  spell: SpellId;
  /** A held Nova: 0..1 of the way to a charged blast, 0 when nothing is held. */
  charge: number;
  charged: boolean;
  cooldowns: number[];
  damageDealt: number;
  impacts: number;
  wallsBroken: number;
  craters: number;
  launched: boolean;
  flight: {
    enabled: boolean;
    altitude: number;
    speed: number;
    /** How much of the post-dash surge is still in the motor: 1 on the plateau, 0 at rest. */
    boost: number;
    phase:
      | 'hover'
      | 'flying'
      | 'contact'
      | 'launch'
      | 'dash'
      | 'ragdoll'
      | 'walking'
      | 'grounded'
      | 'falling';
  };
  lockedOn: boolean;
  /** The view in use right now: first person hands back to the chase camera while thrown. */
  camera: CameraMode;
  fps: number;
  elapsed: number;
  bestTime: number;
  position: { x: number; y: number; z: number };
  aimTarget: boolean;
}

export type GameEvent =
  | { type: 'mode'; mode: Mode }
  | {
      type: 'hit';
      kill: boolean;
      damage: number;
      /** For the spells that show a floating number: which spell, and where on screen (0..1)
       * it lands plus the screen direction the hit travels in (unit vector, y down). */
      number?: { spell: SpellId; x: number; y: number; dx: number; dy: number };
    }
  | { type: 'damage'; amount: number }
  | { type: 'impact'; surface: 'wall' | 'ground'; actor: 'player' | 'boss'; strength: number }
  | { type: 'contact'; actor: 'player' | 'boss' }
  | { type: 'duel' }
  | { type: 'block'; direction: { x: number; y: number; z: number } }
  | { type: 'toast'; text: string }
  | { type: 'dodge' }
  /** A cast refused — still cooling, or not enough energy — so the slot can dip and recover. */
  | { type: 'dry'; spell: SpellId }
  | { type: 'lock'; locked: boolean }
  | { type: 'camera'; camera: CameraMode };

export function readSettings(): Settings {
  const fallback = {
    ...DEFAULT_SETTINGS,
    reducedEffects: matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
  try {
    const raw = JSON.parse(localStorage.getItem('hea-settings') || 'null');
    if (!raw || typeof raw !== 'object') return fallback;
    return {
      sound: typeof raw.sound === 'boolean' ? raw.sound : fallback.sound,
      reducedEffects:
        typeof raw.reducedEffects === 'boolean' ? raw.reducedEffects : fallback.reducedEffects,
      volume: Number.isFinite(raw.volume) ? Math.max(0, Math.min(1, raw.volume)) : fallback.volume,
      sensitivity: Number.isFinite(raw.sensitivity)
        ? Math.max(0.3, Math.min(2.5, raw.sensitivity))
        : fallback.sensitivity,
      quality: ['auto', 'low', 'high'].includes(raw.quality) ? raw.quality : fallback.quality,
      camera: raw.camera === 'first' ? 'first' : fallback.camera,
      fovThird: ranged(raw.fovThird, CAMERA_RANGES.fovThird, fallback.fovThird),
      fovFirst: ranged(raw.fovFirst, CAMERA_RANGES.fovFirst, fallback.fovFirst),
      cameraDistance: ranged(
        raw.cameraDistance,
        CAMERA_RANGES.cameraDistance,
        fallback.cameraDistance,
      ),
      perfHud: typeof raw.perfHud === 'boolean' ? raw.perfHud : fallback.perfHud,
      aimAssist: typeof raw.aimAssist === 'boolean' ? raw.aimAssist : fallback.aimAssist,
      threatIndicator:
        typeof raw.threatIndicator === 'boolean' ? raw.threatIndicator : fallback.threatIndicator,
      colorVision: ['standard', 'deuteranopia', 'protanopia', 'tritanopia'].includes(
        raw.colorVision,
      )
        ? raw.colorVision
        : fallback.colorVision,
      hudScale: ranged(raw.hudScale, HUD_SCALE_RANGE, fallback.hudScale),
      bindings: normalizeBindings(raw.bindings),
    };
  } catch {
    return fallback;
  }
}

function ranged(value: unknown, range: { min: number; max: number }, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(range.min, Math.min(range.max, value))
    : fallback;
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem('hea-settings', JSON.stringify(settings));
  } catch {
    /* Private browsing can disallow storage. */
  }
}
