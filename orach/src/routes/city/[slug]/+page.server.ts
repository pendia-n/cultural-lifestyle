import {readOffers} from '#lib/server/offer-store';
import { researchEntries } from '#lib/server/research-entries';
import { sections } from '#lib/catalog';
import { readResearch } from '#lib/server/research-cache';
import { researchDisplay, type ResearchDisplay } from '#lib/server/research-display';
import { error } from '@sveltejs/kit';
import { cities, manchester, type Entry, type City } from '#lib/catalog';
export const load = async ({ params, platform }: import('./$types').PageServerLoadEvent) => {
	let city = cities.find((c) => c.slug === params.slug);
	if (!city && platform?.env.DB) {
		const row = await platform.env.DB.prepare(
			"SELECT c.slug,c.name,c.country,r.response_json FROM cities c LEFT JOIN section_research r ON r.city_slug=c.slug AND r.section='overview' WHERE c.slug=? AND c.status IN ('draft','published')"
		)
			.bind(params.slug)
			.first<{ slug: string; name: string; country: string; response_json: string | null }>();
		if (row) {
			const metadata = (await readResearch(platform.env.DB, row.slug, 'overview')) as {
				city?: { currency?: string };
			} | null;
			city = {
				slug: row.slug,
				name: row.name,
				country: row.country,
				currency: metadata?.city?.currency || 'XXX',
				region: '',
				color: '#c5d6c0',
				status: 'draft'
			} as City;
		}
	}
	if (!city) error(404, 'This destination is not in the collection yet.');
	let entries = city.slug === 'manchester' ? [...manchester] : [];
 const offers=platform?.env.DB?await readOffers(platform.env.DB,city.slug):[];
	if (platform?.env.DB) {
		const rows = await platform.env.DB.prepare(
			'SELECT data FROM city_entries WHERE city_slug=? AND published=1'
		)
			.bind(city.slug)
			.all<{ data: string }>();
		if (rows.results.length) entries = rows.results.map((r) => JSON.parse(r.data) as Entry);
	}
	const research: Record<string, ResearchDisplay> = {};
	if (platform?.env.DB) {
		const available = await platform.env.DB.prepare(
			'SELECT section FROM section_research WHERE city_slug=?'
		)
			.bind(city.slug)
			.all<{ section: string }>();
		await Promise.all(
			available.results.map(async ({ section }) => {
				const raw = await readResearch(platform.env.DB, city.slug, section);
				if (raw) {
					research[section] = researchDisplay(raw);
					if (
						sections.some((item) => item.id === section) &&
						!entries.some((entry) => entry.section === section)
					)
						entries.push(...researchEntries(raw, section as Entry['section'], city!.slug));
				}
			})
		);
	}
 // Source-listed offers replace placeholder-only cards, while non-price neighbourhood and lodging details remain useful.
 entries=entries.filter(entry=>entry.section==='neighbourhood'||entry.section==='stay'||entry.amount!==null||!offers.some(o=>o.section===entry.section));
 for(const offer of offers.filter(o=>o.kind!=='fee')){entries.push({id:offer.id,section:offer.section,name:offer.item,description:offer.sourceTitle,detail:offer.conditions+'\n\nSource passage:\n'+offer.evidence,amount:offer.amount,unit:(offer.from?'From · ':'')+(offer.upper&&offer.upper!==offer.amount?'up to '+offer.upper+' '+offer.currency+' · ':'')+offer.unit,source:offer.source,evidence:'Source-listed offer'+(offer.sourceDate?' · Source date '+offer.sourceDate:''),status:offer.comparable?'Source-listed price':'Source-listed · check conditions',priceCurrency:offer.currency});}
 const imageRow = platform?.env.DB ? await platform.env.DB.prepare('SELECT images_json FROM city_images WHERE city_slug=?').bind(city.slug).first<{images_json:string}>() : null;
	const images: string[] = imageRow ? JSON.parse(imageRow.images_json) : [];
	return { images,
		city: {
			...city,
			status: entries.length || Object.keys(research).length ? ('draft' as const) : city.status
		},
		entries,
		research
	};
};
