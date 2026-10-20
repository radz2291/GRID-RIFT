import specification from '../../experiments/000-vertical-slice.json' with {type:'json'};
import envelope from '../../contracts/experiment.schema.json' with {type:'json'};
import { Ajv2020 } from 'ajv/dist/2020.js';
import type { ActionProposal, JsonObject, Observation } from '../../contracts/agent-interface.js';
import type { DomainEvent, RunManifest, TerminalResult } from '../../contracts/simulation-interface.js';
import type { SimulationConfig } from '../core/types.js';
import type { TacticalEntity, TacticalWorld } from '../../contracts/tactical-types.js';
import { Engine } from '../core/engine.js';
import { clone, hash } from '../core/data.js';
import { Runner } from '../runner/runner.js';
import { tacticalModules } from '../modules/tactical/index.js';
import { utilityPolicy } from '../agents/tactical.js';

declare const __BUILD_INFO__: {sourceCommit:string;dirtyTreeFingerprint:string|null;dependencyLockHash:string;runtime:JsonObject};
const validate = new Ajv2020({strict:true,allErrors:true}).compile(envelope);
export type EncounterSpecification = typeof specification;
export function encounterConfig(spec: EncounterSpecification = specification):SimulationConfig {
  if(!validate(spec))throw new Error('Invalid encounter specification');
  if(spec.id!=='000-vertical-slice'||spec.apiVersion!=='grid-rift/v0'||spec.participants.length!==2 || spec.participants.some((p,i)=>p.id!==`p${i+1}`||p.archetypeId!=='runner'||p.teamId!==['alpha','beta'][i]) || spec.participants[1]!.controller.policyId!=='baseline.utility'||spec.participants[1]!.controller.policyVersion!=='0.1.0') throw new Error('Unsupported encounter content or policy');
  return {seed:spec.seed,tickRateHz:spec.timing.tickRateHz,maxTicks:spec.timing.maxTicks,maxCommandLeadTicks:spec.timing.maxCommandLeadTicks,maxCommandAgeTicks:spec.timing.maxCommandAgeTicks,controllers:spec.participants.map(p=>({id:p.id,actors:[`body-${p.id}`],budget:{decisionIntervalTicks:p.controller.decisionIntervalTicks,reactionTicks:p.controller.reactionTicks,actionLimitPerTick:p.controller.actionLimitPerTick}})),modules:clone(spec.modules)};
}
export interface GameSession {
  readonly timing: {tickRateHz:number};
  observe():Observation;
  tick():void;
  command(kind:string,payload:JsonObject):{accepted:boolean;reason:string};
  discardInput():void;
  terminal():TerminalResult;
  restart():void;
  exportRun():unknown;
}
export function createGame(browserMetadata:JsonObject={}):GameSession {
  const config=encounterConfig();
  const build=typeof __BUILD_INFO__!=='undefined'?__BUILD_INFO__:{sourceCommit:'headless-test',dirtyTreeFingerprint:null,dependencyLockHash:'headless-test',runtime:{}};
  let engine:Engine,runner:Runner,manifest:RunManifest,sequence=0,pending:ActionProposal|null=null;
  let events:{tick:number;events:readonly DomainEvent[]}[]=[],hashes:{tick:number;hash:string}[]=[];
  function restart() {
    engine=new Engine(config,tacticalModules);
    manifest={runId:`encounter-${Date.now()}`,schemaVersion:'0.1.0',apiVersion:'grid-rift/v0',experimentId:specification.id,experimentVersion:specification.version,experimentHash:hash(specification),expandedConfiguration:clone(specification) as unknown as JsonObject,seed:config.seed,sourceCommit:build.sourceCommit,dirtyTreeFingerprint:build.dirtyTreeFingerprint,dependencyLockHash:build.dependencyLockHash,runtime:{...build.runtime,...browserMetadata},modules:config.modules.map(({id,version})=>({id,version})),controllers:specification.participants.map(p=>({id:p.id,policyId:p.controller.policyId,policyVersion:p.controller.policyVersion,budget:config.controllers.find(c=>c.id===p.id)!.budget})),evaluationVersion:'encounter/0.1.0',inputMode:'live'};
    runner=new Runner(engine,{p2:utilityPolicy},hash(manifest),config.controllers,config.seed);
    sequence=0;pending=null;events=[];hashes=[{tick:0,hash:engine.stateHash()}];
  }
  restart();
  return {
    timing:{tickRateHz:config.tickRateHz},restart,
    observe:()=>runner.observe('p1'),
    command(kind,payload) {
      const view=runner.observe('p1'), me=(view.entities as unknown as TacticalEntity[]).find(e=>e.id==='body-p1');
      const unit=me?.components.combat;
      if(!unit?.alive)return {accepted:false,reason:'dead'};
      if(kind==='combat.cast') {
        const ready=payload.ability==='pulse'?unit.pulseReadyTick:unit.dashReadyTick;
        if(engine.tick<ready)return {accepted:false,reason:'cooldown'};
        if(unit.windup)return {accepted:false,reason:'preparing-shot'};
      }
      if(kind==='combat.attack') {
        const target=(view.entities as unknown as TacticalEntity[]).find(e=>e.id===payload.targetId)?.components.movement;
        const body=me?.components.movement;
        const range=(view.world as unknown as TacticalWorld)['combat.runner'].basicRange;
        if(!target||!body)return {accepted:false,reason:'target-not-visible'};
        if(Math.hypot(target.x-body.x,target.z-body.z)>range)return {accepted:false,reason:'out-of-range'};
      }
      const proposal={actorId:'body-p1',sequence:sequence++,observedTick:engine.tick,executeTick:engine.tick,action:{kind,version:'0.1.0',payload:clone(payload)}};
      const reason=engine.checkCommand({...proposal,controllerId:'p1',receivedTick:engine.tick});
      if(reason)return {accepted:false,reason:kind==='movement.move-to'&&reason==='not-permitted'?'destination-blocked':reason};
      if(engine.snapshot().terminal.kind!=='running')return {accepted:false,reason:'terminal'};
      // Human sampling is at most one intent per tick. A newer intent replaces unsampled input.
      pending=proposal;
      return {accepted:true,reason:'queued'};
    },
    discardInput(){pending=null;},
    tick() {
      if(engine.snapshot().terminal.kind!=='running')return;
      if(pending) {runner.submit('p1',pending);pending=null;}
      const result=runner.step();events.push({tick:result.tick,events:result.events});hashes.push({tick:engine.tick,hash:engine.stateHash()});
    },
    terminal:()=>clone(engine.snapshot().terminal),
    exportRun:()=>clone({format:'grid-rift/encounter-export/v0',manifest,config,inputs:runner.inputJournal,admissions:runner.admissionJournal,observations:runner.observationJournal,events,hashes,checkpoint:runner.checkpoint(),terminal:engine.snapshot().terminal,finalHash:engine.stateHash()})
  };
}
