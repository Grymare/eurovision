# Grymare Eurovision

LAN-first Eurovision-style voting parties for you and your friends. Future home: `eurovision.grymare.com` (Cloudflare).

## Stack

- Next.js 16 (App Router) + TypeScript
- Socket.io (custom Node server)
- SQLite + Drizzle ORM (WAL mode)
- Tailwind CSS
- Docker Compose

## Prerequisites

- Node.js 22+
- pnpm (via `corepack enable`)
- Docker Desktop (optional, for container runs)

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

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Custom server with Next.js + Socket.io |
| `pnpm build` | Production Next.js build |
| `pnpm start` | Run production server |
| `pnpm lint` | ESLint (includes jsx-a11y) |
| `pnpm db:push` | Apply Drizzle schema to SQLite |
| `pnpm db:generate` | Generate SQL migrations |

## LAN access (Windows)

1. Run `pnpm dev` or `docker compose up --build`
2. Find your PC LAN IP: `ipconfig`
3. Friends on the same Wi-Fi open `http://<your-ip>:3000`

## Docker

```bash
docker compose up --build
```

Data persists in the `app-data` volume.

## Project management

- Kanban board: [docs/kanban.md](docs/kanban.md)
- Ticket specs: [docs/tickets/](docs/tickets/)

GitHub CLI (`gh`) is not required locally. To mirror tickets in GitHub Issues + Projects, create a repo and import titles from `docs/tickets/`.

## MVP build order

See `docs/kanban.md` for the full backlog. Next up: **EUP-002 — Database schema** for parties, participants, votes, and results.
