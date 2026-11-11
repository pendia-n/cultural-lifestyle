-- The initial 32 one-credit city image searches were collected outside the Worker.
-- Migration tracking ensures this adjustment is applied once.
INSERT INTO provider_usage(month,provider,used) VALUES('2026-10','tavily',32)
ON CONFLICT(month,provider) DO UPDATE SET used=used+32;
