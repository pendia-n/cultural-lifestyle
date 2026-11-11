import {cityDirectory} from '#lib/server/city-directory';
import {runCitySection} from '#lib/server/discovery-task';
import {subscriber} from '#lib/server/access';
import { writeResearch } from '#lib/server/research-cache';
import { json, error, type RequestEvent } from '@sveltejs/kit';
import { requireUser, limit } from '#lib/server/auth';
import { database } from '#lib/server/db';
import { slugify, cities } from '#lib/catalog';
import {
	overviewRequest,
	sectionRequest,
	researchSections,
	type ResearchSection
} from '#lib/server/research-requests';
export async function GET(event: RequestEvent) {
	const slug = event.url.searchParams.get('city') || '';
	const rows = await database(event.platform)
		.prepare(
			"SELECT section,status,error FROM research_jobs WHERE city_slug=? AND cycle='discovery' ORDER BY section"
		)
		.bind(slug)
		.all();
	return json({ sections: rows.results });
}
export async function POST(event: RequestEvent) {
	const user = await requireUser(event),
		db = database(event.platform),
		env = event.platform!.env;
	const input = (await event.request.json()) as Record<string, unknown>;
	const name = typeof input.city === 'string' ? input.city.trim() : '';
	const country = typeof input.country === 'string' ? input.country.trim() : '';
	const currency = typeof input.currency === 'string' ? input.currency.trim() : '';
	if (
		name.length < 2 ||
		name.length > 80 ||
		country.length < 2 ||
		country.length > 80 ||
		!/^[A-Z]{3}$/.test(currency)
	)
		error(400, 'Supply city, country and three-letter currency.');
	const section = typeof input.section === 'string' ? input.section : 'overview';
	if (section !== 'overview' && !researchSections.includes(section as ResearchSection))
		error(400, 'Choose a supported section.');
	const canonical=(value:string)=>value.normalize('NFKD').replace(/[^a-z0-9]/gi,'').toLowerCase();
 const existing = (await cityDirectory(db)).find(
		(city) =>
			canonical(city.name) === canonical(name) &&
			canonical(city.country) === canonical(country)
	);
	if (existing) return json({ slug: existing.slug, existing: true });
	const slug = slugify(name + '-' + country);
	await limit(event,'city-discovery:'+user.id,32);
	if(section!=='overview'){
 if(!await subscriber(db,user.id))error(403,'Membership is required to commission new sections.');
 if(!env.CITY_RESEARCH_QUEUE)error(503,'Background research is not configured.');
 await env.CITY_RESEARCH_QUEUE.send({slug,name,country,currency,section});
 return json({slug,status:'queued'});
 }
	const result=await runCitySection(env,{slug,name,country,currency,section:'overview'});
 let queued=false;
 if(result.status==='needs_review' && await subscriber(db,user.id)){
  if(!env.CITY_RESEARCH_QUEUE)error(503,'Background research is not configured.');
  await env.CITY_RESEARCH_QUEUE.sendBatch([...researchSections,'images'].map(section=>({body:{slug,name,country,currency,section}})));queued=true;
 }
 return json({...result,queued});
}
