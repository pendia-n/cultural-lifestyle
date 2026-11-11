import {saveOffers} from './offer-store.ts';
import { researchPreview } from './research-preview.ts';
export async function readResearch(
	db: D1Database,
	slug: string,
	section: string
): Promise<unknown | null> {
	const row = await db
		.prepare('SELECT response_json FROM section_research WHERE city_slug=? AND section=?')
		.bind(slug, section)
		.first<{ response_json: string }>();
	if (!row) return null;
	const value = JSON.parse(row.response_json);
	if (value.storage !== 'chunks') return value;
 if(value.preview) return value.preview;
	if (
		!Number.isInteger(value.count) ||
		value.count < 1 ||
		value.count > 1000 ||
		!/^[a-f0-9]{64}$/.test(value.version)
	)
		throw new Error('Invalid research manifest');
	const chunks = await db
		.prepare(
			'SELECT chunk_index,content FROM section_research_chunks WHERE city_slug=? AND section=? AND version=? ORDER BY chunk_index'
		)
		.bind(slug, section, value.version)
		.all<{ chunk_index: number; content: string }>();
	if (
		chunks.results.length !== value.count ||
		chunks.results.some((chunk, index) => chunk.chunk_index !== index)
	)
		throw new Error('Research cache is incomplete');
	const serialized = chunks.results.map((chunk) => chunk.content).join('');
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serialized));
	const hash = Array.from(new Uint8Array(digest), (byte) =>
		byte.toString(16).padStart(2, '0')
	).join('');
	if (hash !== value.version) throw new Error('Research cache integrity check failed');
	return JSON.parse(serialized);
}

export async function writeResearch(
	db: D1Database,
	slug: string,
	section: string,
	format: string,
	value: unknown
) {
	const serialized = JSON.stringify(value);
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serialized));
	const version = Array.from(new Uint8Array(digest), (byte) =>
		byte.toString(16).padStart(2, '0')
	).join('');
	const characters = Array.from(serialized),
		chunks: string[] = [];
	for (let offset = 0; offset < characters.length; offset += 8000)
		chunks.push(characters.slice(offset, offset + 8000).join(''));
	if (!chunks.length || chunks.length > 1000)
		throw new Error('Research response exceeds cache capacity');
	for (let offset = 0; offset < chunks.length; offset += 40) {
		await db.batch(
			chunks
				.slice(offset, offset + 40)
				.map((content, index) =>
					db
						.prepare(
							'INSERT OR IGNORE INTO section_research_chunks(city_slug,section,version,chunk_index,content) VALUES(?,?,?,?,?)'
						)
						.bind(slug, section, version, offset + index, content)
				)
		);
	}
	await db
		.prepare(
			'INSERT INTO section_research(city_slug,section,provider_format,response_json) VALUES(?,?,?,?) ON CONFLICT(city_slug,section) DO UPDATE SET provider_format=excluded.provider_format,response_json=excluded.response_json,imported_at=CURRENT_TIMESTAMP'
		)
		.bind(
			slug,
			section,
			format,
			JSON.stringify({ storage: 'chunks', version, count: chunks.length, preview: researchPreview(value) })
		)
		.run();
 await saveOffers(db,slug,section,value,version);
}
