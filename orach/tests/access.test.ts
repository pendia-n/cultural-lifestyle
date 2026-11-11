import test from 'node:test';
import assert from 'node:assert/strict';
import {subscriber,stayAccess} from '../src/lib/server/access.ts';
test('subscription access requires active status and unexpired paid period',async()=>{
 let parameters:any[]=[];
 const db={prepare(sql:string){assert.match(sql,/status='active'/);assert.match(sql,/current_period_end>\?/);return{bind(...args:any[]){parameters=args;return{async first(){return{id:'sub_test'}}}}}}} as any;
 assert.equal(await subscriber(db,'user_test'),true);assert.equal(parameters[0],'user_test');assert.ok(Math.abs(parameters[1]-Date.now()/1000)<2);
});
test('legacy stay access remains scoped to its owner and stay',async()=>{
 let call=0;const db={prepare(sql:string){return{bind(...args:any[]){return{async first(){call++;if(sql.includes('subscriptions'))return null;assert.deepEqual(args,['owner','stay']);return{purchase_id:'old_pass'}}}}}}} as any;
 assert.equal(await stayAccess(db,'owner','stay'),true);assert.equal(call,2);
});
