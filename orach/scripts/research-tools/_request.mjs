import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { normalize, detectFormat } from './normalize.mjs';

function argumentsFor(argv) {
  const known = new Set(['city', 'country', 'boundary', 'currency', 'local-name', 'local-terms', 'date', 'out']);
  const options = { date: new Date().toISOString().slice(0, 10), out: './collected' };
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index];
    if (flag === '--send') { options.send = true; continue; }
    if (flag === '--help') { options.help = true; continue; }
    if (!flag.startsWith('--') || !known.has(flag.slice(2))) throw new Error(`Unknown option: ${flag}`);
    const value = argv[++index];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
    options[flag.slice(2)] = value;
  }
  if (options.help) return options;
  for (const key of ['city', 'country', 'boundary', 'currency']) {
    if (!options[key]?.trim()) throw new Error(`Supply --${key}.`);
  }
  if (!/^[A-Z]{3}$/.test(options.currency)) throw new Error('Currency must be a three-letter code, for example JPY.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.date)
      || Number.isNaN(Date.parse(options.date))
      || new Date(options.date).toISOString().slice(0, 10) !== options.date) throw new Error('Use a valid --date YYYY-MM-DD.');
  return options;
}

export function buildRequest(spec, options) {
  const context = {
    CITY: options.city, COUNTRY: options.country, BOUNDARY: options.boundary,
    CURRENCY: options.currency, CHECK_DATE: options.date,
    LOCAL_NAME: options['local-name'] ? `(${options['local-name']})` : '',
    LOCAL_TERMS: options['local-terms'] || ''
  };
  const prompt = spec.prompt.replace(/\{([A-Z_]+)\}/g, (_, key) => {
    if (!(key in context)) throw new Error(`Unresolved placeholder: ${key}`);
    return context[key];
  }).replace(/[ \t]+/g, ' ').trim();
  const settings = typeof spec.settings === 'function' ? spec.settings(context) : spec.settings;
  return { endpoint: spec.endpoint, body: { query: prompt, ...settings } };
}

export function runIfMain(url, spec) {
  if (!process.argv[1] || url !== pathToFileURL(process.argv[1]).href) return;
  run(spec).catch(error => { console.error(error.message); process.exitCode = 1; });
}

async function run(spec) {
  const options = argumentsFor(process.argv.slice(2));
  if (options.help) {
    console.log(`node ${spec.section}.mjs --city CITY --country COUNTRY --boundary AREA --currency CODE [--local-name NAME] [--local-terms TERMS] [--date YYYY-MM-DD] [--out DIRECTORY] [--send]\nDefault: preview only. --send makes exactly one provider request. Key: ${spec.keyName}.`);
    return;
  }
  const request = buildRequest(spec, options);
  if (!options.send) {
    console.log(JSON.stringify({ mode: 'preview_only', section: spec.section, key_environment_variable: spec.keyName, ...request }, null, 2));
    return;
  }
  const key = process.env[spec.keyName];
  if (!key || /[\r\n]/.test(key)) throw new Error(`Set ${spec.keyName} in your environment; never paste it into the script.`);
  const slug = options.city.normalize('NFKD').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'city';
  const folder = resolve(options.out, `${slug}-${spec.section}-${Date.now()}`);
  await mkdir(folder, { recursive: true, mode: 0o700 });
  await writeFile(join(folder, 'request.json'), JSON.stringify({
    section: spec.section, city: options.city, country: options.country, boundary: options.boundary,
    requested_as_of: options.date, ...request
  }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  let response;
  try {
    response = await fetch(request.endpoint, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(90000),
      headers: { 'Content-Type': 'application/json', ...spec.authentication(key) },
      body: JSON.stringify(request.body)
    });
  } catch {
    throw new Error(`Request failed or timed out. No automatic retry; the provider may still have charged it. Request saved in ${folder}.`);
  }
  const receivedAt = new Date().toISOString();
  const text = await response.text();
  const rawPath = join(folder, 'response.json');
  await writeFile(rawPath, text, { flag: 'wx', mode: 0o600 });
  await writeFile(join(folder, 'http.json'), JSON.stringify({ status: response.status, response_received_at: receivedAt }, null, 2), { flag: 'wx', mode: 0o600 });
  if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}; saved response in ${folder}. No retry.`);
  let value;
  try { value = JSON.parse(text); } catch { throw new Error(`Provider returned invalid JSON; saved in ${folder}.`); }
  if (value.success === false || !detectFormat(value)) throw new Error(`Unexpected provider response; saved in ${folder}. No retry.`);
  const normalized = normalize(value, {
    expected_format: spec.format, city: options.city, country: options.country,
    boundary: options.boundary, section: spec.section, requested_as_of: options.date,
    response_received_at: receivedAt, raw_response_path: rawPath
  });
  await writeFile(join(folder, 'research.json'), JSON.stringify(normalized, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ folder, review_status: normalized.review_status, usage: normalized.usage, counts: normalized.counts, warnings: normalized.warnings }, null, 2));
}
