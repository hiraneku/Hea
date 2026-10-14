import { test, expect, type Page } from '@playwright/test';
import type { Snapshot } from '../../src/game/types';

declare global {
  interface Window {
    __HEA_DEBUG__: {
      snapshot(): Snapshot;
      diagnostics(): {
        projectiles: number;
        lowQuality: boolean;
        camera: { yaw: number; pitch: number };
      };
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
    // Test the drag-look fallback as well as normal pointer lock in manual browser checks.
    HTMLCanvasElement.prototype.requestPointerLock = () =>
      Promise.reject(new Error('Pointer lock unavailable in test iframe'));
  });
  await page.goto('/');
  await expect(page.locator('#boot')).toBeHidden({ timeout: 30_000 });
  await expect(page.locator('#start-button')).toBeVisible();
}

test('live arena, settings persistence, guide, reference and demo', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await load(page);
  expect((await state(page)).mode).toBe('menu');
  expect(await page.locator('h1').evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(
    true,
  );
  await expect(page.locator('canvas')).toBeVisible();
  await page.locator('#settings-button').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.locator('#quality').selectOption('high');
  await page.locator('#quality').selectOption('low');
  await page.locator('#comfort').uncheck();
  await page.locator('#panel-done').click();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('hea-settings')!).reducedEffects),
  ).toBe(false);
  await page.locator('#help-button').click();
  await page.locator('#mobile-tab').click();
  await expect(page.locator('#mobile-guide')).toBeVisible();
  await page.locator('#desktop-tab').click();
  await expect(page.locator('#desktop-guide')).toBeVisible();
  await page.locator('#panel-done').click();
  await page.locator('#reference-button').click();
  await expect(page.locator('video')).toBeVisible();
  expect(await page.locator('video').getAttribute('src')).toContain('reference.mp4');
  await page.locator('#panel-close').click();
  await page.locator('#demo-button').click();
  await expect(page.locator('#demo-ui')).toBeVisible();
  expect((await state(page)).mode).toBe('demo');
  await page.locator('#demo-exit').click();
  await expect(page.locator('#menu')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('desktop: real movement, casting, shield, pause, reset', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await load(page);
  await page.locator('#start-button').click();
  await expect.poll(async () => (await state(page)).mode).toBe('playing');
  // A quick click must queue a shot even if software rendering misses its down/up interval.
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
  await page.keyboard.down('KeyF');
  await expect.poll(async () => (await state(page)).shield).toBe(true);
  await page.keyboard.up('KeyF');
  await page.keyboard.press('KeyP');
  await expect(page.locator('#resume-button')).toBeVisible();
  const paused = (await state(page)).elapsed;
  await page.waitForTimeout(250);
  expect((await state(page)).elapsed).toBe(paused);
  await page.locator('#pause-settings').click();
  await expect(page.locator('#quality')).toBeVisible();
  await page.locator('#panel-done').click();
  await expect(page.locator('#resume-button')).toBeVisible();
  await page.locator('#resume-button').click();
  await expect.poll(async () => (await state(page)).mode).toBe('playing');
  await page.keyboard.press('KeyR');
  expect((await state(page)).health).toBe(100);
  expect((await state(page)).score).toBe(0);
  expect((await state(page)).wave).toBe(1);
  expect((await state(page)).position.y).toBe(0);
  expect(errors).toEqual([]);
});

test('mobile: simultaneous move / cast, touch look, rotate and reset', async ({
  page,
  context,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await load(page);
  await page.locator('#start-button').tap();
  await expect(page.locator('#touch-controls')).toBeVisible();
  for (const id of ['#joystick', '#touch-fire', '#touch-dash', '#touch-jump', '#touch-shield']) {
    const box = await page.locator(id).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThan(100);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    expect(box!.y + box!.height).toBeLessThanOrEqual(844);
  }
  const cdp = await context.newCDPSession(page);
  const stick = (await page.locator('#joystick').boundingBox())!,
    fire = (await page.locator('#touch-fire').boundingBox())!;
  const x = stick.x + stick.width / 2,
    y = stick.y + stick.height / 2;
  const fx = fire.x + fire.width / 2,
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
  await expect.poll(async () => (await state(page)).energy).toBeLessThan(98);
  await expect
    .poll(async () => (await state(page)).kills, { timeout: 20_000 })
    .toBeGreaterThanOrEqual(1);
  expect((await state(page)).score).toBeGreaterThanOrEqual(100);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const cameraBefore = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics().camera.yaw);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ id: 3, x: 280, y: 300 }],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ id: 3, x: 315, y: 305 }],
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect
    .poll(async () => page.evaluate(() => window.__HEA_DEBUG__.diagnostics().camera.yaw))
    .not.toBe(cameraBefore);
  await page.locator('[data-spell="2"]').tap();
  await expect(page.locator('[data-spell="2"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#touch-dash').tap();
  await expect.poll(async () => (await state(page)).dash).toBeLessThan(1);
  await page.locator('#touch-jump').tap();
  await expect.poll(async () => (await state(page)).position.y).toBeGreaterThan(0.1);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('#touch-fire')).toBeVisible();
  const landscape = (await page.locator('#touch-fire').boundingBox())!;
  expect(landscape.x + landscape.width).toBeLessThanOrEqual(844);
  expect(landscape.y + landscape.height).toBeLessThanOrEqual(390);
  await page.locator('#pause-button').tap();
  await expect(page.locator('#restart-button')).toBeVisible();
  await page.locator('#restart-button').tap();
  expect((await state(page)).position.y).toBe(0);
  expect((await state(page)).health).toBe(100);
  expect(errors).toEqual([]);
});

test('mobile: Prisma and Nova deal damage, award score and keep cooldowns independent', async ({
  page,
  context,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await load(page);
  await page.locator('#start-button').tap();
  await page.locator('[data-spell="1"]').tap();
  const cdp = await context.newCDPSession(page);
  const b = (await page.locator('#touch-fire').boundingBox())!;
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ id: 1, x: b.x + b.width / 2, y: b.y + b.height / 2 }],
  });
  await expect
    .poll(async () => (await state(page)).kills, { timeout: 20_000 })
    .toBeGreaterThanOrEqual(1);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  expect((await state(page)).spell).toBe(1);
  expect((await state(page)).score).toBeGreaterThanOrEqual(100);
  expect((await state(page)).cooldowns[0]).toBe(0);
  await page.locator('#pause-button').tap();
  await page.locator('#restart-button').tap();
  await page.locator('[data-spell="2"]').tap();
  await page.locator('#touch-fire').tap();
  await expect
    .poll(async () => (await state(page)).kills, { timeout: 20_000 })
    .toBeGreaterThanOrEqual(1);
  expect((await state(page)).spell).toBe(2);
  expect((await state(page)).score).toBeGreaterThanOrEqual(100);
  expect((await state(page)).energy).toBeLessThan(90);
  expect((await state(page)).cooldowns[1]).toBe(0);
});
