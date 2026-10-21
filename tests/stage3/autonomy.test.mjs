import test from 'node:test';
import assert from 'node:assert/strict';
import {Engine} from '../../dist/src/core/engine.js';
import {Runner} from '../../dist/src/runner/runner.js';
import {autonomousConfig,autonomousPolicies} from '../../dist/src/game/autonomous.js';
import {autonomousModules} from '../../dist/src/modules/autonomy.js';
function engine(variant='crossing'){const cfg=autonomousConfig(variant);cfg.modules.find(m=>m.id==='objective.relay').config={};return new Engine(cfg,autonomousModules);}
const state=e=>e.snapshot().moduleStates['command.owned'];
function edit(e,fn){const s=e.snapshot();fn(s.moduleStates);e.restore(s);}
function cmd(e,kind,payload,id='p1',sequence=e.tick){return {controllerId:id,actorId:`body-${id}`,receivedTick:e.tick,observedTick:e.tick,executeTick:e.tick+(id==='a1'?2:0),sequence,action:{kind,version:'0.1.0',payload}};}
const order=(e,revision=1,extra={})=>cmd(e,'command.order',{unitId:'body-a1',generation:0,orderId:'intent',revision,kind:'defend',target:{x:40,z:30},risk:'balanced',expiresTick:100,...extra});
const step=(e,n)=>{for(let i=0;i<n;i++)e.step([]);};

test('four actors, strict authored variants, separate registry and startup grants',()=>{
  for(const variant of ['crossing','blocked-route','flank']){const e=engine(variant);assert.equal(e.snapshot().moduleStates['movement.planar'].bodies.length,4);assert.equal(e.observe('p1').world['world.planar'].layout,'autonomous-crossing');}
  const cfg=engine().config;
  for(const mutation of [g=>g.push(g[0]),g=>g[0].unitId='unknown',g=>g[0].unitControllerId='p1',g=>g[0].commanderId='p2']){const bad=structuredClone(cfg);mutation(bad.modules.find(m=>m.id==='command.owned').config.grants);assert.throws(()=>new Engine(bad,autonomousModules),/grant/i);}
  const bad=structuredClone(cfg);bad.modules.find(m=>m.id==='command.owned').config.omniscient=true;assert.throws(()=>new Engine(bad,autonomousModules),/Invalid config/);
});
test('order delivers after two ticks; replacement suppresses older delivery; cancel tombstones',()=>{
  const e=engine();e.step([order(e)]);assert.equal(e.observe('a1').world['command.owned'].orders.length,0);
  e.step([order(e,2,{target:{x:45,z:30}})]);
  assert.equal(e.tick,2);assert.equal(e.observe('a1').world['command.owned'].orders.length,0);e.step([]);
  assert.equal(e.tick,3);
  assert.equal(e.observe('a1').world['command.owned'].orders[0].revision,2);
  e.step([order(e,3,{kind:'cancel',target:undefined,risk:undefined,expiresTick:undefined})].map(c=>{for(const k of Object.keys(c.action.payload))if(c.action.payload[k]===undefined)delete c.action.payload[k];return c;}));
  assert.equal(state(e).orders[0].status,'cancelled');assert.equal(e.observe('a1').world['command.owned'].orders.length,0);
  assert.equal(e.checkCommand(order(e,2)),'not-permitted');step(e,5);assert.equal(state(e).orders[0].status,'cancelled');
});
test('expiry is exclusive and does not revive old intention',()=>{
  const e=engine();e.step([order(e,1,{expiresTick:5})]);step(e,4);assert.equal(e.observe('a1').world['command.owned'].orders.length,0);e.step([]);assert.equal(state(e).orders[0].status,'expired');
});
test('malformed fields, cross-owner, actor forgery, stale generation and blocked target reject',()=>{
  const e=engine();const forged=order(e);forged.action.payload.issuer='p1';assert.equal(e.checkCommand(forged),'invalid-action');
  const enemy=order(e);enemy.controllerId='p2';enemy.actorId='body-p2';enemy.executeTick=4;assert.equal(e.checkCommand(enemy),'not-permitted');
  const actor=order(e);actor.actorId='body-a1';assert.equal(e.checkCommand(actor),'unauthorized');
  assert.equal(e.checkCommand(order(e,1,{generation:2})),'not-permitted');assert.equal(e.checkCommand(order(e,1,{target:{x:40,z:22}})),'not-permitted');
});
test('execution rechecks living authority, death increments only once and clears channels',()=>{
  const e=engine();const delayed=order(e);delayed.executeTick=2;e.step([order(e)]);edit(e,s=>{s['combat.runner'].units.find(u=>u.id==='body-p1').alive=false;s['combat.runner'].units.find(u=>u.id==='body-p1').respawnTick=100;});e.step([]);assert.equal(state(e).grants[0].generation,1);assert.deepEqual(state(e).orders,[]);e.step([delayed]);step(e,5);assert.equal(state(e).grants[0].generation,1);assert.deepEqual(state(e).reportQueue,[]);assert.deepEqual(state(e).leaders,[]);
  edit(e,s=>s['combat.runner'].units.find(u=>u.id==='body-p1').alive=true);e.step([]);assert.deepEqual(state(e).deadLatch,[]);assert.equal(e.checkCommand(order(e)),'not-permitted');assert.equal(e.checkCommand(order(e,1,{generation:1})),null);
});
test('same-tick higher revision and cancellation tie emit explicit superseded events',()=>{
  const e=engine();const cfg=structuredClone(e.config);cfg.controllers[0].budget.actionLimitPerTick=4;const many=new Engine(cfg,autonomousModules);
  many.step([order(many,1),{...order(many,2),sequence:1}]);assert.equal(state(many).orders[0].revision,2);assert.equal(many.observe('p1').events.filter(e=>e.kind==='command.superseded').length,1);
  const issue=order(many,3),cancel=order(many,3,{kind:'cancel'});for(const key of ['target','risk','expiresTick'])delete cancel.action.payload[key];issue.sequence=2;cancel.sequence=3;
  many.step([issue,cancel]);assert.equal(state(many).orders[0].status,'cancelled');assert.equal(many.observe('p1').events.filter(e=>e.kind==='command.superseded').length,1);
});
test('voluntary transfer clears old generation and dominates same-tick orders',()=>{
  const e=engine();const cfg=structuredClone(e.config);cfg.controllers[0].budget.actionLimitPerTick=3;const x=new Engine(cfg,autonomousModules);
  // Author a second living allied hero for this fixture without changing policy/body ownership.
  edit(x,s=>s['movement.planar'].bodies.find(b=>b.id==='body-p2').teamId='alpha');
  const transfer=cmd(x,'command.transfer',{unitId:'body-a1',generation:0,commanderId:'p2'},'p1',1);
  x.step([order(x),transfer]);assert.equal(state(x).grants[0].commanderId,'p2');assert.equal(state(x).grants[0].generation,1);assert.deepEqual(state(x).orders,[]);assert.equal(x.observe('p1').world['command.owned'].grants.length,0);assert.equal(x.observe('p1').events.find(e=>e.kind==='command.invalidated').data.sequence,0);
});
test('unit and leader reports preserve original capture time, are delayed and private',()=>{
  const e=engine();step(e,2);const report=cmd(e,'command.report',{generation:0,revision:1,mode:'idle'},'a1');step(e,2);e.step([report]);const captured=state(e).reportQueue[0];assert.equal(captured.observedTick,4);assert.equal(captured.deliveredTick,8);assert.equal(e.observe('p1').world['command.owned'].reports.length,0);step(e,2);assert.equal(e.tick,7);assert.equal(e.observe('p1').world['command.owned'].reports.length,0);e.step([]);assert.equal(e.tick,8);assert.equal(e.observe('p1').world['command.owned'].reports[0].observedTick,4);assert.equal(e.observe('p2').world['command.owned'].reports.length,0);assert.equal(e.observe('a1').world['command.owned'].reports.length,0);assert.ok(e.observe('a1').world['command.owned'].leaders.every(r=>r.observedTick<=e.tick-4));
});
test('hidden raider data leaves command projection and rejection unchanged',()=>{
  const a=engine(),b=engine();edit(b,s=>{const body=s['movement.planar'].bodies.find(b=>b.id==='body-p3');body.x=77;body.z=57;s['combat.runner'].units.find(u=>u.id===body.id).hp=1;});assert.deepEqual(a.observe('a1'),b.observe('a1'));assert.equal(a.checkCommand(order(a,1,{generation:99})),b.checkCommand(order(b,1,{generation:99})));
});
test('full nonzero checkpoint retains queued reactions, reports, memory and continuation',()=>{
  const e=engine(),r=new Runner(e,autonomousPolicies(),'test-build',e.config.controllers);r.submit('p1',(({controllerId,receivedTick,...p})=>p)(order(e)));for(let i=0;i<7;i++)r.step();const checkpoint=r.checkpoint();assert.ok(checkpoint.runnerState.queue.length);assert.ok(checkpoint.policyMemories.a1.decisions>0);assert.ok(state(e).leaderQueue.length||state(e).leaders.length);
  const e2=engine(),r2=new Runner(e2,autonomousPolicies(),'test-build',e2.config.controllers);r2.restore(checkpoint);for(let i=0;i<90;i++){r.step();r2.step();assert.equal(e.stateHash(),e2.stateHash());assert.deepEqual(r.checkpoint().policyMemories,r2.checkpoint().policyMemories);}assert.equal(r.diagnostics.some(d=>d.includes('policy-error')),false);
});
test('crossing kills latch through respawn, friendly loss and simultaneous finish draw',()=>{
  for(const mode of ['win','loss','both']){const e=engine();edit(e,s=>{for(const u of s['combat.runner'].units)if(mode==='both'||(mode==='win'?['body-p2','body-p3']:['body-p1','body-a1']).includes(u.id)){u.alive=false;u.respawnTick=100;}});e.step([]);assert.equal(e.snapshot().terminal.kind,mode==='both'?'draw':'finished');if(mode!=='both')assert.deepEqual(e.snapshot().terminal.winners,[mode==='win'?'alpha':'beta']);}
  const e=engine();edit(e,s=>{const u=s['combat.runner'].units.find(u=>u.id==='body-p2');u.alive=false;u.respawnTick=2;});step(e,3);assert.ok(e.snapshot().moduleStates['rules.crossing'].defeated.includes('body-p2'));assert.equal(e.snapshot().moduleStates['objective.relay'].scores.alpha,0);
});

test('B-05 rebuilding availability is private, checkpointed and clears after respawn',()=>{
  const e=engine();edit(e,s=>{const u=s['combat.runner'].units.find(u=>u.id==='body-a1');u.alive=false;u.hp=0;u.respawnTick=8;});e.step([]);
  assert.deepEqual(e.observe('p1').world['command.owned'].unavailableUnitIds,['body-a1']);
  assert.deepEqual(e.observe('p2').world['command.owned'].unavailableUnitIds,[]);
  assert.deepEqual(e.observe('p1').world['command.owned'].reports,[]);
  const restored=engine();restored.restore(e.snapshot());
  for(let i=0;i<10;i++){e.step([]);restored.step([]);assert.equal(e.stateHash(),restored.stateHash());}
  assert.deepEqual(e.observe('p1').world['command.owned'].unavailableUnitIds,[]);
  assert.equal(state(e).grants[0].generation,1);
});
