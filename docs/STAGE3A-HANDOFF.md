# GRID-RIFT · Stage 3A Codex handoff
Status: **proposed design milestone, not implemented**. Prepared 21 October 2026.

## Direction approved by owner
GRID-RIFT is evolving toward **hero-led autonomous warfare**. One player directly controls their own hero. Other allied heroes are independent human or AI teammates, each with their own decisions and potentially their own forces. Individually owned subordinate units are **highly autonomous**: commanders issue *intentions*, not every move or attack. The agreed construction direction is **A: tactical construction**—a small catalog of predefined structures placed at valid locations, rather than Minecraft-like freeform terraforming.

The first concept is compact, in an outdoor, clean cyan/amber techno-wilderness. Protect the restrained iconic silhouette/readability direction. Do not turn this into a capture-the-flag game with extra decoration. Longer-term pressure should arise from autonomous forces, resources, infrastructure, territory and consequential trade-offs. Core destruction or disabling is a **proposed new experiment objective**, not a replacement for existing saved experiment outcomes.

## First action: reconcile state, do not assume Stage 2 is pushed
On 21 October, remote `main` contained the earlier handoff while remote `stage1-playable` contained the owner-approved Stage 1 browser encounter. The remote Stage 2 implementation was **not verified** during handoff preparation. This design branch is based on remote `stage1-playable` at `8a058ee16d8f2911015a6c6254d05fcfc144af16`. Before changing code:
1. Inspect all available refs and local worktrees, recent commits, Stage 2 tests/reports, uncommitted work, and the status of any parallel agents. Ask for missing work only if discovery fails.
2. Identify which Stage 2 deliverables actually exist, their commit identities, evidence, and whether they need integrating.
3. Preserve the last verified playable baseline and historical test/experiment compatibility. Do not reset, force push, or overwrite other agents' work.
4. Give the owner a short plain-English comparison: implemented now, intended later, and gaps preventing Stage 3A.

## Stage 3A assignment: **design/contracts only**
Prepare a versioned experimental spec and narrow, testable interface changes. Do **not** build the complete autonomous warfare game in Stage 3A. No major gameplay modification until the owner approves the proposed interfaces and first experiment.

Minimum architecture:
- **Hero/controller**: direct hero input, independent hero teammates, explicit orders addressed to subordinate units; humans and AI submit through the same authorization rules.
- **Force ownership**: subordinate units have an owner/commander, affiliation, capabilities, and an independent policy/memory. Team members do not silently gain control of each other's forces.
- **Order intent**: commander requests an outcome and constraints (e.g. defend this zone; avoid unnecessary losses), with issuance time, scope, priority, expiration, status and cancellation semantics; not scripted per-tick moves.
- **Independent unit policy**: each unit receives only its allowed observations plus authorized order context; independently handles threats, path choice, engagement, retreat and re-planning; must explain observable status through concise structured reason codes, not pretend internal feelings.
- **Information and messaging**: no omniscient team blackboard, hidden location leakage, instantly delivered cross-map signals, or arbitrary AI access to simulation state; communication costs/delays are configurable experiment rules.
- **Tactical construction**: a catalog of a few fixed constructible types (candidate barrier, turret, bridge) placed at validated locations with costs, build time, durability, collision/nav/LOS updates, and counterplay. Not every type needs implementing in the first vertical slice.
- **Strategic loop**: develop resource income, persistent pressure and core vulnerability as *separate optional modules*. A relay may be a secondary strategic node; score accumulation should not be the sole win condition of the new experiment.
- **Evaluation**: measure order completion, threat response, survival-vs-objective trade-offs, individual policy differences, communication delays, lost-resource consequences, and commander attention costs. Report experiment-limited behaviours, not general intelligence scores.

## Concrete first playable target for Stage 3B
**One direct-control hero + one owned autonomous allied unit** against an opposing force, on a small tactical outdoor map. Player gives a high-level `defend / secure / follow` intent. The agent can choose tactical movement, target and retreat, and must react to at least one changing threat without new clicks. Commander can override or revoke. Do not hardcode a scripted sequence as proof of intelligence. A local, transparent policy is adequate to start; no required LLM calls. Larger armies and additional teammate heroes follow only after this works.

## Stage order after 3A
- **3B Autonomous units:** policy state, intents, status, limited coordination, reproducible behaviour and gameplay demonstration.
- **3C Strategic world:** fixed-site construction, resource production, autonomous lane/territory pressure, new core-based outcome, meaningful counterplay.
- **3D Teammate heroes:** independent hero controllers with separate forces, permissions, joint/team orders, appropriate observability.
- **3E Intelligence trials:** paired seeds and side swaps, fixed-stat policy comparisons, stress/adaptation scenarios, interpretable reports.
- **3X Architecture compatibility:** preserve original `002-control-field` noncombat scenario as the radical-replacement test. It must not be silently discarded or falsely called Stage 3A.

## Stage 3A deliverables / acceptance
1. `docs/STAGE3A-DESIGN.md`: one short concrete scenario with actual decisions and the initial experiment scope; explicit non-goals.
2. Contracts proposal for order payload/status, force ownership, policy memory and permissions, with samples and migration impact. Keep core generic; use versioned module schemas rather than new mandatory hero fields.
3. Experiment draft with registered-module feasibility assessment and validation checklist; mark unimplemented modules as *spec-only*.
4. Specific tests to implement: unauthorized orders rejected, no hidden-info leak, order update/cancel precedence, unit policy swap, fixed-input reproducibility, no renderer dependency, and baseline replay/regression.
5. Implementer tickets and file ownership that permit parallelism only after shared contracts are agreed.
6. Updated `docs/STATUS.md` accurately distinguishing proposed, implemented, tested, and approved.
7. A short owner review request for unresolved decisions; do not launch full 3B–3E production automatically.

## Owner-facing message format
Explain in plain English. Begin with the repo/branch audit and the proposed smallest scenario. List where this *meaningfully differs from capture-point gameplay*. Be candid about implementation gaps. No claim of emergent intelligence from a single scripted outcome.
