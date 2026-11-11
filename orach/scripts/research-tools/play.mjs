import { exaSearchSettings } from './_settings.mjs';
import { runIfMain } from './_request.mjs';
export const spec = {
  section: 'play', format: 'exa_search', keyName: 'EXA_API_KEY',
  endpoint: 'https://api.exa.ai/search', authentication: key => ({ 'x-api-key': key }),
  settings: exaSearchSettings(),
  prompt: '{CITY} {LOCAL_NAME}, {COUNTRY}, within {BOUNDARY}: official visitor pages for a varied mix of free public culture, museums, beginner creative workshops and participatory local activities. Find ongoing or recurring experiences open to adult short-stay visitors as of {CHECK_DATE}, named activity, local address, {CURRENCY} price per person/session, duration, inclusions, compulsory fees and booking requirements. Keep event dates, application deadlines, language, residency and age restrictions explicit. A deposit, materials fee, stay-inclusive perk or free-with-paid-entry activity is not the total public admission price. {LOCAL_TERMS}'
};
runIfMain(import.meta.url, spec);
