import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Runner } from '../../dist/src/runner/runner.js';
import { Engine } from '../../dist/src/core/engine.js';
import { hash } from '../../dist/src/core/data.js';
import { raceModule } from '../../dist/src/modules/fixture-race.js';
import { configuration, createRunner, loadFixture, makeManifest } from '../../dist/src/runner/runtime.js';
import { demo, replay } from '../../dist/src/adapters/headless/cli.js';
import {idlePolicy,stepPolicy} from '../../dist/src/agents/baselines.js';
import {summarize} from '../../dist/src/evaluation/summary.js';
const fixture=()=>loadFixture('fixtures/stage0.json');
const proposal=(overrides={})=>({actorId:'body-a',sequence:0,observedTick:0,executeTick:2,action:{kind:'fixture.move',version:'0.1.0',payload:{delta:1}},...overrides});
const runner=(policies={},sink)=>{const f=fixture();return new Runner(new Engine(configuration(f),[raceModule]),policies,'test-manifest',f.controllers,f.seed,sink);};

test('authenticated submission rejects spoofing, duplicates, rate limits, malformed and late input',()=>{
  const r=runner();
  assert.equal(r.submit('a',proposal({controllerId:'b'})).accepted,false);
  assert.equal(r.submit('b',proposal()).accepted,false);
  assert.equal(r.submit('a',proposal()).accepted,true);
  assert.equal(r.submit('a',proposal()).accepted,false);
  assert.equal(r.submit('a',proposal({sequence:1})).accepted,false);
  assert.equal(r.submit('a',{sequence:NaN}).accepted,false);
  assert.equal(r.admissionJournal.at(-1).proposal,null);
  r.step(false);r.step(false);r.step(false);
  assert.equal(r.submit('a',proposal({sequence:2})).accepted,false);
  assert.ok(r.observe('a').receipts.some(r=>r.result==='expired'));
  assert.deepEqual(r.observe('b').receipts,[]);
});

test('full checkpoint continues pending queue, policy memory and decision schedule',()=>{
  const f=fixture();const manifest=makeManifest(f,'test');const first=createRunner(f,manifest);
  first.step();first.step();const checkpoint=first.checkpoint();
  assert.ok(checkpoint.runnerState.queue.length>0);
  const second=createRunner(f,manifest);second.restore(checkpoint);
  while(first.engine.snapshot().terminal.kind==='running') {
    assert.deepEqual(second.step(),first.step());
    assert.equal(second.engine.stateHash(),first.engine.stateHash());
    assert.deepEqual(second.checkpoint(),first.checkpoint());
  }
  const before=hash(first.checkpoint());first.step();assert.equal(hash(first.checkpoint()),before);
  assert.throws(()=>second.restore({...checkpoint,manifestHash:'wrong'}),/identity/);
});

test('no-policy checkpoint and controller-private rejection receipts restore',()=>{
  const r=runner();r.step(false);r.submit('a',proposal({sequence:4,observedTick:1,executeTick:0}));
  const c=r.checkpoint();const restored=runner();restored.restore(c);
  assert.deepEqual(restored.observe('a'),r.observe('a'));
  assert.deepEqual(restored.observe('b').receipts,[]);
  assert.deepEqual(restored.step(false),r.step(false));
  const bad=structuredClone(c);bad.runnerState.queue=[{garbage:true}];assert.throws(()=>restored.restore(bad));
});

test('async, failed policies and mutating or throwing observers cannot alter world state',()=>{
  const control=runner();const noisy=runner({a:{identity:{id:'async',version:'1',determinism:'record-actions-only'},initialMemory:()=>null,decide:()=>Promise.resolve({actions:[],nextMemory:null})}},observation=>{observation.world.tampered=true;throw Error('sink');});
  for(let i=0;i<3;i++){control.step();noisy.step();assert.equal(control.engine.stateHash(),noisy.engine.stateHash());}
  assert.ok(noisy.diagnostics.includes('0:a:async-policy-no-op'));
  assert.ok(noisy.diagnostics.includes('0:observer-error'));
});

test('active policies produce identical per-tick hashes with a mutating throwing observer',()=>{
  const clean=runner({a:stepPolicy,b:idlePolicy});
  const noisy=runner({a:stepPolicy,b:idlePolicy},observation=>{observation.world.corrupt=true;observation.entities.splice(0);throw Error('observer');});
  while(clean.engine.snapshot().terminal.kind==='running') {
    assert.deepEqual(noisy.step(),clean.step());assert.equal(noisy.engine.stateHash(),clean.engine.stateHash());
  }
  assert.deepEqual(noisy.observationJournal,clean.observationJournal);
  assert.ok(noisy.inputJournal.length>0);
});

test('swapping policy identity changes behavior and manifest while retaining body and core configuration',()=>{
  const active=fixture();const idle=structuredClone(active);idle.controllers[0].policyId=idlePolicy.identity.id;
  assert.deepEqual(configuration(active),configuration(idle));
  const activeManifest=makeManifest(active,'swap');const idleManifest=makeManifest(idle,'swap');
  assert.notEqual(hash(activeManifest),hash(idleManifest));
  assert.notEqual(activeManifest.controllers[0].policyId,idleManifest.controllers[0].policyId);
  const a=createRunner(active,activeManifest);const b=createRunner(idle,idleManifest);
  while(a.engine.snapshot().terminal.kind==='running') a.step();
  while(b.engine.snapshot().terminal.kind==='running') b.step();
  assert.notDeepEqual(a.engine.snapshot().terminal,b.engine.snapshot().terminal);
});

test('loader rejects unknown fields, policies, versions and specification-only modules',()=>{
  for(const path of ['000-vertical-slice','001-tactical-combat','002-control-field']) assert.throws(()=>loadFixture(`experiments/${path}.json`),/Unimplemented module: world.planar/);
  const dir=mkdtempSync(join(tmpdir(),'grid-fixture-'));const path=join(dir,'fixture.json');
  for(const edit of [f=>f.unknown=true,f=>f.controllers[0].policyVersion='9.0.0',f=>f.modules[0].id='world.planar',f=>f.modules[0].config.goal='oops']) {
    const f=fixture();edit(f);writeFileSync(path,JSON.stringify(f));assert.throws(()=>loadFixture(path));
  }
});

test('recorded admitted-action replay matches every hash and event; first corruption fails',()=>{
  const parent=mkdtempSync(join(tmpdir(),'grid-run-'));const dir=demo('fixtures/stage0.json',join(parent,'run'));
  const result=replay(dir);const report=JSON.parse(readFileSync(join(dir,'report.json'),'utf8'));
  assert.equal(result.finalHash,report.finalHash);
  const eventJournal=readFileSync(join(dir,'events.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
  assert.deepEqual(JSON.parse(readFileSync(join(dir,'metrics.json'),'utf8')),summarize(eventJournal.flatMap(row=>row.events),report.terminal));
  const checkpoint=JSON.parse(readFileSync(join(dir,'checkpoint.json'),'utf8'));
  assert.ok(checkpoint.world.tick>0);
  const manifest=JSON.parse(readFileSync(join(dir,'manifest.json'),'utf8'));
  const continued=createRunner(fixture(),manifest);continued.restore(checkpoint);
  while(continued.engine.snapshot().terminal.kind==='running') continued.step();
  assert.equal(continued.engine.stateHash(),report.finalHash);
  const path=join(dir,'hashes.jsonl');const records=readFileSync(path,'utf8').trim().split('\n').map(JSON.parse);records[2].hash='corrupt';writeFileSync(path,records.map(JSON.stringify).join('\n')+'\n');
  assert.throws(()=>replay(dir),/first hash mismatch at tick 2/);
});
