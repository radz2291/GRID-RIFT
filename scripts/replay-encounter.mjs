import { readFileSync } from 'node:fs';
import { Engine } from '../dist/src/core/engine.js';
import { tacticalModules } from '../dist/src/modules/tactical/index.js';
import { autonomousModules } from '../dist/src/modules/autonomy.js';
import { Runner } from '../dist/src/runner/runner.js';
import { canonical,hash } from '../dist/src/core/data.js';
import { sourceIdentity } from '../dist/src/runner/runtime.js';
export function replayEncounter(run,verifySource=true) {
  if(!['grid-rift/encounter-export/v0','grid-rift/autonomous-export/v0'].includes(run.format))throw new Error('Unknown encounter export format');
  if(verifySource) {
    const current=sourceIdentity();
    if(run.manifest.sourceCommit!==current.sourceCommit||run.manifest.dependencyLockHash!==current.dependencyLockHash||run.manifest.runtime.sourceTreeHash!==current.runtime.sourceTreeHash)throw new Error('Encounter replay source/lock mismatch; use the recorded checkout');
  }
  const modules=run.format==='grid-rift/autonomous-export/v0'?autonomousModules:tacticalModules;
  const engine=new Engine(run.config,modules), runner=new Runner(engine,{},hash(run.manifest),run.config.controllers,run.config.seed);
  function check(tick) {if(run.hashes[tick]?.tick!==tick||run.hashes[tick]?.hash!==engine.stateHash())throw new Error(`Encounter first divergence at tick ${tick}: expected ${run.hashes[tick]?.hash}, actual ${engine.stateHash()}`);}
  check(0);
  for(let i=0;i<run.hashes.length-1;i++) {
    for(const input of run.inputs.filter(c=>c.receivedTick===engine.tick)) {
      const {controllerId,receivedTick,...proposal}=input;
      if(!runner.submit(controllerId,proposal).accepted)throw new Error(`Recorded input rejected at tick ${i}`);
    }
    const result=runner.step(false);
    if(canonical(run.events[i])!==canonical({tick:result.tick,events:result.events}))throw new Error(`Encounter event divergence at tick ${i}`);
    check(engine.tick);
  }
  if(engine.stateHash()!==run.finalHash||canonical(engine.snapshot().terminal)!==canonical(run.terminal))throw new Error('Encounter result mismatch');
  return {ticks:engine.tick,finalHash:engine.stateHash(),terminal:engine.snapshot().terminal};
}
if(process.argv[1]?.endsWith('replay-encounter.mjs')) {
  try {if(!process.argv[2])throw new Error('Usage: npm run replay:encounter -- <export.json>');console.log(JSON.stringify(replayEncounter(JSON.parse(readFileSync(process.argv[2],'utf8')))));}
  catch(error){console.error(error.message);process.exitCode=1;}
}
