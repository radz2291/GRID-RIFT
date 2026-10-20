import type { JsonObject, VisibleEntity } from '../../contracts/agent-interface.js';
import type { RuntimeModule } from '../core/types.js';

/** Deliberately tiny Stage 0 proof. This is not the tactical game's movement model. */
export const raceModule: RuntimeModule = {
  descriptor: {
    id: 'fixture.race', version: '0.1.0', apiVersion: 'grid-rift/v0',
    dependencies: [], phase: 'resolve', reads: [], writes: ['fixture.race'],
    configurationSchemaId: 'fixture.race/config/0.1.0', stateSchemaId: 'fixture.race/state/0.1.0',
  },
  configSchema: {
    type: 'object', additionalProperties: false, required: ['goal', 'maxPosition', 'visibility'],
    properties: {
      goal: { type: 'integer', minimum: 1 },
      maxPosition: { type: 'integer', minimum: 1 },
      visibility: { type: 'integer', minimum: 0 },
    },
  },
  stateSchema: {
    type: 'object', additionalProperties: false,
    required: ['positions', 'secret', 'goal', 'maxPosition', 'visibility'],
    properties: {
      positions: { type: 'object', additionalProperties: { type: 'integer', minimum: 0 } },
      secret: { type: 'integer', minimum: 0 },
      goal: { type: 'integer', minimum: 1 },
      maxPosition: { type: 'integer', minimum: 1 },
      visibility: { type: 'integer', minimum: 0 },
    },
  },
  actions: [{
    capability: { kind: 'fixture.move', version: '0.1.0', payloadSchemaId: 'fixture.move/0.1.0' },
    schema: {
      type: 'object', additionalProperties: false, required: ['delta'],
      properties: { delta: { type: 'integer', minimum: -1, maximum: 1 } },
    },
  }],
  eventKinds: ['fixture.moved', 'fixture.terminal'],
  initial(config, context) {
    const positions: Record<string, number> = Object.create(null) as Record<string, number>;
    for (const controller of context.controllers) {
      for (const actor of controller.actors) positions[actor] = 0;
    }
    return {
      positions, secret: Math.floor(context.random('world') * 0x100000000),
      goal: config.goal!, maxPosition: config.maxPosition!, visibility: config.visibility!,
    };
  },
  validate(state, command, context) {
    const positions = state.positions as JsonObject;
    const delta = command.action.payload.delta;
    return command.action.kind === 'fixture.move' && command.action.version === '0.1.0'
      && Object.hasOwn(positions, command.actorId)
      && context.controllers.some(c => c.id === command.controllerId && c.actors.includes(command.actorId))
      && typeof delta === 'number' && Number.isInteger(delta) && delta >= -1 && delta <= 1;
  },
  advance(state, commands, _config, context) {
    const positions = { ...state.positions as Record<string, number> };
    const maxPosition = state.maxPosition as number;
    for (const command of commands) {
      if (command.action.kind !== 'fixture.move') continue;
      const before = positions[command.actorId]!;
      const after = Math.max(0, Math.min(maxPosition, before + (command.action.payload.delta as number)));
      positions[command.actorId] = after;
      context.emit('fixture.moved', { actorId: command.actorId, position: after },
        { kind: 'controllers', ids: [command.controllerId] });
    }
    const winners = Object.keys(positions).filter(id => positions[id]! >= (state.goal as number)).sort();
    const tick = context.tick + 1;
    if (winners.length > 1) {
      context.finish({ kind: 'draw', tick, reason: 'simultaneous-goal', scores: {} });
      context.emit('fixture.terminal', { outcome: 'draw', reason: 'simultaneous-goal' }, { kind: 'public' });
    } else if (winners.length === 1) {
      context.finish({ kind: 'finished', tick, winners, reason: 'goal', scores: {} });
      context.emit('fixture.terminal', { outcome: 'finished', winners, reason: 'goal' }, { kind: 'public' });
    } else if (tick >= context.maxTicks) {
      context.finish({ kind: 'draw', tick, reason: 'timeout', scores: {} });
      context.emit('fixture.terminal', { outcome: 'draw', reason: 'timeout' }, { kind: 'public' });
    }
    return { ...state, positions };
  },
  project(state, controllerId, context) {
    const assigned = context.controllers.find(c => c.id === controllerId)?.actors ?? [];
    const positions = state.positions as Record<string, number>;
    const entities: VisibleEntity[] = Object.keys(positions).sort()
      .filter(id => assigned.includes(id) || assigned.some(actor =>
        Math.abs(positions[id]! - positions[actor]!) <= (state.visibility as number)))
      .map(id => ({ id, components: { position: positions[id]! } }));
    return { world: { goal: state.goal!, maxPosition: state.maxPosition! }, entities };
  },
};
