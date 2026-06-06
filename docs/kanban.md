# Kanban board

GitHub Projects-style board for Grymare Eurovision. Columns: **Backlog** → **Ready** → **In Progress** → **Review** → **Done**.

Labels: `mvp`, `phase-2`, `phase-3`, `infra`, `feature`, `chore`, `deferred`

## Done

| ID | Title | Labels |
|----|-------|--------|
| [EUP-001](tickets/EUP-001.md) | Project scaffold | `mvp`, `infra` |
| [EUP-002](tickets/EUP-002.md) | Database schema | `mvp`, `infra` |
| [EUP-003](tickets/EUP-003.md) | Country entry picker (custom) | `mvp`, `feature` |
| [EUP-004](tickets/EUP-004.md) | Party create & join | `mvp`, `feature` |
| [EUP-006](tickets/EUP-006.md) | Party lobby & host dashboard | `mvp`, `feature` |
| [EUP-006D](tickets/EUP-006D.md) | Design brainstorming session | `mvp`, `chore` |
| [EUP-007](tickets/EUP-007.md) | Classic 12-point vote UI | `mvp`, `feature` |
| [EUP-008](tickets/EUP-008.md) | Vote storage & secrecy | `mvp`, `feature` |
| [EUP-009](tickets/EUP-009.md) | Real-time voting status | `mvp`, `feature` |
| [EUP-010](tickets/EUP-010.md) | Host voting controls | `mvp`, `feature` |
| [EUP-011](tickets/EUP-011.md) | Score aggregation service | `mvp`, `feature` |
| [EUP-012](tickets/EUP-012.md) | Presentation — ceremony mode (superseded) | `mvp`, `feature` |
| [EUP-013](tickets/EUP-013.md) | Ceremony state machine v2 + host API | `mvp`, `feature` |
| [EUP-014](tickets/EUP-014.md) | Jury intro + 1–10 reveals + reorder | `mvp`, `feature` |
| [EUP-015](tickets/EUP-015.md) | 12-point reveal + winner finale | `mvp`, `feature` |
| [EUP-016](tickets/EUP-016.md) | Docker + Cloudflare Tunnel (PC) | `mvp`, `infra` |
| [EUP-017](tickets/EUP-017.md) | MVP smoke test checklist | `mvp`, `chore` |
| [EUP-018](tickets/EUP-018.md) | Host-only presentation page | `mvp`, `feature` |
| [EUP-019](tickets/EUP-019.md) | Eurovision dual-column scoreboard | `mvp`, `feature` |
| [EUP-007A](tickets/EUP-007A.md) | Responsive layout foundation | `mvp`, `feature` |
| [EUP-007B](tickets/EUP-007B.md) | WCAG 2.2 AA baseline | `mvp`, `feature` |
| [EUP-005](tickets/EUP-005.md) | Optional account auth | `phase-2`, `feature` |
| [EUP-029](tickets/EUP-029.md) | Admin-only party creation | `phase-2`, `feature` |
| [EUP-020](tickets/EUP-020.md) | Eurovision year JSON datasets | `phase-2`, `chore` |
| [EUP-021](tickets/EUP-021.md) | Import party from year | `phase-2`, `feature` |
| [EUP-024](tickets/EUP-024.md) | Party history list | `phase-2`, `feature` |
| [EUP-025](tickets/EUP-025.md) | Party detail replay | `phase-2`, `feature` |
| [EUP-026](tickets/EUP-026.md) | Cross-party stats | `phase-2`, `feature` |
| [EUP-034](tickets/EUP-034.md) | Rate limiting & basic security | `phase-3`, `feature` |
| [EUP-041](tickets/EUP-041.md) | Forgotten password reset | `phase-3`, `feature` |
| [EUP-038](tickets/EUP-038.md) | Current-year quick entry tool | `phase-3`, `feature` |
| [EUP-035](tickets/EUP-035.md) | Advanced responsive polish | `phase-3`, `feature` |
| [EUP-044](tickets/EUP-044.md) | Searchable country combobox in ballot | `phase-3`, `feature` |
| [EUP-046](tickets/EUP-046.md) | Pre-vote ranking & favorite finders | `phase-3`, `feature` |
| [EUP-043](tickets/EUP-043.md) | Import legacy party results | `phase-3`, `feature`, `chore` |

## Review

*(empty)*

## In Progress

*(empty)*

## Ready

*(empty)*

### Phase 3 (backlog)

| ID | Title | Labels |
|----|-------|--------|
| [EUP-042](tickets/EUP-042.md) | Claim guest history after sign-up | `phase-3`, `feature` |

### Phase 3 (deferred)

| ID | Title | Labels |
|----|-------|--------|
| [EUP-030](tickets/EUP-030.md) | Raspberry Pi deployment guide | `phase-3`, `infra`, `deferred` |

## Won't do (for now)

Not planned for the foreseeable future. Specs kept for reference.

| ID | Title | Notes |
|----|-------|-------|
| [EUP-022](tickets/EUP-022.md) | Auto-reveal presentation mode | Manual host clicks are enough |
| [EUP-023](tickets/EUP-023.md) | Custom reveal order | Random jury order is enough |
| [EUP-036](tickets/EUP-036.md) | YouTube performance links | Media skipped |
| [EUP-037](tickets/EUP-037.md) | Embedded media player | Media skipped |
| [EUP-039](tickets/EUP-039.md) | Export results | Use in-app replay instead |
| [EUP-040](tickets/EUP-040.md) | Jury profile avatars | Nicknames sufficient |
| [EUP-045](tickets/EUP-045.md) | Presentation viewport fit | Compact fit reverted — scroll OK |

## Build order (MVP)

EUP-001 → EUP-002 → EUP-003 → EUP-004 → EUP-006 → EUP-006D → EUP-007A/EUP-007B → EUP-007 → EUP-008 → EUP-009 → EUP-010 → EUP-011 → EUP-012 → EUP-018 → EUP-019 → EUP-013 → EUP-014 → EUP-015 → EUP-016 → EUP-017

## Removed from backlog

| ID | Reason |
|----|--------|
| EUP-027 | Absorbed into EUP-005 (account linking) |
| EUP-028 | Spectator mode — out of scope; everyone who joins is a voter |
| EUP-032 | Cloudflare Tunnel — delivered as part of EUP-016 |
| EUP-033 | DNS subdomain — delivered as part of EUP-016 |
| EUP-031 | Caddy reverse proxy + HTTPS — not needed; public access via Cloudflare Tunnel (EUP-016) |
