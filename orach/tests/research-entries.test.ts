import test from 'node:test';import assert from 'node:assert/strict';
import {researchEntries} from '../src/lib/server/research-entries.ts';
test('labelled lodging records retain amenity fees without inventing room rates',()=>{
 const rows=researchEntries({answer:'NAME: Example hostel\nACCOMMODATION TYPE: Hostel\nLAUNDRY: 300 JPY per wash.\nMINIMUM STAY: Unknown.\nEVIDENCE: Kitchen on second floor [1].\n\nNAME: Another hotel\nSUITS: Short visits\nEVIDENCE: [2].',citations:[{url:'https://example.org/a'},{url:'https://example.org/b'}]},'stay','tokyo');
 assert.equal(rows.length,2);assert.equal(rows[0].amount,null);assert.match(rows[0].detail,/300 JPY per wash/);assert.match(rows[0].detail,/MINIMUM STAY: Unknown/);assert.equal(rows[1].source,'https://example.org/b');
});
test('unresolvable answer citations do not create recommendation cards',()=>{
 const rows=researchEntries({answer:'NAME: Unsupported venue\nEVIDENCE: [9]',citations:[]},'stay','city');assert.equal(rows.length,0);
});
