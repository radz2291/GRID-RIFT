import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {Engine} from '../dist/src/core/engine.js';
import {Runner} from '../dist/src/runner/runner.js';
import {hash} from '../dist/src/core/data.js';
import {sourceIdentity} from '../dist/src/runner/runtime.js';
import {autonomousConfig,autonomousPolicies} from '../dist/src/game/autonomous.js';
import {autonomousModules} from '../dist/src/modules/autonomy.js';
import {utilityPolicy} from '../dist/src/agents/tactical.js';
const variant=process.argv[2]??'crossing',config=autonomousConfig(variant);
const policies={...autonomousPolicies(),p1:utilityPolicy};
const content={...JSON.parse(readFileSync('fixtures/autonomous-crossing.json','utf8')),id:`003-autonomous-crossing-headless-${variant}`,version:'0.1.0',modules:config.modules,
  controllers:config.controllers.map(c=>({...c,policyId:policies[c.id].identity.id,policyVersion:policies[c.id].identity.version}))};
const manifest={runId:`autonomous-${variant}-${Date.now()}`,schemaVersion:'0.1.0',apiVersion:'grid-rift/v0',experimentId:content.id,
  experimentVersion:content.version,experimentHash:hash(content),expandedConfiguration:content,seed:config.seed,...sourceIdentity(),
  modules:config.modules.map(({id,version})=>({id,version})),controllers:config.controllers.map(c=>({id:c.id,policyId:policies[c.id].identity.id,policyVersion:policies[c.id].identity.version,budget:c.budget})),evaluationVersion:'crossing-drill/0.1.0',inputMode:'policy-rerun'};
const engine=new Engine(config,autonomousModules),runner=new Runner(engine,policies,hash(manifest),config.controllers,config.seed);
const hashes=[{tick:0,hash:engine.stateHash()}],events=[];
const submit=runner.submit('p1',{actorId:'body-p1',sequence:0,observedTick:0,executeTick:0,action:{kind:'command.order',version:'0.1.0',payload:{unitId:'body-a1',generation:0,orderId:'demo-crossing',revision:1,kind:'secure',target:{x:40,z:30},risk:'balanced',expiresTick:1200}}});
if(!submit.accepted)throw new Error(`Demo initial order rejected: ${submit.reason}`);
while(engine.snapshot().terminal.kind==='running') {
 const result=runner.step();events.push({tick:result.tick,events:result.events});hashes.push({tick:engine.tick,hash:engine.stateHash()});
}
const run={format:'grid-rift/autonomous-export/v0',manifest,config,inputs:runner.inputJournal,admissions:runner.admissionJournal,observations:runner.observationJournal,events,hashes,checkpoint:runner.checkpoint(),terminal:engine.snapshot().terminal,finalHash:engine.stateHash()};
const directory=resolve('runs',manifest.runId);mkdirSync(directory,{recursive:true});writeFileSync(resolve(directory,'encounter.json'),JSON.stringify(run,null,2));
console.log(JSON.stringify({path:resolve(directory,'encounter.json'),ticks:engine.tick,terminal:run.terminal,finalHash:run.finalHash,source:manifest.sourceCommit}));
