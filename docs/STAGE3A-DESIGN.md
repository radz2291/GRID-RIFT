# Stage 3A: autonomous crossing — contract candidate 0.1.0

21 October 2026. A-01 through A-05. This proposal is not an implemented playable.

## Reconciliation (A-01)

Inspected clean local branch `design/stage3a-autonomous-warfare`, baseline `11fbae551f05706461361c878453a35ee3bc0962`. Fetched origin. Remote heads: design branch at that baseline; main `8cd28af09ed7f20c713ab0c04727d1d77ffad654`; stage1-playable `8a058ee16d8f2911015a6c6254d05fcfc144af16`; handoff/v0.1 `c51dc97f71281bba0d4e36016a800a0fd5d22714`. Local stage0-foundation `19f53d0834671473d655c5c6d75c614141d35b7e` is retained. No Stage 2 implementation appears in these refs/history. This says nothing about unseen checkouts.

| Existing work | Integration |
| --- | --- |
| Approved Stage 1 controls, renderer, visibility, combat, replay | Retain duel and reuse the verified mechanisms |
| Proposed two-lane Stage 2 | No code/evidence found; do not require it |
| Autonomous command/construction/team heroes | New scope; construction and peers wait for later owner gates |

## Scenario (A-02)

One human hero p1/body-p1, one separately controlled owned ally a1/body-a1, and two raiders p2/body-p2 and p3/body-p3. Alpha owns p1/a1; beta owns p2/p3. The ally has the same Runner combat body. Public 80x60 crossing and cover; variants move visible threats or add a legal blocking ridge. The hero keeps all accepted direct controls. The ally gets defend a point, secure a point, or follow the commander; these name outcomes, not action sequences. Secure holds the destination once clear; defend maintains a bounded perimeter. Follow uses current personally visible commander or a delayed permitted report, never hidden current position.

Bounded drill outcome: defeat each raider at least once before both friendly bodies are simultaneously down; simultaneous success/loss draws, otherwise a 90-second timeout draws. This is a skirmish acceptance drill, not the eventual strategic victory loop. No relay points determine its outcome. Later 3C replaces this optional terminal module with core destruction. Different visible threat directions, low health, and routes must produce different choices under an unchanged order.

## Contract and lifecycle (A-03)

Pure types and authority helper: [autonomy.ts](../contracts/autonomy.ts). Wire shapes and bounds: [autonomy-schema.ts](../contracts/autonomy-schema.ts). `command.order@0.1.0` is submitted by the hero's authenticated controller for its own actor. The recipient remains controlled only by its independent policy controller. Team membership never grants command authority. Each grant separates unit, unit controller, commander controller/actor, and monotonic generation. Payload issuer fields are forbidden.

An order contains bounded ID, generation, globally increasing revision per grant, kind, target, risk and expiry. Priority is fixed: revocation/death invalidates the generation; expiry retires the old order; then the highest valid new revision wins, with cancellation winning only an equal-revision tie. Cancel r3 versus issue r4 selects r4 pending; cancel r4 versus issue r4 selects cancellation. Only one active intention per unit; no priority queue is needed. Issue/update replace the current order and become effective after 2 ticks; cancellation immediately installs a tombstone, suppressing older pending deliveries. Execution rechecks issuer, living commander/recipient, generation, increasing revision, valid map target and future expiry (at most 1200 ticks away). Expiry is exclusive. The policy sees the order only after delivery. No issue-time authority is trusted later.

Commands are validated against S[t]. For multiple otherwise valid same-tick orders, highest revision wins; cancellation wins an equal revision; stable command order breaks identical ties. Lower or duplicate revisions against committed state are rejected. Superseded same-batch actions receive an explicit module event, not a false claim they executed. A new order uses any ID and a higher revision; cancellation must name the current order. Death of either commander or subordinate cancels pending/active orders at the next input phase, increments generation, clears reports, and requires a new order after respawn. A serialized per-grant dead latch prevents repeated dead ticks from repeatedly incrementing generation; clear it only after both parties are alive. This gives a one-tick response to effects-phase deaths. The policy stops an old attack/move on its next scheduled decision (at most 4 ticks plus 2 reaction ticks); cancellation does not teleport or freeze a projectile already fired.

`command.transfer` is explicit voluntary reassignment by the living current owner to another living allied controller/actor. It increments generation, clears orders/reports and rejects delayed old-generation input at execution. The recipient does not receive another owner's history. There is no automatic team-based reassignment. Unit policy/body assignment never changes when command ownership transfers. No free peer override or browser reassignment UI is needed for 3B.

`command.report` is a unit action for its own body, alongside ordinary move/attack/cast. It contains only a finite status enum, generation and revision. The module captures that unit's own position/health at the report tick and delivers it 4 ticks later to the then-valid commander; no enemy positions or plans enter reports. Status is a declared policy report, not inferred intelligence. Pending/delivered reports and orders are explicit simulation state. Expose only the requester's grants/orders/reports. The unit receives its own delivered intention and delayed commander position reports; at input ticks divisible by 4 the module captures the living commander's own position/health into a generation-bound report (mode commander, revision 0), then delivers it to that grant's unit controller exactly 4 ticks later. This is a declared automatic commander-own-state telemetry channel, not shared vision. Its state is leaderQueue and leaders, with the same UnitReport fields (unitId names the commander body); projection is only to that unit controller. Both queues and delivered records clear on transfer/death/generation change. The unit uses the last delivered position with its original timestamp for at most 80 ticks; with neither a personally visible commander nor a fresh report it stops safely. Hidden opponents never enter either report channel; other owners receive none. No team blackboard. Shared team vision is disabled in this drill. A commander may see a last report outside sight, clearly timestamped; the live body remains fog-hidden.

Unit policies receive copied permitted observations every 4 ticks, react after 2 ticks, and have at most 2 actions (one tactical action plus one report). Hero samples once per tick with at most 1 action. Body stats and vision are equal. Memory includes decision count, last order revision/generation, retreat mode and bounded last-seen entries with original timestamps. A missing target cannot refresh memory. Policy replacement creates a new manifest/configuration and resets memory from its seeded initializer; hot swapping incompatible checkpoint memory is rejected by manifest identity.

## Compatibility and feasibility (A-04)

No core or baseline envelope changes. Existing `ControllerSpec.actors` supports four independently scheduled controllers. Runner already saves queues, schedules and policy memories; optional module state holds command authority/delivery. Engine validates actor assignment at admission and execution and calls module validation against S[t]. New scenario-local tactical module variants 0.2.0 reuse unchanged 0.1.0 algorithms, replacing only authored map/roster and non-scoring crossing marker. Keep old module registry/configurations intact. The autonomous scenario uses its own explicit fixture loader and registry; never pretend the old spec-only catalog executes new modules. Unknown modules/config/policies fail startup. Preserve all published experiment files.

| Seam | Existing implementation | New work |
| --- | --- | --- |
| Tick, commands, schemas, module dependency ordering | Engine/registry | None |
| Independent policies/reaction queues/full checkpoint | Runner | New identities and memory tests |
| Movement, combat, sight, native facing | Tactical 0.1 | Scenario-local 0.2 variants; retain baseline |
| Ownership, intentions, delayed reports | Absent | Optional command.owned 0.1 |
| Bounded drill outcome | Absent | Optional rules.crossing 0.1 |
| Construction, resources, peer cooperation | Spec only | Excluded until later gates |

Old exports still replay on their matching source/lock. New action replay selects the new registry only for the new explicit export format. Wrong source/lock fails clearly. Do not reinterpret legacy identities. Determinism remains same build/runtime family, as in Stage 0. The draft [scenario](drafts/autonomous-crossing-v0.1.json) is descriptive and not loaded as executable content in 3A.

## Trace and negative examples

At t=10 owner issues defend revision 1, effective 12, expiry 100. At t=11 revision 2 changes the point, effective 13; revision 1 cannot reappear. At t=12 cancel revision 3 installs a tombstone; neither earlier pending order delivers. Reissue revision 4 at t=14 becomes active at 16. Unit report at t=20 arrives at 24 with observedTick 20. Transfer at 21 drops that report. A forged issuer field is malformed; p2 ordering alpha's unit is unauthorized; old generation and duplicate revisions reject generically, independent of hidden enemies.

## File-owned implementation tickets (A-05)

Manager owns contracts/autonomy.ts, contracts/autonomy-schema.ts, integration, fixture, session, export/replay and all shared changes. After A PASS, runtime builder owns src/modules/autonomy.ts and src/agents/subordinate.ts plus tests/stage3/ runtime tests; browser builder owns client.ts, renderer.ts, public/style.css and browser presentation tests. Neither changes Engine, Runner, published experiment files or other's paths. Agree exported interfaces before delegation. Fresh verifier owns only its stage evidence report, checks exact committed candidate, and does not repair audited source.

Acceptance mapping: B-01 runtime+hero regression; B-02 threat/route tests and browser actions; B-03 lifecycle/authority/hidden-state negative tests; B-04 nonzero full checkpoint, replay, rerun and identical-body policy swap; B-05 delayed report/selection/keyboard/reduced-effects walkthrough; B-06 entire regression, actual completed browser drill, timing and fresh independent challenge. Failures remain recorded and repaired before re-verification. First autonomous experience requires the owner's actual review; no economy or teammate-hero expansion follows from a technical PASS alone.
