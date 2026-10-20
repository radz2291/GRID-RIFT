# GRID-RIFT

An outdoor science-fiction tactical simulation with replaceable rules, readable combat, and repeatable experiments.

**Handoff v0.1.0 · 20 October 2026 · Implementation has not started.**

This repository contains a development handoff, TypeScript boundary contracts, validated experiment specifications, and automated handoff checks. It does **not** yet contain a game, simulation engine, working bots, trained models, or a browser preview. Passing the handoff checks does not mean the simulation works.

## Start here

Read [CODEX_START.md](CODEX_START.md), then [AGENTS.md](AGENTS.md). Begin with **Stage 0: prove the simulation boundaries**, not the full MOBA.

The first playable delivery is a small encounter with one human-controlled unit and one opponent. The later baseline is a 3v3, two-lane battlefield. A third specification removes lanes, towers, combat, and progression to test whether the architecture genuinely supports different rules.

## Check the handoff

Use a supported Node.js runtime meeting the minimum version of 22.12, and npm. The verified run used Node.js 22.23.3. Dependency versions and integrity data are recorded in `package-lock.json`.

```sh
npm ci
npm run check
```

`check` validates documents and experiments, runs 25 handoff regression tests, and type-checks the interfaces. GitHub Actions runs the same checks on pushes and pull requests. See [the verification record](docs/VERIFICATION.md) for actual results and limits. There is deliberately no `dev` command until Codex implements a browser client.

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

`contracts/` holds machine-readable and TypeScript boundaries. `experiments/` holds specifications, not executable modules. `scripts/` and `tests/` check the handoff itself.

## Non-negotiable separation

Simulation owns truth. Controllers request actions. The renderer displays permitted state. Evaluation observes without changing outcomes. An experiment chooses modules and rules. No layer may quietly perform another layer's job.

Start small. Preserve evidence. Make major changes cheap without building a universal engine first.

## Data and assets

Runs should remain local unless an export is explicitly requested. Do not commit personal play logs, credentials, provider keys, third-party proprietary assets, or copied game content. The visual direction is original science fiction; no affiliation with another game or film is implied. No project license has been selected by the owner.
