# Independent Stage 3B repair re-verification

21 October 2026. Exact repaired candidate `527f4d5ded32f53ce53a0a2d54fd7fd4898f6cae`, branch `design/stage3a-autonomous-warfare`. Fresh independent verifier, no source repairs/commits/pushes. Detached checkout originally named `runs/stage3-verifier-fd22102` was moved with `git checkout --detach 527f4d5ded32f53ce53a0a2d54fd7fd4898f6cae` only after both original strict replays completed and failed-candidate evidence was saved. Original review `independent-review-fd22102.md` remains preserved, with F-B05 failure.

## Repair scope and independently reproduced checks

Inspected exact `git diff fd2210200260c4f66f8c6455441df3c20420841b HEAD`. Private `unavailableUnitIds` derives from serialized deadLatch and is projected only through the requester's grants. It exposes no hidden position, health or enemy information. The wrapper returns a useful death reason; HUD disables order buttons and explains rebuilding. Latch clear after both parties are alive makes the next intention possible. Core/Runner and tactical policy/body behavior are unchanged. New fixture `autonomous-crossing-feedback.json` and command module 0.1.1 establish experiment 0.2.0 (variants 0.2.1/0.2.2). `git diff fd22102 HEAD -- fixtures/autonomous-crossing.json` is empty: original authored fixture is preserved. Old exports still require their matching source, as stated in their reports.

`npm run check` independently PASS: 28 handoff plus 122 runtime/Stage 1/Stage 3 tests = 150 total, zero failed/skipped/cancelled. Runtime section duration 83,156.7353ms under host contention. Includes the new test for private availability, no report leakage, snapshot continuation and clear after respawn. Raw output: checkout `runs/independent/repair-check.log`.

`node --test runs/independent/probes.mjs` independently PASS 4/4, zero failed/skipped/cancelled (11,451.1588ms). Retested actual transfer with queued report and stale old-owner execution; dead-latch checkpoint and genuine subsequent death; cancellation residual movement bound and cleared target/path with continued rest; fabricated report fields and allied-peer command denial. Raw output: checkout `runs/independent/repair-probes.log`.

Node v22.22.3, npm 10.9.8, TypeScript 5.9.3, Ajv 8.20.0, same lock SHA256 `eca2504dd29ddf72bda8e1f32476665f7458c5054a3ac5bc678f4d186d8a1c4d`. Browser manifest sourceCommit is the full repaired SHA, experimentVersion 0.2.0, dirtyTreeFingerprint null. Clean tracked source checked after tests. Same Windows / i7-6700 / GTX 1060 3GB / Chromium155 / 1280x720 environment as failed-candidate report.

## Actual repaired browser walkthrough

Only verifier-created IAB tab3 at port4174 was used and then closed. Manager paused its own browser work; no user tab was touched. Started, selected T, gave no intention. At approximately 10 seconds, the running game naturally lost the ally: accessibility state displayed `Ally rebuilding · previous order ended`, `Issue a new intention when both units are online`, and disabled D/E/F/R buttons while hero was ONLINE at 84HP. No app-state injection or direct JavaScript simulation call was used. After respawn, the four buttons enabled and F was accepted; Follow became active and report changed from Waiting to Following at 98HP.

Rechecked D/click while hero used A/click, Q/click and W. A later death cleared the intention. E/click, R, F during rebuilding produced the helpful notice `Ally is rebuilding — issue a new order when it returns`. Let the drill reach a legitimate 90-second timeout draw (0/2 raiders) without injected terminal state. Export replay downloaded `C:/Users/RZ1/Downloads/grid-rift-encounter-t1800 (2).json`; copied to checkout `runs/independent/repair-complete.json`. Play again reset to90 seconds; T/F immediately produced active Follow with all four order buttons enabled.

Screenshots beside this report: `527f4d5-returned.png` is the returned ally before reissue (screenshot occurred after the transient rebuilding state); `527f4d5-complete.png` shows terminal draw; `527f4d5-active.png` shows restarted playable with active Follow. The rebuilding state itself is proven by the captured CUA accessibility output above, not the returned screenshot. Prior candidate variant/reduced/duel screenshots and logs remain linked by the original report; repair does not change those mechanics.

## Replay and final criterion verdict

`npm run replay:autonomy -- runs/independent/repair-complete.json` strict source/lock replay PASS: 1800 ticks, final hash `904a887af7d28cdba8ada1bc39fc3a4e15a28c0908d488a84c80b4e462035ae9`, terminal timeout draw, alpha 0/beta 0. Source verification was enabled; no bypass argument. Raw output: checkout `runs/independent/repair-replay.log`.

| Criterion | Verdict | Independent basis |
|---|---|---|
| B-01 | PASS | Repaired hero/ally browser control and full regressions; prior independent runtime/path checks retained. |
| B-02 | PASS | Prior independent single-order blocked-route combat/retreat/advance and visible-threat/lost-contact tests; unchanged policy/body/map algorithms; all relevant tests rerun. |
| B-03 | PASS | Full lifecycle/authority/privacy suite plus independent queued transfer/stale execution and report-forgery negatives rerun. New availability projection is scoped to grants. |
| B-04 | PASS | Nonzero complete runner checkpoint, policy rerun, action replay, manifest mismatch and body/budget parity regressions; independent dead-latch restore and strict browser replay. |
| B-05 | PASS | F-B05 repair independently observed through natural ally death, disabled orders, explanation, respawn and accepted new order; private flag/restore/clear tests pass; prior reduced-effects walkthrough remains applicable. |
| B-06 | PASS | Full 150-test regression, independent supplemental 4 tests, completed repaired browser drill, local export/restart and named device timing. |

Repair-browser export records 3000 rolling RAF intervals mean20.0516ms/p95 33.5/max216.7ms; 1800 steps mean18.3988ms/p95 32.6/max132.6ms. Four input-queue samples mean6.9ms/p95/max23.1ms. No pause events; ordinary effects; ANGLE NVIDIA D3D11,199 draw calls/7512 triangles. This run overlaps independent fullcheck and manager replay; a catching-up notice was observed. These measurements disclose contention and do not establish isolated60fps. Prior route/reduced timing and manager's separate named measurements should remain distinct. One machine/viewport, provisional balance, broad accessibility and broader hardware remain limitations. Local rules and a timeout draw do not prove general intelligence or balanced success.

**Independent technical PASS for Stage 3B at `527f4d5ded32f53ce53a0a2d54fd7fd4898f6cae`.** Required finding F-B05 is resolved and reverified. No unresolved required defect remains from this challenge. Owner experience approval remains **HELD**: the next permitted action is owner review of this completed, reviewable playable. No Stage 3C economy/construction or Stage 3D hero expansion is authorized until the stated owner gate is satisfied.
