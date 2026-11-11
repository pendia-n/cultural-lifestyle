import { tavilySettings } from './_settings.mjs';
import { runIfMain } from './_request.mjs';
export const spec = {
  section: 'drink', format: 'tavily_search', keyName: 'TAVILY_API_KEY',
  endpoint: 'https://api.tavily.com/search', authentication: key => ({ Authorization: `Bearer ${key}` }),
  settings: tavilySettings(),
  prompt: '{CITY} {LOCAL_NAME}, {COUNTRY}, within {BOUNDARY}: cafe tea house bar official drinks menu prices {CURRENCY}; named coffee, tea, distinctive local drinks and alcohol-free options; exact branch, serving size, service charge, cover charge and minimum spend. {LOCAL_TERMS}'
};
runIfMain(import.meta.url, spec);
