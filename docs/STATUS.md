# Implementation status

21 October revision: experiment 0.4.0 adds simulation-owned facing for both human and AI Runners, with a public orientation component and private target IDs retained. Shot beams now align exactly between raised endpoints; pulse hits show local impacts. Earlier experiments remain intact. See [native combat facing](decisions/0003-native-combat-facing.md). Owner visual review remains open.

Updated: 20 October 2026. Stage 0 retained; Stage 1 implemented and tested. Experience and balance approval remain with the owner.

| Area | Status |
| --- | --- |
| Foundation specifications and existing contracts | Preserved |
| Three tactical experiment definitions | 000-vertical-slice implemented; 001 and 002 remain specifications |
| Headless fixed-tick runtime and ordered command validation | Implemented and tested |
| Named seeded random streams, finite JSON, canonical SHA-256 | Implemented and tested within declared runtime/build scope |
| Module registry, schemas, dependency ordering and ownership | Implemented and tested with the tiny race fixture |
| Copied permitted observations and private receipts | Hidden-state non-interference tests pass |
| Idle and scored-step local policies | Implemented and swappable by configuration; ordinary scripted logic |
| World snapshot and complete local runner checkpoint | Nonzero-tick continuation tests pass |
| Local manifest, input/event/observation journals and replay | Replay and intentional corruption checks pass |
| Read-only presentation sink and offline descriptive metrics | Tested to leave simulation results unchanged |
| Architecture import checks | Positive and negative source fixtures tested |
| Six approved visual reference PNGs | All published SHA-256 values verified; canonical assets present |
| Browser encounter, combat, cover/vision, Q/W, relay, respawn | Implemented, automated rules tested, complete browser encounter observed |
| Local browser build, start controls, pause/restart and run export | Implemented; UI and replay exercised |
| Scripted tactical opponent | Contests, attacks, evades visible tells, retreats and recovers; policy and integration tests pass |
| Browser performance evidence | Recorded on i7-6700 / GTX 1060 / Chromium155; foreground and background timing separated |
| Learned policies, hosted inference, networking | Not implemented |
| Human capability assessment or satisfying gameplay | Not established; no such claim is made |

See [Stage 1 verification](STAGE1-VERIFICATION.md) for current commands, acceptance evidence and limitations. [Stage 0 verification](STAGE0-VERIFICATION.md) and the [original handoff verification](VERIFICATION.md) remain historical records.

## Next gate

Stage 1 feedback revision adds continuous attack orders, attack-move, a hand cursor for camera panning, temporary keyboard camera peeks, and ability recharge bars. Experiment/human policy 0.2.0 preserves the original 0.1.0 definition and evidence. See [controls revision](STAGE1-CONTROLS.md). The battlefield remains a provisional test arena.

Owner plays the Stage 1 encounter and reviews controls, visibility, route choices, pacing and visual direction. Correct that experience before adding content. Stage 2 has not started; 3v3, lanes, towers and progression remain deferred.

## Open implementation choices

Balance, terrain refinement, accessibility/rebinding and broader hardware/browser testing remain open. No Worker was needed for the measured small encounter. Stage 0's local numeric/checkpoint scope remains in [decision 0002](decisions/0002-stage0-runtime.md); Stage 1's authored map and mechanics are recorded in [the Stage 1 implementation note](STAGE1-IMPLEMENTATION.md).

## 21 October controls clarification

Click-directed orders use experiment/human policy 0.3.0: A + click an enemy locks pursuit; A + click ground stays tied to that area and stops when clear at the destination. Nearby automatic attacks no longer create permanent locks. Earlier 0.1.0/0.2.0 experiment definitions remain intact. See the controls revision for scope and evidence; Stage 1 experience review remains open.

Stationary attack facing is corrected in presentation: the Runner model turns toward its visible attack target while standing still. Movement, dash and pulse aim keep their respective direction priorities. Rules and experiment versions are unchanged; see the controls revision. Awaiting owner visual review.

The Stage 1 HUD now follows compact edge positioning: minimap bottom-left, health/abilities bottom-centre, score top-centre, with utility actions/help in collapsed menus. Existing simulation and experiments are unchanged. Browser layout/menu review is complete at 1280 x 720; owner approval of readability and screen clarity remains open.

Pause usability: a centred Resume encounter button appears whenever a started encounter is paused. Menu/Controls panels now dismiss on outside clicks; menu actions close the menu. Actual browser checks passed; simulation and experiment identities remain unchanged.
