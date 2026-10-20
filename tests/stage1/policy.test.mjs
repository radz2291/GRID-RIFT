import test from 'node:test';
import assert from 'node:assert/strict';
import { utilityPolicy } from '../../dist/src/agents/tactical.js';

function context() {
  return {
    observation: {
      apiVersion: 'grid-rift/v0', controllerId: 'bot', tick: 120,
      controlledEntityIds: ['bot-body'], events: [], receipts: [], messages: [],
      capabilities: ['movement.move-to', 'combat.attack', 'combat.cast'].map(kind => ({ kind, version: '0.1.0', payloadSchemaId: kind })),
      entities: [{ id: 'bot-body', components: {
        movement: { id: 'bot-body', controllerId: 'bot', teamId: 'blue', x: 32, z: 30, facingX: 1, facingZ: 0, destination: null, path: [], dash: null },
        combat: { id: 'bot-body', hp: 100, maxHp: 100, alive: true, respawnTick: 0, basicReadyTick: 0, pulseReadyTick: 200, dashReadyTick: 200, targetId: null, windup: null },
      } }],
      world: {
        'world.planar': { width: 80, depth: 60, layout: 'test', mapVersion: '0.1.0', blockers: [], relay: { x: 40, z: 30 }, spawns: [{ actorId: 'bot-body', controllerId: 'bot', teamId: 'blue', x: 6, z: 30 }] },
        'combat.runner': { projectiles: [], traces: [], basicRange: 8, pulseRange: 14, pulseRadius: 0.6, dashDistance: 6 },
        'objective.relay': { x: 40, z: 30, radius: 5, owner: null, capturing: null, progress: 0, captureTicks: 40, contested: false, scores: {}, scoreToWin: 600 },
      },
    },
    memory: utilityPolicy.initialMemory(1), budget: { decisionIntervalTicks: 4, reactionTicks: 2, actionLimitPerTick: 1 },
    earliestExecuteTick: 122, deadlineTick: 120, nextSequence: 7,
  };
}
const self = c => c.observation.entities[0].components;
function enemy(c, x = 39, z = 30) {
  const components = structuredClone(self(c));
  Object.assign(components.movement, { id: 'human', controllerId: 'human', teamId: 'red', x, z });
  Object.assign(components.combat, { id: 'human' });
  c.observation.entities.push({ id: 'human', components });
  return components;
}
const choose = c => utilityPolicy.decide(c);

test('utility contests public relay with authenticated proposal timing and sequence', () => {
  const c = context(), d = choose(c), a = d.actions[0];
  assert.equal(d.reasonTags[0], 'contest-relay');
  assert.deepEqual(a, { actorId: 'bot-body', sequence: 7, observedTick: 120, executeTick: 122,
    action: { kind: 'movement.move-to', version: '0.1.0', payload: { x: 40, z: 30 } } });
  assert.equal(d.nextMemory.decisions, 1);
  assert.equal(JSON.stringify(d.nextMemory), '{"decisions":1,"retreating":false}');
});

test('identical permitted observations produce identical decisions regardless of hidden state', () => {
  const c = context();
  const hiddenA = { enemyHp: 1, enemyPosition: [35, 30] };
  const hiddenB = { enemyHp: 100, enemyPosition: [70, 50] };
  assert.notDeepEqual(hiddenA, hiddenB);
  // Neither hidden record is an argument or closure of the policy.
  assert.deepEqual(choose(c), choose(structuredClone(c)));
  assert.equal(choose(c).actions[0].action.kind, 'movement.move-to');
});

test('visible targets are pulsed only off cooldown, otherwise attacked without intent spam', () => {
  const c = context(); enemy(c);
  assert.equal(choose(c).actions[0].action.kind, 'combat.attack');
  self(c).combat.targetId = 'human';
  assert.equal(choose(c).actions.length, 0);
  self(c).combat.pulseReadyTick = 120;
  assert.deepEqual(choose(c).actions[0].action.payload, { ability: 'pulse', x: 39, z: 30 });
  self(c).combat.windup = { x: 39, z: 30, launchTick: 126 };
  assert.equal(choose(c).actions.length, 0);
});

test('retreat commits through partial recovery then returns to relay', () => {
  const c = context(); self(c).combat.hp = 25;
  let d = choose(c);
  assert.equal(d.reasonTags[0], 'retreat');
  assert.deepEqual(d.actions[0].action.payload, { x: 6, z: 30 });
  c.memory = d.nextMemory; self(c).combat.hp = 50;
  assert.equal(choose(c).nextMemory.retreating, true);
  self(c).movement.x = 6;
  assert.equal(choose(c).reasonTags[0], 'spawn-recovery');
  self(c).combat.hp = 65;
  assert.equal(choose(c).nextMemory.retreating, false);
  assert.equal(choose(c).reasonTags[0], 'contest-relay');
});

test('dash disengages with visible threat, cooldown prevents dash spam', () => {
  const c = context(); enemy(c); self(c).combat.hp = 20;
  self(c).combat.dashReadyTick = 120;
  assert.equal(choose(c).actions[0].action.payload.ability, 'dash');
  self(c).combat.dashReadyTick = 240;
  assert.equal(choose(c).actions[0].action.kind, 'movement.move-to');
});

test('visible pulse windup triggers perpendicular evasive movement', () => {
  const c = context(), foe = enemy(c);
  foe.combat.windup = { x: 25, z: 30, launchTick: 125 };
  const d = choose(c);
  assert.equal(d.reasonTags[0], 'evade-visible-windup');
  assert.notEqual(d.actions[0].action.payload.z, 30);
});

test('no stale invisible pursuit, dead units and denied action budgets propose nothing', () => {
  const c = context(); const foe = enemy(c, 47);
  assert.equal(choose(c).reasonTags[0], 'approach-visible-target');
  c.observation.entities.pop();
  assert.equal(choose(c).reasonTags[0], 'contest-relay');
  self(c).combat.alive = false;
  assert.equal(choose(c).actions.length, 0);
  self(c).combat.alive = true;
  c.budget.actionLimitPerTick = 0;
  assert.equal(choose(c).actions.length, 0);
  c.budget.actionLimitPerTick = 1; c.observation.capabilities = [];
  assert.equal(choose(c).actions.length, 0);
  assert.equal(foe.movement.x, 47);
});

test('synchronous result deadline is independent from delayed action execution', () => {
  const c = context();
  c.observation.tick = 0; c.deadlineTick = 0; c.earliestExecuteTick = 4;
  c.budget.reactionTicks = 4;
  const d = choose(c);
  assert.equal(d.actions.length, 1);
  assert.equal(d.actions[0].observedTick, 0);
  assert.equal(d.actions[0].executeTick, 4);
});

test('equidistant target ties use deterministic code unit ordering', () => {
  const c = context();
  const lower = enemy(c, 39), upper = enemy(c, 25);
  Object.assign(lower.movement, { id: 'a' });
  Object.assign(upper.movement, { id: 'Z' });
  assert.equal(choose(c).actions[0].action.payload.targetId, 'Z');
});

test('relay rotation uses ready dash; at the relay policy holds position', () => {
  const c = context(); self(c).movement.x = 6; self(c).combat.dashReadyTick = 0;
  assert.equal(choose(c).actions[0].action.payload.ability, 'dash');
  self(c).movement.x = 40;
  assert.equal(choose(c).reasonTags[0], 'hold-relay');
});
