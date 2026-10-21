# Native combat facing and accurate shot geometry

21 October 2026. Implemented under owner feedback; visual experience approval remains open.

The first facing correction inferred targets in the renderer. Enemy target IDs are private, so this worked for the human while leaving the visible AI model facing its previous movement direction. Rendering the same private target inference for enemies would violate the observation boundary.

Experiment 0.4.0 adds `orientation.combat@0.1.0`. After combat resolves, this module records an explicit facing vector for each body. Both controllers use identical logic: a current basic hit faces its actual target on that tick; stationary active attacks track a legitimately visible in-range target; pulse windup faces its aim and retains that direction at launch; movement and dash restore travel direction. Last positions and retained orientation belong to checkpointed module state. Dead bodies reset to movement facing. No damage, hit, range, cooldown, command, reaction budget or visibility rule depends on renderer animation.

The public `orientation` entity component exposes only facingX/facingZ for permitted bodies. Enemy target IDs, paths and cooldowns remain private. The browser consumes this direction for both teams. The previous inference remains a compatibility fallback for older observations without the new module. Existing experiments 0.1.0 through 0.3.0 remain immutable and omit this module; the generic core is unchanged.

Shot presentation uses cylinders aligned directly between their endpoints, at the model weapon height of 1.18 units. Pulse projectiles use that same height; pulse hit traces produce a local impact rather than a false new beam from the owner's later position. Intent/range guides intentionally remain close to the ground, with corrected endpoint alignment. All effects consume the already permitted combat projection.

Tests cover native player/AI facing at the actual attack tick, real utility-policy AI attacks and replay, pulse launch retention, movement priority, checkpoint continuation and hidden-target non-interference. Geometry tests transform the actual beam mesh's endpoints in eight directions and distinguish raised basic beams from local pulse impacts. Full earlier runtime/game checks remain required. Owner play review determines whether shot readability is satisfactory.
