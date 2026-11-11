export const tavilySettings = (essentials = false) => ({
  search_depth: 'advanced',
  max_results: 10,
  chunks_per_source: 3,
  auto_parameters: false,
  topic: 'general',
  include_raw_content: 'markdown',
  include_answer: false,
  include_images: false,
  include_usage: true,
  exclude_domains: [
    'youtube.com', 'tiktok.com', 'reddit.com', 'quora.com', 'restaurantguru.com',
    ...(essentials ? ['numbeo.com', 'expatistan.com'] : [])
  ]
});

export const exaSearchSettings = () => ({
  type: 'auto',
  numResults: 10,
  excludeDomains: ['youtube.com', 'tiktok.com', 'reddit.com', 'quora.com'],
  contents: {
    text: { maxCharacters: 20000 },
    highlights: true,
    maxAgeHours: 24
  }
});

export const firecrawlSettings = context => ({
  sources: [{ type: 'web' }],
  limit: 8,
  location: `${context.CITY}, ${context.COUNTRY}`,
  domainTools: false,
  excludeDomains: [
    'facebook.com', 'instagram.com', 'youtube.com', 'tiktok.com',
    'reddit.com', 'quora.com', 'tripadvisor.com'
  ],
  scrapeOptions: {
    formats: ['markdown'],
    onlyMainContent: true,
    maxAge: 0,
    parsers: []
  }
});
