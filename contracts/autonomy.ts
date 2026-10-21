/** Optional command module contract v0.1.0. Core envelopes remain grid-rift/v0. */
import { Ajv2020 } from 'ajv/dist/2020.js';
export const AUTONOMY_VERSION = '0.1.0';
export const object = (properties: Record<string, unknown>) => ({type:'object',additionalProperties:false,required:Object.keys(properties),properties});
export const identifier = {type:'string',pattern:'^[a-z0-9][a-z0-9._-]*$',maxLength:64};
export const tickNumber = {type:'integer',minimum:0,maximum:1000000};
export const location = object({x:{type:'number',minimum:0,maximum:80},z:{type:'number',minimum:0,maximum:60}});
const common = {unitId:identifier,generation:tickNumber,orderId:identifier,revision:{type:'integer',minimum:1,maximum:1000000}};
export const orderSchema = {anyOf:[
  object({...common,kind:{enum:['defend','secure']},target:location,risk:{enum:['cautious','balanced']},expiresTick:tickNumber}),
  object({...common,kind:{const:'follow'},target:identifier,risk:{enum:['cautious','balanced']},expiresTick:tickNumber}),
  object({...common,kind:{const:'cancel'}})
]};
export const transferSchema = object({unitId:identifier,generation:tickNumber,commanderId:identifier});
export const reportSchema = object({generation:tickNumber,revision:tickNumber,mode:{enum:['idle','moving','engaging','retreating','blocked','defending','following','securing']}});
const ajv = new Ajv2020({strict:true,allErrors:true});
export const validateOrder = ajv.compile(orderSchema);
export interface Order {
  unitId:string; generation:number; orderId:string; revision:number;
  kind:'defend'|'secure'|'follow'|'cancel'; target?:{x:number;z:number}|string;
  risk?:'cautious'|'balanced'; expiresTick?:number;
}
export interface Grant {unitId:string;unitControllerId:string;commanderId:string;commanderActorId:string;generation:number}
export interface ActiveOrder extends Order {issuedTick:number;effectiveTick:number;status:'pending'|'active'|'cancelled'|'expired'|'revoked'|'dead'}
export interface UnitReport {unitId:string;generation:number;revision:number;mode:string;observedTick:number;deliveredTick:number;x:number;z:number;hp:number;alive:boolean}
export interface CommandView {grants:Grant[];orders:ActiveOrder[];reports:UnitReport[];deliveryTicks:number;reportTicks:number}
/** Authority context is assembled by a trusted module, never supplied by the caller. */
export function orderPermitted(order:Order, grant:Grant|undefined, current:ActiveOrder|undefined,
  auth:{controllerId:string;actorId:string;tick:number;commanderAlive:boolean;unitAlive:boolean;targetLegal:boolean}):boolean {
  if(!grant||grant.commanderId!==auth.controllerId||grant.commanderActorId!==auth.actorId||grant.unitId!==order.unitId||grant.generation!==order.generation||!auth.commanderAlive||!auth.unitAlive)return false;
  if(order.revision<=(current?.revision??0))return false;
  if(order.kind==='cancel')return !!current&&current.orderId===order.orderId;
  return auth.targetLegal&&order.expiresTick!>auth.tick+2&&order.expiresTick!<=auth.tick+1200;
}
