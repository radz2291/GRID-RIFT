/** Runtime wire validation; pure policy types live separately. */
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
