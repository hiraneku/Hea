import { DEFAULT_BINDINGS, type KeyBindings } from './types';

export class Controls {
  readonly touch = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  enabled = false;
  shooting = false;
  shotRequested = false;
  focusRequested = false;
  /** V (or the touch button) asks for the other camera view. */
  viewRequested = false;
  shieldRequested = false;
  flightRequested = false;
  jumpRequested = false;
  private riseHeld = false;
  private descendHeld = false;
  dashRequested = false;
  private keys = new Set<string>();
  private dx = 0;
  private dy = 0;
  private stickX = 0;
  private stickY = 0;
  private mouseDown = false;
  private lookPointer: number | null = null;
  private stickPointer: number | null = null;
  private lookX = 0;
  private lookY = 0;
  private stickOrigin = { x: 0, y: 0 };
  /** Where the stick's origin sits relative to the pad centre (the pad re-centres under the thumb). */
  private stickShift = { x: 0, y: 0 };
  private lookTime = 0;
  private lockedBefore = false;
  private lockPending = false;
  private ignoreMouseUntil = 0;
  private knob: HTMLElement;
  private joystick: HTMLElement;
  /** The remappable keyboard actions; the settings panel replaces them live. */
  private bindings: KeyBindings;
  constructor(
    readonly canvas: HTMLCanvasElement,
    private onPause: () => void,
    private onSpell: (slot: number) => void,
    private onCycle: () => void,
    private onLock: (locked: boolean) => void,
    private onLockUnavailable: () => void,
    bindings: KeyBindings = DEFAULT_BINDINGS,
  ) {
    this.bindings = { ...bindings };
    this.knob = document.querySelector('#stick-knob')!;
    this.joystick = document.querySelector('#joystick')!;
    window.addEventListener('keydown', (e) => this.keydown(e));
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    window.addEventListener('mousemove', (e) => {
      if (!this.enabled || this.touch || performance.now() < this.ignoreMouseUntil) return;
      // Pointer-lock cursor warps can report a whole-screen delta on the first event.
      if (Math.abs(e.movementX) > 180 || Math.abs(e.movementY) > 180) return;
      if (document.pointerLockElement === canvas || this.mouseDown) {
        this.dx += e.movementX;
        this.dy += e.movementY;
      }
    });
    canvas.addEventListener('pointerdown', (e) => {
      if (!this.enabled || this.touch) return;
      if (e.button === 0) {
        this.shooting = true;
        this.shotRequested = true;
        this.mouseDown = true;
      }
      if (e.button === 2) this.focusRequested = true;
      this.requestLock();
    });
    window.addEventListener('pointerup', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (e.button === 0) {
        this.shooting = false;
        this.mouseDown = false;
      }
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('pointerlockchange', () => {
      const locked = document.pointerLockElement === canvas;
      this.dx = this.dy = 0;
      this.ignoreMouseUntil = performance.now() + 150;
      this.onLock(locked);
      if (!locked && this.lockedBefore && this.enabled) this.onPause();
      this.lockedBefore = locked;
    });
    document.addEventListener('pointerlockerror', () => {
      this.lockPending = false;
      if (this.enabled) this.onLockUnavailable();
    });
    window.addEventListener('blur', () => {
      this.reset();
      if (this.enabled) this.onPause();
    });
    this.bindTouch();
  }
  /** New bindings take effect at once, including mid-duel. */
  setBindings(bindings: KeyBindings) {
    this.bindings = { ...bindings };
    // A key held under the old map must not stick under the new one.
    this.keys.clear();
  }
  setEnabled(value: boolean) {
    this.enabled = value;
    this.reset();
    if (!value && document.pointerLockElement === this.canvas) document.exitPointerLock();
  }
  reset() {
    this.keys.clear();
    this.shieldRequested = this.flightRequested = this.jumpRequested = false;
    this.shooting = this.shotRequested = this.focusRequested = this.mouseDown = false;
    this.viewRequested = false;
    this.riseHeld = this.descendHeld = this.dashRequested = false;
    document
      .querySelectorAll('#touch-controls button.held')
      .forEach((button) => button.classList.remove('held'));
    this.dx = this.dy = this.stickX = this.stickY = 0;
    this.stickPointer = this.lookPointer = null;
    this.knob.style.transform = '';
    this.joystick.classList.remove('engaged');
  }
  requestLock() {
    if (
      this.touch ||
      !this.enabled ||
      document.pointerLockElement === this.canvas ||
      this.lockPending
    )
      return;
    if (!this.canvas.requestPointerLock) {
      this.onLockUnavailable();
      return;
    }
    this.lockPending = true;
    this.ignoreMouseUntil = performance.now() + 150;
    try {
      Promise.resolve(this.canvas.requestPointerLock())
        .catch(() => {
          if (this.enabled) this.onLockUnavailable();
        })
        .finally(() => {
          this.lockPending = false;
        });
    } catch {
      this.lockPending = false;
      this.onLockUnavailable();
    }
  }
  movement() {
    const b = this.bindings;
    let x =
      (this.keys.has(b.right) || this.keys.has('ArrowRight') ? 1 : 0) -
      (this.keys.has(b.left) || this.keys.has('ArrowLeft') ? 1 : 0) +
      this.stickX;
    let z =
      (this.keys.has(b.forward) || this.keys.has('ArrowUp') ? 1 : 0) -
      (this.keys.has(b.back) || this.keys.has('ArrowDown') ? 1 : 0) -
      this.stickY;
    const length = Math.hypot(x, z);
    if (length > 1) {
      x /= length;
      z /= length;
    }
    const lift =
      (this.keys.has(b.rise) || this.riseHeld ? 1 : 0) -
      (this.keys.has(b.descend) || this.descendHeld ? 1 : 0);
    return { x, z, lift };
  }
  look() {
    const result = { x: this.dx, y: this.dy };
    this.dx = this.dy = 0;
    return result;
  }
  private keydown(e: KeyboardEvent) {
    if (
      !this.enabled ||
      (e.target instanceof HTMLElement &&
        ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName))
    )
      return;
    if (
      [
        'Space',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Tab',
        this.bindings.rise,
      ].includes(e.code)
    )
      e.preventDefault();
    this.keys.add(e.code);
    if (e.repeat) return;
    if (e.code === 'Escape' || e.code === 'KeyP') {
      this.onPause();
      return;
    }
    const b = this.bindings;
    if (e.code === b.dash || e.code === 'ShiftLeft' || e.code === 'ShiftRight')
      this.dashRequested = true;
    if (e.code === b.focus) this.focusRequested = true;
    if (e.code === b.view) this.viewRequested = true;
    if (e.code === b.shield) this.shieldRequested = true;
    if (e.code === b.flight) this.flightRequested = true;
    if (e.code === b.rise) this.jumpRequested = true;
    if (e.code === b.cycle || e.code === 'Tab') this.onCycle();
    // Spell slots: the remappable binding first, the number row as a fixed secondary.
    const slots = [b.slot1, b.slot2, b.slot3, b.slot4];
    const bound = slots.indexOf(e.code);
    if (bound >= 0) this.onSpell(bound);
    else if (['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code))
      this.onSpell(Number(e.code.at(-1)) - 1);
  }
  private bindTouch() {
    const joystick = this.joystick,
      look = document.querySelector<HTMLElement>('#touch-look')!;
    joystick.addEventListener('pointerdown', (e) => {
      if (!this.enabled || this.stickPointer !== null) return;
      e.preventDefault();
      e.stopPropagation();
      this.stickPointer = e.pointerId;
      const rect = joystick.getBoundingClientRect(),
        cx = rect.left + rect.width / 2,
        cy = rect.top + rect.height / 2;
      // The stick's neutral point is wherever the thumb lands (within the inner part of the
      // pad), so the first touch is not already a push in some direction.
      const reach = rect.width * STICK.recentre;
      this.stickShift = {
        x: Math.max(-reach, Math.min(reach, e.clientX - cx)),
        y: Math.max(-reach, Math.min(reach, e.clientY - cy)),
      };
      this.stickOrigin = { x: cx + this.stickShift.x, y: cy + this.stickShift.y };
      joystick.setPointerCapture(e.pointerId);
      joystick.classList.add('engaged');
      this.updateStick(e);
    });
    joystick.addEventListener('pointermove', (e) => {
      if (e.pointerId === this.stickPointer) this.updateStick(e);
    });
    const clearStick = (e: PointerEvent) => {
      if (e.pointerId !== this.stickPointer) return;
      this.stickPointer = null;
      this.stickX = this.stickY = 0;
      this.stickShift = { x: 0, y: 0 };
      this.knob.style.transform = '';
      joystick.classList.remove('engaged');
    };
    joystick.addEventListener('pointerup', clearStick);
    joystick.addEventListener('pointercancel', clearStick);
    joystick.addEventListener('lostpointercapture', clearStick);
    look.addEventListener('pointerdown', (e) => {
      if (!this.enabled || this.lookPointer !== null) return;
      this.lookPointer = e.pointerId;
      this.lookX = e.clientX;
      this.lookY = e.clientY;
      this.lookTime = e.timeStamp;
      look.setPointerCapture(e.pointerId);
    });
    look.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.lookPointer) return;
      const mx = e.clientX - this.lookX,
        my = e.clientY - this.lookY,
        elapsed = Math.max(4, e.timeStamp - this.lookTime);
      this.lookTime = e.timeStamp;
      this.lookX = e.clientX;
      this.lookY = e.clientY;
      // Slow drags stay fine for aiming; a flick turns further (gain rises with finger speed).
      const speed = Math.hypot(mx, my) / elapsed,
        gain = LOOK.base + Math.min(LOOK.flick, speed * LOOK.flickRate);
      this.dx += mx * gain;
      this.dy += my * gain;
    });
    const clearLook = (e: PointerEvent) => {
      if (e.pointerId === this.lookPointer) this.lookPointer = null;
    };
    look.addEventListener('pointerup', clearLook);
    look.addEventListener('pointercancel', clearLook);
    look.addEventListener('lostpointercapture', clearLook);
    const hold = (id: string, setter: (active: boolean) => void) => {
      const button = document.querySelector<HTMLElement>(id)!;
      button.addEventListener('pointerdown', (e) => {
        if (!this.enabled) return;
        e.preventDefault();
        e.stopPropagation();
        button.setPointerCapture(e.pointerId);
        setter(true);
        button.classList.add('held');
      });
      const release = () => {
        setter(false);
        button.classList.remove('held');
      };
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
      button.addEventListener('contextmenu', (e) => e.preventDefault());
    };
    hold('#touch-fire', (value) => {
      this.shooting = value;
      if (value) this.shotRequested = true;
    });
    document.querySelector('#touch-focus')!.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      this.focusRequested = true;
    });
    document.querySelector('#touch-view')!.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      this.viewRequested = true;
    });
    hold('#touch-rise', (value) => {
      this.riseHeld = value;
      if (value) this.jumpRequested = true;
    });
    hold('#touch-descend', (value) => {
      this.descendHeld = value;
    });
    for (const [id, request] of [
      ['#shield-toggle', 'shieldRequested'],
      ['#flight-toggle', 'flightRequested'],
    ] as const)
      document.querySelector(id)!.addEventListener('pointerdown', (e) => {
        if (!this.enabled) return;
        e.preventDefault();
        e.stopPropagation();
        this[request] = true;
      });
    document.querySelector('#touch-dash')!.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      this.dashRequested = true;
    });
  }

  private updateStick(e: PointerEvent) {
    const radius = this.joystick.clientWidth * STICK.throw;
    let x = e.clientX - this.stickOrigin.x,
      y = e.clientY - this.stickOrigin.y;
    const distance = Math.hypot(x, y);
    if (distance > radius) {
      x *= radius / distance;
      y *= radius / distance;
    }
    const axes = stickResponse(x / radius, y / radius);
    this.stickX = axes.x;
    this.stickY = axes.y;
    this.knob.style.transform = `translate(${this.stickShift.x + x}px, ${this.stickShift.y + y}px)`;
  }
}

/** Touch stick geometry: throw radius and re-centre reach as fractions of the pad width. */
export const STICK = { throw: 0.36, recentre: 0.2, deadZone: 0.14, curve: 1.45 } as const;
/** Touch look: px of camera turn per px of finger travel, rising with finger speed (px/ms). */
export const LOOK = { base: 1.25, flick: 1.1, flickRate: 0.55 } as const;
/**
 * Radial dead zone and a gentle power curve: a resting thumb does not creep, small nudges are
 * precise, and full deflection still reaches full speed in every direction.
 */
export function stickResponse(x: number, y: number): { x: number; y: number } {
  const distance = Math.hypot(x, y);
  if (distance <= STICK.deadZone) return { x: 0, y: 0 };
  const t = Math.min(1, (distance - STICK.deadZone) / (1 - STICK.deadZone)),
    magnitude = Math.pow(t, STICK.curve);
  return { x: (x / distance) * magnitude, y: (y / distance) * magnitude };
}
