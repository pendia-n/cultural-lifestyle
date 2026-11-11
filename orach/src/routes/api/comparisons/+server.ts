import {json,error} from '@sveltejs/kit';
import {requireUser} from '#lib/server/auth';
import {subscriber} from '#lib/server/access';
import {validateComparison,cityBasket,sumRows} from '#lib/comparison';
import {cityDirectory} from '#lib/server/city-directory';
import {readOffers} from '#lib/server/offer-store';
export const GET:import('./$types').RequestHandler=async event=>{const user=await requireUser(event);const rows=await event.platform!.env.DB.prepare('SELECT id,name,slot,data,updated_at FROM comparisons WHERE user_id=? ORDER BY updated_at DESC').bind(user.id).all<{id:string;name:string;slot:string;data:string;updated_at:string}>();const active=await subscriber(event.platform!.env.DB,user.id);return json({comparisons:rows.results.filter(r=>active||r.slot==='current').map(r=>({...r,data:JSON.parse(r.data)}))});};
export const POST:import('./$types').RequestHandler=async event=>{
 const user=await requireUser(event),db=event.platform!.env.DB;
 if(Number(event.request.headers.get('content-length')||0)>20000)error(413,'Comparison too large.');
 const body=await event.request.json() as {config?:unknown;slot?:unknown;name?:unknown};let config;try{config=validateComparison(body.config);}catch(e){error(400,(e as Error).message);}
 const cities=await cityDirectory(db);if(!cities.some(c=>c.slug===config.left)||!cities.some(c=>c.slug===config.right))error(400,'Choose available cities.');
 const slot=body.slot==='current'?'current':String(body.slot||'');if(!['current','1','2','3'].includes(slot))error(400,'Choose one of three saved versions.');
 if(slot!=='current'&&!await subscriber(db,user.id))error(403,'An active subscription is required for named comparison versions.');
 const snapshot:Record<string,unknown>={};for(const slug of [config.left,config.right]){const rows=cityBasket(await readOffers(db,slug),slug,config);const city=cities.find(c=>c.slug===slug)!;const fx=city.currency===config.currency?{rate:1,rate_date:new Date().toISOString().slice(0,10)}:await db.prepare('SELECT rate,rate_date FROM exchange_rates WHERE base=? AND quote=?').bind(city.currency,config.currency).first();snapshot[slug]={exchange:fx,city:cities.find(c=>c.slug===slug),rows:rows.map(r=>({label:r.label,quantity:r.quantity,low:r.low,high:r.high,offer:r.choice||null})),summary:sumRows(rows)};}
 const id=crypto.randomUUID(),name=String(body.name||'Current comparison').trim().slice(0,80)||'Current comparison';
 await db.prepare('INSERT INTO comparisons(id,user_id,slot,name,data) VALUES(?,?,?,?,?) ON CONFLICT(user_id,slot) DO UPDATE SET name=excluded.name,data=excluded.data,updated_at=CURRENT_TIMESTAMP').bind(id,user.id,slot,name,JSON.stringify({config,snapshot,savedAt:new Date().toISOString()})).run();
 const saved=await db.prepare('SELECT id FROM comparisons WHERE user_id=? AND slot=?').bind(user.id,slot).first<{id:string}>();return json({id:saved!.id});
};
