import fixture from '../../fixtures/autonomous-crossing.json' with {type:'json'};
import type { AgentPolicy, JsonObject } from '../../contracts/agent-interface.js';
import type { CommandView, Order } from '../../contracts/autonomy.js';
import type { Point } from '../../contracts/tactical-types.js';
import type { SimulationConfig } from '../core/types.js';
import { clone } from '../core/data.js';
import { autonomousModules } from '../modules/autonomy.js';
import { subordinatePolicy, steadyPolicy } from '../agents/subordinate.js';
import { utilityPolicy } from '../agents/tactical.js';
import { createGameSession, type GameSession } from './session.js';

export type CrossingVariant = 'crossing'|'blocked-route'|'flank';
export function autonomousConfig(variant:CrossingVariant='crossing',allyPolicyId='autonomy.responsive'):SimulationConfig {
  if(!['crossing','blocked-route','flank'].includes(variant))throw new Error('Unsupported crossing variant');
  autonomousPolicies(allyPolicyId); // Fail unknown policy identities before composing the run.
  const {seed,tickRateHz,maxTicks,maxCommandLeadTicks,maxCommandAgeTicks}=fixture;
  return {seed,tickRateHz,maxTicks,maxCommandLeadTicks,maxCommandAgeTicks,
    controllers:fixture.controllers.map(({id,actors,budget})=>({id,actors:clone(actors),budget:clone(budget)})),
    modules:fixture.modules.map(m=>({id:m.id,version:m.version,config:clone(m.id==='world.planar'?{...m.config,variant}:m.config) as unknown as JsonObject}))};
}
export function autonomousPolicies(allyPolicyId='autonomy.responsive'):Record<string,AgentPolicy> {
  const ally=[subordinatePolicy,steadyPolicy].find(p=>p.identity.id===allyPolicyId);
  if(!ally)throw new Error('Unsupported autonomous policy identity');
  return {a1:ally,p2:utilityPolicy,p3:utilityPolicy};
}
export interface AutonomousGame extends GameSession {
  readonly mode:'autonomous';
  order(kind:Order['kind'],point?:Point,risk?:'balanced'|'cautious'):{accepted:boolean;reason:string};
}
export function createAutonomousGame(browserMetadata:JsonObject={},variant:CrossingVariant='crossing'):AutonomousGame {
  const config=autonomousConfig(variant),policies=autonomousPolicies();
  const version=variant==='crossing'?'0.1.0':variant==='blocked-route'?'0.1.1':'0.1.2';
  const content={...clone(fixture),version,modules:config.modules} as unknown as JsonObject;
  const policyIdentities=Object.fromEntries(fixture.controllers.map(c=>[c.id,{id:c.policyId,version:c.policyVersion}]));
  const session=createGameSession({config,modules:autonomousModules,policies,content,id:fixture.id,version,
    format:'grid-rift/autonomous-export/v0',evaluationVersion:'crossing-drill/0.1.0',policyIdentities},browserMetadata);
  let revisions:Record<string,number>={};
  return {...session,mode:'autonomous',
    restart(){session.restart();revisions={};},
    order(kind,point,risk='balanced') {
      const view=session.observe(),command=view.world['command.owned'] as unknown as CommandView;
      const grant=command.grants.find(g=>g.commanderId===view.controllerId);
      if(!grant)return {accepted:false,reason:'no-owned-unit'};
      const current=command.orders.find(o=>o.unitId===grant.unitId);
      const key=`${grant.unitId}/${grant.generation}`;
      const revision=Math.max(revisions[key]??0,current?.revision??0)+1;
      if(kind==='cancel'&&!current)return {accepted:false,reason:'no-active-order'};
      if((kind==='defend'||kind==='secure')&&!point)return {accepted:false,reason:'choose-ground'};
      const order={unitId:grant.unitId,generation:grant.generation,orderId:kind==='cancel'?current!.orderId:`order-${revision}`,revision,kind,
        ...(kind==='cancel'?{}:{target:kind==='follow'?grant.commanderActorId:point,risk,expiresTick:view.tick+1200})};
      const result=session.command('command.order',order as JsonObject);
      if(result.accepted)revisions[key]=revision;
      return result;
    },
    exportRun(){return {...session.exportRun() as object,commanderInputState:{version:'0.1.0',revisions:clone(revisions)}};}
  };
}
