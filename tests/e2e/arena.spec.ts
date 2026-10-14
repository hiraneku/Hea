import { test, expect, type Page } from '@playwright/test';
import type { Snapshot } from '../../src/game/types';
import type { Game } from '../../src/game/Game';
import { DUEL } from '../../src/game/combat';

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

test('desktop controls: movement, double jump, dash, focus, shooting, pause and reset', async ({
  page,
}, info) => {
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
  await expect.poll(async () => (await state(page)).position.z).toBeLessThan(17.8);
  await page.keyboard.up('KeyW');
  await page.keyboard.press('ShiftLeft');
  await expect.poll(async () => (await state(page)).dash).toBeLessThan(1);
  await page.keyboard.press('Space');
  await expect.poll(async () => (await state(page)).position.y).toBeGreaterThan(0.1);
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
  for (const id of ['#joystick', '#touch-fire', '#touch-dash', '#touch-jump', '#touch-focus']) {
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
  await expect.poll(async () => (await state(page)).position.z).toBeLessThan(17.5);
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
  await page.locator('#touch-jump').tap();
  await expect.poll(async () => (await state(page)).position.y).toBeGreaterThan(0.1);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('.boss-hud')).toBeVisible();
  const b = (await page.locator('#touch-fire').boundingBox())!;
  expect(b.y + b.height).toBeLessThanOrEqual(390);
  await page.locator('#pause-button').tap();
  await page.locator('#restart-button').tap();
  expect((await state(page)).health).toBe(100);
  expect(errors).toEqual([]);
});

test('automatic shield intercepts simultaneous threats from four directions, then cools down', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  await load(page);
  await scenario(page, 'shield');
  await step(page, 0.25);
  let s = await state(page);
  expect(s.shield.blocked).toBe(4);
  expect(s.health).toBe(100);
  expect(s.shield.phase).toBe('active');
  expect(s.energy).toBe(100);
  await expect(page.locator('#shield-state')).toContainText('AKTIF');
  await step(page, DUEL.shieldWindow);
  s = await state(page);
  expect(s.shield.phase).toBe('cooldown');
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.incoming());
  await step(page, 0.25);
  expect((await state(page)).health).toBeLessThan(100);
  expect((await state(page)).shield.blocked).toBe(4);
  await step(page, DUEL.shieldCooldown);
  expect((await state(page)).shield.phase).toBe('ready');
  expect(await page.locator('#touch-shield').count()).toBe(0);
  await scenario(page, 'cover');
  await step(page, 0.7);
  expect((await state(page)).shield.blocked).toBe(0);
  expect((await state(page)).shield.phase).toBe('ready');
  expect((await state(page)).health).toBe(100);
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
  expect(s.position.y).toBeLessThan(0);
  expect(await page.evaluate(() => window.__HEA_DEBUG__.harness!.groundAt(0, 12))).toBeLessThan(
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
  await step(page, 5.65);
  let d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
  expect(d.attacksFired.fire).toBeGreaterThanOrEqual(12);
  expect(d.attacksFired.missile).toBeGreaterThan(0);
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
