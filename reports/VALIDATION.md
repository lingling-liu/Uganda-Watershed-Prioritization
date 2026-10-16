# Data validation report

Verified 15 October 2026 (America/Los_Angeles). Sources were read without editing.

## Source identity

- Workbook: `Uganda Ecosystem Services & PBIS - Hydroshed scoring - TEMP.xlsx`
- SHA256: `bd9c00958de025d61d5be7940bce456e33704acb3c0f193deb6886dae4d8f6ef`
- Spatial archive: `Catchments-20261016T002049Z-1-001.zip`
- SHA256: `0f097d02b775d0092fa1c1e42bc5043e186fdb9651e65ce6b72e9f32fa6f27cf`

## Join results

2,177 workbook records; 2,135 supplied polygons; 2,135 matched unique Lev12_ID keys. There are 42 workbook-only records and 0 spatial-only records. No values are assigned to unmatched geometry and no rows are silently removed.

| Candidate key | Workbook distinct | Spatial distinct | Shared distinct | Duplicate workbook keys | Duplicate spatial keys |
|---|---:|---:|---:|---:|---:|
| Lev12_ID | 2177 | 2135 | 2135 | 0 | 0 |
| ws_id | 18 | 17 | 17 | 18 | 17 |
| HYBAS_ID | 2177 | 2135 | 2135 | 0 | 0 |

Cross-attribute mismatches after Lev12_ID join (HYBAS_ID and ws_id): 0.

Workbook-only Lev12_IDs: 2, 6, 7, 8, 9, 14, 32, 41, 57, 130, 156, 164, 806, 842, 843, 967, 1059, 1237, 1473, 1568, 1651, 1824, 1844, 1845, 1888, 1889, 1916, 2045, 2084, 2109, 2114, 2125, 2136, 2142, 2155, 2156, 2157, 2158, 2161, 2170, 2171, 2173.

## Scoring validation

The all-zone, all-basin, all-catchment default with minimum area 1,000 ha includes 2,028 records. All 2,028 scores were checked against cached RankScoreData composite scores. Maximum absolute difference: 4.44089209850062616e-16. Maximum percentile difference: 0.0. Seven criteria are checked, five have positive weights, and raw weights sum to 2.45.

The top five Lev12_IDs are 1584, 1649, 1170, 1585, 1427.

Percentiles use Excel PERCENTRANK.INC with omitted significance (three decimals), the first ascending index for ties, and no rounding before truncation. Raw nulls are preserved; the scoring path converts them to zero to reproduce Excel FILTER/CHOOSECOLS numeric spill behavior. This is disclosed rather than interpreted as observed zero. Competition ranks and ascending Lev12_ID display ties are deterministic. Priority tiers were blank in Excel; documented cumulative rank cutoffs are an application addition. Empty/singleton populations and zero active weight yield unscored records.

## Raw missing values

| Indicator field | All records | Default scope |
|---|---:|---:|
| usle_per_ha | 15 | 13 |
| usle_Total | 15 | 13 |
| sed_export_per_ha | 22 | 19 |
| sed_export_Total | 22 | 19 |
| sed_deposition_per_ha | 21 | 18 |
| sed_deposition_Total | 21 | 18 |
| avoid_exp_per_ha | 22 | 19 |
| avoid_exp_Total | 22 | 19 |
| avoided_erosion_per_ha | 15 | 13 |
| avoided_erosion_Total | 15 | 13 |
| n_total_export_per_ha | 16 | 16 |
| n_total_export_Total | 16 | 16 |
| n_surface_export_per_ha | 16 | 16 |
| n_subsurface_export_per_ha | 16 | 16 |
| p_surface_export_per_ha | 16 | 16 |
| p_surface_export_Total | 16 | 16 |
| Deg_Share | 2 | 0 |
| Stable_Share | 2 | 0 |
| Improving_Share | 2 | 0 |
| wyield_mn | 42 | 42 |
| wyield_vol | 42 | 42 |

Default scope contains 42 missing administrative label records. These remain as Unassigned. Land shares stay in source fractions (0–1), with original indicator names retained.

## Spatial preparation

Source CRS: EPSG:32636. Geometry transformed to WGS84. Full-detail watershed geometry and original attributes retained. Repaired invalid input geometry: 6 watersheds / 8 source boundary features. 17 WMZ source features dissolved by Water_Mana into 4 WMZ boundary features; the original subdivision features and attributes remain in wmz-source.geojson.

## Verification performed

- Calculation tests: source counts, join count, all 2,028 Excel scores, normalized weights, direction reversal, criterion changes, missing-value provenance, empty/singleton/zero-weight cases, percentile precision and deterministic ties.
- Browser tests in isolated Google Chrome: real map click/table checkbox synchronization; 2-watershed comparison charts; tier/ID display filters; CSV contents; Excel sheet names and exact score; GeoJSON values; map/chart PNG downloads; saved configurations and imported data reload; positive/zero-weight behavior; unmatched/duplicate hydrology import rejection; valid import acceptance; empty scope.
- All five sections checked at 1550, 768 and 390 pixel widths without horizontal document overflow. No uncaught JavaScript errors in the tested paths. Layout screenshots reviewed.
- TypeScript check, production Vite build and frozen-lockfile dependency install completed.

## Limits

A structural/browser check does not validate the scientific calibration of the supplied InVEST data. Rankings are relative to selected evidence and filters, not absolute restoration effectiveness. Source null-to-zero treatment may materially affect Lower-direction criteria; review it before investment decisions. Future baseline/climate-action data were not supplied and have not been fabricated. Map rendering requires WebGL; PNG/print output can vary by browser. No public deployment or central data collection was performed.

Production-build browser regression also passed. Every default competition rank matches the cached Excel rank (zero differences). Mobile WebGL map rendering was visually verified after source geometry loaded.
