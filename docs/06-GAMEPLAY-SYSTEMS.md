# 06 · Gameplay systems

Status: implementation-ready starting design, not a claim that balance has been tested. All numbers below are provisional content values.

## Stage 1: complete small encounter

Use `experiments/000-vertical-slice.json`. One human unit faces one local AI unit in an open-air 80 by 60 unit arena. Two low ridges create a short exposed route and a longer protected route to one central relay. No lanes, creeps, shop, XP, or elaborate inventory yet.

Initial controls: right-click to move or attack a visible target, Q to prepare a directional shot then left-click to confirm, W to dash toward the pointed location, Escape to cancel targeting, Space to centre the camera, and a visible restart control. Show the bindings in the UI. Rebinding is desirable; desktop keyboard/mouse is the initial target, not a promised touch interface.

One archetype, provisionally called Runner:

| Property | Starting value |
| --- | --- |
| Health | 100 |
| Move speed | 6 world units per second |
| Vision radius | 18 units, blocked by declared ridges |
| Basic attack | 10 damage, range 8, interval 16 ticks |
| Q: Pulse shot | 25 damage, range 14, radius 0.6 projectile, speed 24 units/second, 6-tick visible windup, 100-tick cooldown |
| W: Vector dash | Up to 6 units over 4 ticks, 120-tick cooldown, no invulnerability, stops at blockers |
| Death | 80-tick respawn, no instant teleport to the objective |

The projectile, windup, interruption, dash path, and cooldown belong to simulation state, not visual animation. Basic attacks use a simulation-defined launch/impact rule with no renderer hit checks; Codex must specify and test the chosen rule before shipping combat. No critical hits or hit randomness in this slice. No damage while dead; no ability cast during respawn. Avoid free health regeneration outside the explicitly marked spawn recovery area.

### Relay objective

A living unit within radius 5 contributes capture presence. If exactly one team is present continuously for 40 ticks, that team owns the relay; a change in the sole team resets capture progress. Contested or empty presence resets unfinished capture progress. Ownership remains until changed.

The owning team earns one point per tick only while its living unit is present and the zone is uncontested. First to 600 points wins. At the 6,000-tick limit, the higher score wins; equal scores draw. Evaluate lethal damage before capture/scoring. This keeps holding ground valuable without allowing an early capture to score forever while both units hide.

The meaningful trade-off is between damaging an opponent, holding the objective, scouting the protected route, and preserving an escape. The bot should contest and retreat, not simply run into attack range repeatedly. Add no new mechanics until this loop is readable and complete.

## Stage 2: tactical-combat baseline

Use `experiments/001-tactical-combat.json`. The eventual baseline has six controllers on two teams, one human and five AI, two lanes, two towers per team total (one per lane), one core per team, jungle-like side routes, and one relay. Approximate duration target 10–15 minutes; maximum 18,000 ticks at 20 Hz.

Creep waves advance down each lane. A wave choice competes with rotation and relay control. Towers attack under explicit range and target-priority rules. At least one destroyed tower unlocks the enemy core; destroying the core wins. If both cores are destroyed in the same resolved tick, draw. At timeout compare remaining core-health fraction, then remaining tower-health total, then relay points; exact equality draws. Values and tiebreakers must be in the resolved rules, not hidden UI logic.

The relay grants a short lane-pressure advantage, not an unavoidable global damage spike. Prototype the exact benefit separately and publish its timing. Do not grant both a powerful team buff and large economy gain before testing snowball behaviour.

Add XP, levels, and a small upgrade choice only after wave pressure and rotations work. Initial upgrade categories: damage, survival, mobility, and information. Make a choice carry an opportunity cost. A large shop, recipe tree, multiple damage types, and six hero kits are deferred.

Target early decisions: take the safe wave or scout; trade health or preserve a dash. Mid decisions: defend a tower or join the relay fight; split pressure or group. End decisions: convert an advantage into the core, or reset before a counterattack.

## Counterplay and feedback

Every dangerous attack needs a readable tell, a defined response window, and a visible result. Telegraphs must reflect authoritative geometry. Walls that look solid must not allow unintended projectiles or movement. Damage, blocked paths, interrupted casts, cooldowns, capture progress, respawn timing, and victory must be understandable without reading developer logs.

Disable unnecessary screen shake, keep ground markers distinct from decoration, and show friendly/enemy identity by shape or icon as well as colour. Decorative fog must not mask required feedback. Tactical fog is a gameplay rule and must be consistent across UI and AI.

## Stage 3: radical replacement

Use `experiments/002-control-field.json`. Three independent participants compete over zones in an open field with movement and perception, but no combat, health, tower, lane, shop, or XP requirement. Each participant is its own team. Victory comes from uncontested presence. This is an architectural test, not a promise of equal entertainment value or a validated benchmark.

The existence of this scenario is meant to expose hidden MOBA dependencies while the codebase is still small.
