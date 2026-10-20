import type { ActionIntent, Observation } from '../../contracts/agent-interface.js';
import type { Point, TacticalEntity, TacticalWorld } from '../../contracts/tactical-types.js';

/** Explicit state for the human's standing order. No world-store or hidden target access. */
export interface HumanOrderState {
  mode:'idle'|'move'|'attack'|'attack-move'|'hold';
  focus:string|null;
  destination:Point|null;
}
export const initialHumanOrder = ():HumanOrderState=>({mode:'idle',focus:null,destination:null});
/** The clicked object defines the primitive order; automatic acquisition never creates a lock. */
export function attackClickIntent(point:Point,targetId:string|null):ActionIntent {
  return targetId?{kind:'combat.attack',version:'0.1.0',payload:{targetId}}:{kind:'control.attack-move',version:'0.3.0',payload:{x:point.x,z:point.z}};
}
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.z-b.z);
export function planHumanOrder(observation:Observation, previous:HumanOrderState):{state:HumanOrderState;action:ActionIntent|null} {
  const state:HumanOrderState={...previous,destination:previous.destination?{...previous.destination}:null};
  const own=(observation.entities as unknown as TacticalEntity[]).find(e=>observation.controlledEntityIds.includes(e.id));
  const body=own?.components.movement,unit=own?.components.combat;
  if(!body||!unit?.alive)return {state:initialHumanOrder(),action:null};
  if(state.mode==='hold'||unit.windup||body.dash)return {state,action:null};
  const world=observation.world as unknown as TacticalWorld;
  const move=(point:Point):ActionIntent=>({kind:'movement.move-to',version:'0.1.0',payload:{x:point.x,z:point.z}});
  if(state.mode==='move') {
    if(state.destination&&distance(body,state.destination)>.5) return {state,action:body.destination?null:move(state.destination)};
    state.mode='idle';state.destination=null;
  }
  const visible=(observation.entities as unknown as TacticalEntity[]).filter(e=>e.components.combat?.alive&&e.components.movement&&e.components.movement.teamId!==body.teamId);
  const acquire=state.mode==='attack-move'?Math.min(12,world['perception.radius-los'].radius):world['combat.runner'].basicRange;
  const nearby=(entity:TacticalEntity):boolean=>distance(body,entity.components.movement!)<=acquire&&(state.mode!=='attack-move'||!state.destination||distance(state.destination,entity.components.movement!)<=acquire);
  let target=state.focus?visible.find(e=>e.id===state.focus):undefined;
  if(target&&state.mode!=='attack'&&!nearby(target))target=undefined;
  if(state.focus&&!target) {
    state.focus=null;
    if(state.mode==='attack') {
      state.mode='idle';
      // Cancel the old target without retaining or pursuing its last hidden position.
      return {state,action:move(body)};
    }
  }
  if(!target) {
    target=visible.filter(nearby).sort((a,b)=>distance(body,a.components.movement!)-distance(body,b.components.movement!)||(a.id<b.id?-1:a.id>b.id?1:0))[0];
    if(target)state.focus=target.id;
  }
  if(target) {
    const targetBody=target.components.movement!,range=world['combat.runner'].basicRange;
    if(distance(body,targetBody)<=range) return {state,action:unit.targetId===target.id?null:{kind:'combat.attack',version:'0.1.0',payload:{targetId:target.id}}};
    const length=distance(body,targetBody),stopDistance=Math.max(0,range-.6),fraction=Math.max(0,(length-stopDistance)/length);
    let destination={x:body.x+(targetBody.x-body.x)*fraction,z:body.z+(targetBody.z-body.z)*fraction};
    const radius=world['movement.planar'].bodyRadius;
    if(world['world.planar'].blockers.some(b=>Math.abs(destination.x-b.x)<=b.w/2+radius&&Math.abs(destination.z-b.z)<=b.d/2+radius))destination={x:targetBody.x,z:targetBody.z};
    return {state,action:body.destination&&distance(body.destination,destination)<.25?null:move(destination)};
  }
  if(state.mode==='attack-move'&&state.destination&&distance(body,state.destination)>.5)return {state,action:body.destination&&distance(body.destination,state.destination)<.25?null:move(state.destination)};
  if(state.mode==='attack-move')return {state:{mode:'hold',focus:null,destination:null},action:move(body)};
  if(unit.targetId||body.destination)return {state,action:move(body)};
  return {state,action:null};
}
