# Independent Stage 3B verification: FAIL pending lifecycle feedback repair

21 October 2026. Exact candidate `fd2210200260c4f66f8c6455441df3c20420841b`, branch `design/stage3a-autonomous-warfare`. Fresh verifier used detached checkout `runs/stage3-verifier-fd22102` and made no candidate source changes, commits or pushes. Stage 3A technical PASS at `a60e09e9b1d2479360c297bc4f66ea408499f985` was read and its required implementation checks challenged. Owner experience approval remains HELD.

## Reproduced commands and environment

- `git worktree add --detach C:/Users/RZ1/Desktop/RZ/261020-Grid-Rift/GRID-RIFT/runs/stage3-verifier-fd22102 fd2210200260c4f66f8c6455441df3c20420841b`
- `npm ci`: 20 packages installed, 21 audited, zero vulnerabilities.
- `npm run check`: PASS, 28 handoff and 121 runtime/Stage 1/Stage 3 tests; 149 total, zero failed/skipped/cancelled. Includes typecheck, boundaries, builds and document validation. Raw output: checkout `runs-verifier-check.log` (ignored). Final runtime section duration 52,090.9363ms under concurrent host work.
- `node --test runs/independent/probes.mjs`: 4 independent tests PASS. Tests cover transfer while reports and stale old-owner input are pending; dead-latch snapshot round trip and repeated true death; cancellation movement/attack/path bound through actual Runner scheduling; fabricated report fields and allied peer command rejection. Initial probe incorrectly supplied a report with zero rather than two reaction ticks: admission correctly rejected it. Corrected fixture passes; retained `runs/independent/probes-invalid-fixture.log` describes verifier-fixture failure, not candidate failure.
- `$env:PORT='4174'; node scripts/dev.mjs` after `npm run build:core` served own checkout. Only verifier-created IAB tab 2 was used, then closed. Hidden-tab option is unsupported in a subagent; ordinary tab creation worked. User tab and manager tab were untouched.
- `npm run replay:autonomy -- runs/independent/crossing-complete.json`: strict source/lock replay PASS at tick 1800, final hash `317c46a3e0b8dfab6730184e1499d10d48786bba6b923d8e096c0f4a0c1fe18e`, timeout draw, scores alpha 0/beta 0.
- `npm run replay:autonomy -- runs/independent/blocked-route.json`: strict replay PASS at tick 708, final hash `361604fd1de44e81a126663bdc1e43df9cd252af4bf9c2fb8cc403ea6c954b41`.

Windows 10.0.26100, Intel Core i7-6700 3.40GHz, GTX 1060 3GB, Chromium 155 IAB, 1280x720 pixel ratio 1, eight logical processors. Node v22.22.3, npm 10.9.8, TypeScript 5.9.3, Ajv 8.20.0. Lock SHA256 `eca2504dd29ddf72bda8e1f32476665f7458c5054a3ac5bc678f4d186d8a1c4d`. HEAD and clean tracked source were checked before/after. Browser exports record the exact source commit and source tree hash `5dfd161dd557c68b054b2b131d99564f6efdebdd48d77ed42e4de57cf3463175`.

## Actual browser walkthrough

Started crossing; T selected ally, F issued follow. Report showed Following at 100 HP, then Engaging at 53 HP without new commander clicks. Clicked a visible raider, used Q/click and W; D/click defended crossing while hero combat remained direct. Report showed Retreating at 8 HP, then recovery to 48 HP at spawn. R then E/click revised to Secure; right-click hero move and A/click remained separate. Window blur paused twice (ticks 258 and 299); centre Resume worked. No state injection, app-global calls or browser scripting of simulation occurred.

After a death, the panel silently became `No order · orders last 60s` with Waiting reports. Follow was reissued; another death cleared it. Finally reissued follow while fighting a visible raider and let the drill complete naturally: actual 90-second timeout draw, zero raiders defeated. Export replay downloaded `C:/Users/RZ1/Downloads/grid-rift-encounter-t1800.json`; copied to checkout `runs/independent/crossing-complete.json`. Play again reset the drill to 90 seconds and deselected ally.

Opened the intro-linked blocked-route URL, started, issued exactly one E/click Secure at crossing. Hero remained idle. The ally moved around the blocking ridge, fought, defeated one raider by roughly 15 seconds, retreated when health fell, then advanced again. At 35.4 seconds it had one raider defeated; no additional commander orders. Reduced effects retained readable order/report/health and sight shading. Escape paused; exported t708 to `C:/Users/RZ1/Downloads/grid-rift-encounter-t708.json` and copied it to checkout `runs/independent/blocked-route.json`.

Opened retained `?scenario=duel`; observed Stage 1 relay intro. Started, right-clicked ground, Q/click, W, S, Z/X/C, Space and Escape. Pulse cooldown changed; centre pause/resume UI appeared. This is a regression-entry/control walkthrough, not a new full duel match; full Stage 1 rules regressions passed in the suite.

Screenshots beside this report: `fd22102-complete.png`, `fd22102-route.png`, `fd22102-reduced.png`, `fd22102-duel.png`. Browser export also embeds canvas screenshot, full timing/graphics, journal, checkpoint and manifest. Screenshots establish appearance only; strict replays establish authoritative tick/event/hash reproduction.

## Criterion disposition and challenge

| Criterion | Verdict | Evidence |
|---|---|---|
| B-01 | PASS | Independent hero control plus separate ally intention in browser and session tests; all proposals traverse Engine validation; four independent controllers and declared budgets. |
| B-02 | PASS | Browser blocked route produced movement, engagement, retreat/recovery and renewed advance without new clicks; one raider defeated while hero idle. Tests challenge visible directions, health/risk, defend leash, lost contact, unchanged legal destination under map variation. No general intelligence claim. |
| B-03 | PASS | Full order lifecycle, same-tick highest revision/tied cancel, invalid fields/actors/owner/generation/targets; report exact delivery and hidden-state observations. Supplemental actual transfer drops queued reports and stale old-owner command; peer affiliation cannot issue. |
| B-04 | PASS | Nonzero Runner checkpoint with queued reactions and policy memory continuation, deterministic reruns, body/config/budget parity across policies and manifest mismatch rejection. Supplemental dead-latch checkpoint preserves one generation increment, then true second death increments. Both actual browser exports strict replay on matching checkout. |
| B-05 | FAIL | Active order/report UI and reduced effects work, but required death lifecycle state is not readable: silent clear becomes No order/Waiting, pending controls stay enabled, generic denial gives no rebuilding explanation. Manager independently observed same problem. Fix lifecycle feedback before gate passes. |
| B-06 | PASS | Complete browser drill, export/restart, strict replay, variant, retained duel entry, all 149 regression tests and independent challenge completed; measured actual device. |

Source inspection confirms report channels carry only captured own-body state and policy status, original timestamps and generation. Projection is scoped to grants; no hidden opponent information enters report fields. Commander telemetry uses four-tick delivery and fresh-position follow limit. Policy last-seen timestamps are not refreshed for missing opponents. Ordinary body combat and movement still enforce visibility and validation. No Engine/Runner contract rewrite or old experiment rewrite was introduced.

## Timing and limits

Crossing export: rolling 3000 RAF intervals mean 20.7961ms, p95 34.2ms, max 150ms; 1800 simulation steps mean 17.4791ms, p95 30.7ms, max 124.7ms. Twelve input-queue samples mean 8.7333ms, p95/max 29.5ms. This run overlaps regression work early and contains two intentional focus/blur pauses; do not describe it as isolated 60fps hardware proof.

Blocked route export (ordinary then reduced effects, no verifier compute launched during its play): 1996 RAF samples mean 17.7561ms, p95 17.3ms, max 166.7ms; 708 steps mean 14.2826ms, p95 22.7ms, max 71.9ms. One input sample 2.7ms is too small for latency inference. Graphics: ANGLE NVIDIA D3D11, 163 draw calls/5414 triangles reduced; crossing ordinary 175/6690. These are one device/viewport local measurements, RAF intervals include host scheduling and are not isolated GPU times. Broad hardware/accessibility and balance remain unproved.

## Finding F-B05 and next gate

Required repair: explain when commander/ally death invalidates the intention and when new orders become available, without exposing hidden live position/health. Keep death/authority queues and original generation semantics. Reverify lifecycle feedback/privacy, targeted runtime regressions, full suite and new exact-source browser export after repair. This candidate's technical verdict is FAIL because B-05 is required. Owner experience remains HELD; no 3C authority follows.
