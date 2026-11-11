import test from 'node:test';import assert from 'node:assert/strict';
import {runCitySection} from '../src/lib/server/discovery-task.ts';
test('queue redelivery reuses saved city research without provider calls',async()=>{
 let fetched=false;const old=globalThis.fetch;globalThis.fetch=async()=>{fetched=true;throw Error('unexpected provider call')};
 const db={prepare(){return{bind(){return{async first(){return{status:'needs_review',result:JSON.stringify({answer:'Saved overview'})}}}}}}};
 try{const result=await runCitySection({DB:db} as any,{slug:'florence-italy',name:'Florence',country:'Italy',currency:'EUR',section:'overview'});assert.equal(result.result.answer,'Saved overview');assert.equal(fetched,false);}finally{globalThis.fetch=old;}
});
test('all eight queued sections persist profile evidence through their assigned providers',async()=>{
 const saved:string[]=[],requests:string[]=[];
 const db={prepare(sql:string){let values:unknown[]=[];return{bind(...args:unknown[]){values=args;return this},async first(){return sql.includes('provider_usage')?{used:1}:null},async run(){if(sql.includes('INSERT INTO section_research('))saved.push(String(values[1]));return{meta:{changes:1}}}}},async batch(){return[]}};
 const old=globalThis.fetch;globalThis.fetch=async(url)=>{requests.push(String(url));return Response.json({answer:'Provider fixture',results:[{title:'Official source',url:'https://example.org/source',content:'Adult lunch set: EUR 10.\nCappuccino: EUR 3.\nAdult museum admission: EUR 8.\nAdult single bus ride: EUR 2.'},{title:'Other official source',url:'https://example.org/other',content:'Adult lunch set: EUR 12.\nCappuccino: EUR 4.\nAdult museum admission: EUR 9.\nAdult single bus ride: EUR 3.'}]})};
 try{await Promise.all(['eat','drink','play','clothing','essential','neighbourhood','stay','transport'].map(section=>runCitySection({DB:db,TAVILY_API_KEY:'fixture',EXA_API_KEY:'fixture',FIRECRAWL_API_KEY:'fixture'} as any,{slug:'test-city',name:'Test City',country:'Test',currency:'EUR',section})));assert.equal(saved.length,8);assert.equal(requests.filter(url=>url.includes('tavily')).length,3);assert.equal(requests.filter(url=>url.includes('firecrawl')).length,1);}finally{globalThis.fetch=old;}
});
test('an unexpired job lease prevents duplicate provider spending',async()=>{
 const db={prepare(){return{bind(){return{async first(){return{status:'running',result:null,lease_until:Math.floor(Date.now()/1000)+45,attempts:1}}}}}}};
 await assert.rejects(()=>runCitySection({DB:db} as any,{slug:'city',name:'City',country:'Country',currency:'EUR',section:'eat'}),/already running/);
});

test('failed delivery retries below the limit and exhausted delivery spends nothing',async()=>{
 const old=globalThis.fetch;let calls=0;
 globalThis.fetch=async()=>{calls++;return Response.json({results:[{url:'https://example.org/menu',title:'Menu',text:'Lunch set: EUR 10.\nLunch course: EUR 12.'}]});};
 const task={slug:'retry-city',name:'Retry City',country:'Test',currency:'EUR',section:'eat'};
 function database(attempts:number){return{prepare(sql:string){return{bind(){return this},async first(){if(sql.includes('SELECT status'))return{status:'failed',result:null,lease_until:0,attempts};return{used:1}},async run(){return{meta:{changes:1}}}}},async batch(){return[]}};}
 try{
  const recovered=await runCitySection({DB:database(1),TAVILY_API_KEY:'fixture'} as any,task);
  assert.equal(recovered.status,'needs_review');assert.equal(calls,1);
  const exhausted=await runCitySection({DB:database(3)} as any,task);
  assert.equal(exhausted.status,'failed');assert.equal(calls,1);
 }finally{globalThis.fetch=old;}
});
