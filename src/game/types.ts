export type Mode = 'menu' | 'playing' | 'paused' | 'demo' | 'gameover' | 'victory';
export type Quality = 'auto' | 'low' | 'high';
export type CameraMode = 'third' | 'first';
export type SpellId = 0 | 1 | 2;

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
};

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
