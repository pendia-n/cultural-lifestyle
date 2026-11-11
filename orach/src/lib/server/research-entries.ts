import {sourceExcerpt} from './source-excerpt.ts';
import {priceEvidence} from './price-evidence.ts';
import type { Entry, Section } from '../catalog.ts';
export function researchEntries(input: unknown, section: Section, city: string): Entry[] {
	if (!input || typeof input !== 'object') return [];
	const outer = input as Record<string, unknown>,
		value = (
			outer.response && typeof outer.response === 'object' ? outer.response : outer
		) as Record<string, unknown>;
	const data = value.data as Record<string, unknown> | undefined;
	const sources = (
		Array.isArray(value.citations)
			? value.citations
			: Array.isArray(value.results)
				? value.results
				: Array.isArray(data?.web)
					? data.web
					: Array.isArray(value.web)
						? value.web
						: []
	) as Record<string, unknown>[];
	const validUrl = (url: unknown) => {
		if (typeof url !== 'string') return null;
		try {
			const parsed = new URL(url);
			return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
		} catch {
			return null;
		}
	};
	const answer = value.answer as Record<string, unknown> | undefined;
	const items =
		answer && typeof answer === 'object' && Array.isArray(answer.items)
			? (answer.items as Record<string, unknown>[])
			: [];
	const records: Entry[] = [];
	for (const [index, item] of items.entries()) {
		if (typeof item.name !== 'string' || typeof item.summary !== 'string') continue;
		const evidence = Array.isArray(item.evidence)
			? (item.evidence as Record<string, unknown>[])
			: [];
		const source = evidence
			.map((row) => validUrl(row.source_url))
			.find((url) => url && sources.some((candidate) => validUrl(candidate.url) === url));
		if (!source) continue;
		const details =
			item.details && typeof item.details === 'object'
				? Object.entries(item.details)
						.filter(([, v]) => typeof v === 'string')
						.map(([k, v]) => `${k.replaceAll('_', ' ')}: ${v}`)
						.join('\n')
				: '';
		records.push({
			id: `${city}-${section}-research-${index}`,
			section,
			name: item.name,
			description: item.summary,
			detail: details,
			amount: null,
			unit: '',
			source,
			evidence: 'Collected provider response; original sources linked',
			status: 'Research draft'
		});
	}
	if (records.length) return records;
 // Preserve explicitly labelled Answer records as separate research drafts.
 // A fee mentioned in amenities is never treated as the room's nightly price.
 if(typeof value.answer==='string' && ['stay','neighbourhood'].includes(section)){
  const blocks=value.answer.split(/(?:^|\n)(?=NAME:\s*)/).filter(block=>block.startsWith('NAME:'));
  for(const [index,block] of blocks.entries()){
   const name=block.match(/^NAME:\s*(.+)/)?.[1]?.trim();
   const cited=[...block.matchAll(/\[(\d+)\]/g)].map(match=>sources[Number(match[1])-1]);
   const source=cited.map(row=>validUrl(row?.url)).find(Boolean);
   if(!name||!source)continue;
   const description=block.match(/(?:CHARACTER|SUITS|ACCOMMODATION TYPE):\s*(.+)/)?.[1]||'Collected place details; confirm current conditions with the linked source.';
   records.push({id:`${city}-${section}-answer-${index}`,section,name,description,detail:block,amount:null,unit:'',source,evidence:'Provider answer with source citations; not independently confirmed',status:'Research draft'});
  }
 }
 if(records.length)return records;
	const seen = new Set<string>();
	for (const [index, row] of sources.entries()) {
		const source = validUrl(row.url);
		if (!source || seen.has(source) || typeof row.title !== 'string') continue;
		const metadata = row.metadata as Record<string, unknown> | undefined;
		if (row.error || Number(metadata?.statusCode) >= 400) continue;
		seen.add(source);
		const highlights = Array.isArray(row.highlights)
			? row.highlights.filter((x) => typeof x === 'string').join(' ')
			: '';
		const passage =
			typeof row.content === 'string'
				? row.content
				: typeof row.markdown==='string'?row.markdown:typeof row.text==='string'?row.text:typeof row.raw_content==='string'?row.raw_content:typeof row.description === 'string'
					? row.description
					: highlights;
		const pricePassages=Array.isArray(row.price_evidence)?row.price_evidence.filter((x):x is string=>typeof x==='string'):priceEvidence(passage);
		const quote = sourceExcerpt(passage);
		records.push({
			id: `${city}-${section}-source-${index}`,
			section,
			name: row.title,
			description: quote || 'Open the linked source for the original information.',
			detail:
				'This is a collected source reference, not a verified venue recommendation. Check its exact location, dates, prices and eligibility before relying on it.'+(pricePassages.length?'\n\nSource price mentions — these may describe optional fees, deposits or restricted offers rather than the total cost:\n'+pricePassages.join('\n\n'):''),
			amount: null,
			unit: '',
			source,
			evidence: 'Original provider search result; conditions require checking',
			status: 'Source reference'
		});
	}
	return records;
}
