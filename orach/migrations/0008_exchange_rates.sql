CREATE TABLE IF NOT EXISTS exchange_rates (base TEXT NOT NULL, quote TEXT NOT NULL, rate REAL NOT NULL, rate_date TEXT NOT NULL, fetched_day TEXT NOT NULL, PRIMARY KEY(base,quote));
