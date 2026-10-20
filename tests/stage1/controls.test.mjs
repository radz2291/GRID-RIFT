import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../../dist/src/game/session.js';
import { initialHumanOrder,planHumanOrder } from '../../dist/src/agents/human-orders.js';
import { replayEncounter } from '../../scripts/replay-encounter.mjs';

function view(enemyDistance=11) {
  const o=createGame().observe(); const own=o.entities[0];own.components.movement.x=36;own.components.movement.z=30;
  const enemy=structuredClone(own);enemy.id='body-p2';enemy.components.movement={...enemy.components.movement,id:enemy.id,controllerId:'p2',teamId:'beta',x:36+enemyDistance,z:30};enemy.components.combat.id=enemy.id;
  o.entities=[own,enemy];return o;
}
test('one target selection approaches visible enemy, then repeats without reissuing attacks',()=>{
  const o=view(),state={mode:'attack',focus:'body-p2',destination:null};
  assert.equal(planHumanOrder(o,state).action.kind,'movement.move-to');
  o.entities[1].components.movement.x=43;
  assert.equal(planHumanOrder(o,state).action.kind,'combat.attack');
  o.entities[0].components.combat.targetId='body-p2';assert.equal(planHumanOrder(o,state).action,null);
});
test('lost target cancels pursuit without following hidden position; attack move resumes area order',()=>{
  const o=view();o.entities=o.entities.slice(0,1);
  const focused=planHumanOrder(o,{mode:'attack',focus:'body-p2',destination:null});
  assert.equal(focused.state.focus,null);assert.deepEqual(focused.action.payload,{x:36,z:30});
  const area=planHumanOrder(o,{mode:'attack-move',focus:'body-p2',destination:{x:44,z:48}});
  assert.deepEqual(area.action.payload,{x:44,z:48});
});
test('nearest acquisition is deterministic; moving retreat and hold suppress acquisition',()=>{
  const o=view(6),extra=structuredClone(o.entities[1]);extra.id='nearer';extra.components.movement.id='nearer';extra.components.movement.x=40;o.entities.push(extra);
  assert.equal(planHumanOrder(o,initialHumanOrder()).action.payload.targetId,'nearer');
  o.entities[0].components.movement.destination={x:14,z:34};
  assert.equal(planHumanOrder(o,{mode:'move',focus:null,destination:{x:14,z:34}}).action,null);
  assert.equal(planHumanOrder(o,{mode:'hold',focus:null,destination:null}).action,null);
});
test('attack move acquires nearby visible enemy and idle standing order does not seek distant enemies',()=>{
  const o=view(11);
  assert.equal(planHumanOrder(o,{mode:'attack-move',focus:null,destination:{x:40,z:30}}).state.focus,'body-p2');
  assert.equal(planHumanOrder(o,initialHumanOrder()).action,null);
  o.entities=o.entities.slice(0,1);
  assert.equal(planHumanOrder(o,initialHumanOrder()).action,null);
});
test('integrated single attack selection chases, attacks, and stop cancels the standing order',()=>{
  const g=createGame();g.command('movement.move-to',{x:40,z:30});
  let found=false;
  for(let t=0;t<180;t++) {
    g.tick();const o=g.observe(),enemy=o.entities.find(e=>e.id==='body-p2');
    if(enemy?.components.combat.alive){assert.equal(g.command('combat.attack',{targetId:enemy.id}).accepted,true);found=true;break;}
  }
  assert.ok(found,'a legitimately visible enemy was reached');
  let hit=false;
  for(let t=0;t<160;t++) {
    g.tick();const run=g.exportRun();
    if(run.events.some(row=>row.events.some(e=>e.kind==='combat.hit'&&e.data.actorId==='body-p1'))){hit=true;break;}
  }
  assert.ok(hit,'single selection eventually caused an authoritative hit');
  assert.equal(g.exportRun().humanOrders.filter(o=>o.kind==='combat.attack').length,1);
  assert.equal(g.command('control.stop',{}).accepted,true);g.tick();
  assert.equal(g.exportRun().humanControllerState.standingOrder.mode,'hold');
  assert.equal(g.observe().entities.find(e=>e.id==='body-p1').components.combat.targetId,null);
  assert.equal(replayEncounter(g.exportRun(),false).finalHash,g.exportRun().finalHash);
});
test('new controls identity is recorded; unsampled attack-move/stop validation and pause discard are safe',()=>{
  const g=createGame();assert.equal(g.exportRun().manifest.experimentVersion,'0.2.0');
  assert.equal(g.command('control.attack-move',{x:26,z:24}).accepted,false);
  assert.equal(g.command('control.stop',{extra:1}).accepted,false);
  assert.equal(g.command('control.attack-move',{x:40,z:30}).accepted,true);
  g.discardInput();g.tick();assert.equal(g.exportRun().humanOrders.length,0);
  assert.equal(g.exportRun().humanControllerState.standingOrder.mode,'idle');
});
