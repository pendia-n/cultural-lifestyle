import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {cities} from '../src/lib/catalog.ts';
import {sectionRequest} from '../src/lib/server/research-requests.ts';
const coverage=JSON.parse(await readFile('research-output/coverage.json','utf8'));
const jobs=coverage.filter(r=>['eat','drink','play','transport'].includes(r.section)&&r.comparable===0);
const limits={tavily:120,exa:1,firecrawl:180},used={tavily:0,exa:0,firecrawl:0};
await mkdir('research-output/price-gaps',{recursive:true});
console.log(JSON.stringify({jobs:jobs.length,limits,mode:process.argv.includes('--execute')?'execute':'preview'}));
if(!process.argv.includes('--execute'))process.exit();
const envText=await readFile(new URL('../../curl-commands/.env',import.meta.url),'utf8');const keys={};for(const line of envText.split(/\r?\n/)){const m=line.match(/^\s*(?:export\s+)?(\w+)\s*=\s*(.*?)\s*$/);if(m)keys[m[1]]=m[2].replace(/^(['"])(.*)\1$/,'$2');}
const aliases={tavily:['TAVILY_API_KEY','TAVILY'],exa:['EXA_API_KEY','EXA'],firecrawl:['FIRECRAWL_API_KEY','FIRE']};
let cursor=0;const records=[];const stopped=new Set();
async function worker(){while(cursor<jobs.length){const job=jobs[cursor++],city=cities.find(c=>c.slug===job.city);const id=job.city+'-'+job.section,file='research-output/price-gaps/'+id+'.json';if(existsSync(file))continue;
 const request=sectionRequest(city,job.section),reserve=request.provider==='tavily'?2:request.provider==='exa'?.02:7;
 if(stopped.has(request.provider)||used[request.provider]+reserve>limits[request.provider])continue;used[request.provider]+=reserve;
 const key=aliases[request.provider].map(k=>keys[k]).find(Boolean);if(!key)throw Error('Missing provider key: '+request.provider);
 request.body.query+=' This follow-up is specifically for missing comparable prices. Return actual named '+({eat:'ordinary complete adult lunch meals, not sides, fine dining or generic budgets',drink:'individual cups of coffee or tea with menu prices, not beans or bottles',play:'ordinary adult museum admission and recurring visitor workshops priced per person',transport:'ordinary adult single local bus or metro tickets, not airport, child, student or membership fares'}[job.section])+'.';
 try{const response=await fetch(request.endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(request.provider==='exa'?{'x-api-key':key}:{Authorization:'Bearer '+key})},body:JSON.stringify(request.body),signal:AbortSignal.timeout(60000)});if(!response.ok){if([402,429].includes(response.status))stopped.add(request.provider);throw Error('HTTP '+response.status);}
 const value=await response.json();await writeFile(file,JSON.stringify({city,section:job.section,receivedAt:new Date().toISOString(),request:request.body,response:value}));records.push({id,status:'saved',provider:request.provider});console.log(JSON.stringify({id,status:'saved'}));
 }catch(e){records.push({id,status:'failed',error:e.message});console.log(JSON.stringify({id,status:'failed',error:e.message}));}
}}
await Promise.all([worker(),worker(),worker()]);await writeFile('research-output/price-gaps/ledger.json',JSON.stringify({used,records},null,2));console.log(JSON.stringify({used,completed:records.filter(r=>r.status==='saved').length,failed:records.filter(r=>r.status==='failed').length}));
