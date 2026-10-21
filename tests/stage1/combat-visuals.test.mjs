import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { buildSync } from 'esbuild';
import { fileURLToPath } from 'node:url';
const visualModule=new URL('../../runs/stage1-visual-unit/combat-visuals.mjs',import.meta.url);
buildSync({entryPoints:[fileURLToPath(new URL('../../src/adapters/browser/combat-visuals.ts',import.meta.url))],outfile:fileURLToPath(visualModule),bundle:true,platform:'node',format:'esm',packages:'external'});
const {makeBeam,makeCombatTrace,SHOT_HEIGHT}=await import(visualModule.href);
function dispose(mesh){mesh.geometry.dispose();mesh.material.dispose();}
test('rendered beam endpoints match the shot in all quadrants, without tilting toward the ground',()=>{
 for(const [x,z] of [[8,0],[-8,0],[0,8],[0,-8],[6,8],[-6,8],[6,-8],[-6,-8]]){
  const a={x:30,z:30},b={x:30+x,z:30+z},beam=makeBeam(a,b,0xffffff,.9,SHOT_HEIGHT),half=Math.hypot(x,z)/2;
  const start=new Vector3(0,-half,0).applyQuaternion(beam.quaternion).add(beam.position),end=new Vector3(0,half,0).applyQuaternion(beam.quaternion).add(beam.position);
  assert.ok(start.distanceTo(new Vector3(a.x,SHOT_HEIGHT,a.z))<1e-8);assert.ok(end.distanceTo(new Vector3(b.x,SHOT_HEIGHT,b.z))<1e-8);
  dispose(beam);
 }
});
test('basic hits use raised beams; pulse hits use local impact instead of an imaginary return beam',()=>{
 const trace={from:{x:20,z:20},to:{x:30,z:30},actorId:'body-p1',tick:4};
 const basic=makeCombatTrace({...trace,kind:'basic'},0xffffff),pulse=makeCombatTrace({...trace,kind:'pulse'},0xffffff);
 assert.equal(basic.geometry.type,'CylinderGeometry');assert.equal(basic.position.y,SHOT_HEIGHT);
 assert.equal(pulse.geometry.type,'SphereGeometry');assert.deepEqual(pulse.position.toArray(),[30,SHOT_HEIGHT,30]);dispose(basic);dispose(pulse);
});
test('zero-length guides are hidden and never produce invalid rotation values',()=>{
 const beam=makeBeam({x:1,z:2},{x:1,z:2},0xffffff,.9);assert.equal(beam.visible,false);assert.ok(beam.quaternion.toArray().every(Number.isFinite));dispose(beam);
});
