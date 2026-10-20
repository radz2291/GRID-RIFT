# 11 · Change protocol

## Before a change

Describe the desired difference in one plain sentence. Classify it as a content/configuration change, a module change, a policy change, a presentation change, an evaluation change, or a core/API change. Name affected files, run compatibility, and the test that will demonstrate success.

Do not assume a radical creative change is automatically a radical engine change. First ask whether an existing boundary can carry it. Conversely, do not force an incompatible concept into a generic payload to avoid acknowledging a core change.

## Change matrix

| Change | Usual owner | Required protection |
| --- | --- | --- |
| Damage, cooldown, map size, participant count | Experiment/content | New content identity and validation |
| New action or capture rule | Gameplay module | Versioned schema plus action/interaction tests |
| New controller or planning method | Policy/runner adapter | Observation, timing, memory, and fallback tests |
| Palette, camera, animation | Presentation | World-hash independence and readability check |
| Meaning of a reported metric | Evaluation | New metric version and recomputation note |
| Tick semantics, state layout, command protocol | Core/contracts | Decision record, migration or explicit break, replay tests |

## Procedure

Preserve the baseline. Create a focused branch or new experiment version. Write a failing regression or new acceptance test. Implement the smallest coherent change. Run relevant local tests plus the unchanged baseline. Update contracts/configurations/docs together. Commit with the change's purpose. Show actual evidence and state whether owner review is needed.

Published experiment versions and completed run manifests are immutable. Drafts may be refined before use, but once an experiment is used for comparison, mint a new version and preserve the old identity. Do not relabel a different configuration as the old result.

## Decision record template

Use `docs/decisions/NNNN-short-name.md` when a choice affects a shared boundary:

```text
Title and date
Status: proposed / accepted / superseded
Problem, in plain language
Decision
Alternatives considered
Trade-offs and risks
Affected contracts and experiments
Compatibility and migration
Test/evidence that supports the decision
Conditions that would cause reconsideration
Supersedes / superseded by
```

A decision record is not a permission slip for unnecessary complexity. A reversible local helper function usually needs a comment and tests, not a lengthy document.

## Example: remove teams and combat

Do not patch a global TEAM_COUNT or give every unit fake health because the UI expects it. Supply three independent ownership groups, omit combat modules, expose zone state through the same observation envelope, and allow the UI to render only available components. The termination module reports generic ranked/draw outcomes. The older combat experiment must still work.

If a true no-team ownership model is needed later, update the team/affiliation boundary explicitly. The initial control-field uses one team per participant to keep the first change test bounded; it does not prove all social structures are already supported.

## Recovery

On incompatible data, stop with a useful error rather than guessing. On a branch conflict, inspect the new head before retrying. On failed tests, report the failure and preserve evidence. Never force-push or delete historical runs merely to make the status look clean.
