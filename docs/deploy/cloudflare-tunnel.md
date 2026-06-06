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

Restart the tunnel connector (see **Keep cloudflared running on Windows** below).

Only one `cloudflared` process is needed — it can route multiple hostnames to different local ports.

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

Run the connector manually for a quick test:

```powershell
cloudflared tunnel run 68dc4207-a2dd-4f32-8906-19d2c658c6b5
```

Closing that terminal stops the tunnel. For party hosting, use the scheduled task below instead.

## Keep cloudflared running on Windows

The Cloudflared **Windows service** (`cloudflared service install`) often fails to connect on this setup: the service runs without your user config, and `C:\Program Files (x86)\cloudflared\config.yml` gets reset to a stub file.

**Recommended:** a Scheduled Task that runs a small restart wrapper at logon and startup.

1. Ensure `%USERPROFILE%\.cloudflared\config.yml` has your tunnel ID, credentials path, and ingress rules (see above).
2. From the project root, register the task:

```powershell
.\deploy\register-cloudflared-task.ps1
Start-ScheduledTask -TaskName "Grymare-Cloudflared"
```

The task uses a hidden launcher (`wscript.exe` + VBS) so **no console window** opens. Do not point the task directly at `cloudflared.exe` — that pops a terminal.

3. Verify an active connector:

```powershell
cloudflared tunnel info 68dc4207-a2dd-4f32-8906-19d2c658c6b5
```

You should see at least one row under **CONNECTOR ID**. Logs: `%USERPROFILE%\.cloudflared\tunnel.log`.

If the site shows Cloudflare Error 1033 (“no active connection”), the tunnel process is not running — start the task again with `Start-ScheduledTask -TaskName "Grymare-Cloudflared"`.

To disable the broken Windows service (Admin PowerShell, one-time):

```powershell
Set-Service Cloudflared -StartupType Disabled
Stop-Service Cloudflared -ErrorAction SilentlyContinue
```

## Run the app

From the project root:

```powershell
git pull
docker compose up --build -d
```

The app listens on `http://localhost:3000`. The tunnel forwards `https://eurovision.grymare.com` to that port.

Data persists in Docker volumes:

| Volume | Mount | Purpose |
|--------|-------|---------|
| `app-data` | `/app/data` | SQLite database |
| `eurovision-datasets-data` | `/app/eurovision-datasets` | Eurovision year JSON catalogs (admin-editable via `/admin/datasets`) |

On first run, year datasets are copied from the image seed into `eurovision-datasets-data`. Updating datasets in the admin UI does **not** require `docker compose up --build`.

### Phase 2 environment (required for auth)

Copy [`.env.example`](../.env.example) to `.env.local` in the project root (gitignored). Docker Compose loads it via `env_file`. Set at minimum:

| Variable | Purpose |
|----------|---------|
| `AUTH_SECRET` | Session signing — generate per `.env.example` |
| `AUTH_URL` | `https://eurovision.grymare.com` |
| `PUBLIC_APP_URL` | Same — used for join links |
| `ADMIN_EMAILS` | Comma-separated admin emails (party creation) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Optional Google sign-in |
| `EMAIL_SERVER` / `EMAIL_FROM` | Optional SMTP — enables **magic link** and **password reset** on login |

**Magic link** and **forgot password** stay hidden until both `EMAIL_SERVER` and `EMAIL_FROM` are set. Docker loads `.env.local` via `env_file`.

Example ([Resend](https://resend.com) SMTP — verify `grymare.com` in Resend first):

```env
EMAIL_SERVER=smtp://resend:re_YOUR_API_KEY@smtp.resend.com:587
EMAIL_FROM=Grymare Eurovision <noreply@grymare.com>
```

SendGrid / Mailgun use the same pattern: provider SMTP host, username, and password/API key in `EMAIL_SERVER`, verified sender in `EMAIL_FROM`. URL-encode special characters in the password if needed.

Add the Google OAuth redirect URI in Google Cloud Console:

```text
https://eurovision.grymare.com/api/auth/callback/google
```

After changing `.env.local`, restart: `docker compose up -d` (add `--build` only when app code changed).

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
| Site unreachable / Error 1033 | Run `cloudflared tunnel info <TUNNEL_ID>` — need an active connector. Start task: `Start-ScheduledTask -TaskName "Grymare-Cloudflared"`. Check `%USERPROFILE%\.cloudflared\tunnel.log` |
| Tunnel drops after closing terminal | Expected for manual `cloudflared tunnel run`. Use the scheduled task (`register-cloudflared-task.ps1`) so it survives logoff |
| Task opens a console window | Re-run `register-cloudflared-task.ps1` — task must use `wscript.exe` + VBS, not `cloudflared.exe` directly |
| Service already installed | Disable the Cloudflared Windows service; use locally-managed config in `%USERPROFILE%\.cloudflared\config.yml` + scheduled task |
| Docker running? | `docker ps` shows port 3000 mapped |
| 502 / error page | App not ready yet — wait for build, check `docker compose logs` |
| Socket.io disconnected | Refresh page; confirm WebSocket works on health page; restart tunnel + app |
| Session lost after login | App must run with `NODE_ENV=production` in Docker (secure cookies require HTTPS) |
| Dev buttons missing | Expected — dev fixtures only run when `NODE_ENV=development` |

See also [security.md](security.md) for rate limits and Cloudflare bot protection.

## LAN fallback

If the tunnel or internet fails during a party, friends on the **same Wi‑Fi** can use:

```text
http://<your-pc-lan-ip>:3000
```

Find your IP: `ipconfig` → IPv4 address. Allow port 3000 through Windows Firewall if prompted.

## Raspberry Pi (later)

Same Docker + Cloudflare Tunnel pattern on Pi OS. See [docs/deploy/raspberry-pi.md](raspberry-pi.md).

## Environment variables

See [`.env.example`](../../.env.example). Docker Compose sets production defaults; override in `docker-compose.yml` if needed.
