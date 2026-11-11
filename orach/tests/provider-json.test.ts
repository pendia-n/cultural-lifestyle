import test from 'node:test';import assert from 'node:assert/strict';
import {providerJson} from '../src/lib/server/provider-json.ts';
test('oversized chunked provider response is cancelled before JSON parsing',async()=>{
 let cancelled=false;const stream=new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode('x'.repeat(100)))},cancel(){cancelled=true}});
 await assert.rejects(()=>providerJson(new Response(stream),50),/exceeds/);assert.equal(cancelled,true);
});
test('bounded JSON preserves complete Unicode content',async()=>{const body={answer:'東京 · £30 deposit'};assert.deepEqual(await providerJson(Response.json(body)),body)});
