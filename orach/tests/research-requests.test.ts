import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parallelSections, overviewRequest } from '../src/lib/server/research-requests.ts';
test('new-city overview preserves requested schema and full citation text', () => {
	const request = overviewRequest({ name: 'Florence', country: 'Italy' });
	assert(request.body.query.includes('Florence, Italy'));
	assert.equal(request.body.text, true);
	assert.equal(
		request.body.outputSchema.properties.answer.description,
		'1 sentence answer for the search query'
	);
});
test('all eight sections start concurrently and isolate a failed section', async () => {
	let started = 0;
	let release: () => void = () => {};
	const barrier = new Promise<void>((resolve) => {
		release = resolve;
	});
	const pending = parallelSections(
		{ name: 'Florence', country: 'Italy' },
		async (section, request) => {
			started++;
			await barrier;
			assert(request.body.query.includes('Florence, Italy'));
			if (section === 'play') throw new Error('fixture failure');
			return section;
		}
	);
	assert.equal(started, 8);
	release();
	const results = await pending;
	assert.equal(results.filter((x) => x.status === 'fulfilled').length, 7);
	assert.equal(results.filter((x) => x.status === 'rejected').length, 1);
});
