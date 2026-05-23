# MVP smoke test checklist (EUP-017)

Run this after Cloudflare Tunnel hosting is configured. Test at **https://eurovision.grymare.com** unless noted.

## Setup

- [ ] Docker app running (`docker compose up --build`)
- [ ] Cloudflare tunnel connector running
- [ ] Health page loads; Socket.io status connected
- [ ] At least **two devices** available (host PC + phone on cellular recommended)

## Host flow

- [ ] Create party (or use dev quick-start on localhost only)
- [ ] Add **5+ countries** (or seed mock entries in dev)
- [ ] Open lobby; copy join link shows `https://eurovision.grymare.com/join/...`
- [ ] Open lobby for guests
- [ ] **Host submits own ballot** (host is a voter)
- [ ] Open voting; guests receive live update without refresh
- [ ] All guests submit votes; lobby shows who has voted in real time
- [ ] Close voting
- [ ] Open presentation page (host only)
- [ ] Run full ceremony: jury intro → 1–10 reveals → 12 points → next jury → winner overlay
- [ ] Finish party; guests see final scoreboard state

## Guest flow

- [ ] Join with party code + nickname
- [ ] **Edit my vote** before close — change allocation, resubmit
- [ ] Vote locked after host closes voting
- [ ] Live status updates without page refresh (Socket.io)

## Presentation

- [ ] Dual-column scoreboard at 0 points on open
- [ ] Round points visible until next jury
- [ ] Scoreboard reorders once after all 1–10 points (not per point)
- [ ] 12-point gold animation plays
- [ ] Winner overlay on last jury; dismiss with close control
- [ ] **Random jury order** differs between two separate party runs

## Mobile & layout

- [ ] Join + vote usable on **320px** width (phone portrait)
- [ ] Presentation readable on tablet / wide screen
- [ ] No horizontal scroll on core pages at 320px

## Accessibility spot-check

- [ ] Keyboard: tab through home → join → ballot primary actions
- [ ] Visible focus on buttons and form controls
- [ ] Skip link present (if implemented in layout)
- [ ] Run axe DevTools on home, lobby, ballot — no critical violations (see [accessibility.md](../accessibility.md))

## Security / production

- [ ] Dev mock endpoints **not** available on production URL (`/api/parties/dev-*` returns error)
- [ ] Vote points **not** visible to guests before presentation commit
- [ ] Presentation API rejects non-host session

## Sign-off

| Date | Tester | Result | Notes |
|------|--------|--------|-------|
| | | Pass / Fail | |
