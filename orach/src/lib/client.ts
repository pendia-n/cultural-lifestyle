export async function api(path: string, body?: unknown) {
	const r = await fetch(
		'/api/' + path,
		body === undefined
			? {}
			: {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body)
				}
	);
	let data: any;
	try {
		data = await r.json();
	} catch {
		throw new Error('Could not reach Orach. Please try again.');
	}
	if (!r.ok) throw new Error(data.message ?? 'Please try again.');
	return data;
}
export function readLocal<T>(key: string, fallback: T): T {
	try {
		return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback;
	} catch {
		return fallback;
	}
}
