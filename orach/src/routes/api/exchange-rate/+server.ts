import {json,error} from '@sveltejs/kit';
import {isConversionCurrency} from '#lib/conversion-currencies';
export const GET:import('./$types').RequestHandler=async({url,platform})=>{
 const base=(url.searchParams.get('base')||'').toUpperCase(),quote=(url.searchParams.get('quote')||'').toUpperCase();
 if(!/^[A-Z]{3}$/.test(base)||!isConversionCurrency(quote)||[base,quote].includes('XXX'))error(400,'Enter a supported three-letter currency code.');
 if(base===quote)return json({base,quote,rate:1,date:new Date().toISOString().slice(0,10),stale:false});
 const db=platform?.env.DB,day=new Date().toISOString().slice(0,10);
 const saved=await db?.prepare('SELECT rate,rate_date,fetched_day FROM exchange_rates WHERE base=? AND quote=?').bind(base,quote).first<{rate:number;rate_date:string;fetched_day:string}>();
 if(saved?.fetched_day===day)return json({base,quote,rate:saved.rate,date:saved.rate_date,stale:false});
 try{
  const response=await fetch(`https://api.frankfurter.dev/v2/rate/${base.toLowerCase()}/${quote.toLowerCase()}`,{signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error('Rate unavailable');
  const data=await response.json() as {rate:number;date:string};
  if(!Number.isFinite(data.rate)||data.rate<=0||!/^\d{4}-\d{2}-\d{2}$/.test(data.date))throw Error('Invalid rate');
  await db?.prepare('INSERT INTO exchange_rates(base,quote,rate,rate_date,fetched_day) VALUES(?,?,?,?,?) ON CONFLICT(base,quote) DO UPDATE SET rate=excluded.rate,rate_date=excluded.rate_date,fetched_day=excluded.fetched_day').bind(base,quote,data.rate,data.date,day).run();
  return json({base,quote,rate:data.rate,date:data.date,stale:false});
 }catch{
  if(saved)return json({base,quote,rate:saved.rate,date:saved.rate_date,stale:true});
  error(503,'Conversion is temporarily unavailable. Local-currency prices are still shown.');
 }
};
