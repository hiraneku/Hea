import { test, expect } from '@playwright/test';

test('temporary character preview loads the GLB without booting the game', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('preview/');
  await expect(page.locator('#load-status')).toBeHidden({ timeout: 30_000 });
  await expect(page.locator('#model-info')).toContainText('Siap diperiksa');
  await expect(page.locator('#model-info')).toContainText('Tidak ada');
  await expect(page.locator('#rig-note')).toContainText('belum memiliki rig');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('#start-button')).toHaveCount(0);
  await page.getByRole('button', { name: 'Depan', exact: true }).click();
  await page.getByRole('button', { name: 'Samping', exact: true }).click();
  await page.getByRole('button', { name: 'Belakang', exact: true }).click();
  await page.getByRole('button', { name: 'Reset kamera' }).click();
  await page.locator('#wireframe').check();
  await page.locator('#rotate').check();
  await page.locator('#grid').uncheck();
  await page.locator('#background').selectOption('#d8dfdc');
  await expect(page.locator('#wireframe')).toBeChecked();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
  expect(errors).toEqual([]);
});
