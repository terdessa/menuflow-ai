-- MenuFlow AI Database Setup
-- Run this in your Neon Postgres console

CREATE TABLE IF NOT EXISTS menus (
  id              TEXT PRIMARY KEY,
  saved_at        TIMESTAMP DEFAULT NOW(),
  restaurant_name TEXT,
  location        TEXT,
  language        TEXT,
  menu            JSONB
);

CREATE TABLE IF NOT EXISTS telegram_users (
  chat_id             BIGINT PRIMARY KEY,
  state               TEXT DEFAULT 'new',
  allergies           TEXT[] DEFAULT '{}',
  spice_tolerance     TEXT DEFAULT 'medium',
  exclude_ingredients TEXT[] DEFAULT '{}',
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menus_saved_at ON menus (saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_telegram_users_state ON telegram_users (state);
