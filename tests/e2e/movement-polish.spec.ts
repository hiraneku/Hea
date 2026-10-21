import { test, expect, type Page } from '@playwright/test';
// Reuse the game's existing DEV harness; no production test-only pose controls.

async function load(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'hea-settings',
      JSON.stringify({ quality: 'low', sound: false, reducedEffects: true }),
    );
  });
  await page.goto('/?test');
  await expect(page.locator('#boot')).toBeHidden({ timeout: 30000 });
  await page.evaluate(() => {
    const h = window.__HEA_DEBUG__.harness!;
    h.freeze(true);
    h.scenario('flight');
    h.step(1.8);
  });
}
async function presentation(page: Page) {
  return page.evaluate(() => {
    const d = window.__HEA_DEBUG__.diagnostics();
    const avatar = window.__HEA_DEBUG__.harness!.scene().getObjectByName('player-avatar')!;
    // Forward pitch about X at yaw zero; no renderer-dependent pixel threshold.
    const q = avatar.quaternion;
    return {
      offset: avatar.position.y - d.playerPosition[1],
      pitch: Math.atan2(2 * (q.w * q.x + q.y * q.z), 1 - 2 * (q.x * q.x + q.y * q.y)),
      d,
    };
  });
}
test('flight mode changes blend presentation height without changing the physics toggle', async ({
  page,
}) => {
  await load(page);
  const before = await presentation(page);
  await page.keyboard.press('KeyF');
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.step(1 / 60));
  const first = await presentation(page);
  expect(Math.abs(first.offset - before.offset)).toBeLessThan(0.055);
  expect((await page.evaluate(() => window.__HEA_DEBUG__.snapshot())).flight.enabled).toBe(false);
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.step(0.5));
  expect((await presentation(page)).offset).toBeCloseTo(0.66, 2);
  const ground = await presentation(page);
  await page.keyboard.press('KeyF');
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.step(1 / 60));
  expect(Math.abs((await presentation(page)).offset - ground.offset)).toBeLessThan(0.055);
  expect((await page.evaluate(() => window.__HEA_DEBUG__.snapshot())).flight.enabled).toBe(true);
});
test('a dash from hover leans into actual burst travel then settles without a new pose clip', async ({
  page,
}) => {
  await load(page);
  await page.keyboard.press('ShiftLeft');
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.step(0.12));
  const burst = await presentation(page);
  expect(burst.d.dashMotion.active).toBe(true);
  expect(burst.d.dashMotion.invulnerable).toBe(true);
  expect(burst.pitch).toBeLessThan(-0.04);
  expect(burst.pitch).toBeGreaterThan(-0.125);
  expect(burst.d.avatarModel.clips).toEqual(['walk']);
  await page.evaluate(() => window.__HEA_DEBUG__.harness!.step(0.8));
  const recovered = await presentation(page);
  expect(recovered.d.dashMotion.active).toBe(false);
  expect(recovered.d.dashMotion.invulnerable).toBe(false);
  expect(Math.abs(recovered.pitch)).toBeLessThan(0.01);
});
