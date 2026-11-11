import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {cities} from '../src/lib/catalog.ts';
import {researchPreview} from '../src/lib/server/research-preview.ts';
import {parseSavedDocument} from './research-tools/normalize.mjs';
const sql=[];const quote=s=>"'"+s.replaceAll("'","''")+"'";
for(const city of cities)for(const section of ['eat','drink','play','clothing','essential','neighbourhood','stay','transport']){
 const file=new URL(`../../presets/${city.slug==='chiang-mai'?'chiangmai':city.slug}/${section}.md`,import.meta.url);
 const value=parseSavedDocument(await readFile(file,'utf8'));
 const raw=JSON.stringify(value),version=createHash('sha256').update(raw).digest('hex');
 const manifest={storage:'chunks',version,count:Math.ceil(Array.from(raw).length/8000),preview:researchPreview(value)};
 sql.push(`UPDATE section_research SET response_json=${quote(JSON.stringify(manifest))} WHERE city_slug=${quote(city.slug)} AND section=${quote(section)} AND json_extract(response_json,'$.version')=${quote(version)};`);
}
await writeFile('research-output/previews.sql',sql.join('\n'));
console.log('Prepared',sql.length,'compact display projections; original archive chunks unchanged.');
