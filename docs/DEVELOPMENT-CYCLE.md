# Full development cycle

One local Codex stage manager is responsible for the accepted outcome from investigation through reviewable delivery. Delegation is allowed after contracts and file ownership are agreed. A ticket pack or one builder/verifier exchange does not complete a stage.

## Iterative operating loop

1. Reconstruct current branch, remote, working tree, exact base SHA, owner decisions, stage gate and evidence. Protect unrelated work and identify newer Stage 2 material if present.
2. Map roadmap criterion IDs to small slices, file ownership, negative cases and a user walkthrough. Explain reversible choices plainly; document contract impact before dependent code.
3. Implement and run relevant tests, integrate a candidate, and commit it. Preserve older experiment IDs and candidate failures.
4. Assign a fresh-context verifier to that exact candidate SHA in a separate checkout/session where practical. Verifier attempts to falsify claims, runs negative tests and required actual browser/headless walkthroughs, and records findings without repairing the audited candidate.
5. Manager triages findings. Builders repair in-scope failures, commit a new candidate and request independent re-verification of affected checks plus relevant regressions. Repeat without owner relay of ordinary fixes. Keep failed evidence, finding-to-fix lineage and each tested SHA.
6. Evaluate actual use. A green unit suite does not prove usable hero controls, understandable unit decisions or strategic choices. Capture relevant screenshots/run exports and named hardware/browser timing; distinguish automated verification from owner judgment.
7. Record final technical verdict, commands/results, artifact paths, candidate and verifier SHAs, limitations and next action in `STATUS.md`; keep detailed evidence under the stage directory. Push to the authorized branch with a normal non-force push after checking upstream changes.
8. Follow the roadmap's next authority. Continue at automatic technical gates. At owner experience gates, present the completed playable and concrete review instructions; incorporate in-scope feedback through the same repair cycle.

If tools cannot provide a fresh verifier/session, complete useful implementation and self-checks, then mark independent verification missing and the dependent gate HELD. A different role label in the same context is not independence. Do not claim owner approval from a verifier's report.

## Verdicts

| Verdict | Meaning |
| --- | --- |
| PASS | Every required criterion independently demonstrated |
| PASS WITH NON-BLOCKING FINDINGS | All required behaviour passes; bounded minor findings have an owner and next check |
| HELD | Required evidence or owner experience judgment missing |
| FAIL | Observed behaviour contradicts a requirement |
| BLOCKED | Required external contract, artifact or authority unavailable |

A failed candidate inside the loop is repairable. A final FAIL/HELD/BLOCKED cannot authorize dependent work. Technical and owner-experience verdicts are separate fields. Unresolved defects in a required criterion are blocking even if their patch is small.

## Evidence report

Record repo/branch, baseline/candidate full SHAs, environment/runtime/lock identity, criteria with PASS/FAIL/NOT DEMONSTRATED, exact commands and output counts, fixtures/seeds, walkthrough inputs, direct artifacts, negative probes, findings, repairs, retested SHAs and verifier verdict. Browser screenshots prove appearance only; deterministic hashes require runtime evidence. Reports must distinguish specified, implemented, tested, independently verified and owner-approved.

## Stop conditions

Pause for a material product fork, missing external contract or authority, non-remediable required failure, or explicit owner experience gate. Prepare concrete evidence and options before escalating. Do not pause merely for a builder report, a minor finding, routine repair or reversible implementation choice. No paid services, telemetry expansion, multiplayer infrastructure, merge to main or hosted deployment is authorized by this cycle.

## Delivery handoff

The final owner report contains what runs, how to run it, exact tested candidate, what was independently verified, limitations and next gate. Keep one live status document; tickets point to it rather than duplicating changing claims. Source-only delivery and owner acceptance of gameplay are different outcomes.
