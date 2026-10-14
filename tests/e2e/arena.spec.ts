import { test, expect, type Page } from '@playwright/test';
import type { Snapshot } from '../../src/game/types';
import type { Game } from '../../src/game/Game';
import { ATTACKS, DUEL } from '../../src/game/combat';
import { ARENA } from '../../src/game/config';

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
async function load(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'hea-settings',
      JSON.stringify({ quality: 'low', sound: false, reducedEffects: true }),
    );
    HTMLCanvasElement.prototype.requestPointerLock = () =>
      Promise.reject(new Error('Test iframe: pointer lock unavailable'));
  });
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
  expect(s.position.x).toBeLessThan(-9.25);
  expect(s.wallsBroken).toBeGreaterThan(0);
  expect(s.impacts).toBeGreaterThan(0);
  expect(d.lastImpact?.surface).toBe('wall');
  expect(
    await page.evaluate(() => window.__HEA_DEBUG__.harness!.wallRay([-7, 1, 12], [-13, 1, 12])),
  ).toBeNull();
  await page.locator('#pause-button').tap();
  await page.locator('#restart-button').tap();
  const reset = await state(page);
  expect(reset.wallsBroken).toBe(0);
  expect(reset.craters).toBe(0);
  expect(reset.health).toBe(100);
  expect(
    await page.evaluate(() => window.__HEA_DEBUG__.harness!.wallRay([-7, 1, 12], [-13, 1, 12])),
  ).not.toBeNull();
});

test('ground slam deforms terrain, produces collision impact, respects comfort mode', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'ground');
  await step(page, 1.3);
  const s = await state(page);
  expect(s.craters).toBeGreaterThan(0);
  expect(s.impacts).toBeGreaterThan(0);
  expect(s.position.y).toBeGreaterThanOrEqual(
    await page.evaluate(() => window.__HEA_DEBUG__.harness!.groundAt(0, 24)),
  );
  expect(await page.evaluate(() => window.__HEA_DEBUG__.harness!.groundAt(0, 24))).toBeLessThan(
    -0.3,
  );
  expect((await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).lastImpact?.surface).toBe(
    'ground',
  );
  await expect(page.locator('#experience')).not.toHaveClass(/\bimpact\b/);
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
  expect(arena.size).toBe(260);
  expect(arena.buildings).toBe(31);
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
  // Heavy contact now holds for half a second before the release.
  await step(page, 0.4);
  expect((await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).bossPosition).toEqual(
    before,
  );
  await step(page, 0.35);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.bossPosition[2]).toBeLessThan(before[2] - 6);
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
  await step(page, 0.45);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.bossReaction).toBe('contact');
  expect(d.bossVisible).toBe(true);
  await step(page, 0.4);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.bossVisible).toBe(true);
  expect(d.bossPosition[2]).toBeLessThan(-6);
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
  expect((await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).dashMotion.active).toBe(
    false,
  );
  await scenario(page, 'shield-scatter');
  await step(page, 0.15);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect((await state(page)).shield.blocked).toBe(3);
  // Three lanes: the two near each other share a patch, the far-side one is a patch of its own.
  expect(d.shieldPatches.length).toBeGreaterThanOrEqual(2);
  expect(d.shieldPatches.length).toBeLessThanOrEqual(3);
  expect(d.shieldPatches.length + d.patchReuses).toBe(3);
  expect(d.shieldPatches.some((p) => p.offset[0] < -1)).toBe(true);
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
  await step(page, 0.6);
  const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect((await state(page)).shield.blocked).toBe(3);
  expect((await state(page)).health).toBe(100);
  expect(d.shieldPatches).toHaveLength(1);
  expect(d.patchReuses).toBe(2);
  expect(d.shieldPatches[0].hits).toBe(3);
  expect(d.shieldEchoes).toHaveLength(1);
  expect(Math.hypot(...d.shieldPatches[0].offset)).toBeGreaterThan(2.9);
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
  await step(page, 0.9);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.ragdoll.playerAirRecoveries).toBe(1);
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
  await step(page, 0.12);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.attacksFired.fire).toBe(1);
  expect(d.shots.find((s) => s.kind === 'fire')!.origin).toEqual(d.fireOrigins[0].origin);
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
  // Fewer, bigger blocks: nearly every remaining monolith is at least 10 m wide and 15 m tall.
  const monoliths = d.walls.filter((w) => w.maxX - w.minX >= 10 && w.top >= 15).length;
  expect(monoliths).toBeGreaterThanOrEqual(28);
  expect(monoliths).toBeLessThanOrEqual(d.walls.length);
  expect(d.walls.length).toBeLessThan(40);
  await step(page, 9.2);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.heavyCircleRadius).toBeGreaterThan(3.4);
});

test('boss holds fire behind thick cover, repositions, and permits a real thin-wall breach', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'sight-thick');
  for (const attack of ['fire', 'missiles', 'hammer'] as const)
    await page.evaluate((a) => window.__HEA_DEBUG__.harness!.castBoss(a), attack);
  await step(page, 0.3);
  let d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.attacksFired).toEqual({ fire: 0, missile: 0, hammer: 0 });
  expect(d.blockedCasts).toBeGreaterThanOrEqual(3);
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
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.place([-4, 6, 12], [-27, 6, 12]));
  await step(page, 0.3);
  const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.pendingFire).toBe(0);
  expect(d.attacksFired.fire).toBe(0);
});

test('heavy contact holds for half a second then instantly launches both actors at high speed', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'player-air');
  await step(page, 0.02);
  const p = (await state(page)).position;
  await step(page, 0.09);
  expect((await state(page)).position).toEqual(p);
  await step(page, 0.3);
  expect((await state(page)).position).toEqual(p);
  await step(page, 0.2);
  let d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(Math.hypot(...d.playerVelocity)).toBeGreaterThan(100);
  expect((await state(page)).position.z).toBeLessThan(p.z - 5);
  await scenario(page, 'nova-air');
  await page.locator('#touch-fire').tap();
  await step(page, 0.008);
  const boss = (await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).bossPosition;
  await step(page, 0.4);
  expect((await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).bossPosition).toEqual(
    boss,
  );
  await step(page, 0.2);
  d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(Math.hypot(...d.bossVelocity)).toBeGreaterThan(100);
  expect(d.bossPosition[2]).toBeLessThan(boss[2] - 5);
});
