# 02 · Design principles

These principles remain stable while individual experiments change.

## Meaningful choices

Every major mechanic needs a trade-off. A dash can close distance or preserve an escape. A scan can reduce uncertainty but costs a resource or exposes its user. A stronger attack may require preparation. Reject mechanics that add bookkeeping without changing a decision.

For a proposed feature, write: the choice it creates; the information available; the cost; the counterplay; the observable result; and how it might distort evaluation. Remove it when no useful answer exists.

## Fairness is explicit

Human and AI actions share the same rules and authoritative checks. Policies see only permitted observations. Reaction intervals, action budgets, memory, and team communication are experiment settings. Equal rules do not automatically mean equal motor skill or equal information processing. Record differences instead of pretending they do not exist.

Do not make a harder bot by secretly increasing damage, revealing fogged enemies, predicting unreleased input, or modifying the random seed mid-match. An asymmetric experiment is allowed only when clearly declared and separately reported.

## Small content, rich interaction

Use few units and abilities with meaningful interactions before increasing variety. Prefer two useful routes over a huge empty map. Preserve an understandable early decision, a changing situation, and a clear ending even in the first slice.

## Replaceability with proof

Modules are replaceable when a test demonstrates the replacement, not because a diagram contains boxes. Change victory rules without altering movement. Swap a controller without rebuilding its body. Run without the renderer. Replace team sizes without a global constant patch.

Keep the initial runtime a modular single process. A large plugin framework, service mesh, training farm, or distributed simulation is outside the initial scope. Make boundaries simple enough to inspect.

## Traceable truth

The simulation owns outcomes. The runner owns scheduling and external delivery. The policy owns its declared memory. Presentation owns appearance. Evaluation owns derived reports. Truthful ownership matters more than fashionable architecture names.

A rendered animation is not the damage clock. A policy's explanation is not guaranteed to be its causal reasoning. A last-seen enemy is not a live enemy position. A reproducible action replay is not necessarily reproducible inference from a hosted model.

## Change without erasing learning

Freeze versions used for comparison. A radical new scenario becomes a new specification or version. Old runs retain their original manifests and checksums. Break compatibility explicitly rather than silently reinterpreting a saved command.

## Human participation and data

Use local, pseudonymous session identifiers. Do not infer personal identity, diagnosis, or general intelligence from play. Do not collect biometric, webcam, microphone, or personal-background data. Explain recording before sharing a build with others and provide an explicit export action. Do not hide telemetry in a public demo.

## Flexible versus foundational

Foundational: simulation separation, permitted observations, explicit state, versioned experiments, readable outdoor starting identity, and evidence-based claims.

Flexible: map layout, team count, camera details, tick rate, hero kits, items, policy algorithms, match duration, objectives, and evaluation tasks. Changing a flexible choice can still require a contract revision; use the change protocol rather than assuming every change is free.
