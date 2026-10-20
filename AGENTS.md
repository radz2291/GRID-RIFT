# Instructions for development agents

These instructions apply throughout GRID-RIFT. Read `CODEX_START.md` before planning work. This is a handoff, not an implemented engine; do not report proposed features as working.

## Communication

Explain decisions in plain English that a reader aged 12 or above can follow. Use short sentences and a concrete example before an unfamiliar technical term. Preserve technical precision in code. Do not drown the owner in architecture vocabulary or describe a choice as settled when it is only a proposal.

Before a meaningful work unit, state the intended result, likely affected areas, and how you will check it. During longer work, report useful findings and blockers. Finish with: what changed, how to run it, what was actually tested, what remains untested, and the next bounded step.

## Authority and scope

The owner has approved the foundation: a small outdoor science-fiction tactical experience, depth from decisions rather than content volume, and architecture ready for radical change. Numbers, hero names, item lists, technology details, and later experiment ideas are provisional defaults.

Do not turn the owner's personal motivation into website copy, telemetry labels, profiling, or an invented scientific claim. Read the neutral project principles instead. Do not copy private context from other projects into this public repository.

Implement the current stage only. You may make reversible local implementation choices without asking for approval each time. Record assumptions. Pause for owner review before changing the project's purpose, adding paid services, collecting human data remotely, granting permissions, publishing deployments, introducing online multiplayer, or replacing a core contract. A routine blocker is not a reason to abandon useful independent work.

## Architecture rules

1. No Three.js, DOM, timers, network clients, storage APIs, or wall-clock reads in the deterministic simulation core.
2. Controllers receive a permitted observation, never the world store, hidden opponents, simulation random generator, evaluator truth, or debugging view.
3. Human and AI actions pass through the same authoritative validation path. Different input or reaction budgets must be declared in the run.
4. Never encode two teams, three agents per team, lanes, mana, health, towers, or a MOBA victory rule as universal core requirements.
5. Every mutable future-affecting value belongs in explicit simulation, runner, or policy state. No hidden module globals.
6. Renderer animation, frame rate, camera position, audio, or particles cannot decide damage, visibility, cooldowns, collisions, or victory.
7. Dependencies flow toward contracts/core, never from core toward specific gameplay, AI providers, presentation, or evaluation.
8. Modules use explicit registration and declared dependencies. No executable code or arbitrary import paths in experiment JSON. Reject unknown modules, versions, dependencies, and configuration fields.
9. No LLM call per simulation tick. Start with local baseline policies. Network inference, learning, and sophisticated cognition are later adapters, not prerequisites.
10. Do not create empty abstractions for every possible future. Build the next necessary seam and prove it with a replacement test.

## Evidence and change control

Use `docs/11-CHANGE-PROTOCOL.md` for interface or rule changes. Published experiment versions are immutable. A new configuration, policy, or evaluation meaning needs a new recorded identity. Never overwrite old evidence to make results look comparable.

Tests must fail when the targeted guarantee is broken. A stub that always returns true is not a test. No screenshots as evidence of determinism; no passing schema validation as evidence of playable combat; no single win as evidence of general intelligence.

Keep the default branch usable. Make focused commits. Inspect current branch and files before edits; preserve unrelated work. Use non-force pushes and respect repository protection. Do not erase the history to simplify a handoff.

## Collaboration

One integrator owns shared contracts and stage acceptance. Parallel agents may work only after agreeing on boundary types and file ownership. A sub-agent must state inputs, output paths, dependencies, tests, and exclusions. Do not let several agents independently redesign the same API.

Useful Stage 0 split after contracts are reviewed: core/scheduler; experiment loader and registries; tests and telemetry adapters. Renderer work starts when usable snapshots and commands exist. The integrator must run the combined suite; sub-agent self-reports do not constitute acceptance.

## Completion gate

For each work unit, provide a reproducible command, changed-file summary, actual test output, and honest limitations. Update `docs/STATUS.md`. A stage is implemented when its checks pass; user-visible experience approval is a separate owner decision. Never silently promote a later stage or rewrite the foundation while polishing a feature.
