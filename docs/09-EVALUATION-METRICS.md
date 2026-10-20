# 09 · Evaluation metrics

## Interpretation boundary

Measure observable performance in declared tasks. Do not issue an IQ score, diagnosis, overall human ranking, or claim of general intelligence. A tactical simulation samples a limited set of behaviours under an interface, rules, information, and timing budget.

Metrics are proposed operational definitions until their instrumentation and reliability are tested. Winning is useful but insufficient. A policy's reason tag is an optional self-report, not a ground-truth explanation of its thinking.

## Initial measurement table

| Measure | Operational definition | Main caution |
| --- | --- | --- |
| Outcome | Terminal result, duration, scenario score, and declared tiebreak reason | Depends on opponents and starting conditions |
| Response latency | Ticks from a newly permitted visible cue to the first qualifying admitted response | Define cue and response in advance; separate observation, submission, execution, and outcome |
| Objective trade-off | Change in objective score, position, and resource expenditure during a declared contest window | No single ideal action without a task-specific comparator |
| Risk exposure | Time within a defined visible threat region, accompanied by health/resource change | Exposure may be rational sacrifice, not an error |
| Adaptation | Change in task score after a declared scenario change compared with a frozen-policy control | Separate learning from chance and familiarity |
| Recovery | Time and score change after a standardised setback | The setback must be comparable and disclosed in the experiment |
| Coordination | Time-aligned actions around a shared objective and response to permitted team signals | Shared success alone does not prove causal cooperation |
| Information use | Outcome and route choice with versus without a declared information source | Hold other conditions fixed; hidden truth remains evaluator-only |
| Interface quality | Missed input, rejected commands by reason, frame/input delay, path failure, and control errors | Interface failure can imitate poor decisions |

Do not compress these into a universal weighted intelligence score. A later composite needs a stated purpose, weight rationale, validation, and sensitivity analysis.

## Events required

Instrument observation delivery tick, visible cue identity, controller ID, observed tick, proposal receipt tick, scheduled execution tick, admission/rejection, relevant domain effects, objective transitions, and termination. Use bounded structured fields. State clearly which fields are evaluator-only and which were visible to the participant.

A reaction measure is meaningful only when the cue was actually delivered to the controller. For humans, simulation observation time is not the same as screen presentation or perception time. Record render/input timestamps in a separate diagnostic clock domain and avoid pretending to infer unobserved mental latency.

## Minimal comparison protocol

First establish deterministic local-policy repeatability. Then compare the same policies across paired seeds and switched sides. Record success/failure counts and per-run distributions. Use a held-out scenario set for claims about transfer. Report confidence or uncertainty using an explicitly chosen method; do not announce significance from a single match.

Pilot results are descriptive. A human study would require a separate consent, privacy, sampling, and validation plan. The current project is not a validated assessment instrument.

## Behavioural-state experiments

To test an agent variable such as threat sensitivity, define its inputs, update rule, bounded range, decay, and expected behavioural effect. Compare with an otherwise identical fixed-variable policy. Report the observed effect, not a claim that the agent felt an emotion or that a human player has a stable personality trait.

## Anti-shortcut checks

Test for hidden-state leaks, stronger-than-declared actions, map/spawn bias, reward exploitation, scenario memorisation, evaluator feedback leakage, and incomplete-run filtering. Keep a policy's training reward separate from the held-out evaluation measures. A score is not convincing when the policy can manipulate its measurement channel.

## Acceptance

Metrics reproduce from the same finalized event stream. Disabling evaluation leaves simulation hashes unchanged. Unknown or unavailable measures remain null with a reason, not misleading zeros. Reports include experiment version/hash, policy versions, runtime conditions, run count, and interpretation limits.
