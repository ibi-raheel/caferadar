"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceArea, Legend,
} from "recharts";
import {
  Activity, TrendingDown, TrendingUp, Minus, ShoppingCart, Coffee,
  Milk, Droplets, Leaf, AlertTriangle, CheckCircle, Clock, Zap,
  DollarSign, BarChart3, PieChart as PieIcon, ArrowDown, ArrowRight,
  Bell, Send, Package, Store, ChevronDown,
} from "lucide-react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const COMMODITY_DATA = {
  milk: [
    { m: "Jun 24", v: 3.96 }, { m: "Jul 24", v: 3.98 }, { m: "Aug 24", v: 4.04 },
    { m: "Sep 24", v: 4.02 }, { m: "Oct 24", v: 4.04 }, { m: "Nov 24", v: 4.14 },
    { m: "Dec 24", v: 4.10 }, { m: "Jan 25", v: 4.03 }, { m: "Feb 25", v: 4.03 },
    { m: "Mar 25", v: 4.05 }, { m: "Apr 25", v: 4.07 }, { m: "May 25", v: 4.02 },
    { m: "Jun 25", v: 4.03 }, { m: "Jul 25", v: 4.16 }, { m: "Aug 25", v: 4.17 },
    { m: "Sep 25", v: 4.13 }, { m: "Nov 25", v: 4.00 }, { m: "Dec 25", v: 4.05 },
    { m: "Jan 26", v: 4.10 }, { m: "Feb 26", v: 4.03 },
  ],
  coffee: [
    { m: "Jun 24", v: 248 }, { m: "Jul 24", v: 257 }, { m: "Aug 24", v: 261 },
    { m: "Sep 24", v: 279 }, { m: "Oct 24", v: 277 }, { m: "Nov 24", v: 305 },
    { m: "Dec 24", v: 344 }, { m: "Jan 25", v: 354 }, { m: "Feb 25", v: 410 },
    { m: "Mar 25", v: 404 }, { m: "Apr 25", v: 393 }, { m: "May 25", v: 398 },
    { m: "Jun 25", v: 363 }, { m: "Jul 25", v: 317 }, { m: "Aug 25", v: 366 },
    { m: "Sep 25", v: 400 }, { m: "Oct 25", v: 404 }, { m: "Nov 25", v: 410 },
    { m: "Dec 25", v: 380 }, { m: "Jan 26", v: 364 }, { m: "Feb 26", v: 321 },
  ],
  butter: [
    { m: "Jun 24", v: 4.70 }, { m: "Jul 24", v: 4.90 }, { m: "Aug 24", v: 4.80 },
    { m: "Sep 24", v: 5.00 }, { m: "Oct 24", v: 4.94 }, { m: "Nov 24", v: 4.79 },
    { m: "Dec 24", v: 4.73 }, { m: "Jan 25", v: 4.91 }, { m: "Feb 25", v: 4.87 },
    { m: "Mar 25", v: 4.82 }, { m: "Apr 25", v: 4.78 }, { m: "May 25", v: 4.95 },
    { m: "Jun 25", v: 4.87 }, { m: "Jul 25", v: 4.80 },
  ],
  cheese: [
    { m: "Jun 25", v: 277 }, { m: "Jul 25", v: 284 }, { m: "Aug 25", v: 283 },
    { m: "Sep 25", v: 285 }, { m: "Oct 25", v: 281 }, { m: "Nov 25", v: 275 },
    { m: "Dec 25", v: 283 }, { m: "Jan 26", v: 274 }, { m: "Feb 26", v: 265 },
  ],
  creamCheese: [
    { m: "Mar 25", v: 4.95 }, { m: "Apr 25", v: 4.99 }, { m: "May 25", v: 5.06 },
    { m: "Jun 25", v: 5.04 }, { m: "Jul 25", v: 4.91 }, { m: "Aug 25", v: 5.01 },
    { m: "Sep 25", v: 4.93 }, { m: "Nov 25", v: 4.73 }, { m: "Dec 25", v: 4.73 },
    { m: "Jan 26", v: 4.85 }, { m: "Feb 26", v: 4.68 },
  ],
};

const SALES = [
  { name: "Torani Pumpkin Pie Sauce", variant: "Case of 6", price: 81.41, was: 101.00, pct: 19.4, supplier: "Barista Underground", perUnit: 13.57 },
  { name: "Torani Pumpkin Pie Sauce", variant: "1L Bottle", price: 26.54, was: 30.99, pct: 14.4, supplier: "Barista Underground", perUnit: 26.54 },
  { name: "Pacific Foods Pistachio Milk", variant: "Case of 12", price: 53.99, was: 59.99, pct: 10.0, supplier: "Barista Underground", perUnit: 4.50 },
  { name: "Pacific Foods Pistachio Milk", variant: "2 Cases", price: 91.79, was: 101.99, pct: 10.0, supplier: "Barista Underground", perUnit: 3.83 },
  { name: "Califia Pumpkin Oat Milk", variant: "4 Cases (24)", price: 82.79, was: 89.99, pct: 8.0, supplier: "Barista Underground", perUnit: 3.45 },
  { name: "Califia Pumpkin Oat Milk", variant: "12 Cartons", price: 52.39, was: 56.99, pct: 8.1, supplier: "Barista Underground", perUnit: 4.37 },
  { name: "Oatly Barista Edition", variant: "2 Cases (24)", price: 82.99, was: 89.99, pct: 7.8, supplier: "Barista Underground", perUnit: 3.46 },
  { name: "Ghost Town Oatmilk", variant: "24 Cartons", price: 103.99, was: 111.99, pct: 7.1, supplier: "Barista Underground", perUnit: 4.33 },
  { name: "Ghost Town Oatmilk", variant: "12 Cartons", price: 59.99, was: 63.99, pct: 6.3, supplier: "Barista Underground", perUnit: 5.00 },
];

const OAT_MILK = [
  { name: "Califia Pumpkin", price: 3.45, sale: true },
  { name: "Oatly Barista", price: 3.46, sale: true },
  { name: "Pacific Foods", price: 3.54, sale: false },
  { name: "Minor Figures", price: 3.75, sale: false },
  { name: "Califia Regular", price: 3.92, sale: false },
  { name: "Mooala", price: 4.17, sale: false },
  { name: "Ghost Town", price: 4.33, sale: true },
  { name: "Elmhurst", price: 5.00, sale: false },
];

const VANILLA_SYRUP = [
  { name: "Monin 12pk", price: 7.71, size: "750mL" },
  { name: "1883 12pk", price: 8.98, size: "1L" },
  { name: "Monin 6pk", price: 8.99, size: "750mL" },
  { name: "1883 6pk", price: 9.93, size: "1L" },
  { name: "Torani 12pk", price: 9.15, size: "1L" },
  { name: "Torani 6pk", price: 10.07, size: "1L" },
  { name: "Holy Kakow 12pk", price: 11.08, size: "750mL" },
];

const CATEGORIES = [
  { name: "Alt Milks", value: 30, color: "#d4a574" },
  { name: "Sauces", value: 25, color: "#8b6f47" },
  { name: "Chai", value: 24, color: "#c4956a" },
  { name: "Syrups", value: 21, color: "#a8d5a2" },
  { name: "Tea", value: 12, color: "#7ab87a" },
  { name: "Matcha", value: 10, color: "#5a9e5a" },
  { name: "Coffee", value: 6, color: "#4a3728" },
];

const SUPPLIERS_RADAR = [
  { subject: "Price", BaristaUG: 85, Westrock: 70, Elmhurst: 60 },
  { subject: "Selection", BaristaUG: 95, Westrock: 65, Elmhurst: 40 },
  { subject: "Sales", BaristaUG: 90, Westrock: 30, Elmhurst: 20 },
  { subject: "Alt Milk", BaristaUG: 80, Westrock: 20, Elmhurst: 95 },
  { subject: "Syrups", BaristaUG: 95, Westrock: 10, Elmhurst: 0 },
  { subject: "Coffee", BaristaUG: 40, Westrock: 95, Elmhurst: 0 },
];

const SAVINGS = [
  { name: "Oat Milk Switch", value: 2262, desc: "Ghost Town → Oatly" },
  { name: "Syrup Bulk Buy", value: 266, desc: "12pk vs 6pk" },
  { name: "Coffee Renegotiation", value: 1000, desc: "After commodity drop" },
];

const TOP_VENDORS = [
  { name: "Monin", count: 17 }, { name: "1883", count: 11 }, { name: "Torani", count: 7 },
  { name: "Dona Chai", count: 7 }, { name: "Elmhurst", count: 7 }, { name: "Califia", count: 6 },
  { name: "Denim Coffee", count: 6 }, { name: "Holy Kakow", count: 5 },
  { name: "Ghirardelli", count: 5 }, { name: "David Rio", count: 5 },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function AnimatedNumber({ target, prefix = "", suffix = "", decimals = 0, duration = 1200 }: {
  target: number; prefix?: string; suffix?: string; decimals?: number; duration?: number;
}) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return <span className="font-mono tabular-nums">{prefix}{val.toFixed(decimals)}{suffix}</span>;
}

function Pulse() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
    </span>
  );
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} ${className}`}>
      {children}
    </div>
  );
}

const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "8px",
    fontSize: "12px",
    fontFamily: "JetBrains Mono, monospace",
    color: "#e5e5e5",
  },
  labelStyle: { color: "#999" },
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Header() {
  return (
    <FadeIn>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-50">
              Cafe<span className="text-amber-400">Radar</span>
            </h1>
            <Pulse />
            <span className="text-[10px] font-mono text-green-400 uppercase tracking-widest">Live</span>
          </div>
          <p className="text-xs text-neutral-500 font-mono mt-1">
            Last scan: Mar 26, 2026 04:15 CT &middot; 310 products &middot; 3 suppliers &middot; 5 indexes
          </p>
        </div>
        <div className="flex gap-2">
          {[
            { label: "Products", value: "310", icon: Package },
            { label: "On Sale", value: "9", icon: Zap, highlight: true },
            { label: "Savings/yr", value: "$3,528", icon: DollarSign },
          ].map(({ label, value, icon: Icon, highlight }) => (
            <div key={label} className={`px-3 py-2 rounded-lg border ${highlight ? "border-amber-500/40 bg-amber-500/10" : "border-neutral-800 bg-neutral-900"}`}>
              <div className="flex items-center gap-1.5">
                <Icon size={12} className={highlight ? "text-amber-400" : "text-neutral-500"} />
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider">{label}</span>
              </div>
              <p className={`font-mono text-sm font-bold ${highlight ? "text-amber-400" : "text-neutral-200"}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </FadeIn>
  );
}

function CommodityChart({ title, data, unit, color, trend, trendLabel, delay = 0, annotation }: {
  title: string; data: { m: string; v: number }[]; unit: string; color: string;
  trend: "up" | "down" | "stable"; trendLabel: string; delay?: number;
  annotation?: { x1: string; x2: string; label: string };
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "down" ? "text-green-400" : trend === "up" ? "text-red-400" : "text-neutral-400";
  const latest = data[data.length - 1];
  const first = data[0];
  const change = ((latest.v - first.v) / first.v * 100).toFixed(1);

  return (
    <FadeIn delay={delay} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-200">{title}</h3>
          <p className="font-mono text-lg font-bold text-neutral-100">
            {unit === "¢/lb" ? `${latest.v}` : `$${latest.v.toFixed(2)}`}
            <span className="text-xs text-neutral-500 ml-1">{unit}</span>
          </p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono ${trend === "down" ? "bg-green-500/15 text-green-400" : trend === "up" ? "bg-red-500/15 text-red-400" : "bg-neutral-800 text-neutral-400"}`}>
          <TrendIcon size={12} />
          {trendLabel}
        </div>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis dataKey="m" tick={{ fontSize: 9, fill: "#666" }} tickLine={false} axisLine={{ stroke: "#333" }} interval={Math.floor(data.length / 5)} />
            <YAxis tick={{ fontSize: 9, fill: "#666", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
            <Tooltip
              {...chartTooltipStyle}
              formatter={(value: number) => [unit === "¢/lb" ? `${value} ${unit}` : `$${value.toFixed(2)} ${unit}`, title]}
            />
            {annotation && (
              <ReferenceArea x1={annotation.x1} x2={annotation.x2} fill="#22c55e" fillOpacity={0.08} stroke="#22c55e" strokeOpacity={0.3} strokeDasharray="4 4" />
            )}
            <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#grad-${title})`} dot={false} activeDot={{ r: 4, stroke: color, fill: "#111" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] font-mono text-neutral-600">{data[0].m}</span>
        <span className="text-[10px] font-mono text-neutral-600">
          {Number(change) > 0 ? "+" : ""}{change}% overall
        </span>
        <span className="text-[10px] font-mono text-neutral-600">{latest.m}</span>
      </div>
    </FadeIn>
  );
}

function CoffeeAnnotatedChart() {
  return (
    <FadeIn delay={300} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 col-span-1 md:col-span-2">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-200">Coffee Futures vs. Supplier Renegotiation Window</h3>
          <p className="text-xs text-neutral-500 font-mono">ICE composite &middot; green zone = push your roaster for lower rates</p>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono bg-green-500/15 text-green-400">
          <TrendingDown size={12} />
          -22% from peak
        </div>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={COMMODITY_DATA.coffee} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="coffeeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c4956a" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#c4956a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis dataKey="m" tick={{ fontSize: 9, fill: "#666" }} tickLine={false} axisLine={{ stroke: "#333" }} interval={3} />
            <YAxis tick={{ fontSize: 9, fill: "#666", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} domain={[200, 430]} />
            <Tooltip
              {...chartTooltipStyle}
              formatter={(value: number) => [`${value} ¢/lb`, "Coffee ICE"]}
            />
            <ReferenceArea y1={200} y2={340} fill="#22c55e" fillOpacity={0.06} />
            <ReferenceLine y={340} stroke="#22c55e" strokeDasharray="6 3" strokeOpacity={0.5} label={{ value: "Renegotiation zone", position: "insideTopRight", fill: "#22c55e", fontSize: 10, fontFamily: "JetBrains Mono" }} />
            <ReferenceLine y={410} stroke="#ef4444" strokeDasharray="6 3" strokeOpacity={0.4} label={{ value: "Peak (Feb 25)", position: "insideTopRight", fill: "#ef4444", fontSize: 10, fontFamily: "JetBrains Mono" }} />
            <Area type="monotone" dataKey="v" stroke="#c4956a" strokeWidth={2} fill="url(#coffeeGrad)" dot={false} activeDot={{ r: 5, stroke: "#c4956a", fill: "#111" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
        <p className="text-xs text-green-400 font-mono">
          <Zap size={10} className="inline mr-1" />
          Coffee at 321 ¢/lb — down from 410 peak. Call your roaster NOW for $500-1,500/yr savings.
        </p>
      </div>
    </FadeIn>
  );
}

function OatMilkChart() {
  return (
    <FadeIn delay={400} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Milk size={16} className="text-amber-400" />
        <h3 className="text-sm font-semibold text-neutral-200">Oat Milk Per-Carton</h3>
        <span className="text-[10px] font-mono text-neutral-500">24-pack pricing</span>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={OAT_MILK} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 9, fill: "#666", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} domain={[0, 5.5]} tickFormatter={(v) => `$${v.toFixed(2)}`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#ccc", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} width={100} />
            <Tooltip
              {...chartTooltipStyle}
              formatter={(value: number) => [`$${value.toFixed(2)}/carton`, "Price"]}
            />
            <Bar dataKey="price" radius={[0, 4, 4, 0]} barSize={20}>
              {OAT_MILK.map((entry, i) => (
                <Cell key={i} fill={entry.sale ? "#f59e0b" : "#525252"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-neutral-500">
        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-500" /> On sale
        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-neutral-600 ml-2" /> Regular
      </div>
    </FadeIn>
  );
}

function VanillaSyrupChart() {
  return (
    <FadeIn delay={500} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Droplets size={16} className="text-green-400" />
        <h3 className="text-sm font-semibold text-neutral-200">Vanilla Syrup Per-Bottle</h3>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={VANILLA_SYRUP} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 9, fill: "#666", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} domain={[0, 12]} tickFormatter={(v) => `$${v.toFixed(2)}`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#ccc", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} width={100} />
            <Tooltip
              {...chartTooltipStyle}
              formatter={(value: number, _: string, props: { payload: { size: string } }) => [`$${value.toFixed(2)}/${props.payload.size}`, "Price"]}
            />
            <Bar dataKey="price" radius={[0, 4, 4, 0]} barSize={20}>
              {VANILLA_SYRUP.map((_, i) => (
                <Cell key={i} fill={i === 0 ? "#a8d5a2" : i < 3 ? "#5a9e5a" : "#525252"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] font-mono text-green-400 mt-1">
        Best: Monin 12pk at $7.71/bottle — 24% less than Torani 6pk
      </p>
    </FadeIn>
  );
}

function SalesTable() {
  return (
    <FadeIn delay={200} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-amber-400" />
          <h3 className="text-sm font-semibold text-neutral-200">Active Sales</h3>
          <span className="px-1.5 py-0.5 text-[10px] font-mono bg-amber-500/20 text-amber-400 rounded-full">{SALES.length}</span>
        </div>
        <span className="text-[10px] font-mono text-neutral-500">sorted by discount</span>
      </div>
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="text-neutral-500 border-b border-neutral-800">
              <th className="text-left pb-2 pr-3 font-medium">Product</th>
              <th className="text-right pb-2 px-2 font-medium">Price</th>
              <th className="text-right pb-2 px-2 font-medium">Was</th>
              <th className="text-right pb-2 px-2 font-medium">Off</th>
              <th className="text-right pb-2 pl-2 font-medium">Per Unit</th>
            </tr>
          </thead>
          <tbody>
            {SALES.map((s, i) => (
              <tr key={i} className={`border-b border-neutral-800/50 ${i < 2 ? "bg-amber-500/5" : ""}`}>
                <td className="py-2 pr-3">
                  <div className="text-neutral-200 font-medium">{s.name}</div>
                  <div className="text-neutral-600 text-[10px]">{s.variant} &middot; {s.supplier}</div>
                </td>
                <td className="text-right py-2 px-2 text-green-400 font-semibold">${s.price.toFixed(2)}</td>
                <td className="text-right py-2 px-2 text-neutral-600 line-through">${s.was.toFixed(2)}</td>
                <td className="text-right py-2 px-2">
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${s.pct >= 15 ? "bg-red-500/20 text-red-400" : s.pct >= 8 ? "bg-amber-500/20 text-amber-400" : "bg-neutral-800 text-neutral-400"}`}>
                    {s.pct}%
                  </span>
                </td>
                <td className="text-right py-2 pl-2 text-neutral-300">${s.perUnit.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </FadeIn>
  );
}

function CategoryDonut() {
  const total = CATEGORIES.reduce((a, c) => a + c.value, 0);
  return (
    <FadeIn delay={600} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <PieIcon size={16} className="text-amber-400" />
        <h3 className="text-sm font-semibold text-neutral-200">Product Categories</h3>
        <span className="text-[10px] font-mono text-neutral-500">{total} tracked</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-36 h-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={CATEGORIES}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {CATEGORIES.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                {...chartTooltipStyle}
                formatter={(value: number, name: string) => [`${value} products`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-1.5">
          {CATEGORIES.map((c) => (
            <div key={c.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-neutral-300">{c.name}</span>
              </div>
              <span className="font-mono text-neutral-500">{c.value}</span>
            </div>
          ))}
        </div>
      </div>
    </FadeIn>
  );
}

function SupplierRadar() {
  return (
    <FadeIn delay={700} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Store size={16} className="text-amber-400" />
        <h3 className="text-sm font-semibold text-neutral-200">Supplier Comparison</h3>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={SUPPLIERS_RADAR} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="#333" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#999", fontFamily: "JetBrains Mono" }} />
            <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
            <Radar name="Barista UG" dataKey="BaristaUG" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} />
            <Radar name="Westrock" dataKey="Westrock" stroke="#8b6f47" fill="#8b6f47" fillOpacity={0.1} strokeWidth={1.5} />
            <Radar name="Elmhurst" dataKey="Elmhurst" stroke="#a8d5a2" fill="#a8d5a2" fillOpacity={0.1} strokeWidth={1.5} />
            <Legend wrapperStyle={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
            <Tooltip {...chartTooltipStyle} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </FadeIn>
  );
}

function SavingsWaterfall() {
  const total = SAVINGS.reduce((a, s) => a + s.value, 0);
  const waterfallData = SAVINGS.map((s, i) => {
    const start = SAVINGS.slice(0, i).reduce((a, x) => a + x.value, 0);
    return { ...s, start, end: start + s.value };
  });

  return (
    <FadeIn delay={800} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-green-400" />
          <h3 className="text-sm font-semibold text-neutral-200">Annual Savings Breakdown</h3>
        </div>
        <span className="font-mono text-lg font-bold text-green-400">
          <AnimatedNumber target={total} prefix="$" suffix="/yr" />
        </span>
      </div>
      <div className="space-y-3 mt-4">
        {SAVINGS.map((s, i) => {
          const pct = (s.value / total) * 100;
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-xs font-medium text-neutral-200">{s.name}</span>
                  <span className="text-[10px] text-neutral-500 ml-2 font-mono">{s.desc}</span>
                </div>
                <span className="text-xs font-mono font-bold text-green-400">${s.value.toLocaleString()}</span>
              </div>
              <div className="h-5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: i === 0 ? "linear-gradient(90deg, #f59e0b, #d97706)" : i === 1 ? "linear-gradient(90deg, #a8d5a2, #5a9e5a)" : "linear-gradient(90deg, #c4956a, #8b6f47)",
                    transitionDelay: `${i * 200 + 500}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 p-2 bg-neutral-800 rounded-lg">
        <div className="h-8">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[{ oat: 2262, syrup: 266, coffee: 1000 }]} layout="horizontal" barCategoryGap={0}>
              <XAxis type="category" hide />
              <YAxis type="number" hide />
              <Bar dataKey="oat" stackId="a" fill="#f59e0b" radius={[4, 0, 0, 4]} />
              <Bar dataKey="syrup" stackId="a" fill="#a8d5a2" />
              <Bar dataKey="coffee" stackId="a" fill="#c4956a" radius={[0, 4, 4, 0]} />
              <Tooltip
                {...chartTooltipStyle}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = { oat: "Oat Milk Switch", syrup: "Syrup Bulk", coffee: "Coffee Renego" };
                  return [`$${value.toLocaleString()}`, labels[name] || name];
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </FadeIn>
  );
}

function TelegramPreview() {
  return (
    <FadeIn delay={900} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Send size={16} className="text-blue-400" />
        <h3 className="text-sm font-semibold text-neutral-200">Alert Previews</h3>
        <span className="text-[10px] font-mono text-neutral-500">Telegram format</span>
      </div>
      <div className="space-y-2">
        <div className="bg-[#1a2332] rounded-xl rounded-tl-sm p-3 border border-blue-900/30 max-w-sm">
          <p className="text-xs text-blue-400 font-semibold mb-1">CafeRadar Bot</p>
          <p className="text-xs text-neutral-200 leading-relaxed">
            <span className="text-amber-400">FLASH SALE</span> — Barista Underground<br /><br />
            Torani Pumpkin Pie Sauce is <span className="font-bold text-red-400">19.4% OFF!</span><br />
            $81.41/case of 6 (was $101.00)<br />
            That&apos;s $13.57/bottle vs normal $16.83<br /><br />
            <span className="text-neutral-500">baristaunderground.com</span>
          </p>
          <p className="text-[10px] text-neutral-600 text-right mt-1">5:00 AM</p>
        </div>
        <div className="bg-[#1a2332] rounded-xl rounded-tl-sm p-3 border border-blue-900/30 max-w-sm">
          <p className="text-xs text-blue-400 font-semibold mb-1">CafeRadar Bot</p>
          <p className="text-xs text-neutral-200 leading-relaxed">
            <span className="text-neutral-400">COMMODITY ALERT</span><br /><br />
            Coffee futures <span className="text-green-400 font-bold">down 22%</span> from Nov peak<br />
            321 ¢/lb — push your roaster for lower rates<br /><br />
            <span className="text-neutral-500">Source: FRED/ICE</span>
          </p>
          <p className="text-[10px] text-neutral-600 text-right mt-1">7:00 AM</p>
        </div>
      </div>
    </FadeIn>
  );
}

function SourceStatus() {
  const sources = [
    { name: "Barista Underground", products: 153, status: "ok", platform: "Shopify" },
    { name: "Westrock Coffee", products: 104, status: "ok", platform: "Shopify" },
    { name: "Elmhurst 1925", products: 53, status: "ok", platform: "Shopify" },
    { name: "FRED (St. Louis Fed)", products: 4, status: "ok", platform: "CSV API" },
    { name: "BLS PPI/CPI", products: 2, status: "ok", platform: "JSON API" },
  ];

  return (
    <FadeIn delay={1000} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity size={16} className="text-green-400" />
        <h3 className="text-sm font-semibold text-neutral-200">Source Status</h3>
      </div>
      <div className="space-y-2">
        {sources.map((s) => (
          <div key={s.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle size={12} className="text-green-500" />
              <span className="text-neutral-300">{s.name}</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-neutral-500">
              <span>{s.platform}</span>
              <span>{s.products} items</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between text-[10px] font-mono text-neutral-600">
        <span>Next scan in 4h 22m</span>
        <span>Uptime: 99.8%</span>
      </div>
    </FadeIn>
  );
}

function VendorDistribution() {
  return (
    <FadeIn delay={650} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={16} className="text-amber-400" />
        <h3 className="text-sm font-semibold text-neutral-200">Top Vendors</h3>
      </div>
      <div className="space-y-1.5">
        {TOP_VENDORS.map((v, i) => (
          <div key={v.name} className="flex items-center gap-2 text-xs">
            <span className="w-16 text-neutral-400 font-mono truncate">{v.name}</span>
            <div className="flex-1 h-3.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(v.count / 17) * 100}%`,
                  backgroundColor: i === 0 ? "#f59e0b" : i < 3 ? "#8b6f47" : "#525252",
                }}
              />
            </div>
            <span className="font-mono text-neutral-500 w-5 text-right">{v.count}</span>
          </div>
        ))}
      </div>
    </FadeIn>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function RadarDashboard() {
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
      `}</style>
      <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 p-3 sm:p-5 font-[system-ui]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <div className="max-w-7xl mx-auto">
          <Header />

          {/* Commodity Charts */}
          <section className="mb-6">
            <h2 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3">Commodity Indexes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <CommodityChart title="Whole Milk CPI" data={COMMODITY_DATA.milk} unit="$/gal" color="#d4a574" trend="stable" trendLabel="Stable" delay={100} />
              <CommodityChart title="Butter CPI" data={COMMODITY_DATA.butter} unit="$/lb" color="#c4956a" trend="stable" trendLabel="Stable" delay={150} />
              <CommodityChart title="Cheese PPI" data={COMMODITY_DATA.cheese} unit="index" color="#8b6f47" trend="down" trendLabel="-7% m/m" delay={200} />
              <CommodityChart title="Cream Cheese CPI" data={COMMODITY_DATA.creamCheese} unit="$/8oz" color="#a8d5a2" trend="down" trendLabel="-7%" delay={250} />
            </div>
            <CoffeeAnnotatedChart />
          </section>

          {/* Price Comparisons */}
          <section className="mb-6">
            <h2 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3">Price Comparisons</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OatMilkChart />
              <VanillaSyrupChart />
            </div>
          </section>

          {/* Sales */}
          <section className="mb-6">
            <SalesTable />
          </section>

          {/* Analytics Row */}
          <section className="mb-6">
            <h2 className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3">Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <CategoryDonut />
              <SupplierRadar />
              <VendorDistribution />
            </div>
          </section>

          {/* Savings & Alerts */}
          <section className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SavingsWaterfall />
              <TelegramPreview />
            </div>
          </section>

          {/* Source Status */}
          <section className="mb-6">
            <SourceStatus />
          </section>

          {/* Footer */}
          <FadeIn delay={1100}>
            <div className="text-center py-4 border-t border-neutral-800">
              <p className="text-[10px] font-mono text-neutral-600">
                CafeRadar v1.0 &middot; Built for Dallas cafe operators &middot; Data scraped Mar 26, 2026
              </p>
            </div>
          </FadeIn>
        </div>
      </div>
    </>
  );
}
