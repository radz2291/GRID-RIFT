import type { AgentPolicy, ActionIntent, DecisionContext, JsonValue, PolicyDecision } from '../../contracts/agent-interface.js';
import type { CommandView } from '../../contracts/autonomy.js';
import type { ArenaMap, CombatUnit, MovementBody, Point, TacticalWorld } from '../../contracts/tactical-types.js';

interface Seen extends Point {id:string;observedTick:number}
interface Memory {decisions:number;retreating:boolean;generation:number;revision:number;lastSeen:Seen[]}
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.z-b.z);
const initial=():Memory=>({decisions:0,retreating:false,generation:-1,revision:0,lastSeen:[]});
function read(raw:JsonValue):Memory {
  const m=raw as unknown as Partial<Memory>;
  return {decisions:m?.decisions??0,retreating:m?.retreating??false,generation:m?.generation??-1,revision:m?.revision??0,lastSeen:(m?.lastSeen??[]).slice(-8)};
}
// This is only an observed-map goal check. Simulation routing and collision remain authoritative.
function ground(p:Point,map:ArenaMap):boolean {
  return Number.isFinite(p.x)&&Number.isFinite(p.z)&&p.x>=.6&&p.z>=.6&&p.x<=map.width-.6&&p.z<=map.depth-.6&&!map.blockers.some(b=>Math.abs(p.x-b.x)<=b.w/2+.61&&Math.abs(p.z-b.z)<=b.d/2+.61);
}
function chooseGoal(p:Point,body:Point,map:ArenaMap):Point {
  if(ground(p,map))return p;
  const corners=map.blockers.flatMap(b=>[-1,1].flatMap(x=>[-1,1].map(z=>({x:b.x+x*(b.w/2+.8),z:b.z+z*(b.d/2+.8)})))).filter(q=>ground(q,map));
  return corners.sort((a,b)=>distance(a,p)-distance(b,p)||distance(body,a)-distance(body,b)||a.x-b.x||a.z-b.z)[0]??{x:body.x,z:body.z};
}
function makePolicy(steady:boolean):AgentPolicy {
  return {identity:{id:steady?'autonomy.steady':'autonomy.responsive',version:'0.1.0',determinism:'local-replayable'},initialMemory:()=>({...initial(),lastSeen:[]}),decide(context:DecisionContext):PolicyDecision {
    const o=context.observation,memory=read(context.memory);memory.decisions++;
    const own=o.entities.find(e=>e.id===o.controlledEntityIds[0]);
    const body=own?.components.movement as unknown as MovementBody|undefined,unit=own?.components.combat as unknown as CombatUnit|undefined;
    const view=o.world['command.owned'] as unknown as CommandView|undefined;
    const grant=view?.grants.find(g=>g.unitId===body?.id&&g.unitControllerId===o.controllerId);
    const order=view?.orders.find(v=>v.unitId===body?.id&&v.status==='active'&&v.effectiveTick<=o.tick&&v.expiresTick!>o.tick&&v.generation===grant?.generation);
    const world=o.world as unknown as TacticalWorld,map=world['world.planar'],rules=world['combat.runner'];
    const finish=(reason:string,mode:string,action?:ActionIntent):PolicyDecision=>{
      const intents:ActionIntent[]=[];
      if(action)intents.push(action);
      if(grant&&unit?.alive)intents.push({kind:'command.report',version:'0.1.0',payload:{generation:grant.generation,revision:memory.decisions,mode}});
      const actions=intents.filter(a=>o.capabilities.some(c=>c.kind===a.kind&&c.version===a.version)).slice(0,context.budget.actionLimitPerTick).map((action,i)=>({actorId:o.controlledEntityIds[0]!,sequence:context.nextSequence+i,observedTick:o.tick,executeTick:context.earliestExecuteTick,action}));
      return {actions,nextMemory:{...memory,lastSeen:memory.lastSeen.map(s=>({...s}))},reasonTags:[reason]};
    };
    if(!body||!unit?.alive||!map||!rules){memory.lastSeen=[];return finish('await-respawn','idle');}
    const move=(p:Point,reason:string,mode='moving')=>finish(reason,mode,{kind:'movement.move-to',version:'0.1.0',payload:{x:chooseGoal(p,body,map).x,z:chooseGoal(p,body,map).z}});
    const stop=(reason:string)=>move(body,reason,'idle');
    if(grant?.generation!==memory.generation){memory.lastSeen=[];memory.retreating=false;memory.generation=grant?.generation??-1;memory.revision=0;}
    if(!order){memory.revision=0;memory.lastSeen=[];return body.destination||body.path.length||unit.targetId?stop('no-effective-intention'):finish('await-intention','idle');}
    memory.revision=order.revision;
    const enemies=o.entities.map(e=>({body:e.components.movement as unknown as MovementBody,unit:e.components.combat as unknown as CombatUnit})).filter(e=>e.body&&e.unit?.alive&&e.body.teamId!==body.teamId).sort((a,b)=>distance(body,a.body)-distance(body,b.body)||(a.body.id<b.body.id?-1:1));
    memory.lastSeen=memory.lastSeen.filter(s=>o.tick-s.observedTick<=80&&!enemies.some(e=>e.body.id===s.id));
    memory.lastSeen.push(...enemies.map(e=>({id:e.body.id,x:e.body.x,z:e.body.z,observedTick:o.tick})));memory.lastSeen=memory.lastSeen.slice(-8);
    let anchor:Point;
    if(order.kind==='follow'){
      const visible=o.entities.find(e=>e.id===order.target)?.components.movement as unknown as MovementBody|undefined;
      const leader=view?.leaders.filter(r=>r.unitId===order.target&&r.generation===grant!.generation&&r.alive&&o.tick-r.observedTick<=80).sort((a,b)=>b.observedTick-a.observedTick)[0];
      if(!visible&&!leader)return stop('no-fresh-commander-position');
      anchor=visible??leader!;
    }else anchor=order.target as Point;
    const threshold=order.risk==='cautious'?55:30;
    if(unit.hp<=threshold)memory.retreating=true;
    if(unit.hp>=Math.max(70,threshold+15))memory.retreating=false;
    const spawn=map.spawns.find(s=>s.actorId===body.id);
    if(memory.retreating&&spawn){if(distance(body,spawn)<1)return move(body,'recover-at-spawn','retreating');return move(spawn,'retreat-for-recovery','retreating');}
    // A defend perimeter and follow leash constrain pursuit; secure stays close once clear.
    const leash=steady?9:order.kind==='defend'?13:order.kind==='follow'?11:16;
    const target=enemies.find(e=>distance(anchor,e.body)<=leash);
    if(target&&distance(body,anchor)<=leash+2){
      const range=distance(body,target.body);
      if(!steady&&target.unit.windup){
        const dx=target.unit.windup.x-target.body.x,dz=target.unit.windup.z-target.body.z,length=Math.hypot(dx,dz);
        if(length&&Math.abs(((body.x-target.body.x)*-dz+(body.z-target.body.z)*dx)/length)<2){
          const left={x:body.x-dz/length*3,z:body.z+dx/length*3},right={x:body.x+dz/length*3,z:body.z-dx/length*3};
          return move(ground(left,map)?left:right,'evade-observed-threat','engaging');
        }
      }
      if(unit.windup||body.dash)return finish('complete-current-ability','engaging');
      if(!steady&&range<=rules.pulseRange&&unit.pulseReadyTick<=o.tick)return finish('pulse-local-threat','engaging',{kind:'combat.cast',version:'0.1.0',payload:{ability:'pulse',x:target.body.x,z:target.body.z}});
      if(range<=rules.basicRange)return finish('attack-local-threat','engaging',{kind:'combat.attack',version:'0.1.0',payload:{targetId:target.body.id}});
      const fraction=Math.max(0,(range-rules.basicRange+.5)/range);
      return move({x:body.x+(target.body.x-body.x)*fraction,z:body.z+(target.body.z-body.z)*fraction},'approach-local-threat','engaging');
    }
    const hold=order.kind==='follow'?4:2;
    if(distance(body,anchor)<=hold)return move(body,`hold-${order.kind}`,order.kind==='follow'?'following':order.kind==='defend'?'defending':'securing');
    return move(anchor,`advance-${order.kind}`,order.kind==='follow'?'following':'moving');
  }};
}
export const subordinatePolicy=makePolicy(false);
export const steadyPolicy=makePolicy(true);

