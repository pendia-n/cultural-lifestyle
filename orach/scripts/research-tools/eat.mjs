import { tavilySettings } from './_settings.mjs';
import { runIfMain } from './_request.mjs';
export const spec = {
  section: 'eat', format: 'tavily_search', keyName: 'TAVILY_API_KEY',
  endpoint: 'https://api.tavily.com/search', authentication: key => ({ Authorization: `Bearer ${key}` }),
  settings: tavilySettings(),
  prompt: '{CITY} {LOCAL_NAME}, {COUNTRY}, within {BOUNDARY}: restaurant official menu prices {CURRENCY}; local dishes, everyday lunch sets and vegetarian meals; exact branch, named dish, portion or course count, tax/service and offer times. {LOCAL_TERMS}'
};
runIfMain(import.meta.url, spec);
