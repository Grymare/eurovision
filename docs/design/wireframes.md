# Wireframes — MVP screens

ASCII wireframes for implementation reference. Visual styling follows [design-system.md](./design-system.md).

## Home

```
┌─────────────────────────────────────┐
│  GRYMARE EUROVISION                 │
│  Host a Eurovision-style party      │
├──────────────────┬──────────────────┤
│  HOST A PARTY    │  JOIN A PARTY    │
│  [nickname    ]   │  [code        ]  │
│  [title opt   ]   │  [nickname    ]  │
│  [ Create ]      │  [ Join ]        │
└──────────────────┴──────────────────┘
```

## Host dashboard (party lobby)

```
┌─────────────────────────────────────┐
│  Party: Saturday Night ESC            │
│  CODE: ABC123        [ Copy link ]    │
│  Status: Lobby open                   │
├─────────────────────────────────────┤
│  HOST CONTROLS                        │
│  [ Open lobby ] [ Start voting ]      │
├─────────────────────────────────────┤
│  COUNTRIES (5 min)          7 / 5   │
│  🇸🇪 Sweden              [ Remove ] │
│  🇳🇴 Norway              [ Remove ] │
│  [ name ] [ flag ] [ Add country ]  │
├─────────────────────────────────────┤
│  PARTICIPANTS          (live list)  │
│  Grymare (host)      Not voted yet    │
│  Anna                Voted ✓          │
└─────────────────────────────────────┘
```

## Vote UI (EUP-007)

```
┌─────────────────────────────────────┐
│  Your ballot — 12-point vote        │
│  Assign each value to one country   │
├─────────────────────────────────────┤
│  12 pts  [ Select country ▼ ]       │
│  10 pts  [ Select country ▼ ]       │
│   … (1–8)                           │
├─────────────────────────────────────┤
│  [ Review & submit ]                │
│  [ Edit my vote ]  (after submit)   │
└─────────────────────────────────────┘
```

## Waiting (after vote submitted)

```
┌─────────────────────────────────────┐
│  Vote received!                     │
│  Waiting for other jurors…          │
├─────────────────────────────────────┤
│  WHO HAS VOTED (live)               │
│  ✓ Anna   ✓ Bob   · Clara           │
│  ✓ You (Grymare)                    │
└─────────────────────────────────────┘
```

## Presentation — ceremony (fullscreen)

```
┌─────────────────────────────────────┐
│ ░░░░░░░ dark stage ░░░░░░░░░░░░░░░  │
│                                     │
│         ANNA GIVES                  │
│                                     │
│    🇸🇪 SWEDEN — 12 POINTS           │
│         ✦ (optional sparkles)       │
│                                     │
│  [ host: Next ]   Running total →   │
└─────────────────────────────────────┘
```

## Presentation — final scoreboard (fullscreen)

```
┌─────────────────────────────────────┐
│         FINAL SCOREBOARD            │
│  1. 🇸🇪 Sweden           42 pts     │
│  2. 🇳🇴 Norway           38 pts     │
│  3. 🇫🇮 Finland          31 pts     │
│  …                                  │
│         WINNER: SWEDEN              │
└─────────────────────────────────────┘
```

## Route map

| Screen | Route |
|--------|-------|
| Home | `/` |
| Join | `/join/[code]` |
| Lobby | `/party/[partyId]` |
| Vote | `/party/[partyId]/vote` |
| Presentation | `/party/[partyId]/present` |
