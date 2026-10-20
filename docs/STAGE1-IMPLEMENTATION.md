# Stage 1 implementation choices

20 October 2026. Routine module/content implementation under the approved Stage 1 assignment. The generic simulation and controller contracts remain v0. `contracts/tactical-types.ts` adds module-specific view types; it does not make combat or teams universal engine requirements.

## Authored map and module ownership

`duel-ridges/v1` is an 80x60 planar map. Relay: (40,30). Spawns: alpha (14,34), beta (66,26). Ridge-west: centre (26,24), size8x16; ridge-east: (54,36), size8x16; relay-side cover: (40,22), size5x3. Visibility and collision use these exact axis-aligned bounds. Body radius0.6 inflates navigation blockers. A visibility graph routes through legal blocker corners. Exposed central approaches, longer outer routes, and cover breaks create different travel/visibility costs. Every route and capture rule is data/rule-driven, not inferred from concept pixels.

Heights are visual silhouettes and planar blockers. There is no climb, active high-ground advantage, concealment vegetation, underpass, scan node or secondary objective. Those reference-image ideas remain future candidates. Distant rocks and seams are explicitly decoration outside the tactical collision map.

World/perception initialize first. Movement resolves before combat; movement reads the previous combat state for dash delivery, death/respawn and attack intent. Combat then resolves; objective and termination run afterward. Each module writes only its own state. The six IDs and configs come from the existing vertical-slice experiment; other layouts are rejected as unavailable.

The generic observation builder merges disjoint projected components by entity ID and rejects duplicate component ownership. This corrects composition for movement+combat on the same body without adding game concepts to core or changing the public observation shape.

## Combat and recovery

Basic attacks are instant authoritative hits at a valid visible target within8 units, repeating every16 ticks while its intent remains valid. Movement intent cancels attacking; approaching attackers stop at range. No animation decides hits. All damage intents in the tick are gathered before deaths, so lethal exchanges can kill both units.

Pulse has a6-tick windup, 25damage,14-unit range,0.6 radius,24units/sec speed and100-tick cooldown. Direction is fixed when windup launches. Swept collision checks blockers and living opponents; blockers win an equal-distance collision. Death cancels a pending windup; already launched projectiles continue. Targets can dodge a visible tell. The renderer clamps tells to the real range and only receives permitted projectiles/traces.

Dash starts the following simulation tick, travels up to6 units over4 ticks, stops at collision, grants no invulnerability and has120-tick cooldown. Death disables commands. Respawn after80 ticks restores full health at the original spawn. A living unit heals1HP/tick only within3 units of its own clearly marked recovery ring; there is no healing elsewhere.

Relay capture is40 consecutive sole-team ticks. Empty/contested presence resets incomplete capture, ownership persists, and only uncontested owning presence earns1point/tick. First600 wins;6000 ticks times out by score, then draw. Lethal damage is resolved before capture. Public relay progress/scores are deliberately public objective information.

## Fair information and timing

AI and human input share Engine validation and the same bodies, damage and sight rules. Human input is sampled at most once per tick; a newer unsampled intent replaces the older one. The AI decides every4 ticks with4-tick reaction delay and one action per execution tick. Its response deadline is the current local delivery tick, distinct from its future action-execution tick.

Assigned bodies are always observable. Enemies require radius18 and unobstructed line-of-sight. Enemy destinations, path plans, attack intent and private cooldown timers are omitted; visible health, movement and windup tells remain. The policy receives no store, evaluator truth or RNG handle. It has explicit retreat memory and uses only its observation. No difficulty stat advantage or learning is claimed.

The browser has a fixed-step accumulator. It never skips authoritative ticks: up to32 ticks /100ms of catch-up work per animation frame, then retained backlog; stalls over2.5sec pause, and tab hiding/blur also pause and discard unsampled human input. A read-only Three renderer owns camera, geometry and effects. The browser build replaces Node SHA-256 with pinned Noble SHA-256; test vectors and actual browser/headless replay establish matching results for this build/runtime scope.

## Compatibility and local outputs

Existing experiment JSON and public core contracts remain unchanged. New module state/checkpoints require this matching source build. Old Stage 0 runs remain reproducible in their recorded checkout and fail closed under a different build. The Stage 0 CLI intentionally retains its separate fixture registry.

Browser exports contain manifest, sampled admitted inputs, journals, hashes, checkpoint, result, public field screenshot and local timing diagnostics. They are evaluator records for inspection, not input to a policy. Export is explicit and local; there is no network collection or hosted service. The Node encounter replay command checks recorded source/content and lock identity, then every event and world hash. Run evidence remains ignored by Git.
