import { chromium } from '@playwright/test';
import { browserOptions } from '../tests/browser.ts';
import { mkdir, writeFile } from 'node:fs/promises';
const browser = await chromium.launch(await browserOptions());
const results = [];
const quick = process.argv.includes('--quick');
const destination = quick ? '.cache/house-review/final' : '.cache/house-review';
try {
  for (const [name, width, height] of [
    ['desktop', 1440, 960],
    ['mobile', 390, 844],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      isMobile: name === 'mobile',
      hasTouch: name === 'mobile',
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(process.env.HOUSE_REVIEW_URL || 'http://localhost:5173/house/?test');
    await page.waitForFunction(
      () => window.__HEA_HOUSE__?.snapshot().character.loaded,
      {},
      { timeout: 30000 },
    );
    await mkdir(`${destination}/${name}`, { recursive: true });
    for (const id of ['living']) {
      if (name === 'mobile') await page.locator('#mobile-rooms').click();
      await page.locator(`[data-room="${id}"]`).click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${destination}/${name}/${id}.png` });
      results.push({
        name,
        id,
        state: await page.evaluate(() => window.__HEA_HOUSE__.snapshot()),
        errors: [...errors],
      });
    }
    await page.locator('#camera-toggle').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${destination}/${name}/eyes.png` });
    await page.locator('#plan-toggle').click();
    await page.screenshot({ path: `${destination}/${name}/plan.png` });
    await page.close();
  }
  await writeFile(`${destination}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
