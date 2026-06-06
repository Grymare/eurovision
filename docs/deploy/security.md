# Security & rate limits (EUP-034)

Public hosting via Cloudflare Tunnel exposes the app to the internet. This doc covers **app-level limits** (no IP-based throttling — guests often share Wi‑Fi) and **Cloudflare edge** hardening.

## Party code entropy

Party codes are **6 characters** from a 32-character alphabet (no ambiguous `0/O`, `1/I`). That is roughly **1 billion** combinations — impractical to guess during a single evening. Codes are still **secret links**; share join URLs only with invited jurors.

## App-level rate limits

Implemented in [`src/lib/http/rate-limit.ts`](../../src/lib/http/rate-limit.ts). Limits are keyed by **party code** or **participant session**, not client IP.

| Endpoint | Key | Limit | Window |
|----------|-----|-------|--------|
| `POST /api/parties/join` | Party code | 40 requests | 10 minutes |
| `PUT /api/parties/:code/vote` | Participant session token | 30 requests | 10 minutes |
| `POST /api/auth/forgot-password` | Email address | 3 requests | 1 hour |

Exceeded limits return **429** with code `RATE_LIMITED`. Legitimate parties (many jurors joining at once, editing ballots) stay well under these caps.

Limits are **in-memory per app process** — sufficient for single-container Docker on PC/Pi. If you scale to multiple replicas, replace with a shared store (Redis).

## Cloudflare bot protection

Recommended in [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) or the zone dashboard for **grymare.com**:

1. **Security** → **Bots** — enable **Bot Fight Mode** (free) or **Super Bot Fight Mode** (paid) for `eurovision.grymare.com`.
2. **Security** → **WAF** — optional managed rules for obvious abuse (keep rules loose so mobile guests are not blocked).
3. **SSL/TLS** — **Full (strict)** when origin serves HTTPS; with Tunnel, Cloudflare terminates TLS at the edge.

Do **not** rely on IP rate limiting for join/vote at the edge — same-network jurors share one public IP.

## Auth & admin surface

- Party creation is **admin-only** (`ADMIN_EMAILS`). See [auth.md](../auth.md).
- Dev-only routes (`/api/parties/dev-*`) return errors when `NODE_ENV=production`.
- Vote points stay hidden until presentation (see vote secrecy module).

## Reporting issues

For a private party app, abuse is unlikely. If you see sustained 429s or scanner traffic, tighten Cloudflare WAF and rotate `AUTH_SECRET` if credentials may have leaked.
