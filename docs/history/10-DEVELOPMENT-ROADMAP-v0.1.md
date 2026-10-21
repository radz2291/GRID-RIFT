# 10 · Development roadmap

Proceed by evidence, not by file count. This handoff implements none of the runtime stages below.

## Stage 0 — Prove the boundaries

Deliver a headless loop, explicit state, seeded streams, command admission, a minimal module registry, snapshots, journals, permitted observations, and two local policies. Use tiny fixtures rather than a full battlefield.

Acceptance IDs:

- S0-01: identical fixed-action runs produce identical per-tick world hashes under the declared runtime/build scope.
- S0-02: snapshot at a nonzero tick, restore into a new instance, and continue with identical hashes and terminal result.
- S0-03: swap a policy through configuration without body/core changes; record the new identity.
- S0-04: adding/removing a read-only renderer sink or metrics subscriber does not change hashes.
- S0-05: two states differing only in hidden enemy data yield identical permitted observations and controller receipts until a legitimate visible effect occurs.
- S0-06: unknown module/version, dependency cycle, invalid payload, duplicate sequence, unauthorized actor, impossible execution tick, and late result are rejected as specified.
- S0-07: same-tick conflicts have a stable documented outcome; post-terminal step calls cannot mutate results.
- S0-08: the import boundary prevents browser/provider/evaluator dependencies from entering core.
- S0-09: source identity, lock digest, configuration, seed, module/policy IDs, budgets, and test commands appear in an actual evidence manifest.

Next gate: report working commands and limits to the owner. Stage 0 is not a playable game.

## Stage 1 — Playable vertical slice

Implement `000-vertical-slice`: one controllable Runner, one local opponent, two routes, fog/line-of-sight, basic attack, Q and W, relay, health/death/respawn, outcome, restart, and outdoor browser presentation. Reuse Stage 0 contracts.

Acceptance IDs:

- S1-01: a fresh checkout has documented install, start, test, and build commands; no missing private asset or paid service is required.
- S1-02: a player can move, target, attack, cast, retreat, die/respawn, capture, win/lose/draw, and restart a complete encounter.
- S1-03: all visible combat and objective effects match authoritative state; target, cooldown, range, invalid action, and capture feedback are understandable.
- S1-04: the AI contests, recognises visible danger, and sometimes disengages; no hidden-stat or vision advantage is introduced.
- S1-05: ordinary view and reduced-effects view retain the same rules and outcomes under recorded actions.
- S1-06: screenshots and an actual playthrough show an outdoor world, readable units/telegraphs, and accessible controls.
- S1-07: record measured frame/input behaviour on named hardware/browser and identify interface failures separately from tactical errors.
- S1-08: retain Stage 0 regression checks and expose a local run export without automatic uploads.

Next gate: owner reviews the experience. Do not expand the roster while movement or decisions remain unclear.

## Stage 2 — Decision depth

Implement the two-lane 3v3 baseline incrementally: first population/teams, then waves/towers/core, then relay trade-offs, then limited progression and upgrades. Improve local policies using permitted information. Add team signals only with a tested communication boundary.

Acceptance IDs: S2-01 full six-controller match reaches a valid terminal result; S2-02 lane pressure and relay contest create conflicting priorities; S2-03 fog/memory/team communication respect visibility; S2-04 policy comparison uses paired seeds and swapped sides; S2-05 added mechanics preserve earlier runtime guarantees; S2-06 performance evidence covers the actual six-controller population; S2-07 the owner can identify meaningful alternatives rather than only harder damage races.

Advanced adaptation, LLM planning, reinforcement learning, and simulated behavioural states are optional later work units, not bundled claims in this stage.

## Stage 3 — Radical modification test

Implement `002-control-field`: three independent controllers, no combat/health/towers/lanes/progression, zone-based scoring, shared generic runtime. Use baseline units appropriate to the rule set.

Acceptance IDs: S3-01 runs without combat modules; S3-02 generic contracts and core need no MOBA-specific special case; S3-03 the original tactical experiment still loads/runs unchanged; S3-04 existing replay artefacts either reproduce under their recorded build or fail with a clear compatibility message; S3-05 a change-impact report names all modified areas and explains any genuine core gap.

Perform this before a large content investment. It may be brought forward immediately after Stage 1 to test a risky seam.

## Handoff practice

Each stage delivery includes source commit, exact commands, test output, evidence paths, screenshots only where relevant, limitations, and updated status. Label separately: specified, implemented, runtime-tested, and owner-approved. Never use one label as a substitute for another.
