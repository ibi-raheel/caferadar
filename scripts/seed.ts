import Database from "better-sqlite3";
import path from "path";
import { scrapeAllShopify } from "../src/lib/scrapers/shopify";
import { scrapeAllCommodities } from "../src/lib/scrapers/commodities";

const DB_PATH = path.join(process.cwd(), "data", "prices.db");

async function main() {
  console.log("=== CafeRadar - Initial Data Seed ===\n");

  // Ensure data directory exists
  const fs = await import("fs");
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  // Delete existing DB for clean seed
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log("Deleted existing database\n");
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Create schema
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

  console.log("Database schema created\n");

  // Scrape Shopify suppliers
  console.log("--- Shopify Suppliers ---");
  await scrapeAllShopify(db);

  // Scrape commodities
  console.log("\n--- Commodity Data ---");
  await scrapeAllCommodities(db);

  // Print summary
  const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
  const variantCount = db.prepare("SELECT COUNT(*) as count FROM variants").get() as { count: number };
  const priceCount = db.prepare("SELECT COUNT(*) as count FROM prices").get() as { count: number };
  const commodityCount = db.prepare("SELECT COUNT(*) as count FROM commodity_prices").get() as { count: number };
  const salesCount = db.prepare("SELECT COUNT(*) as count FROM prices WHERE compare_at_price IS NOT NULL").get() as { count: number };

  console.log("\n=== Seed Complete ===");
  console.log(`Products: ${productCount.count}`);
  console.log(`Variants: ${variantCount.count}`);
  console.log(`Price records: ${priceCount.count}`);
  console.log(`Items on sale: ${salesCount.count}`);
  console.log(`Commodity data points: ${commodityCount.count}`);

  db.close();
}

main().catch(console.error);
