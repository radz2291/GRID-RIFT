# 0001 · Simulation-first, modular initial build

Date: 20 October 2026. Status: accepted foundation; implementation details remain revisable.

## Problem

The first game may change quickly and radically. Tightly linking its rules to its graphics or bot code would make later experiments expensive and could invalidate comparisons without being noticed.

## Decision

Keep one authoritative, headless-capable simulation behind versioned contracts. Compose gameplay modules, controller policies, presentation, and read-only evaluation through a local runner. Treat the first MOBA-like design as an experiment, not the identity of the engine.

Start with a small TypeScript codebase and a prospective Three.js browser adapter. Do not build distributed services or a universal game engine. Add abstractions only when they support the next concrete experiment.

## Alternatives

A single Three.js game script would be fast initially but couples world truth to display and input. A large generic engine/plugin platform could accommodate more possibilities but delays the first usable encounter. A native engine remains a possible future presentation/runtime route, but changing it must be justified by actual needs and migration cost.

## Trade-offs

The initial boundary and replay work costs effort before visible gameplay. Plain JSON-style state can be less convenient than mutable engine objects. Exact determinism has a declared runtime/build scope, not a cross-platform promise. Radical changes to physics or time can still require contract migration.

## Affected areas

`contracts/`, experiment definitions, core/runner ownership, policy observation boundaries, renderer permissions, module registration, replay manifests, and stage acceptance tests.

## Compatibility

Use explicit schema, API, module, policy, and experiment versions plus content hashes. Preserve older run identities. A incompatible change requires migration or an explicit unsupported-version error, never silent reinterpretation.

## Evidence

The handoff interfaces type-check and the three specifications validate. This supports internal consistency only. Actual replaceability is not proven until Stage 0 and the combat-free Stage 3 experiment pass their runtime tests.

## Reconsider when

Profiling demonstrates unacceptable cost; real physics or multi-body control exposes a boundary gap; a native client provides a justified benefit; or a concrete scenario cannot be expressed without abusing the API. Record a superseding decision and retain this history.
