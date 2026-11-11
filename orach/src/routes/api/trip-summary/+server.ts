import {error} from '@sveltejs/kit';
import {requireUser} from '#lib/server/auth';
import {stayAccess} from '#lib/server/access';
import {cityDirectory} from '#lib/server/city-directory';
export const GET:import('./$types').RequestHandler=async event=>{
 const user=await requireUser(event),db=event.platform!.env.DB,id=event.url.searchParams.get('stay');
 if(!await stayAccess(db,user.id,id))error(403,'An active membership is required.');
 const row=await db.prepare('SELECT data FROM stays WHERE id=? AND user_id=?').bind(id,user.id).first<{data:string}>();
 if(!row)error(404,'Stay not found');
 const s=JSON.parse(row.data),city=(await cityDirectory(db)).find(c=>c.slug===s.city);
 const esc=(value:unknown)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
 const nights=Math.max(0,(Date.parse(s.departure)-Date.parse(s.arrival))/86400000),days=nights+1;
 const total=Number(s.accommodation)+(Number(s.food)+Number(s.transport))*days*Number(s.travellers)+Number(s.extras);
 const rows=[['Destination',city?.name||s.city],['Dates',`${s.arrival} to ${s.departure}`],['Travellers',s.travellers],['Nights',nights],['Accommodation — entire stay',s.accommodation],['Food — per person/day',s.food],['Transport — per person/day',s.transport],['Activities, shopping and extras — entire stay',s.extras],['Estimated total',`${total.toFixed(2)} ${city?.currency==='XXX'?'Currency not confirmed':city?.currency||'Currency not confirmed'}`]];
 return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Your Orach trip summary</title><style>body{font:18px system-ui;max-width:760px;margin:40px auto;padding:24px;color:#173b46}table{width:100%;border-collapse:collapse}td{padding:14px 0;border-bottom:1px solid #ddd}td:last-child{text-align:right}a{color:inherit}@media print{.actions{display:none}body{margin:0}}</style><h1>Your trip to ${esc(city?.name||s.city)}</h1><p>Your saved budget, ready to print or save as PDF using your browser’s Print menu.</p><table>${rows.map(([label,value])=>`<tr><td>${esc(label)}</td><td>${esc(value)}</td></tr>`).join('')}</table><p>These are your entered estimates, not live quotes. Accommodation and extras cover the whole stay; food and transport cover ${esc(days)} days for ${esc(s.travellers)} traveller(s).</p><p><a href="/city/${encodeURIComponent(s.city)}">City fieldnotes and original research sources</a></p><p class="actions">Use Print → Save as PDF to keep or share this summary.</p></html>`,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
};
