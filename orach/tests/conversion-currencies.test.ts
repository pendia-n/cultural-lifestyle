import test from 'node:test';
import assert from 'node:assert/strict';
import {conversionCurrencies,isConversionCurrency,preferredCurrency} from '../src/lib/conversion-currencies.ts';
import {money} from '../src/lib/catalog.ts';
test('conversion options keep supported defaults and exclude partial, invented and crypto codes',()=>{
 assert(isConversionCurrency('HKD'));assert(isConversionCurrency('TND'));assert.equal(preferredCurrency('hkd'),'HKD');
 for(const code of ['HD','HK','','ZZZ','BTC']){assert(!isConversionCurrency(code));assert.equal(preferredCurrency(code),'HKD');}
 assert.equal(new Set(conversionCurrencies.map(c=>c.code)).size,conversionCurrencies.length);
});
test('invalid currency formatting never throws or claims an incorrect currency',()=>{
 for(const code of ['HD','HK','',undefined]){assert.doesNotThrow(()=>money(100,code as string));assert(money(100,code as string).includes('currency unavailable'));}
 assert(money(100,'HKD').includes('HK$'));assert(money(100,'TND').includes('TND'));
});
