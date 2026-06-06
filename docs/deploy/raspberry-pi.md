# Raspberry Pi deployment (EUP-030)

Run Grymare Eurovision on a **Raspberry Pi** with the same stack as the Windows PC: **Pi OS + Docker Compose + Cloudflare Tunnel**. No router port forwarding required.

## Architecture

```text
Guest browsers  →  Cloudflare edge (HTTPS)  →  cloudflared (Pi)  →  Docker app :3000  →  SQLite volume
```

Move the tunnel connector from your PC to the Pi when you want 24/7 hosting without keeping a desktop on.

## Hardware notes

| Pi model | RAM | Party hosting |
|----------|-----|----------------|
| Pi 4 / 5 (2 GB+) | 2–8 GB | Fine for typical jury sizes (≤20 guests) |
| Pi 3 / older | 1 GB | Possible for small parties; prefer Pi 4+ |

SQLite + one Node process is light. The main limits are RAM during `docker compose build` (use a PC to build/push the image, or increase swap) and SD card wear — use a **USB SSD** boot media for production if the Pi runs often.

## Prerequisites

- [Raspberry Pi OS](https://www.raspberrypi.com/software/) (64-bit recommended)
- Domain **grymare.com** on Cloudflare (same as PC setup)
- SSH or keyboard/monitor access to the Pi

## 1. Install Docker on Pi OS

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

Log out and back in so the `docker` group applies.

Optional: [Docker Compose](https://docs.docker.com/compose/install/linux/) is included with modern Docker installs (`docker compose`).

## 2. Clone the repo

```bash
git clone https://github.com/Grymare/eurovision.git
cd eurovision
```

## 3. Environment

Copy [`.env.example`](../../.env.example) to `.env.local` on the Pi (gitignored). Set at minimum:

| Variable | Example |
|----------|---------|
| `AUTH_SECRET` | Random secret (generate per `.env.example`) |
| `AUTH_URL` | `https://eurovision.grymare.com` |
| `PUBLIC_APP_URL` | `https://eurovision.grymare.com` |
| `ADMIN_EMAILS` | Your admin email |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Optional Google sign-in |

`docker-compose.yml` already overrides `AUTH_URL` and `PUBLIC_APP_URL` for production hosting.

## 4. Start the app

```bash
docker compose up --build -d
docker compose logs -f
```

Verify locally on the Pi:

```bash
curl -s http://localhost:3000/api/health
```

Data persists in the Docker volume `app-data` (SQLite at `/app/data/app.db` inside the container).

## 5. Cloudflare Tunnel on the Pi

Use the **same tunnel** as your PC, or create a dedicated connector on the Pi.

### Option A — Move connector from PC to Pi

1. Stop cloudflared on the PC (scheduled task or manual process).
2. Copy `%USERPROFILE%\.cloudflared\` (Windows) or `~/.cloudflared/` (Pi) — `config.yml` and `<TUNNEL_UUID>.json` credentials.
3. Install cloudflared on Pi:

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
```

Use `cloudflared-linux-arm` for 32-bit Pi OS.

4. Example `~/.cloudflared/config.yml`:

```yaml
tunnel: <TUNNEL_UUID>
credentials-file: /home/pi/.cloudflared/<TUNNEL_UUID>.json

ingress:
  - hostname: eurovision.grymare.com
    service: http://localhost:3000
  - service: http_status:404
```

5. Run the connector (test):

```bash
cloudflared tunnel run <TUNNEL_UUID>
```

6. For boot persistence, use a **systemd user service** (Linux equivalent of the Windows scheduled task). Example unit `~/.config/systemd/user/cloudflared-eurovision.service`:

```ini
[Unit]
Description=Cloudflare Tunnel for Grymare Eurovision
After=network-online.target

[Service]
ExecStart=/usr/local/bin/cloudflared tunnel run <TUNNEL_UUID>
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
```

```bash
systemctl --user enable --now cloudflared-eurovision.service
loginctl enable-linger $USER
```

### Option B — Keep PC tunnel, Pi on LAN only

Friends on the same Wi‑Fi can use `http://<pi-ip>:3000`. Allow port 3000 through the Pi firewall if needed. Public internet still goes through Cloudflare on the PC.

See [cloudflare-tunnel.md](cloudflare-tunnel.md) for Windows tunnel details.

## 6. Verify public access

1. Open **https://eurovision.grymare.com/api/health**
2. Sign in as admin, create a party, join from a phone on cellular
3. Run the [Phase 2 smoke checklist](smoke-test-checklist.md)

## Updates

```bash
cd eurovision
git pull
docker compose up --build -d
```

## Troubleshooting

| Problem | What to try |
|---------|-------------|
| Build runs out of memory | Build on PC, `docker save` / `docker load`, or add swap on Pi |
| Tunnel not connecting | `cloudflared tunnel info <TUNNEL_UUID>` — active connector on Pi? |
| Slow first load | Normal on Pi; keep Docker image warm before party night |
| Database locked | Only one app container; do not mount `app.db` from two hosts |

## Related docs

- [Cloudflare Tunnel (Windows PC)](cloudflare-tunnel.md)
- [Security & rate limits](security.md)
- [Auth setup](../auth.md)
