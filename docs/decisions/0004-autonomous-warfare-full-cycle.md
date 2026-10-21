# 0004 · Autonomous warfare and full-cycle delivery

Date: 21 October 2026. Status: owner-approved product direction and workflow amendment; implementation pending.

## Authority and reason

The owner found the current relay encounter too close to capture-point play. They approved direct hero control, highly autonomous owned units receiving top-level orders, independent teammate heroes and construction option A (predefined tactical objects). They then asked to update the GitHub documentation comprehensively and requested full-cycle development.

## Decision

Consolidate forward product intent in `CURRENT-DESIGN.md`. Preserve verified simulation and Stage 1 controls, art direction, experiments and historical evidence. Reconcile actual Stage 2 work rather than asserting completion. Move to autonomous-command 3A/3B, strategic world 3C, hero peers 3D, evaluation 3E and local release 3F; preserve noncombat test as 3X.

The local manager owns the iterative build/independent verify/repair/reverify/playtest/deliver cycle. The old handoff's mandatory owner pause after a design-only 3A is superseded: technical PASS permits 3B. Owner experience review remains at the first autonomous playable and strategic loop, then final acceptance. This balances progress with concrete experience judgment; it does not ask the owner to relay technical repairs.

## Impact and compatibility

Update startup, rules, vision, principles, architecture, simulation-contract annotations, intelligence, gameplay, visuals, experiments, evaluation, roadmap, handoff and status. No runtime API, published experiment JSON or policy is changed by this documentation amendment. Future core contract changes require version/migration impact and acceptance tests before dependent code.

Alternatives: continue the old two-lane roadmap, discard the playable baseline, or immediately implement the entire new game. Rejected because they either miss the approved target or obscure risk. Current scope is the documentation alignment; the handoff authorizes the separate local implementation cycle.

## Next proof

A-01 through A-05 and B-01 through B-06 in the roadmap. A player controls the hero, gives an ally one intention and sees it respond under changed threats without new clicks. Independent verifier evidence and actual owner experience approval remain separate.
