CREATE TABLE IF NOT EXISTS section_research (
 city_slug TEXT NOT NULL REFERENCES cities(slug),
 section TEXT NOT NULL,
 provider_format TEXT NOT NULL,
 response_json TEXT NOT NULL,
 imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(city_slug,section)
);
CREATE TABLE IF NOT EXISTS research_rejections (
 source_path TEXT PRIMARY KEY,
 reason TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
