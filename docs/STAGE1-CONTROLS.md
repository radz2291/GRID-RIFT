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
