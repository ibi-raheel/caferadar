import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "prices.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      base_url TEXT NOT NULL,
      platform TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      supplier_id TEXT NOT NULL REFERENCES suppliers(id),
      external_id TEXT,
      title TEXT NOT NULL,
      vendor TEXT,
      product_type TEXT,
      tags TEXT,
      image_url TEXT,
      product_url TEXT,
      first_seen_at TEXT DEFAULT (datetime('now')),
      last_seen_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id),
      external_id TEXT,
      title TEXT NOT NULL,
      sku TEXT,
      available INTEGER DEFAULT 1,
      unit_count INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      variant_id TEXT NOT NULL REFERENCES variants(id),
      price REAL NOT NULL,
      compare_at_price REAL,
      per_unit_price REAL,
      scraped_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_prices_variant_date ON prices(variant_id, scraped_at DESC);

    CREATE TABLE IF NOT EXISTS commodity_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      series_id TEXT NOT NULL,
      series_name TEXT NOT NULL,
      source TEXT NOT NULL,
      period TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT,
      fetched_at TEXT DEFAULT (datetime('now')),
      UNIQUE(series_id, period)
    );
  `);
}
