# 0002 · Small deterministic Stage 0 runtime

Date: 20 October 2026. Status: implemented under delegated Stage 0 technical authority; owner stage review pending.

## Problem and choice

We need executable proof before building the battlefield. Use plain TypeScript state, registered local modules, synchronous local policies, and integer simulation ticks. The test world moves assigned bodies along an integer line. It does not implement tactical movement or combat.

The public v0 contracts remain unchanged. `src/core/types.ts` supplies the concrete local module lifecycle left open by the handoff: schema-validated initialization and state, pre-step command validation, advance, permitted projection, named randomness, declared events, and generic terminal results. Module order is input, resolve, effects, termination; dependencies sort topologically and IDs break ties using code-unit order. Registry startup rejects dependencies pointing into a later phase, cycles, unknown versions, duplicate actions, and duplicate write ownership.

All commands validate against committed pre-step state. The fixture resolves every accepted move before testing the goal. Multiple arrivals draw. The runner records admitted proposals, then core rechecks at execution. A terminal world freezes; queued proposals scheduled after termination remain recorded and pending rather than disappearing from history.

## Serialization and numbers

Canonical SHA-256 sorts object keys using JavaScript code-unit order, preserves array order, uses JSON finite-number encoding, normalizes negative zero, and rejects undefined, holes, non-JSON objects, cycles, NaN, and Infinity. This is a documented local format, not a claim of universal cross-language canonicalization.

World positions and durations in the proof are integers. xorshift32 uses shifts 13, 17, 5; an explicit nonzero uint32 state is derived from the run seed plus module/stream name using SHA-256. World and combat stream names are independent. Current policies need no randomness and store their decision count in explicit memory. PRNG test vectors for starting state 1 are 270369, 67634689, 2647435461, 307599695, 2398689233.

The snapshot's `idAllocatorState` is a serializable core bookkeeping envelope: configuration hash, executed controller sequences, receipts, and latest events. This fixture uses configured body IDs and creates no dynamic entities. Module state and random streams live in their existing dedicated snapshot fields. The full checkpoint adds runner assignments, queue, submission sequences, schedule, rejection receipts, and policy memories. Journal history remains in separate local exports.

## Compatibility and limits

Exact replay requires matching source commit/content, dependency lock, installed dependency versions, Node version, platform/architecture, expanded fixture, and admitted inputs. Replay fails closed at the first incompatible identity or divergent tick. Old evidence must use its matching checkout; there is no migration or cross-runtime determinism promise.

Asynchronous policies are recorded no-ops in this Stage 0 runner. No waiting for external services, network adapters, sandbox for hostile code, browser renderer, dynamic entity lifecycle, or delayed-effect scheduler is claimed. The Stage 0 checkpoint rejects unsupported nonempty generic pending effects.

Alternative: a large ECS/plugin framework. Rejected for now because the small fixture tests the necessary replacement seam without that cost. Reconsider the internal checkpoint envelope, module lifecycle, or numeric policy if Stage 1 exposes a concrete missing boundary. Any actual public contract replacement still requires the existing change protocol and owner review.

## Evidence

See [Stage 0 verification](../STAGE0-VERIFICATION.md). Policy replacement, read-only sinks, replay, hidden-state isolation, checkpoints, and invalid input have executable regression tests.
