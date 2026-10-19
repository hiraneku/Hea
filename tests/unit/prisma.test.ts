import { describe, expect, it, vi } from 'vitest';
import { Group, PerspectiveCamera, Scene, Texture, Vector3 } from 'three';
import { PrismaSystem, type PrismaHost } from '../../src/game/PrismaSystem';
import { ProjectileSystem } from '../../src/game/ProjectileSystem';
import type { Effects } from '../../src/game/Effects';
import type { AudioEngine } from '../../src/game/Audio';
import type { World } from '../../src/game/World';
import { SPELLS } from '../../src/game/types';
import type { TraceHit } from '../../src/game/math';
import type { Enemy } from '../../src/game/Enemy';

/** A Prisma rig with the duel around it stubbed down to what the system actually touches. */
function makePrisma(traceHit?: TraceHit) {
  const scene = new Scene();
  const camera = new PerspectiveCamera(74, 1, 0.065, 720);
  camera.position.set(0, 3, 30);
  camera.lookAt(0, 4, 0);
  const fx = {
    prismCircle: () => new Group(),
    prismBeam: vi.fn(),
    burst: vi.fn(),
    prismShards: vi.fn(),
    prismScar: vi.fn(),
    dust: vi.fn(),
    spinPrism: vi.fn(),
    shatterPrism: vi.fn(),
    discard: vi.fn(),
    hideAimTrace: vi.fn(),
    aimTrace: vi.fn(),
    lancePane: vi.fn(),
    lightBreak: vi.fn(),
    impact: vi.fn(),
    shock: vi.fn(),
    debris: vi.fn(),
    implode: vi.fn(),
    flashLight: vi.fn(),
    energyShell: vi.fn(),
  };
  const audio = {
    cast: vi.fn(),
    beam: vi.fn(),
    block: vi.fn(),
    chargeReady: vi.fn(),
    novaCharged: vi.fn(),
    crash: vi.fn(),
  };
  const world = {
    surfaceHeight: () => 0,
    pierceThin: () => null,
    damageWall: () => false,
  };
  const projectiles = new ProjectileSystem(scene, new Texture());
  const calls = {
    spendBig: 0,
    damage: [] as { amount: number; enemy?: unknown }[],
    shakes: [] as number[],
  };
  const host: PrismaHost = {
    camera,
    isFirst: () => false,
    player: () => new Vector3(0, 1.8, 24),
    bossAlive: () => true,
    bossPosition: () => new Vector3(0, 4, 0),
    aimsAtBoss: () => false,
    trace: (_start, _end, boss) => (boss ? (traceHit ?? { t: 0.5, boss: true }) : null),
    spendBig: () => calls.spendBig++,
    heldCharge: () => ({ progress: 1, charged: true }),
    addShake: (amount) => calls.shakes.push(amount),
    noteCast: vi.fn(),
    noteWorldHit: vi.fn(),
    damageBoss: (amount) => calls.damage.push({ amount }),
    damageEnemy: (enemy, amount) => calls.damage.push({ amount, enemy }),
    time: () => 0,
  };
  const prisma = new PrismaSystem(
    scene,
    fx as unknown as Effects,
    audio as unknown as AudioEngine,
    world as unknown as World,
    projectiles,
    host,
  );
  return { prisma, fx, audio, calls };
}

describe('PrismaSystem', () => {
  it('a tapped circle materialises, fires its beam at the boss, then shatters', () => {
    const { prisma, fx, calls } = makePrisma();
    prisma.raiseCircle(true);
    expect(prisma.circles).toHaveLength(1);
    expect(prisma.circles[0].group.visible).toBe(false);
    prisma.update(0.3);
    expect(prisma.beams).toBe(1);
    expect(fx.prismBeam).toHaveBeenCalled();
    expect(calls.damage).toEqual([{ amount: SPELLS[1].damage }]);
    prisma.update(1);
    expect(prisma.circles).toHaveLength(0);
    expect(fx.shatterPrism).toHaveBeenCalled();
  });

  it('a beam spends itself on a lesser construct standing in the lane', () => {
    const enemy = { marker: 'guard' } as unknown as Enemy;
    const { prisma, calls } = makePrisma({ t: 0.4, enemy });
    prisma.raiseCircle(true);
    prisma.update(0.3);
    expect(prisma.beams).toBe(1);
    expect(calls.damage).toEqual([{ amount: SPELLS[1].damage, enemy }]);
  });

  it('the held circle is paid for once and joins the circles as it is spent', () => {
    const { prisma, calls } = makePrisma();
    prisma.raiseBig();
    expect(prisma.big).not.toBeNull();
    prisma.castBig();
    expect(calls.spendBig).toBe(1);
    expect(prisma.bigCasts).toBe(1);
    expect(prisma.big).toBeNull();
    expect(prisma.circles).toHaveLength(1);
    expect(calls.damage.length).toBe(1);
    expect(calls.shakes.length).toBe(1);
  });

  it('cancelling the held circle spends nothing, and clear leaves nothing behind', () => {
    const { prisma, calls } = makePrisma();
    prisma.raiseCircle(false);
    prisma.raiseBig();
    prisma.cancelBig();
    expect(prisma.big).toBeNull();
    expect(calls.spendBig).toBe(0);
    prisma.clear();
    expect(prisma.circles).toHaveLength(0);
    expect(prisma.lastAngle).toBeNull();
  });

  it('seeded dice reset the counters the scenarios read', () => {
    const { prisma } = makePrisma();
    prisma.raiseCircle(true);
    prisma.update(0.3);
    expect(prisma.beams).toBe(1);
    let n = 0;
    prisma.seedRandom(() => (n += 0.13) % 1);
    expect(prisma.beams).toBe(0);
    expect(prisma.bigCasts).toBe(0);
    expect(prisma.lastAngle).toBeNull();
  });
});

describe('PrismaSystem charging circle', () => {
  it('rides the view, traces its sight line and chimes once when full', () => {
    const { prisma, fx, audio } = makePrisma();
    prisma.raiseBig();
    prisma.update(0.1);
    prisma.update(0.1);
    expect(fx.aimTrace).toHaveBeenCalled();
    expect(fx.spinPrism).toHaveBeenCalled();
    expect(audio.chargeReady).toHaveBeenCalledTimes(1);
    prisma.clear();
    expect(prisma.big).toBeNull();
  });
});
