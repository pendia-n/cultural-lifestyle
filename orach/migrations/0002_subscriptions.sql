-- Recurring billing state, separate from historical one-time stay passes.
CREATE TABLE IF NOT EXISTS subscriptions (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES users(id),
 status TEXT NOT NULL,
 current_period_end INTEGER NOT NULL,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS subscriptions_active ON subscriptions(status,current_period_end);
