# Task 2 — existing movement polish, no new combat animations

21 October 2026. Baseline: `8f6f19cab86544c9cc96a24c1acf97ac37edf80a`.
Walking stays **revision 2**, rig **v9**. This change does not generate/export any
animation or modify a GLB, character geometry, skin, material or control binding.

## Audit before implementation

| System inspected                              | Actual implementation and ownership                                                                                                                                                                                                                                                                        | Decision                                                                                                                                         |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ground motion / reversals / strafe / backward | `Game.updatePlayer`: camera-relative `flightWish`, ground pace/directional scaling, existing critically damped `advanceFlight` motor, then `moveBody` collisions. `CharacterFacing` controls presentation yaw only. Unlocked travel-facing and stopped-heading hold are GERAK 8 rules.                     | Fix an antipodal yaw-jitter case; retain motor, pace, strafe/backward coefficients and input rules.                                              |
| Skeletal locomotion / pivots / stop           | `AvatarModel` uses `CharacterPlayback` plus `CharacterLocomotion`, `CharacterPivot`, `CharacterArmSpace`. Start/stop helpers bake temporary phase-specific tracks; directional/run/sprint pose is procedural skeletal control.                                                                             | Leave these gait/step calculations unchanged. No Walking redesign.                                                                               |
| Six-axis flight                               | `Controls`, `Game.setFlight/updatePlayer`, `flightWish`, `advanceFlight`. Vertical thrust/braking, ceiling and hover assistance belong to physics.                                                                                                                                                         | Existing acceleration/braking/reversal tests already pass; keep motor. Smooth the visual mode-dependent offset/lean instead.                     |
| Air dash                                      | `AirDash` in `motion.ts`: additive velocity, rise/hold/fall and curved steering; `Game` owns cooldown and post-dash boost. There is no dedicated dash animation clip.                                                                                                                                      | Include existing dash velocity in presentation facing/lean; do not change burst, steering, collision or invulnerability.                         |
| Double jump / landing                         | `Game` applies first/second vertical velocities, limits jump count, restores gravity and resets count on contact. Avatar receives the airborne flag; another jump while airborne does not retrigger the pose controller.                                                                                   | Preserve both impulses, gravity, landing handling and airborne state rules. No jump/landing clip added.                                          |
| Knockback / tumble / slide / recovery         | `LaunchRelease`, `BodyTumble`, `Game.moveBody`, `landingSlide`, `groundFriction`; `Ragdoll` is a separate 15-point Verlet figure with constraints/collisions. Its limbs are not the GLB skeleton. Existing recovery eases orientation and pulls the figure toward standing before handing visibility back. | Retain collision/physics and recovery timing. Do not replace the system or add hit-reaction clips. Representation mismatch remains a limitation. |
| Head / neck                                   | `CharacterFacing` already smooths bounded yaw and rear-gaze fade. `CharacterLook` clears the previous offset before mixer updates, then adds Neck/Head offsets after playback and pose overlays. Pitch was immediate.                                                                                      | Smooth only gameplay pitch, retaining existing mixer ownership and avoiding additional yaw latency.                                              |

### What actually reaches the gameplay character

The physics player position drives `player-avatar`. `Game.presentActors` sets its
presentation orientation through `BodyTumble`, then `AvatarModel.update` drives the
white skinned model beneath it. The model is +Z-forward, rotated PI for the game's
-Z convention, and scaled to 1.52 m. Its asset contains **only `Walking`**.

`POSE_CLIPS` is a legacy optional-name contract, not proof of Running/Jump/Death
clips. For this rig the gameplay adapter uses `CharacterPlayback`: start, stop and
flight envelopes are pre-existing generated tracks, including airborne jump
presentation. It consumes/discards their root movement because arena physics owns
world translation and altitude. Flight mechanics are not the generated flight
pose envelope. Ragdoll replaces visible representation while the physics tumble
owns the root. Nothing in this task adds attacks, casting, or combat pose clips.

## Targeted changes

1. **Reversal stability — `CharacterFacing.ts`.** A regression reproduced input
   jitter around PI causing successive 25 mrad yaw steps to alternate forward/back
   at 120 Hz, leaving the body stuck. Remember turn sign only within a 0.12 rad
   cone around the antipode. Outside that cone the same shortest-angle response
   and existing angular-speed limits apply. Reset clears the commitment. Tests
   cover both signs, initial headings near the yaw seam, 30/60/120 Hz, and hold on
   release. Lock and GERAK 8 travel-facing policies remain unchanged.
2. **Flight-mode presentation — `Game.ts`.** The old flight flag switched visual
   pivot immediately from 0.85 m (+hover bob) to 0.66 m, independent of continuous
   physics motion. Blend the mode-dependent offset and lean with an exponential
   response of 12/s. It is presentation state only, reset on duel reset, and frozen
   at dt=0. The actual flight toggle/vertical-velocity handoff remains immediate.
   New desktop/mobile tests bound the first 60 Hz visual-offset change to <55 mm
   in both directions and check the same settled standing offset.
3. **Dash presentation — `Game.ts`.** Facing/lean previously considered only normal
   thrust, so a burst initiated from still hover contributed nothing to either.
   Use thrust plus the existing dash velocity for visual travel yaw/lean. Existing
   turn limits and `BodyTumble` orientation damping provide the transition and
   recovery. Damage/shield-facing, the motor and dash curves are untouched. A
   gameplay test verifies bounded nonzero burst pitch, return to neutral, existing
   invulnerability and the same single loaded Walking clip.
4. **Head pitch — `CharacterLook.ts`, `Avatar.ts`, `CharacterArenaDrive.ts`.**
   Gameplay passes dt to a 22/s exponential pitch filter, clamping the target
   before filtering to avoid a saturated hidden target delaying return. Existing
   yaw smoothing is not doubled. Optional-dt omission retains immediate preview
   pose inspection. Clear/apply still restores the exact current mixer base;
   the offset does not feed back into subsequent mixer frames. Pitch freezes at
   dt=0 and retains the same -35/+45 degree limits and 65/35 Neck/Head split.
   Misleading legacy asset/fallback comments in Avatar were corrected, not its
   required-model failure behavior.

## Preserved mechanics and assets

- Ground paces 1.0 / 2.8 / 4.4 and directional-speed rules unchanged.
- Flight speeds 21 horizontal / 13 vertical; acceleration 19, braking 10 unchanged.
- Dash rise 0.045 s, hold 0.1 s, fall 0.33 s (**0.475 s total**), speed 37,
  invulnerability **0.26 s**, cooldown 1.65 s, boost duration 1.7 s unchanged.
- Gravity 25, first/second jump 9.6 / 8.6, jump count and collision code unchanged.
- No edits to `flight.ts`, `motion.ts`, `Ragdoll.ts`, `Controls.ts`, `config.ts`,
  Walking authoring, WalkingGait, CharacterFlight/Start/Stop or locomotion IK.
- Original GLB SHA-256 unchanged:
  `1dd246fbac2e45209b97648018093b643d49624e288f3c87b1b26317e058e9c8`.
- Walking derivative SHA-256 unchanged:
  `0acf1c73e6060bcc3da603ad0bdacc99f7829c6e7859e4bc9c134742d838a75e`.

## Verification — automated

- **298 unit tests / 26 files passed.** New tests exercise reversal hysteresis,
  frame-rate independence, pitch limits/return from saturation, paused dt and
  exact mixer-base restoration. Existing flight reversal/braking, dash duration/
  steering/boost, ragdoll/slide/recovery, start/stop/air transitions and Walking
  regressions remain passing.
- **4 new gameplay browser tests** passed on desktop/mobile: visual mode-toggle
  continuity and dash burst/recovery without new clips.
- **13 selected existing arena browser tests passed, 7 project-specific cases
  skipped by their existing definitions.** Coverage includes flight hover/descent,
  dash boost/steering/invulnerability, double-jump/landing, heavy tumble, ground
  skid/recovery, required white model loading and GERAK 8 facing/heading retention.
- **4 preview motor regressions** passed on desktop/mobile: keyboard/joystick/neck
  controls and walk/run/sprint/lock.
- At the 23 matched before/after gameplay review checkpoints, measured physics-root
  positions were **identical** (maximum difference 0 in the saved diagnostics).
  This supports preservation in those scenarios, not every possible collision.
- Lint, formatting and TypeScript/production build checked separately. Entire arena
  and visual-golden E2E suites were not run.

## Verification — actually inspected visually

`scripts/review-movement.mjs` runs the **actual game** with its existing DEV-only
scenario harness, deterministic input/stepping and observer camera, not a separate
rig viewer. It captured 23 baseline and 28 final gameplay screenshots plus state
records under ignored `.cache/movement-review/{before,after}/`.

The resulting images were opened and examined, including ground forward/turn/
backward/stop, first/second jump and landed pose, hover/acceleration/reversal/brake,
mode-toggle first frame, dash burst/recovery, tumble, ground slide and standing
handoff. Additional final images include pitch first/settled and recovery start,
midpoint and end. Baseline/final contact sheets and full-size mode-toggle/dash
frames were inspected. No new walking-pose redesign is asserted: those ground and
jump images deliberately remain very similar. The first toggle frame shows the
removed instant body-height drop; continuity/timing is additionally measured by
the browser tests.

**Limits:** these are sampled gameplay stills, not an interactive feel test or
continuous-video acceptance. Existing launch-disc/impact FX obscure the body in
some activation/contact shots, so those frames cannot establish pose quality.
The older red block ragdoll and white skinned character still have different
silhouettes/materials at visibility handoff. That remains visible and unresolved;
fixing it would require a separately scoped rig/representation change rather than
silently replacing the current ragdoll or modifying character materials. Random
ragdoll limb fling is also preserved. No bug-free or AAA-quality claim is made.

## Exact semantic files modified

- `src/character/CharacterFacing.ts`
- `src/character/CharacterLook.ts`
- `src/character/CharacterArenaDrive.ts`
- `src/game/Game.ts`
- `src/game/Avatar.ts`
- `tests/unit/character-facing.test.ts`
- `tests/unit/character-look.test.ts` (new)
- `tests/e2e/movement-polish.spec.ts` (new)
- `scripts/review-movement.mjs` (new)
- `docs/MOVEMENT_POLISH.md` (this report, new)
- `docs/CHARACTER.md`
- `CHANGELOG.md`

Pages publication additionally regenerates `docs/index.html`,
`docs/preview/index.html` and their three new hashed JS bundles; older hashed
bundles are retained. Models are copied byte-identically. Publication remains
Deploy from a branch → `arena/f4811a06-hea` → `/docs`, without a custom workflow.

Reproduce:

```sh
npm test
npm run lint
npm run format:check
npm run build
# With npm run dev running:
npm run test:e2e -- tests/e2e/movement-polish.spec.ts
# Actual-gameplay captures; owns/closes its temporary Vite/browser instances:
node --experimental-strip-types scripts/review-movement.mjs after
npm run build:pages
```
