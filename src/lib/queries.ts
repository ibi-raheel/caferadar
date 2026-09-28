import { getDb } from "./db";

export interface ProductWithPrice {
  product_id: string;
  title: string;
  vendor: string | null;
  product_type: string | null;
  image_url: string | null;
  product_url: string | null;
  supplier_name: string;
  supplier_id: string;
  variant_id: string;
  variant_title: string;
  price: number;
  compare_at_price: number | null;
  per_unit_price: number;
  unit_count: number;
  available: number;
  discount_pct: number | null;
}

export interface CommodityData {
  series_id: string;
  series_name: string;
  source: string;
  unit: string;
  latest_value: number;
  latest_period: string;
  prev_value: number | null;
  prev_period: string | null;
  change_pct: number | null;
}

export interface DashboardStats {
  total_products: number;
  total_suppliers: number;
  items_on_sale: number;
  commodity_series: number;
}

export function getDashboardStats(): DashboardStats {
  const db = getDb();
  const products = db.prepare("SELECT COUNT(DISTINCT product_id) as count FROM variants").get() as { count: number };
  const suppliers = db.prepare("SELECT COUNT(*) as count FROM suppliers").get() as { count: number };
  const sales = db.prepare(`
    SELECT COUNT(DISTINCT p2.variant_id) as count
    FROM prices p2
    WHERE p2.compare_at_price IS NOT NULL
    AND p2.id = (SELECT MAX(id) FROM prices WHERE variant_id = p2.variant_id)
  `).get() as { count: number };
  const commodities = db.prepare("SELECT COUNT(DISTINCT series_id) as count FROM commodity_prices").get() as { count: number };

  return {
    total_products: products.count,
    total_suppliers: suppliers.count,
    items_on_sale: sales.count,
    commodity_series: commodities.count,
  };
}

export function getSales(): ProductWithPrice[] {
  const db = getDb();
  return db.prepare(`
    SELECT
      p.id as product_id,
      p.title,
      p.vendor,
      p.product_type,
      p.image_url,
      p.product_url,
      s.name as supplier_name,
      s.id as supplier_id,
      v.id as variant_id,
      v.title as variant_title,
      pr.price,
      pr.compare_at_price,
      pr.per_unit_price,
      v.unit_count,
      v.available,
      ROUND((1.0 - pr.price / pr.compare_at_price) * 100, 1) as discount_pct
    FROM prices pr
    JOIN variants v ON v.id = pr.variant_id
    JOIN products p ON p.id = v.product_id
    JOIN suppliers s ON s.id = p.supplier_id
    WHERE pr.compare_at_price IS NOT NULL
      AND pr.id = (SELECT MAX(id) FROM prices WHERE variant_id = pr.variant_id)
    ORDER BY discount_pct DESC
  `).all() as ProductWithPrice[];
}

export function getProducts(
  search?: string,
  supplier?: string,
  category?: string,
  page = 1,
  limit = 50
): { products: ProductWithPrice[]; total: number } {
  const db = getDb();
  const conditions: string[] = [
    "pr.id = (SELECT MAX(id) FROM prices WHERE variant_id = pr.variant_id)",
  ];
  const params: (string | number)[] = [];

  if (search) {
    conditions.push("(p.title LIKE ? OR p.vendor LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (supplier) {
    conditions.push("s.id = ?");
    params.push(supplier);
  }
  if (category) {
    conditions.push("p.product_type = ?");
    params.push(category);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const total = db.prepare(`
    SELECT COUNT(*) as count
    FROM prices pr
    JOIN variants v ON v.id = pr.variant_id
    JOIN products p ON p.id = v.product_id
    JOIN suppliers s ON s.id = p.supplier_id
    ${where}
  `).get(...params) as { count: number };

  const offset = (page - 1) * limit;
  const products = db.prepare(`
    SELECT
      p.id as product_id,
      p.title,
      p.vendor,
      p.product_type,
      p.image_url,
      p.product_url,
      s.name as supplier_name,
      s.id as supplier_id,
      v.id as variant_id,
      v.title as variant_title,
      pr.price,
      pr.compare_at_price,
      pr.per_unit_price,
      v.unit_count,
      v.available,
      CASE WHEN pr.compare_at_price IS NOT NULL
        THEN ROUND((1.0 - pr.price / pr.compare_at_price) * 100, 1)
        ELSE NULL END as discount_pct
    FROM prices pr
    JOIN variants v ON v.id = pr.variant_id
    JOIN products p ON p.id = v.product_id
    JOIN suppliers s ON s.id = p.supplier_id
    ${where}
    ORDER BY p.title ASC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as ProductWithPrice[];

  return { products, total: total.count };
}

export function getSuppliers(): { id: string; name: string; product_count: number }[] {
  const db = getDb();
  return db.prepare(`
    SELECT s.id, s.name, COUNT(DISTINCT p.id) as product_count
    FROM suppliers s
    LEFT JOIN products p ON p.supplier_id = s.id
    GROUP BY s.id
    ORDER BY s.name
  `).all() as { id: string; name: string; product_count: number }[];
}

export function getCategories(): { name: string; count: number }[] {
  const db = getDb();
  return db.prepare(`
    SELECT product_type as name, COUNT(*) as count
    FROM products
    WHERE product_type IS NOT NULL AND product_type != ''
    GROUP BY product_type
    ORDER BY count DESC
  `).all() as { name: string; count: number }[];
}

export function getCommodities(): CommodityData[] {
  const db = getDb();
  const series = db.prepare(`
    SELECT DISTINCT series_id, series_name, source, unit
    FROM commodity_prices
  `).all() as { series_id: string; series_name: string; source: string; unit: string }[];

  return series.map((s) => {
    const latest = db.prepare(`
      SELECT period, value FROM commodity_prices
      WHERE series_id = ? ORDER BY period DESC LIMIT 1
    `).get(s.series_id) as { period: string; value: number } | undefined;

    const prev = db.prepare(`
      SELECT period, value FROM commodity_prices
      WHERE series_id = ? ORDER BY period DESC LIMIT 1 OFFSET 1
    `).get(s.series_id) as { period: string; value: number } | undefined;

    const changePct = latest && prev ? ((latest.value - prev.value) / prev.value) * 100 : null;

    return {
      series_id: s.series_id,
      series_name: s.series_name,
      source: s.source,
      unit: s.unit,
      latest_value: latest?.value ?? 0,
      latest_period: latest?.period ?? "",
      prev_value: prev?.value ?? null,
      prev_period: prev?.period ?? null,
      change_pct: changePct ? Math.round(changePct * 10) / 10 : null,
    };
  });
}

export function getCommodityHistory(seriesId: string): { period: string; value: number }[] {
  const db = getDb();
  return db.prepare(`
    SELECT period, value FROM commodity_prices
    WHERE series_id = ? ORDER BY period ASC
  `).all(seriesId) as { period: string; value: number }[];
}
