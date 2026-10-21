# 05 · Agent intelligence

## Start with an honest baseline

Existing idle, scored-step and tactical policies provide the starting baselines. Retain a transparent local policy that selects from scored options. A scored-options policy might compare retreat, contest, engage, and reposition using only its observation. This is ordinary scripted decision logic, not a learned mind. It is useful both as an opponent and as a reference for later policies.

Do not make training or a language model a prerequisite for playable interaction. A competent local baseline reveals whether the world supports meaningful decisions before more costly intelligence is added.

## Observation

Supply assigned entity state, currently visible entities, known static map information, visible objective state, allowed team messages, relevant public events, permitted action definitions, and visible receipts. Unknown fields remain absent or explicitly unknown, never fabricated zeros that leak true state.

Last-seen information belongs to the participant's recorded memory and carries its observation tick. It must not update while hidden. Distance checks, sounds, target hints, minimaps, and team communication follow the same visibility contract.

Internal omniscient evaluation can inspect a completed run. It must not feed a live policy through scores, logs, error text, function closures, global variables, or a debugging endpoint.

## Actions

The policy returns proposed actions and serializable next memory through `contracts/agent-interface.ts`. It cannot write world state. Core may reject an action even if the policy believed it was possible. Commands are intents, not guaranteed outcomes.

Payloads belong to registered action schemas. Initial examples are `movement.move-to`, `combat.attack`, `combat.cast`, `objective.interact`, and `core.wait`. The base interface is not a hardcoded QWER hero controller. A future social or multi-body experiment must add versioned capabilities without rewriting unrelated adapters.

## Timing and challenge

Every policy declares observation cadence, minimum reaction delay, action cap, memory reset behaviour, and deadline policy. The runner enforces them. Baseline AI must not inspect the opponent's current input or receive later state before choosing from a tick's shared snapshot.

Difficulty may vary the quality of option scoring, commitment, planning horizon, or declared memory. Speed and information advantages must be labelled as different conditions. A victory against a slower controller is not evidence of superior strategic reasoning.

## Team behaviour

Start with limited, structured messages such as defend, contest, and retreat. Messages consume the declared communication channel, have delivery timing, and carry only information the sender was allowed to know. Do not implement coordination through a shared omniscient blackboard.

Shared team vision is an explicit perception setting. Independent controller memories still need explicit handoff or reset rules when controllers are replaced.

## Adaptive and behavioural variants

Later add a policy that changes an observable parameter based on accumulated permitted evidence, for example reducing pursuit after repeatedly encountering an ambush. Log the parameter change and compare with a frozen-policy control.

Aggression, confidence, threat sensitivity, or hesitation can be modelled as bounded behavioural variables. Define their update rules, action effects, decay, and reset conditions. Calling a variable fear does not prove felt emotion, and adding randomness does not prove a human-like opponent.

A planning or language-model adapter may propose high-level plans at a slower cadence while a local controller handles movement. It must run outside core, use allowlisted tool-free observations, have bounded cost and time, and fall back safely. Never embed credentials in the browser. Do not store hidden chain-of-thought; record concise optional policy-supplied reason tags and observable decisions, clearly marked as self-reports.

## Evaluation controls

Compare policies on paired seeds and switched starting sides. Hold the body, mechanics, information, and declared budgets fixed where possible. Report training and evaluation scenario separation. State whether adaptation occurs inside one match, across matches, or only during offline training.

Existing tests demonstrate scoped runtime guarantees; autonomous command is the next experiment, not an already implemented or human-equivalent intelligence.

## Intent-driven subordinate policies

Separate strategic intent, goal selection, tactical planning and reactive execution. A utility policy with explicit commitment/memory is an adequate initial implementation; do not mandate utility + planner + behaviour tree when a smaller policy demonstrates the required decisions. Preserve replaceability.

An order may request defend, secure or follow with a target, risk constraint, priority and lifetime. Unit decisions must depend on observations/capabilities, not fixed scout/guard/capture scripts. Explain visible state through bounded status/reason codes: holding, repositioning, threat observed, withdrawing, blocked, complete or expired. Reports use only permitted information and declared message timing.

Test the same intention with a changed visible threat, blocked route and loss of contact. Compare a second policy on identical body statistics and budgets. A retreat is not automatically a failure: assess goal progress, survival cost, available information and alternatives. Never grade obedience to an imagined click sequence as intelligence.
