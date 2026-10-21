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

test('family house loads independently and all five interior viewpoints and floor plans work', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/house/?test');
  await expect(page.locator('#loading')).toBeHidden({ timeout: 30000 });
  await expect(page.locator('h1')).toContainText('Senja');
  await expect(page.locator('#view canvas')).toBeVisible();
  expect(await page.evaluate(() => Boolean(window.__HEA_DEBUG__))).toBe(false);
  expect(await page.evaluate(() => window.__HEA_HOUSE__.snapshot().staticBatches)).toBeLessThan(
    100,
  );
  for (const [id, floor] of [
    ['kitchen', 0],
    ['parents', 1],
    ['children', 1],
    ['reading', 1],
    ['living', 0],
  ] as const) {
    if (info.project.name === 'mobile') await page.locator('#mobile-rooms').click();
    await page.locator(`[data-room="${id}"]`).click();
    await expect
      .poll(() => page.evaluate(() => window.__HEA_HOUSE__.snapshot().activeRoom))
      .toBe(id);
    expect((await page.evaluate(() => window.__HEA_HOUSE__.snapshot())).height).toBe(floor * 3.4);
  }
  await page.locator('#plan-toggle').click();
  await expect(page.locator('#plan-dialog')).toBeVisible();
  await page.locator('[data-floor="1"]').click();
  await page.locator('[data-plan-room="children"]').click();
  await expect(page.locator('#plan-dialog')).not.toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.__HEA_HOUSE__.snapshot().activeRoom))
    .toBe('children');
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(scroll).toBe(false);
  expect(errors).toEqual([]);
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

test('the actual camera can walk down and back up the seventeen-tread staircase', async ({
  page,
}, info) => {
  // Two complete real-time flights on software WebGL need more than the default 60 s.
  test.setTimeout(120_000);
  // Navigation, not a golden-frame check: keep software rasterisation affordable.
  // Full desktop/mobile layouts are exercised by the tests above.
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 800, height: 450 });
  await page.goto('/house/?test');
  await expect(page.locator('#loading')).toBeHidden({ timeout: 30000 });
  if (info.project.name === 'mobile') await page.locator('#mobile-rooms').click();
  await page.locator('[data-room="reading"]').click();
  await expect.poll(() => page.evaluate(() => window.__HEA_HOUSE__.snapshot().height)).toBe(3.4);
  const yaw = await page.evaluate(() => window.__HEA_HOUSE__.snapshot().yaw);
  // Face north using the actual drag-look controller, then walk around the rail.
  await page.mouse.move(150, 220);
  await page.mouse.down();
  await page.mouse.move(150 + yaw / 0.0035, 220, { steps: 3 });
  await page.mouse.up();
  await page.locator('#view').focus();
  await page.keyboard.down('w');
  await expect
    .poll(() => page.evaluate(() => window.__HEA_HOUSE__.snapshot().z), {
      timeout: 15000,
      intervals: [80],
    })
    .toBeLessThan(-1.45);
  await page.keyboard.up('w');
  await page.keyboard.down('d');
  await expect
    .poll(() => page.evaluate(() => window.__HEA_HOUSE__.snapshot().x), {
      timeout: 15000,
      intervals: [80],
    })
    .toBeGreaterThan(3.55);
  await page.keyboard.up('d');
  await page.keyboard.down('s');
  await expect
    .poll(() => page.evaluate(() => window.__HEA_HOUSE__.snapshot().height), {
      timeout: 35000,
      intervals: [100],
    })
    .toBeLessThan(1.7);
  await expect
    .poll(() => page.evaluate(() => window.__HEA_HOUSE__.snapshot().height), {
      timeout: 35000,
      intervals: [100],
    })
    .toBeLessThan(0.1);
  await page.keyboard.up('s');
  await page.keyboard.down('w');
  await expect
    .poll(() => page.evaluate(() => window.__HEA_HOUSE__.snapshot().height), {
      timeout: 35000,
      intervals: [100],
    })
    .toBeGreaterThan(3.35);
  await page.keyboard.up('w');
  expect((await page.evaluate(() => window.__HEA_HOUSE__.snapshot())).activeFloor).toBe(1);
});

test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus)
    console.log(
      'House navigation at failure',
      await page.evaluate(() => window.__HEA_HOUSE__?.snapshot()),
    );
});

test('white stickman spawns on both floors and camera modes work without a box fallback', async ({
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
    .toBe(false);
  await page.locator('#camera-toggle').click();
  if (info.project.name === 'mobile') await page.locator('#mobile-rooms').click();
  await page.locator('[data-room="children"]').click();
  await expect.poll(() => page.evaluate(() => window.__HEA_HOUSE__.snapshot().height)).toBe(3.4);
  const s = await page.evaluate(() => window.__HEA_HOUSE__.snapshot());
  expect(s.character.loaded).toBe(true);
  expect(s.character.position?.y).toBe(3.4);
  expect(s.cameraMode).toBe('follow');
});

test('required house stickman load failure stays explicit and offers retry', async ({ page }) => {
  await page.route('**/models/101172-rigged.glb', (route) => route.abort());
  await page.goto('/house/?test');
  await expect(page.locator('#loading')).toContainText('Stickman gagal dimuat', { timeout: 30000 });
  await expect(page.locator('#retry-character')).toBeVisible();
  expect((await page.evaluate(() => window.__HEA_HOUSE__.snapshot())).character.loaded).toBe(false);
});
