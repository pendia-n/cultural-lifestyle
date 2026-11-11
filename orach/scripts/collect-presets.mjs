import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {buildRequest} from './research-tools/_request.mjs';
import {cities} from '../src/lib/catalog.ts';
const inventory=JSON.parse(await readFile('research-output/inventory.json','utf8'));
const jobs=inventory.missing;
const limits={tavily:150,firecrawl:250,exa:1};
function price(section){return section==='transport'?{provider:'firecrawl',amount:10}:['eat','drink','essential'].includes(section)?{provider:'tavily',amount:2}:{provider:'exa',amount:['play','clothing'].includes(section)?0.007:0.005};}
const planned={tavily:0,firecrawl:0,exa:0};
for(const job of jobs){const p=price(job.section);planned[p.provider]+=p.amount;}
console.log(JSON.stringify({requests:jobs.length,max_concurrent:4,retries:0,planned,limits}));
if(!process.argv.includes('--execute')){console.log('PLAN ONLY: no credentials loaded and no requests sent.');process.exit(0);}
if(jobs.length>201||Object.keys(limits).some(p=>planned[p]>limits[p]+0.000001))throw new Error('Collection exceeds approved scope/budget.');
const lines=await readFile(new URL('../../curl-commands/.env',import.meta.url),'utf8');
const keys={};for(const line of lines.split(/\r?\n/)){const m=line.match(/^\s*(?:export\s+)?(\w+)\s*=\s*(.*?)\s*$/);if(m)keys[m[1]]=m[2].replace(/^(['"])(.*)\1$/,'$2');}
const aliases={TAVILY_API_KEY:'TAVILY',EXA_API_KEY:'EXA',FIRECRAWL_API_KEY:'FIRE'};
const ledgerPath='research-output/collection-ledger.json';
const ledger=existsSync(ledgerPath)?JSON.parse(await readFile(ledgerPath,'utf8')):{used:{tavily:0,firecrawl:0,exa:0},requests:{}};
let writes=Promise.resolve();const persist=()=>{const snapshot=JSON.stringify(ledger,null,2);writes=writes.then(()=>writeFile(ledgerPath,snapshot));return writes;};
let cursor=0;const stopped=new Set();
async function worker(){while(cursor<jobs.length){const job=jobs[cursor++],city=cities.find(c=>c.slug===job.slug);if(!city)throw new Error('Unknown launch city');
 const id=job.slug+'/'+job.section;if(ledger.requests[id])continue;
 const reserved=price(job.section);if(stopped.has(reserved.provider))continue;
 if(ledger.used[reserved.provider]+reserved.amount>limits[reserved.provider]+0.000001)throw new Error('Budget limit reached');
 const {spec}=await import(`./research-tools/${job.section}.mjs`);
 const key=keys[spec.keyName]||keys[aliases[spec.keyName]];if(!key)throw new Error('Missing '+spec.keyName);
 const request=buildRequest(spec,{city:city.name,country:city.country,boundary:city.name==='Phuket'?'Phuket island':'city and central urban neighbourhoods',currency:city.currency,date:new Date().toISOString().slice(0,10)});
 ledger.used[reserved.provider]+=reserved.amount;ledger.requests[id]={status:'reserved',provider:reserved.provider,reserved:reserved.amount};await persist();
 const directory=new URL(`../../presets/${city.slug==='chiang-mai'?'chiangmai':city.slug}/`,import.meta.url);await mkdir(directory,{recursive:true});
 try{
  const response=await fetch(request.endpoint,{method:'POST',headers:{'Content-Type':'application/json',...spec.authentication(key)},body:JSON.stringify(request.body),signal:AbortSignal.timeout(90000)});
  const raw=await response.text();
  if(!response.ok){await writeFile(new URL(`${job.section}.error.json`,directory),JSON.stringify({status:response.status,body:raw}));if([402,429].includes(response.status))stopped.add(reserved.provider);throw new Error('HTTP '+response.status);}
  const value=JSON.parse(raw);if(value.success===false)throw new Error('Provider reported failure');
  const target=new URL(`${job.section}.md`,directory);
  if(job.reason==='wrong_destination'&&existsSync(target))await writeFile(new URL(`${job.section}-rejected-okinawa.txt`,directory),await readFile(target,'utf8'));
  await writeFile(target,`# ${city.name}: ${job.section}\n\nReceived: ${new Date().toISOString()}\n\n## Request\n\n${JSON.stringify(request.body,null,2)}\n\n## JSON\n\n${JSON.stringify(value,null,2)}\n`);
  const actual=Number(value.usage?.credits??value.creditsUsed??value.costDollars?.total??reserved.amount);
  if(Number.isFinite(actual)&&actual>=0)ledger.used[reserved.provider]+=actual-reserved.amount;
  ledger.requests[id].status='saved';ledger.requests[id].actual=actual;
  if(ledger.used[reserved.provider]>=limits[reserved.provider])stopped.add(reserved.provider);
  console.log('Saved '+id);
 }catch(error){ledger.requests[id].status='failed';ledger.requests[id].error=error.message;console.log('Failed '+id+': '+error.message);}
 await persist();
}}
await Promise.all(Array.from({length:4},worker));await writes;
console.log(JSON.stringify({usage:ledger.used,saved:Object.values(ledger.requests).filter(x=>x.status==='saved').length,failed:Object.values(ledger.requests).filter(x=>x.status==='failed').length}));
