import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Engine } from '../../dist/src/core/engine.js';
import { canonical, hash, nextRandom, streamSeed } from '../../dist/src/core/data.js';
import { resolveModules } from '../../dist/src/core/registry.js';
import { raceModule } from '../../dist/src/modules/fixture-race.js';

const base=JSON.parse(readFileSync(new URL('../../fixtures/stage0.json',import.meta.url),'utf8'));
function config(change=()=>{}) {
  const c=structuredClone(base); delete c.id; delete c.version;
  c.controllers=c.controllers.map(({id,actors,budget})=>({id,actors,budget}));
  change(c); return c;
}
const make=(change)=>new Engine(config(change),[raceModule]);
const cmd=(tick=0,id='a',sequence=tick,delta=1)=>({controllerId:id,receivedTick:tick,actorId:`body-${id}`,sequence,observedTick:Math.max(0,tick-1),executeTick:tick,action:{kind:'fixture.move',version:'0.1.0',payload:{delta}}});
const ready=(tick=0,id='a',sequence=tick,delta=1)=>({...cmd(tick,id,sequence,delta),observedTick:tick,executeTick:tick+1});

test('canonical SHA256 sorts keys, preserves arrays, normalizes -0 and rejects invalid JSON',()=>{
  assert.equal(canonical({b:1,a:-0}),'\u007b"a":0,"b":1\u007d');
  assert.equal(hash({a:1,b:[2,3]}),hash({b:[2,3],a:1}));
  assert.notEqual(hash([2,3]),hash([3,2]));
  assert.equal(hash({}), '44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a');
  for(const value of [NaN,Infinity,undefined,{x:undefined},[undefined],new Date()]) assert.throws(()=>canonical(value));
  const cyclic={};cyclic.self=cyclic;assert.throws(()=>canonical(cyclic));
});
test('PRNG known vectors and independently named seeded streams',()=>{
  let state=1; const values=[]; for(let i=0;i<5;i++){state=nextRandom(state);values.push(state);}
  assert.deepEqual(values,[270369,67634689,2647435461,307599695,2398689233]);
  assert.equal(streamSeed(0,'world'),streamSeed(0,'world'));
  assert.notEqual(streamSeed(0,'world'),streamSeed(0,'combat'));
});
test('S0-01 fixed-action runs have equal hashes every tick and journal order',()=>{
  const a=make(),b=make(); a.step([]); b.step([]);
  for(let t=1;t<9;t++){
    const commands=[cmd(t,'b',t,0),cmd(t,'a',t,1)];
    assert.deepEqual(a.step(commands),b.step([...commands].reverse()));
    assert.equal(a.stateHash(),b.stateHash());
  }
  assert.equal(a.snapshot().terminal.kind,'finished');
});
test('S0-02 nonzero world snapshot restores exact continuation',()=>{
  const a=make();a.step([]);a.step([cmd(1)]);a.step([cmd(2)]);
  const snapshot=a.snapshot(),b=make();b.restore(snapshot);
  for(let t=3;t<10;t++){assert.deepEqual(a.step([cmd(t)]),b.step([cmd(t)]));assert.equal(a.stateHash(),b.stateHash());}
});
test('observations and snapshots cannot mutate engine state',()=>{
  const engine=make(); const before=engine.stateHash();
  const observation=engine.observe('a');observation.entities[0].components.position=999;
  engine.snapshot().moduleStates['fixture.race'].secret=0;
  assert.equal(engine.stateHash(),before);
});
test('S0-05 hidden position/secret/random state does not change permitted observation or receipts',()=>{
  const a=make(c=>c.modules[0].config.goal=12),b=make(c=>c.modules[0].config.goal=12);
  const first=a.snapshot(),second=b.snapshot();
  first.moduleStates['fixture.race'].positions['body-b']=10;
  second.moduleStates['fixture.race'].positions['body-b']=11;
  second.moduleStates['fixture.race'].secret+=1;
  a.restore(first);b.restore(second);
  assert.deepEqual(a.observe('a'),b.observe('a'));
  a.step([]);b.step([]);
  const bad={...cmd(1),action:{kind:'fixture.move',version:'0.1.0',payload:{delta:99}}};
  a.step([bad]);b.step([bad]);
  assert.deepEqual(a.observe('a'),b.observe('a'));
  assert.equal(a.snapshot().terminal.kind,'running');
  assert.equal(a.observe('a').receipts[0].result,'rejected');
});
test('hidden evaluator event counts do not leak local event ids',()=>{
  const module={...raceModule,eventKinds:[...raceModule.eventKinds,'hidden'],advance(state,commands,config,context){
    if(state.secret%2)context.emit('hidden',{}, {kind:'evaluator-only'});
    return raceModule.advance(state,commands,config,context);
  }};
  const a=new Engine(config(),[module]),b=new Engine(config(),[module]);
  const snap=b.snapshot();snap.moduleStates['fixture.race'].secret+=1;b.restore(snap);
  a.step([]);b.step([]);a.step([cmd(1)]);b.step([cmd(1)]);
  assert.deepEqual(a.observe('a'),b.observe('a'));
});
test('S0-06 admission rejects malformed, forged, nonfinite, oversized, unknown actions and windows',()=>{
  const e=make();
  for(const input of [null,{}, {...ready(),action:{kind:'fixture.move',version:'0.1.0',payload:{delta:NaN}}}, {...ready(),actorId:'body-b'}, {...ready(),executeTick:999}, {...ready(),observedTick:2}, {...ready(),executeTick:0}, {...ready(),receivedTick:4}, {...ready(),action:{kind:'bad',version:'0.1.0',payload:{}}}, {...ready(),action:{kind:'fixture.move',version:'0.1.0',payload:{delta:0,extra:true}}}, {...ready(),actorId:'x'.repeat(20000)}]) assert.ok(e.checkCommand(input),JSON.stringify(input));
  assert.equal(e.checkCommand(ready()),null);
  e.step([]);e.step([]);assert.equal(e.checkCommand(ready()),'late');
});
test('S0-06 duplicate, rate and unauthorized execution rejected without stronger actions',()=>{
  const e=make();e.step([]);
  e.step([cmd(1),cmd(1),cmd(1,'a',2),{...cmd(1,'b'),actorId:'body-a'}]);
  const reasons=e.observe('a').receipts.map(r=>r.reason);
  assert.deepEqual(reasons,['accepted','duplicate-sequence','rate-limit']);
  assert.equal(e.snapshot().moduleStates['fixture.race'].positions['body-a'],1);
  assert.equal(e.observe('b').receipts[0].reason,'unauthorized');
  e.step([cmd(2,'a',1)]);assert.equal(e.observe('a').receipts[0].reason,'duplicate-sequence');
});
test('S0-07 simultaneous arrivals draw regardless of input order; terminal idempotence',()=>{
  const c=config(v=>v.modules[0].config.goal=1),a=new Engine(c,[raceModule]),b=new Engine(c,[raceModule]);
  a.step([]);b.step([]);
  a.step([cmd(1,'a'),cmd(1,'b')]);b.step([cmd(1,'b'),cmd(1,'a')]);
  assert.equal(a.snapshot().terminal.kind,'draw');assert.equal(a.stateHash(),b.stateHash());
  const before=a.stateHash();a.step([cmd(2)]);assert.equal(a.stateHash(),before);
});
test('registry rejects unimplemented, version, unknown config, duplicates, ownership and cycles',()=>{
  const selected=config().modules;
  assert.throws(()=>resolveModules([{...selected[0],id:'world.planar'}],[raceModule]),/Unimplemented/);
  assert.throws(()=>resolveModules([{...selected[0],version:'9.0.0'}],[raceModule]),/version/);
  assert.throws(()=>resolveModules([{...selected[0],config:{...selected[0].config,extra:1}}],[raceModule]),/config/);
  assert.throws(()=>resolveModules([...selected,...selected],[raceModule]),/Duplicate/);
  const module=(id,deps=[],writes=[id])=>({...raceModule,descriptor:{...raceModule.descriptor,id,dependencies:deps.map(id=>({id,version:'0.1.0'})),writes},actions:[]});
  const select=id=>({...selected[0],id});
  assert.throws(()=>resolveModules([select('x'),select('y')],[module('x',['y']),module('y',['x'])]),/cycle/);
  assert.throws(()=>resolveModules([select('x')],[module('x',['y'])]),/dependency/);
  assert.throws(()=>resolveModules([select('x'),select('y')],[module('x',[],['same']),module('y',[],['same'])]),/ownership/);
});
test('module ordering uses phase, dependency and stable ID independent of registration order',()=>{
  const module=(id,phase,deps=[])=>({...raceModule,descriptor:{...raceModule.descriptor,id,phase,dependencies:deps.map(id=>({id,version:'0.1.0'})),writes:[id]},actions:[]});
  const modules=[module('z','input'),module('a','resolve',['b']),module('b','resolve'),module('c','resolve'),module('d','termination')];
  const selections=modules.map(m=>({...config().modules[0],id:m.descriptor.id}));
  assert.deepEqual(resolveModules(selections.reverse(),modules.reverse()).map(m=>m.selection.id),['z','b','a','c','d']);
});
test('invalid module state throws and failed step rolls back random state/events/world',()=>{
  const broken={...raceModule,advance(state,commands,config,context){context.random('combat');return {...state,secret:Infinity};}};
  const e=new Engine(config(),[broken]),before=e.stateHash();assert.throws(()=>e.step([]));assert.equal(e.stateHash(),before);
});
test('snapshot schema and configuration mismatches fail without mutation',()=>{
  const e=make(),before=e.stateHash();
  for(const mutate of [s=>s.tick=-1,s=>s.moduleStates['fixture.race'].secret='bad',s=>s.randomStates.bad=0,s=>s.pendingEffects.push({x:1}),s=>s.idAllocatorState.configHash='bad',s=>s.idAllocatorState.sequences.a=-3,s=>s.terminal={kind:'unknown'}]) {
    const snapshot=e.snapshot();mutate(snapshot);assert.throws(()=>e.restore(snapshot));assert.equal(e.stateHash(),before);
  }
});
test('core has no two-team or one-body assumption',()=>{
  const e=make(c=>{
    c.controllers.push({id:'c',actors:['body-c','body-d'],budget:{decisionIntervalTicks:1,reactionTicks:1,actionLimitPerTick:2}});
  });
  e.step([]);e.step([{...cmd(1,'c',0),actorId:'body-c'},{...cmd(1,'c',1),actorId:'body-d'}]);
  assert.deepEqual(e.observe('c').controlledEntityIds,['body-c','body-d']);
  assert.equal(e.snapshot().moduleStates['fixture.race'].positions['body-c'],1);
  assert.equal(e.snapshot().moduleStates['fixture.race'].positions['body-d'],1);
});
test('numeric and unknown configuration fields fail runtime startup',()=>{
  for(const edit of [c=>c.seed=-1,c=>c.controllers[0].budget.extra=true,c=>c.modules[0].unexpected=true,c=>c.tickRateHz=0,c=>c.controllers.push(structuredClone(c.controllers[0]))]) assert.throws(()=>make(edit));
});
