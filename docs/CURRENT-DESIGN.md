# Current design · v0.3

Owner-approved direction, aligned 21 October 2026. This document is the single authority for forward product intent. `STATUS.md` alone records current implementation. A current user instruction supersedes repository guidance. Historical reports and immutable experiment files describe their own versions; they do not override this direction.

## Product and experience

GRID-RIFT is a local playable, hero-led autonomous warfare simulation in an outdoor technological wilderness. The player directly controls a hero, gives personally assigned forces high-level intentions, and cooperates with independent hero teammates. Subordinate units independently perceive, remember, choose tactics, and pursue the order within constraints. Team heroes are peers, not subordinate units.

The strategic world continues without attention: forces act, resource opportunities change, infrastructure creates pressure, and positions become costly to neglect. Structured tactical construction uses predefined objects at valid locations. It does not require freeform blocks, digging or arbitrary terraforming.

The first strategic experiment uses disabling/destroying an enemy core as its primary outcome. A relay can provide a secondary advantage. Merely holding a circle to accumulate victory points is not the target product loop. Exact costs, unit counts, site layouts, risk weights and a 10–15 minute target are provisional, subject to tests and play.

## Three distinct control relationships

| Role | Control and authority |
| --- | --- |
| Personal hero | Direct human input or its independently assigned AI controller |
| Owned subordinate | Commander supplies intent; distinct policy chooses execution |
| Teammate hero | Independent controller; cooperation through permitted information/messages |

A living unit is not a policy. Replacing its intelligence must not improve body statistics or information access. Do not hardcode a fixed role sequence as evidence of intelligence. Local, inspectable decision logic is sufficient initially; LLMs and learning are replaceable future adapters.

## Concrete target walkthrough

Launch a local match. Move and fight with your hero. Order an allied unit to defend a crossing, then leave it to act. Observe it reposition when visible danger changes, report its status, and resume its goal without new clicks. Invest scarce energy in a predefined defense or a route connection. An opponent should be able to bypass or contest that investment. Coordinate with a second independent hero while pressure elsewhere threatens your core. Finish, export a local run, restart, and reproduce the authoritative outcome from the matching build.

A player must be able to win a skirmish yet lose strategic ground because attention and resources were committed elsewhere. Construction must change a real tactical option, rather than decorate a capture-point arena.

## Deliverables

A runnable local browser product, headless experiment execution, versioned scenario and policy configurations, replay/export tools, automated checks, independent evidence and owner playtest instructions. Keep one modular repository; no separate reusable package or public package publication is required. Replacement is proved with policy swaps, renderer independence and a noncombat scenario, not folder names.

## Preserve and exclude

Preserve simulation/controller/presentation/evaluation separation, explicit state, deterministic local testing, fair observations, accepted Stage 1 input, six visual assets, old experiment identities and evidence. Keep restrained cyan/amber light, streamlined silhouettes, tactical elevation and concealment, clean outdoor forms and readable effects.

Exclude online multiplayer infrastructure, paid inference, remote human telemetry, a huge roster, unrestricted terrain editing and claims of general intelligence. Deployment or paid services require separate authority; pushing development source to the existing branch is authorized.

## Authority and sequence

The owner approved the new direction and tactical construction option A, then requested comprehensive documentation alignment and full-cycle development on 21 October 2026. This supersedes the prior design-only stopping rule after 3A. The manager may complete technical 3A and proceed to 3B without a routine approval round. At the first autonomous playable, obtain owner experience review before expanding the economy and hero population. Later owner gates are listed in the roadmap; engineering repair loops remain the manager's responsibility throughout.
