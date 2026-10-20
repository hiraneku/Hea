import { test, expect } from '@playwright/test';

test('temporary character preview loads the GLB without booting the game', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('preview/');
  await expect(page.locator('#load-status')).toBeHidden({ timeout: 30_000 });
  await expect(page.locator('#model-info')).toContainText('Siap diperiksa');
  await expect(page.locator('#model-info')).toContainText('28 tulang · 1 skinned mesh');
  await expect(page.locator('#model-info')).toContainText('Walking · 1.16 s');
  await expect(page.locator('#rig-note')).toContainText('Aset gameplay sungguhan');
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

test('Walking can pause, scrub, change speed and return to bind pose', async ({ page }) => {
  // The explicit index URL must resolve the same model/site root as /preview/.
  await page.goto('preview/index.html?review=walking');
  await expect(page.locator('#load-status')).toBeHidden({ timeout: 30_000 });
  await page.locator('#movement-walk').click();
  await page.getByRole('button', { name: 'Jeda animasi', exact: true }).click();
  const phase = page.locator('#phase');
  const paused = await phase.inputValue();
  await page.waitForTimeout(250);
  expect(await phase.inputValue()).toBe(paused);
  await phase.evaluate((element) => {
    (element as HTMLInputElement).value = '250';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('#phase-value')).toHaveText('25%');
  await page.locator('#speed').evaluate((element) => {
    (element as HTMLInputElement).value = '0.5';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('#speed-value')).toHaveText('0.50×');
  await page.locator('#skeleton').check();
  await expect(page.locator('#joint-labels')).toBeVisible();
  await expect(page.locator('#joint-labels')).toContainText('LUTUT');
  await page.locator('#animation').selectOption('bind');
  await expect(page.locator('#animation')).toHaveValue('bind');
  await page.locator('#animation').selectOption('walk');
  await expect.poll(async () => phase.inputValue()).not.toBe('0');
  await page.getByRole('button', { name: 'Jeda animasi', exact: true }).click();
  await page.getByRole('button', { name: 'Ulangi siklus', exact: true }).click();
  await expect(phase).toHaveValue('0');
  await expect(page.getByRole('link', { name: 'Unduh GLB rig + Walking' })).toHaveAttribute(
    'href',
    /models\/101172-rigged\.glb\?revision=4$/,
  );
});

test('missing rigged asset reports a useful loading error', async ({ page }) => {
  await page.route('**/models/101172-rigged.glb*', (route) => route.abort());
  await page.goto('preview/');
  await expect(page.locator('#load-status')).toContainText('Model gagal dimuat');
  await expect(page.locator('#play')).toBeDisabled();
});

test('movement choice toggles Walking back to standing instead of freezing a step', async ({
  page,
}) => {
  await page.goto('preview/');
  await expect(page.locator('#load-status')).toBeHidden({ timeout: 30_000 });
  const walk = page.getByRole('button', { name: 'Jalan', exact: true });
  await expect(walk).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#animation')).toHaveValue('bind');
  await walk.click();
  await expect(walk).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#animation')).toHaveValue('walk');
  await expect.poll(() => page.locator('#phase').inputValue()).not.toBe('0');
  await walk.click();
  await expect(walk).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#animation')).toHaveValue('bind');
  const phase = await page.locator('#phase').inputValue();
  await page.waitForTimeout(400);
  expect(await page.locator('#phase').inputValue()).toBe(phase);
});
