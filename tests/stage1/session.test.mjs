import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { createGame } from '../../dist/src/game/session.js';
import { createHash as browserHash } from '../../dist/src/adapters/hash-browser.js';
import { replayEncounter } from '../../scripts/replay-encounter.mjs';
import { hash } from '../../dist/src/core/data.js';

test('browser SHA256 adapter produces identical native hash bytes',()=>{
  for(const value of ['','GRID-RIFT','hello 🌒',JSON.stringify({z:1,a:[0,1,5]})])assert.equal(browserHash('sha256').update(value).digest('hex'),createHash('sha256').update(value).digest('hex'));
});
test('actual browser bundle and Node simulation agree; copied reduced-effects view has no effect',async()=>{
  mkdirSync('web-dist',{recursive:true});
  await build({entryPoints:['src/game/session.ts'],bundle:true,platform:'browser',format:'esm',outfile:'web-dist/session-test.mjs',alias:{'node:crypto':resolve('src/adapters/hash-browser.ts')}});
  const {createGame:createBrowserGame}=await import('../../web-dist/session-test.mjs?test');
  const node=createGame(),browser=createBrowserGame();
  for(let t=0;t<120;t++) {
    if(t===0){node.command('movement.move-to',{x:40,z:30});browser.command('movement.move-to',{x:40,z:30});}
    if(t===30){node.command('combat.cast',{ability:'dash',x:40,z:30});browser.command('combat.cast',{ability:'dash',x:40,z:30});}
    node.tick();browser.tick();
    const cosmetic=browser.observe();cosmetic.world.palette='reduced';
    assert.equal(node.exportRun().finalHash,browser.exportRun().finalHash,`tick${t}`);
  }
});
test('session pause input discard, readable cooldown rejection, restart and action replay',()=>{
  const game=createGame();
  game.command('movement.move-to',{x:40,z:30});game.discardInput();game.tick();
  assert.equal(game.observe().entities.find(e=>e.id==='body-p1').components.movement.x,14);
  assert.equal(game.command('combat.cast',{ability:'pulse',x:40,z:30}).accepted,true);game.tick();
  assert.equal(game.command('combat.cast',{ability:'pulse',x:40,z:30}).reason,'cooldown');
  for(let t=0;t<80;t++)game.tick();
  const run=game.exportRun();assert.equal(replayEncounter(run,false).finalHash,run.finalHash);
  const broken=structuredClone(run);broken.hashes[3].hash='bad';assert.throws(()=>replayEncounter(broken,false),/tick 3/);
  const before=hash(run);game.observe().entities[0].components.bad=1;assert.equal(hash(game.exportRun()),before);
  game.restart();assert.equal(game.observe().tick,0);
});
test('idle human versus actual AI completes relay encounter without privileged input',()=>{
  const game=createGame();let ticks=0;
  while(game.terminal().kind==='running'&&ticks++<1500)game.tick();
  assert.equal(game.terminal().kind,'finished');assert.deepEqual(game.terminal().winners,['beta']);
  const run=game.exportRun();assert.equal(replayEncounter(run,false).finalHash,run.finalHash);
});
