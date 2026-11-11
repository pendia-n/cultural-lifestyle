export type ResearchDisplay = { summary: string; sources: { title: string; url: string }[] };
export function researchDisplay(input: unknown): ResearchDisplay {
	if (!input || typeof input !== 'object') return { summary: '', sources: [] };
	const envelope = input as Record<string, unknown>;
	const value = (
		envelope.response && typeof envelope.response === 'object' ? envelope.response : envelope
	) as Record<string, unknown>;
	let summary = '';
	if (typeof value.answer === 'string') summary = value.answer;
	else if (value.answer && typeof value.answer === 'object') {
		const answer = value.answer as Record<string, unknown>;
		if (typeof answer.answer === 'string') summary = answer.answer;
		else if (Array.isArray(answer.items))
			summary = answer.items
				.map((item) => {
					if (!item || typeof item !== 'object') return '';
					const row = item as Record<string, unknown>;
					return [row.name, row.summary].filter((x) => typeof x === 'string').join(': ');
				})
				.filter(Boolean)
				.join('\n\n');
	}
	const data = value.data as Record<string, unknown> | undefined;
	const rows = Array.isArray(value.citations)
		? value.citations
		: Array.isArray(value.results)
			? value.results
			: Array.isArray(data?.web)
				? data.web
				: Array.isArray(value.web)
					? value.web
					: [];
	const seen = new Set<string>();
	const sources = [];
	for (const row of rows) {
		if (!row || typeof row !== 'object') continue;
		const source = row as Record<string, unknown>;
		if (typeof source.url !== 'string' || typeof source.title !== 'string') continue;
		try {
			const url = new URL(source.url);
			if (url.protocol !== 'https:' && url.protocol !== 'http:') continue;
			if (seen.has(url.href)) continue;
			seen.add(url.href);
			sources.push({ title: source.title, url: url.href });
		} catch {
			/* Unsupported source URL. */
		}
	}
	return { summary, sources };
}
