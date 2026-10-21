# Independent Stage 3A re-verification — PASS

21 October 2026. Exact candidate `a60e09e9b1d2479360c297bc4f66ea408499f985`, branch `design/stage3a-autonomous-warfare`, baseline `11fbae551f05706461361c878453a35ee3bc0962`. This follows [the failed candidate review](independent-review-7788ad2.md). Verifier inspected the committed repair diff and existing authority/seams in a separate verifier context, without repairing source or committing. Working tree was clean when review started and HEAD stayed fixed through all checks.

Environment unchanged: Windows PowerShell, Node `v22.22.3`, lock SHA-256 `eca2504dd29ddf72bda8e1f32476665f7458c5054a3ac5bc678f4d186d8a1c4d`.

## Reproduced checks

| Exact command | Observed result |
| --- | --- |
| `git status --short` | Clean before this report |
| `git rev-parse HEAD` | Full candidate above, before and after checks |
| `git diff 7788ad2 a60e09e -- contracts docs/STAGE3A-DESIGN.md tests/stage3/contracts.test.mjs` | Repair scope inspected; no Engine, Runner, published experiment or gameplay implementation change |
| `npm run build:core` | PASS |
| `node --test tests/stage3/contracts.test.mjs` | 4 passed; 0 failed, skipped or cancelled |
| `npm run validate:handoff` | PASS, 6 specifications and document links |
| `npm run check:boundaries` | PASS |

Eight supplemental assertions also passed using this exact script through `node --input-type=module` from the repository root:

```js
import assert from 'node:assert/strict';
import { Ajv2020 } from 'ajv/dist/2020.js';
import {transferSchema, reportSchema} from './dist/contracts/autonomy-schema.js';
import {winningOrder} from './dist/contracts/autonomy.js';
const ajv=new Ajv2020({strict:true});
const transfer=ajv.compile(transferSchema), report=ajv.compile(reportSchema);
assert.equal(transfer({unitId:'body-a1',generation:1,commanderId:'p1'}),true);
assert.equal(transfer({unitId:'body-a1',generation:1,commanderId:'p1',issuer:'p2'}),false);
assert.equal(transfer({unitId:'body-a1',generation:-1,commanderId:'p1'}),false);
assert.equal(report({generation:1,revision:2,mode:'defending'}),true);
assert.equal(report({generation:1,revision:2,mode:'commander'}),false);
assert.equal(report({generation:1,revision:2,mode:'defending',enemyPosition:{x:1,z:1}}),false);
const a={revision:4,kind:'defend'}, b={revision:4,kind:'secure'};
assert.equal(winningOrder([a,b]),a);
assert.equal(winningOrder([]),undefined);
console.log('8 supplemental assertions passed: transfer/report wire negatives; stable tie; empty batch.');
```

These are eight assertions, not eight additional Node test cases. The preceding candidate's full independent `npm run check` passed 28 handoff plus 89 runtime/Stage 1 tests (117 total), as recorded in the preserved failed review. That full suite was not rerun on this candidate: the diff changes optional new contracts/tests and design only, with no existing gameplay/core/runner import path changed. Focused build and architecture checks were rerun above. No claim is made that 117 tests were rerun on `a60e09e`.

## Findings and criterion disposition

| Item | Disposition |
| --- | --- |
| F1, information channel | Resolved at specification level. Automatic commander-own-state telemetry samples at input ticks divisible by four, delivers four ticks later, retains original timestamps with an 80-tick freshness limit, binds to generation, privately projects only to the grant's unit controller and clears queued/delivered data on transfer/death/generation change. Follow without sight or fresh telemetry stops safely. It does not transmit opponent state. `CommandView.leaders` carries the declared report shape. |
| F2, precedence | Resolved. Lifecycle invalidation, then old-order expiry, then highest otherwise-valid new revision; cancellation only wins equal revision. Explicit r3/r4 examples agree with `winningOrder`. Focused test plus supplemental stable-tie/empty checks pass. |
| F3, policy import feasibility | Resolved by separating pure interfaces/helpers in `autonomy.ts` from Ajv compilation in `autonomy-schema.ts`. Pure types contain no imports or ambient dependencies. Existing guard still recursively inspects imports and passes; no weakening was introduced. No subordinate policy is claimed to exist yet. |
| F4, death transition | Resolved at specification level by a serialized per-grant dead latch, reset only once both parties live. Actual checkpoint and lifecycle tests remain required in 3B. |
| A-01 | PASS: prior baseline/ref reconciliation retained; approved Stage 1 untouched; Stage 2 absence remains scoped to inspected refs. |
| A-02 | PASS: specific one-hero/one-owned-ally drill, two raiders, changing threats/routes, bounded outcome and later strategic migration remain clear. |
| A-03 | PASS for design/contracts scope: issue/update/cancel/expiry, ownership/generation, policy budgets/memory, delivery/privacy and same-tick rules now give implementers a coherent contract. |
| A-04 | PASS for design/contracts scope: schema/authority negative validation and existing Engine/Runner optional-module seam are demonstrated; proposed runtime modules remain explicitly unimplemented. |
| A-05 | PASS: required prior contract findings resolved; file ownership, criterion mapping and regression plan support the next bounded implementation. |

The existing Engine can register the optional module with action schemas, validate admitted and executing actions against authenticated controller/actor assignment and pre-step state, and carry private projections/events. Runner already saves independent policy queues, schedules and memories. The duel-specific world initialization requires the acknowledged versioned scenario variant; no new core envelope is justified by this stage. Preserve old experiments and registries. Actual transfer arbitration, report queue processing, generation rejection, lifecycle changes, checkpoint continuation and hidden-state non-interference must be tested against implemented modules in 3B.

## Final verdict and limits

**Independent technical PASS for Stage 3A at `a60e09e9b1d2479360c297bc4f66ea408499f985`.** No unresolved blocking design/contract finding remains. This permits the authorized Stage 3B implementation cycle.

This is design/contracts acceptance, not autonomous gameplay acceptance. The new drill, policies, order UI, telemetry queues and browser walkthrough are not implemented or proved here. The narrative trace is a specified walkthrough. Schema validation and helper tests do not prove live authority, autonomy or deterministic replay. Owner experience approval is not established; the next owner gate is the completed, independently challenged 3B playable. Only this evidence report was written by the verifier.
