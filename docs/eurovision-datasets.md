# Eurovision year datasets (EUP-020)

Year files live in [`data/eurovision/`](../data/eurovision/). **v1 ships the current year only** (`2026.json`).

## JSON schema

```json
{
  "year": 2026,
  "label": "Eurovision 2026 Grand Final (Vienna)",
  "hostCity": "Vienna",
  "source": "manual",
  "entries": [
    { "name": "Albania", "flagEmoji": "🇦🇱" }
  ]
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `year` | yes | Must match the filename (`{year}.json`) |
| `label` | yes | Shown in the import UI |
| `hostCity` | no | Display only |
| `source` | no | `"manual"` (default) or `"api"` when synced from an ESC API |
| `entries` | yes | At least one country |
| `entries[].name` | yes | Party display name |
| `entries[].flagEmoji` | yes | Unicode flag emoji |

## Source strategy

1. **Try a public ESC API** when we add sync tooling (not in v1 runtime path).
2. **Fall back to hand-maintained JSON** in `data/eurovision/` (current approach).

Loader: [`src/lib/eurovision/datasets.ts`](../src/lib/eurovision/datasets.ts)

## API

- `GET /api/eurovision/years` — list available datasets
- `POST /api/parties/:code/entries/import-year` — host imports `{ "year": 2026 }` into a party (see EUP-021)

Historical years are deferred until needed.
