# Stage 1 controls revision

20 October 2026. Experience feedback revision; Stage 2 has not started.

## Changes

- Click a visible rival once to chase into range and keep attacking. Idle units automatically engage visible rivals within basic attack range. Right-click movement takes priority until arrival, so retreat remains possible.
- A then click ground advances while engaging the nearest visible rival within the acquisition radius (12 units, capped by sight radius). S stops movement and automatic attacks until another order. A selected rival remains the focus until lost or replaced.
- Shift + left-drag and middle-drag pan with grab/grabbing cursors. Hold Z / X for a bounded 25-degree sideways peek; hold C for a higher view. Releasing returns smoothly to the default angle while retaining pan and zoom. Losing focus clears held camera keys. Camera movement cannot change visibility permissions.
- Pulse and dash use refill bars and a bright READY state. Small numeric countdowns remain secondary. Keyboard pulse targeting also respects recharge/death availability.
- The map is explicitly labelled a prototype. Terrain, layout, structures and art remain provisional.

## Change impact

The immutable original experiment remains at 0.1.0. `000-vertical-slice-controls.json` records experiment 0.2.0 with human policy 0.2.0 and evaluation identity encounter/0.2.0. The observation-only human order planner records its standing order and unsampled intent in exports. Sampled manual orders and the resulting admitted commands are separately retained. Replays use the recorded authoritative commands and matching source identity. Original play evidence is preserved.

The simulation core and combat rules are unchanged. The public combat projection additionally exposes configured cooldown durations so the browser can display accurate bars. No hidden rival state is provided to the order planner or renderer.

## Research basis

Valve documents automatic attack behavior and its interaction with attack, stop and hold in [the official Dota 2 update](https://store.steampowered.com/oldnews/22210). The [official controls tutorial](https://www.dota2.com.cn/event/201309/newer/content02_04.htm) lists attack, stop and hold actions. This revision uses familiar continuous orders within GRID-RIFT's existing mechanics; it does not claim complete Dota control parity.

## Verification

`npm run check` passed: 26 handoff tests and 69 runtime/game tests, 95 total; type checks, architecture boundaries and both builds passed. Six focused control tests cover continuous pursuit/attack, visibility loss, nearest-target selection, retreat/stop priority, attack-move, integration replay, version identity and paused input handling.

The actual Chromium browser review confirmed attack-move targeting feedback, pulse/dash recharge bars at 35%/30%, the grab cursor while Shift is held, sideways and overhead peeks, and return on key release. Start instructions fit the 1280 x 720 viewport. The isolated test encounter reached tick 1000 and the score outcome; its exported authoritative inputs replayed successfully with final hash `5bff5cdc2425c43b8996574e4d5bea3383d340c43f633148e68be688d1562e4d`. Local evidence: `runs/stage1-controls-check.log`, `runs/stage1-controls/encounter.json` and `runs/stage1-controls/controls.png`. The export records the pre-commit source fingerprint used during review; later documentation/commit changes correctly require that matching source for strict replay.

This is functional verification, not a new performance benchmark or a claim that the controls now feel comfortable. Gameplay comfort, broader hardware/browser coverage, key rebinding and final battlefield acceptance remain owner review.

## Click-directed orders revision - 21 October 2026

User feedback distinguishes a ground order from an explicit enemy selection. A + click now hit-tests the clicked object: an enemy issues a persistent `combat.attack` order; ground issues `control.attack-move`. Ground acquisition stays within 12 units of both the Runner and clicked point (capped by sight radius), releases rivals leaving that area, and ends in hold when the point is reached with no nearby rival. Idle automatic attacks also remain local instead of silently becoming pursuit orders. Explicit enemy locks pursue while legitimately visible; visibility loss still cancels pursuit.

This is a human policy/presentation change with unchanged core and combat rules. The immutable successor `000-vertical-slice-click-orders.json` records experiment/human policy 0.3.0 and evaluation encounter/0.3.0; prior definitions and evidence remain intact. Three added regression tests distinguish click targets, verify the ground leash versus explicit pursuit, and prove ground completion and local idle acquisition. The earlier 0.2.0 browser evidence above remains historical; this revision requires owner play review.
Verification: npm run check passed all 99 tests (27 handoff + 72 runtime/game), type checks, architecture boundaries and builds. Local output is runs/stage1-click-orders-check.log. The nine focused control tests passed, including an authoritative encounter replay. The local game server returned HTTP 200. This revision has not received a new manual browser playthrough.

## Stationary attack facing - 21 October 2026

The browser now orients a stationary Runner toward its current visible attack target on every observation, instead of retaining its last movement direction. The visor, weapon and direction marker rotate together. Movement/dash retain travel facing, and a confirmed pulse faces its own aim point. Missing, dead or coincident targets safely fall back to movement facing. This is presentation only: targeting, damage, cooldowns, authoritative facing and all experiment/policy identities remain unchanged. The helper reads only permitted observations and does not mutate them.

Three regression tests check all target directions and moving targets, movement/dash/pulse priority, and hidden/dead/cleared/coincident targets. Owner visual review remains required after refreshing the browser.
Verification: npm run check passed all 102 tests (27 handoff + 75 runtime/game), type checks, dependency boundaries and both builds. Local output: runs/stage1-facing-check.log. No new manual browser visual check is claimed; the local server was restarted for owner review.

## Compact battlefield HUD - 21 October 2026

Owner requested a clean battlefield and familiar Dota-style positioning. The minimap now sits bottom-left, Runner health/abilities share a compact bottom-centre console, and a reduced score bar stays top-centre. Utility actions are behind Menu at top-right; persistent instructions moved into Controls at bottom-right. The diagnostic frame-rate label is hidden from the play surface but export timing diagnostics remain available. Menu summaries and buttons retain normal Space activation. No simulation, policy, map, observation or experiment semantics change.

Reference: Valve's official HUD overview, https://www.dota2.com/700/hud/ , emphasises smaller top/hero panels and more terrain visibility. Original GRID-RIFT visuals and existing controls are retained; no Dota assets, shop or unused systems are added.

Browser review at 1280 x 720 confirmed bottom-left map, centred hero panel, no panel overlap, readable abilities, expandable menu/help and working Pause. New local evidence: runs/stage1-hud/hud.png. Broader viewport and hardware acceptance remain open.
Verification: npm run check passed all 102 tests (27 handoff + 75 runtime/game), type checks, boundaries and both builds. Browser checks additionally confirmed Space opens Menu, utility buttons remain labelled and functional, and the console/map rectangles do not overlap. Browser error/warning log was empty. Full output: runs/stage1-hud-check.log.

## Pause and menu usability - 21 October 2026

Pausing now shows a prominent centred Resume encounter button with a dimmed battlefield behind it. It appears for manual and automatic pauses, stays absent before starting/after completion, and clears on resume/restart. Manual pause focuses the Resume button; clicking it restores battlefield keyboard focus. Camera grip/peek keys clear on pause. Menus close on outside pointer clicks, menu actions and state changes; Escape dismisses an open menu before toggling pause. The Controls panel shares the outside-click behavior. Simulation commands, timing rules and experiment identities remain unchanged.

Actual browser review confirmed centered Resume visibility/focus, one-click resume, menu opening, outside-click close and close after choosing Pause. Local screenshot evidence: runs/stage1-pause/paused.png. Owner review remains open.
Verification: npm run check passed all 102 tests (27 handoff + 75 runtime/game), type checks, dependency boundaries and both builds. Actual browser checks also confirmed Escape dismisses the menu while remaining paused, a second Escape resumes, and the focused Resume button retains its bright background. Browser warning/error log was empty. Full output: runs/stage1-pause-check.log.
