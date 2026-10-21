import test from 'node:test';
import assert from 'node:assert/strict';
import {Engine} from '../../dist/src/core/engine.js';
import {autonomousConfig} from '../../dist/src/game/autonomous.js';
import {autonomousModules} from '../../dist/src/modules/autonomy.js';
import {subordinatePolicy as policy,steadyPolicy} from '../../dist/src/agents/subordinate.js';
function engine(variant='crossing'){const config=autonomousConfig(variant);config.modules.find(m=>m.id==='objective.relay').config={};return new Engine(config,autonomousModules);}
function context(variant='crossing'){
  const e=engine(variant),o=e.observe('a1');o.tick=40;
  o.world['command.owned'].orders=[{unitId:'body-a1',generation:0,orderId:'test',revision:1,kind:'secure',target:{x:40,z:30},risk:'balanced',expiresTick:400,issuedTick:0,effectiveTick:2,status:'active'}];
  return {observation:o,memory:policy.initialMemory(0),budget:{decisionIntervalTicks:4,reactionTicks:2,actionLimitPerTick:2},earliestExecuteTick:42,deadlineTick:40,nextSequence:7};
}
const self=c=>c.observation.entities.find(e=>e.id==='body-a1').components;
const order=c=>c.observation.world['command.owned'].orders[0];
const tactical=d=>d.actions.find(a=>a.action.kind!=='command.report');
function enemy(c,x=32,z=34){const own=structuredClone(self(c));Object.assign(own.movement,{id:'body-p2',controllerId:'p2',teamId:'beta',x,z});Object.assign(own.combat,{id:'body-p2',pulseReadyTick:undefined});c.observation.entities.push({id:'body-p2',components:own});return own;}

test('separate policies keep body/config parity and explicit delayed two-action budget',()=>{
  const c=context(),d=policy.decide(c);assert.equal(d.actions.length,2);assert.equal(tactical(d).action.kind,'movement.move-to');assert.equal(tactical(d).executeTick,42);assert.equal(d.actions[1].action.kind,'command.report');assert.equal(d.actions[1].sequence,8);assert.equal(d.nextMemory.decisions,1);
  assert.equal(steadyPolicy.identity.id,'autonomy.steady');assert.notEqual(steadyPolicy.identity.id,policy.identity.id);assert.deepEqual(autonomousConfig('crossing').modules,autonomousConfig('crossing','autonomy.steady').modules);
});
test('unchanged intention reacts differently to visible threat direction and health',()=>{
  const left=context(),right=context();enemy(left,31,32);enemy(right,31,37);
  const a=policy.decide(left),b=policy.decide(right);assert.equal(tactical(a).action.kind,'combat.cast');assert.notDeepEqual(tactical(a).action.payload,tactical(b).action.payload);
  self(left).combat.hp=25;const retreat=policy.decide(left);assert.equal(retreat.reasonTags[0],'recover-at-spawn');assert.equal(retreat.nextMemory.retreating,true);assert.notDeepEqual(tactical(a),tactical(retreat));
});
test('cautious risk threshold and retreat hysteresis use public own health',()=>{
  const c=context();self(c).combat.hp=45;order(c).risk='cautious';let d=policy.decide(c);assert.equal(d.nextMemory.retreating,true);c.memory=d.nextMemory;self(c).combat.hp=60;assert.equal(policy.decide(c).nextMemory.retreating,true);self(c).combat.hp=70;assert.equal(policy.decide(c).nextMemory.retreating,false);
});
test('defend leash does not chase a visible foe far beyond the ordered perimeter',()=>{
  const c=context();order(c).kind='defend';order(c).target={x:10,z:34};enemy(c,35,34);assert.equal(policy.decide(c).reasonTags[0],'advance-defend');assert.deepEqual(tactical(policy.decide(c)).action.payload,{x:10,z:34});
});
test('cancel, pending replacement, expiry and generation revocation stop retained attacks and paths',()=>{
  for(const change of [c=>c.observation.world['command.owned'].orders=[],c=>order(c).status='pending',c=>order(c).expiresTick=40,c=>c.observation.world['command.owned'].grants[0].generation++]){
    const c=context();Object.assign(self(c).movement,{destination:{x:45,z:34},path:[{x:45,z:34}]});self(c).combat.targetId='body-p2';change(c);const d=policy.decide(c);assert.equal(d.reasonTags[0],'no-effective-intention');assert.deepEqual(tactical(d).action.payload,{x:25,z:34});
  }
});
test('follow accepts only fresh visible commander or delayed own-commander telemetry',()=>{
  const c=context();Object.assign(order(c),{kind:'follow',target:'body-p1'});c.observation.entities=c.observation.entities.filter(e=>e.id!=='body-p1');assert.equal(policy.decide(c).reasonTags[0],'no-fresh-commander-position');
  c.observation.world['command.owned'].leaders=[{unitId:'body-p1',generation:0,revision:0,mode:'commander',observedTick:0,deliveredTick:4,x:30,z:34,hp:100,alive:true}];assert.deepEqual(tactical(policy.decide(c)).action.payload,{x:30,z:34});c.observation.tick=81;assert.equal(policy.decide(c).reasonTags[0],'no-fresh-commander-position');
  c.observation.world['command.owned'].leaders[0].generation=9;c.observation.tick=40;assert.equal(policy.decide(c).reasonTags[0],'no-fresh-commander-position');
});
test('missing visible enemies preserve original memory timestamps without hidden pursuit',()=>{
  const c=context();enemy(c);let d=policy.decide(c);assert.equal(d.nextMemory.lastSeen[0].observedTick,40);c.memory=d.nextMemory;c.observation.tick=44;c.observation.entities=c.observation.entities.filter(e=>e.id!=='body-p2');d=policy.decide(c);assert.equal(d.nextMemory.lastSeen[0].observedTick,40);assert.equal(d.reasonTags[0],'advance-secure');c.memory=d.nextMemory;c.observation.tick=121;assert.deepEqual(policy.decide(c).nextMemory.lastSeen,[]);
});
test('blocked goal choice stays legal and simulation takes a different route under unchanged legal intention',()=>{
  const a=engine(),b=engine('blocked-route');const command=e=>({controllerId:'p1',actorId:'body-p1',receivedTick:0,observedTick:0,executeTick:0,sequence:0,action:{kind:'command.order',version:'0.1.0',payload:{unitId:'body-a1',generation:0,orderId:'test',revision:1,kind:'secure',target:{x:40,z:30},risk:'balanced',expiresTick:400}}});
  for(const e of [a,b]){assert.equal(e.checkCommand(command(e)),null);e.step([command(e)]);e.step([]);const c=context();c.observation=e.observe('a1');c.earliestExecuteTick=e.tick+2;const d=policy.decide(c);const move=tactical(d);e.step([]);e.step([]);e.step([{...move,controllerId:'a1',receivedTick:2}]);}
  const ma=a.snapshot().moduleStates['movement.planar'].bodies.find(b=>b.id==='body-a1'),mb=b.snapshot().moduleStates['movement.planar'].bodies.find(b=>b.id==='body-a1');assert.equal(ma.path.length,1);assert.ok(mb.path.length>1);assert.notEqual(ma.z,mb.z);
  const c=context('blocked-route');enemy(c,34,34);self(c).combat.pulseReadyTick=999;const d=policy.decide(c);if(tactical(d).action.kind==='movement.move-to'){const p=tactical(d).action.payload;assert.ok(!c.observation.world['world.planar'].blockers.some(b=>Math.abs(p.x-b.x)<=b.w/2+.6&&Math.abs(p.z-b.z)<=b.d/2+.6));}
});
test('identical permitted input determines policy results, including bounded serial memory',()=>{
  const c=context();enemy(c);const a=policy.decide(c);const restored=JSON.parse(JSON.stringify(c));assert.deepEqual(policy.decide(restored),a);assert.ok(a.nextMemory.lastSeen.length<=8);assert.equal(a.actions.filter(a=>a.action.kind==='command.report')[0].action.payload.revision,1);
  c.budget.actionLimitPerTick=0;assert.deepEqual(policy.decide(c).actions,[]);self(c).combat.alive=false;c.budget.actionLimitPerTick=2;assert.deepEqual(policy.decide(c).actions,[]);
});
test('steady baseline changes tactical choice with identical visible body capabilities',()=>{
  const c=context();order(c).target={x:30,z:34};enemy(c);assert.equal(tactical(policy.decide(c)).action.kind,'combat.cast');assert.equal(tactical(steadyPolicy.decide(c)).action.kind,'combat.attack');
});

