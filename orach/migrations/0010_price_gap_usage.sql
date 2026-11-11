-- Account for the bounded November 2026 price-gap collection once.
INSERT INTO provider_usage(month,provider,used) VALUES('2026-11','tavily',46.0) ON CONFLICT(month,provider) DO UPDATE SET used=used+excluded.used;
INSERT INTO provider_usage(month,provider,used) VALUES('2026-11','exa',0.10500000000000004) ON CONFLICT(month,provider) DO UPDATE SET used=used+excluded.used;
INSERT INTO provider_usage(month,provider,used) VALUES('2026-11','firecrawl',63.0) ON CONFLICT(month,provider) DO UPDATE SET used=used+excluded.used;
