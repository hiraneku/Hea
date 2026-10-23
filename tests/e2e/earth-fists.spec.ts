import { expect, test } from '@playwright/test';

test('Earth Battle Mode toggles from the HUD', async ({ page }) => {
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
  await expect(button).toBeEnabled();
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(button).toHaveAttribute('aria-label', 'Nonaktifkan sihir tanah: Battle Mode');
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'false');
});
