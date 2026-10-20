import type { AgentPolicy, JsonValue } from '../../contracts/agent-interface.js';

function decisions(memory: JsonValue): number {
  if (memory !== null && typeof memory === 'object' && !Array.isArray(memory)) {
    const count = (memory as { readonly [key: string]: JsonValue }).decisions;
    if (typeof count === 'number' && Number.isSafeInteger(count) && count >= 0) return count;
  }
  return 0;
}

export const idlePolicy: AgentPolicy = {
  identity: { id: 'baseline.idle', version: '0.1.0', determinism: 'local-replayable' },
  initialMemory: (_seed) => ({ decisions: 0 }),
  decide: ({ memory }) => ({ actions: [], nextMemory: { decisions: decisions(memory) + 1 }, reasonTags: ['idle'] }),
};

/** Scores three legal-sized moves using only the public goal and assigned visible bodies. */
export const stepPolicy: AgentPolicy = {
  identity: { id: 'baseline.step', version: '0.1.0', determinism: 'local-replayable' },
  initialMemory: (_seed) => ({ decisions: 0 }),
  decide({ observation, memory, budget, earliestExecuteTick, nextSequence }) {
    const fixture = observation.world['fixture.race'];
    const goal = fixture !== null && typeof fixture === 'object' && !Array.isArray(fixture)
      ? (fixture as { readonly [key: string]: JsonValue }).goal : undefined;
    const capability = observation.capabilities.find(c => c.kind === 'fixture.move' && c.version === '0.1.0');
    const actions = [];
    if (typeof goal === 'number' && capability) {
      for (const actorId of [...observation.controlledEntityIds].sort()) {
        if (actions.length >= budget.actionLimitPerTick) break;
        const position = observation.entities.find(entity => entity.id === actorId)?.components.position;
        if (typeof position !== 'number') continue;
        // Prefer waiting on equal scores. Every choice comes from this permitted observation.
        const options = [0, 1, -1].map(delta => ({ delta, score: -Math.abs(goal - position - delta) }));
        options.sort((a, b) => b.score - a.score);
        actions.push({
          actorId, sequence: nextSequence + actions.length, observedTick: observation.tick,
          executeTick: earliestExecuteTick,
          action: { kind: capability.kind, version: capability.version, payload: { delta: options[0]!.delta } },
        });
      }
    }
    return { actions, nextMemory: { decisions: decisions(memory) + 1 }, reasonTags: ['goal-distance'] };
  },
};
