# Stage 1 verification · 20 October 2026

Result: local playable Runner duel. Owner experience/balance/art approval remains pending. Stage 2 has not started.

## Commands

```sh
npm ci
npm run dev
# Open http://127.0.0.1:4173 and select Start encounter.
npm run check
npm run build
npm run replay:encounter -- <export.json>
```

`npm run dev` binds127.0.0.1 only. Keep its terminal running. `npm run build` produces dist headless code and web-dist browser files. Refresh after rebuilding; a running encounter retains its loaded build. Replay requires the export's matching checkout and dependency lock. Original Stage 0 commands remain available.

## Executed acceptance

Combined checking passed25 original handoff tests plus63 runtime/game tests:88total, zero failures. This retains all35 Stage 0 tests and adds28 Stage 1 tests. Type checks, import guards, document/specification validation and both builds pass. Local test log: `runs-stage1-check.log`. These are local results; no new hosted CI run or deployment is claimed.

| Gate | Evidence |
| --- | --- |
| S1-01 | Pinned npm dependencies, local start/build commands, generated geometry, no private asset/service requirement; install/build/check exercised. |
| S1-02 | Automated movement, collision, attacks, windup/projectiles, dash, death/respawn/recovery, continuous capture, score/timeout/draw, restart. Complete visible browser encounter reached beta600 / alpha22 at tick1684. |
| S1-03 | Browser HUD/controls/aim/range/health/relay/cooldowns observed; end score uses terminal data and end overlay has its own reachable export button after playthrough fixes. |
| S1-04 | Ten policy tests cover public objective rotation, visible target selection, cooldowns, evasion, retreat/recovery and reaction scheduling; full-policy encounter integration test reaches a valid relay win. Enemy plans/timers are omitted from observations. |
| S1-05 | The actual browser bundle's SHA adapter and simulated action stream agree with Node; copied/reduced presentation data leaves world hashes unchanged. Live-browser export replay also matches. |
| S1-06 | Local outdoor plateau/ridges/Runner/relay presentation inspected. Browser play exercised normal controls, damage/respawn, capture and a complete outcome. Public field PNGs and run exports retained locally. Human satisfaction is not inferred. |
| S1-07 | Named hardware/browser plus actual RAF, simulation step and sampled-input delay recorded below; background throttling and UI issues separated from tactical decisions. |
| S1-08 | All Stage 0 regressions retained. Explicit local JSON export includes manifest, journals, checkpoint, screenshot and diagnostics; no uploads. Node replay checks every recorded tick/event. |

## Actual browser run and performance

Review evidence: local `runs/stage1-browser-review/encounter.json`, `replay.json`, and `battlefield.png`. The completed visible run contained58 human proposals and89 AI proposals, finished at tick1684 (84.2simulation seconds), with alpha22 / beta600. Its final hash replayed exactly in Node: `e03e14f54ccb120c4a03f4e8a920b1b363cdec3fdea81de80ec56ece95442724`. This review run predates the final documentation/source identity; its numerical replay was checked explicitly without source comparison, retaining its original dirty-tree manifest. Final clean-build evidence is saved separately under `runs/stage1-browser-final/` after commit.

Hardware: Intel Core i7-6700 @3.40GHz, NVIDIA GeForce GTX1060 3GB, Windows x64, embedded Chromium155 / ANGLE D3D11,1074x884, pixel ratio1, normal effects, two units. The export's rolling3000 frame samples had mean17.724ms (about56.4FPS), p9516.8ms, max1016.7ms.1684 simulation steps had mean4.383ms, p956ms, max12.6ms.58 human UI sampling-to-application waits had mean22.681ms, p9541.8ms, max51ms. These are UI/scheduling measurements, not mental reaction latency or isolated GPU timings.

The separate background automation tab was throttled near1FPS. This is retained as an interface/testing condition, not counted as tactical failure or foreground performance. Catch-up remains bounded and retains all ticks. The visible tab also showed about60FPS during play, but the one-second maximum interval means no universal stable-frame-rate promise is made. Broader browsers/hardware and long-session performance remain untested.

## Limits and next gate

This is a small prototype using original simple geometry, three cover blockers and scripted AI. There is no active elevation/climbing, advanced fog memory, audio, touch/rebinding support, multiplayer, progression or3v3. Covers and routes need owner playtesting against the revised references. No trained/adaptive intelligence or validated human assessment is claimed.

Review movement, targeting, readability, route trade-offs and pacing before adding Stage 2 content. The [implementation note](STAGE1-IMPLEMENTATION.md) defines the authored map, exact combat semantics, recovery, information boundary and compatibility scope.
