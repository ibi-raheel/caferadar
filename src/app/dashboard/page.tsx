"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  TrendingDown, TrendingUp, Minus, Zap, DollarSign,
  Package, ArrowDownRight, ArrowUpRight, ArrowRight,
  BarChart3, Search, Loader2, ExternalLink, Store,
  Filter, Tag, ShoppingBag, AlertCircle,
} from "lucide-react";
import Link from "next/link";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface Sale {
  title: string; vendor: string | null; product_type: string | null; product_url: string | null;
  supplier: string; variant: string; price: number; compare_at_price: number;
  per_unit_price: number; unit_count: number; discount_pct: number;
}

interface Product {
  title: string; vendor: string | null; product_type: string | null; product_url: string | null;
  supplier: string; variant: string; price: number; per_unit_price: number;
  unit_count: number; available: number; compare_at_price: number | null; discount_pct: number | null;
}

interface Supplier {
  id: string; name: string; base_url: string; product_count: number;
  category_count: number; sale_count: number;
}

interface Category { name: string; count: number; supplier: string; }
interface Vendor { vendor: string; count: number; supplier: string; }

interface CommoditySeries {
  series_id: string; series_name: string; source: string; unit: string;
  data: { period: string; value: number }[];
  latest: number; prev: number | null; change_pct: number | null;
}

interface DashboardData {
  stats: { products: number; variants: number; suppliers: number; onSale: number };
  sales: Sale[];
  suppliers: Supplier[];
  categories: Category[];
  vendors: Vendor[];
  priceCompare: Product[];
  commodities: CommoditySeries[];
  lastUpdated: string;
}

// ─── TOOLTIP STYLE ───────────────────────────────────────────────────────────

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#18181b", border: "1px solid #3f3f46",
    borderRadius: "10px", fontSize: "13px", color: "#fafafa", padding: "8px 12px",
  },
  labelStyle: { color: "#a1a1aa", marginBottom: 4 },
};

// ─── MAIN ────────────────────────────────────────────────────────────────────

type Tab = "overview" | "prices" | "commodities";

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 size={20} className="animate-spin" />
          <span>Loading real data...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <p className="text-red-400">Failed to load data. Is the database seeded?</p>
      </div>
    );
  }

  const updated = new Date(data.lastUpdated);
  const dateStr = updated.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <header className="border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold tracking-tight">
                Cafe<span className="text-amber-400">Radar</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-zinc-500 border border-zinc-800 rounded-full px-2.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {dateStr} &middot; {data.stats.products.toLocaleString()} products
              </span>
            </div>
            <Link href="/radar" className="text-xs text-zinc-500 hover:text-amber-400 transition-colors flex items-center gap-1">
              <BarChart3 size={14} />
              <span className="hidden sm:inline">Dense View</span>
            </Link>
          </div>
          <nav className="flex gap-1 -mb-px">
            {([
              { id: "overview" as const, label: "Overview" },
              { id: "prices" as const, label: "Find Cheapest" },
              { id: "commodities" as const, label: "Market Trends" },
            ]).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-2.5 text-sm font-medium transition-colors relative ${
                  tab === t.id ? "text-amber-400" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {t.label}
                {tab === t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {tab === "overview" && <OverviewTab data={data} />}
        {tab === "prices" && <PricesTab />}
        {tab === "commodities" && <CommoditiesTab commodities={data.commodities} />}
      </main>
    </div>
  );
}

// ─── OVERVIEW TAB ────────────────────────────────────────────────────────────

function OverviewTab({ data }: { data: DashboardData }) {
  // Aggregate categories
  const catTotals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of data.categories) {
      map[c.name] = (map[c.name] || 0) + c.count;
    }
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [data.categories]);

  const catColors = ["#d4a574", "#8b6f47", "#c4956a", "#a8d5a2", "#7ab87a", "#5a9e5a", "#fbbf24", "#4a3728", "#86efac", "#f59e0b"];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Package} label="Products" value={data.stats.products.toLocaleString()} sub={`${data.stats.variants.toLocaleString()} variants`} />
        <StatCard icon={Store} label="Suppliers" value={data.stats.suppliers.toString()} sub={data.suppliers.map(s => s.name.split(" ")[0]).join(", ")} />
        <StatCard icon={Zap} label="On Sale" value={data.stats.onSale.toString()} sub={`up to ${data.sales[0]?.discount_pct || 0}% off`} highlight />
        <StatCard icon={BarChart3} label="Commodities" value={data.commodities.length.toString()} sub="FRED + BLS indexes" />
      </div>

      {/* Suppliers */}
      <div className="grid sm:grid-cols-3 gap-3">
        {data.suppliers.map((s) => (
          <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-zinc-200">{s.name}</h3>
              <a href={s.base_url} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-zinc-400">
                <ExternalLink size={14} />
              </a>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-zinc-100">{s.product_count}</p>
                <p className="text-[10px] text-zinc-500">products</p>
              </div>
              <div>
                <p className="text-lg font-bold text-zinc-100">{s.category_count}</p>
                <p className="text-[10px] text-zinc-500">categories</p>
              </div>
              <div>
                <p className="text-lg font-bold text-amber-400">{s.sale_count}</p>
                <p className="text-[10px] text-zinc-500">on sale</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Sales */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <Zap size={14} className="text-amber-400" /> Active Sales
              <span className="text-xs font-normal text-zinc-600">{data.sales.length} items</span>
            </h2>
          </div>
          <div className="space-y-2">
            {data.sales.slice(0, 12).map((s, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {s.product_url ? (
                      <a href={s.product_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-zinc-200 truncate hover:text-amber-400 transition-colors">
                        {s.title}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-zinc-200 truncate">{s.title}</p>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {s.variant} &middot; {s.supplier}
                    {s.vendor && <span className="text-zinc-600"> &middot; {s.vendor}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-green-400">${s.price.toFixed(2)}</p>
                    <p className="text-xs text-zinc-600 line-through">${s.compare_at_price.toFixed(2)}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    s.discount_pct >= 30 ? "bg-red-500/15 text-red-400" :
                    s.discount_pct >= 15 ? "bg-amber-500/15 text-amber-400" :
                    "bg-zinc-800 text-zinc-400"
                  }`}>
                    -{s.discount_pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Commodities Summary + Categories */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300">Market Trends</h2>
          <div className="space-y-2">
            {data.commodities.map((c) => (
              <div key={c.series_id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-zinc-300">{c.series_name}</span>
                  {c.change_pct !== null && <TrendBadge change={c.change_pct} />}
                </div>
                <div className="flex items-end justify-between gap-3">
                  <p className="text-xl font-semibold text-zinc-100">
                    {c.unit === "index" ? c.latest.toFixed(1) : c.unit === "¢/lb" ? `${c.latest}` : `$${c.latest.toFixed(2)}`}
                    <span className="text-xs text-zinc-500 ml-1 font-normal">{c.unit}</span>
                  </p>
                  <div className="w-24 h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={c.data.slice(-12)} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`mini-${c.series_id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={c.change_pct !== null && c.change_pct < -3 ? "#22c55e" : "#d4a574"} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={c.change_pct !== null && c.change_pct < -3 ? "#22c55e" : "#d4a574"} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="value" stroke={c.change_pct !== null && c.change_pct < -3 ? "#22c55e" : "#d4a574"} strokeWidth={1.5} fill={`url(#mini-${c.series_id})`} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-600 mt-1">
                  {c.data[c.data.length - 1]?.period} &middot; {c.source.toUpperCase()} &middot; {c.data.length} months
                </p>
              </div>
            ))}
          </div>

          {/* Category Donut */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Top Categories</h3>
            <div className="flex items-center gap-4">
              <div className="w-28 h-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={catTotals} cx="50%" cy="50%" innerRadius={25} outerRadius={48} paddingAngle={2} dataKey="count" stroke="none">
                      {catTotals.map((_, i) => <Cell key={i} fill={catColors[i % catColors.length]} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(v: number, n: string) => [`${v} products`, n]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1">
                {catTotals.slice(0, 7).map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: catColors[i] }} />
                      <span className="text-zinc-300">{c.name}</span>
                    </div>
                    <span className="text-zinc-500">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PRICES TAB — THE CORE FEATURE ──────────────────────────────────────────

function PricesTab() {
  interface CompareGroup { id: string; name: string; description: string; unitLabel: string; }
  interface CompareProduct {
    title: string; vendor: string | null; product_type: string | null; product_url: string | null;
    supplier: string; variant: string; price: number; per_unit_price: number;
    unit_count: number; available: number; compare_at_price: number | null; discount_pct: number | null;
    normalized_price: number; volume_label: string; volume_oz: number | null; total_volume_oz: number | null;
  }
  interface CompareResult {
    group: string; description: string; unitLabel: string;
    count: number; bestPrice?: number; products: CompareProduct[];
  }

  const [groups, setGroups] = useState<CompareGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Load comparison groups on mount
  useEffect(() => {
    fetch("/api/compare?group=_list")
      .then((r) => r.json())
      .then((d) => setGroups(d.groups || []));
  }, []);

  // Load comparison when group changes
  useEffect(() => {
    if (!activeGroup) { setResult(null); return; }
    setLoading(true);
    fetch(`/api/compare?group=${activeGroup}`)
      .then((r) => r.json())
      .then((d) => { setResult(d); setLoading(false); });
  }, [activeGroup]);

  // Search with debounce
  useEffect(() => {
    if (!search.trim()) { setSearchResult(null); return; }
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/compare?q=${encodeURIComponent(search)}`)
        .then((r) => r.json())
        .then((d) => { setSearchResult(d); setLoading(false); });
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const displayResult = search.trim() ? searchResult : result;

  // Build chart data from result
  const chartData = useMemo(() => {
    if (!displayResult?.products) return [];
    return displayResult.products
      .filter((p) => p.normalized_price > 0.05)
      .slice(0, 15)
      .map((p) => ({
        name: p.vendor
          ? `${p.vendor} (${p.volume_label})`
          : p.title.substring(0, 28),
        perUnit: p.normalized_price,
        sale: p.discount_pct !== null && p.discount_pct > 0,
      }));
  }, [displayResult]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-zinc-200">Find the Cheapest</h2>
        <p className="text-xs text-zinc-500 mt-1">
          Apples-to-apples comparison &middot; pick a category or search
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); if (e.target.value) setActiveGroup(null); }}
          placeholder='Search anything — "oat milk", "monin", "pumpkin"...'
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
        />
      </div>

      {/* Comparison Group Buttons */}
      <div>
        <p className="text-xs text-zinc-500 mb-2">Quick comparisons:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => { setActiveGroup(g.id); setSearch(""); }}
              className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
                activeGroup === g.id
                  ? "bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20"
                  : "bg-zinc-900 border-zinc-800 hover:border-zinc-600"
              }`}
            >
              <p className={`text-sm font-medium ${activeGroup === g.id ? "text-amber-400" : "text-zinc-300"}`}>
                {g.name}
              </p>
              <p className="text-[10px] text-zinc-600 mt-0.5">{g.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-zinc-500 py-8 justify-center">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Comparing prices...</span>
        </div>
      )}

      {/* Results */}
      {displayResult && !loading && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">{displayResult.group}</h3>
              <p className="text-xs text-zinc-500">{displayResult.count} options &middot; sorted cheapest first &middot; per {displayResult.unitLabel}</p>
            </div>
            {displayResult.bestPrice && displayResult.bestPrice > 0 && (
              <div className="text-right">
                <p className="text-xs text-zinc-500">Best price</p>
                <p className="text-lg font-bold text-green-400">${displayResult.bestPrice.toFixed(2)}<span className="text-xs text-zinc-500 font-normal">/{displayResult.unitLabel}</span></p>
              </div>
            )}
          </div>

          {/* Bar Chart */}
          {chartData.length > 0 && (() => {
            const maxVal = Math.max(...chartData.map((d) => d.perUnit));
            return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="space-y-2">
                {chartData.map((entry, i) => {
                  const pct = (entry.perUnit / maxVal) * 100;
                  const color = i === 0 ? "#22c55e" : entry.sale ? "#f59e0b" : "#52525b";
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-44 shrink-0 text-right">
                        <span className="text-xs text-zinc-300">{entry.name}</span>
                      </div>
                      <div className="flex-1 h-7 bg-zinc-800 rounded-md overflow-hidden relative">
                        <div
                          className="h-full rounded-md transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                      <span className="w-16 text-right text-sm font-semibold tabular-nums" style={{ color }}>
                        ${entry.perUnit.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500" /> Cheapest</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500" /> On sale</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-zinc-600" /> Regular</span>
              </div>
            </div>
            );
          })()}

          {/* Product List */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="divide-y divide-zinc-800/50">
              {displayResult.products.map((p, i) => {
                const savings = displayResult.bestPrice && p.normalized_price > displayResult.bestPrice
                  ? Math.round((p.normalized_price - displayResult.bestPrice) * 100) / 100
                  : 0;

                return (
                  <div key={i} className={`px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-zinc-800/30 transition-colors ${i === 0 ? "bg-green-500/5" : ""}`}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {i === 0 && <span className="text-[10px] font-bold text-green-400 bg-green-500/15 px-1.5 py-0.5 rounded shrink-0">CHEAPEST</span>}
                        {p.discount_pct && p.discount_pct > 0 && (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded shrink-0">SALE -{p.discount_pct}%</span>
                        )}
                        {p.product_url ? (
                          <a href={p.product_url} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-200 truncate hover:text-amber-400 transition-colors">
                            {p.title}
                          </a>
                        ) : (
                          <span className="text-sm text-zinc-200 truncate">{p.title}</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {p.volume_label}
                        {p.vendor && <span className="text-zinc-600"> &middot; {p.vendor}</span>}
                        <span className="text-zinc-600"> &middot; {p.supplier}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-zinc-200">
                        ${p.normalized_price.toFixed(2)}<span className="text-xs text-zinc-500 font-normal">/{displayResult.unitLabel}</span>
                      </p>
                      <p className="text-xs text-zinc-600">
                        ${p.price.toFixed(2)} total
                        {p.unit_count > 1 && ` (${p.unit_count}pk)`}
                      </p>
                      {savings > 0 && (
                        <p className="text-[10px] text-red-400">+${savings.toFixed(2)} vs best</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!displayResult && !loading && !activeGroup && !search && (
        <div className="text-center py-12">
          <ShoppingBag size={32} className="mx-auto text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-500">Pick a category above or search for a product</p>
          <p className="text-xs text-zinc-600 mt-1">We&apos;ll show you every option ranked by per-unit price</p>
        </div>
      )}
    </div>
  );
}

// ─── COMMODITIES TAB ─────────────────────────────────────────────────────────

function CommoditiesTab({ commodities }: { commodities: CommoditySeries[] }) {
  const colorMap: Record<string, string> = {
    "Whole Milk CPI": "#d4a574",
    "Coffee Commodity (ICE)": "#c4956a",
    "Butter CPI": "#fbbf24",
    "Cheese PPI": "#a8d5a2",
    "Cream Cheese CPI": "#86efac",
    "Processed Foods PPI": "#8b6f47",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-zinc-200">Market Commodity Trends</h2>
        <p className="text-xs text-zinc-500 mt-1">
          FRED &amp; BLS data &middot; Use drops to renegotiate with suppliers &middot;
          Latest data: Feb 2026 (released with ~1 month lag)
        </p>
      </div>

      {/* Alert banner for actionable drops */}
      {commodities.filter((c) => c.change_pct !== null && c.change_pct < -3).length > 0 && (
        <div className="bg-green-500/8 border border-green-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-400">Price drops detected</p>
            <p className="text-xs text-zinc-400 mt-1">
              {commodities.filter((c) => c.change_pct !== null && c.change_pct < -3).map((c) => `${c.series_name} (${c.change_pct}%)`).join(", ")}
              — use these to negotiate lower rates with your distributors.
            </p>
          </div>
        </div>
      )}

      {commodities.map((c) => {
        const color = colorMap[c.series_name] || "#d4a574";
        const isDropping = c.change_pct !== null && c.change_pct < -3;

        return (
          <div key={c.series_id} className={`bg-zinc-900 border rounded-xl p-5 ${isDropping ? "border-green-500/20" : "border-zinc-800"}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-zinc-200">{c.series_name}</h3>
                  {c.change_pct !== null && <TrendBadge change={c.change_pct} />}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {c.source.toUpperCase()} &middot; {c.data.length} months of data &middot; {c.data[0]?.period} to {c.data[c.data.length - 1]?.period}
                </p>
              </div>
              <p className="text-2xl font-semibold text-zinc-100">
                {c.unit === "index" ? c.latest.toFixed(1) : c.unit === "¢/lb" ? `${c.latest}` : `$${c.latest.toFixed(2)}`}
                <span className="text-sm text-zinc-500 ml-1 font-normal">{c.unit}</span>
              </p>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={c.data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`area-${c.series_id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#71717a" }} tickLine={false} axisLine={{ stroke: "#3f3f46" }} interval={Math.max(0, Math.floor(c.data.length / 6))} />
                  <YAxis tick={{ fontSize: 11, fill: "#71717a" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(value: number) => [
                      c.unit === "index" ? value.toFixed(1) : c.unit === "¢/lb" ? `${value} ¢/lb` : `$${value.toFixed(2)} ${c.unit}`,
                      c.series_name,
                    ]}
                  />
                  <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#area-${c.series_id})`}
                    dot={false} activeDot={{ r: 5, stroke: color, strokeWidth: 2, fill: "#18181b" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, highlight, color }: {
  icon: React.ElementType; label: string; value: string; sub: string;
  highlight?: boolean; color?: "green" | "red";
}) {
  return (
    <div className={`border rounded-xl p-4 ${highlight ? "bg-amber-500/5 border-amber-500/30" : "bg-zinc-900 border-zinc-800"}`}>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={14} className={highlight ? "text-amber-400" : color === "green" ? "text-green-400" : "text-zinc-500"} />
        <span className="text-[11px] text-zinc-500">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${highlight ? "text-amber-400" : color === "green" ? "text-green-400" : "text-zinc-100"}`}>{value}</p>
      <p className="text-[11px] text-zinc-600 mt-0.5">{sub}</p>
    </div>
  );
}

function TrendBadge({ change }: { change: number }) {
  const Icon = change < -1 ? ArrowDownRight : change > 1 ? ArrowUpRight : ArrowRight;
  const colors = change < -1 ? "bg-green-500/15 text-green-400" : change > 1 ? "bg-red-500/15 text-red-400" : "bg-zinc-800 text-zinc-400";

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors}`}>
      <Icon size={12} />
      {change > 0 ? "+" : ""}{change.toFixed(1)}%
    </span>
  );
}
