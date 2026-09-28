import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Extract volume in oz from a combined title + variant string
function extractVolume(text: string): { oz: number; label: string } | null {
  const lower = text.toLowerCase();

  // "64 fl oz"
  const flozMatch = lower.match(/(\d+(?:\.\d+)?)\s*fl\.?\s*oz/);
  if (flozMatch) return { oz: parseFloat(flozMatch[1]), label: `${flozMatch[1]}oz` };

  // "32oz", "32 oz", "11oz"
  const ozMatch = lower.match(/(\d+(?:\.\d+)?)\s*oz/);
  if (ozMatch) return { oz: parseFloat(ozMatch[1]), label: `${ozMatch[1]}oz` };

  // "750mL", "750ml"
  const mlMatch = lower.match(/(\d+)\s*ml/i);
  if (mlMatch) return { oz: parseFloat(mlMatch[1]) * 0.033814, label: `${mlMatch[1]}mL` };

  // "1L", "1l" (but not "1L Plastic" already caught by mL)
  const literMatch = lower.match(/(\d+(?:\.\d+)?)\s*l(?:iter)?(?:\b|$)/i);
  if (literMatch) return { oz: parseFloat(literMatch[1]) * 33.814, label: `${literMatch[1]}L` };

  return null;
}

// Pre-defined comparison groups
const COMPARISON_GROUPS = [
  {
    id: "oat-milk",
    name: "Oat Milk (32oz Barista)",
    description: "32oz barista oat milks — best bulk price per brand",
    query: `(LOWER(p.title) LIKE '%oat%milk%' OR LOWER(p.title) LIKE '%oatmilk%') AND v.unit_count >= 6`,
    unitLabel: "32oz carton",
    normalizeOz: 32,
    dedup: true,
  },
  {
    id: "vanilla-syrup",
    name: "Vanilla Syrup",
    description: "Vanilla syrups — best bulk price per brand",
    query: `LOWER(p.title) LIKE '%vanilla%syrup%' AND v.unit_count >= 4`,
    unitLabel: "bottle",
    normalizeOz: null,
    dedup: true,
  },
  {
    id: "chocolate-sauce",
    name: "Chocolate Sauce",
    description: "Chocolate & white chocolate sauces",
    query: `(LOWER(p.title) LIKE '%chocolate%sauce%') AND v.unit_count >= 4`,
    unitLabel: "bottle",
    normalizeOz: null,
    dedup: true,
  },
  {
    id: "chai-concentrate",
    name: "Chai Concentrate",
    description: "Chai concentrates (1:1), best bulk per brand",
    query: `LOWER(p.product_type) = 'chai' AND (LOWER(p.title) LIKE '%concentrate%') AND v.unit_count >= 6`,
    unitLabel: "32oz carton",
    normalizeOz: 32,
    dedup: true,
  },
  {
    id: "caramel-sauce",
    name: "Caramel Sauce",
    description: "Caramel sauces and drizzles",
    query: `LOWER(p.title) LIKE '%caramel%sauce%' AND v.unit_count >= 4`,
    unitLabel: "bottle",
    normalizeOz: null,
    dedup: true,
  },
  {
    id: "matcha",
    name: "Matcha",
    description: "Matcha powders and blends",
    query: `LOWER(p.product_type) = 'matcha'`,
    unitLabel: "unit",
    normalizeOz: null,
    dedup: false,
  },
  {
    id: "alt-milk",
    name: "All Alt Milks (32oz)",
    description: "Oat, almond, coconut, pistachio — 32oz cartons",
    query: `(LOWER(p.product_type) LIKE '%milk%' OR LOWER(p.product_type) LIKE '%alt%') AND v.unit_count >= 6`,
    unitLabel: "32oz carton",
    normalizeOz: 32,
    dedup: true,
  },
  {
    id: "hazelnut-syrup",
    name: "Hazelnut Syrup",
    description: "Hazelnut syrups, per bottle",
    query: `LOWER(p.title) LIKE '%hazelnut%syrup%' AND v.unit_count >= 4`,
    unitLabel: "bottle",
    normalizeOz: null,
    dedup: true,
  },
  {
    id: "pumpkin",
    name: "Pumpkin (Seasonal)",
    description: "Pumpkin syrups, sauces, and milks",
    query: `LOWER(p.title) LIKE '%pumpkin%'`,
    unitLabel: "unit",
    normalizeOz: null,
    dedup: false,
  },
  {
    id: "lavender-syrup",
    name: "Lavender Syrup",
    description: "Lavender syrups, per bottle",
    query: `LOWER(p.title) LIKE '%lavender%syrup%'`,
    unitLabel: "bottle",
    normalizeOz: null,
    dedup: false,
  },
];

interface RawProduct {
  title: string; vendor: string | null; product_type: string | null; product_url: string | null;
  supplier: string; variant: string; price: number; per_unit_price: number;
  unit_count: number; available: number; compare_at_price: number | null; discount_pct: number | null;
}

interface NormalizedProduct extends RawProduct {
  volume_oz: number | null;
  total_volume_oz: number | null;
  normalized_price: number; // price per normalizeOz, or per_unit_price if no normalization
  volume_label: string;
}

function normalizeProducts(
  raw: RawProduct[],
  normalizeOz: number | null,
  dedup: boolean
): NormalizedProduct[] {
  const products: NormalizedProduct[] = raw.map((p) => {
    const combinedText = `${p.title} ${p.variant}`;
    const vol = extractVolume(combinedText);
    const volumeOz = vol?.oz ?? null;
    const totalVolumeOz = volumeOz ? volumeOz * p.unit_count : null;

    let normalizedPrice: number;
    let volumeLabel: string;

    if (normalizeOz && totalVolumeOz && vol) {
      // price per normalizeOz (e.g., per 32oz carton)
      normalizedPrice = (p.price / totalVolumeOz) * normalizeOz;
      volumeLabel = `${vol.label} × ${p.unit_count}`;
    } else if (vol) {
      normalizedPrice = p.per_unit_price;
      volumeLabel = `${vol.label} × ${p.unit_count}`;
    } else {
      normalizedPrice = p.per_unit_price;
      volumeLabel = `${p.unit_count}pk`;
    }

    return {
      ...p,
      volume_oz: volumeOz,
      total_volume_oz: totalVolumeOz,
      normalized_price: Math.round(normalizedPrice * 100) / 100,
      volume_label: volumeLabel,
    };
  });

  // Filter out mismatched sizes when normalizing (e.g., exclude 11oz when comparing 32oz)
  let filtered = products;
  if (normalizeOz) {
    // Only keep products with the target volume (within ±4oz tolerance)
    const withTargetVol = products.filter(
      (p) => p.volume_oz && Math.abs(p.volume_oz - normalizeOz) <= 4
    );
    if (withTargetVol.length > 0) {
      filtered = withTargetVol;
    }
  }

  // Sort by normalized price
  filtered.sort((a, b) => a.normalized_price - b.normalized_price);

  // Dedup: keep only the cheapest option per vendor+product combo (best bulk deal)
  if (dedup) {
    const seen = new Map<string, NormalizedProduct>();
    for (const p of filtered) {
      // Group by vendor + cleaned product name (strip pack size, carton count)
      const cleanTitle = p.title
        .replace(/\s*-\s*\d+\s*cartons?/i, "")
        .replace(/\s*-\s*\d+\s*cases?\s+of\s+\d+.*/i, "")
        .replace(/\s*-\s*cases?\s+of\s+\d+.*/i, "")
        .replace(/\s*-\s*\d+\s*bottles?/i, "")
        .replace(/\s*-\s*\d+\s*packs?/i, "")
        .trim()
        .toLowerCase();
      const vendor = (p.vendor || "").toLowerCase();
      // For true apples-to-apples, group by vendor only (cheapest per brand)
      const key = vendor || cleanTitle;
      if (!seen.has(key)) {
        seen.set(key, p);
      }
    }
    filtered = Array.from(seen.values());
  }

  return filtered.slice(0, 20);
}

export async function GET(request: NextRequest) {
  const db = getDb();
  const groupId = request.nextUrl.searchParams.get("group");
  const search = request.nextUrl.searchParams.get("q");

  if (groupId === "_list") {
    return NextResponse.json({
      groups: COMPARISON_GROUPS.map(({ query, normalizeOz, dedup, ...rest }) => rest),
    });
  }

  const baseSelect = `
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
  `;

  if (groupId) {
    const group = COMPARISON_GROUPS.find((g) => g.id === groupId);
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const raw = db.prepare(`${baseSelect} AND ${group.query} ORDER BY pr.per_unit_price ASC LIMIT 50`).all() as RawProduct[];
    const products = normalizeProducts(raw, group.normalizeOz, group.dedup);
    const best = products.length > 0 ? products[0].normalized_price : 0;

    return NextResponse.json({
      group: group.name,
      description: group.description,
      unitLabel: group.unitLabel,
      count: products.length,
      bestPrice: best,
      products,
    });
  }

  if (search) {
    const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
    const conditions = terms.map(() => `(LOWER(p.title) LIKE ? OR LOWER(p.vendor) LIKE ?)`);
    const params = terms.flatMap((t) => [`%${t}%`, `%${t}%`]);

    const raw = db.prepare(
      `${baseSelect} AND ${conditions.join(" AND ")} ORDER BY pr.per_unit_price ASC LIMIT 50`
    ).all(...params) as RawProduct[];

    const products = normalizeProducts(raw, null, false);
    const best = products.length > 0 ? products[0].normalized_price : 0;

    return NextResponse.json({
      group: `"${search}"`,
      description: `Search results for "${search}"`,
      unitLabel: "unit",
      count: products.length,
      bestPrice: best,
      products,
    });
  }

  return NextResponse.json({
    groups: COMPARISON_GROUPS.map(({ query, normalizeOz, dedup, ...rest }) => rest),
  });
}
