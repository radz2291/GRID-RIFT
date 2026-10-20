# Stage 0 verification · 20 October 2026

Result: executable headless foundation. Owner review is pending. No playable browser UI exists.

## Recorded results

Local Windows x64 verification used Node v22.22.3, npm 10.9.8, TypeScript 5.9.3, Ajv 8.20.0 and Node type definitions 22.19.0. Dependency versions and integrity are pinned in `package-lock.json`; its raw SHA-256 is `858633ba312113f981b2833fae035644e027cbcc16066c10ffcc30f18e6011ae`.

`npm run check` passed: 25/25 original handoff tests and 35/35 runtime/architecture tests, zero failures; source type checking, document/specification validation and import guards also passed. Ajv was updated from the handoff's 8.17.1 to the pinned 8.20.0 patch line; `npm audit` reported zero vulnerabilities after installation.

An actual `npm run demo` followed by `npm run replay -- runs/stage0-1792500221550` completed at tick 9 with the same final world hash: `d0330fb3e9b646ece6a614829f4690cd3c75eaac276843e1d9ca2a7765b25737`. Body-a reached the goal, 9 proposals were admitted, and one future proposal remained pending at termination. The checkpoint was saved at tick 3. This preliminary run retains its dirty-tree manifest and requires that recorded content to replay.

The final clean-commit delivery run is stored locally under `runs/stage0-acceptance-20261020-final/`. Its `manifest.json` identifies the actual source commit and complete runtime; `report.json` records the output hash. The final test log is local `runs-stage0-check.log`. Run files are ignored by Git and have not been uploaded. The final delivery run is checked after committing so its source identity matches the delivered checkout.

## Reproduce

From the repository root, with Node 22.12 or newer:

```sh
npm ci
npm run check
npm run demo
npm run replay -- runs/<directory printed by demo>
```

`npm test` remains the 25 original handoff checks. `npm run test:runtime` builds and runs the separate Stage 0 suite. `npm run check` runs both, source type checks, import guards, and document/specification validation. GitHub Actions uses this combined command; this delivery's execution evidence is local Windows evidence, not a claim that a new hosted workflow has run.

## Acceptance map

| ID | Executed evidence |
| --- | --- |
| S0-01 | Fixed actions repeated with reversed incoming array order; every world hash and ordered event result matches. Action replay checks every tick. |
| S0-02 | Restore a nonzero world snapshot and full runner checkpoint into new instances; queued actions, policy memory, future hashes and terminal result match. Demo checkpoint is saved at tick 3. |
| S0-03 | Switch a configured policy between idle and scored-step; body/core configuration stays equal, manifest policy identity changes, and behaviour changes. |
| S0-04 | Run active policies with and without a sink that mutates its copied view; all world hashes match. Offline metrics reproduce from saved events and do not write to simulation. |
| S0-05 | Change hidden positions, secret values and evaluator-only events; permitted observations, local event IDs and rejection receipts remain equal until legitimate visibility/outcome effects. |
| S0-06 | Reject malformed/nonfinite/oversized input, forged identity, unauthorized body, invalid payload, duplicate sequence, action cap, impossible/late timing, unknown modules/versions/configuration, missing dependencies, ownership conflicts and cycles. Async policy results become recorded no-ops. |
| S0-07 | Same-tick arrivals draw independent of incoming order. Core and runner post-terminal steps leave state and checkpoint unchanged. |
| S0-08 | AST import guard checks core/controller dependency direction, including transitive imports, forbidden browser/provider/evaluator dependencies and clock/random APIs. Negative fixtures demonstrate failures. |
| S0-09 | Actual local manifest records source commit/content, lock digest, exact runtime/dependency versions, seed, full configuration, module/policy identities and budgets. Per-tick output hashes, inputs and events are exported. |

## Scope and change impact

This adds core, runner, fixture module, policies, CLI and offline evaluation code. Public contracts and all three tactical specifications remain unchanged. Concrete gameplay modules are still unavailable, and the runtime rejects them rather than treating the specification catalog as executable code. Two policies are scripted baselines; no claim of learning or advanced intelligence is made.

The module lifecycle and numeric/checkpoint choices are recorded in [decision 0002](decisions/0002-stage0-runtime.md). Replay requires the exact recorded source/runtime/configuration/input scope. There is no cross-platform, cross-version, browser-performance, gameplay-quality, or hostile-code sandbox claim. Inputs run locally; no data is uploaded. Six reference PNGs match the approved manifest. User originals remain untouched in the ignored `visual-references/` folder.

## Proposed next bounded task

After owner review, implement Stage 1 only. First establish a versioned map with an exposed route and a protected alternative, using the two revised references together. Define collision and visibility in simulation data and test route accessibility. Then add one Runner, local opponent, movement, attacks, Q/W, relay capture/scoring, death/respawn, outcome and restart. Finally connect a readable outdoor browser presentation and test the complete encounter by playing it. Keep the same Stage 0 regression checks. Stage 1 acceptance includes screenshots, actual playthrough, and measured browser/input behaviour; none are claimed here.
