import { expect, test } from '@playwright/test';

test('Batu raises persistent stalagmites and owns the Battle Mode ultimate', async ({ page }) => {
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

  // Basic attack: a rising line becomes solid and remains at its cast location.
  await page.evaluate(() => {
    window.__HEA_DEBUG__.harness!.castPlayer();
    window.__HEA_DEBUG__.harness!.step(2.2);
  });
  const firstLine = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics().stoneSpikes);
  expect(firstLine.length).toBeGreaterThanOrEqual(2);
  expect(firstLine.every((spike) => spike.solid)).toBe(true);
  const fixedPosition = firstLine[firstLine.length - 1].position;

  // Another spell's projectiles collide with the solid row, damage a spike, then break it.
  await page.locator('.spell-slot[data-spell="0"]').click();
  await page.evaluate(() => {
    const debug = window.__HEA_DEBUG__;
    debug.harness!.castPlayer();
    debug.harness!.step(0.5);
  });
  const cracked = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics().stoneSpikes);
  expect(cracked[0].health).toBeLessThan(72);
  await page.evaluate(() => {
    const debug = window.__HEA_DEBUG__;
    debug.harness!.castPlayer();
    debug.harness!.step(0.5);
  });
  const afterBreak = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics().stoneSpikes);
  expect(afterBreak).toHaveLength(firstLine.length - 1);

  await page.evaluate(() => {
    const debug = window.__HEA_DEBUG__;
    const state = debug.snapshot();
    debug.harness!.place(
      [state.position.x + 4, state.position.y, state.position.z],
      debug.diagnostics().bossPosition,
    );
    debug.harness!.step(0.1);
  });
  const afterMove = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics().stoneSpikes);
  expect(afterMove.some((spike) => spike.position.join(',') === fixedPosition.join(','))).toBe(
    true,
  );

  await page.locator('.spell-slot[data-spell="4"]').click();
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(button).toHaveAttribute('aria-label', 'Battle Mode aktif');
  await expect(button).toBeDisabled();
  const active = await page.evaluate(() => window.__HEA_DEBUG__.snapshot());
  expect(active.earthBattleActive).toBe(true);
  expect(active.energy).toBeLessThan(60);

  // Switching away hides the Batu-only ultimate; it does not turn the active effect into a universal control.
  await page.locator('.spell-slot[data-spell="0"]').click();
  await expect(button).toBeHidden();
  expect((await page.evaluate(() => window.__HEA_DEBUG__.snapshot())).earthBattleActive).toBe(true);

  // Re-selecting Batu shows its ultimate again, still on cooldown.
  await page.locator('.spell-slot[data-spell="4"]').click();
  await expect(button).toBeVisible();
  await expect(button).toBeDisabled();
  expect(
    (await page.evaluate(() => window.__HEA_DEBUG__.snapshot())).earthUltimateCooldown,
  ).toBeGreaterThan(0.9);

  // Victory ends the battle and releases every surviving stone collider.
  await page.evaluate(() => {
    const harness = window.__HEA_DEBUG__.harness!;
    harness.damageBoss(10_000);
    harness.step(2);
  });
  const ended = await page.evaluate(() => ({
    mode: window.__HEA_DEBUG__.snapshot().mode,
    spikes: window.__HEA_DEBUG__.diagnostics().stoneSpikes,
  }));
  expect(ended.mode).toBe('victory');
  expect(ended.spikes).toHaveLength(0);
});
