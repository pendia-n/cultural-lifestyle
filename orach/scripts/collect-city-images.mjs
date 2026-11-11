import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {cities} from '../src/lib/catalog.ts';
await mkdir('research-output/images',{recursive:true});
const env=await readFile(new URL('../../curl-commands/.env',import.meta.url),'utf8');
const key=env.split(/\r?\n/).map(x=>x.match(/^\s*(?:export\s+)?(?:TAVILY|TAVILY_API_KEY)\s*=\s*(.*?)\s*$/)).find(Boolean)?.[1].replace(/^(['"])(.*)\1$/,'$2');
if(!key)throw Error('Missing Tavily key');
const quote=s=>"'"+String(s).replaceAll("'","''")+"'";
const sql=[];let used=0;
for(const city of cities){
 const file=`research-output/images/${city.slug}.json`;let result;
 try{result=JSON.parse(await readFile(file,'utf8'));}catch{
 const response=await fetch('https://api.tavily.com/search',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify({query:`${city.name}, ${city.country} city skyline landmarks travel`,include_answer:'basic',search_depth:'fast',max_results:3,include_images:true,include_usage:true}),signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error(`${city.slug}: HTTP ${response.status}`);
 result=await response.json();await writeFile(file,JSON.stringify(result));used+=Number(result.usage?.credits||1);
 }
 const images=[...new Set((result.images||[]).map(x=>typeof x==='string'?x:x.url).filter(x=>{try{return new URL(x).protocol==='https:'&&!/logo|favicon|locator.map/i.test(x)}catch{return false}}))];
 sql.push(`INSERT INTO city_images(city_slug,cover_url,images_json) VALUES(${quote(city.slug)},${images[0]?quote(images[0]):'NULL'},${quote(JSON.stringify(images))}) ON CONFLICT(city_slug) DO UPDATE SET cover_url=excluded.cover_url,images_json=excluded.images_json,fetched_at=CURRENT_TIMESTAMP;`);
 console.log(`${city.slug}: ${images.length} image links`);
}
await writeFile('research-output/images.sql',sql.join('\n'));console.log(JSON.stringify({cities:cities.length,credits_this_run:used}));
