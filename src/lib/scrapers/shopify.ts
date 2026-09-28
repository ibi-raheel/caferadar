import type Database from "better-sqlite3";

interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  sku: string | null;
  available: boolean;
}

interface ShopifyProduct {
  id: number;
  title: string;
  vendor: string;
  product_type: string;
  tags: string[];
  images: { src: string }[];
  variants: ShopifyVariant[];
  handle: string;
}

interface SupplierConfig {
  id: string;
  name: string;
  base_url: string;
  collections: string[];
  delay: number;
}

export const SUPPLIERS: SupplierConfig[] = [
  {
    id: "barista_underground",
    name: "Barista Underground",
    base_url: "https://www.baristaunderground.com",
    collections: [
      "syrups", "sauces", "chai", "matcha", "coffee",
      "alt-milk-collection", "best-sellers", "tea",
    ],
    delay: 3000,
  },
  {
    id: "westrock_coffee",
    name: "Westrock Coffee",
    base_url: "https://shop.westrockcoffee.com",
    collections: [],
    delay: 3000,
  },
  {
    id: "elmhurst_1925",
    name: "Elmhurst 1925",
    base_url: "https://www.elmhurst1925.com",
    collections: [],
    delay: 3000,
  },
];

function extractUnitCount(variantTitle: string): number {
  // "(24 cartons)" or "(24 total)"
  const parenMatch = variantTitle.match(/\((\d+)\s*(?:cartons?|total|units?|bottles?|cans?)\)/i);
  if (parenMatch) return parseInt(parenMatch[1]);

  // "N cases of M"
  const casesOfMatch = variantTitle.match(/(\d+)\s*cases?\s*of\s*(\d+)/i);
  if (casesOfMatch) return parseInt(casesOfMatch[1]) * parseInt(casesOfMatch[2]);

  // "Case of N"
  const caseMatch = variantTitle.match(/case\s*of\s*(\d+)/i);
  if (caseMatch) return parseInt(caseMatch[1]);

  // "N-pack" or "N pack"
  const packMatch = variantTitle.match(/(\d+)\s*-?\s*pack/i);
  if (packMatch) return parseInt(packMatch[1]);

  return 1;
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "CafeRadar/1.0 (price-monitor)" },
        signal: AbortSignal.timeout(15000),
      });
      if (res.status === 429) {
        console.log(`  Rate limited, waiting 10s...`);
        await new Promise((r) => setTimeout(r, 10000));
        continue;
      }
      if (res.status >= 500) {
        console.log(`  Server error ${res.status}, retrying...`);
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      if (!res.ok) {
        console.log(`  HTTP ${res.status} for ${url}`);
        return null;
      }
      return res;
    } catch (e) {
      console.log(`  Fetch error (attempt ${i + 1}): ${e}`);
      if (i < retries - 1) await new Promise((r) => setTimeout(r, 3000));
    }
  }
  return null;
}

async function fetchProducts(baseUrl: string, delay: number): Promise<ShopifyProduct[]> {
  const allProducts = new Map<number, ShopifyProduct>();
  let page = 1;

  // Fetch /products.json with pagination
  while (true) {
    const url = `${baseUrl}/products.json?limit=250&page=${page}`;
    console.log(`  Fetching ${url}`);
    const res = await fetchWithRetry(url);
    if (!res) break;

    const data = await res.json();
    const products: ShopifyProduct[] = data.products || [];
    if (products.length === 0) break;

    for (const p of products) {
      allProducts.set(p.id, p);
    }

    if (products.length < 250) break;
    page++;
    await new Promise((r) => setTimeout(r, delay));
  }

  return Array.from(allProducts.values());
}

export async function scrapeSupplier(supplier: SupplierConfig, db: Database.Database): Promise<number> {
  console.log(`Scraping ${supplier.name}...`);

  // Upsert supplier
  db.prepare(`
    INSERT OR REPLACE INTO suppliers (id, name, base_url, platform)
    VALUES (?, ?, ?, 'shopify')
  `).run(supplier.id, supplier.name, supplier.base_url);

  const products = await fetchProducts(supplier.base_url, supplier.delay);
  console.log(`  Found ${products.length} products`);

  const upsertProduct = db.prepare(`
    INSERT INTO products (id, supplier_id, external_id, title, vendor, product_type, tags, image_url, product_url, last_seen_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      vendor = excluded.vendor,
      product_type = excluded.product_type,
      tags = excluded.tags,
      image_url = excluded.image_url,
      last_seen_at = datetime('now')
  `);

  const upsertVariant = db.prepare(`
    INSERT INTO variants (id, product_id, external_id, title, sku, available, unit_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      available = excluded.available,
      unit_count = excluded.unit_count
  `);

  const insertPrice = db.prepare(`
    INSERT INTO prices (variant_id, price, compare_at_price, per_unit_price)
    VALUES (?, ?, ?, ?)
  `);

  const insertAll = db.transaction(() => {
    for (const product of products) {
      const productId = `${supplier.id}:${product.id}`;
      const imageUrl = product.images?.[0]?.src || null;
      const productUrl = `${supplier.base_url}/products/${product.handle}`;

      upsertProduct.run(
        productId,
        supplier.id,
        String(product.id),
        product.title,
        product.vendor || null,
        product.product_type || null,
        JSON.stringify(product.tags || []),
        imageUrl,
        productUrl
      );

      for (const variant of product.variants) {
        const variantId = `${supplier.id}:${variant.id}`;
        const unitCount = extractUnitCount(variant.title);
        const price = parseFloat(variant.price);
        const compareAt = variant.compare_at_price ? parseFloat(variant.compare_at_price) : null;
        const perUnit = price / unitCount;

        upsertVariant.run(
          variantId,
          productId,
          String(variant.id),
          variant.title,
          variant.sku || null,
          variant.available ? 1 : 0,
          unitCount
        );

        insertPrice.run(
          variantId,
          price,
          compareAt && compareAt > price ? compareAt : null,
          perUnit
        );
      }
    }
  });

  insertAll();
  return products.length;
}

export async function scrapeAllShopify(db: Database.Database): Promise<void> {
  for (const supplier of SUPPLIERS) {
    try {
      const count = await scrapeSupplier(supplier, db);
      console.log(`  ✓ ${supplier.name}: ${count} products`);
    } catch (e) {
      console.error(`  ✗ ${supplier.name} failed:`, e);
    }
  }
}
