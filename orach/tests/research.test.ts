import { test } from 'node:test';
import assert from 'node:assert/strict';
import { refresh } from '../scripts/research.ts';
test('no active subscriber means no ranking, jobs or provider calls', async () => {
	let queried = 0;
	const db = {
		prepare(sql: string) {
			queried++;
			assert(sql.includes('FROM subscriptions'));
			return {
				bind(expiry: number) {
					assert(expiry > 0);
					return {
						async first() {
							return null;
						}
					};
				}
			};
		}
	};
	await refresh({ DB: db as unknown as D1Database }, new Date('2026-10-27T00:00:00Z'));
	assert.equal(queried, 1);
});

test('active subscription refresh preserves all eight provider routes and complete JSON', async () => {
 const requests: {url:string;body:Record<string,unknown>}[]=[];
 let savedLarge=false,archivedBytes=0;
 const db={
  prepare(sql:string){
   const statement={
    bind(...values:unknown[]){if(sql.includes('INSERT OR IGNORE INTO section_research_chunks')){archivedBytes+=String(values[4]).length;if(archivedBytes>250000)savedLarge=true;}if(sql.includes("status='needs_review'")){const payload=String(values[0]);JSON.parse(payload);if(payload.length>250000)savedLarge=true;}return statement;},
    async first(){return sql.includes('FROM subscriptions')?{id:'subscription-fixture'}:{used:1};},
    async all(){assert(sql.includes("'-7 days'"));assert(sql.includes('LIMIT 10'));return {results:[{slug:'tokyo',name:'Tokyo',country:'Japan'}]};},
    async run(){return {meta:{changes:1}};}
   };return statement;
  },async batch(){return [];}
 };
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async(input,init)=>{
  const url=String(input),body=JSON.parse(String(init?.body));requests.push({url,body});
  return new Response(JSON.stringify({results:[],citations:[],answer:'x'.repeat(260000),usage:{credits:1},costDollars:{total:0.005},creditsUsed:7}),{status:200});
 };
 try{await refresh({DB:db as unknown as D1Database,TAVILY_API_KEY:'fixture',EXA_API_KEY:'fixture',FIRECRAWL_API_KEY:'fixture'},new Date('2026-10-27T00:00:00Z'));}finally{globalThis.fetch=originalFetch;}
 assert.equal(requests.length,8);
 assert.equal(requests.filter(r=>r.url==='https://api.tavily.com/search').length,3);
 assert.equal(requests.filter(r=>r.url==='https://api.exa.ai/search').length,2);
 assert.equal(requests.filter(r=>r.url==='https://api.exa.ai/answer').length,2);
 assert.equal(requests.filter(r=>r.url==='https://api.firecrawl.dev/v2/search').length,1);
 assert(savedLarge,'research JSON must not be silently truncated');
});
