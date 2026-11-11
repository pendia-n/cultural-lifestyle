// Four response adapters. This standardizes evidence containers, not factual claims.
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function detectFormat(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (Array.isArray(value.citations) && Object.hasOwn(value, 'answer')) return 'exa_answer';
  if (Array.isArray(value.data?.web) || Array.isArray(value.web)) return 'firecrawl_search';
  if (Array.isArray(value.results) && (value.costDollars || value.requestId)) return 'exa_search';
  if (Array.isArray(value.results) && (value.request_id || value.usage || Object.hasOwn(value, 'query'))) return 'tavily_search';
  return null;
}

// A Markdown file may start with a JS request or contain several JSON-shaped blocks.
// Select one complete provider envelope; reject ambiguous independent responses.
// Never evaluate code or repair broken JSON.
export function parseSavedDocument(input) {
  const text = input.replace(/^\uFEFF/, '').trim();
  try {
    const object = JSON.parse(text);
    if (detectFormat(object)) return object;
  } catch { /* Try complete objects embedded in Markdown. */ }
  const candidates = [];
  const starts = new Set([...text.matchAll(/(?:^|\n)[ \t]*\{|```(?:json)?[ \t]*\{|(?:Results?|Response|JSON)[ \t]*:[ \t]*\{/gmi)]
    .map(match => text.indexOf('{', match.index)));
  for (const start of starts) {
    let depth = 0, inString = false, escaped = false;
    for (let end = start; end < text.length; end++) {
      const char = text[end];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') inString = false;
      } else if (char === '"') inString = true;
      else if (char === '{') depth++;
      else if (char === '}' && --depth === 0) {
        try {
          const object = JSON.parse(text.slice(start, end + 1));
          if (detectFormat(object)) candidates.push({ object, start, end: end + 1 });
        } catch { /* Invalid JSON is not importable evidence. */ }
        break;
      }
    }
  }
  const independent = candidates.filter(candidate => !candidates.some(other => other !== candidate
    && other.start < candidate.start && other.end >= candidate.end));
  if (!independent.length) throw new Error('No complete supported provider response found.');
  if (independent.length > 1) throw new Error('Multiple provider responses found. Split the exports; do not guess which response belongs to this city.');
  return independent[0].object;
}

function canonicalUrl(value) {
  try {
    const url = new URL(value);
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^utm_/i.test(key) || ['fbclid', 'gclid', 'srsltid'].includes(key)) url.searchParams.delete(key);
    }
    return url.href;
  } catch { return value || null; }
}
const textValue = value => typeof value === 'string' ? value : '';

export function normalize(value, context = {}) {
  const format = detectFormat(value);
  if (!format) throw new Error('Unexpected response format. Preserve the raw response for review.');
  const rows = format === 'exa_answer' ? value.citations
    : format === 'firecrawl_search' ? (value.data?.web ?? value.web) : value.results;
  const seen = new Map();
  const sources = rows.map((row, index) => {
    const metadata = row.metadata || {};
    const fullText = format === 'tavily_search' ? textValue(row.raw_content)
      : format === 'firecrawl_search' ? textValue(row.markdown) : textValue(row.text);
    const snippet = textValue(row.content || row.description);
    const highlights = (Array.isArray(row.highlights) ? row.highlights : [])
      .map(item => typeof item === 'string' ? item : textValue(item?.text)).filter(Boolean);
    const statusValue = metadata.statusCode ?? metadata.status_code ?? row.statusCode ?? null;
    const statusCode = statusValue !== null && Number.isFinite(Number(statusValue)) ? Number(statusValue) : statusValue;
    const failed = Boolean(row.error) || (typeof statusCode === 'number' && statusCode >= 400);
    const canonical = canonicalUrl(row.url || row.id);
    const sourceId = `s${index + 1}`;
    const duplicateOf = canonical ? seen.get(canonical) || null : null;
    if (canonical && !duplicateOf) seen.set(canonical, sourceId);
    return {
      source_id: sourceId, url: row.url || null, canonical_url: canonical,
      title: row.title || null, source_type: 'unclassified',
      published_at: row.publishedDate || row.published_date || metadata.publishedTime || null,
      page_retrieved_at: metadata.scrapedAt || metadata.scraped_at || null,
      text: fullText || snippet || highlights.join('\n'),
      text_kind: fullText ? 'page_extract' : snippet ? 'snippet' : highlights.length ? 'highlights' : 'none',
      snippet, highlights, status_code: statusCode,
      retrieval_status: failed ? 'failed' : fullText ? 'page_extract_returned'
        : snippet || highlights.length ? 'snippet_only' : 'no_content',
      duplicate_of: duplicateOf,
      extraction_limit_may_be_reached: format === 'exa_search' && fullText.length >= 20000,
      scrape_metadata: format === 'firecrawl_search' ? metadata : null
    };
  });
  const expected = context.expected_format || ({
    eat: 'tavily_search', drink: 'tavily_search', essential: 'tavily_search',
    play: 'exa_search', clothing: 'exa_search', neighbourhood: 'exa_answer',
    stay: 'exa_answer', transport: 'firecrawl_search'
  })[context.section] || null;
  const warnings = [];
  if (expected && expected !== format) warnings.push(`Expected ${expected}; received ${format}.`);
  if (!sources.length) warnings.push('No sources returned.');
  if (sources.some(source => source.duplicate_of)) warnings.push('Duplicate source URLs found.');
  if (sources.some(source => source.retrieval_status === 'failed')) warnings.push('At least one page retrieval failed.');
  if (sources.some(source => source.extraction_limit_may_be_reached)) warnings.push('A text limit may omit later conditions.');
  if (sources.every(source => source.text_kind !== 'page_extract')) warnings.push('No full-page extracts returned.');
  const answer = format === 'exa_answer' ? value.answer : null;
  const answerItems = answer && typeof answer === 'object' && Array.isArray(answer.items) ? answer.items : null;
  return {
    schema_version: 'orach.research.v1', city: context.city || null,
    country: context.country || null, boundary: context.boundary || null,
    section: context.section || null, requested_as_of: context.requested_as_of || null,
    response_received_at: context.response_received_at || null,
    format, request_id: value.request_id || value.requestId || null,
    usage: format === 'tavily_search' ? { tavily_credits: value.usage?.credits ?? null }
      : format === 'firecrawl_search' ? { firecrawl_credits: value.creditsUsed ?? null }
        : { exa_usd: value.costDollars?.total ?? null, breakdown: value.costDollars || null },
    raw_response_path: context.raw_response_path || null, sources,
    answer, search_synthesis: format === 'exa_search' ? value.output ?? null : null,
    // Proposed model records are candidates, never facts approved for publication.
    candidate_items: answerItems, review_status: 'needs_review', warnings,
    counts: {
      returned_sources: sources.length,
      unique_source_urls: seen.size,
      successful_page_extracts: sources.filter(source => source.text_kind === 'page_extract'
        && source.retrieval_status !== 'failed' && !source.duplicate_of).length
    }
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [input, output, city, section] = process.argv.slice(2);
  if (!input || !output || !city || !section) {
    console.error('Usage: node normalize.mjs INPUT.md OUTPUT.json CITY SECTION');
    process.exitCode = 1;
  } else {
    try {
      const value = parseSavedDocument(await readFile(input, 'utf8'));
      const normalized = normalize(value, { city, section, raw_response_path: input });
      await writeFile(output, JSON.stringify(normalized, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
      console.log(JSON.stringify({ output, format: normalized.format, ...normalized.counts }));
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
