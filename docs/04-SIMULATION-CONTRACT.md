# 04 · Simulation contract

Version: 0.1.0. Normative starting contract; implementation and runtime verification are pending.

## State and time

The authoritative state is finite, serializable data. It contains the current integer tick, entity/component state, queued future effects, terminal status, ID allocation state, and all simulation random-stream states. Module-local mutable variables that affect future outcomes must be included. Runner queues and policy memory are saved alongside, not silently omitted from a complete run snapshot.

Initial default: 20 simulation ticks per second. Gameplay durations are integer tick counts. Rendering is independent and may interpolate. Do not derive gameplay time from `Date.now`, `performance.now`, frame count, timers, or variable display deltas. Pause freezes simulation progression; a resumed run must declare how queued human/external input was handled.

For interactive play, a wall-clock accumulator may ask core to advance ticks. It must never skip authoritative ticks to catch up. Bound per-frame work; when overloaded, slow presentation or pause with a visible warning. A headless runner advances the same ticks as fast as its declared policies permit.

## Tick order

State S[t] is the committed state before tick t. All observations labelled t are derived from S[t], using each controller's permitted visibility. No controller receives intermediate changes made for another controller during the same tick.

1. Runner collects eligible proposals for tick t and authenticates their controller assignments.
2. Core validates and freezes the accepted command batch against S[t]. Order is deterministic: execute tick, controller ID, sequence number, then actor ID. Duplicate sequences are rejected.
3. Modules resolve commands, movement, and effect intents in declared phase order. Within a phase, resolve declared dependencies topologically and use module ID to break otherwise independent ties.
4. Combat gathers damage intents before applying the batch, so simultaneous lethal hits do not privilege an array's first unit. Other resource conflicts require an explicit module tie rule and test.
5. Modules process deaths, respawns, objectives, progression, and termination in declared order. A simultaneous terminal tie has an explicit draw rule.
6. Commit S[t+1], ordered domain events, and controller-visible receipts. Derive the next observations only after commit.

A module manifest must declare phase, dependencies, read/write ownership, configuration schema, state schema, observation projection, actions, events, and version. Duplicate ownership or dependency cycles fail startup. Phases may be revised by contract change; do not smuggle order into import order or object iteration.

## Commands and visibility

A proposal states actor, action kind/version, JSON payload, observed tick, requested execution tick, and a monotonically increasing controller sequence. The runner stamps the authenticated controller ID. Validate shape, finite values, size limits, assignment, sequence, scheduling window, rate limit, and module action availability before gameplay validation.

A legal-options hint is not authority. Core rechecks state at execution. A hidden-target failure must not reveal whether the hidden entity exists, moved, or died; return a generic permitted rejection. Internal evaluator diagnostics are separate from controller receipts.

Before a command is accepted, unknown action types, invalid coordinates, unauthorized actors, impossible dates, and non-finite values are rejected. Inputs must not import code, write files, evaluate expressions, or trigger a network operation.

## Controller scheduling

A policy sees an observation at tick t and may request an action no earlier than t plus its declared minimum reaction ticks. The runner may receive asynchronous results, but delivery never rewrites the past. A deadline and maximum lead window are explicit. Late, malformed, or unavailable policy output becomes a recorded no-op; do not freeze the authoritative loop waiting for an external service.

The initial local experiment uses simple synchronous policies. Human input uses the same command admission route but has a different sampling cadence. Record those cadences; do not describe them as identical human and AI cognition.

## Randomness and numbers

Choose and document a seeded deterministic PRNG with test vectors in Stage 0. Separate world, combat, and policy streams so an extra cosmetic call cannot perturb combat. No `Math.random` in simulation, evaluation sampling, or replayable policies. Cosmetic randomness may be unseeded only if it is completely presentation-local.

Use finite values and documented coordinate units. Initial gameplay is planar; height is visual except where a module explicitly models it. State equality is initially promised only for the same source build, dependency lock, runtime family/version, configuration, initial state, and recorded input stream. Fixed ticks and a seed alone do not guarantee cross-engine bitwise determinism. Broader portability requires a test matrix or a revised numeric contract.

## Journals and replay

Keep three concepts separate: action replay reapplies recorded admitted inputs; policy rerun asks a policy to choose again; visual playback displays recorded output. Their guarantees differ.

A run manifest records schema/API versions, source commit and dirty-tree fingerprint when applicable, dependency-lock digest, runtime, experiment content hash, expanded configuration, seed, module/policy identities, controller budgets, input mode, and evaluation version. Record accepted and rejected proposal timing, ordered domain events, periodic state hashes, terminal result, and snapshot references.

Canonical hashing must sort object keys, preserve array order, normalize permitted numeric encodings, reject NaN/Infinity, and exclude cosmetic and wall-clock metadata. Use a documented cryptographic digest. A full restorable checkpoint includes world state, queues, random states, runner schedule, control assignments, and serializable policy memory. A hosted policy may not support exact continuation; declare that limitation and replay its recorded actions instead.

On replay mismatch, stop at the first divergent tick and report expected/actual hash plus module context. Never silently recompute an old run under new rules and present it as the original.

## Required tests

Same-run repeatability; saved-snapshot continuation; duplicate/late/invalid command rejection; same-tick tie handling; hidden-state non-interference; policy swap; renderer independence; unknown module/version rejection; terminal-state idempotence; and canonical hash stability. Numeric/runtime scope and test evidence must accompany any claim of determinism.
