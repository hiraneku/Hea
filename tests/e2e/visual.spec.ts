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
    // Golden frames are rendered at the tier's full resolution: the adaptive ladder is fed by the
    // live loop, so on a slow machine it would have dropped a rung or two by now and every
    // golden would depend on how long the machine took to get here.
    h.frameBudget(0, 0, true);
  }, name);
}
const canvas = (page: Page) => page.locator('#arena');

test.describe('golden frames', () => {
  // Playwright requires the fixtures object as the first argument, even when unused.
  // eslint-disable-next-line no-empty-pattern
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== 'desktop', 'golden frames are rendered once, on desktop');
  });

  test('the furrow ploughed by a dragged body: a trough with lifted earth on both sides', async ({
    page,
  }) => {
    await load(page);
    await scene(page, 'ground-skid');
    await seededStep(page, 2.1, 11);
    // Look back along the slide so the strip laid behind the body is in frame.
    await page.evaluate(() => window.__HEA_DEBUG__.harness!.face(0, -0.25));
    await seededStep(page, 0.02, 12);
    await settle(page);
    const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
    expect(d.particles.furrow).toBeGreaterThan(10);
    expect(d.particles.furrows).toBeLessThanOrEqual(2);
    await expect(canvas(page)).toHaveScreenshot('drag-furrow.png', SNAPSHOT);
  });

  test('a shattering patch: hex pieces peeling off behind a hexagonal shockwave', async ({
    page,
  }) => {
    await load(page);
    await scene(page, 'shield-volley');
    await seededStep(page, 0.36, 61);
    await seededStep(page, 0.1, 62);
    await settle(page);
    const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
    expect(d.patchShatters).toBe(1);
    expect(d.particles.shards).toBe(1);
    await expect(canvas(page)).toHaveScreenshot('shield-shatter.png', SNAPSHOT);
  });

  test('a patch materialising cell by cell ahead of the first bolt', async ({ page }) => {
    await load(page);
    await scene(page, 'shield-volley');
    // Half-way through the 0.14 s appearance: part of the hex grid is still missing.
    await seededStep(page, 0.07, 81);
    await settle(page);
    const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
    expect(d.shieldPatches.length).toBeGreaterThanOrEqual(1);
    expect(d.patchShatters).toBe(0);
    await expect(canvas(page)).toHaveScreenshot('shield-appear.png', SNAPSHOT);
  });

  test('patches dissolving cell by cell once their bolts are spent', async ({ page }) => {
    await load(page);
    await scene(page, 'shield');
    // The patches live 1.5 s after their block and fade over the last 0.16 s of it.
    await seededStep(page, 1.3, 91);
    await seededStep(page, 0.12, 92);
    await settle(page);
    const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
    expect(d.shieldPatches.length).toBe(3);
    for (const patch of d.shieldPatches) expect(patch.life).toBeLessThan(0.16);
    await expect(canvas(page)).toHaveScreenshot('shield-dissolve.png', SNAPSHOT);
  });

  test('a solar vortex pulling the body and every ember towards its core', async ({ page }) => {
    await load(page);
    await scene(page, 'shield');
    await page.evaluate(() => window.__HEA_DEBUG__.harness!.castBoss('vortex'));
    await seededStep(page, 1.3, 71);
    await seededStep(page, 0.6, 72);
    await settle(page);
    const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
    expect(d.wells).toHaveLength(1);
    expect(Math.hypot(...d.pull)).toBeGreaterThan(0.5);
    await expect(canvas(page)).toHaveScreenshot('solar-vortex.png', SNAPSHOT);
  });

  test('a bolt crushing against a standing patch that has already taken a hit', async ({
    page,
  }) => {
    await load(page);
    await scene(page, 'shield-line');
    await seededStep(page, 0.09, 21);
    await settle(page);
    const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
    expect(d.patchReuses).toBeGreaterThanOrEqual(1);
    expect(d.shieldEchoes.length).toBeGreaterThanOrEqual(1);
    expect(d.particles.shieldImpacts).toBeGreaterThanOrEqual(2);
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

  test('the jointed ragdoll mid-drag: a crumpled figure, limbs trailing, nothing underground', async ({
    page,
  }) => {
    await load(page);
    await scene(page, 'ragdoll-ground');
    await seededStep(page, 0.62, 61);
    // Pin an observer camera beside the figure; the chase camera lags a body thrown this fast.
    await page.evaluate(() => {
      const h = window.__HEA_DEBUG__.harness!,
        figure = window.__HEA_DEBUG__.diagnostics().ragdoll.playerFigure!;
      const [x, y, z] = figure.pelvis;
      h.observe([x + 2.4, y + 1.1, z + 2.6], [x, y + 0.1, z]);
    });
    await seededStep(page, 0.02, 62);
    await settle(page);
    const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
    expect(d.ragdoll.player).toBe(true);
    expect(d.ragdoll.playerFigure!.span).toBeGreaterThan(0.3);
    await expect(canvas(page)).toHaveScreenshot('ragdoll-drag.png', SNAPSHOT);
  });

  test('the boss mid-cast: the enlarged body leaning into its sigils with the gates lit', async ({
    page,
  }) => {
    await load(page);
    await scene(page, 'walk-live');
    // Run the duel until the first salvo is in the air, then look at the boss from the side.
    for (let t = 0; t < 8; t += 0.25) {
      await seededStep(page, 0.25, 71 + t * 4);
      const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
      if (d.fireGates.length > 0 && d.attacksFired.fire > 0) break;
    }
    await page.evaluate(() => {
      const h = window.__HEA_DEBUG__.harness!,
        d = window.__HEA_DEBUG__.diagnostics();
      const [x, y, z] = d.bossPosition,
        [px, , pz] = d.playerPosition;
      // Three quarters behind the player's shoulder, framing boss and gates together.
      const dx = x - px,
        dz = z - pz,
        len = Math.hypot(dx, dz) || 1;
      h.observe(
        [x - (dx / len) * 9 - (dz / len) * 5, y + 1.5, z - (dz / len) * 9 + (dx / len) * 5],
        [x, y + 0.6, z],
      );
    });
    await seededStep(page, 0.02, 72);
    await settle(page);
    const d = await page.evaluate(() => window.__HEA_DEBUG__.diagnostics());
    expect(d.fireGates.length).toBeGreaterThan(0);
    await expect(canvas(page)).toHaveScreenshot('boss-cast.png', SNAPSHOT);
  });

  test('the arena from above: warped terrain grid, rooftops and the low-cover band', async ({
    page,
  }) => {
    await load(page);
    await scene(page, 'flight');
    // The 400 m city does not fit under the 70 m flight ceiling: pin an observer camera
    // well above the outer ring instead of flying the player up there.
    await page.evaluate(() => window.__HEA_DEBUG__.harness!.observe([60, 110, 150], [0, 0, 10]));
    await seededStep(page, 0.02, 51);
    await settle(page);
    expect(
      (await page.evaluate(() => window.__HEA_DEBUG__.diagnostics())).walls.length,
    ).toBeGreaterThan(30);
    await expect(canvas(page)).toHaveScreenshot('arena-overview.png', SNAPSHOT);
  });
});
