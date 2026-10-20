import type { AgentPolicy, ActionIntent, DecisionContext, JsonValue, PolicyDecision } from '../../contracts/agent-interface.js';
import type { MovementBody, CombatUnit, Point, TacticalWorld } from '../../contracts/tactical-types.js';

interface Memory { decisions: number; retreating: boolean }
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);
function readMemory(value: JsonValue): Memory {
  const m = value as Partial<Memory> | null;
  return { decisions: typeof m?.decisions === 'number' ? m.decisions : 0, retreating: m?.retreating === true };
}

/** Transparent local utility baseline. Every input comes from the permitted observation. */
export const utilityPolicy: AgentPolicy = {
  identity: { id: 'baseline.utility', version: '0.1.0', determinism: 'local-replayable' },
  initialMemory: () => ({ decisions: 0, retreating: false }),
  decide(context: DecisionContext): PolicyDecision {
    const { observation: o } = context;
    const memory = readMemory(context.memory);
    memory.decisions++;
    const finish = (reason: string, action?: ActionIntent): PolicyDecision => ({
      // The result deadline concerns policy delivery; execution follows the separate reaction delay.
      actions: action && context.budget.actionLimitPerTick > 0
        && o.capabilities.some(c => c.kind === action.kind && c.version === action.version)
        ? [{ actorId: o.controlledEntityIds[0]!, sequence: context.nextSequence,
          observedTick: o.tick, executeTick: context.earliestExecuteTick, action }] : [],
      nextMemory: { ...memory }, reasonTags: [reason],
    });
    const own = o.entities.find(e => e.id === o.controlledEntityIds[0]);
    const body = own?.components.movement as unknown as MovementBody | undefined;
    const unit = own?.components.combat as unknown as CombatUnit | undefined;
    if (!body || !unit || !unit.alive) return finish('await-respawn');
    const world = o.world as unknown as TacticalWorld;
    const map = world['world.planar'];
    const rules = world['combat.runner'];
    if (!map || !rules) return finish('missing-public-map');
    const move = (to: Point, reason: string) => {
      if (body.destination && distance(body.destination, to) < 0.5) return finish(reason);
      return finish(reason, { kind: 'movement.move-to', version: '0.1.0', payload: { x: to.x, z: to.z } });
    };
    const cast = (ability: string, to: Point, reason: string) => finish(reason,
      { kind: 'combat.cast', version: '0.1.0', payload: { ability, x: to.x, z: to.z } });
    const enemies = o.entities.map(e => ({ body: e.components.movement as unknown as MovementBody,
      unit: e.components.combat as unknown as CombatUnit }))
      .filter(e => e.body && e.unit?.alive && e.body.teamId !== body.teamId)
      .sort((a, b) => distance(body, a.body) - distance(body, b.body)
        || (a.body.id < b.body.id ? -1 : a.body.id > b.body.id ? 1 : 0));

    // Hysteresis commits to recovery, rather than repeatedly crossing the danger threshold.
    if (unit.hp <= 30) memory.retreating = true;
    if (unit.hp >= 65) memory.retreating = false;
    const spawn = map.spawns.find(s => s.actorId === body.id);
    if (memory.retreating && spawn) {
      if (distance(body, spawn) <= 1) return finish('spawn-recovery');
      if (enemies.length && unit.dashReadyTick <= o.tick && !body.dash && !unit.windup)
        return cast('dash', spawn, 'disengage');
      return move(spawn, 'retreat');
    }

    // Visible shot tells permit an ordinary perpendicular sidestep. Hidden foes never enter this loop.
    for (const enemy of enemies) {
      const aim = enemy.unit.windup;
      if (!aim) continue;
      const dx = aim.x - enemy.body.x, dz = aim.z - enemy.body.z, length = Math.hypot(dx, dz);
      if (!length) continue;
      const along = ((body.x - enemy.body.x) * dx + (body.z - enemy.body.z) * dz) / length;
      const across = ((body.x - enemy.body.x) * -dz + (body.z - enemy.body.z) * dx) / length;
      if (along > 0 && along <= rules.pulseRange && Math.abs(across) < rules.pulseRadius + 1.2) {
        const sign = across < 0 ? -1 : 1;
        return move({ x: Math.max(1, Math.min(map.width - 1, body.x - dz / length * sign * 3)),
          z: Math.max(1, Math.min(map.depth - 1, body.z + dx / length * sign * 3)) }, 'evade-visible-windup');
      }
    }
    if (unit.windup || body.dash) return finish('committed-ability');
    const target = enemies[0];
    if (target) {
      const range = distance(body, target.body);
      if (range <= rules.pulseRange && unit.pulseReadyTick <= o.tick)
        return cast('pulse', target.body, 'pulse-visible-target');
      if (range <= rules.basicRange) {
        if (unit.targetId === target.body.id) return finish('maintain-attack');
        return finish('attack-visible-target', { kind: 'combat.attack', version: '0.1.0', payload: { targetId: target.body.id } });
      }
      // Approach to firing distance, leaving movement routing and wall collision authoritative.
      const fraction = Math.max(0, (range - rules.basicRange + 0.5) / range);
      return move({ x: body.x + (target.body.x - body.x) * fraction,
        z: body.z + (target.body.z - body.z) * fraction }, 'approach-visible-target');
    }
    const relay = world['objective.relay'] ?? map.relay;
    if (distance(body, relay) <= 2) return finish('hold-relay');
    if (distance(body, relay) > 16 && unit.dashReadyTick <= o.tick)
      return cast('dash', relay, 'rotate-to-relay');
    return move(relay, 'contest-relay');
  },
};
