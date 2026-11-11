import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {cities} from '../../src/lib/catalog.ts';
import {extractOffers} from '../../src/lib/research-offers.ts';
import {parseSavedDocument} from './normalize.mjs';
const sections=['eat','drink','play','clothing','essential','neighbourhood','stay','transport'];
const q=v=>"'"+String(v).replaceAll("'","''")+"'";
const inventory=[],all=[],sql=[];
for(const city of cities)for(const section of sections){
 const path=new URL(`../../../presets/${city.slug==='chiang-mai'?'chiangmai':city.slug}/${section}.md`,import.meta.url);if(!existsSync(path))continue;
 const raw=parseSavedDocument(await readFile(path,'utf8'));
 if(city.slug==='hanoi'&&section==='play'&&/Okinawa|Naha/.test(JSON.stringify(raw))&&!JSON.stringify(raw).includes('Hanoi'))continue;
 const version=createHash('sha256').update(JSON.stringify(raw)).digest('hex');
 let offers=extractOffers(raw,section,city.slug,city.currency);
 const versions=new Map(offers.map(o=>[o.id,version]));
 const dir=new URL(`../../../presets/${city.slug==='chiang-mai'?'chiangmai':city.slug}/`,import.meta.url);
 const gapPaths=(await readdir(dir)).filter(name=>new RegExp('^'+section+'-prices(?:-[a-z]+)?\\.md$').test(name));
 for(const gapFile of gapPaths){const gapPath=new URL(gapFile,dir);
  const gapText=await readFile(gapPath,'utf8');const gap=JSON.parse(gapText.slice(gapText.indexOf('{'),gapText.lastIndexOf('}')+1));
  const extra=extractOffers(gap.response,section,city.slug,city.currency);
  offers=[...new Map([...offers,...extra].map(o=>[o.id,o])).values()];
  const serialized=JSON.stringify({city:gap.city,response:gap.response,receivedAt:gap.receivedAt}),v=createHash('sha256').update(serialized).digest('hex'),chars=Array.from(serialized),chunks=[];
  for(let i=0;i<chars.length;i+=8000)chunks.push(chars.slice(i,i+8000).join(''));
  for(const offer of extra)versions.set(offer.id,v);
  const suffix=gapFile.slice((section+'-prices').length,-3).replaceAll('-','_');
  const key=section+'_price_followup'+suffix;
  for(let i=0;i<chunks.length;i++)sql.push(`INSERT OR IGNORE INTO section_research_chunks(city_slug,section,version,chunk_index,content) VALUES(${q(city.slug)},${q(key)},${q(v)},${i},${q(chunks[i])});`);
  sql.push(`INSERT INTO section_research(city_slug,section,provider_format,response_json) VALUES(${q(city.slug)},${q(key)},'price_followup',${q(JSON.stringify({storage:'chunks',version:v,count:chunks.length,preview:{city:gap.city,response:{results:(gap.response.results||gap.response.citations||gap.response.data?.web||[]).map(r=>({title:r.title,url:r.url}))}}}))}) ON CONFLICT(city_slug,section) DO UPDATE SET response_json=excluded.response_json;`);
 }

 inventory.push({city:city.slug,section,offers:offers.length,comparable:offers.filter(o=>o.comparable).length});all.push(...offers);
 sql.push(`DELETE FROM city_offers WHERE city_slug=${q(city.slug)} AND section=${q(section)};`);
 for(const offer of offers)sql.push(`INSERT INTO city_offers(id,city_slug,section,source_version,data) VALUES(${q(offer.id)},${q(city.slug)},${q(section)},${q(versions.get(offer.id)||version)},${q(JSON.stringify(offer))});`);
 sql.push(`INSERT INTO research_coverage(city_slug,section,offers,comparable,status) VALUES(${q(city.slug)},${q(section)},${offers.length},${offers.filter(o=>o.comparable).length},${q(offers.length?'source_listed':'needs_details')}) ON CONFLICT(city_slug,section) DO UPDATE SET offers=excluded.offers,comparable=excluded.comparable,status=excluded.status,updated_at=CURRENT_TIMESTAMP;`);
}
await mkdir('research-output',{recursive:true});await writeFile('research-output/offers.sql',sql.join('\n'));await writeFile('research-output/offers.json',JSON.stringify(all));await writeFile('research-output/coverage.json',JSON.stringify(inventory,null,2));
console.log(JSON.stringify({offers:all.length,comparable:all.filter(o=>o.comparable).length,sections:inventory.length,priced_sections:inventory.filter(r=>r.offers).length,bySection:sections.map(section=>({section,offers:all.filter(o=>o.section===section).length,comparable:all.filter(o=>o.section===section&&o.comparable).length}))}));
