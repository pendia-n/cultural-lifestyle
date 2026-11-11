// Current fiat currencies returned by Frankfurter /v2/currencies, checked 8 November 2026.
import supported from './conversion-currencies.json' with {type:'json'};
export const conversionCurrencies=supported;
const codes=new Set(supported.map(c=>c.code));
export function isConversionCurrency(value:unknown):value is string{return typeof value==='string'&&codes.has(value);}
export function preferredCurrency(value:unknown){const code=typeof value==='string'?value.trim().toUpperCase():'';return isConversionCurrency(code)?code:'HKD';}
