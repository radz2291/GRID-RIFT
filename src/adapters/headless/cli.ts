import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonical, hash } from '../../core/data.js';
import { configuration, createRunner, loadFixture, makeManifest, sourceIdentity } from '../../runner/runtime.js';
import { Engine } from '../../core/engine.js';
import { raceModule } from '../../modules/fixture-race.js';
import { Runner } from '../../runner/runner.js';
import { summarize } from '../../evaluation/summary.js';
import type { AuthenticatedCommand, DomainEvent, RunManifest } from '../../../contracts/simulation-interface.js';

const json = (path:string) => JSON.parse(readFileSync(path,'utf8'));
const lines = (path:string):unknown[] => readFileSync(path,'utf8').trim().split('\n').filter(Boolean).map(line=>JSON.parse(line));
const save = (dir:string, name:string,value:unknown) => writeFileSync(join(dir,name),JSON.stringify(value,null,2)+'\n');
const saveLines = (dir:string,name:string,value:unknown[]) => writeFileSync(join(dir,name),value.map(v=>JSON.stringify(v)).join('\n')+'\n');
export function demo(fixturePath='fixtures/stage0.json', output?:string):string {
  const f=loadFixture(resolve(fixturePath));
  const runId=`stage0-${Date.now()}`; const dir=resolve(output ?? join('runs',runId));
  mkdirSync(dirname(dir),{recursive:true});mkdirSync(dir,{recursive:false});
  const manifest=makeManifest(f,runId); const runner=createRunner(f,manifest);
  const hashes:unknown[]=[{tick:0,hash:runner.engine.stateHash()}]; const events:unknown[]=[];
  let checkpoint=runner.checkpoint();
  while(runner.engine.snapshot().terminal.kind==='running') {
    const result=runner.step();
    hashes.push({tick:runner.engine.tick,hash:runner.engine.stateHash()}); events.push({tick:result.tick,events:result.events});
    if(runner.engine.tick===Math.min(3,f.maxTicks)) checkpoint=runner.checkpoint();
  }
  save(dir,'manifest.json',manifest); saveLines(dir,'inputs.jsonl',runner.inputJournal);
  saveLines(dir,'admissions.jsonl',runner.admissionJournal);
  saveLines(dir,'observations.jsonl',runner.observationJournal);
  saveLines(dir,'events.jsonl',events); saveLines(dir,'hashes.jsonl',hashes); save(dir,'checkpoint.json',checkpoint);
  save(dir,'metrics.json',summarize((events as {events:DomainEvent[]}[]).flatMap(row=>row.events),runner.engine.snapshot().terminal));
  save(dir,'report.json',{terminal:runner.engine.snapshot().terminal,ticks:runner.engine.tick,admittedCommands:runner.inputJournal.length,pendingCommands:runner.checkpoint().runnerState.queue,diagnostics:runner.diagnostics,finalHash:runner.engine.stateHash(),fixtureOnly:true});
  return dir;
}
export function replay(directory:string):{ticks:number;finalHash:string} {
  const dir=resolve(directory); const manifest=json(join(dir,'manifest.json')) as RunManifest;
  const identity=sourceIdentity();
  for(const key of ['sourceCommit','dirtyTreeFingerprint','dependencyLockHash','runtime'] as const) if(canonical(manifest[key])!==canonical(identity[key])) throw new Error(`Replay identity mismatch: ${key}`);
  const f=manifest.expandedConfiguration as unknown as import('../../runner/runtime.js').Fixture;
  if(manifest.schemaVersion!=='0.1.0'||manifest.apiVersion!=='grid-rift/v0'||manifest.seed!==f.seed||manifest.evaluationVersion!=='stage0/0.1.0'||hash(manifest.controllers)!==hash(f.controllers.map(({id,policyId,policyVersion,budget})=>({id,policyId,policyVersion,budget})))) throw new Error('Replay manifest identity mismatch');
  if(hash(f)!==manifest.experimentHash || f.id!==manifest.experimentId || f.version!==manifest.experimentVersion || hash(f.modules.map(({id,version})=>({id,version})))!==hash(manifest.modules)) throw new Error('Replay experiment/module identity mismatch');
  const engine=new Engine(configuration(f),[raceModule]);
  const runner=new Runner(engine,{},hash(manifest),configuration(f).controllers,f.seed);
  const inputs=lines(join(dir,'inputs.jsonl')) as AuthenticatedCommand[];
  const hashes=lines(join(dir,'hashes.jsonl')) as {tick:number;hash:string}[];
  const events=lines(join(dir,'events.jsonl')) as {tick:number;events:unknown[]}[];
  const compare=(tick:number) => {const expected=hashes[tick];if(!expected || expected.tick!==tick || engine.stateHash()!==expected.hash)throw new Error(`Replay first hash mismatch at tick ${tick}: expected ${expected?.hash ?? 'missing'}, actual ${engine.stateHash()}, modules ${manifest.modules.map(m=>m.id).join(',')}`);};
  compare(0);
  while(engine.snapshot().terminal.kind==='running') {
    const tick=engine.tick;
    for(const input of inputs.filter(c=>c.receivedTick===tick)) {
      const {controllerId,receivedTick,...proposal}=input;
      if(!runner.submit(controllerId,proposal).accepted) throw new Error(`Replay invalid admitted command at tick ${tick}`);
    }
    const result=runner.step(false);
    if(canonical(events[tick])!==canonical({tick:result.tick,events:result.events})) throw new Error(`Replay first event mismatch at tick ${tick}`);
    compare(engine.tick);
  }
  if(hashes.length!==engine.tick+1 || events.length!==engine.tick || inputs.some(c=>!Number.isSafeInteger(c.receivedTick) || c.receivedTick<0 || c.receivedTick>=engine.tick)) throw new Error('Replay trailing or missing records');
  return {ticks:engine.tick,finalHash:engine.stateHash()};
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try { if(process.argv[2]==='replay') {if(!process.argv[3]) throw new Error('Usage: replay <run-directory>');console.log(JSON.stringify(replay(process.argv[3])));} else console.log(demo(process.argv[3])); }
  catch(error) {console.error(error instanceof Error?error.message:String(error));process.exitCode=1;}
}
