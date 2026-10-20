# Implementation status

Updated: 20 October 2026. Stage 0 implemented and runtime-tested; owner review pending.

| Area | Status |
| --- | --- |
| Foundation specifications and existing contracts | Preserved |
| Three tactical experiment definitions | Validated specifications; gameplay modules still unimplemented |
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
| Browser encounter, combat, terrain, abilities, relay, respawn | Not implemented; Stage 1 |
| Learned policies, hosted inference, networking | Not implemented |
| Human capability assessment or satisfying gameplay | Not established; no such claim is made |

See [Stage 0 verification](STAGE0-VERIFICATION.md) for commands, acceptance mapping, evidence location, and limitations. The [original handoff verification](VERIFICATION.md) is retained as historical evidence.

## Next gate

Present Stage 0 evidence for owner review. Proposed Stage 1: one human Runner against one local AI, a versioned outdoor map with meaningful route choices, movement/vision/combat/abilities, relay, death/respawn, outcomes, restart, and readable browser controls. Keep Stage 0 regression tests. Do not begin Stage 2 or infer exact geometry from reference pixels.

## Open implementation choices

Browser build tooling, measured need for a Worker, initial map geometry, basic-attack launch/impact semantics, and actual balance remain Stage 1 or later decisions. Stage 0's local numeric and checkpoint scope is documented in [decision 0002](decisions/0002-stage0-runtime.md).
