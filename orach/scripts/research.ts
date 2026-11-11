import {sectionRequest,type ResearchSection} from '../src/lib/server/research-requests.ts';
import {researchPreview} from '../src/lib/server/research-preview.ts';
import {providerJson} from '../src/lib/server/provider-json.ts';
import { writeResearch } from '../src/lib/server/research-cache.ts';
import { cities } from '../src/lib/catalog.ts';
interface ResearchEnv {
	DB: D1Database;
	TAVILY_API_KEY?: string;
	EXA_API_KEY?: string;
	FIRECRAWL_API_KEY?: string;
}
const sections = [
	'eat',
	'drink',
	'play',
	'clothing',
	'essential',
	'neighbourhood',
	'stay',
	'transport'
];
const tasks: Record<string, string> = {
	eat: 'casual food local specialities vegetarian official menu prices',
	drink: 'independent coffee tea local drinks official menu prices',
	play: 'beginner creative workshops cultural activities official prices inclusions',
	clothing: 'independent vintage local clothing shops official prices event dates',
	essential: 'groceries laundry prepaid SIM official price quantity',
	neighbourhood: 'neighbourhoods local culture independent shops practical tradeoffs',
	stay: 'hostel hotel aparthotel official kitchen laundry minimum stay',
	transport: 'official public transport adult fares day ticket airport conditions'
};
async function reserve(
	db: D1Database,
	provider: string,
	amount: number,
	max: number,
	month: string
) {
	const result = await db
		.prepare(
			'INSERT INTO provider_usage(month,provider,used) VALUES(?,?,?) ON CONFLICT(month,provider) DO UPDATE SET used=used+excluded.used WHERE used+excluded.used<=? RETURNING used'
		)
		.bind(month, provider, amount, max)
		.first();
	return !!result;
}
export async function refresh(env: ResearchEnv, date = new Date()) {
	const subscriber = await env.DB.prepare(
		"SELECT id FROM subscriptions WHERE status='active' AND current_period_end>? LIMIT 1"
	)
		.bind(Math.floor(date.getTime() / 1000))
		.first();
	if (!subscriber) return;

	const month = date.toISOString().slice(0, 7),
		cycle = month + '-' + (date.getUTCDate() < 15 ? '01' : '15');
	// Search events are deduplicated per pseudonymous visitor, city and day by the app.
	const top = await env.DB.prepare(
		`SELECT c.slug,c.name,c.country,COUNT(*) AS searches FROM search_events e JOIN cities c ON c.slug=e.city_slug WHERE e.searched_at>=datetime('now','-7 days') AND (c.status IN ('draft','published') OR c.slug IN (${cities.map(() => '?').join(',')})) GROUP BY c.slug ORDER BY searches DESC,c.slug ASC LIMIT 10`
	)
		.bind(...cities.map((city) => city.slug))
		.all<{ slug: string; name: string; country: string }>();
	for (const city of top.results)
		for (const section of sections) {
			const provider =
				section === 'transport'
					? 'firecrawl'
					: ['play', 'clothing', 'neighbourhood', 'stay'].includes(section)
						? 'exa'
						: 'tavily';
			const searchExa = ['play', 'clothing'].includes(section);
			const id = cycle + ':' + city.slug + ':' + section;
			const exists = await env.DB.prepare(
				'INSERT OR IGNORE INTO research_jobs(id,cycle,city_slug,section,provider) VALUES(?,?,?,?,?)'
			)
				.bind(id, cycle, city.slug, section, provider)
				.run();
			if (!exists.meta.changes) continue;
			const key =
				provider === 'exa'
					? env.EXA_API_KEY
					: provider === 'firecrawl'
						? env.FIRECRAWL_API_KEY
						: env.TAVILY_API_KEY;
			if (!key) {
				await env.DB.prepare("UPDATE research_jobs SET status='awaiting_key' WHERE id=?")
					.bind(id)
					.run();
				continue;
			}
			// Conservative reservation; retries never silently consume another allowance.
			if (
				!(await reserve(
					env.DB,
					provider,
					provider === 'exa' ? 0.02 : provider === 'firecrawl' ? 7 : 2,
					provider === 'exa' ? 10 : 1000,
					month
				))
			) {
				await env.DB.prepare("UPDATE research_jobs SET status='budget_exhausted' WHERE id=?")
					.bind(id)
					.run();
				continue;
			}
			const request=sectionRequest(city,section as ResearchSection);
            try {
                const response=await fetch(request.endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(provider==='exa'?{'x-api-key':key}:{Authorization:'Bearer '+key})},body:JSON.stringify(request.body),signal:AbortSignal.timeout(45000)});
				if (!response.ok) throw new Error('Provider HTTP ' + response.status);
				const result = await providerJson(response);
				await writeResearch(
					env.DB,
					city.slug,
					section,
					provider === 'exa' ? (searchExa ? 'exa_search' : 'exa_answer') : provider + '_search',
					result
				);
				const actual =
					provider === 'exa'
						? Number((result as { costDollars?: { total: number } }).costDollars?.total ?? 0.02)
						: provider === 'firecrawl'
							? Number((result as { creditsUsed?: number }).creditsUsed ?? 7)
							: Number((result as { usage?: { credits: number } }).usage?.credits ?? 1);
				const reserved = provider === 'exa' ? 0.02 : provider === 'firecrawl' ? 7 : 2;
				if (Number.isFinite(actual) && actual >= 0)
					await env.DB.prepare(
						'UPDATE provider_usage SET used=MAX(0,used+?) WHERE month=? AND provider=?'
					)
						.bind(actual - reserved, month, provider)
						.run();
				await env.DB.prepare("UPDATE research_jobs SET status='needs_review',result=? WHERE id=?")
					.bind(JSON.stringify(researchPreview(result)), id)
					.run();
			} catch (e) {
				await env.DB.prepare("UPDATE research_jobs SET status='failed',error=? WHERE id=?")
					.bind(e instanceof Error ? e.message : 'Research failed', id)
					.run();
			}
		}
	// Keep deduplication data bounded; public comments and sources remain independent.
	await env.DB.batch([
		env.DB.prepare("DELETE FROM search_events WHERE searched_at<datetime('now','-35 days')"),
		env.DB.prepare('DELETE FROM attempts WHERE expires<?').bind(Math.floor(Date.now() / 1000))
	]);
}
