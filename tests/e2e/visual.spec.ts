import { test, expect, type Page } from '@playwright/test';
import type { Snapshot } from '../../src/game/types';
import type { Game } from '../../src/game/Game';

declare global {
  interface Window {
    __HEA_DEBUG__: {
      snapshot(): Snapshot;
      diagnostics(): Game['diagnostics'];
      harness: ReturnType<Game['testHarness']>;
    };
  }
}

/**
 * Golden screenshots of the effects work, rendered by the software rasteriser in a small fixed
 * viewport. Everything that feeds a frame is pinned: the harness steps the simulation by hand,
 * `Math.random` is reseeded right before each step, and only the WebGL canvas is captured (the
 * DOM HUD, with its clock and FPS counter, is excluded). Tolerances absorb minor rasterisation
 * differences between machines; a real regression (a missing decal, a patch that no longer
 * brightens, a flip that does not happen) moves far more than 2 % of the pixels.
 */
const SNAPSHOT = { maxDiffPixelRatio: 0.02, threshold: 0.3 } as const;
test.use({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 1 });

async function load(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'hea-settings',
      JSON.stringify({ quality: 'low', sound: false, reducedEffects: false }),
    );
    HTMLCanvasElement.prototype.requestPointerLock = () =>
      Promise.reject(new Error('Test iframe: pointer lock unavailable'));
  });
  await page.goto('/?test');
  await expect(page.locator('#boot')).toBeHidden({ timeout: 30_000 });
  await expect(page.locator('#start-button')).toBeVisible();
  // Only the rendered frame is under test: hide the DOM HUD (clock, FPS counter, menus).
  await page.addStyleTag({
    content: '#experience > :not(#arena) { visibility: hidden !important; }',
  });
}
/** Deterministic particles: a small xorshift generator replaces Math.random for the step. */
async function seededStep(page: Page, seconds: number, seed = 1) {
  await page.evaluate(
    ([seconds, seed]) => {
      let state = (seed * 2654435761) >>> 0 || 1;
      Math.random = () => {
        state ^= state << 13;
        state >>>= 0;
        state ^= state >>> 17;
        state ^= state << 5;
        state >>>= 0;
        return state / 4294967296;
      };
      window.__HEA_DEBUG__.harness!.step(seconds);
    },
    [seconds, seed] as const,
  );
}
async function settle(page: Page) {
  // Two animation frames: one to flush the pending render, one more so nothing is mid-flight.
  await page.evaluate(
    () =>
      new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))),
  );
}
async function scene(page: Page, name: string) {
  await page.evaluate((name) => {
    const h = window.__HEA_DEBUG__.harness!;
    h.freeze(true);
    h.scenario(name);
  }, name);
}
const canvas = (page: Page) => page.locator('#arena');

test.describe('golden frames', () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== 'desktop', 'golden frames are rendered once, on desktop');
  });

  test('skid marks and dust trail behind a dragged body', async ({ page }) => {
    await load(page);
    await scene(page, 'ground-skid');
    await seededStep(page, 2.1, 11);
    // Look back along the slide so the decals laid behind the body are in frame.
    await page.evaluate(() => window.__HEA_DEBUG__.harness!.face(Math.PI, -0.25));
    await seededStep(page, 0.02, 12);
    await settle(page);
    const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
    expect(d.particles.marks).toBeGreaterThan(10);
    await expect(canvas(page)).toHaveScreenshot('skid-marks.png', SNAPSHOT);
  });

  test('a shield patch brightening and rippling under repeated hits', async ({ page }) => {
    await load(page);
    await scene(page, 'shield-line');
    await seededStep(page, 0.07, 21);
    await settle(page);
    const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
    expect(d.patchReuses).toBeGreaterThanOrEqual(1);
    expect(d.shieldEchoes.length).toBeGreaterThanOrEqual(1);
    await expect(canvas(page)).toHaveScreenshot('shield-charge.png', SNAPSHOT);
  });

  test('the mid-air somersault with its puff', async ({ page }) => {
    await load(page);
    await scene(page, 'air-recover');
    await seededStep(page, 1.72, 31);
    await settle(page);
    const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
    expect(d.ragdoll.playerFlipping).toBe(true);
    await expect(canvas(page)).toHaveScreenshot('air-flip.png', SNAPSHOT);
  });

  test('the frozen heavy-contact frame with the camera punched in', async ({ page }) => {
    await load(page);
    await scene(page, 'player-air');
    await seededStep(page, 0.06, 41);
    await settle(page);
    const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
    expect(d.hitPause).toBeGreaterThan(0);
    expect(d.fov).toBeLessThan(70);
    await expect(canvas(page)).toHaveScreenshot('heavy-contact.png', SNAPSHOT);
  });

  test('the arena from above: warped terrain grid, rooftops and the low-cover band', async ({
    page,
  }) => {
    await load(page);
    await scene(page, 'flight');
    await page.evaluate(() => {
      const h = window.__HEA_DEBUG__.harness!;
      h.place([30, 52, 78], [-2, 5.8, 1.5]);
      h.face(0.35, -0.72);
    });
    await seededStep(page, 0.02, 51);
    await settle(page);
    expect((await page.evaluate(() => window.__HEA_DEBUG__.snapshot().position)).y).toBeCloseTo(
      52,
      0,
    );
    await expect(canvas(page)).toHaveScreenshot('arena-overview.png', SNAPSHOT);
  });
});
