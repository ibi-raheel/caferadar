<div align="center">

<img src=".github/assets/cover.png" alt="CafeRadar" width="100%">

# CafeRadar

**Price intelligence for a cafe: scrapes three suppliers nightly and overlays commodity indexes so the owner knows when to renegotiate.**

<p>
<a href="https://ibiraheel.com/p/caferadar"><img alt="Case study" src="https://img.shields.io/badge/Case%20study-ibiraheel.com-0b0c10?style=for-the-badge&labelColor=c8f560"></a>
</p>

<p>
<img alt="Next.js" src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white">
<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white">
<img alt="SQLite" src="https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white">
<img alt="Shopify JSON" src="https://img.shields.io/badge/Shopify%20JSON-30363D?style=flat-square">
<img alt="FRED" src="https://img.shields.io/badge/FRED-30363D?style=flat-square">
<img alt="BLS" src="https://img.shields.io/badge/BLS-30363D?style=flat-square">
<img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white">
</p>

</div>

<br>

> **1,911 products and 6 commodity indexes tracked**  
> for a cafe owner buying from Barista Underground, Elmhurst, and Westrock

## What it did

Nightly scrapers pull 3,554 variants into SQLite, flag sales up to 61% off, and chart FRED and BLS indexes for milk, butter, cheese, and coffee futures against a supplier renegotiation window.

<sub>Outcome: measured.</sub>

## How it works

<p align="center"><img src=".github/assets/architecture.svg" alt="Architecture" width="100%"></p>

1. Shopify storefront scrapers share one normaliser, so a new supplier is one small file.
2. SQLite in the repo: no server to run, and the whole history travels with the code.
3. Commodity data from FRED and BLS is joined to products by category so a price move has context.
4. Next.js App Router pages read through a single queries module.

## Screenshots

<table>
<tr>
<td width="50%"><img src=".github/assets/radar.png" alt="Commodity radar with renegotiation zone"><br><sub>Commodity radar with renegotiation zone</sub></td>
<td width="50%"><img src=".github/assets/commodities.png" alt="Commodity indexes"><br><sub>Commodity indexes</sub></td>
</tr>
<tr>
<td width="50%"><img src=".github/assets/dashboard.png" alt="Dashboard"><br><sub>Dashboard</sub></td>
</tr>
</table>

## Run it locally

```bash
npm install
npm run dev    # http://localhost:3000, reads the bundled data/prices.db
npm run seed   # optional: re-scrape the suppliers and commodity indexes into a fresh DB
```

## Repository layout

```
├── data/
│   ├── prices.db
│   ├── prices.db-shm
│   └── prices.db-wal
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── scripts/
│   └── seed.ts
├── src/
│   ├── app/
│   └── lib/
├── AGENTS.md
├── CLAUDE.md
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── README.md
└── tsconfig.json
```

---

<div align="center">

<sub>Built by <a href="https://github.com/ibi-raheel">Muhammad Ibrahim Raheel</a> · more work at <a href="https://ibiraheel.com">ibiraheel.com</a></sub>

</div>
