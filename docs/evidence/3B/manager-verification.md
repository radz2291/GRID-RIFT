# Stage 3B manager verification — 21 October 2026

Technical candidate: 527f4d5ded32f53ce53a0a2d54fd7fd4898f6cae on design/stage3a-autonomous-warfare. Owner experience: HELD, awaiting actual owner play. Independent repaired-candidate verdict is PASS; see [fresh verifier](independent-review-527f4d5.md). This manager report is not independent verification.

## Scope and lineage

Baseline inspected/fetched: 11fbae551f05706461361c878453a35ee3bc0962, clean. No Stage 2 implementation found on inspected local/remote refs. Approved Stage 1 source c84e86c84f114bd45c9e8168f83af5790f579675 and approval 8a058ee16d8f2911015a6c6254d05fcfc144af16 are retained. No main merge, deployment, external service, multiplayer or telemetry expansion.

3A candidate 7788ad2cc48514fcdfe123442118cf3745b82921 failed independent contract review. Candidate a60e09e9b1d2479360c297bc4f66ea408499f985 resolved all required findings and independently passed A-01..A-05, permitting 3B. See [3A PASS](../3A/independent-review-a60e09e.md).

3B implementation 860d9f3 followed by copy/format clarification fd2210200260c4f66f8c6455441df3c20420841b passed all 149 tests but failed required B-05 in actual independent browser use: after death, cleared orders/reports left unexplained denial. The [original independent report](independent-review-fd22102.md) remains preserved. Repair 527f4d5 adds private lifecycle availability, helpful rebuilding state, disabled order controls while unavailable, and a fresh intention after return. This adds no live enemy/position/health channel. A generation-latch checkpoint/privacy regression was added. Original fixture remains unchanged; successor fixture autonomous-crossing-feedback.json is version 0.2.0 (variants 0.2.1/0.2.2); command.owned patch 0.1.1, action wire version still 0.1.0.

Intermediate integrated-check-1 failed during concurrent source edits (strict dirty-source replay identity correctly rejected), an old delivery assertion and an invalid browser-dist test import. Repairs preserved source checks, corrected delivery expectations and bundled actual renderer source for Node tests. The subsequent frozen candidate checks passed. No failure was hidden by weakening validation.

## Exact checks

- npm ci: 20 packages installed, 0 audit vulnerabilities. First attempt hit locked repo esbuild.exe; stopped only that repository helper and reinstalled successfully.
- npm run check on fd22102: 149/149 PASS (28 handoff +121 runtime/game), log runs/stage3-integrated-check-2.log.
- npm run check on 527f4d5: 150/150 PASS (28 handoff +122 runtime/game), log runs/stage3-integrated-check-3.log. Includes 117 retained Stage 0/1/handoff checks and 33 Stage 3 checks, separate typechecks, import boundaries and both builds.
- node scripts/autonomous-demo.mjs crossing on fd22102: complete 1800-tick timeout draw, 0/0, hash 4fd011b89e2d5de6659619948f29e21c27fba614d781067af3bfbd2fcf4f118f. Exact-source replay via node scripts/replay-encounter.mjs runs/autonomous-crossing-1792559163356/encounter.json PASS for every event/hash/result.
- node scripts/replay-encounter.mjs runs/stage3-manager-fd22102/partial.json: exact-source browser replay PASS 672 ticks, hash 62ce1686d4e82645d44c0aa99b27af35e7456992d2a962306a941dd1bf491420.
- node scripts/replay-encounter.mjs runs/stage3-manager-527f4d5/complete.json: exact-source browser replay PASS 1800 ticks, timeout draw 0/0, hash 2d9e83e5505538f2ce3cec74caf816216ff89ae1be4246cec3215fbcc89694b4. Full export SHA-256 6e9d2d2dab9b3781c45346b6c3a10cff903ef349c5f684127ad59d611347cc1a.

Replay source checks were enabled for these actual browser/headless records. Unit tests separately disable source checking for synthetic headless manifests; those are not substituted for delivery proof. Matching code/source is required to replay old exports; a later documentation commit changes source identity and must use the recorded checkout.

## Actual browser walkthrough

Manager used a separate IAB tab at 1280x720, leaving the owner's tab untouched during tests. Started repaired crossing, F follow, hero A-ground approach, D defend another point, Q projectile, click visible enemy, W dash, E secure, cautious risk and F revision, R cancellation, Escape pause, centered Resume, reduced effects and temporary X peek. Ally reports changed from following to advancing/retreating and original timestamps remained visible. At about 63 seconds its death showed Ally rebuilding, previous order ended and disabled commands; after return the buttons re-enabled and a new F order was accepted. Completed at exactly 90 simulation seconds, exported via end screen, and strict-replayed all 1800 ticks. Ten sampled human orders are recorded. Outcome was a draw, not a win or a balance claim.

Independent verifier separately completed the original full crossing, blocked-route response and retained duel; see its raw report. The route run defeated one raider while the hero was idle, then the ally recovered and advanced without new tactical clicks. Repair re-verification is separately reported for the exact successor.

## Named environment and timing

Windows x64; Node v22.22.3, npm 10.9.8; pinned TypeScript/Ajv/esbuild/Three lockfile. CPU Intel Core i7-6700 @3.40GHz; NVIDIA GTX 1060 3GB; Chromium 155 / ANGLE D3D11; viewport 1280x720, pixel ratio1.

Manager repaired full-run export: final rolling 3000 RAF intervals mean17.0129ms (~58.8fps), p95 16.8ms, max99.9ms. All1800 simulation steps mean16.4629ms, p95 28.1ms, max90.9ms. Ordinary effects initially and reduced effects at end. Final draw187 calls/6910 triangles; mask512x384, 59 rebuilds mean7.1254ms p95 16.1ms. Earlier tests/replays overlapped some play; this is a named local sample, not an isolated GPU benchmark, universal 60fps claim or supported-device matrix. Independent measurements are preserved separately. No authoritative tick skipping was introduced.

## Guarantees and limits

B-01: hero and ally separate controllers, unchanged direct controls, ordinary authenticated action path. B-02: visible threat/health/risk/route variants change choices under an intention; scenario and policy tests plus actual route play. B-03: malformed/cross-owner/peer/stale/reassigned/dead/expired/update/cancel and exact-delay checks. B-04: serialized queues/memory/latches, nonzero continuation, deterministic rerun, action replay, renderer independence and identical body/budget policy replacement. B-05: readable status/report age, selection, effects and repaired lifecycle feedback. B-06: complete actual play/export/replay, retained regressions, named performance and fresh challenge.

These are inspectable local scripted policies, not learning/general intelligence. Balance, final art, broad accessibility/rebinding and other hardware/browser coverage remain open. No in-browser checkpoint import UI is provided; complete continuation is proven through the headless Runner checkpoint API. Construction/resources/core strategy and independent teammate heroes are later gated stages. Current mode is a bounded skirmish acceptance drill, not the final strategic loop.

## Owner review and next authority

Launch npm run dev and open http://127.0.0.1:4173/. T selects ally; D + ground defends, E + ground secures, F follows, R cancels. Keep fighting with hero controls while observing the ally. Check that intention, changed threat response, updates/cancellation, rebuilding and report age make sense without repeated clicks. The approved relay duel is retained under ?scenario=duel.

Only an actual owner statement can approve the experience. Until then Stage3C is HELD. Ordinary within-scope feedback repairs remain manager-owned. Push this evidence/source to the authorized design branch; do not merge main or deploy.

## Published evidence index

Verifier reports and all named PNGs are retained beside this report. Raw verifier logs are preserved verbatim as their original basename plus .txt; manager fullcheck is manager-check-527f4d5.txt. The exact independent-probes.mjs.txt can be copied into runs/independent/probes.mjs after creating that directory, then run with node --test runs/independent/probes.mjs after npm run build:core on the recorded candidate. Its relative imports intentionally remain unchanged. Full browser/headless journals remain local at the recorded paths; exact final hashes and commands are above. These records were generated by agent playtests, not collected from remote human telemetry.
