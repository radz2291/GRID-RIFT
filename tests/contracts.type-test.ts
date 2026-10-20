import type { ActionIntent, ActionProposal, AgentPolicy, Observation, PolicyDecision } from "../contracts/agent-interface.js";
import type { TerminalResult } from "../contracts/simulation-interface.js";

const move: ActionIntent<"movement.move-to", { x: number; z: number }> = {
  kind: "movement.move-to", version: "0.1.0", payload: { x: 4, z: 6 },
};
const proposal: ActionProposal = { actorId: "body-p1", sequence: 1, observedTick: 10, executeTick: 14, action: move };
const decision: PolicyDecision = { actions: [proposal], nextMemory: { chosenRoute: "ridge" } };
const policy: AgentPolicy = {
  identity: { id: "test.idle", version: "0.1.0", determinism: "local-replayable" },
  initialMemory: (seed) => ({ seed }),
  decide: (context) => ({ actions: [], nextMemory: context.memory }),
};
const outcome: TerminalResult = { kind: "finished", tick: 90, winners: ["alpha"], reason: "zone-score", scores: { alpha: 10 } };
void decision; void policy; void outcome;

function boundaryAssertions(observation: Observation) {
  // @ts-expect-error Observations cannot be mutated through the declared boundary.
  observation.tick = 20;
  // @ts-expect-error No privileged simulation/store handle is exposed.
  observation.simulation.step([]);
  // @ts-expect-error This handoff's contract compilation deliberately has no DOM library.
  document.querySelector("canvas");
}
void boundaryAssertions;
