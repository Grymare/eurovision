# Legacy party import (EUP-043)

Import finished Eurovision nights from a **country × jury** spreadsheet matrix into SQLite as `state = finished` parties. Jurors are stored with `userId = null` until [EUP-042](tickets/EUP-042.md) claim flow.

## Spreadsheet layout

Tab-separated (TSV) or comma-separated (CSV) export from Excel/Sheets:

| Column | Meaning |
|--------|---------|
| First column | Country label (`01 Sweden`, `Estonia`, …) |
| Middle columns | One column per juror nickname (`Hen`, `Jö`, `NL`, `Pav`, …) |
| Last column (optional) | `TOTAL SCORE` — sum of jury columns for that row |

Each **cell** is the points that juror gave **to that country** (blank = 0). The importer inverts columns into per-juror Eurovision ballots.

Example: [`data/legacy/example-2024.tsv`](../data/legacy/example-2024.tsv)

## Validation

- Country names map to the app catalog (leading `01` prefixes stripped).
- Each juror must assign exactly ten countries using `1, 2, 3, 4, 5, 6, 7, 8, 10, 12` once each.
- Optional `TOTAL SCORE` cross-check (warn by default; enable **strict** to reject mismatches).

## Idempotency

One import per **year** is tracked in `app_meta` (`legacy-import:2024`). Re-import the same year with **overwrite** to replace the previous finished party.

## Admin UI

1. Sign in as site admin.
2. Open **Import** in the header → `/admin/legacy-import`.
3. Paste TSV, set year/title, **Preview**, then **Import finished party**.

## CLI

Wipe all test parties first (cascades entries, jurors, votes, results):

```bash
pnpm db:wipe-parties
```

Preview:

```bash
pnpm import:legacy -- --file data/legacy/example-2024.tsv --year 2024 --preview
```

Import:

```bash
pnpm import:legacy -- --file data/legacy/your-night.tsv --year 2024 --overwrite
```

Optional flags:

- `--title "Eurovision 2024 Grand Final"`
- `--finished-at 2024-05-11T20:00:00.000Z`
- `--strict-totals` — reject TOTAL SCORE mismatches
- `--overwrite` — replace existing import for that year

## Docker production database

Local wipe only clears `data/app.db`. For production:

```bash
docker compose exec app pnpm db:wipe-parties
```

(or run the wipe script with `DATABASE_PATH` pointing at the mounted volume)

## UTF-8

Save/export spreadsheets as UTF-8 so juror names like `Jö` import correctly.
