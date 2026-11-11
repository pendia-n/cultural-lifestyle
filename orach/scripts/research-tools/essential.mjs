import { tavilySettings } from './_settings.mjs';
import { runIfMain } from './_request.mjs';
export const spec = {
  section: 'essential', format: 'tavily_search', keyName: 'TAVILY_API_KEY',
  endpoint: 'https://api.tavily.com/search', authentication: key => ({ Authorization: `Bearer ${key}` }),
  settings: tavilySettings(true),
  prompt: '{CITY} {LOCAL_NAME}, {COUNTRY}, within {BOUNDARY}: official supermarket prices milk eggs bread rice pack sizes; public laundromat wash dry tariff load size; tourist prepaid SIM data plans allowance validity; {CURRENCY}, named retailer or operator and local availability. {LOCAL_TERMS}'
};
runIfMain(import.meta.url, spec);
