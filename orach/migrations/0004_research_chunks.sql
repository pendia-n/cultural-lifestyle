CREATE TABLE IF NOT EXISTS section_research_chunks (
 city_slug TEXT NOT NULL,
 section TEXT NOT NULL,
 version TEXT NOT NULL,
 chunk_index INTEGER NOT NULL,
 content TEXT NOT NULL,
 PRIMARY KEY(city_slug,section,version,chunk_index)
);
