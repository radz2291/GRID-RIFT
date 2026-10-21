# Implementation status

**Stage 1 complete and owner-approved on 21 October 2026.** Approved playable source: `c84e86c84f114bd45c9e8168f83af5790f579675`, experiment 0.4.0. The owner stated: "Good, stage one is approved." See [approval and verification](STAGE1-VERIFICATION.md#owner-approval--21-october-2026).

Stage 0 is retained. Stage 1 includes the reviewed controls, HUD/pause menus, shared native human/AI facing, corrected shots, fog of war and refined roof/edge treatment. Historical combined suite: 117 passing tests. Final art, balance refinement, accessibility and wider hardware coverage remain later work. A separate Stage 2 implementation is unverified on the inspected remote refs; this is not a claim about unseen local work.

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
| Stage 1 playable experience | Owner-approved on 21 October 2026 |
| Scientific human capability assessment | Not established; no such claim is made |

See [Stage 1 verification](STAGE1-VERIFICATION.md) for current commands, acceptance evidence and limitations. [Stage 0 verification](STAGE0-VERIFICATION.md) and the [original handoff verification](VERIFICATION.md) remain historical records.

## Current forward state · 21 October 2026

Documentation alignment v0.3 follows baseline handoff `751d23b` and owner approval record `8a058ee`. Full exact lineage and actual alignment checks are in [documentation verification](DOCUMENTATION-ALIGNMENT-VERIFICATION.md). `CURRENT-DESIGN.md` is the authoritative forward specification; [decision 0004](decisions/0004-autonomous-warfare-full-cycle.md) records the owner amendment. No gameplay code or published experiment configuration is changed by the alignment. Documentation alignment independently PASS at `a03231b79b181d62e4baafd65e072d53465c0abd`; manager regression suite 117/117 passed. This verdict does not complete 3A or any new gameplay stage.

| Area | Current evidence state |
| --- | --- |
| Hero-led autonomous warfare direction and structured construction | Owner-approved intent; implementation pending |
| Stage 2 two-lane implementation | Not found on inspected remote refs; local/new remote reconciliation required |
| 3A autonomous scenario/contracts | Authorized next; design/contract deliverables not yet completed |
| 3B–3F autonomous playable through local release | Roadmap specified; not implemented or verified |
| 3X noncombat architecture experiment | Retained specification; runtime proof pending |
| Full-cycle manager workflow | Defined; independent stage verification not yet performed |

Next authorized action: reconcile any later work, complete 3A through independent technical verification, then implement and repair 3B through a reviewable playable. Stop at 3B owner experience review before economy/hero expansion. Follow [current handoff](../CURRENT_CODEX_HANDOFF.md) and [roadmap](10-DEVELOPMENT-ROADMAP.md). Do not restart accepted Stage 0/1 or claim a gate PASS from this documentation update.

## Open implementation choices

Balance, terrain refinement, accessibility/rebinding and broader hardware/browser testing remain open. No Worker was needed for the measured small encounter. Stage 0's local numeric/checkpoint scope remains in [decision 0002](decisions/0002-stage0-runtime.md); Stage 1's authored map and mechanics are recorded in [the Stage 1 implementation note](STAGE1-IMPLEMENTATION.md).

## 21 October controls clarification

Historical feedback notes follow. Their pending-review statements are superseded by the owner approval above; their original implementation/evidence context is retained.

Click-directed orders use experiment/human policy 0.3.0: A + click an enemy locks pursuit; A + click ground stays tied to that area and stops when clear at the destination. Nearby automatic attacks no longer create permanent locks. Earlier 0.1.0/0.2.0 experiment definitions remain intact. See the controls revision for scope and evidence; Stage 1 experience review remains open.

Stationary attack facing is corrected in presentation: the Runner model turns toward its visible attack target while standing still. Movement, dash and pulse aim keep their respective direction priorities. Rules and experiment versions are unchanged; see the controls revision. Awaiting owner visual review.

The Stage 1 HUD now follows compact edge positioning: minimap bottom-left, health/abilities bottom-centre, score top-centre, with utility actions/help in collapsed menus. Existing simulation and experiments are unchanged. Browser layout/menu review is complete at 1280 x 720; owner approval of readability and screen clarity remains open.

Pause usability: a centred Resume encounter button appears whenever a started encounter is paused. Menu/Controls panels now dismiss on outside clicks; menu actions close the menu. Actual browser checks passed; simulation and experiment identities remain unchanged.

Stage 1 sight readability: known terrain outside current sight and behind cover is now shaded in the battlefield and minimap, including reduced-effects mode. Exact enemy visibility rules are unchanged. This is current-sight fog, not exploration memory. Owner visual review remains open.

Fog refinement: whole-building reveal fixes roofs trapped inside their own occluder. A higher-resolution antialiased contour and soft atmospheric veil replace the pixelated spotlight treatment. Unit visibility rules, policies and experiment identities are unchanged. Owner visual review remains open.
