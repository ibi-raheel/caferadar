import type Database from "better-sqlite3";

interface CommoditySeries {
  id: string;
  name: string;
  unit: string;
}

const FRED_SERIES: CommoditySeries[] = [
  { id: "APU0000709112", name: "Whole Milk CPI", unit: "$/gallon" },
  { id: "PCOFFOTMUSDM", name: "Coffee Commodity (ICE)", unit: "¢/lb" },
  { id: "APU0000FS1101", name: "Butter CPI", unit: "$/lb" },
  { id: "APU0000710211", name: "Cream Cheese CPI", unit: "$/8oz" },
];

const BLS_SERIES: CommoditySeries[] = [
  { id: "WPU02310301", name: "Cheese PPI", unit: "index" },
  { id: "WPU023", name: "Processed Foods PPI", unit: "index" },
];

async function fetchFRED(db: Database.Database): Promise<number> {
  console.log("Fetching FRED commodity data...");
  let count = 0;

  const insert = db.prepare(`
    INSERT OR IGNORE INTO commodity_prices (series_id, series_name, source, period, value, unit)
    VALUES (?, ?, 'fred', ?, ?, ?)
  `);

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 18);
  const cosd = startDate.toISOString().split("T")[0];

  for (const series of FRED_SERIES) {
    try {
      const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${series.id}&cosd=${cosd}`;
      console.log(`  Fetching ${series.name}...`);

      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) {
        console.log(`  ✗ HTTP ${res.status} for ${series.id}`);
        continue;
      }

      const text = await res.text();
      const lines = text.trim().split("\n").slice(1); // skip header

      const insertMany = db.transaction(() => {
        for (const line of lines) {
          const [date, val] = line.split(",");
          if (!val || val === "." || val.trim() === "") continue;
          const period = date.substring(0, 7); // "YYYY-MM"
          insert.run(series.id, series.name, period, parseFloat(val), series.unit);
          count++;
        }
      });
      insertMany();

      console.log(`  ✓ ${series.name}: ${lines.length} data points`);
    } catch (e) {
      console.error(`  ✗ ${series.name} failed:`, e);
    }
  }

  return count;
}

async function fetchBLS(db: Database.Database): Promise<number> {
  console.log("Fetching BLS commodity data...");
  let count = 0;

  const insert = db.prepare(`
    INSERT OR IGNORE INTO commodity_prices (series_id, series_name, source, period, value, unit)
    VALUES (?, ?, 'bls', ?, ?, ?)
  `);

  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 2;

  try {
    const res = await fetch("https://api.bls.gov/publicAPI/v2/timeseries/data/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seriesid: BLS_SERIES.map((s) => s.id),
        startyear: String(startYear),
        endyear: String(currentYear),
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.log(`  ✗ BLS API returned ${res.status}`);
      return 0;
    }

    const data = await res.json();
    if (data.status !== "REQUEST_SUCCEEDED") {
      console.log(`  ✗ BLS API status: ${data.status}`);
      return 0;
    }

    const insertMany = db.transaction(() => {
      for (const seriesResult of data.Results?.series || []) {
        const seriesId = seriesResult.seriesID;
        const seriesInfo = BLS_SERIES.find((s) => s.id === seriesId);
        if (!seriesInfo) continue;

        for (const d of seriesResult.data || []) {
          const month = d.period?.replace("M", "") || "01";
          const period = `${d.year}-${month.padStart(2, "0")}`;
          const value = parseFloat(d.value);
          if (isNaN(value)) continue;
          insert.run(seriesId, seriesInfo.name, period, value, seriesInfo.unit);
          count++;
        }
      }
    });
    insertMany();

    console.log(`  ✓ BLS: ${count} data points`);
  } catch (e) {
    console.error(`  ✗ BLS fetch failed:`, e);
  }

  return count;
}

export async function scrapeAllCommodities(db: Database.Database): Promise<void> {
  await fetchFRED(db);
  await fetchBLS(db);
}
