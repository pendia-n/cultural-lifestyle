import { firecrawlSettings } from './_settings.mjs';
import { runIfMain } from './_request.mjs';
export const spec = {
  section: 'transport', format: 'firecrawl_search', keyName: 'FIRECRAWL_API_KEY',
  endpoint: 'https://api.firecrawl.dev/v2/search', authentication: key => ({ Authorization: `Bearer ${key}` }),
  settings: firecrawlSettings,
  prompt: '{CITY} {LOCAL_NAME}, {COUNTRY}, {BOUNDARY}: official local transport operator adult bus rail single fares, day tickets or caps, airport-to-city tickets prices {CURRENCY}, fare zones, validity and transfer conditions. {LOCAL_TERMS}'
};
runIfMain(import.meta.url, spec);
