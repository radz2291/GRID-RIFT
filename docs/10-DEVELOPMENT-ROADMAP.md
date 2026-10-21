# 10 · Development roadmap · v0.3

The owner requested full-cycle development on 21 October 2026. Each stage includes planning, implementation, independent verification, repair, re-verification, a relevant product walkthrough, evidence, push and reporting. [Development cycle](DEVELOPMENT-CYCLE.md) defines execution. [Current design](CURRENT-DESIGN.md) defines product intent. Technical PASS does not imply owner approval.

## Preserved foundation and legacy stages

Stage 0's deterministic headless proof and owner-approved Stage 1 duel remain regression baselines; see [status](STATUS.md) and their verification reports. Their original acceptance IDs remain in the [historical roadmap](history/10-DEVELOPMENT-ROADMAP-v0.1.md).

The legacy Stage 2 two-lane 3v3 specification is preserved, with implementation unverified on inspected refs. Reconcile any local/newly pushed work before integration. Do not require completing that obsolete forward path before autonomous warfare. Original Stage 3 noncombat replacement is now 3X; keep S3-01 through S3-05 as historical IDs.

## Gate map

| Stage | Entry | Exit and next authority |
| --- | --- | --- |
| 3A Design/contracts | Current owner amendment and reconciled baseline | Independent technical PASS permits 3B; no routine design approval pause |
| 3B Autonomous playable | 3A PASS | Technical PASS plus owner experience approval permits 3C |
| 3C Strategic pressure | 3B experience approved | Technical PASS plus owner strategic-loop review permits 3D |
| 3D Independent hero teammates | 3C approved; ownership/messaging seams established | Technical PASS permits 3E |
| 3E Evaluation | 3D PASS and stable experiment identities | Technical PASS permits release preparation with 3X |
| 3X Noncombat compatibility | 3A seams settled; before broad content investment | Required technical PASS before 3F; may run alongside 3B after ownership agreed |
| 3F Local release | 3B–3E and 3X passed; prior experience gates recorded | Reproducible local package and final owner acceptance; deployment remains separate |

A technical FAIL/HELD/BLOCKED prevents dependent work. Repair in-scope candidate failures before issuing a final gate verdict. Stop for a material product fork, unavailable external contract or missing authority. Do not pause for ordinary implementation choices or each repair.

## 3A — Establish autonomous command

Outcome: a builder can implement a specific small scenario without inventing authority or information rules.
Scope: reconciliation, design, versioned contracts/schema proposals, focused contract validation/tests and tickets. Exclude economy, armies and broad gameplay implementation in this stage.
Demo: trace an issued, replaced and cancelled order from authenticated hero through delivery to the subordinate policy and back to a permitted report.

- A-01: record inspected refs, full baseline SHA, existing work and actual Stage 2 evidence or its absence; preserve approved Stage 1.
- A-02: define one hero + one owned ally versus an opposing force, a bounded outcome and changing-threat variants; separate peers from subordinates.
- A-03: define order issue/update/cancel/expiry, ownership, policy memory, perception/messages and same-tick rules; show valid/invalid examples and compatibility impact.
- A-04: map implemented seams versus spec-only modules; validate proposed payloads including unauthorized, malformed and stale cases. Do not claim executable modules from draft validation.
- A-05: independent review resolves required contract findings; file-owned tickets, criterion mapping and regression plan are ready.

Evidence: `docs/evidence/3A/`; final technical PASS authorizes 3B.

## 3B — Play alongside one autonomous unit

Outcome: directly fight while one owned ally handles a meaningful intention without continuous clicks.
Scope: independent unit policy/scheduling, order UI/validation, serializable memory, status and local replay; keep the small existing combat body. Exclude multi-hero expansion and full economy.
Demo: launch, issue defend/secure/follow, fight elsewhere, observe a threat response, revise/cancel, finish, export, restart.

- B-01: direct hero controls remain functional while the ally independently moves/engages/repositions through the validated action path.
- B-02: same intention reacts to visible threat and blocked-route variations without a scripted exact sequence or new commander clicks; record choices and observable consequences.
- B-03: update/cancel/expire and ownership rejection obey 3A semantics; peer affiliation cannot control a force; inaccessible enemy data does not alter observations/receipts.
- B-04: checkpoint/restore reproduces policy memory and orders; fixed actions replay, deterministic policy reruns and body-identical policy swap pass.
- B-05: reports reflect permitted delivered information; order status and unit selection remain readable during hero combat, including reduced effects.
- B-06: retain `npm run check`, Stage 0/1 regression and named-device browser timing; actual playthrough and independent verifier cover the complete demo.

Evidence: `docs/evidence/3B/`. Request owner experience review at this completed, reviewable playable. Record feedback and repair within scope. Do not invent approval or proceed to 3C while this gate is HELD.

## 3C — Make investment and neglect matter

Outcome: a win in one skirmish can coexist with strategic loss elsewhere.
Scope: one energy resource, continuing opposing pressure, validated predefined construction, secondary sites, destructible/disabled core outcome. Begin with two materially different constructibles; candidate barrier/turret/bridge types may be phased with explicit exclusions. No unrestricted terrain editing or large upgrade shop.
Demo: choose defense versus mobility/resource investment; rival bypasses or contests it; react while the other route remains under pressure; end at a core outcome.

- C-01: resource income/spend is authoritative; invalid/duplicate/simultaneous placement cannot overspend; build time, completion, destruction and refund policy are explicit and tested.
- C-02: structures change collision/sight/path or attack pressure consistently; no permanently trapped actors or inaccessible mandatory objective from legal placement; bridge bank validation if bridges are included.
- C-03: autonomous opposing pressure and resource opportunity costs continue without player input; test at least two viable responses to the same investment, including counterplay.
- C-04: core vulnerability, simultaneous terminal events, timeout and restart work through versioned optional modules; relay scoring is not the new primary victory rule.
- C-05: actual playtest demonstrates an opportunity lost elsewhere while winning a local fight; owner can identify a meaningful alternative. State balance limits.
- C-06: independent challenge, regression/replay, observation fairness and measured actual-population performance pass.

Evidence: `docs/evidence/3C/`. Obtain owner strategic-loop review before 3D; ordinary balance repairs remain manager-owned.

## 3D — Cooperate with independent hero peers

Outcome: play with another independently controlled hero and separate owned forces.
Scope: at least two allied heroes with independent controllers and one subordinate each, plus an opposing force; configured team messages. Local AI teammates suffice. No online networking.
Demo: delegate to your force while a peer pursues a separate goal; coordinate via a permitted message and observe conflicting priorities.

- D-01: peer input never silently overrides another commander's units; reject cross-owner/reassigned/stale orders at execution.
- D-02: delivered messages have declared latency/scope/expiry; no live omniscient team blackboard or hidden-position leaks.
- D-03: hero death/respawn, subordinate loss, cancellation and commander reassignment have explicit tested semantics.
- D-04: independent policies/memory survive checkpointing; full match terminates and replays at the real population; HUD remains usable with measured timing.
- D-05: independent verifier runs a full cooperation and conflicting-priority walkthrough; reports state what was observed, not inferred intelligence.

Evidence: `docs/evidence/3D/`. Technical PASS permits 3E.

## 3E — Compare intelligence honestly

Outcome: reproducible reports show where policies succeed, fail and adapt under fixed capabilities.
Scope: paired-seed local trials, side swaps, threat/route/communication variants, frozen/no-replan control, held-out scenario list and journal-derived metrics. No general intelligence score or hosted training requirement.
Demo: execute a documented batch, inspect one success and one failure, recompute report from finalized journals.

- E-01: predeclared seed/config/policy identities, sample counts, side swaps and body/budget parity are recorded; incomplete runs retained with reasons.
- E-02: intent progress, response, survival cost, communication and commander intervention are operationally defined with missing values explicit.
- E-03: compare at least two policies plus a relevant ablation; no evaluator truth reaches live decisions; evaluation leaves hashes unchanged.
- E-04: rerunning/recomputing reproduces declared outputs; conclusions include variation, uncertainty and task limitations.

Evidence: `docs/evidence/3E/`. Technical PASS and 3X PASS permit 3F preparation.

## 3X — Prove radical replacement

Implement retained `002-control-field` with three independent participants and no combat/health/towers/lanes/progression. This is architecture proof, not the target product loop.

- X-01 (legacy S3-01/02): actual headless run without combat modules; no new MOBA special cases in core.
- X-02 (legacy S3-03/04): original tactical scenario still runs; old journals replay under matching build or fail clearly on incompatible source, never silently reinterpret.
- X-03 (legacy S3-05): exact module/change-impact report and independent evidence demonstrate shared runtime, not a separate toy engine.

Evidence: `docs/evidence/3X/`. Run before broad content growth; a genuine core gap returns to contract review and impacted verification.

## 3F — Deliver a reproducible local product

Outcome: the owner can obtain a matching build, launch a complete autonomous-warfare match and inspect its result without development assistance.
Scope: local packaging, startup instructions, controls/accessibility review, performance/known-limit report, evidence index and release notes. Git source push is authorized; merging main, hosted deployment or package-registry publication is separate.
Demo: fresh checkout/archive, pinned install, build, launch, complete match, export, replay on matching source, restart; ordinary and reduced-effects views.

- F-01: fresh-install commands, built browser/headless outputs and assets resolve with no private dependency; release identity pins source and lockfile.
- F-02: 3B–3E/3X evidence and real owner experience approvals are linked; no blocker is relabelled minor to release.
- F-03: independent end-to-end walkthrough, required regression and named-environment performance checks pass; accessibility and broader hardware gaps are stated.
- F-04: release candidate, controls, limitations, upgrade/compatibility notes and final owner acceptance are recorded separately from technical PASS.

Evidence: `docs/evidence/3F/`. Stop after delivery and owner verdict; future feature growth needs a new bounded plan.
