import { test, expect, type Page } from '@playwright/test';
import type { Snapshot } from '../../src/game/types';
import type { Game } from '../../src/game/Game';
import { ATTACKS, DUEL } from '../../src/game/combat';
import { ARENA, FLIGHT } from '../../src/game/config';
import { beside } from '../../src/game/layout';

declare global {
  interface Window {
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
  await page.locator('#panel-done').click();
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
  await step(page, 0.1);
  expect((await state(page)).boss.health).toBe(DUEL.bossHealth - 58);
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
  expect(arena.size).toBe(400);
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
  await step(page, 15);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  const p = (await state(page)).position;
  expect(Math.hypot(d.bossPosition[0] - start[0], d.bossPosition[2] - start[2])).toBeGreaterThan(
    60,
  );
  expect(Math.hypot(d.bossPosition[0] - p.x, d.bossPosition[2] - p.z)).toBeLessThan(40);
  expect(d.bossLane.mode).not.toBe('blocked');
  // The same chase from the opposite corner, through the ring gaps and over the low cover.
  await scenario(page, 'far-north');
  await step(page, 12);
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
  // The eye line sits 1.36 m above the physics root (the top of the 1.3 m body).
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
  expect((await distance()).avatar).toBe(true);
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
  // Fewer, broader blocks: every remaining monolith is at least 20 m wide and 15 m tall.
  const monoliths = d.walls.filter((w) => w.maxX - w.minX >= 20 && w.top >= 15).length;
  expect(monoliths).toBeGreaterThanOrEqual(22);
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
  for (let t = 0; t < 6 && fired(d) === before; t += 0.25) {
    await step(page, 0.25);
    d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  }
  expect(fired(d)).toBeGreaterThan(before);
  const origin = d.shots[d.shots.length - 1].origin;
  expect(Math.hypot(origin[0], origin[2] - 24)).toBeGreaterThan(40);
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
