// Actual gameplay QA, not an independent rig viewer. Uses existing DEV-only
// scenarios/input and observer camera. Images/diagnostics stay ignored.
// node --experimental-strip-types scripts/review-movement.mjs [before|after]
import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import { browserOptions } from '../tests/browser.ts';
import { mkdir, writeFile } from 'node:fs/promises';
const destination = `.cache/movement-review/${process.argv[2] || 'after'}`;
const server = await createServer({ server: { host: '127.0.0.1', port: 0 } });
let browser;
try {
  await mkdir(destination, { recursive: true });
  await server.listen();
  browser = await chromium.launch(await browserOptions());
  const page = await browser.newPage({ viewport: { width: 900, height: 680 } });
  await page.addInitScript(() => {
    localStorage.setItem(
      'hea-settings',
      JSON.stringify({ quality: 'low', sound: false, reducedEffects: true }),
    );
    HTMLCanvasElement.prototype.requestPointerLock = () =>
      Promise.reject(new Error('Review: no pointer lock'));
  });
  await page.goto(`http://localhost:${server.httpServer.address().port}/?test`);
  await page.locator('#boot').waitFor({ state: 'hidden', timeout: 30000 });
  const records = [];
  const step = (seconds) => page.evaluate((s) => window.__HEA_DEBUG__.harness.step(s), seconds);
  const scenario = (name) =>
    page.evaluate((name) => {
      const h = window.__HEA_DEBUG__.harness;
      h.freeze(true);
      h.scenario(name);
    }, name);
  const shot = async (name) => {
    const data = await page.evaluate(() => {
      const d = window.__HEA_DEBUG__.diagnostics();
      const h = window.__HEA_DEBUG__.harness;
      const p = d.playerPosition;
      h.observe([p[0] + 2.6, p[1] + 1.5, p[2] + 2.6], [p[0], p[1] + 0.8, p[2]]);
      const avatar = h.scene().getObjectByName('player-avatar');
      return {
        diagnostics: d,
        avatarPosition: avatar.position.toArray(),
        avatarQuaternion: avatar.quaternion.toArray(),
      };
    });
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    await page.screenshot({ path: `${destination}/${name}.png` });
    records.push({ name, ...data });
  };
  await scenario('walk');
  await step(1.8);
  await shot('ground-idle');
  await page.keyboard.down('KeyW');
  await step(0.8);
  await shot('ground-forward');
  await page.keyboard.up('KeyW');
  await page.keyboard.down('KeyD');
  await step(0.25);
  await shot('ground-turn');
  await page.keyboard.up('KeyD');
  await page.keyboard.down('KeyS');
  await step(0.8);
  await shot('ground-backward');
  await page.keyboard.up('KeyS');
  await step(1.8);
  await shot('ground-stop');
  await scenario('flight');
  await step(1.8);
  await shot('flight-hover');
  await page.keyboard.down('KeyW');
  await step(0.6);
  await shot('flight-forward');
  await page.keyboard.up('KeyW');
  await page.keyboard.down('KeyS');
  await step(0.18);
  await shot('flight-reversal');
  await page.keyboard.up('KeyS');
  await step(0.8);
  await shot('flight-brake');
  await page.keyboard.press('KeyF');
  await step(1 / 60);
  await shot('flight-toggle-first');
  await step(1);
  await shot('flight-toggle-settled');
  await scenario('flight');
  await step(1.8);
  await page.keyboard.press('ShiftLeft');
  await step(0.016);
  await shot('dash-start');
  await step(0.1);
  await shot('dash-burst');
  await step(0.3);
  await shot('dash-tail');
  await step(0.5);
  await shot('dash-recovered');
  await scenario('walk');
  await step(1.8);
  await page.keyboard.press('Space');
  await step(0.22);
  await shot('jump-first');
  await page.keyboard.press('Space');
  await step(0.18);
  await shot('jump-second');
  await step(2);
  await shot('jump-landed');
  await scenario('ragdoll');
  await step(0.18);
  await shot('ragdoll-hit');
  await step(0.9);
  await shot('ragdoll-tumble');
  await step(8);
  await shot('ragdoll-recovered');
  await scenario('ground-skid');
  await step(0.7);
  await shot('ground-slide');
  await step(8);
  await shot('slide-recovered');
  if ((process.argv[2] || 'after') !== 'before') {
    await scenario('flight');
    await step(1.8);
    await page.evaluate(() => window.__HEA_DEBUG__.harness.face(0, 1));
    await step(1 / 60);
    await shot('look-pitch-first');
    await step(0.2);
    await shot('look-pitch-settled');
    await scenario('ground-skid');
    await page.evaluate(() => {
      const h = window.__HEA_DEBUG__.harness;
      for (let i = 0; i < 480; i++) {
        h.step(1 / 60);
        if (window.__HEA_DEBUG__.diagnostics().ragdoll.playerPhase === 'recover') break;
      }
    });
    await shot('slide-recovery-start');
    await step(0.15);
    await shot('slide-recovery-middle');
    await step(1);
    await shot('slide-recovery-end');
  }
  await writeFile(`${destination}/diagnostics.json`, JSON.stringify(records, null, 2));
  console.log(`Saved ${records.length} actual-gameplay frames and diagnostics to ${destination}`);
} finally {
  await browser?.close();
  await server.close();
}
