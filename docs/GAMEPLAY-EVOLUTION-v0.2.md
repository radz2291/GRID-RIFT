# GRID-RIFT · Gameplay evolution plan v0.2
*Design amendment to the original roadmap; not a retroactive Stage 2 completion record.*

## Why
The relay-based duel currently feels like holding a capture point. The intended new experience takes inspiration from the tactical interaction of Dota, strategic resource and force management of Red Alert, and the possibility of changing the environment—but chooses **restricted tactical construction** rather than unconstrained building. Do not mechanically copy their assets or rules.

## Approved experience
- Player controls their personal hero directly, including attacks, movement and abilities.
- Other teammate heroes are independently controlled, by other people or AI; teammates are not subordinate minions.
- Each commander can own subordinate autonomous units. Those units pursue top-level intent independently within permission, capability, risk and observation constraints.
- A commander's attention is scarce. Issuing, revising, neglecting or delegating an order matters.
- Opposing activity continues without the player: forces contest territory, resources accumulate, infrastructure can be built or destroyed.
- A new strategic experiment should allow wins through disrupting the opponent's core and creating irreversible positional/economic advantages. The relay, if retained, is a secondary tool rather than the sole score-to-win condition.
- No need for a large content roster; begin with a few deeply interacting systems.
- Keep modularity, deterministic local replay, fair observation, independent AI policies, and read-only presentation.

## New path
**3A** Verify actual Stage 2 state, establish versioned new scenario design and contracts, deliver tickets and owner review. No broad gameplay coding.

**3B** First autonomous-force encounter: direct hero + one owned autonomous unit, one high-level order and replanning under changing threat. No need for full RTS economy yet.

**3C** Tactical construction + resource economics + continuing pressure + strategic core outcome. Add a narrow list of placeable structure types with actual placement/collision/vision/budget rules.

**3D** More than one hero teammate per side, each independent; distinct unit ownership; alliances/team-level objectives through explicit messaging.

**3E** Intelligence comparison: fixed-stat independent policy tests and scenarios probing adaptation, trade-offs, response and coordination; results are task-bounded.

**3X** Preserve the earlier non-combat three-participant `002-control-field` as a compatibility test that proves the core is not secretly MOBA-bound.

## Non-negotiable release gates
Each stage needs live command evidence, tested behavior, repeatable scenarios and scope limitations. A pretty animation or a successful scenario file load is not proof of decision-making. Win-rate alone is not proof of intelligence. A new experiment never silently replaces the legacy one, and no Stage 2 state should be inferred solely from previous conversation.

See [Stage 3A handoff](STAGE3A-HANDOFF.md) for the next agent assignment.
