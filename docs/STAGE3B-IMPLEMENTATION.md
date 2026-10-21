# Autonomous crossing: first playable scope

This is the bounded 3B skirmish, not the 3C strategic economy. Technical verification and owner experience approval are separate; see [live status](STATUS.md).

## Launch and play

`npm ci`, then `npm run dev`. Open `http://127.0.0.1:4173/`. One hero and one personally owned ally face two raiders. Defeat each raider once before both friendlies are down simultaneously. Timeout at 90 seconds draws. The crossing marker awards no victory points. The approved relay duel remains at `http://127.0.0.1:4173/?scenario=duel`.

Hero: right-click ground to move, click an enemy to pursue/attack, A then click for ground attack or explicit target, S stop, Q then click pulse, W dash. Shift/middle drag pans; Z/X/C temporarily peek; Space centres; Escape cancels or pauses. Centred Resume, outside-click menu dismissal, cooldown bars and fog remain.

Ally: T or ALLY selects its command panel. D then click ground defends a perimeter; E then click secures/holds a point; F follows; R cancels. Risk changes apply to the next issued order. Intentions last 60 seconds. Selecting the ally never redirects the hero's low-level controls. The ally independently chooses movement, attack, pulse, evasion and recovery. A death of either commander or ally invalidates the old generation/order; issue a new intention after rebuilding. Cancellation stops travel/attack on the ally's next scheduled reaction, not a projectile already in flight.

The panel distinguishes order acceptance/delivery from the ally's delayed self-report. Reports contain its own observed position/health/status, with original observation time. They are not live enemy vision. Outside hero sight the ally's live model is hidden; an old report never creates a selectable body. Follow receives explicit delayed commander-own-state telemetry, not privileged current position.

The intro links Crossing, Blocked route, Flank and Relay duel. Each autonomous variant has its own manifest version (0.2.0, 0.2.1, 0.2.2), content hash and authored map identity. These are deterministic local test variations, not procedural terrain or general intelligence.

## Runtime and compatibility

The same Engine and Runner schedule four separate controllers. Hero budget is one sampled action per tick, reaction 0. Ally chooses every four ticks with two-tick reaction and two actions maximum (one tactical proposal plus its status report); raiders choose every four ticks with four-tick reaction and one action. All have identical Runner body statistics and 18-unit personal sight. Shared team vision is disabled. Action schemas, actor assignment and module permission checks apply at both submission and execution.

New optional `command.owned@0.1.1` owns grants, generation, order revisions/tombstones, delayed report queues and death latches. `rules.crossing@0.1.0` owns the bounded outcome. Tactical modules 0.2.0 use scenario-specific map/roster and a static marker, reusing the accepted movement/combat/perception/facing algorithms. Original 0.1.0 registry and experiment JSON files are untouched. No core or baseline wire-envelope changes were needed. [Contract design and impact](STAGE3A-DESIGN.md) and [independent 3A PASS](evidence/3A/independent-review-a60e09e.md) document the prior gate.

Report `revision` is a monotonic report sequence, distinct from an intention's revision. The status is policy-declared; position/health are captured from the reporting body's own state by the trusted module. The two report directions carry no enemy fields. Reports arrive in the observation labelled their delivery tick, never sooner. Authority changes clear both queues and delivered reports. Higher order revision wins a same-tick batch; cancellation wins only equal-revision ties; lifecycle changes invalidate old-generation commands first.

The responsive local policy stores decision count, retreat commitment, generation/revision and bounded last-seen entries with original timestamps. It does not refresh missing enemies. A second steady policy changes choices using the same body/configuration/budget. Policy replacement uses a new run identity and initialized memory; incompatible manifest checkpoints reject. No hosted model, training, hidden blackboard, economy or construction is included.

## Export, replay and headless proof

Menu → Export run, or Export replay on completion, saves locally. `npm run replay:autonomy -- <export.json>` selects the autonomous registry only for `grid-rift/autonomous-export/v0`, checks matching source/lock identity, then every tick hash/event/result. `npm run replay:encounter` also recognizes this explicit format; historical duel exports retain their registry. A changed source fails clearly and requires the recorded checkout. Do not describe source-verification-disabled unit-test replay as strict delivery evidence.

`npm run demo:autonomy -- crossing` runs all-local policies, issues one secure intention and completes a headless drill. `blocked-route` and `flank` are accepted arguments. This demo declares a local utility controller for the hero; it is a runtime example, not a human playtest. `npm run check` retains the handoff/Stage 0/Stage 1 suite and includes new Stage 3 tests. Complete runner checkpoints include module queues, schedules and policy memories; action replay and policy rerun are separately tested.

## Review boundaries

Review whether the ally's intention and reports are clear while controlling the hero, whether it responds usefully without repeated clicks, and whether update/cancel/follow feel understandable. Balance is provisional; the ally uses transparent local rules. Art is the retained prototype, keyboard/mouse desktop is the tested input, and broad hardware/accessibility coverage remains open. The next stage requires actual owner experience approval; no 3C construction/economy or 3D peer hero expansion is authorized by a technical result alone.

The first candidate fd22102 exposed a readability gap while a unit rebuilds. The feedback successor preserves fixtures/autonomous-crossing.json and introduces fixtures/autonomous-crossing-feedback.json 0.2.0, command module patch 0.1.1 and private unavailableUnitIds from the existing serialized lifecycle latch. This adds no live location/health or enemy information; controls explain rebuilding and require a fresh intention after return. The core and action payload versions remain unchanged.
