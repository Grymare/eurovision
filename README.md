# Grymare Eurovision

Eurovision-style voting parties for you and your friends. Public home: **https://eurovision.grymare.com** (Cloudflare Tunnel from your PC; domain on Cloudflare).

## Stack

- Next.js 16 (App Router) + TypeScript
- Socket.io (custom Node server)
- SQLite + Drizzle ORM (WAL mode)
- Tailwind CSS
- Docker Compose + Cloudflare Tunnel

## Prerequisites

- Node.js 22+
- pnpm (via `corepack enable`)
- Docker Desktop (for production-like runs)
- [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/downloads/) (for public hosting)

## Development

```bash
pnpm install
pnpm db:push
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The health page verifies:

- SQLite database at `data/app.db`
- `/api/health` API route
- Socket.io connection at `/api/socket`

Copy [`.env.example`](.env.example) to `.env.local` for local overrides.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Custom server with Next.js + Socket.io |
| `pnpm build` | Production Next.js build |
| `pnpm start` | Run production server |
| `pnpm lint` | ESLint (includes jsx-a11y) |
| `pnpm db:push` | Apply Drizzle schema to SQLite (local dev) |
| `pnpm db:migrate` | Run SQL migrations (matches Docker startup) |
| `pnpm db:generate` | Generate SQL migrations |

## Public hosting (primary)

Host from your Windows PC via Cloudflare Tunnel — no router port forwarding, free HTTPS.

1. **One-time:** Create a Cloudflare Tunnel for `eurovision.grymare.com` → `localhost:3000`  
   Full guide: [docs/deploy/cloudflare-tunnel.md](docs/deploy/cloudflare-tunnel.md)
2. **Party night:**
   ```bash
   git pull
   docker compose up --build -d
   ```
3. Ensure `cloudflared` connector is running; sign in as admin to host, share join links from the lobby.

Copy [`.env.example`](.env.example) to `.env.local` for auth and admin settings (Docker loads it automatically). See [docs/auth.md](docs/auth.md).

Config template: [deploy/cloudflared/config.yml.example](deploy/cloudflared/config.yml.example)

## Docker

```bash
docker compose up --build
```

Data persists in the `app-data` volume. The app binds `0.0.0.0:3000` for the tunnel to reach.

## LAN fallback

If the tunnel or internet is unavailable, friends on the **same Wi‑Fi** can use:

```text
http://<your-pc-lan-ip>:3000
```

Find your IP: `ipconfig` (Windows). Allow port 3000 through the firewall if needed.

## Project management

- Kanban board: [docs/kanban.md](docs/kanban.md)
- Ticket specs: [docs/tickets/](docs/tickets/)
- Deploy guide: [docs/deploy/cloudflare-tunnel.md](docs/deploy/cloudflare-tunnel.md)
- Smoke test: [docs/deploy/smoke-test-checklist.md](docs/deploy/smoke-test-checklist.md)

GitHub CLI (`gh`) is not required locally. To mirror tickets in GitHub Issues + Projects, create a repo and import titles from `docs/tickets/`.

## Build order

See `docs/kanban.md` for the full backlog. **Phase 2** (auth, history, stats) is complete. **Phase 3** is next: Pi guide, rate limiting, responsive polish.
