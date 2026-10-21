import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createAutonomousGame,autonomousConfig,autonomousPolicies} from '../../dist/src/game/autonomous.js';
import {autonomousModules} from '../../dist/src/modules/autonomy.js';
import {Engine} from '../../dist/src/core/engine.js';
import {Runner} from '../../dist/src/runner/runner.js';
import {replayEncounter} from '../../scripts/replay-encounter.mjs';
const self=g=>g.observe().entities.find(e=>e.id==='body-p1').components;
test('B-01/03 direct hero input stays independent of an owned unit intention',()=>{
 const game=createAutonomousGame();
 assert.equal(game.order('defend',{x:35,z:30}).accepted,true);game.tick();
 assert.equal(game.observe().world['command.owned'].orders[0].status,'pending');
 assert.equal(game.command('movement.move-to',{x:22,z:42}).accepted,true);
 for(let i=0;i<20;i++)game.tick();
 assert.ok(self(game).movement.z>30);
 assert.equal(game.observe().world['command.owned'].orders[0].kind,'defend');
 assert.equal(game.command('control.stop',{}).accepted,true);game.tick();
 assert.equal(game.command('combat.cast',{ability:'pulse',x:40,z:30}).accepted,true);game.tick();
 assert.equal(game.command('combat.cast',{ability:'pulse',x:40,z:30}).reason,'cooldown');
 assert.equal(game.order('cancel').accepted,true);game.tick();
 assert.equal(game.observe().world['command.owned'].orders[0].status,'cancelled');
 game.restart();assert.equal(game.observe().tick,0);assert.equal(game.observe().world['command.owned'].orders.length,0);
});
test('B-04 autonomous action replay verifies every tick/event and detects corruption and wrong source',()=>{
 const game=createAutonomousGame();game.order('secure',{x:40,z:30});game.tick();game.command('control.attack-move',{x:40,z:30});
 for(let i=0;i<100;i++)game.tick();
 const run=game.exportRun();assert.equal(run.format,'grid-rift/autonomous-export/v0');
 assert.equal(replayEncounter(run,false).finalHash,run.finalHash);
 assert.equal(run.manifest.experimentId,'003-autonomous-crossing');
 assert.ok(Object.keys(run.checkpoint.policyMemories).includes('a1'));
 const broken=structuredClone(run);broken.hashes[3].hash='bad';assert.throws(()=>replayEncounter(broken,false),/tick 3/);
 assert.throws(()=>replayEncounter(run,true),/source\/lock mismatch/);
});
test('B-04 policy rerun, nonzero checkpoint and mutating observer reproduce unit memory and world',()=>{
 const config=autonomousConfig(),policies=autonomousPolicies();
 const make=sink=>new Runner(new Engine(config,autonomousModules),policies,'fixed-identity',config.controllers,config.seed,sink);
 const a=make(),b=make(o=>{o.entities.length=0;});
 const proposal={actorId:'body-p1',sequence:0,observedTick:0,executeTick:0,action:{kind:'command.order',version:'0.1.0',payload:{unitId:'body-a1',generation:0,orderId:'test',revision:1,kind:'secure',target:{x:40,z:30},risk:'balanced',expiresTick:500}}};
 assert.equal(a.submit('p1',proposal).accepted,true);assert.equal(b.submit('p1',proposal).accepted,true);
 for(let i=0;i<28;i++){a.step();b.step();assert.equal(a.engine.stateHash(),b.engine.stateHash());}
 const checkpoint=a.checkpoint();assert.ok(checkpoint.policyMemories.a1);
 const c=make();c.restore(checkpoint);
 for(let i=0;i<28;i++){a.step();c.step();assert.equal(a.engine.stateHash(),c.engine.stateHash());assert.deepEqual(a.checkpoint().policyMemories,c.checkpoint().policyMemories);}
});
test('B-04 identical body and budget survive policy replacement; unknown identities fail clearly',()=>{
 const config=autonomousConfig(),other=autonomousConfig('crossing','autonomy.steady');assert.deepEqual(config,other);
 assert.equal(autonomousPolicies().a1.identity.id,'autonomy.responsive');assert.equal(autonomousPolicies('autonomy.steady').a1.identity.id,'autonomy.steady');
 assert.deepEqual(new Engine(config,autonomousModules).snapshot(),new Engine(other,autonomousModules).snapshot());
 assert.throws(()=>autonomousConfig('unknown'),/variant/);assert.throws(()=>autonomousConfig('crossing','unknown'),/policy/);
 const runner=new Runner(new Engine(config,autonomousModules),autonomousPolicies(),'responsive',config.controllers,config.seed);
 const replacement=new Runner(new Engine(other,autonomousModules),autonomousPolicies('autonomy.steady'),'steady',other.controllers,other.seed);
 assert.throws(()=>replacement.restore(runner.checkpoint()),/identity mismatch/);
});
test('B-06 actual browser simulation bundle and Node agree for orders and hero control',async()=>{
 mkdirSync('runs/stage3-browser-unit',{recursive:true});
 await build({entryPoints:['src/game/autonomous.ts'],bundle:true,platform:'browser',format:'esm',outfile:'runs/stage3-browser-unit/session.mjs',alias:{'node:crypto':resolve('src/adapters/hash-browser.ts')}});
 const {createAutonomousGame:browserCreate}=await import('../../runs/stage3-browser-unit/session.mjs?parity');
 const node=createAutonomousGame(),browser=browserCreate();
 for(let t=0;t<32;t++){
  if(t===0){node.order('follow');browser.order('follow');}
  if(t===4){node.command('movement.move-to',{x:22,z:42});browser.command('movement.move-to',{x:22,z:42});}
  if(t===20){node.order('defend',{x:35,z:30},'cautious');browser.order('defend',{x:35,z:30},'cautious');}
  node.tick();browser.tick();assert.equal(node.exportRun().finalHash,browser.exportRun().finalHash,`tick ${t}`);
 }
});
