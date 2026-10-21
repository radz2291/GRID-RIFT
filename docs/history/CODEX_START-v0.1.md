# Codex handoff: begin here

## Current state

Handoff v0.1.0. The repository contains specifications, contracts, experiment examples, and validation tooling. It does not contain the simulation or client. Do not assume any runtime module listed in JSON is implemented.

The target is a modular tactical simulation whose first visual experience is an outdoor, technology-themed battle arena. Keep the first build small, but make its decisions meaningful. Build a simulation platform with one initial game, not a tightly coupled game pretending to be a platform.

## Reading order

Read `AGENTS.md`, `docs/STATUS.md`, `docs/01-VISION.md`, `docs/02-DESIGN-PRINCIPLES.md`, `docs/03-SYSTEM-ARCHITECTURE.md`, and `docs/04-SIMULATION-CONTRACT.md`. Then inspect every file in `contracts/` and all three experiment JSON files. Consult gameplay, evaluation, and visual documents before their relevant stages.

Run `npm ci` if a lockfile exists; otherwise run `npm install` and commit the generated lockfile. Run `npm run check`. This verifies the handoff, not a working game.

## First assignment: Stage 0 only

Create a real, headless simulation proof using the supplied contracts. Headless means it can run without graphics or a browser. Begin by reporting your understanding and a small implementation plan, then execute reversible technical work without waiting for routine confirmation.

Implement explicit state, integer ticks, a seeded random source, a command queue, stable ordering, module registration, and an observation boundary. Add a minimal test-world module and two local policies. Connect the experiment loader to implemented-module registration; specification validation alone must never imply runtime availability.

Demonstrate a policy swap, a no-op/read-only renderer sink, rejection of malformed commands, an agent that cannot read hidden state, fixed-action replay, and snapshot restore. Define the resolved-run manifest and canonical checksum before collecting evidence.

Do not build full MOBA content, online multiplayer, training pipelines, paid inference, sophisticated visual effects, or a generic editor. A test fixture may use extremely simple movement and a terminal condition. It is not the Stage 1 game.

## Required Stage 0 delivery

Provide actual commands to run a demo, tests, and replay. Retain existing handoff checks and add runtime tests under separate names. Record seed, exact runtime/dependency versions, source commit or dirty-tree fingerprint, module versions, and output hashes. Include a brief change-impact note and update `docs/STATUS.md`.

Complete all Stage 0 checks in `docs/10-DEVELOPMENT-ROADMAP.md`. Show the evidence, then present Stage 1 as the next bounded task. Do not begin a large later phase implicitly.

## Decisions you may make

Folder scaffolding, local test implementation, a small deterministic PRNG with test vectors, simple data structures, and maintainable build tools are delegated. Document choices and pin dependencies. Prefer TypeScript plus a small browser adapter for the initial route; Three.js is a renderer candidate, not the simulation authority.

A Worker, ECS library, physics package, server, or separate service is not automatically required. Measure before adding one. If a supplied boundary proves insufficient, make a focused proposal with affected files, compatibility implications, and the test that exposes the problem.

## When reporting to the owner

Use this form:

- Result: what is now real and runnable.
- Evidence: commands, pass/fail counts, and run identifiers.
- Experience: what the owner can do or see, or explicitly that no playable UI exists yet.
- Limits: unsupported features and unresolved decisions.
- Next: one bounded milestone.

Never call a specification a finished feature. Never claim a human capability has been scientifically measured merely because a game metric exists.
