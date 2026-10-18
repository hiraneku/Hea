import * as THREE from 'three';
import { Effects } from './Effects';
import { AudioEngine } from './Audio';
import { World } from './World';
import { ProjectileSystem } from './ProjectileSystem';
import { PRISMA, prismaAngle, shieldScale } from './combat';
import { segmentDistance, segmentSphere, type TraceHit } from './math';
import type { Enemy } from './Enemy';
import { SPELLS, type SpellId } from './types';

const FORWARD = new THREE.Vector3(0, 0, 1);
const UP = new THREE.Vector3(0, 1, 0);
/** Where Prisma circles ride on the body: the chest, not the feet. */
const PRISMA_LIFT = new THREE.Vector3(0, 1.1, 0);
const direction = new THREE.Vector3();
const viewQuaternion = new THREE.Quaternion(),
  viewPoint = new THREE.Vector3(),
  viewSide = new THREE.Vector3();

/** How the charging circle rides its caster: `reach` m ahead along the view, in the eyes. */
export type PrismaFollow = { eye: boolean; reach: number; side: number; drop: number };

/**
 * A Prisma circle: raised by a tap (or the hold), fires once, then shatters. A tapped circle
 * stays where it was raised — left behind like a shield patch, its beam already gone. The
 * large circle of the hold is the exception: `follow` carries it `reach` metres ahead of its
 * caster along the view, so it stays in front of the crosshair as the caster turns and moves.
 */
export interface PrismaCircle {
  group: THREE.Group;
  position: THREE.Vector3;
  normal: THREE.Vector3;
  /** Set only on the charging circle: it rides the view rather than the world. */
  follow: PrismaFollow | null;
  radius: number;
  /** Seconds since it began to materialise (negative while still waiting to). */
  age: number;
  /** Age at which its beam leaves; null once fired (or for the large circle after its lance). */
  fireAt: number | null;
  shatterAt: number;
  /** Age at which the beam left, for the flash of the lens; null until then. */
  firedAt: number | null;
  hasTarget: boolean;
  spin: number;
  big: boolean;
}

/**
 * A standing lance of light: the corridor a beam left behind, swept clean every frame for as
 * long as it burns.
 */
interface PrismaLance {
  start: THREE.Vector3;
  end: THREE.Vector3;
  radius: number;
  heavy: boolean;
  life: number;
}

/**
 * The duel state Prisma reads and nudges, supplied by the game. Everything else the system
 * needs (scene, effects, audio, world, projectiles) is a concrete collaborator, so this
 * interface is only the seam back into the duel itself.
 */
export interface PrismaHost {
  camera: THREE.PerspectiveCamera;
  /** The view in use right now: from the eyes, or the chase framing. */
  isFirst(): boolean;
  /** The caster's physics root (live vector; clone before keeping it). */
  player(): THREE.Vector3;
  bossAlive(): boolean;
  bossPosition(): THREE.Vector3;
  aimsAtBoss(forward: THREE.Vector3): boolean;
  trace(start: THREE.Vector3, end: THREE.Vector3, boss: boolean, radius?: number): TraceHit | null;
  /** Pay for the heavy lance: its energy cost and the slot's cooldown. */
  spendBig(): void;
  /** The charge of the held spell, for the charging circle's growth and pulse. */
  heldCharge(): { progress: number; charged: boolean };
  addShake(amount: number): void;
  /** A cast from the eyes nudges the view. */
  noteCast(): void;
  /** Record that the player's shot met the world (for impact bookkeeping). */
  noteWorldHit(ground: boolean): void;
  damageBoss(
    amount: number,
    impulse: THREE.Vector3,
    source?: { spell: SpellId; at: THREE.Vector3; along: THREE.Vector3 },
  ): void;
  /** A beam that meets a lesser construct first spends itself on that body instead. */
  damageEnemy(enemy: Enemy, amount: number): void;
  time(): number;
}

/**
 * Everything Prisma: the tapped circles and their beams, the held circle and its heavy
 * lance, and the standing lances that sweep enemy fire out of a beam's corridor. The game
 * keeps the fire control (hold timing, energy, which spell is selected); this system owns
 * the circles once raised. Extracted from `Game` unchanged in behaviour.
 */
export class PrismaSystem {
  readonly circles: PrismaCircle[] = [];
  /** The large circle while it charges, or null. */
  big: PrismaCircle | null = null;
  /** Beams fired and heavy lances cast since the duel began, for the tests. */
  beams = 0;
  bigCasts = 0;
  /** The angle the last tapped circle was raised at, so the next one turns away from it. */
  lastAngle: number | null = null;
  /**
   * How brightly the newest tapped circle is dimmed after a cast was refused: a quick dip
   * that fades back over a third of a second, so a dry tap is answered without any input
   * buffer.
   */
  dry = 0;
  private lights: PrismaLance[] = [];
  private random: () => number = Math.random;
  private chimed = false;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly fx: Effects,
    private readonly audio: AudioEngine,
    private readonly world: World,
    private readonly projectiles: ProjectileSystem,
    private readonly host: PrismaHost,
  ) {}

  /** Deterministic dice for test scenarios, with the counters that describe them zeroed. */
  seedRandom(seed: () => number) {
    this.random = seed;
    this.lastAngle = null;
    this.beams = this.bigCasts = 0;
  }

  /** Where a following circle belongs right now: `reach` metres ahead of its caster. */
  private followSpot(f: PrismaFollow, out: THREE.Vector3) {
    const camera = this.host.camera;
    camera.getWorldQuaternion(viewQuaternion);
    // The camera looks down its own -Z, so that is the axis the ring is held out along.
    viewPoint.set(0, 0, -1).applyQuaternion(viewQuaternion).multiplyScalar(f.reach);
    if (f.eye) viewPoint.add(camera.position);
    else viewPoint.add(this.host.player()).add(PRISMA_LIFT);
    if (f.side)
      viewPoint.addScaledVector(viewSide.set(1, 0, 0).applyQuaternion(viewQuaternion), f.side);
    if (f.drop)
      viewPoint.addScaledVector(viewSide.set(0, 1, 0).applyQuaternion(viewQuaternion), f.drop);
    return out.copy(viewPoint);
  }

  /** Where Prisma is aimed right now: the boss when it is in the sights, else far down the view. */
  private aim(hasTarget: boolean) {
    const camera = this.host.camera;
    camera.getWorldDirection(direction);
    return this.host.bossAlive() && (hasTarget || this.host.aimsAtBoss(direction))
      ? this.host.bossPosition().clone()
      : camera.position.clone().addScaledVector(direction, PRISMA.reach);
  }

  /**
   * A tap of Prisma: raise a small circle at a random point on the ring around the body (or
   * ahead of the eyes), on the plane square to the aim, somewhere the floor and the walls
   * leave clear, turned well away from the previous one. It fires on its own a moment later,
   * and rides with the body from then on.
   */
  raiseCircle(hasTarget: boolean) {
    const camera = this.host.camera,
      first = this.host.isFirst();
    const aim = this.aim(hasTarget);
    camera.getWorldDirection(direction);
    const centre = this.host.player().clone().add(PRISMA_LIFT);
    if (first) {
      // Ahead of the eyes, pulled in short of anything the view is pressed against.
      let depth: number = PRISMA.eyeRing.depth;
      const wall = this.host.trace(
        camera.position,
        camera.position.clone().addScaledVector(direction, depth),
        false,
        0.3,
      );
      if (wall) depth = Math.max(0.6, wall.t * depth - 0.3);
      centre.copy(camera.position).addScaledVector(direction, depth);
    }
    const toAim = aim.clone().sub(centre).normalize();
    const right = new THREE.Vector3().crossVectors(toAim, UP);
    if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
    right.normalize();
    const up = new THREE.Vector3().crossVectors(right, toAim).normalize();
    const ring = first ? PRISMA.eyeRing : PRISMA.ring;
    let position: THREE.Vector3 | null = null,
      angle = Math.PI / 2;
    for (let attempt = 0; attempt < 7 && !position; attempt++) {
      // `right` is the screen's right, so the flank band keeps the circles — and the beams
      // they fire — beside the body rather than across the crosshair and the target.
      angle = prismaAngle(this.random, this.lastAngle, PRISMA.flank);
      const radius = ring.min + (ring.max - ring.min) * this.random();
      const candidate = centre
        .clone()
        .addScaledVector(right, Math.cos(angle) * radius)
        .addScaledVector(up, Math.sin(angle) * radius);
      if (candidate.y < this.world.surfaceHeight(candidate.x, candidate.z) + 0.45) continue;
      if (this.host.trace(centre, candidate, false, 0.25)) continue;
      position = candidate;
    }
    if (!position) {
      // Nothing clear on the ring: straight above the body, lifted clear of the floor.
      position = centre.clone().addScaledVector(up, ring.min);
      position.y = Math.max(position.y, this.world.surfaceHeight(position.x, position.z) + 0.45);
    }
    this.lastAngle = angle;
    const normal = aim.clone().sub(position).normalize();
    const group = this.fx.prismCircle(false);
    group.position.copy(position);
    group.quaternion.setFromUnitVectors(FORWARD, normal);
    group.scale.setScalar(0.001);
    group.visible = false;
    this.scene.add(group);
    this.circles.push({
      group,
      position,
      normal,
      follow: null,
      radius: PRISMA.circleRadius,
      age: -PRISMA.circleDelay,
      fireAt: PRISMA.beamDelay,
      shatterAt: PRISMA.beamDelay + PRISMA.linger,
      firedAt: null,
      hasTarget,
      spin: this.random() * Math.PI * 2,
      big: false,
    });
    if (this.circles.length > 12) this.dropCircle(0, false);
  }

  /** The beam of a small circle: a thin lance from the circle to the aim, hitting at once. */
  private fireBeam(c: PrismaCircle) {
    const aim = this.aim(c.hasTarget),
      along = aim.clone().sub(c.position).normalize(),
      end = c.position.clone().addScaledVector(along, PRISMA.reach),
      hit = this.host.trace(c.position, end, true);
    if (hit) end.lerpVectors(c.position, end, hit.t);
    // The circle squares up to the beam it fires.
    c.normal.copy(along);
    c.group.quaternion.setFromUnitVectors(FORWARD, along);
    this.fx.prismBeam(c.position, end, PRISMA.beamRadius, PRISMA.beamLife);
    this.fx.burst(end, '#95f5ff', 14, 3, 0.32, 1);
    this.fx.prismShards(end, along.clone().negate(), 0.55, 6);
    this.audio.cast(1);
    this.beams++;
    this.audio.beam(false, this.host.player());
    // The curtain of light stands on the body's own line of fire — from the chest to the
    // aim — rather than on the slanted line from the circle, so what it sweeps is the lane
    // being defended, whichever side of the body the circle was raised on.
    const curtain = this.host.player().clone().add(PRISMA_LIFT);
    this.breakShots(curtain, aim, PRISMA.sweep, false);
    this.lightLance(curtain, aim, PRISMA.sweep, false);
    if (hit?.boss)
      this.host.damageBoss(SPELLS[1].damage, along.clone().multiplyScalar(1.5), {
        spell: 1,
        at: end,
        along,
      });
    else if (hit?.enemy) this.host.damageEnemy(hit.enemy, SPELLS[1].damage);
    else if (hit) {
      // Where a small beam meets the world it leaves a mark: a glass scar, a puff of dust
      // off the surface, and the record of what the shot met. It does not tear the wall
      // open — that is the heavy lance's work.
      const normal = this.surfaceNormal(hit, along);
      this.fx.prismScar(end, normal, hit.ground ? 0.75 : 0.5);
      this.fx.dust(end, 4, 0.8);
      this.host.noteWorldHit(!!hit.ground);
    }
  }

  /** The way out of the surface that stopped a beam: ground up, a wall along its deepest axis. */
  private surfaceNormal(hit: TraceHit, along: THREE.Vector3) {
    if (hit.ground) return UP.clone();
    const back = along.clone().negate(),
      ax = Math.abs(back.x),
      ay = Math.abs(back.y),
      az = Math.abs(back.z);
    if (ax >= ay && ax >= az) return new THREE.Vector3(Math.sign(back.x) || 1, 0, 0);
    if (az >= ax && az >= ay) return new THREE.Vector3(0, 0, Math.sign(back.z) || 1);
    return new THREE.Vector3(0, Math.sign(back.y) || 1, 0);
  }

  /**
   * The hold: one large circle raised ahead of the caster along the view — not at the
   * boss — which charges as it rides that same view, and fires the heavy lance wherever
   * the crosshair is pointed when the button comes up.
   */
  raiseBig() {
    const camera = this.host.camera;
    camera.getWorldDirection(direction);
    const first = this.host.isFirst();
    const anchor = first ? camera.position.clone() : this.host.player().clone().add(PRISMA_LIFT);
    let reach = first ? 1.8 : 1.6;
    const wall = this.host.trace(
      anchor,
      anchor.clone().addScaledVector(direction, reach),
      false,
      0.4,
    );
    if (wall) reach = Math.max(0.5, wall.t * reach - 0.4);
    const follow: PrismaFollow = {
      eye: first,
      reach,
      side: first ? 0.12 : 0,
      drop: first ? -0.1 : 0,
    };
    const position = new THREE.Vector3();
    this.followSpot(follow, position);
    const group = this.fx.prismCircle(true);
    group.position.copy(position);
    group.quaternion.setFromUnitVectors(FORWARD, direction);
    group.scale.setScalar(0.001);
    this.scene.add(group);
    this.big = {
      group,
      position,
      normal: direction.clone(),
      follow,
      radius: PRISMA.big.circleRadius,
      age: 0,
      fireAt: null,
      shatterAt: Infinity,
      firedAt: null,
      hasTarget: false,
      spin: 0,
      big: true,
    };
    this.chimed = false;
  }

  /** Released before the charge is full: the large circle breaks up, nothing is spent. */
  cancelBig() {
    const b = this.big;
    if (!b) return;
    this.big = null;
    this.fx.hideAimTrace();
    this.fx.shatterPrism(b.group, b.normal, b.group.scale.x, 10);
  }

  /**
   * The heavy lance: ten times the beam's radius, bores through thin walls on its way (and
   * scars thick ones), and lands through the heavy-hit path — contact pause, impact frame
   * and a launch — for 90 damage.
   */
  castBig() {
    const b = this.big;
    if (!b) return;
    this.big = null;
    this.fx.hideAimTrace();
    this.host.spendBig();
    const along = b.normal.clone().normalize(),
      far = b.position.clone().addScaledVector(along, PRISMA.reach),
      sweep = PRISMA.big.radius * 0.6;
    let hit = this.host.trace(b.position, far, true, sweep),
      gouged = 0;
    // Four bites: thin slabs are bored clean through, thick ones are gouged and the lance
    // is followed into the wound, so masonry that used to stop it is eaten away instead.
    for (let n = 0; n < 4 && hit?.obstacle; n++) {
      const contact = b.position.clone().lerp(far, hit.t);
      const bored = this.world.pierceThin(hit.obstacle, b.position, along, contact);
      if (!bored) {
        const carved = this.world.damageWall(
          hit.obstacle,
          contact,
          along.clone().multiplyScalar(34),
          PRISMA.big.crater,
        );
        this.fx.burst(contact, '#dffbff', 26, 7, 0.4, 2);
        this.fx.debris(contact, 16, 8, 1.4, along);
        if (!carved) break;
        gouged++;
      } else {
        this.fx.burst(bored.entry, '#dffbff', 22, 6, 0.35, 2);
        this.fx.debris(bored.entry, 12, 7, 1.2, along.clone().negate());
      }
      hit = this.host.trace(b.position, far, true, sweep);
    }
    const end = hit ? b.position.clone().lerp(far, hit.t) : far;
    b.normal.copy(along);
    b.group.quaternion.setFromUnitVectors(FORWARD, along);
    this.fx.prismBeam(b.position, end, PRISMA.big.radius, 0.45, true);
    // The impact: a real blow, wherever it lands — a shock ring, a plume, stinging debris.
    this.fx.impact(end, '#dff9ff', true, 1.5);
    this.fx.shock(end, '#cdf4ff', 15);
    this.fx.debris(end, 26, 9, 1.5, along);
    this.fx.dust(end, 16, 3.2);
    this.fx.prismShards(end, along.clone().negate(), 1.8, 20);
    if (gouged > 0 || hit?.obstacle) this.fx.burst(end, '#ffffff', 20, 8, 0.3, 2);
    this.audio.cast(1);
    this.audio.novaCharged();
    this.audio.beam(true, this.host.player());
    if (hit && !hit.boss) this.audio.crash(1.6, end, 'wall');
    this.host.addShake(hit?.boss ? 0.028 : 0.05);
    if (this.host.isFirst()) this.host.noteCast();
    this.bigCasts++;
    this.breakShots(b.position, end, PRISMA.big.sweep, true);
    this.lightLance(b.position, end, PRISMA.big.sweep, true);
    if (hit?.boss)
      this.host.damageBoss(
        PRISMA.big.damage,
        along.clone().multiplyScalar(PRISMA.big.impulse).addScaledVector(UP, 2),
        { spell: 1, at: end, along },
      );
    else if (hit?.enemy) this.host.damageEnemy(hit.enemy, PRISMA.big.damage);
    // The spent circle hangs a moment longer, then breaks like the small ones.
    b.age = 0;
    b.fireAt = null;
    b.firedAt = 0;
    b.shatterAt = PRISMA.big.linger;
    this.circles.push(b);
  }

  /**
   * Sweep enemy fire out of a beam's path. The light lance breaks bolts and seekers; the
   * heavy lance breaks anything flying, including the solar sphere and the vortex seed.
   */
  private lightLance(start: THREE.Vector3, end: THREE.Vector3, radius: number, heavy: boolean) {
    const life = heavy ? 0.45 : PRISMA.beamLife;
    // The lance itself is drawn where it lands, not along its length: it breaks what it
    // touches and shows a pane at each contact, but it does not leave a thread hanging
    // from the caster.
    this.lights.push({ start: start.clone(), end: end.clone(), radius, heavy, life });
  }

  /** Break a shot against a lance: a flash at the contact, a puff of glass and a chime. */
  private breakShot(index: number, at: THREE.Vector3, lance?: PrismaLance) {
    const p = this.projectiles.list[index];
    if (!p) return;
    const travel = p.velocity.clone().normalize();
    // The curtain shows itself where the shot ran into it: a pane of light square to the
    // lance, so the light that did the stopping is the thing that is seen.
    if (lance) this.fx.lancePane(at, lance.end.clone().sub(lance.start), lance.radius, lance.heavy);
    this.fx.burst(at, '#dffbff', 22, 6, 0.32, 1.4);
    this.fx.prismShards(at, travel, 0.7, 8);
    this.fx.shock(at, '#bff0ff', 4.5);
    // The shot goes off on the light plane itself: its own body splashes and fades there,
    // its fire detonates, and the prism's glass scatters — it is destroyed, not parked in
    // mid-air.
    this.fx.lightBreak(p.mesh, travel, p.kind, shieldScale(p.radius));
    this.audio.block(p.kind, p.last);
    this.projectiles.remove(index, true);
  }

  /** The shots a lance already stood across in the instant it was fired. */
  private breakShots(start: THREE.Vector3, end: THREE.Vector3, radius: number, heavy: boolean) {
    const lance: PrismaLance = { start, end, radius, heavy, life: 0 };
    for (let i = this.projectiles.list.length - 1; i >= 0; i--) {
      const p = this.projectiles.list[i];
      if (p.kind === 'player') continue;
      const stubborn = p.kind === 'hammer' || p.kind === 'vortex';
      if (stubborn && !heavy) continue;
      const t = segmentSphere(start, end, p.mesh.position, radius + p.radius);
      if (t !== null) this.breakShot(i, start.clone().lerp(end, t), lance);
    }
  }

  /**
   * Sweep the standing lances across every shot in the air. A bolt fast enough to cross
   * the whole corridor inside one frame is still caught: the check is between the path
   * the shot flew this frame and the lance, not between two points.
   */
  private sweepLances() {
    if (!this.lights.length || !this.projectiles.list.length) return;
    for (let i = this.projectiles.list.length - 1; i >= 0; i--) {
      const p = this.projectiles.list[i];
      if (p.kind === 'player') continue;
      const stubborn = p.kind === 'hammer' || p.kind === 'vortex';
      for (const lance of this.lights) {
        if (stubborn && !lance.heavy) continue;
        if (
          segmentDistance(lance.start, lance.end, p.last, p.mesh.position) >
          lance.radius + p.radius
        )
          continue;
        this.breakShot(i, p.mesh.position.clone(), lance);
        break;
      }
    }
  }

  private dropCircle(index: number, shatter: boolean) {
    const [c] = this.circles.splice(index, 1);
    if (shatter) this.fx.shatterPrism(c.group, c.normal, c.group.scale.x, c.big ? 26 : 9);
    else this.fx.discard(c.group);
  }

  clear() {
    while (this.circles.length) this.dropCircle(0, false);
    if (this.big) {
      this.fx.discard(this.big.group);
      this.big = null;
    }
    this.chimed = false;
    this.lastAngle = null;
    this.dry = 0;
    this.lights.length = 0;
    this.fx.hideAimTrace();
  }

  /** Materialise, spin, fire and shatter the circles; grow and pulse the charging one. */
  update(dt: number) {
    for (let i = this.lights.length - 1; i >= 0; i--) {
      const lance = this.lights[i];
      lance.life -= dt;
      if (lance.life <= 0) this.lights.splice(i, 1);
    }
    this.sweepLances();
    for (let i = this.circles.length - 1; i >= 0; i--) {
      const c = this.circles[i];
      c.age += dt;
      // The spent circle of the hold keeps riding the view; a tapped circle is left behind.
      if (c.follow) {
        this.host.camera.getWorldDirection(direction);
        this.followSpot(c.follow, c.position);
        c.normal.copy(direction);
        c.group.position.copy(c.position);
        c.group.quaternion.setFromUnitVectors(FORWARD, c.normal);
      }
      if (c.age < 0) continue;
      c.group.visible = true;
      if (!c.big) {
        // Opens unhurried — a slow bloom rather than a snap — then spins up as it is born.
        const appear = Math.min(1, c.age / PRISMA.appear),
          ease = appear * appear * (3 - 2 * appear),
          overshoot = 1 + 0.1 * Math.sin(Math.min(1, c.age / (PRISMA.appear + 0.08)) * Math.PI);
        c.group.scale.setScalar(c.radius * (0.22 + 0.78 * ease) * overshoot);
        c.spin += dt * (2.2 + (c.fireAt === null ? 0 : 6.5 * ease));
      } else c.spin += dt * 2.5;
      if (c.fireAt !== null && c.age >= c.fireAt) {
        c.fireAt = null;
        c.firedAt = c.age;
        this.fireBeam(c);
      }
      // Dims as it hangs spent; the lens flares as the beam leaves.
      const spent = c.firedAt === null ? 1 : Math.max(0, 1 - c.age / c.shatterAt),
        flash = c.firedAt === null ? 0 : Math.max(0, 1 - (c.age - c.firedAt) / 0.14);
      // A refused cast dips the newest circle: the click was heard, the spell was not paid for.
      const dry = i === this.circles.length - 1 ? 1 - 0.6 * Math.min(1, this.dry * 3) : 1;
      this.fx.spinPrism(
        c.group,
        c.spin,
        (0.45 + 0.55 * spent + flash * 0.7) * dry,
        ((c.firedAt === null ? 0.6 : 0.9) + flash * 1.2) * dry,
      );
      if (c.age >= c.shatterAt) this.dropCircle(i, true);
    }
    const b = this.big;
    if (b) {
      b.age += dt;
      // The charging circle is held out in front of the caster and follows the view: turning
      // the camera carries the ring round with it.
      this.host.camera.getWorldDirection(direction);
      this.followSpot(b.follow!, b.position);
      b.normal.copy(direction);
      b.group.position.copy(b.position);
      b.group.quaternion.setFromUnitVectors(FORWARD, b.normal);
      const { progress, charged } = this.host.heldCharge();
      const pulse = charged ? 1 + 0.06 * Math.sin(this.host.time() * 20) : 1;
      b.group.scale.setScalar(b.radius * (0.3 + 0.7 * progress) * pulse);
      b.spin += dt * (2 + 9 * progress);
      this.fx.spinPrism(b.group, b.spin, 0.6 + 0.4 * progress, 0.5 + progress);
      // The sight of the charging lance: a hairline out of the circle to wherever the
      // crosshair points, closed by a ring where it would land, brightening as the charge
      // fills.
      const far = b.position.clone().addScaledVector(direction, PRISMA.reach),
        sight = this.host.trace(b.position, far, true);
      if (sight) far.lerpVectors(b.position, far, sight.t);
      this.fx.aimTrace(b.position, far, progress);
      if (charged && !this.chimed) {
        this.chimed = true;
        this.audio.chargeReady();
        this.fx.burst(b.position, '#fff6dc', 16, 2.2, 0.3, 1);
      }
    } else this.fx.hideAimTrace();
    this.dry = Math.max(0, this.dry - dt);
  }
}
