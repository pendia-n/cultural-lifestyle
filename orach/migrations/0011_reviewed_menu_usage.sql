-- Five bounded menu/admission follow-ups during release verification.
INSERT INTO provider_usage(month,provider,used) VALUES('2026-11','tavily',8.0) ON CONFLICT(month,provider) DO UPDATE SET used=used+excluded.used;
INSERT INTO provider_usage(month,provider,used) VALUES('2026-11','exa',0.007) ON CONFLICT(month,provider) DO UPDATE SET used=used+excluded.used;
