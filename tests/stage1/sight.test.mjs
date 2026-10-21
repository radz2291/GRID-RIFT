import test from 'node:test';
import assert from 'node:assert/strict';
import { inSight,sightPolygons,structureInSight } from '../../dist/src/adapters/sight-mask.js';
import { clear } from '../../dist/src/modules/tactical/geometry.js';
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
function contains(point,polygon){let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a.z>point.z)!==(b.z>point.z)&&point.x<(b.x-a.x)*(point.z-a.z)/(b.z-a.z)+a.x)inside=!inside;}return inside;}
test('sight contour follows player movement, cover shadows and removal of a living sight source',()=>{
 const map=createGame().observe().world['world.planar'];
 const before=sightPolygons(map,[{x:20,z:24}],18);assert.equal(contains({x:20,z:34},before[0]),true);assert.equal(contains({x:32,z:24},before[0]),false);
 const after=sightPolygons(map,[{x:40,z:30}],18);assert.notDeepEqual(after,before);assert.equal(contains({x:40,z:30},after[0]),true);
 assert.deepEqual(sightPolygons(map,[],18),[]);
});
test('sight is derived without enemy data, leaves its inputs unchanged, and supports multiple permitted sources',()=>{
 const map=createGame().observe().world['world.planar'],sources=[{x:14,z:34},{x:66,z:26}],before=structuredClone({map,sources});
 assert.equal(inSight({x:66,z:27},sources,18,map),true);assert.equal(sightPolygons(map,sources,18).length,2);assert.deepEqual({map,sources},before);
});
test('roof reveal uses visible exterior faces even though the building centre blocks point sight',()=>{
 const map=createGame().observe().world['world.planar'],blocker=map.blockers[0],sources=[{x:14,z:34}];
 assert.equal(inSight(blocker,sources,18,map),false);assert.equal(structureInSight(blocker,sources,18,map),true);
 assert.equal(structureInSight(blocker,[{x:66,z:26}],18,map),false);assert.equal(structureInSight(blocker,[],18,map),false);
});
test('a building fully behind other cover remains fogged despite being within radius',()=>{
 const map=structuredClone(createGame().observe().world['world.planar']);const hidden={id:'behind',x:34,z:24,w:2,d:2,height:3};map.blockers.push(hidden);
 assert.equal(structureInSight(hidden,[{x:20,z:24}],18,map),false);
});
test('high resolution contours terminate at cover and range without depending on raster pixel size',()=>{
 const map=createGame().observe().world['world.planar'],source={x:20,z:24},polygon=sightPolygons(map,[source],18)[0];
 assert.ok(polygon.length>=256);
 for(const p of polygon){const d=Math.hypot(p.x-source.x,p.z-source.z);assert.ok(d<=18+1e-8);const interior={x:source.x+(p.x-source.x)*.99999,z:source.z+(p.z-source.z)*.99999};assert.ok(clear(source,interior,map));}
 for(const point of [{x:20,z:34},{x:32,z:24},{x:35,z:35},{x:10,z:24}])assert.equal(contains(point,polygon),inSight(point,[source],18,map));
});
