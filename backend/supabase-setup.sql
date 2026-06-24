-- Run these SQL commands in your Supabase SQL Editor

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  price REAL,
  description TEXT,
  image_url TEXT,
  created_date TEXT,
  updated_date TEXT
);

-- Users table
CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_date TEXT
);

-- Configs table
CREATE TABLE IF NOT EXISTS catalogue_configs (
  id TEXT PRIMARY KEY,
  config_key TEXT UNIQUE NOT NULL,
  values TEXT,
  created_date TEXT
);

-- Edit logs table
CREATE TABLE IF NOT EXISTS edit_logs (
  id TEXT PRIMARY KEY,
  action TEXT,
  entity_type TEXT,
  entity_id TEXT,
  changes TEXT,
  user TEXT,
  timestamp TEXT
);

-- Export logs table
CREATE TABLE IF NOT EXISTS export_logs (
  id TEXT PRIMARY KEY,
  filename TEXT,
  format TEXT,
  record_count INTEGER,
  user TEXT,
  timestamp TEXT
);

-- Insert default admin user (password: admin123)
INSERT INTO app_users (id, username, password, role, created_date)
VALUES ('user_dexter', 'dexter', 'admin123', 'admin', NOW()::text)
ON CONFLICT (id) DO NOTHING;

-- Insert default configs
INSERT INTO catalogue_configs (id, config_key, values, created_date)
VALUES 
  ('config_brands', 'brands', '["DUPONT", "ELIE BLEU", "LFL", "MORICI", "RECIFE", "SIGLO", "VINBRO", "XIKAR"]', NOW()::text),
  ('config_categories', 'categories', '["Ashtray", "Case", "Cutter", "Humidor", "Lighter", "Pen", "Others", "Set"]', NOW()::text)
ON CONFLICT (id) DO NOTHING;