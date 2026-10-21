import { test, expect, type Page } from '@playwright/test';
import { CAMERA_RANGES, SPELLS, type Snapshot } from '../../src/game/types';
import type { Game } from '../../src/game/Game';
import { ATTACKS, DUEL, NOVA_CHARGE, PRISMA, ringDistance } from '../../src/game/combat';
import { ARENA, BOSS, FLIGHT } from '../../src/game/config';
import { beside } from '../../src/game/layout';

declare global {
  interface Window {
    /** Counts the "dry cast" dips the HUD applied, for the test that watches one. */
    __drySeen: number;
    __HEA_DEBUG__: {
      snapshot(): Snapshot;
      diagnostics(): Game['diagnostics'];
      harness: ReturnType<Game['testHarness']>;
    };
  }
}
const state = (page: Page) => page.evaluate(() => window.__HEA_DEBUG__.snapshot());
async function load(page: Page, reducedEffects = true) {
  await page.addInitScript((reducedEffects) => {
    localStorage.setItem(
      'hea-settings',
      JSON.stringify({ quality: 'low', sound: false, reducedEffects }),
    );
    HTMLCanvasElement.prototype.requestPointerLock = () =>
      Promise.reject(new Error('Test iframe: pointer lock unavailable'));
  }, reducedEffects);
  await page.goto('/?test');
  await expect(page.locator('#boot')).toBeHidden({ timeout: 30_000 });
  await expect(page.locator('#start-button')).toBeVisible();
}
async function scenario(page: Page, name: string) {
  await page.evaluate((name) => {
    const h = window.__HEA_DEBUG__.harness!;
    h.freeze(true);
    h.scenario(name);
  }, name);
}
async function step(page: Page, seconds: number) {
  await page.evaluate((s) => window.__HEA_DEBUG__.harness!.step(s), seconds);
}

test('one-boss menu, settings, guide, reference and live demo', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await load(page);
  expect(await page.evaluate(() => window.__HEA_DEBUG__.diagnostics().bossCount)).toBe(1);
  expect(await page.locator('h1').evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(
    true,
  );
  await page.locator('#settings-button').click();
  await page.locator('#quality').selectOption('high');
  await page.locator('#quality').selectOption('low');
  // The performance readout is opt-in: off, the clock line is just the frame rate; on, it
  // carries the measured frame time, the draw calls and the render scale.
  await expect(page.locator('#hud-fps')).toHaveText(/^\d+ FPS$/);
  await page.locator('#perf-hud').check();
  await expect(page.locator('#hud-fps')).toHaveText(/\d+ MS · \d+ DC · \d+K TRI · ×[\d.]+$/);
  await page.locator('#perf-hud').uncheck();
  await expect(page.locator('#hud-fps')).toHaveText(/^\d+ FPS$/);
  await page.locator('#panel-done').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('hea-settings')!).perfHud)).toBe(
    false,
  );
  await page.locator('#help-button').click();
  await expect(page.getByRole('dialog')).toContainText('Aegis');
  await expect(page.getByRole('dialog')).not.toContainText(/gelombang/i);
  await page.locator('#mobile-tab').click();
  await expect(page.locator('#mobile-guide')).toBeVisible();
  await page.locator('#desktop-tab').click();
  await expect(page.locator('#desktop-guide')).toBeVisible();
  await page.locator('#panel-done').click();
  await page.locator('#reference-button').click();
  await expect(page.locator('video')).toBeVisible();
  await page.locator('#panel-close').click();
  await page.locator('#demo-button').click();
  await expect(page.locator('#demo-ui')).toBeVisible();
  expect((await state(page)).mode).toBe('demo');
  await page.locator('#demo-exit').click();
  expect((await state(page)).mode).toBe('menu');
  expect(errors).toEqual([]);
});

test('a slow machine loses resolution before it loses its shadows', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await load(page);
  await page.locator('#settings-button').click();
  await page.locator('#quality').selectOption('high');
  await page.locator('#panel-done').click();
  // Freeze the duel: the live loop would keep feeding the ladder, and this test drives it by hand.
  await scenario(page, 'nova');
  const perf = () => page.evaluate(() => window.__HEA_DEBUG__.diagnostics().perf);
  const windows = (ms: number, count: number, reset = false) =>
    page.evaluate(
      ({ ms, count, reset }) => window.__HEA_DEBUG__.harness!.frameBudget(ms, count, reset),
      { ms, count, reset },
    );
  // The machine running this test is slow enough to have moved the ladder already, so start from
  // the top rung on purpose and watch it from there.
  await windows(0, 0, true);
  const start = await perf();
  expect(start.adaptiveStep).toBe(0);
  // Frames wobbling around 60 fps must not move the ladder.
  await windows(16, 6);
  expect((await perf()).adaptiveStep).toBe(0);
  // A machine that cannot hold 60 fps gives up pixels first: the ratio drops while the tier
  // — shadows, bloom — stays exactly where the player put it.
  await windows(35, 4);
  const late = await perf();
  expect(late.adaptiveStep).toBeGreaterThan(0);
  expect(late.resolutionScale).toBeLessThan(1);
  expect(late.pixelRatio).toBeLessThan(start.pixelRatio);
  expect(late.shadows).toBe(true);
  expect(late.bloom).toBe(true);
  expect(await page.evaluate(() => window.__HEA_DEBUG__.diagnostics().lowQuality)).toBe(false);
  // Headroom is given straight back, one rung at a time.
  await windows(8, 24);
  const recovered = await perf();
  expect(recovered.adaptiveStep).toBeLessThan(late.adaptiveStep);
  expect(recovered.pixelRatio).toBeGreaterThan(late.pixelRatio);
});

test('desktop controls: flight, dash, focus, shooting, pause and reset', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await load(page);
  await page.locator('#start-button').click();
  await expect(page.locator('.boss-hud')).toBeVisible();
  await page.keyboard.press('KeyE');
  await expect.poll(async () => (await state(page)).lockedOn).toBe(true);
  await page.mouse.click(550, 350);
  await expect.poll(async () => (await state(page)).energy).toBeLessThan(100);
  await page.keyboard.down('KeyW');
  await expect.poll(async () => (await state(page)).position.z).toBeLessThan(23.4);
  await page.keyboard.up('KeyW');
  await page.keyboard.press('ShiftLeft');
  await expect.poll(async () => (await state(page)).dash).toBeLessThan(1);
  const takeoff = (await state(page)).position.y;
  await page.keyboard.down('Space');
  await expect.poll(async () => (await state(page)).position.y).toBeGreaterThan(takeoff + 0.6);
  await page.keyboard.up('Space');
  await page.keyboard.press('Digit2');
  await expect(page.locator('[data-spell="1"]')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('KeyP');
  await expect(page.locator('#resume-button')).toBeVisible();
  const paused = (await state(page)).elapsed;
  await page.waitForTimeout(200);
  expect((await state(page)).elapsed).toBe(paused);
  await page.locator('#pause-settings').click();
  await page.locator('#panel-done').click();
  await page.locator('#resume-button').click();
  await page.keyboard.press('KeyR');
  const reset = await state(page);
  expect(reset.health).toBe(100);
  expect(reset.boss.health).toBe(DUEL.bossHealth);
  expect(reset.wallsBroken).toBe(0);
  expect('wave' in reset).toBe(false);
  expect(errors).toEqual([]);
});

test('mobile: simultaneous movement and casting, camera focus, landscape and reset', async ({
  page,
  context,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await load(page);
  await page.locator('#start-button').tap();
  await expect(page.locator('#touch-controls')).toBeVisible();
  for (const id of [
    '#joystick',
    '#touch-fire',
    '#touch-dash',
    '#touch-rise',
    '#touch-descend',
    '#touch-focus',
    '#touch-view',
    '#shield-toggle',
    '#flight-toggle',
  ]) {
    const b = (await page.locator(id).boundingBox())!;
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(390);
    expect(b.y + b.height).toBeLessThanOrEqual(844);
  }
  const cdp = await context.newCDPSession(page),
    stick = (await page.locator('#joystick').boundingBox())!,
    fire = (await page.locator('#touch-fire').boundingBox())!;
  const x = stick.x + stick.width / 2,
    y = stick.y + stick.height / 2,
    fx = fire.x + fire.width / 2,
    fy = fire.y + fire.height / 2;
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      { id: 1, x, y },
      { id: 2, x: fx, y: fy },
    ],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [
      { id: 1, x, y: y - 32 },
      { id: 2, x: fx, y: fy },
    ],
  });
  await expect.poll(async () => (await state(page)).position.z).toBeLessThan(23.3);
  await expect.poll(async () => (await state(page)).boss.health).toBeLessThan(DUEL.bossHealth);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ id: 3, x: 285, y: 335 }],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ id: 3, x: 320, y: 340 }],
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  // Small camera corrections retain lock; a deliberate large look releases it.
  await expect.poll(async () => (await state(page)).lockedOn).toBe(true);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ id: 4, x: 350, y: 335 }],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ id: 4, x: 40, y: 335 }],
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(async () => (await state(page)).lockedOn).toBe(false);
  await page.locator('#touch-focus').tap();
  await expect.poll(async () => (await state(page)).lockedOn).toBe(true);
  await page.locator('#touch-dash').tap();
  await expect.poll(async () => (await state(page)).dash).toBeLessThan(1);
  const rise = (await page.locator('#touch-rise').boundingBox())!,
    altitude = (await state(page)).position.y;
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ id: 4, x: rise.x + rise.width / 2, y: rise.y + rise.height / 2 }],
  });
  await expect.poll(async () => (await state(page)).position.y).toBeGreaterThan(altitude + 0.6);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('.boss-hud')).toBeVisible();
  const b = (await page.locator('#touch-fire').boundingBox())!;
  expect(b.y + b.height).toBeLessThanOrEqual(390);
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.freeze(true));
  for (const width of [360, 320]) {
    await page.setViewportSize({ width, height: 780 });
    const slots = (await page.locator('.spell-slots').boundingBox())!,
      rise = (await page.locator('#touch-rise').boundingBox())!;
    expect(rise.x).toBeGreaterThan(slots.x + slots.width);
    expect(rise.width).toBeGreaterThanOrEqual(44);
  }
  await page.locator('#pause-button').tap();
  await page.locator('#restart-button').tap();
  expect((await state(page)).health).toBe(100);
  expect(errors).toEqual([]);
});

test('Aegis toggles without cooldown and keeps rear/cover exclusions', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'shield');
  await step(page, 0.12);
  expect((await state(page)).shield.blocked).toBe(3);
  expect((await state(page)).health).toBe(100);
  await expect(page.locator('#shield-state')).toHaveText('ON');
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.incoming('back'));
  await step(page, 0.25);
  expect((await state(page)).health).toBeLessThan(100);
  expect((await state(page)).shield.blocked).toBe(3);
  await scenario(page, 'flight');
  await page.locator('#shield-toggle').tap();
  await step(page, 0.01);
  expect((await state(page)).shield.enabled).toBe(false);
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.incoming());
  await step(page, 0.3);
  expect((await state(page)).health).toBeLessThan(100);
  expect((await state(page)).shield.blocked).toBe(0);
  await page.locator('#shield-toggle').tap();
  await step(page, 0.01);
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.incoming());
  // The player is still recoiling away faster than this shot; wait for actual danger, not a shield timer.
  expect((await state(page)).shield.enabled).toBe(true);
  await step(page, 0.7);
  expect((await state(page)).shield.blocked).toBe(1);
  await step(page, 5);
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.incoming());
  await step(page, 0.2);
  expect((await state(page)).shield.blocked).toBe(2);
  await scenario(page, 'cover');
  await step(page, 0.7);
  expect((await state(page)).health).toBe(100);
  expect((await state(page)).shield.blocked).toBe(0);
});

test('a hit launches the player through real wall collision; reset restores the arena', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'wall');
  await step(page, 1.2);
  const s = await state(page),
    d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(s.health).toBeLessThan(100);
  expect(s.position.x).toBeLessThan(beside('cover', 'east', 1.3, 0)[0] - 4.2);
  expect(s.wallsBroken).toBeGreaterThan(0);
  expect(s.impacts).toBeGreaterThan(0);
  expect(d.lastImpact?.surface).toBe('wall');
  // The ray runs along the launch line, through the hole the body punched into the dark block.
  const ray: [number[], number[]] = [
    beside('cover', 'east', 0.4, 1),
    beside('cover', 'east', -8.6, 1),
  ];
  expect(
    await page.evaluate((ray) => window.__HEA_DEBUG__.harness!.wallRay(ray[0], ray[1]), ray),
  ).toBeNull();
  await page.locator('#pause-button').tap();
  await page.locator('#restart-button').tap();
  const reset = await state(page);
  expect(reset.wallsBroken).toBe(0);
  expect(reset.craters).toBe(0);
  expect(reset.health).toBe(100);
  expect(
    await page.evaluate((ray) => window.__HEA_DEBUG__.harness!.wallRay(ray[0], ray[1]), ray),
  ).not.toBeNull();
});

test('ground slam deforms terrain, produces collision impact, respects comfort mode', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'ground');
  // Comfort mode keeps the impact frame to the calm paper beat: no inverted flash.
  await step(page, 0.18);
  let d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.impactFrame.active).toBe(true);
  expect(d.impactFrame.phase).toBe('paper-again');
  await step(page, 1.12);
  const s = await state(page);
  expect(s.craters).toBeGreaterThan(0);
  expect(s.impacts).toBeGreaterThan(0);
  expect(s.position.y).toBeGreaterThanOrEqual(
    await page.evaluate(() => window.__HEA_DEBUG__.harness!.groundAt(0, 24)),
  );
  expect(await page.evaluate(() => window.__HEA_DEBUG__.harness!.groundAt(0, 24))).toBeLessThan(
    -0.3,
  );
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.lastImpact?.surface).toBe('ground');
  expect(d.impactFrame.active).toBe(false);
});

test('fire that reaches the ground leaves scorch marks that fade out within seconds', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'scorch');
  await step(page, 1.4);
  let d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.particles.scorches).toBe(6);
  // Bolts and seekers burn the surface without cratering it (only the hammer digs).
  expect((await state(page)).craters).toBe(0);
  await step(page, 9);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.particles.scorches).toBe(0);
});

test('boss uses all patterns, missile guidance, victory and defeat end the duel without respawning', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'patterns');
  const missilesAt =
    1 + ATTACKS.fire.tell + ATTACKS.fire.duration + ATTACKS.fire.recovery + ATTACKS.missiles.tell;
  await step(page, missilesAt + 0.44);
  let d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.attacksFired.fire).toBe(ATTACKS.fire.shots);
  expect(d.attacksFired.missile).toBeGreaterThan(0);
  expect((await state(page)).boss.distance).toBeGreaterThan(12);
  expect(d.missiles.length).toBeGreaterThan(0);
  const velocity = d.missiles[0].velocity;
  await step(page, 0.2);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.missiles.length).toBeGreaterThan(0);
  expect(d.missiles[0].velocity).not.toEqual(velocity);
  await step(page, 6);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.attacksFired.hammer).toBeGreaterThan(0);
  expect(d.bossCount).toBe(1);
  await scenario(page, 'victory');
  await page.locator('#touch-fire').tap();
  await step(page, 0.1);
  await step(page, 1.4);
  expect((await state(page)).mode).toBe('victory');
  await expect(page.locator('#panel-title')).toHaveText('IGNIS TUMBANG.');
  await step(page, 20);
  expect((await state(page)).boss.alive).toBe(false);
  expect((await state(page)).mode).toBe('victory');
  await page.locator('#restart-button').tap();
  await scenario(page, 'defeat');
  await step(page, 3);
  expect((await state(page)).mode).toBe('gameover');
  await expect(page.locator('#panel-title')).toHaveText('DUEL BELUM USAI.');
});

test('Prisma damages the boss and Nova launches it into destructible cover', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'nova');
  await page.locator('[data-spell="1"]').tap();
  await page.locator('#touch-fire').tap();
  await step(page, 0.3);
  expect((await state(page)).boss.health).toBe(DUEL.bossHealth - SPELLS[1].damage);
  expect((await state(page)).impacts).toBe(0);
  await scenario(page, 'nova');
  await page.locator('#touch-fire').tap();
  await step(page, 1);
  const s = await state(page),
    d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(s.boss.health).toBe(DUEL.bossHealth - 86);
  expect(s.wallsBroken).toBeGreaterThan(0);
  expect(s.impacts).toBeGreaterThan(0);
  expect(d.lastImpact?.actor).toBe('boss');
});

test('flight holds altitude, descends smoothly, and crosses the old map boundary', async ({
  page,
  context,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'flight');
  const cdp = await context.newCDPSession(page),
    rise = (await page.locator('#touch-rise').boundingBox())!,
    fall = (await page.locator('#touch-descend').boundingBox())!;
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ id: 1, x: rise.x + rise.width / 2, y: rise.y + rise.height / 2 }],
  });
  await step(page, 1);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await step(page, 1.5);
  const hover = await state(page);
  expect(hover.position.y).toBeGreaterThan(9);
  expect(hover.flight.phase).toBe('hover');
  await step(page, 1.5);
  expect(Math.abs((await state(page)).position.y - hover.position.y)).toBeLessThan(0.06);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ id: 2, x: fall.x + fall.width / 2, y: fall.y + fall.height / 2 }],
  });
  await step(page, 0.8);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await step(page, 0.5);
  expect((await state(page)).position.y).toBeLessThan(hover.position.y - 5);
  // Fly above the towers, then travel past the previous ±47m movement clamp.
  await page.keyboard.down('Space');
  await step(page, 5.5);
  await page.keyboard.up('Space');
  await step(page, 0.8);
  expect((await state(page)).position.y).toBeLessThan(ARENA.ceiling + 0.5);
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.face(Math.PI));
  await page.keyboard.down('KeyW');
  await step(page, 4.8);
  await page.keyboard.up('KeyW');
  expect((await state(page)).position.z).toBeGreaterThan(70);
  const arena = (await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).arena;
  expect(arena.size).toBe(ARENA.halfSize * 2);
  // 25 monoliths (the slab's floor plate included) plus the low cover that found a clear spot.
  expect(arena.buildings).toBeGreaterThanOrEqual(25 + 10);
  expect(arena.buildings).toBeLessThanOrEqual(25 + 26);
});

test('close spell seeker connects; the solar sphere triggers a larger directional shield', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'missile-near');
  await step(page, 0.9);
  expect((await state(page)).health).toBe(84);
  expect((await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).contacts).toBe(1);
  await scenario(page, 'shield');
  await step(page, 0.12);
  const small = (await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).lastBlock!.scale;
  await scenario(page, 'shield-large');
  await step(page, 0.2);
  const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect((await state(page)).shield.blocked).toBe(1);
  expect((await state(page)).health).toBe(100);
  expect(d.lastBlock!.scale).toBeGreaterThan(small * 1.8);
});

test('contact freezes positions BEFORE launch, both for player hits and Nova on the boss', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'contact');
  await step(page, 0.03);
  let d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.playerReaction).toBe('contact');
  expect(d.hitPause).toBeGreaterThan(0);
  const contact = (await state(page)).position;
  await step(page, 0.03);
  expect((await state(page)).position).toEqual(contact);
  expect((await state(page)).impacts).toBe(0);
  await step(page, 0.16);
  expect((await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).playerReaction).toBe(
    'launch',
  );
  expect((await state(page)).position.z).toBeLessThan(contact.z - 2);
  await step(page, 0.35);
  expect((await state(page)).position.z).toBeLessThan(contact.z - 9);
  await scenario(page, 'nova');
  const before = (await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).bossPosition;
  await page.locator('#touch-fire').tap();
  await step(page, 0.008);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.bossReaction).toBe('contact');
  expect(d.bossPosition).toEqual(before);
  await step(page, 0.045);
  expect((await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).bossPosition).toEqual(
    before,
  );
  // Heavy contact holds for 0.15 s, then releases in slow motion before full speed returns.
  await step(page, 0.08);
  expect((await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).bossPosition).toEqual(
    before,
  );
  await step(page, 0.2);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.timeScale).toBeGreaterThan(0);
  expect(d.timeScale).toBeLessThan(0.8);
  expect(d.bossPosition[2]).toBeLessThan(before[2] - 3);
  await step(page, 0.3);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.timeScale).toBe(1);
  expect(d.bossPosition[2]).toBeLessThan(before[2] - 15);
  expect((await state(page)).wallsBroken).toBeGreaterThan(0);
});

test('a fatal Nova still pauses and launches the boss before the victory result', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'nova-finish');
  await page.locator('#touch-fire').tap();
  await step(page, 0.04);
  let d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.bossReaction).toBe('contact');
  expect(d.bossVisible).toBe(true);
  expect((await state(page)).boss.health).toBe(0);
  await step(page, 0.09);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.bossReaction).toBe('contact');
  expect(d.bossVisible).toBe(true);
  await step(page, 0.4);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.bossVisible).toBe(true);
  expect(d.bossReaction).toBe('launch');
  expect(d.bossPosition[2]).toBeLessThan(beside('slab', 'south', 13, 5, 6)[2] - 6);
  await step(page, 2);
  expect((await state(page)).mode).toBe('victory');
  expect((await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).bossVisible).toBe(false);
});

test('dash speed has a smooth boost tail, and shield patches cover separate nearby trajectories, sharing one where lanes overlap', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'flight');
  await page.locator('#touch-dash').tap();
  await step(page, 0.016);
  let d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.dashMotion.strength).toBeLessThan(0.3);
  await step(page, 0.12);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.dashMotion.strength).toBeGreaterThan(0.9);
  await step(page, 0.3);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.dashMotion.strength).toBeGreaterThan(0);
  expect(d.dashMotion.strength).toBeLessThan(0.2);
  expect(d.dashMotion.invulnerable).toBe(false);
  await step(page, 0.1);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.dashMotion.active).toBe(false);
  // No afterimages any more; the burst leaves the motor running hot instead: holding the
  // stick right after it, flight is markedly faster than cruise, then eases back to it.
  expect(d.particles.afterimages).toBe(0);
  expect(d.dashMotion.boost).toBeGreaterThan(FLIGHT.boostDuration - 0.2);
  await page.keyboard.down('KeyW');
  await step(page, 0.4);
  expect((await state(page)).flight.speed).toBeGreaterThan(FLIGHT.speed * 1.3);
  await step(page, FLIGHT.boostDuration);
  expect((await state(page)).flight.speed).toBeLessThan(FLIGHT.speed + 0.5);
  expect((await state(page)).flight.speed).toBeGreaterThan(FLIGHT.speed - 1);
  await page.keyboard.up('KeyW');
  await scenario(page, 'shield-scatter');
  await step(page, 0.2);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect((await state(page)).shield.blocked).toBe(3);
  // Three lanes: the two near each other share a patch, the far-side one is a patch of its own.
  expect(d.shieldPatches.length).toBeGreaterThanOrEqual(2);
  expect(d.shieldPatches.length).toBeLessThanOrEqual(3);
  expect(d.shieldPatches.length + d.patchReuses).toBe(3);
  expect(d.shieldPatches.some((p) => p.offset[0] < -1)).toBe(true);
  // Neighbouring pieces are fitted onto one lattice, edge to edge: no piece covers another.
  expect(d.patchTiling.overlaps).toBe(0);
  expect(d.patchTiling.clusters).toBe(1);
  expect(d.patchTiling.joined).toBeGreaterThanOrEqual(1);
  expect(new Set(d.shieldPatches.map((p) => p.cluster)).size).toBe(1);
  expect(new Set(d.shieldPatches.map((p) => `${p.anchor.q},${p.anchor.r}`)).size).toBe(
    d.shieldPatches.length,
  );
  expect(d.shieldPatches.some((p) => p.offset[1] > 1 || p.offset[0] > 1)).toBe(true);
  for (const p of d.shieldPatches)
    expect(Math.hypot(...p.offset)).toBeLessThanOrEqual(DUEL.shieldReach);
  expect((await state(page)).health).toBe(100);
});

test('a standing shield patch keeps blocking later shots on the same lane instead of stacking', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'shield-line');
  await step(page, 0.03);
  let d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  // The patch is raised ahead of the first bolt, which keeps flying until it really lands on it.
  expect(d.shieldPatches).toHaveLength(1);
  expect(d.shieldPatches[0].hits).toBeLessThanOrEqual(1);
  expect(d.shots.length).toBeGreaterThanOrEqual(2);
  await step(page, 0.12);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect((await state(page)).shield.blocked).toBe(3);
  expect(d.shieldPatches).toHaveLength(1);
  expect(d.shieldPatches[0].hits).toBe(3);
  expect(d.patchReuses).toBe(2);
  expect(d.particles.shieldImpacts).toBe(3);
  await step(page, 0.45);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect((await state(page)).health).toBe(100);
  // Three hits are well within the budget of five: the patch stands, cracked but whole.
  expect(d.patchShatters).toBe(0);
  expect(d.shieldPatches).toHaveLength(1);
  expect(d.patchGaps).toBe(0);
  // A six-bolt burst on one lane: the fifth hit shatters the patch, the sixth gets through the
  // hole, and the body takes it.
  await scenario(page, 'shield-volley');
  await step(page, 1.2);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.patchShatters).toBe(1);
  expect(d.particles.shards).toBeGreaterThanOrEqual(0);
  expect((await state(page)).health).toBe(91);
  expect((await state(page)).shield.blocked).toBe(DUEL.shieldPatchHits);
  expect(d.patchLeaks).toBeGreaterThan(0);
  expect(d.patchGaps).toBeGreaterThanOrEqual(0);
});

test('a body launched into open air rights itself before landing; the boss hunts down a hidden player', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'air-recover');
  await step(page, 1.2);
  let d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.ragdoll.player).toBe(true);
  expect(d.ragdoll.playerPhase).toBe('air');
  await step(page, 0.45);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  // The mid-air recovery is a visible somersault with its own puff, not a snap to upright.
  expect(d.ragdoll.playerAirRecoveries).toBe(1);
  expect(d.ragdoll.playerFlipping).toBe(true);
  expect(d.ragdoll.playerPhase).toBe('recover');
  expect(d.particles.airRecoveries).toBe(1);
  await step(page, 0.45);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.ragdoll.playerFlipping).toBe(false);
  expect(d.ragdoll.player).toBe(false);
  expect((await state(page)).position.y).toBeGreaterThan(28);
  expect(d.groundReactions.filter((r) => r.actor === 'player')).toHaveLength(0);
  await scenario(page, 'far-cover');
  const start = (await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).bossPosition;
  // The map is 600 m now, so the boss starts 204 m out: give the walk the time it needs.
  await step(page, 26);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  const p = (await state(page)).position;
  expect(Math.hypot(d.bossPosition[0] - start[0], d.bossPosition[2] - start[2])).toBeGreaterThan(
    60,
  );
  expect(Math.hypot(d.bossPosition[0] - p.x, d.bossPosition[2] - p.z)).toBeLessThan(40);
  expect(d.bossLane.mode).not.toBe('blocked');
  // The same chase from the opposite corner, through the ring gaps and over the low cover.
  await scenario(page, 'far-north');
  // 240 m from the player this time: the same longer walk as far-cover, on a 600 m map.
  await step(page, 26);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  const q = (await state(page)).position;
  expect(Math.hypot(d.bossPosition[0] - q.x, d.bossPosition[2] - q.z)).toBeLessThan(40);
  // Once close it keeps a firing lane open; its orbit may cross behind a monolith for a
  // moment, so sight is sampled over the next few seconds rather than at one instant.
  let sighted = d.bossLane.mode !== 'blocked';
  for (let i = 0; i < 6 && !sighted; i++) {
    await step(page, 0.5);
    d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
    sighted = d.bossLane.mode !== 'blocked';
  }
  expect(sighted).toBe(true);
});

test('fire comes from warmed satellite gates, seekers double, and boss altitude choices vary', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'flight');
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.castBoss('fire'));
  await step(page, 0.03);
  let d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.pendingFire).toBe(1);
  expect(d.fireGates.length).toBeGreaterThan(0);
  expect(d.attacksFired.fire).toBe(0);
  const gate = d.fireGates[0].position;
  await step(page, 0.12);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.attacksFired.fire).toBe(1);
  // The gate orbits the glyph while open: the bolt leaves from where the gate is now, a little
  // way along the ring from where it opened.
  const origin = d.shots.find((s) => s.kind === 'fire')!.origin,
    away = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  // The gates keep orbiting after the shot, so the live gate has drifted a little by now.
  expect(away(origin, d.fireGates[0].position)).toBeLessThan(0.5);
  expect(away(origin, d.fireOrigins[0].origin)).toBeLessThan(0.8);
  expect(away(d.fireGates[0].position, gate)).toBeGreaterThan(0.05);
  await scenario(page, 'patterns');
  await step(page, 1 + ATTACKS.fire.tell + ATTACKS.fire.duration + 0.15);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.attacksFired.fire).toBe(ATTACKS.fire.shots);
  expect(new Set(d.fireOrigins.map((g) => g.side)).size).toBe(4);
  for (const g of d.fireOrigins)
    expect(Math.hypot(g.local[0], g.local[1] - 0.1)).toBeGreaterThan(1.6);
  await step(page, ATTACKS.fire.recovery + ATTACKS.missiles.tell + ATTACKS.missiles.duration);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.attacksFired.missile).toBe(12);
  expect(d.bossDecisions).toBeGreaterThanOrEqual(3);
});

test('heavy hit and Nova drive real body tumbling, recover smoothly and cancel interrupted casts', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'ragdoll');
  await step(page, 0.18);
  let d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.ragdoll.player).toBe(true);
  const orientation = d.ragdoll.playerOrientation;
  await step(page, 0.9);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.ragdoll.playerOrientation).not.toEqual(orientation);
  expect(d.ragdoll.player).toBe(true);
  await step(page, 8);
  expect((await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).ragdoll.player).toBe(
    false,
  );
  await scenario(page, 'nova');
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.castBoss('fire'));
  await page.locator('#touch-fire').tap();
  await step(page, 0.04);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.ragdoll.boss).toBe(true);
  expect(d.pendingFire).toBe(0);
  expect(d.fireGates).toHaveLength(0);
  const pose = d.ragdoll.bossOrientation;
  await step(page, 0.85);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.ragdoll.bossOrientation).not.toEqual(pose);
  expect(d.attacksFired.fire).toBe(0);
  await page.locator('#pause-button').tap();
  await page.locator('#restart-button').tap();
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.ragdoll.boss).toBe(false);
  expect(d.ragdoll.player).toBe(false);
  expect(d.pendingFire).toBe(0);
});

test('shield echoes stay in world space, vary shape, fade, and do not shield when OFF', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'shield');
  await step(page, 0.1);
  let d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.shieldEchoes).toHaveLength(3);
  expect(new Set(d.shieldEchoes.map((e) => e.pattern)).size).toBe(3);
  const poses = d.shieldEchoes.map((e) => e.position);
  expect(d.shieldPatches.every((p) => Math.hypot(...p.offset) > 2.3)).toBe(true);
  await page.keyboard.down('KeyD');
  await page.locator('#shield-toggle').tap();
  await step(page, 0.55);
  await page.keyboard.up('KeyD');
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.shieldEchoes.map((e) => e.position)).toEqual(poses);
  expect((await state(page)).position.x).toBeGreaterThan(2);
  expect((await state(page)).shield.enabled).toBe(false);
  await step(page, 1.2);
  expect((await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).shieldEchoes).toHaveLength(
    0,
  );
});

test('walk mode restores gravity, double jump and landing; toggles also work on keyboard', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'walk');
  expect((await state(page)).flight.enabled).toBe(false);
  await expect(page.locator('#touch-rise small')).toHaveText('LOMPAT ×2');
  await expect(page.locator('#touch-descend')).toBeHidden();
  await page.locator('#touch-rise').tap();
  await step(page, 0.22);
  const first = (await state(page)).position.y;
  expect(first).toBeGreaterThan(1);
  await page.locator('#touch-rise').tap();
  await step(page, 0.18);
  expect((await state(page)).position.y).toBeGreaterThan(first + 0.8);
  expect((await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).groundJumps).toBe(2);
  await page.locator('#touch-rise').tap();
  await step(page, 0.04);
  expect((await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).groundJumps).toBe(2);
  await step(page, 2);
  expect((await state(page)).position.y).toBeCloseTo(0, 1);
  await page.keyboard.press('KeyF');
  await step(page, 0.6);
  expect((await state(page)).flight.enabled).toBe(true);
  expect((await state(page)).position.y).toBeGreaterThan(0.3);
  await page.keyboard.press('KeyG');
  await step(page, 0.01);
  expect((await state(page)).shield.enabled).toBe(false);
  await page.locator('#flight-toggle').tap();
  await step(page, 1);
  expect((await state(page)).flight.enabled).toBe(false);
  expect((await state(page)).position.y).toBeCloseTo(0, 1);
});

test('first person: V moves the camera into the eyes, hides the body, and hands back to the chase camera when thrown', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop');
  await load(page, false);
  await scenario(page, 'flight');
  await step(page, 0.5);
  const distance = async () => {
    const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
    const [cx, cy, cz] = d.cameraPosition,
      [px, py, pz] = d.playerPosition;
    return { gap: Math.hypot(cx - px, cy - py, cz - pz), avatar: d.avatarVisible, fov: d.fov };
  };
  expect((await state(page)).camera).toBe('third');
  const chase = await distance();
  expect(chase.gap).toBeGreaterThan(4);
  expect(chase.avatar).toBe(true);
  await page.keyboard.press('KeyV');
  await step(page, 0.1);
  expect((await state(page)).camera).toBe('first');
  const eyes = await distance();
  // The eye line sits at the visor, 1.30 m above the physics root — the avatar's head bone is at
  // 0.94 m of its 1.52 m, so this is the eye, not the chin.
  expect(eyes.gap).toBeLessThan(1.6);
  expect(eyes.gap).toBeGreaterThan(1.1);
  expect(eyes.avatar).toBe(false);
  expect(eyes.fov).toBeGreaterThan(chase.fov + 4);
  // Flying forward keeps the eyes with the body.
  await page.keyboard.down('KeyW');
  await step(page, 1);
  await page.keyboard.up('KeyW');
  expect((await distance()).gap).toBeLessThan(1.6);
  // A heavy hit throws the body as a ragdoll: the view steps back behind it until it stands.
  await scenario(page, 'ragdoll');
  await step(page, 0.6);
  expect((await state(page)).camera).toBe('third');
  // The jointed figure stands in for the box while thrown, and the view is well behind it.
  expect((await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).ragdoll.player).toBe(true);
  expect((await distance()).gap).toBeGreaterThan(3);
  await step(page, 9);
  expect((await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).ragdoll.player).toBe(
    false,
  );
  expect((await state(page)).camera).toBe('first');
  // The choice is remembered like any other setting.
  expect(
    JSON.parse((await page.evaluate(() => localStorage.getItem('hea-settings')))!).camera,
  ).toBe('first');
  await page.keyboard.press('KeyV');
  await step(page, 0.1);
  expect((await state(page)).camera).toBe('third');
});

test('solar sphere bores thin slabs, continues into player/ground, but thick walls stop it', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'pierce-player');
  await step(page, 0.6);
  let d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.heavyPenetrations.length).toBeGreaterThan(0);
  expect((await state(page)).health).toBe(71);
  expect((await state(page)).wallsBroken).toBeGreaterThan(0);
  expect(d.heavyPenetrations[0].thickness).toBeLessThanOrEqual(3.2);
  await scenario(page, 'pierce-ground');
  await step(page, 0.7);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.heavyPenetrations.length).toBeGreaterThan(0);
  expect((await state(page)).craters).toBeGreaterThan(0);
  expect(d.shots.filter((s) => s.kind === 'hammer')).toHaveLength(0);
  await scenario(page, 'thick-cover');
  await step(page, 0.8);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.heavyPenetrations).toHaveLength(0);
  expect((await state(page)).health).toBe(100);
  expect(d.shots.filter((s) => s.kind === 'hammer')).toHaveLength(0);
});

test('heavy ragdoll slides without bounce and promptly recovers; walls and sigils remain enlarged', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'ground-skid');
  await step(page, 1.4);
  let d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.ragdoll.playerBounces).toBe(0);
  expect(d.groundReactions.some((r) => r.actor === 'player' && r.bounce === 0)).toBe(true);
  // Being dragged along the ground kicks up a continuous dust-and-grit trail.
  expect(d.ragdoll.playerPhase).toBe('slide');
  expect(d.particles.skids).toBeGreaterThan(5);
  expect(d.particles.dust).toBeGreaterThan(5);
  // ...and ploughs a furrow: one continuous strip of lifted earth along the slide, plus clods.
  expect(d.particles.furrow).toBeGreaterThan(10);
  expect(d.particles.furrows).toBeLessThanOrEqual(2);
  expect(d.particles.clods).toBeGreaterThan(5);
  await step(page, 5);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.ragdoll.playerGroundTravel).toBeGreaterThan(2);
  await step(page, 5);
  expect((await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).ragdoll.player).toBe(
    false,
  );
  await scenario(page, 'patterns');
  await step(page, 2.3);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.fireGates.some((g) => g.radius >= 1)).toBe(true);
  // Fewer, broader blocks: v0.19 trades count for scale — 19 monoliths, every one of them at
  // least 20 m wide and 15 m tall (the widest is 88 m, the tallest 101 m).
  const monoliths = d.walls.filter((w) => w.maxX - w.minX >= 20 && w.top >= 15).length;
  expect(monoliths).toBeGreaterThanOrEqual(18);
  expect(monoliths).toBeLessThanOrEqual(d.walls.length);
  // Plus the low cover (1.5–2.6 m walls) in the gaps between the rings.
  expect(d.walls.length).toBeLessThan(52);
  expect(d.walls.filter((w) => w.top < 3).length).toBeGreaterThanOrEqual(10);
  // The hammer's telegraph follows the (longer) salvo and the (slower) seeker salvo.
  const hammerTell =
    1 +
    ATTACKS.fire.tell +
    ATTACKS.fire.duration +
    ATTACKS.fire.recovery +
    ATTACKS.missiles.tell +
    ATTACKS.missiles.duration +
    ATTACKS.missiles.recovery;
  await step(page, hammerTell + 0.4 - 2.3);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.heavyCircleRadius).toBeGreaterThan(3.4);
});

test('boss holds fire behind thick cover, repositions, and permits a real thin-wall breach', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'sight-thick');
  for (const attack of ['fire', 'missiles', 'hammer', 'vortex'] as const)
    await page.evaluate((a) => window.__HEA_DEBUG__.harness!.castBoss(a), attack);
  await step(page, 0.3);
  let d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.attacksFired).toEqual({ fire: 0, missile: 0, hammer: 0, vortex: 0 });
  expect(d.blockedCasts).toBeGreaterThanOrEqual(4);
  await scenario(page, 'sight-thin');
  expect(await page.evaluate(() => window.__HEA_DEBUG__.harness!.lane('fire').mode)).toBe(
    'blocked',
  );
  expect(await page.evaluate(() => window.__HEA_DEBUG__.harness!.lane('hammer').mode)).toBe(
    'breach',
  );
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.castBoss('hammer'));
  await step(page, 0.6);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.attacksFired.hammer).toBe(1);
  expect(d.heavyPenetrations.length).toBeGreaterThan(0);
  await scenario(page, 'sight-live');
  const before = (await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).bossPosition;
  await step(page, 1);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.bossPosition).not.toEqual(before);
  expect(d.bossDecisions).toBeGreaterThan(1);
});

test('a warmed fire gate cannot shoot after the player moves behind a wall', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'flight');
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.castBoss('fire'));
  await step(page, 0.03);
  expect((await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).pendingFire).toBe(1);
  await page.evaluate(
    ([player, boss]) => window.__HEA_DEBUG__.harness!.place(player, boss),
    [beside('cover', 'east', 6, 6), beside('cover', 'west', 6, 6)],
  );
  await step(page, 0.3);
  const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.pendingFire).toBe(0);
  expect(d.attacksFired.fire).toBe(0);
});

test('a blow shoves the view the way it travels, and a heavy landing drops it', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop');
  // reducedEffects off: the shove is a motion effect and is deliberately silent when they are on.
  await load(page, false);
  await scenario(page, 'contact');
  await page.evaluate(() => {
    const h = window.__HEA_DEBUG__.harness!;
    h.place([0, 0, 24], [0, 0, -10]);
    h.face(0, 0);
    h.step(0.2);
  });
  // A hammer thrown in from the player's left: it travels towards +x, so the eye is shoved that
  // way too — the blow has a direction, not just a size.
  const blow = await page.evaluate(() => {
    const h = window.__HEA_DEBUG__.harness!;
    const before = window.__HEA_DEBUG__.diagnostics().health;
    h.incoming('left', 'hammer');
    const peak = [0, 0, 0];
    let hit = false;
    for (let i = 0; i < 180; i++) {
      h.step(1 / 60);
      const d = window.__HEA_DEBUG__.diagnostics();
      if (d.health < before) hit = true;
      for (let axis = 0; axis < 3; axis++)
        if (Math.abs(d.camera.kick[axis]) > Math.abs(peak[axis])) peak[axis] = d.camera.kick[axis];
      if (hit && Math.hypot(...d.camera.kick) < 0.0005) break;
    }
    return { peak, settled: window.__HEA_DEBUG__.diagnostics().camera.kick, hit };
  });
  expect(blow.hit).toBe(true);
  expect(blow.peak[0]).toBeGreaterThan(0.02);
  // Never enough to throw the frame: the chase camera's cap is six centimetres.
  expect(blow.peak[0]).toBeLessThanOrEqual(0.06 + 1e-6);
  expect(Math.abs(blow.peak[1])).toBeLessThan(0.02);
  expect(Math.abs(blow.peak[2])).toBeLessThan(0.02);
  // And it springs back rather than staying knocked aside.
  expect(Math.hypot(...blow.settled)).toBeLessThan(0.002);

  // Dropping nine metres must be felt; a step off a kerb must not.
  const drops = await page.evaluate(() => {
    const h = window.__HEA_DEBUG__.harness!;
    const drop = (height: number) => {
      h.scenario('walk');
      h.face(0, 0);
      h.place([0, height, 24], [0, 0, -10]);
      let dip = 0;
      for (let i = 0; i < 300; i++) {
        h.step(1 / 60);
        const kick = window.__HEA_DEBUG__.diagnostics().camera.kick;
        if (kick[1] < dip) dip = kick[1];
      }
      const d = window.__HEA_DEBUG__.diagnostics();
      return { dip, landings: d.camera.landings, settled: Math.abs(d.camera.kick[1]) };
    };
    return { high: drop(9), low: drop(0.4) };
  });
  expect(drops.high.landings).toBe(1);
  expect(drops.high.dip).toBeLessThan(-0.06);
  expect(drops.high.dip).toBeGreaterThanOrEqual(-0.08 - 1e-6);
  expect(drops.high.settled).toBeLessThan(0.002);
  expect(drops.low.landings).toBe(0);
  expect(drops.low.dip).toBe(0);
});

test('heavy contact freezes briefly, releases in slow motion with a camera punch, then launches', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page, false);
  await scenario(page, 'player-air');
  await step(page, 0.02);
  const p = (await state(page)).position;
  let d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.hitPause).toBeGreaterThan(0.1);
  expect(d.timeScale).toBe(0);
  expect(d.fov).toBeLessThan(70);
  // The impact frame plays through the freeze in real time: one paper frame, then the negative.
  expect(d.impactFrame.active).toBe(true);
  expect(d.impactFrame.phase).toBe('paper');
  await step(page, 0.09);
  expect((await state(page)).position).toEqual(p);
  expect((await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).impactFrame.phase).toBe(
    'negative',
  );
  // After the 0.15 s freeze the world moves again, but in slow motion that ramps back up.
  await step(page, 0.1);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.hitPause).toBe(0);
  expect(d.timeScale).toBeGreaterThan(0);
  expect(d.timeScale).toBeLessThan(0.6);
  expect(Math.hypot(...d.playerVelocity)).toBeGreaterThan(100);
  const slow = (await state(page)).position;
  expect(slow.z).toBeLessThan(p.z);
  expect(slow.z).toBeGreaterThan(p.z - 3);
  await step(page, 0.4);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.timeScale).toBe(1);
  expect(d.fov).toBeGreaterThan(71);
  expect(d.impactFrame.active).toBe(false);
  expect((await state(page)).position.z).toBeLessThan(p.z - 5);
  await scenario(page, 'nova-air');
  await page.locator('#touch-fire').tap();
  await step(page, 0.008);
  const boss = (await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).bossPosition;
  await step(page, 0.1);
  expect((await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).bossPosition).toEqual(
    boss,
  );
  await step(page, 0.5);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(Math.hypot(...d.bossVelocity)).toBeGreaterThan(100);
  expect(d.bossPosition[2]).toBeLessThan(boss[2] - 5);
});

test('the solar vortex: a seed anchors short of the body, pulls it in, then detonates into a ring of embers', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'shield');
  await step(page, 0.3);
  const start = (await state(page)).position,
    bossHealth = (await state(page)).boss.health;
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.castBoss('vortex'));
  await step(page, 0.05);
  let d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.attacksFired.vortex).toBe(1);
  expect(d.shots.filter((s) => s.kind === 'vortex')).toHaveLength(1);
  expect(d.wells).toHaveLength(0);
  expect(d.pull).toEqual([0, 0, 0]);
  // The seed is not a shot at the body: no patch is raised for it and it is never blocked.
  const blocked = (await state(page)).shield.blocked;
  await step(page, 1.0);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect((await state(page)).shield.blocked).toBe(blocked);
  expect(d.shots.filter((s) => s.kind === 'vortex')).toHaveLength(0);
  expect(d.wells).toHaveLength(1);
  expect(d.wells[0].detonated).toBe(false);
  expect(d.wells[0].age).toBeLessThan(DUEL.vortexPull);
  const well = d.wells[0].position;
  // Anchored in front of the body, roughly at head height, well inside the pull radius.
  expect(Math.hypot(well[0] - start.x, well[2] - start.z)).toBeGreaterThan(1);
  expect(Math.hypot(well[0] - start.x, well[2] - start.z)).toBeLessThan(DUEL.vortexRadius);
  // The body is being drawn towards the core; the pull is a velocity of its own, not a knock.
  expect(Math.hypot(...d.pull)).toBeGreaterThan(0.5);
  const mid = (await state(page)).position;
  const before = Math.hypot(well[0] - start.x, well[2] - start.z),
    after = Math.hypot(well[0] - mid.x, well[2] - mid.z);
  expect(after).toBeLessThan(before);
  expect((await state(page)).health).toBe(100);
  // Detonation: a flat ring of embers, a crater below, and a heavy core hit on a body caught inside.
  await step(page, 1.5);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.wells).toHaveLength(0);
  expect(d.vortexDetonations).toBe(1);
  expect(d.attacksFired.fire).toBeGreaterThanOrEqual(3 + DUEL.vortexEmbers);
  expect(d.vortexCoreHits).toBe(1);
  expect((await state(page)).health).toBe(76);
  expect((await state(page)).boss.health).toBe(bossHealth);
  expect((await state(page)).craters).toBeGreaterThanOrEqual(1);
  await step(page, 1.5);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  // The imparted pull bleeds off once nothing is pulling any more.
  expect(Math.hypot(...d.pull)).toBeLessThan(0.05);
});

test('the fourth attack of the opening is the vortex, and its tell shrinks the ember instead of swelling it', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'patterns');
  const opening =
    ATTACKS.fire.tell +
    1 +
    ATTACKS.fire.duration +
    ATTACKS.fire.recovery +
    ATTACKS.missiles.tell +
    ATTACKS.missiles.duration +
    ATTACKS.missiles.recovery +
    ATTACKS.hammer.tell +
    ATTACKS.hammer.duration +
    ATTACKS.hammer.recovery;
  for (let t = 0; t < opening + 0.4; t += 2) await step(page, Math.min(2, opening + 0.4 - t));
  const s = await state(page);
  expect(s.boss.attack).toBe(ATTACKS.vortex.label);
  expect(s.boss.stage).toBe('telegraph');
  await step(page, ATTACKS.vortex.tell + 0.3);
  const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.attacksFired.vortex + d.blockedCasts).toBeGreaterThanOrEqual(1);
});

test('on foot the boss never falls silent: it keeps casting at a grounded player, and from long range while it can see them', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'walk-live');
  let longestBlock = 0,
    shots = 0;
  const fired = (d: Game['diagnostics']) =>
    d.attacksFired.fire + d.attacksFired.missile + d.attacksFired.hammer + d.attacksFired.vortex;
  for (let i = 0; i < 8; i++) {
    await step(page, 5);
    const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
    longestBlock = Math.max(longestBlock, d.bossBlockedTime);
    shots = fired(d);
  }
  // Forty seconds against a standing target: no stretch without a lane, plenty of casting.
  expect(longestBlock).toBeLessThan(4.5);
  expect(shots).toBeGreaterThan(20);
  expect((await state(page)).health).toBe(100);
  // Long range: a boss that can see the player while it winds up a spell holds its ground and
  // casts from there — here from 60 m down the open lane — instead of closing in first.
  for (let t = 0; t < 8 && (await state(page)).boss.stage !== 'telegraph'; t += 0.1)
    await step(page, 0.1);
  expect((await state(page)).boss.stage).toBe('telegraph');
  await page.evaluate(() => {
    const h = window.__HEA_DEBUG__.harness!;
    h.place([0, 0, 24], [0, 5, -38]);
    h.face(0, 0);
  });
  const before = fired(await page.evaluate(() => window.__HEA_DEBUG__.diagnostics()));
  let d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  // The boss may first answer with a summon — its constructs hunt in and spit from close
  // by — so wait for a shot that itself left from the far post: only the boss casts those.
  let far: number[] | undefined;
  for (let t = 0; t < 14 && !far; t += 0.25) {
    await step(page, 0.25);
    d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
    far = d.shots.find((s) => Math.hypot(s.origin[0], s.origin[2] - 24) > 40)?.origin;
  }
  expect(fired(d)).toBeGreaterThan(before);
  expect(far).toBeDefined();
});

test('a dash phases through a shot that would have landed, and the near miss is rewarded', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'contact');
  // A bolt three metres ahead, flying at the chest; the dash goes straight through it.
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.incoming('front', 'fire'));
  await page.locator('#touch-dash').tap();
  await step(page, 0.14);
  const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics()),
    s = await state(page);
  expect(d.dashMotion.active).toBe(true);
  expect(d.perfectDodges).toBeGreaterThanOrEqual(1);
  expect(s.health).toBe(100);
  expect(d.contacts).toBe(0);
  // The reward: the next dash is almost ready at once (a 1.65 s cooldown would read ~0.08).
  expect(s.dash).toBeGreaterThan(0.6);
});

test('a thrown player is a jointed figure that crumples, drags and gathers itself back up', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'ragdoll-ground');
  await step(page, 0.45);
  const spans: number[] = [];
  for (let i = 0; i < 6; i++) {
    const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
    expect(d.ragdoll.player).toBe(true);
    const figure = d.ragdoll.playerFigure!;
    expect(figure).not.toBeNull();
    // Head to heel: a real body, never a point nor a stretched chain.
    expect(figure.span).toBeGreaterThan(0.3);
    expect(figure.span).toBeLessThan(1.5);
    // Nothing sinks into the ground.
    const ground = await page.evaluate(
      (p) => window.__HEA_DEBUG__.harness!.groundAt(p[0], p[2]),
      figure.pelvis,
    );
    expect(figure.lowest).toBeGreaterThan(ground - 0.08);
    spans.push(figure.span);
    await step(page, 0.12);
  }
  // The limbs move relative to the trunk: the figure's extent changes as it tumbles.
  expect(Math.max(...spans) - Math.min(...spans)).toBeGreaterThan(0.1);
  let d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.ragdoll.playerFigureSpawns).toBe(1);
  expect(d.ragdoll.playerFigureContacts).toBeGreaterThan(50);
  await step(page, 6);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.ragdoll.player).toBe(false);
  expect(d.ragdoll.playerFigure).toBeNull();
});

test('the solar sphere bursting beside a grounded player still throws them', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'splash');
  await step(page, 0.4);
  const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics()),
    s = await state(page);
  expect(d.splashHits).toBe(1);
  expect(s.health).toBeLessThan(100);
  expect(s.health).toBeGreaterThan(70);
  expect(s.craters).toBeGreaterThan(0);
  expect(d.ragdoll.player).toBe(true);
});

test('Nova charges while the fire button is held: a tap stays the ordinary blast, a full hold pays more for a harder launch, and hits float their damage', async ({
  page,
  context,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'nova');
  const nova = async () => (await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).nova;
  const numbers = () =>
    page.locator('.damage-number').evaluateAll((els) => els.map((el) => el.textContent));
  // A tap casts at once, at the ordinary price, and the hit floats its damage off the boss.
  await page.locator('#touch-fire').tap();
  await step(page, 0.05);
  let s = await state(page);
  expect(s.boss.health).toBe(DUEL.bossHealth - SPELLS[2].damage);
  expect(s.energy).toBeGreaterThan(100 - SPELLS[2].cost - 1);
  expect(s.energy).toBeLessThan(100 - SPELLS[2].cost + 1.5);
  expect((await nova()).chargedCasts).toBe(0);
  expect(await numbers()).toContain(String(SPELLS[2].damage));
  // Holding the button charges instead of casting; the HUD slot fills up with the hold.
  await scenario(page, 'nova');
  const cdp = await context.newCDPSession(page),
    fire = (await page.locator('#touch-fire').boundingBox())!;
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ id: 1, x: fire.x + fire.width / 2, y: fire.y + fire.height / 2 }],
  });
  await step(page, NOVA_CHARGE.time / 2);
  s = await state(page);
  expect(s.boss.health).toBe(DUEL.bossHealth);
  expect(s.charge).toBeGreaterThan(0.3);
  expect(s.charge).toBeLessThan(0.7);
  expect(s.charged).toBe(false);
  await expect(page.locator('[data-spell="2"]')).toHaveClass(/charging/);
  await step(page, NOVA_CHARGE.time / 2 + 0.05);
  s = await state(page);
  expect(s.charged).toBe(true);
  expect(s.boss.health).toBe(DUEL.bossHealth);
  await expect(page.locator('[data-spell="2"]')).toHaveClass(/charged/);
  // Release: the charged blast lands for the same damage, costs 1.8x and throws the boss.
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await step(page, 0.05);
  s = await state(page);
  const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.nova.chargedCasts).toBe(1);
  expect(d.nova.holding).toBe(false);
  expect(s.boss.health).toBe(DUEL.bossHealth - SPELLS[2].damage);
  const charged = Math.round(SPELLS[2].cost * NOVA_CHARGE.cost);
  expect(s.energy).toBeGreaterThan(100 - charged - 1);
  expect(s.energy).toBeLessThan(100 - charged + 1.5);
  expect(d.ragdoll.boss).toBe(true);
  expect(s.charge).toBe(0);
  // Prisma's quick beam is paid the instant the button goes down and floats its own number
  // once its circle fires.
  await scenario(page, 'nova');
  await page.locator('[data-spell="1"]').tap();
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ id: 2, x: fire.x + fire.width / 2, y: fire.y + fire.height / 2 }],
  });
  await step(page, 0.05);
  expect((await state(page)).energy).toBeLessThan(100 - SPELLS[1].cost + 1);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await step(page, 0.25);
  expect((await state(page)).boss.health).toBe(DUEL.bossHealth - SPELLS[1].damage);
  expect(await numbers()).toContain(String(SPELLS[1].damage));
});

test('Prisma raises a circle beside the body that fires a beat later and shatters; a volley spreads around the ring; a hold charges the heavy lance', async ({
  page,
  context,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'nova');
  await page.locator('[data-spell="1"]').tap();
  const diagnostics = () => page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  const prisma = async () => (await diagnostics()).prisma;
  const numbers = () =>
    page.locator('.damage-number').evaluateAll((els) => els.map((el) => el.textContent));
  // Tap: the circle stands on the ring before anything is hit...
  await page.locator('#touch-fire').tap();
  await step(page, 0.08);
  let d = await prisma(),
    s = await state(page);
  expect(d.circles).toHaveLength(1);
  expect(d.circles[0].fired).toBe(false);
  expect(d.circles[0].big).toBe(false);
  expect(d.beams).toBe(0);
  expect(s.boss.health).toBe(DUEL.bossHealth);
  expect(s.energy).toBeLessThan(100 - SPELLS[1].cost + 1);
  const [cx, cy, cz] = d.circles[0].position,
    reach = Math.hypot(cx - s.position.x, cy - (s.position.y + 1.1), cz - s.position.z);
  expect(reach).toBeGreaterThan(PRISMA.ring.min - 0.05);
  expect(reach).toBeLessThan(PRISMA.ring.max + 0.05);
  expect(cy).toBeGreaterThan(s.position.y + 0.4);
  // ...then the beam leaves it and the hit floats its number.
  await step(page, 0.16);
  d = await prisma();
  s = await state(page);
  expect(d.beams).toBe(1);
  expect(d.circles[0].fired).toBe(true);
  expect(s.boss.health).toBe(DUEL.bossHealth - SPELLS[1].damage);
  expect(s.impacts).toBe(0);
  expect(await numbers()).toContain(String(SPELLS[1].damage));
  // The circle hangs beside the body — still on its ring, not left behind — and then shatters
  // into splinters instead of fading away.
  await step(page, 0.25);
  d = await prisma();
  s = await state(page);
  expect(d.circles).toHaveLength(1);
  const still = d.circles[0].position;
  expect(
    Math.hypot(still[0] - s.position.x, still[1] - (s.position.y + 1.1), still[2] - s.position.z),
  ).toBeGreaterThan(PRISMA.ring.min - 0.05);
  await step(page, 0.3);
  d = await prisma();
  expect(d.circles).toHaveLength(0);
  let parts = (await diagnostics()).particles;
  expect(parts.prismShatters).toBe(1);
  expect(parts.prismShards).toBeGreaterThan(0);
  // Holding the button does not repeat the beam; every beam takes its own tap.
  const cdp = await context.newCDPSession(page),
    fire = (await page.locator('#touch-fire').boundingBox())!,
    press = () =>
      cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ id: 1, x: fire.x + fire.width / 2, y: fire.y + fire.height / 2 }],
      }),
    lift = () => cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await scenario(page, 'nova');
  await page.locator('[data-spell="1"]').tap();
  const angles: number[] = [];
  for (let i = 0; i < 4; i++) {
    await press();
    await step(page, 0.1);
    await lift();
    await step(page, 0.25);
    angles.push((await prisma()).lastAngle!);
  }
  d = await prisma();
  s = await state(page);
  expect(d.beams).toBe(4);
  expect(d.bigCasts).toBe(0);
  expect(s.boss.health).toBe(DUEL.bossHealth - 4 * SPELLS[1].damage);
  for (let i = 1; i < angles.length; i++)
    expect(ringDistance(angles[i], angles[i - 1])).toBeGreaterThanOrEqual(PRISMA.minTurn - 1e-6);
  // A tapped circle is left where it was raised, like a shield patch: the body walks away and
  // the circle — and the beam it already spent — stays behind.
  expect(d.circles.length).toBeGreaterThan(0);
  const standing = d.circles.map((c) => c.position);
  await page.keyboard.down('KeyW');
  await step(page, 0.25);
  await page.keyboard.up('KeyW');
  s = await state(page);
  d = await prisma();
  expect(Math.hypot(s.position.x - 0, s.position.z - 24)).toBeGreaterThan(0.5);
  for (const c of d.circles) expect(standing).toContainEqual(c.position);
  // Hold: the quick beam at the press, the large circle after the threshold, full charge later,
  // the heavy lance on release.
  await scenario(page, 'nova');
  await page.locator('[data-spell="1"]').tap();
  await press();
  await step(page, 0.1);
  d = await prisma();
  expect(d.charging).toBe(false);
  expect(d.circles.filter((c) => c.big)).toHaveLength(0);
  await step(page, PRISMA.holdAfter + PRISMA.chargeTime / 2 - 0.1);
  d = await prisma();
  s = await state(page);
  expect(d.charging).toBe(true);
  expect(d.bigPosition).not.toBeNull();
  // It stands in front of the body along the view, not out at the boss.
  const [bx, by, bz] = d.bigPosition!,
    [fx, fy, fz] = (await diagnostics()).facing,
    aheadOfView =
      ((bx - s.position.x) * fx + (by - (s.position.y + 1.1)) * fy + (bz - s.position.z) * fz) /
      Math.hypot(bx - s.position.x, by - (s.position.y + 1.1), bz - s.position.z);
  expect(aheadOfView).toBeGreaterThan(0.7);
  expect(Math.hypot(bx - s.position.x, by - (s.position.y + 1.1), bz - s.position.z)).toBeLessThan(
    2.4,
  );
  expect(s.charge).toBeGreaterThan(0.3);
  expect(s.charge).toBeLessThan(0.7);
  expect(s.charged).toBe(false);
  expect(s.boss.health).toBe(DUEL.bossHealth - SPELLS[1].damage);
  await expect(page.locator('[data-spell="1"]')).toHaveClass(/charging/);
  await step(page, PRISMA.chargeTime / 2 + 0.05);
  s = await state(page);
  expect(s.charged).toBe(true);
  expect(s.boss.health).toBe(DUEL.bossHealth - SPELLS[1].damage);
  await expect(page.locator('[data-spell="1"]')).toHaveClass(/charged/);
  // Turn the view before releasing: the charging ring comes with it and the lance goes where
  // the crosshair points, not where the boss stands.
  const beforeTurn = (await prisma()).bigPosition!,
    yaw = (await diagnostics()).camera.yaw;
  await page.evaluate((y) => window.__HEA_DEBUG__.harness!.face(y), yaw + 0.9);
  await step(page, 0.05);
  const afterTurn = (await prisma()).bigPosition!;
  expect(Math.hypot(afterTurn[0] - beforeTurn[0], afterTurn[2] - beforeTurn[2])).toBeGreaterThan(
    0.5,
  );
  await page.evaluate((y) => window.__HEA_DEBUG__.harness!.face(y), yaw);
  await step(page, 0.05);
  const energyBefore = s.energy;
  await lift();
  await step(page, 0.05);
  d = await prisma();
  s = await state(page);
  const all = await diagnostics();
  expect(d.bigCasts).toBe(1);
  expect(d.charging).toBe(false);
  expect(s.charge).toBe(0);
  expect(s.boss.health).toBe(DUEL.bossHealth - SPELLS[1].damage - PRISMA.big.damage);
  expect(s.energy).toBeLessThan(energyBefore - PRISMA.big.cost + 1);
  expect(all.ragdoll.boss).toBe(true);
  expect(await numbers()).toContain(String(PRISMA.big.damage));
  // The large circle hangs on for a moment after the lance, then shatters too.
  expect(d.circles.filter((c) => c.big)).toHaveLength(1);
  parts = all.particles;
  // (The contact freeze and slow motion of the heavy hit eat into these steps.)
  await step(page, 1.4);
  d = await prisma();
  expect(d.circles.filter((c) => c.big)).toHaveLength(0);
  expect((await diagnostics()).particles.prismShatters).toBeGreaterThan(parts.prismShatters);
  // Let go before the charge is full: the circle is lost and nothing is paid for it.
  await scenario(page, 'nova');
  await page.locator('[data-spell="1"]').tap();
  await press();
  await step(page, PRISMA.holdAfter + PRISMA.chargeTime / 2);
  expect((await prisma()).charging).toBe(true);
  await lift();
  await step(page, 0.05);
  d = await prisma();
  s = await state(page);
  expect(d.bigCasts).toBe(0);
  expect(d.charging).toBe(false);
  expect(d.circles.filter((c) => c.big)).toHaveLength(0);
  expect(s.boss.health).toBe(DUEL.bossHealth - SPELLS[1].damage);
  expect(s.energy).toBeGreaterThan(100 - SPELLS[1].cost - 1);
});

test('a Prisma beam sweeps the boss’s fire out of the air: bolts and seekers to the light lance, the solar sphere only to the heavy one', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop');
  await load(page);
  await scenario(page, 'nova');
  await page.keyboard.press('Digit2');
  // Aegis off, so nothing but the beam is touching these shots.
  await page.keyboard.press('KeyG');
  await page.evaluate(() => {
    const h = window.__HEA_DEBUG__.harness!;
    h.place([0, 3, 20], [0, 5, -20]);
    h.face(0, 0);
    h.step(0.05);
  });
  const shots = async () =>
    (await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).shots.map((p) => p.kind);
  const aimAt = (at: number[]) =>
    page.evaluate((at) => {
      const d = window.__HEA_DEBUG__.diagnostics(),
        [bx, by, bz] = at,
        [cx, cy, cz] = d.cameraPosition,
        flat = Math.hypot(bx - cx, bz - cz);
      window.__HEA_DEBUG__.harness!.face(
        Math.atan2(-(bx - cx), -(bz - cz)),
        Math.atan2(by - cy, flat),
      );
    }, at);
  const fire = async () => {
    await page.mouse.move(550, 350);
    await page.mouse.down();
    await step(page, 1 / 60);
    await page.mouse.up();
    await step(page, 0.3);
  };
  // A rake of bolts straight down the lane — the centred shots of each packet.
  await page.evaluate(() => {
    const h = window.__HEA_DEBUG__.harness!;
    h.castBoss('fire', 1);
    h.castBoss('fire', 5);
  });
  await step(page, 0.3);
  expect((await shots()).filter((kind) => kind === 'fire').length).toBeGreaterThan(1);
  await aimAt([0, 5, -20]);
  await fire();
  expect(await shots()).not.toContain('fire');
  // Broken means gone: the bodies splash on the curtain and fade, never hanging in the air
  // where the lance caught them.
  await step(page, 0.5);
  const swept = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(swept.strayShots).toBe(0);
  // And the curtain showed itself doing it: a pane flashed where each shot ran into the light.
  // No thread is strung back to the caster — the lance is seen where it lands, not along itself.
  expect(swept.particles.prismPanes).toBeGreaterThanOrEqual(2);
  // A seeker, thrown from the same clear lane: the beam takes it out of the air too. (The
  // previous beam's curtain has to burn out first, or it would break this one on the way in.)
  await step(page, 0.5);
  await page.evaluate(() => {
    const h = window.__HEA_DEBUG__.harness!;
    h.place([0, 3, 20], [0, 5, -20]);
    h.face(0, 0);
    h.castBoss('missiles', 0);
  });
  await step(page, 0.3);
  const seekers = (await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).shots.filter(
    (p) => p.kind === 'missile',
  );
  expect(seekers.length).toBeGreaterThan(0);
  // Keep the curtain up while they close in: a seeker chasing the body has to cross it.
  await aimAt([0, 5, -20]);
  for (let i = 0; i < 4; i++) await fire();
  expect((await shots()).filter((kind) => kind === 'missile').length).toBeLessThan(seekers.length);
  // The solar sphere shrugs the light lance off...
  await page.evaluate(() => {
    const h = window.__HEA_DEBUG__.harness!;
    h.place([0, 3, 20], [0, 5, -20]);
    h.face(0, 0);
    h.castBoss('hammer', 0);
  });
  await step(page, 0.1);
  expect(await shots()).toContain('hammer');
  await fire();
  expect(await shots()).toContain('hammer');
  // ...and is eaten by the heavy one.
  await page.mouse.move(550, 350);
  await page.mouse.down();
  await step(page, 1);
  await page.mouse.up();
  await step(page, 1 / 60);
  expect(await shots()).not.toContain('hammer');
});

test('a small beam leaves its mark where it lands, and its circles stand beside the body', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop');
  await load(page);
  await scenario(page, 'nova');
  await page.keyboard.press('Digit2');
  const diagnostics = () => page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  // A monolith straight ahead at aim height: the beam lands square on its face.
  await page.evaluate(() => {
    const h = window.__HEA_DEBUG__.harness!;
    h.place([30, 3, 20], [0, 3, 20]);
    h.face(0, 0);
    h.step(0.05);
  });
  await page.mouse.move(550, 350);
  await page.mouse.down();
  await step(page, 1 / 60);
  await page.mouse.up();
  await step(page, 0.5);
  const marked = await diagnostics();
  expect(marked.particles.prismScars).toBeGreaterThanOrEqual(1);
  // A small beam marks masonry; it does not tear it open — that is the heavy lance's work.
  expect((await state(page)).wallsBroken).toBe(0);
  // The circles are drawn from the flanks of the ring, so the crosshair and the target stay
  // clear: no circle stands in the middle of the aim line.
  const position = (await state(page)).position,
    centre = [position.x, position.y + 1.1, position.z];
  for (const circle of marked.prisma.circles) {
    const c = circle.position,
      offset = [c[0] - centre[0], c[1] - centre[1], c[2] - centre[2]],
      span = Math.hypot(...offset);
    expect(offset[1] / span).toBeLessThan(0.75);
  }
});

test('the charging lance shows where it is pointed, and a refused cast dips its slot', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop');
  await load(page);
  await scenario(page, 'nova');
  await page.keyboard.press('Digit2');
  await page.evaluate(() => {
    const h = window.__HEA_DEBUG__.harness!;
    h.place([0, 3, 20], [0, 5, -20]);
    h.face(0, 0);
    h.step(0.05);
  });
  const diagnostics = () => page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  // The sight: nothing on a tap, a thread out of the big circle while it charges, gone on release.
  expect((await diagnostics()).particles.aimLine).toBe(false);
  await page.mouse.move(550, 350);
  await page.mouse.down();
  await step(page, 0.45);
  expect((await diagnostics()).particles.aimLine).toBe(true);
  await step(page, 0.7);
  expect((await diagnostics()).particles.aimLine).toBe(true);
  await page.mouse.up();
  await step(page, 0.05);
  expect((await diagnostics()).particles.aimLine).toBe(false);
  // Released early the circle breaks, and the sight goes with it. (The heavy cast's slow motion
  // stretches the wait: the hold threshold is measured in game time, not wall clock.)
  await page.mouse.down();
  await step(page, 0.8);
  expect((await diagnostics()).prisma.charging).toBe(true);
  expect((await diagnostics()).particles.aimLine).toBe(true);
  await page.mouse.up();
  await step(page, 0.05);
  expect((await diagnostics()).particles.aimLine).toBe(false);
  // The lance that just went out still holds the spell on cooldown: the next tap is refused and
  // only dips the slot. The dip is a class for 190 ms of wall clock, and a frozen step can swallow
  // a whole second at once, so it is counted by an observer instead of caught by eye.
  await page.evaluate(() => {
    const slot = document.querySelector('.spell-slot[data-spell="1"]')!;
    window.__drySeen = 0;
    new MutationObserver(() => {
      if (slot.classList.contains('dry')) window.__drySeen++;
    }).observe(slot, { attributes: true, attributeFilter: ['class'] });
  });
  const refused = await state(page);
  await page.mouse.move(550, 350);
  await page.mouse.down();
  await step(page, 1 / 60);
  await page.mouse.up();
  await step(page, 0.05);
  const after = await state(page);
  // Nothing was paid: the only thing that moved the bar is the passive regen.
  expect(after.energy).toBeGreaterThanOrEqual(refused.energy);
  expect((await diagnostics()).prisma.circles.length).toBe(0);
  await expect.poll(() => page.evaluate(() => window.__drySeen)).toBeGreaterThan(0);
  // The dip is swept up by the frame loop (a timer can be delayed for seconds on a busy
  // machine), so give the frames room to run.
  await expect(page.locator('.spell-slot[data-spell="1"]')).not.toHaveClass(/dry/, {
    timeout: 5000,
  });
  // And once the cooldown has run out the same tap works, so the dip was the only thing missing.
  await step(page, 0.8);
  const ready = (await state(page)).energy;
  await page.mouse.down();
  await step(page, 1 / 60);
  await page.mouse.up();
  await step(page, 0.05);
  expect((await diagnostics()).prisma.circles.length).toBe(1);
  expect((await state(page)).energy).toBeLessThan(ready);
});

test('the avatar model stands on the collision box and follows what the body does', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop');
  await load(page);
  await scenario(page, 'walk');
  await page.evaluate(() => {
    const h = window.__HEA_DEBUG__.harness!;
    h.place([0, 0.05, 20], [0, 4, -20]);
    h.face(0, 0);
    h.step(0.05);
  });
  const model = () => page.evaluate(() => window.__HEA_DEBUG__.diagnostics().avatarModel);
  await expect.poll(async () => (await model()).ready, { timeout: 30_000 }).toBe(true);
  const loaded = await model();
  // The asset is scaled to the body it rides, and stood on the box's own floor.
  expect(loaded.height).toBeGreaterThan(1.2);
  expect(loaded.height).toBeLessThan(1.9);
  expect(loaded.offset).toBeLessThan(-0.3);
  expect(loaded.clips).toEqual(expect.arrayContaining(['idle', 'walk', 'run', 'air', 'dead']));
  // Standing still it idles; walking it walks; in the air it is airborne.
  expect(loaded.pose).toBe('idle');
  for (let i = 0; i < 24; i++) {
    await page.keyboard.down('KeyW');
    await step(page, 1 / 20);
  }
  await page.keyboard.up('KeyW');
  expect((await model()).pose).toBe('walk');
  await page.evaluate(() => {
    const h = window.__HEA_DEBUG__.harness!;
    h.place([0, 9, 20], [0, 4, -20]);
    h.step(0.2);
  });
  expect((await model()).pose).toBe('air');
});

test('from the eyes Prisma raises its circles ahead of the view', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await load(page);
  await scenario(page, 'nova');
  await page.keyboard.press('KeyV');
  await page.keyboard.press('Digit2');
  await page.mouse.click(550, 350);
  await step(page, 0.08);
  const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics()),
    s = await state(page);
  expect(s.camera).toBe('first');
  expect(d.prisma.circles).toHaveLength(1);
  const [cx, cy, cz] = d.prisma.circles[0].position,
    [ex, ey, ez] = d.cameraPosition,
    dx = cx - ex,
    dy = cy - ey,
    dz = cz - ez,
    distance = Math.hypot(dx, dy, dz),
    yaw = d.camera.yaw,
    ahead = (-Math.sin(yaw) * dx - Math.cos(yaw) * dz) / distance;
  expect(distance).toBeGreaterThan(PRISMA.eyeRing.depth - 0.2);
  expect(distance).toBeLessThan(PRISMA.eyeRing.depth + PRISMA.eyeRing.max + 0.2);
  expect(ahead).toBeGreaterThan(0.6);
  // A tapped circle of the eyes is left where it was raised — like a shield patch — while the
  // body is thrown right across the arena.
  await step(page, 0.16);
  let after = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect((await state(page)).boss.health).toBe(DUEL.bossHealth - SPELLS[1].damage);
  expect(after.prisma.beams).toBe(1);
  const standing = after.prisma.circles[0].position;
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.place([0, 12, -30], [0, 5, -60]));
  await step(page, 0.05);
  after = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(after.prisma.circles).toHaveLength(1);
  expect(after.prisma.circles[0].position).toEqual(standing);
  // The held circle, by contrast, is carried with the view: it stands a couple of metres ahead
  // of the eyes, in front of wherever the crosshair is pointed.
  await step(page, 0.06);
  await page.mouse.down();
  await step(page, PRISMA.holdAfter + 0.2);
  const held = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics()),
    here = await state(page),
    [hx, hy, hz] = held.prisma.bigPosition!,
    [mx, my, mz] = held.cameraPosition,
    heldYaw = held.camera.yaw,
    hdx = hx - mx,
    hdy = hy - my,
    hdz = hz - mz,
    hdist = Math.hypot(hdx, hdy, hdz),
    hahead = (-Math.sin(heldYaw) * hdx - Math.cos(heldYaw) * hdz) / hdist;
  expect(here.charge).toBeGreaterThan(0);
  expect(hdist).toBeGreaterThan(1.4);
  expect(hdist).toBeLessThan(2.2);
  expect(hahead).toBeGreaterThan(0.85);
  await page.mouse.up();
});

test('the dash follows the stick in both views, and the surge after it dresses the frame until the speed settles', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop');
  await load(page, false);
  await scenario(page, 'flight');
  const velocity = async () =>
    (await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).playerVelocity;
  const dressing = () =>
    page.evaluate(() => ({
      surge: Number(document.getElementById('experience')!.style.getPropertyValue('--surge')),
      lines: document.getElementById('speed-lines')!.classList.contains('surge'),
    }));
  // The vanishing point the spokes radiate from, in pixels off the centre of the screen.
  const vanishing = () =>
    page.evaluate(() => {
      const style = document.getElementById('speed-lines')!.style;
      return {
        x: Number.parseFloat(style.getPropertyValue('--line-x')),
        y: Number.parseFloat(style.getPropertyValue('--line-y')),
      };
    });
  // Facing -z, a dash with the stick held left goes left, not forward.
  await page.keyboard.down('KeyA');
  await step(page, 0.1);
  await page.keyboard.press('ShiftLeft');
  await step(page, 0.14);
  let v = await velocity();
  expect(v[0]).toBeLessThan(-FLIGHT.speed);
  expect(Math.abs(v[2])).toBeLessThan(Math.abs(v[0]) * 0.2);
  // Once the burst itself is over, the boost keeps the frame dressed: denser lines and the
  // thin vignette, for as long as the motor runs hot.
  await step(page, 0.5);
  expect((await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).dashMotion.active).toBe(
    false,
  );
  expect((await state(page)).flight.boost).toBeGreaterThan(0.9);
  await expect.poll(async () => (await dressing()).lines).toBe(true);
  expect((await dressing()).surge).toBeGreaterThan(0.9);
  // Held left while the motor runs hot, the lines are dragged left with the travel — and by the
  // frame loop, not the HUD's slow tick, so the lean is there without the game being stepped.
  await expect.poll(async () => (await vanishing()).x, { timeout: 8000 }).toBeLessThan(-4);
  expect(
    await page.locator('#boost-vignette').evaluate((el) => getComputedStyle(el).display),
  ).not.toBe('none');
  await page.keyboard.up('KeyA');
  await step(page, 2.5);
  await expect.poll(dressing).toEqual({ surge: 0, lines: false });
  // Settled, they drift back to the middle of the screen.
  await expect.poll(async () => (await vanishing()).x, { timeout: 8000 }).toBeGreaterThan(-2);
  // From the eyes, the stick still steers the dash: held right goes right.
  await page.keyboard.press('KeyV');
  await step(page, 0.1);
  expect((await state(page)).camera).toBe('first');
  await page.keyboard.down('KeyD');
  await step(page, 0.1);
  await page.keyboard.press('ShiftLeft');
  await step(page, 0.14);
  v = await velocity();
  expect(v[0]).toBeGreaterThan(FLIGHT.speed);
  expect(Math.abs(v[2])).toBeLessThan(Math.abs(v[0]) * 0.2);
  await page.keyboard.up('KeyD');
  // Comfort mode drops the dressing entirely.
  await page.evaluate(() =>
    document.getElementById('experience')!.classList.add('reduced-effects'),
  );
  expect(await page.locator('#boost-vignette').evaluate((el) => getComputedStyle(el).display)).toBe(
    'none',
  );
});

test('camera sliders change the field of view and chase distance live, within their ranges, and are remembered', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop');
  await load(page, false);
  const slide = (id: string, value: number) =>
    page.locator(id).evaluate((el, value) => {
      (el as HTMLInputElement).value = String(value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
  const view = async () => {
    const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
    const [cx, , cz] = d.cameraPosition,
      [px, , pz] = d.playerPosition;
    return { fov: d.fov, gap: Math.hypot(cx - px, cz - pz) };
  };
  await page.locator('#settings-button').click();
  await expect(page.locator('#fov-third')).toHaveAttribute(
    'min',
    String(CAMERA_RANGES.fovThird.min),
  );
  await expect(page.locator('#fov-third')).toHaveAttribute(
    'max',
    String(CAMERA_RANGES.fovThird.max),
  );
  await slide('#fov-third', 88);
  await slide('#fov-first', 100);
  await slide('#camera-distance', 7.8);
  await expect(page.locator('#fov-third-label')).toHaveText('88°');
  await expect(page.locator('#camera-distance-label')).toHaveText('7.8 m');
  await page.locator('#panel-done').click();
  await scenario(page, 'flight');
  await step(page, 1.5);
  let v = await view();
  expect(v.fov).toBeCloseTo(88, 0);
  expect(v.gap).toBeGreaterThan(7.6);
  expect(v.gap).toBeLessThan(8.2);
  await page.keyboard.press('KeyV');
  await step(page, 1);
  expect((await view()).fov).toBeCloseTo(100, 0);
  // The values are stored with the other settings and come back when the panel reopens.
  const stored = JSON.parse((await page.evaluate(() => localStorage.getItem('hea-settings')))!);
  expect(stored.fovThird).toBe(88);
  expect(stored.fovFirst).toBe(100);
  expect(stored.cameraDistance).toBe(7.8);
  await page.keyboard.press('KeyP');
  await page.locator('#pause-settings').click();
  await expect(page.locator('#fov-third')).toHaveValue('88');
  await expect(page.locator('#fov-first')).toHaveValue('100');
  await expect(page.locator('#camera-distance')).toHaveValue('7.8');
  await expect(page.locator('#camera-mode')).toHaveValue('first');
  // The sliders cannot leave their ranges; a stored value outside them is clamped on load.
  await slide('#camera-distance', 20);
  await page.locator('#panel-done').click();
  await expect(page.locator('#resume-button')).toBeVisible();
  await page.locator('#resume-button').click();
  await page.keyboard.press('KeyV');
  await step(page, 1.5);
  v = await view();
  expect(v.gap).toBeLessThan(CAMERA_RANGES.cameraDistance.max + 0.3);
  expect(v.gap).toBeGreaterThan(CAMERA_RANGES.cameraDistance.max - 0.3);
});

test('accessibility: remapped keys are stored, and the boss indicator points off-screen', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop', 'keyboard remapping is a desktop concern');
  await load(page, false);
  await page.locator('#settings-button').click();
  await expect(page.locator('#aim-assist')).toBeChecked();
  await page.locator('#aim-assist').uncheck();
  // Capture a new dash key; the button listens, the next press becomes the binding.
  await page.locator('[data-bind="dash"]').click();
  await expect(page.locator('[data-bind="dash"]')).toHaveText('TEKAN TOMBOL…');
  await page.keyboard.press('AltLeft');
  await expect(page.locator('[data-bind="dash"]')).toHaveText('AltLeft');
  let stored = JSON.parse((await page.evaluate(() => localStorage.getItem('hea-settings')))!);
  expect(stored.bindings.dash).toBe('AltLeft');
  expect(stored.aimAssist).toBe(false);
  // Reset restores the defaults.
  await page.locator('#bindings-reset').click();
  await expect(page.locator('[data-bind="dash"]')).toHaveText('SHIFT');
  stored = JSON.parse((await page.evaluate(() => localStorage.getItem('hea-settings')))!);
  expect(stored.bindings.dash).toBe('ShiftLeft');
  await page.locator('#panel-done').click();
  // The indicator stays hidden while IGNIS is in view and appears, labelled, behind us.
  await scenario(page, 'flight');
  await step(page, 0.5);
  await expect(page.locator('#boss-indicator')).toBeHidden();
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.face(Math.PI));
  await step(page, 0.5);
  expect(Math.abs((await state(page)).boss.bearing)).toBeGreaterThan(0.6);
  await expect(page.locator('#boss-indicator')).toBeVisible();
  await expect(page.locator('#boss-indicator-label')).toHaveText(/IGNIS · \d+ M/);
});

test('fall: held gravity slams the boss down, holds it, and bursts on release', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop', 'held casting is driven by mouse on desktop');
  await load(page);
  await scenario(page, 'flight');
  await step(page, 0.5);
  const healthBefore = (await state(page)).boss.health;
  // Slot 4 holds FALL by default; the cast is a hold, not a tap.
  await page.keyboard.press('4');
  expect((await state(page)).spell).toBe(3);
  const box = await page.locator('#arena').boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await step(page, 0.5); // the word FALL stands alone first: still gathering, not yet down
  expect((await state(page)).fall.phase).toBe('build');
  await step(page, 0.7); // then the column lands and the slam hits
  let snap = await state(page);
  expect(snap.fall.phase).toBe('press');
  expect(snap.boss.health).toBeLessThan(healthBefore);
  const bossY = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics().bossPosition[1]);
  const groundY = await page.evaluate(() =>
    window.__HEA_DEBUG__.harness!.groundAt(
      window.__HEA_DEBUG__.diagnostics().bossPosition[0],
      window.__HEA_DEBUG__.diagnostics().bossPosition[2],
    ),
  );
  expect(bossY - groundY).toBeLessThan(BOSS.extent + 0.6); // pinned at rest height
  // And it does not get to face its hunter: under the weight its face tips to the ground.
  const [qx, qy, qz, qw] = await page.evaluate(
    () => window.__HEA_DEBUG__.diagnostics().ragdoll.bossOrientation,
  );
  const faceY = 2 * (qy * qz - qx * qw);
  expect(faceY).toBeLessThan(-0.5);
  // The slam broke whatever the boss was winding up: its director is recovering.
  expect(snap.boss.stage).toBe('recover');
  await expect(page.locator('#fall-title')).toHaveClass(/show/);
  // Holding longer stores pressure and keeps draining health in crush pulses.
  const healthAtSlam = snap.boss.health;
  await step(page, 1.6);
  snap = await state(page);
  expect(snap.fall.phase).toBe('press');
  expect(snap.fall.pressure).toBeGreaterThan(0.4);
  expect(snap.boss.health).toBeLessThan(healthAtSlam);
  // Release: the stored pressure closes the spell; there is no cooldown to wait out.
  await page.mouse.up();
  await step(page, 0.5);
  // Nor does the boss spring straight back up: it stays down a while under the weight's wake.
  const proneY = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics().bossPosition[1]);
  expect(proneY - groundY).toBeLessThan(BOSS.extent + 0.6);
  await step(page, 0.3);
  snap = await state(page);
  expect(snap.fall.phase).toBe('idle');
  expect(snap.cooldowns[3]).toBe(0);
  expect(snap.boss.health).toBeLessThan(healthAtSlam);
});

test('fall: the pinned boss does not turn to track the player', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'held casting is driven by mouse on desktop');
  await load(page);
  await scenario(page, 'flight');
  await step(page, 0.5);
  await page.keyboard.press('4');
  const box = await page.locator('#arena').boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await step(page, 1.4); // build, slam, press: the boss is flat under the weight
  expect((await state(page)).fall.phase).toBe('press');
  await step(page, 0.9); // let the face-down tilt finish settling before taking the bearing
  const orientation = () =>
    page.evaluate(() => window.__HEA_DEBUG__.diagnostics().ragdoll.bossOrientation);
  const before = await orientation();
  // The hunter reappears a quarter-turn away; a tracking boss would swing to face them.
  const boss = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics().bossPosition);
  await page.evaluate(
    (boss) => window.__HEA_DEBUG__.harness!.place([boss[0] + 18, boss[1] + 5, boss[2]], boss),
    boss,
  );
  await step(page, 1.2);
  const after = await orientation();
  const dot = Math.min(1, Math.abs(before.reduce((sum, v, i) => sum + v * after[i], 0)));
  expect(2 * Math.acos(dot)).toBeLessThan(0.15); // frozen: tracking would swing ~1.57 rad
  await page.mouse.up();
});

test('summon: the boss calls three lesser constructs that hunt and spit straight fire', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop', 'boss casts are driven through the desktop harness');
  await load(page);
  await scenario(page, 'flight');
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.place([0, 6, 18], [0, 8, 2]));
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.castBoss('summon'));
  expect(await page.evaluate(() => window.__HEA_DEBUG__.diagnostics().enemies)).toBe(3);
  await step(page, 8);
  const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.enemies).toBe(3);
  // The boss itself never fired (it stands idle in this scenario): every fire shot counted
  // came out of a construct.
  expect(d.attacksFired.fire).toBeGreaterThanOrEqual(3);
});

test('summon: FALL takes the constructs too, not just their master', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'held casting is driven by mouse on desktop');
  await load(page);
  await scenario(page, 'flight');
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.place([0, 6, 18], [0, 8, 2]));
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.castBoss('summon'));
  await step(page, 1);
  expect(await page.evaluate(() => window.__HEA_DEBUG__.diagnostics().enemies)).toBe(3);
  // Slot 4 holds FALL by default; hold it down and keep holding.
  await page.keyboard.press('4');
  const box = await page.locator('#arena').boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await step(page, 1.3); // the word stands alone, then the slam lands on everyone
  expect((await state(page)).fall.phase).toBe('press');
  // The slam plus the crush pulses: even 90-health constructs do not survive a held FALL.
  await step(page, 4.2);
  expect(await page.evaluate(() => window.__HEA_DEBUG__.diagnostics().enemies)).toBe(0);
  await page.mouse.up();
});

test('grimoire: spells can be rearranged across the four slots and lose their BARU badge', async ({
  page,
}) => {
  await load(page);
  await scenario(page, 'flight');
  await step(page, 0.2);
  await page.locator('#settings-button').click();
  await expect(page.locator('.grim-card')).toHaveCount(4);
  // FALL has never been equipped: it wears the badge until it is placed in a slot.
  const fallCard = page.locator('[data-grim-spell="3"]');
  await expect(fallCard.locator('.grim-new')).toHaveText('BARU');
  await page.locator('[data-grim-filter="Gravitasi"]').click();
  await expect(page.locator('.grim-card')).toHaveCount(1);
  await page.locator('[data-grim-filter="Semua"]').click();
  // Arm slot 2 and equip FALL there; the displaced spell swaps into FALL's old slot.
  await page.locator('[data-grim-slot="1"]').click();
  await fallCard.click();
  const stored = JSON.parse((await page.evaluate(() => localStorage.getItem('hea-settings')))!);
  expect(stored.loadout[1]).toBe(3);
  expect(stored.equipped).toContain(3);
  await expect(fallCard.locator('.grim-new')).toHaveCount(0);
  await expect(fallCard.locator('.grim-in')).toHaveText('SLOT 2');
  // A spell newly placed in a slot starts on cooldown, so swapping never dodges one.
  let snap = await state(page);
  expect(snap.loadout[1]).toBe(3);
  await page.locator('[data-grim-slot="0"]').click();
  await page.locator('[data-grim-spell="2"]').click();
  snap = await state(page);
  expect(snap.loadout[0]).toBe(2);
  expect(snap.cooldowns[2]).toBeGreaterThan(0.5);
  await page.locator('#panel-done').click();
});

test('arena loads the white rigged gameplay avatar and drives its flight pose', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const rig = page.waitForResponse(
    (response) => response.url().includes('101172-rigged.glb?revision=9') && response.ok(),
  );
  await load(page);
  await rig;
  await expect
    .poll(
      async () => (await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).avatarModel.ready,
    )
    .toBe(true);
  await page.locator('#start-button').click();
  await expect
    .poll(
      async () => (await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).avatarModel.pose,
    )
    .toBe('air');
  const avatar = (await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).avatarModel;
  expect(avatar.height).toBeCloseTo(1.52, 2);
  expect(avatar.clips).toContain('walk');
  expect(errors).toEqual([]);
});

test('camera leads the head before the body and pace has three tiers in the arena', async ({
  page,
}) => {
  await load(page);
  await page.locator('#start-button').click();
  await page.evaluate(() => {
    const h = window.__HEA_DEBUG__.harness!;
    h.freeze(true);
    h.scenario('locomotion-review');
    h.face(0);
    h.step(0.3);
  });
  await page.locator('#pace-toggle').click();
  await step(page, 0.05);
  expect((await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).avatarModel.pace).toBe(1);
  await page.locator('#pace-toggle').click();
  await step(page, 0.05);
  expect((await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).avatarModel.pace).toBe(2);
  const initialBody = (await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).avatarModel
    .bodyYaw;
  await page.evaluate((body) => {
    const h = window.__HEA_DEBUG__.harness!;
    h.face(body + 0.6, 1);
    h.step(1);
  }, initialBody);
  let avatar = (await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).avatarModel;
  expect(Math.abs(avatar.bodyYaw - initialBody)).toBeLessThan(0.05);
  expect(avatar.headYaw).toBeGreaterThan(0.5);
  await page.evaluate((body) => {
    const h = window.__HEA_DEBUG__.harness!;
    h.face(body + 2.1);
    h.step(1);
  }, initialBody);
  avatar = (await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).avatarModel;
  expect(avatar.bodyYaw - initialBody).toBeGreaterThan(1);
  expect(Math.abs(avatar.headYaw)).toBeLessThanOrEqual(Math.PI / 3 + 0.001);
});

test('unlocked backward walking faces travel and retains that heading after release', async ({
  page,
}) => {
  await load(page);
  await page.locator('#start-button').click();
  await page.evaluate(() => {
    const h = window.__HEA_DEBUG__.harness!;
    h.freeze(true);
    h.scenario('walk');
    h.face(0);
    h.step(0.2);
  });
  const originalHeading = (await page.evaluate(() => window.__HEA_DEBUG__.diagnostics()))
    .avatarModel.bodyYaw;
  await page.keyboard.down('s');
  await step(page, 2);
  const walking = (await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).avatarModel;
  expect(
    Math.abs(Math.atan2(Math.sin(walking.bodyYaw - Math.PI), Math.cos(walking.bodyYaw - Math.PI))),
  ).toBeLessThan(0.01);
  expect(Math.abs(walking.bodyYaw - originalHeading)).toBeGreaterThan(2.8);
  await page.keyboard.up('s');
  await step(page, 0.8);
  const before = (await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).avatarModel;
  expect(before.bodyYaw).toBeCloseTo(walking.bodyYaw, 3);
  await step(page, 2);
  const after = (await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).avatarModel;
  expect(after.bodyYaw).toBeCloseTo(before.bodyYaw, 4);
  expect(Math.abs(after.headYaw)).toBeLessThan(0.02);
});

test('a normal game faces backward travel then holds its final heading on desktop and touch', async ({
  page,
  context,
}, info) => {
  await load(page);
  await page.locator('#start-button').click();
  expect((await state(page)).lockedOn).toBe(false);
  // Do not use scenario()/face(): those helpers previously forced lock OFF,
  // masking the touch-only auto-lock in an actual newly started game.
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.freeze(true));
  await page.locator('#flight-toggle').click();
  await step(page, 2);
  const initialPosition = (await state(page)).position;
  const cdp = info.project.name === 'mobile' ? await context.newCDPSession(page) : undefined;
  if (cdp) {
    const b = (await page.locator('#joystick').boundingBox())!;
    const x = b.x + b.width / 2,
      y = b.y + b.height / 2;
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ id: 1, x, y }],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ id: 1, x, y: y + 36 }],
    });
  } else await page.keyboard.down('s');
  await step(page, 2);
  const held = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  const facingError = held.avatarModel.bodyYaw - held.camera.yaw - Math.PI;
  expect(Math.abs(Math.atan2(Math.sin(facingError), Math.cos(facingError)))).toBeLessThan(0.01);
  const moved = (await state(page)).position;
  const backwardDistance =
    (moved.x - initialPosition.x) * Math.sin(held.camera.yaw) +
    (moved.z - initialPosition.z) * Math.cos(held.camera.yaw);
  expect(backwardDistance).toBeGreaterThan(0.1);
  const meshForward = await page.evaluate(() => {
    const mesh = window.__HEA_DEBUG__.harness!.scene().getObjectByName('HEA_101172')!;
    return mesh.getWorldDirection(mesh.position.clone()).toArray();
  });
  // Check the actual rendered GLB transform, not just the controller's yaw.
  expect(
    meshForward[0] * Math.sin(held.camera.yaw) + meshForward[2] * Math.cos(held.camera.yaw),
  ).toBeGreaterThan(0.99);
  await page.screenshot({ path: `.cache/movement8-${info.project.name}-moving.png` });
  if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  else await page.keyboard.up('s');
  await step(page, 0.8);
  const stopped = (await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).avatarModel;
  await step(page, 2);
  const after = (await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).avatarModel;
  expect(after.bodyYaw).toBeCloseTo(stopped.bodyYaw, 4);
  expect(Math.abs(after.headYaw)).toBeLessThan(0.02);
  const stoppedForward = await page.evaluate(() => {
    const mesh = window.__HEA_DEBUG__.harness!.scene().getObjectByName('HEA_101172')!;
    return mesh.getWorldDirection(mesh.position.clone()).toArray();
  });
  for (let i = 0; i < 3; i++) expect(stoppedForward[i]).toBeCloseTo(meshForward[i], 3);
  await page.screenshot({ path: `.cache/movement8-${info.project.name}-stopped.png` });
});
