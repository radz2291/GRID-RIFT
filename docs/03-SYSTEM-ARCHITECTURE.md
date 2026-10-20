# 03 · System architecture

## Starting decision

Use a modular TypeScript codebase. Run the authoritative simulation without browser dependencies. A browser client may use Three.js to draw permitted snapshots. Keep this a single repository and initially a single local application; do not introduce microservices.

Suggested implementation layout, to be created by Codex:

```text
src/core/              state, ticks, ordered commands, module scheduler
src/modules/           movement, perception, combat, objectives, progression
src/scenarios/         initial placement, map layouts, content definitions
src/agents/            policy implementations and policy-state handling
src/runner/            experiment loading, controller deadlines, run manifests
src/adapters/browser/  input, camera, renderer, audio, UI, optional Worker bridge
src/adapters/headless/ CLI execution and run export
src/evaluation/        read-only metrics and paired-run reports
```

Existing `contracts/` is the cross-boundary authority. These directories are a suggestion, not proof that code exists.

## Ownership and dependency direction

Contracts import no application code. Core imports contracts and small deterministic utilities, never concrete game modules. Modules depend on contracts and approved core services, never a renderer or external provider. The runner composes registries, modules, and policies. Adapters depend on contracts and runner APIs. Evaluation consumes the event journal or completed run exports; simulation never depends on evaluation scores unless a separately versioned learning experiment explicitly introduces that feedback.

Enforce these boundaries with import checks when source code exists. A folder layout without enforcement is insufficient.

## Simulation versus game rules

Core supplies entity identifiers, state storage, ticks, ordered execution, commands, module lifecycles, snapshots, and namespaced events. It does not require health, two teams, lanes, mana, items, or a victory condition based on a base.

A planar-world module supplies the initial two-dimensional movement surface. A combat module adds health and damage. An objective module adds ownership and scoring. Scenario content supplies starting positions and abilities. A termination module reports results through a generic terminal result type.

Use registered module IDs and versions with declared dependencies. Fail startup for missing, incompatible, duplicate, or unimplemented modules. The included module catalog describes intended interfaces; it is not an executable plugin registry.

## Controllers and bodies

A body is an entity in the world. A controller is permitted to submit commands for an assigned set of entities. The control assignment belongs to the runner/authority, never to an untrusted command. A policy may be swapped while the body remains the same. The initial experiment assigns one body per controller; core must not require that forever.

A human input adapter, scripted policy, learned model, and recorded replay all use the command boundary. Controller-specific observations are copied data, not mutable references to world state. Module payloads have runtime schemas; TypeScript alone is not validation.

## Presentation boundary

Render only permitted observations in normal play. A privileged spectator view is a separate, labelled mode and must not feed player input assistance, audio, minimaps, or policies. Geometry for collision and line-of-sight comes from simulation data, not from inspecting mesh bounds in the renderer.

Presentation may smooth snapshots, change materials, show a sky, or skip frames. It must not alter authoritative state. Input sends intent, such as a destination on the map; the simulation validates and resolves it. Do not infer hits from screen-space overlap or animation completion.

## Execution and extension

Start with a fixed-step pure update loop and plain data structures. An entity-component store is an option, not a required library. Static gameplay geometry and discrete effects are enough for the first slice. Rendering can run on the main thread; move simulation to a Worker only if measured responsiveness requires it. A worker is isolation for responsiveness, not proof that arbitrary downloaded code is safe.

The runner can accelerate headless local policies by advancing ticks without waiting for display frames. Wall-clock network delays remain runner inputs and must be recorded. Do not promise accelerated human play or identical live hosted-model inference.

## Replacement tests

1. Run the same recorded commands with no renderer and with a read-only renderer sink; world hashes match.
2. Replace a local controller policy through registry configuration, with no body or combat changes.
3. Run a six-agent lane scenario and a three-participant free-for-all control scenario using the same core API.
4. Replace elimination with zone scoring without importing MOBA-specific code into core.
5. Change the visual palette and camera; permitted observations and world results do not change.

Changing from planar to true physics-based 3D, changing the meaning of time, or introducing simultaneous control of many bodies may expose genuine contract gaps. Use a versioned migration, not a claim that generic JSON makes every future design automatically supported.
