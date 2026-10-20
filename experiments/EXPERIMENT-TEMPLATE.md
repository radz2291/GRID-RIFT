# Experiment proposal template

Copy an existing JSON file as a starting point. Do not treat this Markdown template as loadable configuration.

## Identity

Experiment ID, version, owner, date, draft/frozen status, parent experiment or decision record, and intended implementation stage.

## Question

What observable decision or behaviour is this scenario meant to expose? Phrase it narrowly. What would count against the expectation? Do not claim that a single task measures a whole person or general intelligence.

## Scenario

World layout and size; participants and control assignments; affiliations; perception and shared knowledge; action repertoire; resources; conflicts; objectives; terminal result and tie rules; maximum duration. Explain what is different from the baseline.

## Meaningful choice

Give one concrete example: what the participant sees, two viable choices, the cost of each, the uncertainty, and a result we can observe. Include a counterplay opportunity.

## Controller conditions

Policy IDs/versions, human input adapter, observation cadence, reaction delay, action cap, memory/reset rules, permitted communication, external inference budget if applicable, late-result policy, and information parity caveats.

## Modules and versions

List existing modules, new or revised modules, configuration schemas, dependencies, runtime implementation status, and any proposed core/API change. Do not add arbitrary executable paths to JSON.

## Evaluation

Metrics with operational definitions, event requirements, paired seeds, side swaps, held-out conditions, inclusion of invalid/interrupted runs, limitations, and expected confounds. Explain any intervention or asymmetric advantage.

## Acceptance and rollback

Tests required; expected failure conditions; baseline regression checks; owner-visible review evidence; run/export commands once implemented; compatibility with older runs; rollback path.

## Data

What is recorded, local storage location, retention/export behaviour, disclosure to human participants, and fields intentionally excluded. No automatic personal profiling or remote data collection.

## Checklist

- New ID/version and exact resolved content hash are planned.
- JSON and module-specific configuration validation pass.
- Runtime module availability is verified separately.
- No hidden information or rule advantage has slipped into policies.
- Termination and ties are defined.
- Relevant earlier experiments still work, or the break is explicit.
- Results will be reported with limits rather than an invented universal score.
