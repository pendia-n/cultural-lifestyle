import test from 'node:test';
import assert from 'node:assert/strict';
import {researchPreview} from '../src/lib/server/research-preview.ts';
test('presentation keeps source evidence without large binary payloads',()=>{
 const result=researchPreview({answer:'Evidence',results:[{title:'Source',url:'https://example.org',content:'a'.repeat(5000),raw_content:'data:application/pdf;base64,'+'x'.repeat(10000)}]}) as any;
 assert.equal(result.answer,'Evidence');assert.equal(result.results[0].content.length,2000);assert.equal(result.results[0].raw_content,undefined);assert.equal(result.results[0].url,'https://example.org');
});
