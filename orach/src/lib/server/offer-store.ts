import {extractOffers,type Offer} from '../research-offers.ts';
import {cities,type Section} from '../catalog.ts';
export async function saveOffers(db:D1Database,slug:string,section:string,raw:unknown,version:string){
 if(!['eat','drink','play','clothing','essential','neighbourhood','stay','transport'].includes(section))return;
 const outer=raw as {city?:{currency?:string}};
 let currency=outer?.city?.currency||cities.find(c=>c.slug===slug)?.currency;
 if(!currency){const row=await db.prepare("SELECT response_json FROM section_research WHERE city_slug=? AND section='overview'").bind(slug).first<{response_json:string}>();try{const v=JSON.parse(row?.response_json||'{}');currency=(v.preview||v).city?.currency;}catch{}}
 if(!currency)return;
 const offers=extractOffers(raw,section as Section,slug,currency);
 // Publish one version atomically; never erase a previous useful version on an empty refresh.
 if(offers.length){const statements=[db.prepare('DELETE FROM city_offers WHERE city_slug=? AND section=?').bind(slug,section),...offers.map(o=>db.prepare('INSERT INTO city_offers(id,city_slug,section,source_version,data) VALUES(?,?,?,?,?)').bind(o.id,slug,section,version,JSON.stringify(o)))];await db.batch(statements);}
 await db.prepare('INSERT INTO research_coverage(city_slug,section,offers,comparable,status) VALUES(?,?,?,?,?) ON CONFLICT(city_slug,section) DO UPDATE SET offers=excluded.offers,comparable=excluded.comparable,status=excluded.status,updated_at=CURRENT_TIMESTAMP').bind(slug,section,offers.length,offers.filter(o=>o.comparable).length,offers.length?'source_listed':'needs_details').run();
 return offers;
}
export async function readOffers(db:D1Database,slug:string):Promise<Offer[]>{const rows=await db.prepare('SELECT data FROM city_offers WHERE city_slug=? ORDER BY section,id').bind(slug).all<{data:string}>();return rows.results.flatMap(row=>{try{return [JSON.parse(row.data) as Offer];}catch{return []}});}
