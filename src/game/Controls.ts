export class Controls {
  readonly touch = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  enabled = false;
  shooting = false;
  shotRequested = false;
  focusRequested = false;
  jumpRequested = false;
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
  private lockedBefore = false;
  private lockPending = false;
  private ignoreMouseUntil = 0;
  private knob: HTMLElement;
  private joystick: HTMLElement;
  constructor(
    readonly canvas: HTMLCanvasElement,
    private onPause: () => void,
    private onSpell: (slot: number) => void,
    private onCycle: () => void,
    private onLock: (locked: boolean) => void,
    private onLockUnavailable: () => void,
  ) {
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
  setEnabled(value: boolean) {
    this.enabled = value;
    this.reset();
    if (!value && document.pointerLockElement === this.canvas) document.exitPointerLock();
  }
  reset() {
    this.keys.clear();
    this.shooting = this.shotRequested = this.focusRequested = this.mouseDown = false;
    this.jumpRequested = this.dashRequested = false;
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
    let x =
      (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) -
      (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0) +
      this.stickX;
    let z =
      (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) -
      (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0) -
      this.stickY;
    const length = Math.hypot(x, z);
    if (length > 1) {
      x /= length;
      z /= length;
    }
    return { x, z };
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
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code))
      e.preventDefault();
    this.keys.add(e.code);
    if (e.repeat) return;
    if (e.code === 'Escape' || e.code === 'KeyP') {
      this.onPause();
      return;
    }
    if (e.code === 'Space') this.jumpRequested = true;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.dashRequested = true;
    if (e.code === 'KeyE') this.focusRequested = true;
    if (e.code === 'KeyQ' || e.code === 'Tab') this.onCycle();
    if (['Digit1', 'Digit2', 'Digit3'].includes(e.code)) this.onSpell(Number(e.code.at(-1)) - 1);
  }
  private bindTouch() {
    const joystick = this.joystick,
      look = document.querySelector<HTMLElement>('#touch-look')!;
    joystick.addEventListener('pointerdown', (e) => {
      if (!this.enabled || this.stickPointer !== null) return;
      e.preventDefault();
      e.stopPropagation();
      this.stickPointer = e.pointerId;
      const rect = joystick.getBoundingClientRect();
      this.stickOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
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
      look.setPointerCapture(e.pointerId);
    });
    look.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.lookPointer) return;
      this.dx += (e.clientX - this.lookX) * 1.4;
      this.dy += (e.clientY - this.lookY) * 1.4;
      this.lookX = e.clientX;
      this.lookY = e.clientY;
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
    for (const [id, action] of [
      ['#touch-dash', 'dash'],
      ['#touch-jump', 'jump'],
    ] as const) {
      document.querySelector(id)!.addEventListener('pointerdown', (e) => {
        if (!this.enabled) return;
        e.preventDefault();
        if (action === 'dash') this.dashRequested = true;
        else this.jumpRequested = true;
      });
    }
  }
  private updateStick(e: PointerEvent) {
    const radius = this.joystick.clientWidth * 0.32;
    let x = e.clientX - this.stickOrigin.x,
      y = e.clientY - this.stickOrigin.y;
    const distance = Math.hypot(x, y);
    if (distance > radius) {
      x *= radius / distance;
      y *= radius / distance;
    }
    this.stickX = x / radius;
    this.stickY = y / radius;
    this.knob.style.transform = `translate(${x}px, ${y}px)`;
  }
}
