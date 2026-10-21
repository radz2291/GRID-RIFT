/** Optional command module contract v0.1.0. Core envelopes remain grid-rift/v0. */
export const AUTONOMY_VERSION = '0.1.0';
export interface Order {
  unitId:string; generation:number; orderId:string; revision:number;
  kind:'defend'|'secure'|'follow'|'cancel'; target?:{x:number;z:number}|string;
  risk?:'cautious'|'balanced'; expiresTick?:number;
}
export interface Grant {unitId:string;unitControllerId:string;commanderId:string;commanderActorId:string;generation:number}
export interface ActiveOrder extends Order {issuedTick:number;effectiveTick:number;status:'pending'|'active'|'cancelled'|'expired'|'revoked'|'dead'}
export interface UnitReport {unitId:string;generation:number;revision:number;mode:string;observedTick:number;deliveredTick:number;x:number;z:number;hp:number;alive:boolean}
export interface CommandView {grants:Grant[];orders:ActiveOrder[];reports:UnitReport[];leaders:UnitReport[];unavailableUnitIds?:string[];deliveryTicks:number;reportTicks:number}
/** Called only on an already authorized same-unit batch. Stable tie retains command order. */
export function winningOrder(orders:readonly Order[]):Order|undefined {
  return [...orders].sort((a,b)=>b.revision-a.revision||Number(b.kind==='cancel')-Number(a.kind==='cancel'))[0];
}
/** Authority context is assembled by a trusted module, never supplied by the caller. */
export function orderPermitted(order:Order, grant:Grant|undefined, current:ActiveOrder|undefined,
  auth:{controllerId:string;actorId:string;tick:number;commanderAlive:boolean;unitAlive:boolean;targetLegal:boolean}):boolean {
  if(!grant||grant.commanderId!==auth.controllerId||grant.commanderActorId!==auth.actorId||grant.unitId!==order.unitId||grant.generation!==order.generation||!auth.commanderAlive||!auth.unitAlive)return false;
  if(order.revision<=(current?.revision??0))return false;
  if(order.kind==='cancel')return !!current&&current.orderId===order.orderId;
  return auth.targetLegal&&order.expiresTick!>auth.tick+2&&order.expiresTick!<=auth.tick+1200;
}
