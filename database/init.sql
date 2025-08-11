CREATE USER docker;
GRANT ALL PRIVILEGES ON DATABASE zger TO docker;

\c zger;

CREATE TABLE monthly_exchange_rates_urls (
  id VARCHAR PRIMARY KEY UNIQUE,
  url TEXT NOT NULL
);

CREATE TABLE rates (
  id SERIAL PRIMARY KEY,
  currency VARCHAR(255) NOT NULL,
  bid DECIMAL NOT NULL,
  ask DECIMAL NOT NULL,
  mid_rate DECIMAL NOT NULL,
  bid_rate_zwg DECIMAL NOT NULL,
  ask_rate_zwg DECIMAL NOT NULL,
  mid_rate_zwg DECIMAL NOT NULL,
  created_at DATE NOT NULL DEFAULT CURRENT_DATE,
  previous_rate INTEGER,

  CONSTRAINT unique_currency_date UNIQUE (currency, created_at),
  CONSTRAINT fk_previous_rate FOREIGN KEY (previous_rate) REFERENCES rates(id)
);

CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  expiration_time TIMESTAMP,
  auth TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

