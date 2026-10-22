import { test, expect } from '@playwright/test';

declare global {
  interface Window {
    __HEA_HOUSE__: {
      snapshot(): {
        x: number;
        z: number;
        height: number;
        yaw: number;
        pitch: number;
        activeRoom: string;
        activeFloor: number;
        moving: boolean;
        frames: number;
        drawCalls: number;
        staticBatches: number;
        character: {
          loaded: boolean;
          firstPerson?: boolean;
          visible: boolean;
          bodyYaw?: number;
          walkPhase?: number;
          stature?: number;
          position?: { x: number; y: number; z: number };
        };
        cameraMode: string;
        cameraDistance: number;
      };
    };
  }
}

test('reference living room loads independently with single-stage floor plan', async ({ page }) => {
  await page.goto('/house/?test');
  await expect(page.locator('#loading')).toBeHidden({ timeout: 45000 });
  expect((await page.evaluate(() => window.__HEA_HOUSE__.snapshot())).character.loaded).toBe(true);
  await expect(page.locator('[data-room]')).toHaveCount(1);
  await page.locator('#plan-toggle').click();
  await expect(page.locator('#plan-dialog')).toContainText('8,11 × 8,3 m');
  await expect(page.locator('[data-floor="1"]')).toHaveCount(0);
  await expect(page.locator('[data-plan-room="living"]')).toBeVisible();
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test('interior supports drag look, physical movement and input release on desktop and touch', async ({
  page,
}, info) => {
  await page.goto('/house/?test');
  await expect(page.locator('#loading')).toBeHidden({ timeout: 30000 });
  const initial = await page.evaluate(() => window.__HEA_HOUSE__.snapshot());
  await page.mouse.move(270, 380);
  await page.mouse.down();
  await page.mouse.move(330, 365, { steps: 4 });
  await page.mouse.up();
  await expect
    .poll(() => page.evaluate(() => window.__HEA_HOUSE__.snapshot().yaw))
    .not.toBe(initial.yaw);
  if (info.project.name === 'mobile') {
    const pad = await page.locator('#walk-pad').boundingBox();
    expect(pad).toBeTruthy();
    await page.mouse.move(pad!.x + pad!.width / 2, pad!.y + pad!.height / 2);
    await page.mouse.down();
    await page.mouse.move(pad!.x + pad!.width / 2, pad!.y + 12);
  } else {
    await page.locator('#view').focus();
    await page.keyboard.down('w');
  }
  await expect
    .poll(async () => {
      const s = await page.evaluate(() => window.__HEA_HOUSE__.snapshot());
      return Math.hypot(s.x - initial.x, s.z - initial.z);
    })
    .toBeGreaterThan(0.12);
  if (info.project.name === 'mobile') await page.mouse.up();
  else await page.keyboard.up('w');
  await expect.poll(() => page.evaluate(() => window.__HEA_HOUSE__.snapshot().moving)).toBe(false);
  const stopped = await page.evaluate(() => window.__HEA_HOUSE__.snapshot());
  await page.waitForTimeout(250);
  const after = await page.evaluate(() => window.__HEA_HOUSE__.snapshot());
  expect(after.character.position?.x).toBeCloseTo(after.x, 5);
  expect(after.character.position?.z).toBeCloseTo(after.z, 5);
  expect(after.character.position?.y).toBeCloseTo(after.height, 5);
  expect(after.character.bodyYaw).not.toBe(initial.character.bodyYaw);
  expect(after.x).toBeCloseTo(stopped.x, 5);
  expect(after.z).toBeCloseTo(stopped.z, 5);
  await page.locator('#help-toggle').click();
  await expect(page.locator('#help-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#help-dialog')).not.toBeVisible();
});

test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus)
    console.log(
      'House navigation at failure',
      await page.evaluate(() => window.__HEA_HOUSE__?.snapshot()),
    );
});

test('white stickman spawns in the new living room and camera modes work without a box fallback', async ({
  page,
}, info) => {
  await page.goto('/house/?test');
  await expect(page.locator('#loading')).toBeHidden({ timeout: 45000 });
  await expect
    .poll(() => page.evaluate(() => window.__HEA_HOUSE__.snapshot().character.loaded))
    .toBe(true);
  expect((await page.evaluate(() => window.__HEA_HOUSE__.snapshot())).character.visible).toBe(true);
  await page.locator('#camera-toggle').click();
  await expect
    .poll(() => page.evaluate(() => window.__HEA_HOUSE__.snapshot().cameraMode))
    .toBe('eyes');
  await expect
    .poll(() => page.evaluate(() => window.__HEA_HOUSE__.snapshot().character.visible))
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => window.__HEA_HOUSE__.snapshot().character.firstPerson))
    .toBe(true);
  await page.locator('#camera-toggle').click();
  await expect
    .poll(() => page.evaluate(() => window.__HEA_HOUSE__.snapshot().character.firstPerson))
    .toBe(false);
  if (info.project.name === 'mobile') await page.locator('#mobile-rooms').click();
  await page.locator('[data-room="living"]').click();
  await expect.poll(() => page.evaluate(() => window.__HEA_HOUSE__.snapshot().height)).toBe(0);
  const s = await page.evaluate(() => window.__HEA_HOUSE__.snapshot());
  expect(s.character.loaded).toBe(true);
  expect(s.character.position?.y).toBe(0);
  expect(s.cameraMode).toBe('follow');
});

test('required house stickman load failure stays explicit and offers retry', async ({ page }) => {
  await page.route('**/models/101172-rigged.glb', (route) => route.abort());
  await page.goto('/house/?test');
  await expect(page.locator('#loading')).toContainText('Stickman gagal dimuat', { timeout: 30000 });
  await expect(page.locator('#retry-character')).toBeVisible();
  expect((await page.evaluate(() => window.__HEA_HOUSE__.snapshot())).character.loaded).toBe(false);
});

test('open arch is a real walkable connecting hall', async ({ page }, info) => {
  test.skip(
    info.project.name === 'mobile',
    'Motor union is unit-tested; desktop verifies the real control route.',
  );
  test.setTimeout(90000);
  await page.setViewportSize({ width: 800, height: 500 });
  await page.goto('/house/?test');
  await expect(page.locator('#loading')).toBeHidden({ timeout: 45000 });
  const yaw = await page.evaluate(() => window.__HEA_HOUSE__.snapshot().yaw);
  await page.mouse.move(200, 250);
  await page.mouse.down();
  await page.mouse.move(200 + yaw / 0.0035, 250, { steps: 3 });
  await page.mouse.up();
  await page.locator('#view').focus();
  await page.keyboard.down('a');
  await expect
    .poll(() => page.evaluate(() => window.__HEA_HOUSE__.snapshot().x), { timeout: 25000 })
    .toBeLessThan(-2.8);
  await page.keyboard.up('a');
  const x = await page.evaluate(() => window.__HEA_HOUSE__.snapshot().x);
  expect(x).toBeGreaterThan(-3.1);
  await page.keyboard.down('w');
  await expect
    .poll(() => page.evaluate(() => window.__HEA_HOUSE__.snapshot().z), { timeout: 45000 })
    .toBeLessThan(-4.5);
  await page.keyboard.up('w');
  expect((await page.evaluate(() => window.__HEA_HOUSE__.snapshot())).height).toBe(0);
});
