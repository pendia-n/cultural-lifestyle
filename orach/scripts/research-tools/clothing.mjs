import { exaSearchSettings } from './_settings.mjs';
import { runIfMain } from './_request.mjs';
export const spec = {
  section: 'clothing', format: 'exa_search', keyName: 'EXA_API_KEY',
  endpoint: 'https://api.exa.ai/search', authentication: key => ({ 'x-api-key': key }),
  settings: exaSearchSettings(),
  prompt: '{CITY} {LOCAL_NAME}, {COUNTRY}, within {BOUNDARY}: local clothing designers, independent everyday clothing shops, vintage/secondhand stores and clothing markets with official named garment/product prices in {CURRENCY}. Find public storefront address, opening/access conditions, example garment, regular or sale amount, tax and stock/event restrictions. Clothing for purchase: distinguish it from shipping, cleaning, tools, workshops, deposits and entry fees. A company registration address does not establish a walk-in shop; retain relocation and event dates. As of {CHECK_DATE}. {LOCAL_TERMS}'
};
runIfMain(import.meta.url, spec);
