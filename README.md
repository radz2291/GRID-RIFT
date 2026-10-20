# GRID-RIFT

An outdoor science-fiction tactical simulation with replaceable rules, readable combat, and repeatable experiments.

**Stage 1 playable encounter · 20 October 2026 · Ready for experience review.**

The first browser encounter is playable: one Runner against one local opponent in an outdoor arena with cover, line-of-sight, basic attacks, pulse shot, dash, relay capture, recovery, respawn, outcomes and restart. The simulation remains headless-capable. The later 3v3 and control-field scenarios remain specifications.

## Play locally

```sh
npm ci
npm run dev
```

Open [the local game](http://127.0.0.1:4173) and choose **Start encounter**. Keep the terminal running; Ctrl+C stops the server. The server listens only on your own computer. Desktop mouse and keyboard plus WebGL are required. There is no account, paid service, or automatic upload.

Click a visible rival once (left or right button) to chase and keep attacking. Right-click open ground to move; nearby rivals are attacked when you arrive. A then left-click ground engages nearby visible rivals around that point and stops when clear; A then click a rival locks pursuit onto that rival. S stops movement and automatic attacks. Q then left-click fires a pulse; W dashes toward the cursor. Ability bars refill until READY. Escape cancels targeting or pauses. Space centres the camera; wheel zooms. Shift + left-drag or middle-drag pans with a hand cursor. Hold Z / X to peek sideways or C for a higher angle; release to return to the default angle. Hold the relay uncontested to reach 600 points. Retreat to your marked spawn ring to recover health.

The battlefield is a prototype for testing controls, sight lines and combat, with provisional layout and art. See [the controls revision](docs/STAGE1-CONTROLS.md) for the Stage 1 feedback changes and verification.

`npm run build` produces the headless code in `dist/` and browser files in `web-dist/`. `npm run check` runs all checks. Use **Export run** during play, or **Export replay** on the end screen, to save a local record with screenshot and timing diagnostics. Replay it with `npm run replay:encounter -- <export.json>` from its matching source checkout. Reload the page after rebuilding; this small local server does not hot-reload a running encounter.

See [Stage 1 verification](docs/STAGE1-VERIFICATION.md) for evidence and limits. This is an initial playable prototype, not a balance or art-quality approval.

## Run Stage 0

```sh
npm ci
npm run check
npm run demo
npm run replay -- runs/<directory printed by demo>
```

The demo prints a local run directory. Replace the placeholder in the replay command with that directory, for example `runs/stage0-123456789`. It contains a resolved manifest, inputs, admissions, observations, events, per-tick hashes, a checkpoint, metrics, and a result report. Runs stay local and are ignored by Git. Replay refuses a different source build, runtime, dependency lock, or changed record. Keep the matching checkout to replay an older run.

See [Stage 0 verification](docs/STAGE0-VERIFICATION.md) for acceptance evidence, numeric scope, limitations, and the next bounded milestone.

## Start here

Read [CODEX_START.md](CODEX_START.md), then [AGENTS.md](AGENTS.md) and [current status](docs/STATUS.md). The original startup brief is retained as historical context. Stage 1 now awaits experience review before any Stage 2 expansion.

The first playable delivery is a small encounter with one human-controlled unit and one opponent. The later baseline is a 3v3, two-lane battlefield. A third specification removes lanes, towers, combat, and progression to test whether the architecture genuinely supports different rules.

## Check the handoff

Use a supported Node.js runtime meeting the minimum version of 22.12, and npm. The verified run used Node.js 22.23.3. Dependency versions and integrity data are recorded in `package-lock.json`.

```sh
npm ci
npm run check
```

`check` validates documents and experiments, retains the 25 handoff regression tests, type-checks source and browser adapters separately, enforces dependency boundaries, builds both outputs, and runs Stage 0 and Stage 1 tests. GitHub Actions runs the same command. [The original handoff record](docs/VERIFICATION.md) remains historical evidence.

## Document map

| Read | Purpose |
| --- | --- |
| [Vision](docs/01-VISION.md) | Product purpose, experience, and scope |
| [Principles](docs/02-DESIGN-PRINCIPLES.md) | Boundaries that survive game redesigns |
| [Architecture](docs/03-SYSTEM-ARCHITECTURE.md) | Ownership, dependencies, and replacement seams |
| [Simulation contract](docs/04-SIMULATION-CONTRACT.md) | Time, commands, ordering, snapshots, replay |
| [Agent intelligence](docs/05-AGENT-INTELLIGENCE.md) | Fair observations, policy changes, reaction budgets |
| [Gameplay](docs/06-GAMEPLAY-SYSTEMS.md) | Concrete first playable and later baseline |
| [World and visuals](docs/07-WORLD-AND-VISUAL-DIRECTION.md) | Open-air technological wilderness and readability |
| [Experiments](docs/08-EXPERIMENT-FRAMEWORK.md) | Versioning, validation, paired comparisons |
| [Evaluation](docs/09-EVALUATION-METRICS.md) | Operational measures and limits on interpretation |
| [Roadmap](docs/10-DEVELOPMENT-ROADMAP.md) | Work order and evidence-based acceptance gates |
| [Change protocol](docs/11-CHANGE-PROTOCOL.md) | Safe radical changes and decision records |
| [Initial decision](docs/decisions/0001-simulation-first.md) | Architecture rationale and reconsideration criteria |
| [Status](docs/STATUS.md) | What exists, what is proposed, what is untested |
| [References](docs/REFERENCES.md) | Primary technical references and verification notes |

`contracts/` holds shared boundaries and module-specific tactical view types. `fixtures/stage0.json` still selects the Stage 0 proof. The game composes the six implemented modules selected by `000-vertical-slice`; the isolated Stage 0 CLI retains its smaller registry. Handoff, Stage 0 and Stage 1 tests remain separate.

## Non-negotiable separation

Simulation owns truth. Controllers request actions. The renderer displays permitted state. Evaluation observes without changing outcomes. An experiment chooses modules and rules. No layer may quietly perform another layer's job.

Start small. Preserve evidence. Make major changes cheap without building a universal engine first.

## Data and assets

Runs should remain local unless an export is explicitly requested. Do not commit personal play logs, credentials, provider keys, third-party proprietary assets, or copied game content. The visual direction is original science fiction; no affiliation with another game or film is implied. No project license has been selected by the owner.
