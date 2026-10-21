# Codex: start here

Read [AGENTS.md](AGENTS.md), [current status](docs/STATUS.md), [current design](docs/CURRENT-DESIGN.md), [current handoff](CURRENT_CODEX_HANDOFF.md), [roadmap](docs/10-DEVELOPMENT-ROADMAP.md), and [development cycle](docs/DEVELOPMENT-CYCLE.md), in that order. Then read architecture, simulation contracts, agent intelligence, gameplay, and the code relevant to your stage.

The repository includes a working Stage 0 runtime and owner-approved Stage 1 browser encounter. Do not restart them. The relay duel is a retained regression scenario, not the new product's primary loop. Stage 2 completion is not verified on the inspected remote refs; reconcile any later implementation before integration.

Current direction: hero-led autonomous warfare. Directly control a hero; issue high-level intentions to owned autonomous units; fight alongside independent teammate heroes; invest in structured tactical construction and resources; threaten an enemy core. These new capabilities are targets, not claims about the existing build.

The owner requested a full development cycle on 21 October 2026. The local stage manager owns planning, implementation, independent verification, repair, re-verification, playable evaluation, evidence, and delivery. Follow the roadmap's automatic technical gates and explicit owner experience gates. Do not stop after a design package or ask the owner to relay routine repairs.

Start with repository reconciliation and Stage 3A. Run `npm ci` and `npm run check`. Preserve uncommitted work, the approved controls, published experiment identities and historical reports. Contract changes require an impact note, migration/version decision and tests before dependent implementation. Use local deterministic policies first; no required hosted inference.

For each completed gate report: exact candidate SHA, commands/results, playable walkthrough if applicable, limitations, verdict and next action. Never equate passing tests with owner approval. See [historical startup](docs/history/CODEX_START-v0.1.md) only for lineage.
