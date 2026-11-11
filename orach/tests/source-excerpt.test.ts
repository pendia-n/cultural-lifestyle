import test from 'node:test';import assert from 'node:assert/strict';import {sourceExcerpt} from '../src/lib/server/source-excerpt.ts';
test('source excerpts remove Markdown formatting without changing claims',()=>{assert.equal(sourceExcerpt('![logo](https://example.org/logo.png) [Lunch](https://example.org/menu) **£20**, Tuesday only.'),'Lunch £20, Tuesday only.')});
test('navigation-heavy scrapes do not masquerade as a useful source summary',()=>{assert.equal(sourceExcerpt('Skip to content. Login. Subscribe. Navigation drawer. Cookies.'),'')});
