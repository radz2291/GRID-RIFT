import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateOrder,orderPermitted} from '../../dist/contracts/autonomy.js';
const valid={unitId:'body-a1',generation:0,orderId:'defense',revision:1,kind:'defend',target:{x:40,z:30},risk:'balanced',expiresTick:300};
test('A-03 bounded order wire examples accept defend, secure, follow and cancellation',()=>{
 for(const value of [valid,{...valid,kind:'secure'},{...valid,kind:'follow',target:'body-p1'},{unitId:'body-a1',generation:0,orderId:'defense',revision:2,kind:'cancel'}])assert.equal(validateOrder(value),true,JSON.stringify(validateOrder.errors));
});
test('A-04 authenticated authority, stale/reassigned generations and expiry are explicit',()=>{
 const grant={unitId:'body-a1',unitControllerId:'a1',commanderId:'p1',commanderActorId:'body-p1',generation:0};
 const auth={controllerId:'p1',actorId:'body-p1',tick:10,commanderAlive:true,unitAlive:true,targetLegal:true};
 const current={...valid,issuedTick:0,effectiveTick:2,status:'active'};
 assert.equal(orderPermitted(valid,grant,undefined,auth),true);
 for(const change of [{controllerId:'p2'},{actorId:'body-a1'},{commanderAlive:false},{unitAlive:false},{targetLegal:false}])assert.equal(orderPermitted(valid,grant,undefined,{...auth,...change}),false);
 assert.equal(orderPermitted(valid,{...grant,generation:1},undefined,auth),false);
 assert.equal(orderPermitted(valid,grant,current,auth),false);
 assert.equal(orderPermitted({...valid,expiresTick:12},grant,undefined,auth),false);
 assert.equal(orderPermitted({...valid,expiresTick:1211},grant,undefined,auth),false);
 assert.equal(orderPermitted({...valid,kind:'cancel',revision:2},grant,current,auth),true);
 assert.equal(orderPermitted({...valid,kind:'cancel',revision:2,orderId:'other'},grant,current,auth),false);
});
test('A-04 malformed, oversized, forged issuer and invalid target wire shapes fail',()=>{
 for(const change of [{issuer:'p1'},{revision:0},{generation:-1},{orderId:'x'.repeat(65)},{target:{x:Infinity,z:30}},{target:{x:81,z:30}},{target:{x:40,z:30,enemy:'hidden'}},{kind:'attack-script'},{risk:'omniscient'}])assert.equal(validateOrder({...valid,...change}),false,JSON.stringify(change));
});
