# Independent Stage 3A review — FAIL

Reviewed 21 October 2026 in a fresh verifier context. Candidate: `7788ad2cc48514fcdfe123442118cf3745b82921`, branch `design/stage3a-autonomous-warfare`, baseline `11fbae551f05706461361c878453a35ee3bc0962`. Source stayed fixed during this review. Verifier changed only this report and did not repair or commit the candidate.

Environment: Windows PowerShell, Node `v22.22.3`; package-lock SHA-256 `eca2504dd29ddf72bda8e1f32476665f7458c5054a3ac5bc678f4d186d8a1c4d`.

## Commands actually run

From the repository root:

| Command | Result |
| --- | --- |
| `git rev-parse HEAD` | Exact candidate above |
| `git status --short` | Clean before evidence write |
| `git branch -a` and `git log --all --oneline -10` | Baseline lineage and retained branches inspected; no separate Stage 2 implementation surfaced |
| `node --version` | v22.22.3 |
| `Get-FileHash package-lock.json -Algorithm SHA256` | Hash above |
| `npm run build:core` | PASS |
| `node --test tests/stage3/contracts.test.mjs` | 3 tests passed; 0 failed/skipped/cancelled |
| `npm run validate:handoff` | PASS; 6 experiment specifications and document links |
| `npm run check` | PASS; 28 handoff tests plus 89 runtime/Stage 1 tests, 117 total; 0 failures; typecheck, boundaries and core/web build passed |

No dependency reinstall was needed in this verifier run. Stage 3 tests are separate from the current `npm run check` command. Total executed test cases across the separate focused suite and full check: 120, all passing. Read-only source inspection included startup/authority/cycle documents, roadmap, Stage 3A handoff/design, draft, contracts/tests, Engine, Runner, registry, runtime types, tactical modules and import guard. Some initial guessed source filenames did not exist; actual implementation was located with `rg --files` and inspected.

## Criterion assessment

| Criterion | Verdict | Evidence and limit |
| --- | --- | --- |
| A-01 | PASS | Full baseline/ref reconciliation is recorded; approved Stage 1 remains unchanged. No claim is made about unseen checkouts. |
| A-02 | PASS | Concrete one-hero/one-owned-ally/two-raider drill; bounded success/loss/timeout, threat and route variants; peers distinguished from subordinates. |
| A-03 | FAIL | Order schemas and authority negatives pass, but follow information delivery and same-tick precedence need the repairs below. |
| A-04 | PASS with required integration repair | Real Engine/Runner seams exist; no core envelope replacement is necessary. Pure policy-facing types must be separated from Ajv before their intended import can pass the existing guard. Draft is explicitly spec-only. |
| A-05 | FAIL | Tickets, ownership and regression mapping exist; independent review found required unresolved contract issues, so dependent implementation is not yet authorized. |

## Required findings

1. **F1 — blocking information contract gap (A-03).** `STAGE3A-DESIGN.md` says follow may use delayed commander position reports and the unit receives these. The defined `command.report` travels from unit to commander and captures the unit's own state. No reverse commander-position message schema or production rule specifies cadence, delivery delay, generation, expiry/retention or clearing. A builder would have to invent the information channel on which follow relies. Define the commander-own-position telemetry path explicitly, carrying only permitted own-state information with original timestamps; bind it to authority generation and clear it on death/reassignment. State which actor may be followed and what happens when neither personal sight nor valid telemetry is available. A proposed four-tick cadence/four-tick delay is a manager repair proposal, not evidence in this candidate.

2. **F2 — blocking contradictory ordering prose (A-03).** The design first places cancellation before highest revision, then says highest revision wins and cancellation wins an equal revision. Cancel revision 3 and issue revision 4 in the same batch therefore have conflicting described outcomes. Specify one algorithm and an explicit example. Preserve lifecycle invalidation and exclusive expiry; clarify which commands remain eligible after these steps. Add focused contract-level examples/tests for that decision. Current three tests never exercise competing same-tick operations.

3. **F3 — required integration preparation (A-04/A-05).** `contracts/autonomy.ts` combines policy-facing interfaces with an Ajv runtime import. `scripts/check-boundaries.mjs` recursively scans type imports and rejects Ajv for agents. A subordinate policy importing its intended `CommandView` from this file would fail the existing architecture check, even with `import type`. Current boundaries pass because no policy imports it yet. Separate pure interfaces/allowed helpers from schema compilation and demonstrate that the intended policy type path passes the guard without relaxing it. This is a forthcoming integration failure identified by source inspection, not a currently failing build.

4. **F4 — clarification to carry into runtime state.** The design correctly says repeated dead ticks must not increment generation repeatedly. Explicitly include the death-transition latch in serialized module state; otherwise a restore can change future generation/revocation behavior. Runtime checkpoint proof belongs to 3B. This is a state-contract clarification, not a demonstrated runtime defect.

## Feasibility and negative-validation limits

`ControllerSpec.actors` accepts independent controllers. Runner supplies copied observations and saves queues, schedules, assignments and policy memories. Engine validates controller/actor assignment and action schemas at admission and again at execution against the pre-step state. Optional modules can store grants, order tombstones and delayed reports, privately project them, and emit supersession events. Stable module ordering supports an input-phase command module reading prior combat state and a termination-phase drill outcome. Existing tactical world initialization is explicitly duel-specific; a versioned scenario map/roster variant is necessary, as the design acknowledges. Preserve the old registry and published experiments.

The focused tests exercise valid defend/secure/follow/cancel shapes; forged issuer, oversized ID, invalid revision/generation/target/risk/kind; unauthorized controller/actor, death, target legality, reassigned generation, duplicate revision, cancellation identity and expiry boundaries. They do not execute a command module, transfer/report delivery, lifecycle transitions, same-tick arbitration, autonomous replanning or replay of the new drill. Transfer/report schemas are exported but lack focused examples in this candidate; extend coverage while repairing the contract, then prove runtime behavior in 3B.

The trace in the design is a specified walkthrough, not executed gameplay. No new autonomous browser playable was launched or claimed. Passing the draft/handoff/schema checks proves neither combat nor information-flow correctness of absent modules. Existing Stage 0/1 regression checks passed.

## Verdict and next action

**Technical FAIL at the exact candidate above. Owner experience verdict: not requested/not established.** Preserve this failed-candidate evidence. Manager should repair F1–F3 and clarify F4 in a new committed candidate, then request fresh verification of changed contract checks and relevant regressions. A subsequent independent Stage 3A technical PASS permits 3B; this report does not.
