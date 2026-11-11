import test from 'node:test';import assert from 'node:assert/strict';
import {checkout,webhook} from '../src/lib/server/payments.ts';
function database(){
 return {prepare(sql:string){
  return {bind(...values:unknown[]){
   return {async first(){return sql.includes('FROM users')?{id:'user-fixture'}:null;},async run(){return {meta:{changes:1}};}};
  }};
 }};
}
test('Checkout creates monthly subscription with user mapping and dynamic payment methods',async()=>{
 const old=globalThis.fetch;let form:URLSearchParams|undefined;
 globalThis.fetch=async(_url,init)=>{form=new URLSearchParams(String(init?.body));return Response.json({id:'cs_fixture',url:'https://checkout.stripe.com/fixture'})};
 const event={platform:{env:{DB:database(),STRIPE_SECRET_KEY:'fixture',STRIPE_WEBHOOK_SECRET:'fixture',ORACH_PASS_PRICE_CENTS:'799',ORACH_PUBLIC_ORIGIN:'https://example.org'}}};
 try{await checkout(event as any,'user-fixture','stay-fixture');assert.equal(form?.get('mode'),'subscription');assert.equal(form?.get('line_items[0][price_data][recurring][interval]'),'month');assert.equal(form?.get('subscription_data[metadata][user_id]'),'user-fixture');assert.equal(form?.has('payment_method_types'),false);}finally{globalThis.fetch=old;}
});
test('unsigned webhook cannot grant subscription access',async()=>{
 const event={platform:{env:{STRIPE_WEBHOOK_SECRET:'fixture'}},request:new Request('https://example.org/api/stripe/webhook',{method:'POST',body:'{}'})};
 await assert.rejects(()=>webhook(event as any),(error:any)=>error.status===400);
});
test('signed subscription webhook uses current Stripe state instead of stale event status',async()=>{
 const writes:{sql:string;values:unknown[]}[]=[];
 const db={prepare(sql:string){let values:unknown[]=[];return{bind(...args:unknown[]){values=args;return this},async first(){return sql.includes('FROM users')?{id:'user-fixture'}:null},async run(){writes.push({sql,values});return{meta:{changes:1}}}}}};
 const body=JSON.stringify({id:'evt_fixture',type:'customer.subscription.updated',data:{object:{id:'sub_fixture',status:'active'}}});
 const timestamp=Math.floor(Date.now()/1000),encoder=new TextEncoder(),secret='fixture-webhook-secret';
 const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const digest=new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(timestamp+'.'+body)));
 const signature=[...digest].map(b=>b.toString(16).padStart(2,'0')).join('');
 const old=globalThis.fetch;globalThis.fetch=async()=>Response.json({id:'sub_fixture',status:'canceled',metadata:{user_id:'user-fixture'},items:{data:[{current_period_end:timestamp+3600}]}});
 try{await webhook({platform:{env:{DB:db,STRIPE_SECRET_KEY:'fixture',STRIPE_WEBHOOK_SECRET:secret}},request:new Request('https://example.org/api/stripe/webhook',{method:'POST',body,headers:{'stripe-signature':`t=${timestamp},v1=${signature}`}})} as any);
 const saved=writes.find(w=>w.sql.startsWith('INSERT INTO subscriptions'));assert.ok(saved);assert.equal(saved.values[2],'canceled');assert.equal(saved.values[1],'user-fixture');}finally{globalThis.fetch=old;}
});
