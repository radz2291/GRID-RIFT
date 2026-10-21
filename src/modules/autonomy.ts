import type { JsonObject } from '../../contracts/agent-interface.js';
import type { ActiveOrder, Grant, Order, UnitReport } from '../../contracts/autonomy.js';
import { orderPermitted, winningOrder } from '../../contracts/autonomy.js';
import { object, identifier, tickNumber, orderSchema, transferSchema, reportSchema } from '../../contracts/autonomy-schema.js';
import type { ArenaMap, CombatUnit, MovementBody } from '../../contracts/tactical-types.js';
import type { AuthenticatedCommand } from '../../contracts/simulation-interface.js';
import type { ModuleContext, RuntimeModule } from '../core/types.js';
import { tacticalModules } from './tactical/index.js';
import { legal } from './tactical/geometry.js';

const json = (v: unknown) => v as JsonObject;
const arr = (items: unknown, maxItems = 64) => ({type:'array',items,maxItems});
const grantSchema = object({unitId:identifier,unitControllerId:identifier,commanderId:identifier,commanderActorId:identifier,generation:tickNumber});
const reportStateSchema = object({unitId:identifier,generation:tickNumber,revision:tickNumber,mode:{type:'string'},observedTick:tickNumber,deliveredTick:tickNumber,x:{type:'number'},z:{type:'number'},hp:{type:'number'},alive:{type:'boolean'}});
const activeSchema = {type:'object',additionalProperties:false,required:['unitId','generation','orderId','revision','kind','issuedTick','effectiveTick','status'],properties:{unitId:identifier,generation:tickNumber,orderId:identifier,revision:tickNumber,kind:{enum:['defend','secure','follow','cancel']},target:{anyOf:[identifier,object({x:{type:'number'},z:{type:'number'}})]},risk:{enum:['cautious','balanced']},expiresTick:tickNumber,issuedTick:tickNumber,effectiveTick:tickNumber,status:{enum:['pending','active','cancelled','expired','revoked','dead']}}};
interface State {grants:Grant[];orders:ActiveOrder[];reports:UnitReport[];reportQueue:UnitReport[];leaders:UnitReport[];leaderQueue:UnitReport[];deadLatch:string[];deliveryTicks:number;reportTicks:number}
const arena = (c:ModuleContext) => c.states['world.planar'] as unknown as ArenaMap;
const bodies = (c:ModuleContext) => (c.states['movement.planar'] as unknown as {bodies:MovementBody[]}|undefined)?.bodies??[];
const units = (c:ModuleContext) => (c.states['combat.runner'] as unknown as {units:CombatUnit[]}|undefined)?.units??[];
const alive = (id:string,c:ModuleContext) => units(c).some(u=>u.id===id&&u.alive);
function base(id:string,phase:string,dependencies:{id:string;version:string}[],configSchema:object,stateSchema:object):RuntimeModule {
  return {descriptor:{id,version:'0.1.0',apiVersion:'grid-rift/v0',dependencies,phase,reads:dependencies.map(d=>d.id),writes:[id],configurationSchemaId:`${id}/config/0.1.0`,stateSchemaId:`${id}/state/0.1.0`},configSchema,stateSchema,actions:[],eventKinds:[],initial:()=>({}),validate:()=>false,advance:s=>s,project:()=>({world:{},entities:[]})};
}
const dep = (id:string,version='0.2.0') => ({id,version});
// Reuse accepted tactical algorithms without changing their historical registry or actions.
const cloned = tacticalModules.filter(m=>!['rules.relay-score'].includes(m.descriptor.id)).map(m=>({...m,descriptor:{...m.descriptor,version:'0.2.0',dependencies:m.descriptor.dependencies.map(d=>({...d,version:'0.2.0'})),configurationSchemaId:`${m.descriptor.id}/config/0.2.0`,stateSchemaId:`${m.descriptor.id}/state/0.2.0`}}));
const world = cloned.find(m=>m.descriptor.id==='world.planar')!;
world.configSchema = object({width:{const:80},depth:{const:60},layout:{const:'autonomous-crossing'},variant:{enum:['crossing','blocked-route','flank']}});
world.initial = (cfg,c) => {
  if(c.controllers.length!==4||['p1','a1','p2','p3'].some(id=>!c.controllers.some(p=>p.id===id&&p.actors.length===1&&p.actors[0]===`body-${id}`)))throw new Error('autonomous-crossing requires p1/a1/p2/p3 and matching body IDs');
  const spawns = [{actorId:'body-p1',controllerId:'p1',teamId:'alpha',x:22,z:30},{actorId:'body-a1',controllerId:'a1',teamId:'alpha',x:25,z:34},{actorId:'body-p2',controllerId:'p2',teamId:'beta',x:51,z:27},{actorId:'body-p3',controllerId:'p3',teamId:'beta',x:cfg.variant==='flank'?43:55,z:cfg.variant==='flank'?48:37}];
  return json({width:80,depth:60,layout:'autonomous-crossing',mapVersion:`autonomous-crossing/${cfg.variant}/v1`,spawnRecoveryRadius:3,relay:{x:40,z:30},spawns,blockers:[{id:'crossing-cover',x:40,z:22,w:5,d:3,height:2},{id:'north-ridge',x:28,z:13,w:7,d:8,height:3},{id:'south-ridge',x:53,z:48,w:7,d:8,height:3},...(cfg.variant==='blocked-route'?[{id:'route-ridge',x:34,z:34,w:4,d:12,height:3}]:[])]});
};
const objective = cloned.find(m=>m.descriptor.id==='objective.relay')!;
objective.configSchema = object({});
objective.descriptor = {...objective.descriptor,reads:['world.planar'],dependencies:[dep('world.planar')]};
objective.initial = (_cfg,c) => json({...arena(c).relay,radius:5,owner:null,capturing:null,progress:0,captureTicks:40,contested:false,scores:{alpha:0,beta:0},scoreToWin:600});
objective.advance = s=>s;
objective.project = s=>({world:s,entities:[]});

const command = base('command.owned','input',[dep('world.planar')],object({deliveryTicks:{const:2},reportTicks:{const:4},grants:arr(grantSchema,4)}),object({grants:arr(grantSchema,4),orders:arr(activeSchema,4),reports:arr(reportStateSchema,4),reportQueue:arr(reportStateSchema),leaders:arr(reportStateSchema,4),leaderQueue:arr(reportStateSchema),deadLatch:arr(identifier,4),deliveryTicks:{const:2},reportTicks:{const:4}}));
command.descriptor = {...command.descriptor,version:'0.1.1',configurationSchemaId:'command.owned/config/0.1.1',stateSchemaId:'command.owned/state/0.1.1',reads:['world.planar','movement.planar','combat.runner']};
const action = (kind:string,schema:object) => ({capability:{kind,version:'0.1.0',payloadSchemaId:`${kind}/0.1.0`},schema});
command.actions = [action('command.order',orderSchema),action('command.transfer',transferSchema),action('command.report',reportSchema)];
command.eventKinds = ['command.applied','command.superseded','command.invalidated'];
command.initial = (cfg,c) => {
  const grants = cfg.grants as unknown as Grant[];
  if(new Set(grants.map(g=>g.unitId)).size!==grants.length)throw new Error('Duplicate command grant');
  for(const g of grants){const unit=arena(c).spawns.find(b=>b.actorId===g.unitId),leader=arena(c).spawns.find(b=>b.actorId===g.commanderActorId);if(!unit||!leader||unit.controllerId!==g.unitControllerId||leader.controllerId!==g.commanderId||unit.controllerId===leader.controllerId||unit.teamId!==leader.teamId)throw new Error('Invalid command grant');}
  return json({...cfg,orders:[],reports:[],reportQueue:[],leaders:[],leaderQueue:[],deadLatch:[]});
};
function permitted(s:State,cmd:AuthenticatedCommand,c:ModuleContext):boolean {
  const p=cmd.action.payload;
  if(cmd.action.kind==='command.report'){
    const g=s.grants.find(g=>g.unitId===cmd.actorId&&g.unitControllerId===cmd.controllerId);
    const latest=Math.max(-1,...s.reports.concat(s.reportQueue).filter(r=>r.unitId===cmd.actorId).map(r=>r.revision));
    return !!g&&g.generation===p.generation&&alive(g.unitId,c)&&alive(g.commanderActorId,c)&&Number(p.revision)>latest;
  }
  const g=s.grants.find(g=>g.unitId===p.unitId);
  if(cmd.action.kind==='command.transfer'){
    const next=bodies(c).find(b=>b.controllerId===p.commanderId),old=bodies(c).find(b=>b.id===g?.commanderActorId);
    return !!g&&g.generation===p.generation&&g.commanderId===cmd.controllerId&&g.commanderActorId===cmd.actorId&&alive(g.unitId,c)&&alive(g.commanderActorId,c)&&!!next&&alive(next.id,c)&&next.teamId===old?.teamId&&next.controllerId!==g.commanderId&&next.controllerId!==g.unitControllerId;
  }
  const order=p as unknown as Order;
  const targetLegal=order.kind==='follow'?order.target===g?.commanderActorId:typeof order.target==='object'&&legal(order.target,arena(c),.6);
  return orderPermitted(order,g,s.orders.find(o=>o.unitId===order.unitId),{controllerId:cmd.controllerId,actorId:cmd.actorId,tick:c.tick,commanderAlive:alive(g?.commanderActorId??'',c),unitAlive:alive(g?.unitId??'',c),targetLegal});
}
command.validate = (s,cmd,c)=>permitted(s as unknown as State,cmd,c);
command.advance = (raw,commands,_cfg,c) => {
  const s=structuredClone(raw) as unknown as State;
  const clear = (g:Grant) => {s.orders=s.orders.filter(o=>o.unitId!==g.unitId);s.reports=s.reports.filter(r=>r.unitId!==g.unitId);s.reportQueue=s.reportQueue.filter(r=>r.unitId!==g.unitId);s.leaders=s.leaders.filter(r=>r.unitId!==g.commanderActorId);s.leaderQueue=s.leaderQueue.filter(r=>r.unitId!==g.commanderActorId);};
  const event = (kind:string,cmd:AuthenticatedCommand) => c.emit(kind,{sequence:cmd.sequence,actorId:cmd.actorId},{kind:'controllers',ids:[cmd.controllerId]});
  for(const g of s.grants){
    if(!alive(g.unitId,c)||!alive(g.commanderActorId,c)){
      if(!s.deadLatch.includes(g.unitId)){clear(g);g.generation++;s.deadLatch.push(g.unitId);}
    }else s.deadLatch=s.deadLatch.filter(id=>id!==g.unitId);
  }
  for(const o of s.orders){if((o.status==='active'||o.status==='pending')&&o.expiresTick!<=c.tick+1)o.status='expired';else if(o.status==='pending'&&o.effectiveTick<=c.tick+1)o.status='active';}
  // Transfers dominate all old-generation commands from the same admitted S[t] batch.
  for(const cmd of commands.filter(cmd=>cmd.action.kind==='command.transfer')){
    if(!permitted(s,cmd,c)){event('command.invalidated',cmd);continue;}
    const g=s.grants.find(g=>g.unitId===cmd.action.payload.unitId)!;
    clear(g);const next=bodies(c).find(b=>b.controllerId===cmd.action.payload.commanderId)!;g.commanderId=next.controllerId;g.commanderActorId=next.id;g.generation++;event('command.applied',cmd);
  }
  const orderCommands=commands.filter(cmd=>cmd.action.kind==='command.order');
  for(const g of s.grants){
    const candidates=orderCommands.filter(cmd=>cmd.action.payload.unitId===g.unitId&&permitted(s,cmd,c));
    const winner=winningOrder(candidates.map(cmd=>cmd.action.payload as unknown as Order));
    for(const cmd of orderCommands.filter(cmd=>cmd.action.payload.unitId===g.unitId)){
      if((cmd.action.payload as unknown as Order)!==winner){event(candidates.includes(cmd)?'command.superseded':'command.invalidated',cmd);continue;}
      const o:ActiveOrder={...winner!,issuedTick:c.tick,effectiveTick:c.tick+s.deliveryTicks,status:winner!.kind==='cancel'?'cancelled':'pending'};
      s.orders=s.orders.filter(old=>old.unitId!==g.unitId);s.orders.push(o);event('command.applied',cmd);
    }
  }
  for(const cmd of commands.filter(cmd=>cmd.action.kind==='command.report')){
    if(!permitted(s,cmd,c)){event('command.invalidated',cmd);continue;}
    const b=bodies(c).find(b=>b.id===cmd.actorId)!,u=units(c).find(u=>u.id===b.id)!;
    s.reportQueue.push({unitId:b.id,generation:Number(cmd.action.payload.generation),revision:Number(cmd.action.payload.revision),mode:String(cmd.action.payload.mode),observedTick:c.tick,deliveredTick:c.tick+s.reportTicks,x:b.x,z:b.z,hp:u.hp,alive:u.alive});
  }
  for(const g of s.grants){
    if(s.deadLatch.includes(g.unitId))continue;
    const ready=s.reportQueue.filter(r=>r.unitId===g.unitId&&r.generation===g.generation&&r.deliveredTick<=c.tick+1).sort((a,b)=>b.revision-a.revision)[0];
    if(ready){s.reports=s.reports.filter(r=>r.unitId!==g.unitId);s.reports.push(ready);}
    const leader=s.leaderQueue.filter(r=>r.unitId===g.commanderActorId&&r.generation===g.generation&&r.deliveredTick<=c.tick+1).sort((a,b)=>b.observedTick-a.observedTick)[0];
    if(leader){s.leaders=s.leaders.filter(r=>r.unitId!==g.commanderActorId);s.leaders.push(leader);}
    if(c.tick%4===0){const b=bodies(c).find(b=>b.id===g.commanderActorId),u=units(c).find(u=>u.id===g.commanderActorId);if(b&&u?.alive)s.leaderQueue.push({unitId:b.id,generation:g.generation,revision:0,mode:'commander',observedTick:c.tick,deliveredTick:c.tick+s.reportTicks,x:b.x,z:b.z,hp:u.hp,alive:true});}
  }
  s.reportQueue=s.reportQueue.filter(r=>r.deliveredTick>c.tick+1).slice(-64);s.leaderQueue=s.leaderQueue.filter(r=>r.deliveredTick>c.tick+1).slice(-64);
  return json(s);
};
command.project = (raw,id,c) => {
  const s=raw as unknown as State,grants=s.grants.filter(g=>g.commanderId===id||g.unitControllerId===id);
  return {world:json({grants,unavailableUnitIds:s.deadLatch.filter(unitId=>grants.some(g=>g.unitId===unitId)),orders:s.orders.filter(o=>grants.some(g=>g.unitId===o.unitId&&(g.commanderId===id||(o.status==='active'&&o.effectiveTick<=c.tick&&o.expiresTick!>c.tick)))),reports:s.reports.filter(r=>grants.some(g=>g.unitId===r.unitId&&g.commanderId===id)),leaders:s.leaders.filter(r=>grants.some(g=>g.commanderActorId===r.unitId&&g.unitControllerId===id&&g.generation===r.generation)),deliveryTicks:s.deliveryTicks,reportTicks:s.reportTicks}),entities:[]};
};

const crossing = base('rules.crossing','termination',[dep('combat.runner')],object({}),object({terminal:{type:'string'},winners:arr(identifier,2),defeated:arr(identifier,2)}));
crossing.initial = ()=>({terminal:'running',winners:[],defeated:[]});
crossing.advance = (raw,_cmd,_cfg,c) => {
  const defeated=[...new Set([...(raw.defeated as string[]),...units(c).filter(u=>['body-p2','body-p3'].includes(u.id)&&!u.alive).map(u=>u.id)])].sort();
  const win=defeated.length===2,loss=['body-p1','body-a1'].every(id=>!alive(id,c)),timeout=c.tick+1>=Math.min(1800,c.maxTicks);
  if(!win&&!loss&&!timeout)return {...raw,defeated};
  const winners=win&&!loss?['alpha']:loss&&!win?['beta']:[];
  c.finish(winners.length?{kind:'finished',tick:c.tick+1,winners,reason:'crossing',scores:{alpha:defeated.length,beta:loss?2:0}}:{kind:'draw',tick:c.tick+1,reason:timeout?'timeout':'simultaneous',scores:{alpha:defeated.length,beta:loss?2:0}});
  return {terminal:winners.length?'finished':'draw',winners,defeated};
};
crossing.project = s=>({world:{terminal:s.terminal!,winners:s.winners!,defeated:s.defeated!,required:2},entities:[]});
export const autonomousModules:RuntimeModule[]=[...cloned,command,crossing];


