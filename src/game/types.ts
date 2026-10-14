export type Mode = 'menu' | 'playing' | 'paused' | 'demo' | 'gameover' | 'victory';
export type Quality = 'auto' | 'low' | 'high';
export type SpellId = 0 | 1 | 2;

export interface Settings {
  sound: boolean;
  volume: number;
  sensitivity: number;
  quality: Quality;
  reducedEffects: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  volume: 0.45,
  sensitivity: 1,
  quality: 'auto',
  reducedEffects: false,
};

export const SPELLS = [
  { name: 'BARA', subtitle: 'Proyektil api', color: '#ff8b54', cost: 7, cooldown: 0.3, damage: 36 },
  {
    name: 'PRISMA',
    subtitle: 'Tombak cahaya',
    color: '#8cedf7',
    cost: 15,
    cooldown: 0.65,
    damage: 58,
  },
  { name: 'NOVA', subtitle: 'Ledakan area', color: '#e5eacb', cost: 30, cooldown: 1.7, damage: 86 },
] as const;

export interface Snapshot {
  mode: Mode;
  health: number;
  energy: number;
  shield: {
    phase: 'ready' | 'active' | 'cooldown';
    remaining: number;
    progress: number;
    blocked: number;
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
  };
  dash: number;
  spell: SpellId;
  cooldowns: number[];
  damageDealt: number;
  impacts: number;
  wallsBroken: number;
  craters: number;
  launched: boolean;
  lockedOn: boolean;
  fps: number;
  elapsed: number;
  bestTime: number;
  position: { x: number; y: number; z: number };
  aimTarget: boolean;
}

export type GameEvent =
  | { type: 'mode'; mode: Mode }
  | { type: 'hit'; kill: boolean; damage: number }
  | { type: 'damage'; amount: number }
  | { type: 'impact'; surface: 'wall' | 'ground'; actor: 'player' | 'boss'; strength: number }
  | { type: 'duel' }
  | { type: 'block'; direction: { x: number; y: number; z: number } }
  | { type: 'toast'; text: string }
  | { type: 'lock'; locked: boolean };

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
    };
  } catch {
    return fallback;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem('hea-settings', JSON.stringify(settings));
  } catch {
    /* Private browsing can disallow storage. */
  }
}
