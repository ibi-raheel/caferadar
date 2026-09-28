import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();

  // Stats
  const stats = {
    products: (db.prepare("SELECT COUNT(DISTINCT product_id) as c FROM variants").get() as { c: number }).c,
    variants: (db.prepare("SELECT COUNT(*) as c FROM variants").get() as { c: number }).c,
    suppliers: (db.prepare("SELECT COUNT(*) as c FROM suppliers").get() as { c: number }).c,
    onSale: (db.prepare(`
      SELECT COUNT(DISTINCT pr.variant_id) as c FROM prices pr
      WHERE pr.compare_at_price IS NOT NULL
        AND pr.id = (SELECT MAX(id) FROM prices WHERE variant_id = pr.variant_id)
    `).get() as { c: number }).c,
  };

  // Sales
  const sales = db.prepare(`
    SELECT p.title, p.vendor, p.product_type, p.product_url,
      s.name as supplier, v.title as variant,
      pr.price, pr.compare_at_price, pr.per_unit_price, v.unit_count,
      ROUND((1.0 - pr.price / pr.compare_at_price) * 100, 1) as discount_pct
    FROM prices pr
    JOIN variants v ON v.id = pr.variant_id
    JOIN products p ON p.id = v.product_id
    JOIN suppliers s ON s.id = p.supplier_id
    WHERE pr.compare_at_price IS NOT NULL
      AND pr.id = (SELECT MAX(id) FROM prices WHERE variant_id = pr.variant_id)
    ORDER BY discount_pct DESC
  `).all();

  // Suppliers with product counts and categories
  const suppliers = db.prepare(`
    SELECT s.id, s.name, s.base_url, COUNT(DISTINCT p.id) as product_count,
      COUNT(DISTINCT p.product_type) as category_count,
      COUNT(DISTINCT CASE WHEN pr.compare_at_price IS NOT NULL THEN pr.variant_id END) as sale_count
    FROM suppliers s
    LEFT JOIN products p ON p.supplier_id = s.id
    LEFT JOIN variants v ON v.product_id = p.id
    LEFT JOIN prices pr ON pr.variant_id = v.id AND pr.id = (SELECT MAX(id) FROM prices WHERE variant_id = pr.variant_id)
    GROUP BY s.id
  `).all();

  // Categories with counts
  const categories = db.prepare(`
    SELECT product_type as name, COUNT(*) as count,
      s.name as supplier
    FROM products p
    JOIN suppliers s ON s.id = p.supplier_id
    WHERE product_type IS NOT NULL AND product_type != ''
    GROUP BY product_type, s.id
    ORDER BY count DESC
  `).all();

  // Top vendors
  const vendors = db.prepare(`
    SELECT vendor, COUNT(*) as count, s.name as supplier
    FROM products p
    JOIN suppliers s ON s.id = p.supplier_id
    WHERE vendor IS NOT NULL AND vendor != ''
    GROUP BY vendor
    ORDER BY count DESC
    LIMIT 15
  `).all();

  // Price comparison: best per-unit price for common product types
  const priceCompare = db.prepare(`
    SELECT p.title, p.vendor, p.product_type, p.product_url,
      s.name as supplier, v.title as variant,
      pr.price, pr.per_unit_price, v.unit_count, v.available,
      pr.compare_at_price,
      CASE WHEN pr.compare_at_price IS NOT NULL
        THEN ROUND((1.0 - pr.price / pr.compare_at_price) * 100, 1)
        ELSE NULL END as discount_pct
    FROM prices pr
    JOIN variants v ON v.id = pr.variant_id
    JOIN products p ON p.id = v.product_id
    JOIN suppliers s ON s.id = p.supplier_id
    WHERE pr.id = (SELECT MAX(id) FROM prices WHERE variant_id = pr.variant_id)
      AND v.available = 1
    ORDER BY pr.per_unit_price ASC
  `).all();

  // Commodity data
  const commodities = db.prepare(`
    SELECT series_id, series_name, source, period, value, unit
    FROM commodity_prices
    ORDER BY series_id, period ASC
  `).all() as { series_id: string; series_name: string; source: string; period: string; value: number; unit: string }[];

  // Group commodity data by series
  const commodityMap: Record<string, {
    series_id: string; series_name: string; source: string; unit: string;
    data: { period: string; value: number }[];
    latest: number; prev: number | null; change_pct: number | null;
  }> = {};

  for (const row of commodities) {
    if (!commodityMap[row.series_id]) {
      commodityMap[row.series_id] = {
        series_id: row.series_id,
        series_name: row.series_name,
        source: row.source,
        unit: row.unit || "",
        data: [],
        latest: 0,
        prev: null,
        change_pct: null,
      };
    }
    commodityMap[row.series_id].data.push({ period: row.period, value: row.value });
  }

  for (const series of Object.values(commodityMap)) {
    const d = series.data;
    if (d.length >= 2) {
      series.latest = d[d.length - 1].value;
      series.prev = d[d.length - 2].value;
      series.change_pct = Math.round(((series.latest - series.prev) / series.prev) * 1000) / 10;
    } else if (d.length === 1) {
      series.latest = d[0].value;
    }
  }

  return NextResponse.json({
    stats,
    sales,
    suppliers,
    categories,
    vendors,
    priceCompare,
    commodities: Object.values(commodityMap),
    lastUpdated: new Date().toISOString(),
  });
}
