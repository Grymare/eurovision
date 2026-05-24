# Cloudflare Tunnel hosting (Windows PC)

Host Grymare Eurovision at **https://eurovision.grymare.com** from your PC using Docker + [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/). Friends can join from anywhere; no router port forwarding required.

## Architecture

```text
Guest browsers  →  Cloudflare edge (HTTPS)  →  cloudflared (PC)  →  Docker app :3000  →  SQLite volume
```

Socket.io uses same-origin `/api/socket` and works through Cloudflare Tunnel WebSockets.

## Prerequisites

- Domain **grymare.com** on Cloudflare (DNS managed by Cloudflare)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) on Windows
- [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/downloads/) installed on Windows

## One-time Cloudflare setup

### New tunnel (dashboard-managed)

1. Open [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) → **Networks** → **Tunnels**.
2. **Create a tunnel** → choose **Cloudflared** → name it `grymare-eurovision`.
3. Copy the install command / connector token (Cloudflare shows a `cloudflared service install …` or login step).
4. Add a **Public Hostname**:
   - **Subdomain:** `eurovision`
   - **Domain:** `grymare.com`
   - **Service type:** HTTP
   - **URL:** `localhost:3000`
5. Save. Cloudflare creates a proxied DNS record for `eurovision.grymare.com` (orange cloud).

### Existing locally-managed tunnel (recommended if you already run `cloudflared`)

If you already have a tunnel configured via `%USERPROFILE%\.cloudflared\config.yml` (e.g. `summarize.grymare.com`), **add a second ingress rule** instead of creating a new tunnel:

```yaml
ingress:
  - hostname: summarize.grymare.com
    service: http://localhost:5678
  - hostname: eurovision.grymare.com
    service: http://localhost:3000
  - service: http_status:404
```

Then create DNS for the new hostname (once):

```powershell
cloudflared tunnel route dns <TUNNEL_UUID> eurovision.grymare.com
```

Restart the Cloudflared Windows service (Admin PowerShell):

```powershell
Restart-Service Cloudflared
```

Only one `cloudflared` service is needed — it can route multiple hostnames to different local ports.

Optional: copy [`deploy/cloudflared/config.yml.example`](../../deploy/cloudflared/config.yml.example) to a local path outside the repo, fill in your tunnel UUID and credentials path, and run the tunnel from that file.

## Install cloudflared on Windows

**Option A — winget (recommended):**

```powershell
winget install Cloudflare.cloudflared
```

**Option B — MSI** from the [Cloudflare downloads page](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/downloads/).

After install, verify:

```powershell
cloudflared --version
```

Run the connector using the command from the Cloudflare dashboard (typically installs a Windows service), or run manually:

```powershell
cloudflared tunnel run grymare-eurovision
```

## Run the app

From the project root:

```powershell
git pull
docker compose up --build -d
```

The app listens on `http://localhost:3000`. The tunnel forwards `https://eurovision.grymare.com` to that port.

Data persists in the Docker volume `app-data` (SQLite at `/app/data/app.db` inside the container). On startup the container runs **Drizzle migrations** automatically (auth tables, etc.).

### Phase 2 environment (required for auth)

Copy [`.env.example`](../.env.example) to `.env.local` in the project root (gitignored). Docker Compose loads it via `env_file`. Set at minimum:

| Variable | Purpose |
|----------|---------|
| `AUTH_SECRET` | Session signing — generate per `.env.example` |
| `AUTH_URL` | `https://eurovision.grymare.com` |
| `PUBLIC_APP_URL` | Same — used for join links |
| `ADMIN_EMAILS` | Comma-separated admin emails (party creation) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Optional Google sign-in |

Add the Google OAuth redirect URI in Google Cloud Console:

```text
https://eurovision.grymare.com/api/auth/callback/google
```

After changing `.env.local`, rebuild: `docker compose up --build -d`

## Verify

1. Open **https://eurovision.grymare.com** — home page loads over HTTPS.
2. Open **https://eurovision.grymare.com/api/health** — JSON health check.
3. On the health page, confirm **Socket.io** shows connected and responds to ping.
4. From a phone on **cellular** (not your Wi‑Fi), open a join link — confirms public access.
5. Create a party, join as guest, submit a vote — confirm live lobby updates without refresh.

## Party-night workflow

1. Disable PC sleep for the evening (Settings → System → Power).
2. Pull latest and start Docker: `git pull` then `docker compose up --build -d`
3. Ensure the tunnel connector is running (service or manual `cloudflared tunnel run …`).
4. Sign in as admin if hosting; share join links from the lobby.
5. When finished, stop Docker (`docker compose down`) and optionally stop the tunnel service.

You do **not** need 24/7 uptime unless you want the site always available.

## Troubleshooting

| Problem | What to try |
|---------|-------------|
| Site unreachable | Tunnel connector running? Docker running? `docker ps` shows port 3000? |
| Service already installed | Use existing locally-managed tunnel — add ingress in `%USERPROFILE%\.cloudflared\config.yml` instead of `service install` |
| 502 / error page | App not ready yet — wait for build, check `docker compose logs` |
| Socket.io disconnected | Refresh page; confirm WebSocket works on health page; restart tunnel + app |
| Session lost after login | App must run with `NODE_ENV=production` in Docker (secure cookies require HTTPS) |
| Dev buttons missing | Expected — dev fixtures only run when `NODE_ENV=development` |

## LAN fallback

If the tunnel or internet fails during a party, friends on the **same Wi‑Fi** can use:

```text
http://<your-pc-lan-ip>:3000
```

Find your IP: `ipconfig` → IPv4 address. Allow port 3000 through Windows Firewall if prompted.

## Raspberry Pi (later)

Same steps on Pi:

1. Copy the repo / Docker image to the Pi.
2. `docker compose up --build`
3. Run `cloudflared` on the Pi (move the tunnel connector from PC to Pi in Cloudflare, or create a new connector on Pi).

See **EUP-030** (Phase 3) for a dedicated Pi guide.

## Environment variables

See [`.env.example`](../../.env.example). Docker Compose sets production defaults; override in `docker-compose.yml` if needed.
