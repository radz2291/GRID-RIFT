import test from 'node:test';
import assert from 'node:assert/strict';
import { inSight,sightMask } from '../../dist/src/adapters/sight-mask.js';
import { createGame,encounterConfig } from '../../dist/src/game/session.js';
import { Engine } from '../../dist/src/core/engine.js';
import { tacticalModules } from '../../dist/src/modules/tactical/index.js';

test('visual sight matches authoritative enemy visibility for open ground, range and cover',()=>{
 const e=new Engine(encounterConfig(),tacticalModules),map=e.observe('p1').world['world.planar'],source={x:20,z:24},radius=18;
 for(const point of [{x:20,z:34},{x:32,z:24},{x:40,z:24},{x:20,z:42},{x:20,z:43},{x:36,z:33}]){
  const snapshot=e.snapshot();Object.assign(snapshot.moduleStates['movement.planar'].bodies[0],source);Object.assign(snapshot.moduleStates['movement.planar'].bodies[1],point);e.restore(snapshot);
  assert.equal(inSight(point,[source],radius,map),e.observe('p1').entities.some(e=>e.id==='body-p2'),JSON.stringify(point));
 }
});
test('sight texture follows player movement, cover shadows and removal of a living sight source',()=>{
 const map=createGame().observe().world['world.planar'],output=new Uint8Array(160*120),at=(x,z)=>Math.floor(z/.5)*160+Math.floor(x/.5);
 sightMask(map,[{x:20,z:24}],18,160,120,output);assert.equal(output[at(20,34)],255);assert.equal(output[at(32,24)],0);
 const before=output.slice();sightMask(map,[{x:40,z:30}],18,160,120,output);assert.notDeepEqual(output,before);assert.equal(output[at(40,30)],255);
 sightMask(map,[],18,160,120,output);assert.ok(output.every(v=>v===0));
});
test('sight is derived without enemy data, leaves its inputs unchanged, and supports multiple permitted sources',()=>{
 const map=createGame().observe().world['world.planar'],sources=[{x:14,z:34},{x:66,z:26}],before=structuredClone({map,sources});
 assert.equal(inSight({x:66,z:27},sources,18,map),true);sightMask(map,sources,18,160,120);assert.deepEqual({map,sources},before);
});
