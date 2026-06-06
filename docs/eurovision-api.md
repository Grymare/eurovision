# Eurovision API sync (EUP-038)

Grymare Eurovision syncs **Grand Final** participant lists from the unofficial [EurovisionAPI dataset](https://github.com/EurovisionAPI/dataset) on GitHub. There is no official Eurovision.tv public API.

## Provider

| Item | Value |
|------|--------|
| Source | [EurovisionAPI/dataset](https://github.com/EurovisionAPI/dataset) (GitHub, MIT-style open data) |
| REST site | [eurovisionapi.runasp.net](https://eurovisionapi.runasp.net/) — **not used** (endpoints return 404 as of 2026) |
| Sync path | Raw GitHub files under `data/senior/{year}/` |

## Files fetched per year

| File | Purpose |
|------|---------|
| `data/countries.json` | ISO code → country name |
| `data/senior/{year}/contest.json` | Host city, arena, slogan |
| `data/senior/{year}/rounds/final.json` | Grand Final performances (`contestantId`, `running` order) |
| Release `senior.json` | Contestant id → country code map (cached locally; avoids GitHub REST API rate limits) |

## Mapping to Grymare schema

1. Grand Final performances are sorted by `running` order.
2. Each `contestantId` resolves to an ISO code via contestant folder names.
3. ISO / API country name maps to [`COUNTRY_CATALOG`](../src/lib/countries/catalog.ts) using every entry from EurovisionAPI [`countries.json`](https://github.com/EurovisionAPI/dataset/blob/main/data/countries.json) (including historical codes such as `TR`, `YU`, `CS`, and `GB-WLS`), plus aliases in [`src/lib/eurovision/sync/map-country.ts`](../src/lib/eurovision/sync/map-country.ts).
4. Output matches [`docs/eurovision-datasets.md`](eurovision-datasets.md) with `source: "api"`.

Unmapped countries are returned in the sync preview so the admin can fix them manually before save.

## Failure modes

| Condition | App behaviour |
|-----------|----------------|
| GitHub unreachable / rate-limited | `503 ESC_SYNC_UNAVAILABLE` or `ESC_SYNC_RATE_LIMITED` — uses cached `senior.json` when possible; manual editor still works |
| Year not in EurovisionAPI yet (e.g. **2026** as of early 2026) | Falls back to **bundled seed** (`eurovision-datasets-seed` / `data/eurovision/{year}.json` in the image) |
| Year missing everywhere | `404 ESC_YEAR_NOT_FOUND` |
| No Grand Final round | `404 ESC_FINAL_NOT_FOUND` |
| Unmapped country codes | Should not occur for EurovisionAPI `countries.json` keys; if upstream adds a new code, add it to [`eurovision-api-countries.ts`](../src/lib/eurovision/eurovision-api-countries.ts) |

There is no reliable public REST API with Grand Final results for the current contest year before EurovisionAPI publishes it. Eurovision World and eurovision.com do not expose a stable JSON API. The app uses **EurovisionAPI when available**, otherwise the **shipped seed file** for years like 2026 until the upstream dataset catches up.

## Rate limits

GitHub raw/API requests are unauthenticated. Sync is **manual** (admin button). The release `senior.json` (~18 MB) is cached on disk for 24 hours under the datasets volume `.cache/` folder so repeat syncs do not re-download it.

## Manual fallback

Use **Import JSON** on `/admin/datasets` or edit entries manually. Export JSON for git backup in [`data/eurovision/`](../data/eurovision/).
