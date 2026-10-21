# Walking revision 2 — baked 101172 review

21 October 2026. Baseline: `d7d9312923e1ea95d54be65a4b04fab7de1a1728`.
Output: `public/models/101172-rigged.glb`, 9,582,104 bytes, rig revision 9,
walking revision 2. This is a walking-only authoring change, not a new character,
run/jump/fly/cast animation or a redesign of the gameplay locomotion controller.

## Diagnosis and calculations

The previous contact check kept the **ankle** on a straight reference-speed path,
while the rounded sole rotated about that ankle. Its selected forefoot material
point could consequently travel about 79 mm during stance after reference root
travel was restored. The extra oscillating foot-lane offset also produced lateral
sliding. A 120 mm swing lift drove roughly 66° swing-knee flexion; large pelvis
bob and independently added head/chest oscillations made the motion busier.

`src/character/rig101172.ts` now authors:

- Constant left/right foot lanes. Flat support through phase 0.44; a restrained
  0.24 rad forefoot roll develops smoothly until lift-off at 0.58. The ankle X/Z
  target compensates the rotated measured ball/sole-plane pivot, rather than
  pretending the ankle remains fixed while the supporting forefoot rolls.
- Initial ankle Y from the **minimum rotated sole geometry**, followed by the
  existing offline two-bone solver and sole-floor correction. Pelvis height is
  conservatively capped by both measured leg-chain reaches. A 2 mm soft-min
  transition avoids the hard height-constraint crossing; both chains participate
  so the constraint does not switch abruptly at contact.
- A quintic fore/aft swing matching stance velocity and zero acceleration at both
  joins. Lift is `0.065 * sin(PI * (u + 0.12*sin(2*PI*u)))^3`: zero endpoint vertical
  velocity/acceleration, earlier clearance and a longer useful clearance window,
  **without increasing apex height, speed or stride**. Small toe-up returns to
  flat landing. The rigid rounded foot is intentionally not given a fake human
  toe articulation.
- Smaller vertical pelvis excursion, 12 mm lateral weight transfer, coordinated
  pelvis/chest counterrotation, restrained opposite arm swing with delayed relaxed
  forearms/wrists. Neck/head share axial compensation (65/35) to stabilize gaze.
- Normalized, hemisphere-consistent quaternion samples, including the identical
  closing pose. Root remains in place; only the authored Hips translation moves.

Duration **1.16 s**, reference stride **0.94 m**, speed **0.8103448 m/s**, stance
fraction **0.58**, half-cycle contact separation and **120 sample intervals** are
unchanged. No gameplay movement-speed/physics changes were needed.

## Necessary loading-analysis compatibility

`WalkingGait.ts` previously recognized only constant ankle velocity. Correct
forefoot planting during heel rise deliberately moves the ankle; re-phased clips
without valid embedded markers were therefore incorrectly classified as airborne.
The clip-load analysis now also measures the rigid-foot reference at the measured
ball projected onto the sole plane. Either stable ankle or stable forefoot speed
may identify support. The **same 8 mm floor gate and 3.5% speed tolerance** remain;
markers, invalid-profile rejection and cache invalidation remain tested. This is
load-time contact analysis, not a new per-frame runtime IK system.

`Avatar.ts` and `preview/main.ts` only change their asset cache query to `gait=2`.
Both already loaded this same rigged character. No character switch, controller,
camera, facing, combat, flight, dash, ragdoll or terrain solver was added/changed.
GERAK 8 travel-facing/stop-heading behavior is preserved. Existing start/stop helpers
continue to derive step clearance from the loaded clip; their code is unchanged.
Their old fixed high-step test expectations now reference the reduced clearance,
while pinning, two-step order, floor and continuity tolerances are retained.

## Identical before/after review

`scripts/review-character.mjs` renders the actual exported GLB through GLTFLoader
and AnimationMixer with identical camera, lighting, dimensions and phase settings.
It retains the eight evenly spaced poses and adds these event-aligned poses:

| Event             | Cycle phase |
| ----------------- | ----------: |
| Initial contact   |           0 |
| Weight acceptance |       0.045 |
| Mid-stance        |        0.25 |
| Opposite contact  |         0.5 |
| Toe-off approach  |       0.575 |
| Mid-swing         |        0.79 |
| Late swing        |        0.96 |
| Loop boundary     |     0.99999 |

**Actually inspected:** baseline and final event images from front, side and
three-quarter views, arranged into contact sheets, not just the metrics. The final
side views show less high-stepping and knee folding; front/three-quarter views
retain separate, compact lanes and modest arm separation. Contact and loop-end
poses match visually in these stills. No obvious floor penetration or mesh spikes
were seen in these reviewed poses. Weight transfer/head bob are deliberately
subtle for this slender stylized model.

**Not claimed:** continuous video was not visually assessed frame-by-frame; browser
playback and loop continuity were additionally checked programmatically. Still
inspection and passing tests do not constitute user acceptance of motion quality,
a guarantee of zero defects, or an AAA/mocap-quality claim.

Identical 240-sample exported-asset measurements:

| Metric                                              |    Before |     Final |
| --------------------------------------------------- | --------: | --------: |
| Stance knee minimum                                 |     7.60° |    10.99° |
| Stance knee maximum                                 |    26.06° |    23.57° |
| Swing knee maximum                                  |    65.66° |    46.33° |
| Minimum ankle lane separation                       | 254.94 mm | 250.06 mm |
| Pelvis vertical excursion                           |  36.00 mm |  27.53 mm |
| Selected forefoot material-point drift, full stance |  79.07 mm |   3.08 mm |
| Same point, flat-support window 0.10–0.43           |  5.236 mm |  0.024 mm |

Drift restores forward root travel (`stride * footPhase`) to the in-place asset,
then measures distance from the first sampled stance position of **one fixed low
forefoot vertex per foot**, chosen by identical geometry-based criteria. It is
not an ankle proxy or a changing nearest point. It is also **not** proof that the
whole footprint/heel stays fixed during intentional heel rise. The remaining
~3 mm comes from a simplified rigid rounded-sole pivot, sampling and interpolation.
The old 8 mm flat-window result used a different endpoint (0.45); the table above
uses the same 0.43 endpoint on both assets and must not be mixed with that result.

## Automated checks and preservation

- **2 additional built-Pages loading tests** passed on desktop/mobile with a static
  server mounted at `/Hea/preview/`, using the production `/docs` output rather
  than the development server.

- All **16 preview browser tests** passed on desktop/mobile: actual GLB loading,
  pause/scrub/speed/bind controls, missing-model errors, stop toggle, keyboard/
  joystick/neck controls, flight return and reset, walk/run/sprint/lock controls.
- **6 selected arena browser regressions** passed on desktop/mobile: required white
  rigged model and flight pose, backward-travel facing, and heading retention after
  release in the normal keyboard/touch game. The entire arena E2E suite was not run.

- 290 unit tests / 25 files passed, including new 480-sample actual material-point
  stability (<4 mm full stance, <0.2 mm flat window), seven AnimationMixer loops
  without root accumulation, quaternion normalization/hemisphere and loop angular
  velocity (<0.35 rad/s difference between adjacent seam intervals).
- Existing full-sole floor/contact/clearance checks, separate lanes, upright support
  knee (<24°), moderate swing knee (35–60°), phase-mirrored real two-step stops,
  start/restart continuity, changed-clip analysis, flight and gameplay-facing tests
  passed. These are regression checks, not substitutes for visual judgement.
- `scripts/check-walking-preservation.mjs` compared the saved baseline with the
  final asset: all **7 non-animation accessors** byte-for-byte, topology, skin
  indices/weights, UVs/normals/positions, all 28 joints/rest transforms/hierarchy,
  inverse bind matrices, measured anatomy, materials and embedded texture bytes
  are identical. Only animation and explicitly versioned walking metadata change.
- Rebuilding the final candidate again produced an identical GLB SHA-256:
  `0acf1c73e6060bcc3da603ad0bdacc99f7829c6e7859e4bc9c134742d838a75e`.
- Lint, repository formatting check and TypeScript/Pages build passed.
- Immutable `public/models/101172.glb` SHA-256 remains
  `1dd246fbac2e45209b97648018093b643d49624e288f3c87b1b26317e058e9c8`.

Review PNGs/metrics remain ignored in `.cache/character-review/`; temporary public
baseline copies are removed before the Pages build. Reproduce the comparison:

```sh
mkdir -p .cache/walking-before
# Save the pre-change asset without changing branches.
git show d7d9312923e1ea95d54be65a4b04fab7de1a1728:public/models/101172-rigged.glb > .cache/walking-before/101172-rigged.glb
node scripts/check-walking-preservation.mjs .cache/walking-before/101172-rigged.glb
npm run character:build
npm run character:review
# For matching baseline PNGs, temporarily copy the saved baseline into public/models,
# review that path with character:review, then remove the temporary public copy.
npm test
npm run lint
npm run format:check
npm run build:pages
```

Flat-floor, reference-speed forward Walking is the authoring target. Directional
procedural gameplay locomotion, uneven terrain and user-specific movement feel
remain outside this walking-only refinement. Publication uses the existing branch
Pages source `/docs`, without adding a workflow.
