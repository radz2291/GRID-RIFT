import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../../dist/src/game/session.js';
import { planHumanOrder, attackClickIntent } from '../../dist/src/agents/human-orders.js';
function view() {
 const o=createGame().observe(), own=o.entities[0]; own.components.movement.x=36;own.components.movement.z=30;
 const enemy=structuredClone(own);enemy.id='body-p2';enemy.components.movement={...enemy.components.movement,id:enemy.id,teamId:'beta',x:43,z:30};enemy.components.combat.id=enemy.id;
 o.entities=[own,enemy];return o;
}
test('the same attack click chooses an entity lock or ground order from what was hit',()=>{
 assert.equal(attackClickIntent({x:40,z:30},'body-p2').kind,'combat.attack');
 assert.deepEqual(attackClickIntent({x:40,z:30},null).payload,{x:40,z:30});
 assert.equal(attackClickIntent({x:40,z:30},null).kind,'control.attack-move');
});
test('ground attack releases a nearby target that moves away; explicit enemy click keeps pursuing',()=>{
 const o=view(), destination={x:40,z:30};
 let ground=planHumanOrder(o,{mode:'attack-move',focus:null,destination});
 assert.equal(ground.state.focus,'body-p2');
 o.entities[1].components.movement.x=51;
 ground=planHumanOrder(o,ground.state);
 assert.equal(ground.state.focus,null);assert.deepEqual(ground.action.payload,destination);
 const locked=planHumanOrder(o,{mode:'attack',focus:'body-p2',destination:null});
 assert.equal(locked.state.focus,'body-p2');assert.equal(locked.action.kind,'movement.move-to');
 o.entities[0].components.movement.x=50;o.entities[1].components.movement.x=57;
 assert.equal(planHumanOrder(o,{mode:'attack-move',focus:'body-p2',destination}).state.focus,null,'ground order stays tied to clicked area even when rival remains close to Runner');
});
test('ground attack finishes at its point without enemies; idle autoattack never becomes an enemy lock',()=>{
 const o=view();o.entities=o.entities.slice(0,1);
 const done=planHumanOrder(o,{mode:'attack-move',focus:null,destination:{x:36,z:30}});
 assert.equal(done.state.mode,'hold');assert.equal(done.state.focus,null);
 const nearby=view();let idle=planHumanOrder(nearby,{mode:'idle',focus:null,destination:null});
 assert.equal(idle.state.mode,'idle');nearby.entities[0].components.combat.targetId='body-p2';nearby.entities[1].components.movement.x=51;
 idle=planHumanOrder(nearby,idle.state);assert.equal(idle.state.focus,null);
 assert.deepEqual(idle.action.payload,{x:36,z:30});
});
