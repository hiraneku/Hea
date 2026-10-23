import { expect, test } from '@playwright/test';

test('Battle Mode is the earth ultimate, not a universal toggle', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'hea-settings',
      JSON.stringify({ quality: 'low', sound: false, reducedEffects: true }),
    );
    HTMLCanvasElement.prototype.requestPointerLock = () =>
      Promise.reject(new Error('Test browser: pointer lock unavailable'));
  });
  await page.goto('/?test');
  await expect(page.locator('#boot')).toBeHidden({ timeout: 30_000 });
  await page.locator('#start-button').click();

  const button = page.locator('#earth-battle-toggle');
  await expect(button).toBeHidden();
  await page.locator('.spell-slot[data-spell="4"]').click();
  await expect(button).toBeVisible();
  await expect(button).toBeEnabled();
  await expect(button).toHaveAttribute('aria-pressed', 'false');

  // The spell has its own low-cost rock projectile before the ultimate is available.
  const rock = await page.evaluate(() => {
    window.__HEA_DEBUG__.harness!.castPlayer();
    const shot = window.__HEA_DEBUG__
      .harness!.scene()
      .children.find((object) => object.userData.projectile) as import('three').Mesh;
    return {
      geometry: shot.geometry.type,
      material: (shot.material as import('three').MeshStandardMaterial).color.getHexString(),
      radius: window.__HEA_DEBUG__.diagnostics().shots[0]?.radius,
    };
  });
  expect(rock.geometry).toBe('DodecahedronGeometry');
  expect(rock.material).toBe('9b805d');
  expect(rock.radius).toBeCloseTo(0.24);

  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(button).toHaveAttribute('aria-label', 'Battle Mode aktif');
  await expect(button).toBeDisabled();
  const active = await page.evaluate(() => window.__HEA_DEBUG__.snapshot());
  expect(active.earthBattleActive).toBe(true);
  expect(active.energy).toBeLessThan(60);

  // Switching away hides the earth-only ultimate control; it does not switch the ultimate off.
  await page.locator('.spell-slot[data-spell="0"]').click();
  await expect(button).toBeHidden();
  expect((await page.evaluate(() => window.__HEA_DEBUG__.snapshot())).earthBattleActive).toBe(true);

  // Returning to the earth school keeps the cooldown visible and prevents a second activation.
  await page.locator('.spell-slot[data-spell="4"]').click();
  await expect(button).toBeVisible();
  await expect(button).toBeDisabled();
  expect((await page.evaluate(() => window.__HEA_DEBUG__.snapshot())).earthUltimateCooldown).toBeGreaterThan(0.9);
});
