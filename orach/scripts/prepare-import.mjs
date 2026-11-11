import {researchPreview} from '../src/lib/server/research-preview.ts';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {cities} from '../src/lib/catalog.ts';
import {parseSavedDocument,normalize} from './research-tools/normalize.mjs';
const sections=['eat','drink','play','clothing','essential','neighbourhood','stay','transport'];
const quote=value=>"'"+String(value).replaceAll("'","''")+"'";
const sql=[],inventory=[],missing=[];
for(const city of cities){
 sql.push(`INSERT INTO cities(slug,name,country,status) VALUES(${quote(city.slug)},${quote(city.name)},${quote(city.country)},'awaiting') ON CONFLICT(slug) DO UPDATE SET name=excluded.name,country=excluded.country;`);
 for(const section of sections){
  const path=new URL(`../../presets/${city.slug==='chiang-mai'?'chiangmai':city.slug}/${section}.md`,import.meta.url);
  if(!existsSync(path)){missing.push({city:city.name,slug:city.slug,section});continue;}
  const raw=parseSavedDocument(await readFile(path,'utf8'));
  const record=normalize(raw,{city:city.name,section});
  if(city.slug==='hanoi'&&section==='play'&&/Okinawa|Naha/.test(JSON.stringify(raw))&&!JSON.stringify(raw).includes('Hanoi')){
   sql.push(`INSERT OR REPLACE INTO research_rejections(source_path,reason) VALUES(${quote(path.pathname)},'Wrong destination: Okinawa/Naha results are not Hanoi Play');`);
   missing.push({city:city.name,slug:city.slug,section,reason:'wrong_destination'});continue;
  }
  const serialized=JSON.stringify(raw), version=createHash('sha256').update(serialized).digest('hex');
  const chars=Array.from(serialized), chunks=[];
  for(let offset=0;offset<chars.length;offset+=8000)chunks.push(chars.slice(offset,offset+8000).join(''));
  for(let index=0;index<chunks.length;index++)sql.push(`INSERT OR IGNORE INTO section_research_chunks(city_slug,section,version,chunk_index,content) VALUES(${quote(city.slug)},${quote(section)},${quote(version)},${index},${quote(chunks[index])});`);
  sql.push(`INSERT INTO section_research(city_slug,section,provider_format,response_json) VALUES(${quote(city.slug)},${quote(section)},${quote(record.format)},${quote(JSON.stringify({storage:'chunks',version,count:chunks.length,preview:researchPreview(raw)}))}) ON CONFLICT(city_slug,section) DO UPDATE SET provider_format=excluded.provider_format,response_json=excluded.response_json,imported_at=CURRENT_TIMESTAMP;`);
  inventory.push({city:city.name,section,format:record.format,counts:record.counts,warnings:record.warnings});
 }
}
await mkdir('research-output',{recursive:true});
await writeFile('research-output/import.sql',sql.join('\n')+'\n');
await writeFile('research-output/inventory.json',JSON.stringify({cities:cities.length,available:inventory.length,missing,inventory},null,2));
console.log(JSON.stringify({cities:cities.length,available_sections:inventory.length,missing_sections:missing.length,rejected_hanoi_play:missing.some(x=>x.reason==='wrong_destination')}));
