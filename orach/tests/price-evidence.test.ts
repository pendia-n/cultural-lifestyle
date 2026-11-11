import test from 'node:test';import assert from 'node:assert/strict';
import {priceEvidence} from '../src/lib/server/price-evidence.ts';
import {researchEntries} from '../src/lib/server/research-entries.ts';
test('source price passages retain the deposit and eligibility conditions',()=>{
 const passage='Workshop admission is unknown. A refundable £30 deposit is required. Members only, Tuesday evenings.';
 const result=priceEvidence(passage);assert.equal(result.length,1);assert.match(result[0],/refundable £30 deposit/);assert.match(result[0],/Members only/);
 const [entry]=researchEntries({results:[{title:'Workshop',url:'https://example.org',content:passage}]},'play','city');assert.equal(entry.amount,null);assert.match(entry.detail,/rather than the total cost/);assert.match(entry.detail,/refundable £30 deposit/);
});
test('extracts original local currency without guessing generic dollar currency',()=>{assert.equal(priceEvidence('Laundry 300 JPY per cycle')[0],'Laundry 300 JPY per cycle');assert.deepEqual(priceEvidence('Laundry $5'),[]);assert.deepEqual(priceEvidence('data:application/pdf;base64,JPY300'),[])});
