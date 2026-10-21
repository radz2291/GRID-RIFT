import specification from '../../experiments/000-vertical-slice-facing.json' with {type:'json'};
import envelope from '../../contracts/experiment.schema.json' with {type:'json'};
import { Ajv2020 } from 'ajv/dist/2020.js';
import type { ActionIntent, AgentPolicy, JsonObject, Observation } from '../../contracts/agent-interface.js';
import type { DomainEvent, RunManifest, TerminalResult } from '../../contracts/simulation-interface.js';
import type { RuntimeModule, SimulationConfig } from '../core/types.js';
import type { TacticalEntity } from '../../contracts/tactical-types.js';
import { Engine } from '../core/engine.js';
import { clone, hash } from '../core/data.js';
import { Runner } from '../runner/runner.js';
import { tacticalModules } from '../modules/tactical/index.js';
import { utilityPolicy } from '../agents/tactical.js';
import { initialHumanOrder, planHumanOrder, type HumanOrderState } from '../agents/human-orders.js';

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
export interface SessionDefinition {
  config:SimulationConfig; modules:RuntimeModule[]; policies:Record<string,AgentPolicy>;
  content:JsonObject; id:string; version:string; format:string; evaluationVersion:string;
  policyIdentities:Record<string,{id:string;version:string}>;
}
export function createGame(browserMetadata:JsonObject={}):GameSession {
  return createGameSession({config:encounterConfig(),modules:tacticalModules,policies:{p2:utilityPolicy},content:clone(specification) as unknown as JsonObject,id:specification.id,version:specification.version,format:'grid-rift/encounter-export/v0',evaluationVersion:'encounter/0.3.0',policyIdentities:Object.fromEntries(specification.participants.map(p=>[p.id,{id:p.controller.policyId,version:p.controller.policyVersion}]))},browserMetadata);
}
/** Composition adapter only: independent controllers still use the unchanged Runner and Engine. */
export function createGameSession(definition:SessionDefinition,browserMetadata:JsonObject={}):GameSession {
  const {config}=definition;
  const build=typeof __BUILD_INFO__!=='undefined'?__BUILD_INFO__:{sourceCommit:'headless-test',dirtyTreeFingerprint:null,dependencyLockHash:'headless-test',runtime:{}};
  let engine:Engine,runner:Runner,manifest:RunManifest,sequence=0,pending:ActionIntent|null=null;
  let human:HumanOrderState=initialHumanOrder();
  let humanOrders:{tick:number;kind:string;payload:JsonObject}[]=[];
  let events:{tick:number;events:readonly DomainEvent[]}[]=[],hashes:{tick:number;hash:string}[]=[];
  function restart() {
    engine=new Engine(config,definition.modules);
    manifest={runId:`encounter-${Date.now()}`,schemaVersion:'0.1.0',apiVersion:'grid-rift/v0',experimentId:definition.id,experimentVersion:definition.version,experimentHash:hash(definition.content),expandedConfiguration:clone(definition.content),seed:config.seed,sourceCommit:build.sourceCommit,dirtyTreeFingerprint:build.dirtyTreeFingerprint,dependencyLockHash:build.dependencyLockHash,runtime:{...build.runtime,...browserMetadata},modules:config.modules.map(({id,version})=>({id,version})),controllers:config.controllers.map(p=>({id:p.id,policyId:definition.policyIdentities[p.id]!.id,policyVersion:definition.policyIdentities[p.id]!.version,budget:p.budget})),evaluationVersion:definition.evaluationVersion,inputMode:'live'};
    runner=new Runner(engine,definition.policies,hash(manifest),config.controllers,config.seed);
    sequence=0;pending=null;human=initialHumanOrder();humanOrders=[];events=[];hashes=[{tick:0,hash:engine.stateHash()}];
  }
  restart();
  return {
    timing:{tickRateHz:config.tickRateHz},restart,
    observe:()=>runner.observe('p1'),
    command(kind,payload) {
      if(engine.snapshot().terminal.kind!=='running')return {accepted:false,reason:'terminal'};
      try {payload=clone(payload);}catch{return {accepted:false,reason:'invalid-action'};}
      const view=runner.observe('p1'), me=(view.entities as unknown as TacticalEntity[]).find(e=>e.id==='body-p1');
      const unit=me?.components.combat;
      if(!unit?.alive)return {accepted:false,reason:'dead'};
      if(kind==='control.stop') {
        if(Object.keys(payload).length)return {accepted:false,reason:'invalid-action'};
        pending={kind,version:'0.3.0',payload:{}};return {accepted:true,reason:'queued'};
      }
      if(kind==='combat.cast') {
        const ready=payload.ability==='pulse'?unit.pulseReadyTick:unit.dashReadyTick;
        if(engine.tick<ready)return {accepted:false,reason:'cooldown'};
        if(unit.windup)return {accepted:false,reason:'preparing-shot'};
      }
      if(kind==='combat.attack') {
        const target=(view.entities as unknown as TacticalEntity[]).find(e=>e.id===payload.targetId)?.components.movement;
        const body=me?.components.movement;
        if(!target||!body)return {accepted:false,reason:'target-not-visible'};
      }
      const checkKind=kind==='control.attack-move'?'movement.move-to':kind;
      const proposal={actorId:'body-p1',sequence,observedTick:engine.tick,executeTick:engine.tick,action:{kind:checkKind,version:'0.1.0',payload:clone(payload)}};
      const reason=engine.checkCommand({...proposal,controllerId:'p1',receivedTick:engine.tick});
      if(reason)return {accepted:false,reason:checkKind==='movement.move-to'&&reason==='not-permitted'?'destination-blocked':reason};
      if(engine.snapshot().terminal.kind!=='running')return {accepted:false,reason:'terminal'};
      // Human sampling is at most one intent per tick. A newer intent replaces unsampled input.
      pending={kind,version:'0.1.0',payload:clone(payload)};
      return {accepted:true,reason:'queued'};
    },
    discardInput(){pending=null;},
    tick() {
      if(engine.snapshot().terminal.kind!=='running')return;
      const view=runner.observe('p1');
      let action:ActionIntent|null=null;
      if(pending) {
        const order=pending;pending=null;humanOrders.push({tick:engine.tick,kind:order.kind,payload:clone(order.payload)});
        const destination={x:order.payload.x as number,z:order.payload.z as number};
        if(order.kind==='movement.move-to'){human={mode:'move',focus:null,destination};action=order;}
        else if(order.kind==='combat.attack')human={mode:'attack',focus:order.payload.targetId as string,destination:null};
        else if(order.kind==='control.attack-move')human={mode:'attack-move',focus:null,destination};
        else if(order.kind==='control.stop') {
          human={mode:'hold',focus:null,destination:null};
          const body=(view.entities as unknown as TacticalEntity[]).find(e=>e.id==='body-p1')!.components.movement!;
          action={kind:'movement.move-to',version:'0.1.0',payload:{x:body.x,z:body.z}};
        } else {action=order;if(order.payload.ability==='dash')human=initialHumanOrder();}
      }
      if(!action){const plan=planHumanOrder(view,human);human=plan.state;action=plan.action;}
      if(action)runner.submit('p1',{actorId:'body-p1',sequence:sequence++,observedTick:engine.tick,executeTick:engine.tick,action});
      const result=runner.step();events.push({tick:result.tick,events:result.events});hashes.push({tick:engine.tick,hash:engine.stateHash()});
    },
    terminal:()=>clone(engine.snapshot().terminal),
    exportRun:()=>clone({format:definition.format,manifest,config,inputs:runner.inputJournal,humanOrders,humanControllerState:{version:'0.3.0',standingOrder:human,unsampledOrder:pending},admissions:runner.admissionJournal,observations:runner.observationJournal,events,hashes,checkpoint:runner.checkpoint(),terminal:engine.snapshot().terminal,finalHash:engine.stateHash()})
  };
}
