import { cities, type City } from '../catalog.ts';
export async function cityDirectory(db: D1Database | undefined): Promise<City[]> {
	if (!db) return cities;
	const rows = await db
		.prepare(
			"SELECT c.slug,c.name,c.country,r.response_json FROM cities c LEFT JOIN section_research r ON r.city_slug=c.slug AND r.section='overview' WHERE c.status IN ('draft','published')"
		)
		.all<{ slug: string; name: string; country: string; response_json: string | null }>();
	const known = new Set(cities.map((c) => c.slug));
	const available = await db
		.prepare('SELECT DISTINCT city_slug FROM section_research')
		.all<{ city_slug: string }>();
	const researched = new Set(available.results.map((row) => row.city_slug));
	return [
		...cities.map((city) =>
			researched.has(city.slug) ? { ...city, status: 'draft' as const } : city
		),
		...rows.results
			.filter((r) => !known.has(r.slug))
			.map((r) => {
				let currency = 'XXX';
				try {
					const data = JSON.parse(r.response_json || '{}');
					currency = (data.preview || data).city?.currency || 'XXX';
				} catch {}
				return {
					slug: r.slug,
					name: r.name,
					country: r.country,
					currency,
					region: 'New destinations',
					color: '#c5d6c0',
					status: 'draft'
				} as City;
			})
	];
}

export async function cityImages(db: D1Database | undefined): Promise<Record<string, string[]>> {
	if (!db) return {};
	const rows = await db
		.prepare('SELECT city_slug,cover_url,images_json FROM city_images')
		.all<{ city_slug: string; cover_url: string | null; images_json: string }>();
	return Object.fromEntries(
		rows.results.map((row) => {
			let urls: string[] = [];
			try {
				const saved = JSON.parse(row.images_json);
				if (Array.isArray(saved))
					urls = saved.filter(
						(url: unknown): url is string => typeof url === 'string' && /^https?:\/\//.test(url)
					);
			} catch {}
			return [row.city_slug, urls.length ? urls : row.cover_url ? [row.cover_url] : []];
		})
	);
}
