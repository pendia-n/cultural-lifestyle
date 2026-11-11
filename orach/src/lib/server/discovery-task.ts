import {extractOffers} from '../research-offers.ts';
import {providerJson} from './provider-json.ts';
import {researchPreview} from './research-preview.ts';
import {writeResearch} from './research-cache.ts';
import {overviewRequest,sectionRequest,priceFollowupRequest,type ResearchSection} from './research-requests.ts';
export type CityTask={slug:string;name:string;country:string;currency:string;section:string};
export async function runCitySection(env:Env,task:CityTask){
 const db=env.DB,{slug,name,country,currency,section}=task,id=`discovery:${slug}:${section}`;
 const previous=await db.prepare('SELECT status,result,lease_until,attempts FROM research_jobs WHERE id=?').bind(id).first<{status:string;result:string|null;lease_until:number;attempts:number}>();
 const now=Math.floor(Date.now()/1000);
 const recovering=!!previous && previous.attempts<3 && (previous.status==='failed' || (previous.status==='running' && (previous.lease_until||0)<=now));
 if(previous?.status==='running' && previous.lease_until<=now && previous.attempts>=3){await db.prepare("UPDATE research_jobs SET status='failed',error='Job interrupted repeatedly; research not completed' WHERE id=? AND status='running'").bind(id).run();return {slug,status:'failed',result:null};}
 if(previous?.status==='running'&&!recovering)throw Error('Research is already running; retry status later.');
 if(previous&&!recovering)return {slug,status:previous.status,result:previous.result?JSON.parse(previous.result):null};
	const request =
		section === 'overview'
			? { ...overviewRequest({ name, country, currency }), provider: 'exa' }
			: sectionRequest({ name, country, currency }, section as ResearchSection);
	const key =
		request.provider === 'exa'
			? env.EXA_API_KEY
			: request.provider === 'firecrawl'
				? env.FIRECRAWL_API_KEY
				: env.TAVILY_API_KEY;
	if (!key) throw Error('City research is not connected yet.');
	const month = new Date().toISOString().slice(0, 7),
		reserved = request.provider === 'exa' ? 0.02 : request.provider === 'firecrawl' ? 7 : 2;
	const budget = request.provider === 'exa' ? 10 : 1000;
	const reservation = await db
		.prepare(
			'INSERT INTO provider_usage(month,provider,used) VALUES(?,?,?) ON CONFLICT(month,provider) DO UPDATE SET used=used+excluded.used WHERE used+excluded.used<=? RETURNING used'
		)
		.bind(month, request.provider, reserved, budget)
		.first();
	if (!reservation) throw Error('Research allowance reached.');
	await db
		.prepare("INSERT OR IGNORE INTO cities(slug,name,country,status) VALUES(?,?,?,'draft')")
		.bind(slug, name, country)
		.run();
	const claimed = await db
		.prepare(
			"INSERT INTO research_jobs(id,cycle,city_slug,section,provider,status,lease_until) VALUES(?,'discovery',?,?,?,'running',?) ON CONFLICT(id) DO UPDATE SET status='running',error=NULL,lease_until=excluded.lease_until,attempts=research_jobs.attempts+1 WHERE (research_jobs.status='failed' OR (research_jobs.status='running' AND research_jobs.lease_until<=?)) AND research_jobs.attempts<3"
		)
		.bind(id, slug, section, request.provider,now+120,now)
		.run();
	if (!claimed.meta.changes) {
		await db
			.prepare('UPDATE provider_usage SET used=MAX(0,used-?) WHERE month=? AND provider=?')
			.bind(reserved, month, request.provider)
			.run();
		return {slug,status:'running'};
	}
	try {
		const headers: Record<string, string> = { 'Content-Type': 'application/json' };
		if (request.provider === 'exa') headers['x-api-key'] = key;
		else headers.Authorization = 'Bearer ' + key;
		const response = await fetch(request.endpoint, {
			method: 'POST',
			headers,
			body: JSON.stringify(request.body),
			signal: AbortSignal.timeout(25000)
		});
		if (!response.ok) throw new Error('Research provider HTTP ' + response.status);
		const result = (await providerJson(response)) as Record<string, unknown>;
		const serialized = JSON.stringify(result);
		if (new TextEncoder().encode(serialized).length > 1800000)
			throw new Error('Response exceeds storage limit; retained as failed rather than truncated.');
		if (result.success === false) throw new Error('Research provider reported a failure.');
		await writeResearch(db, slug, section, request.provider, {
			city: { name, country, currency },
			response: result
		});
        if(['eat','drink','play','transport'].includes(section)&&extractOffers(result,section as ResearchSection,slug,currency).filter(o=>o.comparable).length<2){
          const extra=await db.prepare('INSERT INTO provider_usage(month,provider,used) VALUES(?,?,?) ON CONFLICT(month,provider) DO UPDATE SET used=used+excluded.used WHERE used+excluded.used<=? RETURNING used').bind(month,request.provider,reserved,budget).first();
          if(extra){try{
            const follow=priceFollowupRequest({name,country,currency},section as ResearchSection);
            const reply=await fetch(follow.endpoint,{method:'POST',headers,body:JSON.stringify(follow.body),signal:AbortSignal.timeout(25000)});
            if(reply.ok){const supplement=await providerJson(reply);await writeResearch(db,slug,section+'_price_followup',request.provider,{city:{name,country,currency},response:supplement});
              const rows=(v:any)=>v.results||v.citations||v.data?.web||v.web||[];
              const combined={...result,results:[...rows(result),...rows(supplement)],citations:undefined,data:undefined,web:undefined};
              await writeResearch(db,slug,section,request.provider,{city:{name,country,currency},response:combined});
            }
          }catch{/* The first response and its offers are saved; coverage keeps gaps explicit. */}}
        }

		await db
			.prepare("UPDATE research_jobs SET status='needs_review',result=? WHERE id=?")
			.bind(JSON.stringify(researchPreview(result)), id)
			.run();
		return {slug,status:'needs_review',result:researchPreview(result)};
	} catch (cause) {
		const message = cause instanceof Error ? cause.message : 'Research failed';
		await db
			.prepare("UPDATE research_jobs SET status='failed',error=? WHERE id=?")
			.bind(message, id)
			.run();
		throw new Error('This section could not be researched.');
	}
}
