import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cities, sections, manchester } from '../src/lib/catalog.ts';
test('32 unique chosen destinations and all eight sections', () => {
	assert.equal(cities.length, 32);
	assert.equal(new Set(cities.map((c) => c.slug)).size, 32);
	assert.equal(sections.length, 8);
	assert(!cities.some((c) => c.name === 'Seoul'));
	assert(cities.some((c) => c.name === 'Hanoi'));
	assert(cities.some((c) => c.name === 'Manchester'));
});
test('research excerpts preserve evidence and do not fabricate freshness', () => {
	for (const e of manchester) {
		assert(e.source.startsWith('https://'));
		assert(e.evidence.includes('.md'));
		assert(!('checked_at' in e));
		assert(sections.some((s) => s.id === e.section));
	}
	assert.equal(manchester.find((e) => e.id === 'familia-wheel')?.amount, 48);
	assert(manchester.find((e) => e.id === 'vintage-folk')?.detail.includes('not an everyday shop'));
});
