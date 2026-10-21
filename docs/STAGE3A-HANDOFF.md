# Stage 3A · Autonomous-command foundation

Status: authorized next technical milestone; not yet implemented. Updated 21 October 2026. The owner's full-cycle request supersedes this document's earlier design-only stopping instruction. Complete 3A and, after independent technical PASS, build 3B through verification, repair and playable delivery. The first owner experience gate is the completed 3B playable.

Read [current design](CURRENT-DESIGN.md), [current handoff](../CURRENT_CODEX_HANDOFF.md), [roadmap](10-DEVELOPMENT-ROADMAP.md), [cycle](DEVELOPMENT-CYCLE.md) and [status](STATUS.md).

## Baseline and reconciliation

This branch descends from Stage 1 approval commit `8a058ee16d8f2911015a6c6254d05fcfc144af16`; previous handoff commit is `751d23b`. Inspect current remote refs and local work before coding. No separate Stage 2 implementation was found in the documentation-alignment audit. Preserve any newly discovered completed work; do not infer completion from conversation or block the new experiment by building the old roadmap first.

## Concrete assignment

Prepare `docs/STAGE3A-DESIGN.md`, a versioned contracts proposal with runtime validation examples/tests, a spec-only experiment draft under `docs/drafts/`, a module feasibility matrix and implementer tickets. These are deliverables to build next, not files claimed to exist now. Map everything to A-01 through A-05 in the roadmap.

Specify one direct-control hero and one owned autonomous ally against an opposing force. Use defend/secure/follow as a small initial intent set. An unchanged intention must permit independent threat response and replanning, not prescribe a path and attack script. Define the bounded test outcome and later migration to strategic core play.

## Contract checklist

- Ownership: commander identity distinct from team affiliation and unit policy/controller assignment. Peers cannot silently acquire each other's force.
- Intent: order ID/version, target shape, issue/effective/expiry ticks, revision, priority, risk constraint, status and cancellation. Bound payload sizes and reject unknown fields.
- Authority: authenticated issuer and recipient ownership checked at execution, not trusted payload fields; reject cross-owner and stale reassigned orders without leaking hidden state.
- Ordering: define same-tick update/cancel/expire precedence, duplicate revision handling, unit/commander death, respawn and reassignment. State how delayed messages interact with newer revisions.
- Autonomy: independent policy identity, observation budget and serializable memory; no omniscient commander or evaluator state. Policy replacement has explicit memory migration/reset.
- Information: reports/messages carry only permitted observations and timestamps with declared delivery delay. Last-seen memory never refreshes invisibly.
- Persistence: order queues, policies and future-affecting memory checkpoint/restore and rerun deterministically within declared scope.
- Compatibility: demonstrate the seam in existing contracts/core/runner; add optional module schemas first. Record a genuine core gap, version impact and regression proof before changing shared boundaries.

## Bounded tickets

| Ticket | Owner / likely paths | Acceptance / dependencies |
| --- | --- | --- |
| A1 Baseline and scenario | Manager; status, design and evidence | A-01/02; exact refs and minimal demo |
| A2 Contract candidate | One contract integrator; proposal, drafts, focused validation | A-03/04; depends on A1; no competing schema edits |
| A3 Independent challenge | Fresh verifier; stage evidence only | A-05; audits exact committed candidate, does not fix it |
| B1 Unit runtime and policy | Builder; runner, unit modules, policy/tests as assigned | B-01/02/04; only after A PASS and API ownership agreed |
| B2 Input, intent UI and reports | Builder; browser adapter and feedback tests | B-03/05; depends on agreed B1 boundary |
| B3 Integrated verification | Manager plus fresh verifier; integration/tests/evidence | B-06 and full walkthrough; repair loop required |

Assign exact file ownership after inspecting implementation. Parallel B1/B2 work is optional only once interfaces are fixed. Do not create duplicate architecture or isolated mock engines. Larger construction/economy/hero stages follow the roadmap's owner gates.
