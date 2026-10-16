# Uganda Watershed Multi-Criteria Prioritization & Ranking Model

An interactive React/TypeScript decision-support application using the supplied Uganda workbook and catchment polygons. This is a separate project; it does not replace the Rwanda training website.

## Local setup

Use Node.js 22 or newer and pnpm 10.26 or newer (tested with pnpm 11.19). From this directory:

```text
pnpm install --frozen-lockfile
pnpm dev
```

Open the Local URL printed by Vite (normally http://127.0.0.1:8090). Do not open index.html through file://. Data fetches require an HTTP server.

```text
pnpm test
pnpm build
pnpm preview
```

The `dist` directory is the complete static website, including processed datasets. It requires no API key, paid map API, account, database or runtime server. MapLibre displays supplied polygons without an external basemap.

## GitHub Pages

Deploy the contents of `dist` to the existing Pages source directory/branch of your chosen repository, preserving `.nojekyll`. Alternatively use a GitHub Actions workflow that installs dependencies, runs `pnpm build`, uploads `dist` with actions/upload-pages-artifact, then deploys with actions/deploy-pages. Vite's relative base supports repository subpaths. Do not upload node_modules or scripts/pydeps. The source package includes processed data so rebuilding does not require Python or the original files. No public publication is performed as part of this local deliverable.

## Data provenance and verified join

- Workbook: `Uganda Ecosystem Services & PBIS - Hydroshed scoring - TEMP.xlsx` (actual attached filename).
- Spatial archive: `Catchments-20261016T002049Z-1-001.zip`.
- 2,177 unique workbook Lev12_ID records; 2,135 polygons; all 2,135 polygons match the workbook.
- 42 workbook records lack supplied polygons. They remain in analysis and exports with `hasGeometry=false`. No spatial-only records. Full ID lists, source SHA256 hashes, candidate key duplicates and cross-attribute checks appear in `reports/validation.json`.
- `Lev12_ID` is the unique join key. `ws_id` repeats and cannot be used as a unique key; `HYBAS_ID` is retained and cross-checked. No geometries or indicator values are invented.
- Source projected coordinates are transformed to WGS84 GeoJSON. Full-detail geometry and original attributes are retained. `AreaHa` comes from the original workbook, not degrees-based area.

## Scoring methodology

The original 21 FinalRank indicators, five pillars, names, directions, inclusion flags and raw weights are in `public/data/indicators.json`. Seven are checked, of which five have positive weight; their sum is 2.45. Minimum area is 1,000 hectares, producing 2,028 records under the default all-zone filters.

1. Filter by zone, basin, catchment and inclusive minimum area.
2. Reproduce Excel PERCENTRANK.INC with omitted significance: first ascending index / (n−1), truncated to three decimals. Ties use first index.
3. Higher uses percentile; Lower uses 1−percentile.
4. Normalize active raw weights by their sum and calculate the weighted sum.
5. Use descending RANK.EQ competition ranks, with ascending Lev12_ID for deterministic display ties.

All 2,028 default scores reproduce cached Excel values within 4.45e−16. All 21 selectable percentile series match exactly. See `reports/validation.json`, `reports/VALIDATION.md` and in-app Data & validation.

### Missing data and explicit deviations

Excel's FILTER/CHOOSECOLS spill converts blank numeric source fields to zero. We preserve original nulls in raw data and displays, but use zero only for scoring to reproduce the workbook. Missingness is flagged in exports and details. No per-row weight renormalization occurs. Lower direction can favor missing values; this is disclosed, not silently corrected. Water yield is annual yield, not seasonal baseflow.

No positive active weight or fewer than two records yields an explicit unscored result. Negative and nonfinite weights are rejected. This improves handling of workbook error cases without inventing scores. Original defaults, including Lower direction for avoided export, are retained even where policy interpretation may warrant review.

The workbook's priority tier column is blank. App-defined cumulative tiers use competition rank ≤ ceil(n × 1%, 5%, 10%, 20%). A mutually exclusive label records the narrowest qualifying tier. Ties can increase the cutoff count. Tier/search filters affect display only; analysis filters recalculate percentiles.

## Features and exports

- Dashboard counts, score histogram and WMZ mean comparisons.
- Map/table selection, watershed profile, search, layer controls, gold priority outlines and graduated score colors.
- Editable indicators, normalization, original/current comparison, configuration JSON import/export, browser save/reload.
- Sortable, paginated TanStack ranking table and selectable indicator columns.
- Compare 2–5 records: scores, areas, raw indicators, percentiles and thematic radar chart.
- Current/full ranking CSV with companion metadata JSON; filtered Excel with Configuration/Metadata sheets; selected GeoJSON with source attributes and current results; map/chart PNG; printable comparison.

"Full ranking" is the full current analysis population. "Filtered" follows display tier/search filters. Metadata records analysis scope, display filters, source hashes, directions and weights. Selected GeoJSON exports only selected records inside current analysis scope; missing geometries and out-of-scope selections are listed explicitly. Map PNG includes its legend, viewport and current display colors; a companion metadata JSON downloads automatically for scoring provenance. Print summary is available in the comparison view.

## Future hydrological imports

Use the empty CSV template from Criteria & weights. Required key: `Lev12_ID`. Optional exact columns:

```text
Mean Baseflow (mm/yr)
Mean Quickflow (mm/yr)
Mean Local Recharge (mm/yr)
```

Imports reject unmatched/duplicate IDs and invalid numeric values atomically. Missing IDs remain null. Imported criteria are separate, off by default with weight zero, and never replace annual water yield. Review missingness before enabling. Save configuration JSON includes imported data so it can be reloaded. Data stay in the browser. A scenario-comparison feature requires real baseline/action datasets and is not fabricated from the current workbook.

## Source preparation

`scripts/process_data.py` reads originals without modifying them. It needs openpyxl, pyshp, pyproj and shapely (Python 3.12 tested). Supply workbook and archive paths as its two arguments. It writes processed JSON/GeoJSON and join/scoring reports. Project source does not require the large geospatial Python dependency directory after preparation.

## Technical references

- [Microsoft PERCENTRANK.INC](https://support.microsoft.com/en-us/excel/functions/percentrank-inc-function)
- [MapLibre MapOptions](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/)
- React, TypeScript, Vite, Tailwind CSS, TanStack Table, Recharts, MapLibre GL JS, PapaParse, SheetJS and html-to-image. Dependencies are bundled into dist; the deployed app does not fetch CDN scripts.

These are relative evidence-based rankings, not absolute restoration effectiveness or verified future ecosystem-service gains. Review source missingness, indicator correlation, policy directions and weights before allocating investments.

WMZ boundary preprocessing dissolves 17 supplied source subdivisions by Water_Mana into four zones; wmz-source.geojson preserves the original features and attributes. Land-condition shares retain source fractions (0–1), despite the original names containing % area.

Optional browser QA uses tests/browser.cjs with Playwright and an installed Chromium/Chrome executable. Set TEST_BROWSER to the executable and TEST_URL to the served production URL. The standard pnpm test command runs the source-data calculation checks without a browser.
