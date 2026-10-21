import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../../dist/src/game/session.js';
import { runnerYaw } from '../../dist/src/adapters/runner-facing.js';

function actors() {
 const own=createGame().observe().entities[0]; delete own.components.orientation; // Legacy observations without native facing.
 Object.assign(own.components.movement,{x:40,z:30,facingX:-1,facingZ:0,destination:null});
 own.components.combat.targetId='enemy';
 const enemy=structuredClone(own);enemy.id='enemy';enemy.components.movement.x=45;
 return [own,enemy];
}
function faces(yaw,dx,dz) {
 const length=Math.hypot(dx,dz);
 assert.ok(Math.abs(-Math.sin(yaw)-dx/length)<1e-10);
 assert.ok(Math.abs(-Math.cos(yaw)-dz/length)<1e-10);
}
test('stationary Runner faces the attack target and tracks it around all sides without mutating observations',()=>{
 const [own,enemy]=actors();
 for(const [dx,dz] of [[5,0],[0,5],[-5,0],[0,-5],[3,4]]) {
  Object.assign(enemy.components.movement,{x:40+dx,z:30+dz});
  const before=structuredClone([own,enemy]);
  faces(runnerYaw(own,[own,enemy]),dx,dz);assert.deepEqual([own,enemy],before);
 }
});
test('movement and dash keep their facing, while confirmed pulse faces its aim instead of old attack target',()=>{
 const [own,enemy]=actors(),m=own.components.movement,c=own.components.combat;
 m.destination={x:30,z:30};faces(runnerYaw(own,[own,enemy]),-1,0);
 m.destination=null;m.dash={dx:-1,dz:0,ticks:2};faces(runnerYaw(own,[own,enemy]),-1,0);
 m.dash=null;c.windup={x:40,z:35,launchTick:10};faces(runnerYaw(own,[own,enemy]),0,5);
});
test('hidden, dead, coincident and cleared targets never provide an invalid or stale aim',()=>{
 const [own,enemy]=actors();faces(runnerYaw(own,[own]),-1,0);
 enemy.components.combat.alive=false;faces(runnerYaw(own,[own,enemy]),-1,0);
 enemy.components.combat.alive=true;enemy.components.movement.x=40;faces(runnerYaw(own,[own,enemy]),-1,0);
 enemy.components.movement.x=45;own.components.combat.targetId=null;faces(runnerYaw(own,[own,enemy]),-1,0);
});
