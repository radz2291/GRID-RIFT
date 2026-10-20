# Implementation status

Handoff version: 0.1.0. Prepared: 20 October 2026.

| Area | Status |
| --- | --- |
| Vision, principles, architecture, stages | Specified |
| TypeScript observation/action/simulation interfaces | Specified; handoff type-check available |
| Experiment envelope and module configuration schemas | Specified; handoff validation available |
| Three draft experiment definitions | Specified, not executable scenarios |
| Handoff regression tests | Included; see verification record for actual results |
| Simulation core, scheduler, PRNG, snapshots, replay | Not implemented |
| Module implementations and runtime registry | Not implemented |
| Playable browser client and visuals | Not implemented |
| Actual bot behaviour or learned/adaptive policy | Not implemented |
| Runtime fairness, determinism, performance | Not yet tested |
| Human capability assessment validity | Not established; no such claim is made |
| Owner approval of a playable experience | Not requested yet |

## Next work unit

Stage 0 in `CODEX_START.md` and `docs/10-DEVELOPMENT-ROADMAP.md`. Keep handoff checks separate from runtime tests. Update this file as evidence becomes available; do not mark a requirement implemented merely because its interface exists.

## Open implementation choices

PRNG and numeric precision policy; canonical hash implementation; exact module lifecycle API details discovered in Stage 0; browser build tooling; measured need for a Worker; initial map geometry; basic-attack launch/impact semantics; actual six-controller balance. Defaults are supplied where they support a bounded first build. None justify building a universal engine first.
