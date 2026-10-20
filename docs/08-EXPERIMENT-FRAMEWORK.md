# 08 · Experiment framework

## Definition

An experiment is a versioned choice of world, participants, controllers, modules, timing, termination, and evaluation. A run is one execution of that experiment with a resolved seed, configuration, and input stream. A configuration file is not an implemented simulation.

The three supplied files are draft specifications: `000-vertical-slice`, `001-tactical-combat`, and `002-control-field`. Treat their values as proposed defaults until tested. Never label a schema-valid experiment runnable unless every required module and policy is implemented and compatible.

## Validation layers

1. JSON syntax and `contracts/experiment.schema.json`: envelope shape, primitive types, bounded timing, version fields, and unknown top-level keys.
2. Semantic handoff validation: unique IDs, valid team and controller references, declared module dependencies, one world provider, one termination provider, timing consistency, and module configuration schemas in `contracts/module-catalog.json`.
3. Runtime validation: concrete registered implementations, exact version compatibility, content IDs, spawn placement, reachable routes, numeric safety, policy capabilities, and initial world invariants.
4. Scenario validation: decision opportunities, fair budgets, termination, and actual behaviour under tests.

The included checker performs the first two layers only. Catalog entries are `spec-only`. Core must use an implementation registry rather than pretending the catalog itself executes anything.

## Expanded configuration and identity

Initial examples are standalone files, not inheritance chains. Avoid hidden defaults and deep merge surprises. When overrides are introduced, resolve them before a run, validate the result, and record the complete result and its canonical digest. Record both source file identity and expanded identity.

`schemaVersion` describes the JSON envelope; `apiVersion` describes runtime boundary expectations; `version` identifies this experiment's meaning. Module and policy versions are separate. Pin all of them in a run. A hash detects exact content identity; a friendly version alone is not sufficient.

## Run lifecycle

Load, validate, resolve registries, build initial state, assign controllers, start the journal, execute ticks, stop on a terminal result or limit, finalize hashes and metrics, and offer a local export. A crashed, interrupted, or invalid run is labelled as such, not counted as an ordinary loss or silently dropped.

Do not rewrite a running experiment's configuration in place. A live intervention is possible only as a declared scenario rule with an explicit event and known timing. Otherwise start a new run. A pause is not permission to modify opponents or resources invisibly.

## Compare fairly

Use paired seed sets, alternate sides or starting locations, hold bodies/rules/budgets fixed where the question requires it, and retain failed runs. Separate development seeds from held-out evaluation seeds. Random seeds do not by themselves make scenarios representative of a broader real world.

Report how many complete runs support a number, what was changed, what was held constant, and uncertainty across independent runs. Do not treat thousands of ticks from the same match as thousands of independent subjects.

An AI-only reproducibility run may replace a human controller through an explicit resolved override. Record that replacement. It is a different condition, not the human result repeated automatically.

## Storage

Proposed output layout: local `runs/<run-id>/manifest.json`, `inputs.jsonl`, `events.jsonl`, `hashes.jsonl`, `snapshots/`, and `metrics.json`. This directory is ignored by Git. Export only by explicit user action and inspect for personal or credential data before sharing.

Use pseudonymous controller labels. Do not store free-form chat, personal identity, or biological data by default. Tool/provider prompts, keys, and private reasoning must not enter the public repository.

## Radical changes

Create a new experiment ID when the question or structure changes substantially. Bump a version when compatible structure changes meaning. A true interface break also changes API/schema versions and provides a migration or an explicit unsupported-replay message.

The control-field scenario must share the generic runtime, commands, observations, and evaluation envelope without importing combat. Its successful implementation is the concrete initial evidence for replaceability.
