import {providerJson} from './provider-json.ts';
import type {CityTask} from './discovery-task.ts';
export async function collectCityImages(env:Env,task:CityTask){
 const db=env.DB;
 if(await db.prepare('SELECT city_slug FROM city_images WHERE city_slug=?').bind(task.slug).first())return;
 if(!env.TAVILY_API_KEY)throw Error('Image search is not configured');
 const month=new Date().toISOString().slice(0,7);
 const reserved=await db.prepare("INSERT INTO provider_usage(month,provider,used) VALUES(?,'tavily',1) ON CONFLICT(month,provider) DO UPDATE SET used=used+1 WHERE used+1<=1000 RETURNING used").bind(month).first();
 if(!reserved)throw Error('Image research budget reached');
 const response=await fetch('https://api.tavily.com/search',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+env.TAVILY_API_KEY},body:JSON.stringify({query:`${task.name}, ${task.country} city skyline landmarks travel`,include_answer:'basic',search_depth:'fast',max_results:3,include_images:true,include_usage:true}),signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw Error('Image provider HTTP '+response.status);
 const value=await providerJson(response) as {images?:Array<string|{url:string}>};
 const images=[...new Set((value.images||[]).map(row=>typeof row==='string'?row:row.url).filter(url=>{try{return new URL(url).protocol==='https:'&&!/logo|favicon|locator.map/i.test(url)}catch{return false}}))];
 await db.prepare('INSERT OR IGNORE INTO city_images(city_slug,cover_url,images_json) VALUES(?,?,?)').bind(task.slug,images[0]||null,JSON.stringify(images)).run();
}
