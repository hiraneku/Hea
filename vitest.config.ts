import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Coverage is a contract for the pure-logic modules that can be tested without a
      // renderer: the duel maths, flight/motion models, shield registry, adaptive
      // resolution, settings and the extracted camera/projectile/Prisma systems. The
      // render-heavy shells (Game, Effects, World, Audio, DOM) are covered by the
      // Playwright suite instead, so they stay out of the denominator.
      include: [
        'src/game/math.ts',
        'src/game/adaptive.ts',
        'src/game/combat.ts',
        'src/game/flight.ts',
        'src/game/motion.ts',
        'src/game/pattern.ts',
        'src/game/reverb.ts',
        'src/game/terrainGrid.ts',
        'src/game/destruction.ts',
        'src/game/ShieldPatches.ts',
        'src/game/types.ts',
        'src/game/CameraRig.ts',
        'src/game/ProjectileSystem.ts',
        'src/game/PrismaSystem.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 85,
        branches: 65,
        statements: 80,
      },
    },
  },
});
