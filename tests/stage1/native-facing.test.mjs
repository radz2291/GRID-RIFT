import test from 'node:test';
import assert from 'node:assert/strict';
import { Engine } from '../../dist/src/core/engine.js';
import { tacticalModules } from '../../dist/src/modules/tactical/index.js';
import { encounterConfig, createGame } from '../../dist/src/game/session.js';
import { replayEncounter } from '../../scripts/replay-encounter.mjs';
import { runnerYaw } from '../../dist/src/adapters/runner-facing.js';
function setup(a={x:36,z:30},b={x:43,z:30}) {
 const config=encounterConfig();config.controllers.forEach(c=>c.budget.reactionTicks=0);
 const e=new Engine(config,tacticalModules),s=e.snapshot();
 s.moduleStates['movement.planar'].bodies.forEach((m,i)=>Object.assign(m,i?b:a,{facingX:i?1:-1,facingZ:0,destination:null,path:[]}));
 e.restore(s);return e;
}
function command(e,id,kind,payload){return {controllerId:id,actorId:`body-${id}`,receivedTick:e.tick,sequence:e.tick,observedTick:e.tick,executeTick:e.tick,action:{kind,version:'0.1.0',payload}};}
function orientation(e,observer,id){return e.observe(observer).entities.find(a=>a.id===id)?.components.orientation;}
function points(direction,x,z){assert.ok(direction,'simulation publishes native facing');const d=Math.hypot(x,z);assert.ok(Math.abs(direction.facingX-x/d)<1e-9);assert.ok(Math.abs(direction.facingZ-z/d)<1e-9);}
test('both players turn on the actual attack tick, including AI seen without private target data',()=>{
 const e=setup();e.step([command(e,'p1','combat.attack',{targetId:'body-p2'}),command(e,'p2','combat.attack',{targetId:'body-p1'})]);
 points(orientation(e,'p1','body-p1'),1,0);points(orientation(e,'p1','body-p2'),-1,0);
 const ai=e.observe('p1').entities.find(a=>a.id==='body-p2');assert.ok(Math.abs(-Math.sin(runnerYaw(ai,[ai]))+1)<1e-9,'renderer uses native AI facing without a target ID');
 assert.equal(e.observe('p1').entities.find(a=>a.id==='body-p2').components.combat.targetId,undefined);
 const s=e.snapshot();s.moduleStates['movement.planar'].bodies[0].z=33;e.restore(s);e.step([]);
 points(orientation(e,'p1','body-p2'),-7,3);
});
test('actual utility AI shoots facing its victim and the native state replays exactly',()=>{
 const g=createGame();g.command('movement.move-to',{x:40,z:30});let witnessed=false;
 for(let i=0;i<350;i++){
  g.tick();const run=g.exportRun(),hit=run.events.at(-1)?.events.find(e=>e.kind==='combat.hit'&&e.data.actorId==='body-p2'&&e.data.kind==='basic');
  if(!hit)continue;
  const ai=g.observe().entities.find(e=>e.id==='body-p2');if(!ai?.components.combat.alive)continue;
  const trace=g.observe().world['combat.runner'].traces.find(t=>t.actorId==='body-p2'&&t.kind==='basic'&&t.tick===g.observe().tick-1);
  points(ai.components.orientation,trace.to.x-trace.from.x,trace.to.z-trace.from.z);witnessed=true;break;
 }
 assert.ok(witnessed,'observed a real AI basic shot');const run=g.exportRun();assert.equal(replayEncounter(run,false).finalHash,run.finalHash);
});
test('AI pulse faces its aim through windup and launch; subsequent movement restores travel facing',()=>{
 const e=setup();e.step([command(e,'p2','combat.cast',{ability:'pulse',x:43,z:40})]);
 points(orientation(e,'p1','body-p2'),0,1);
 for(let i=0;i<6;i++)e.step([]);
 points(orientation(e,'p1','body-p2'),0,1);
 e.step([command(e,'p2','movement.move-to',{x:43,z:26})]);points(orientation(e,'p1','body-p2'),0,-1);
 const snapshot=e.snapshot(),clone=setup();clone.restore(snapshot);for(let i=0;i<5;i++){e.step([]);clone.step([]);assert.equal(e.stateHash(),clone.stateHash());}
});
test('an unseen target does not steer the shooter or leak its hidden position through facing',()=>{
 const a=setup({x:20,z:24},{x:32,z:24}),b=setup({x:20,z:24},{x:32,z:24});
 const s=a.snapshot();s.moduleStates['combat.runner'].units[0].targetId='body-p2';s.moduleStates['combat.runner'].targetSetTicks['body-p1']=0;a.restore(s);
 a.step([]);b.step([]);assert.deepEqual(orientation(a,'p1','body-p1'),orientation(b,'p1','body-p1'));assert.equal(orientation(a,'p1','body-p2'),undefined);
});
test('an actual shot during dash faces the hit, then travel facing resumes between shots',()=>{
 const e=setup(),s=e.snapshot();s.moduleStates['movement.planar'].bodies[1].dash={dx:0,dz:.3,ticks:2};e.restore(s);
 e.step([command(e,'p2','combat.attack',{targetId:'body-p1'})]);points(orientation(e,'p1','body-p2'),-7,-.3);
 e.step([]);points(orientation(e,'p1','body-p2'),0,1);
});
