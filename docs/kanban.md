# Kanban board

GitHub Projects-style board for Grymare Eurovision. Columns: **Backlog** → **Ready** → **In Progress** → **Review** → **Done**.

Labels: `mvp`, `phase-2`, `phase-3`, `infra`, `feature`, `chore`

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

## Review

*(empty)*

## In Progress

*(empty)*

## Ready

| ID | Title | Labels |
|----|-------|--------|
| [EUP-007A](tickets/EUP-007A.md) | Responsive layout foundation | `mvp`, `feature` |
| [EUP-007B](tickets/EUP-007B.md) | WCAG 2.2 AA baseline | `mvp`, `feature` |
| [EUP-008](tickets/EUP-008.md) | Vote storage & secrecy | `mvp`, `feature` |
| [EUP-009](tickets/EUP-009.md) | Real-time voting status | `mvp`, `feature` |
| [EUP-010](tickets/EUP-010.md) | Host voting controls | `mvp`, `feature` |
| [EUP-011](tickets/EUP-011.md) | Score aggregation service | `mvp`, `feature` |
| [EUP-012](tickets/EUP-012.md) | Presentation — ceremony mode | `mvp`, `feature` |
| [EUP-013](tickets/EUP-013.md) | Presentation — final scoreboard | `mvp`, `feature` |
| [EUP-014](tickets/EUP-014.md) | Host presentation controls | `mvp`, `feature` |
| [EUP-015](tickets/EUP-015.md) | Real-time presentation sync | `mvp`, `feature` |
| [EUP-016](tickets/EUP-016.md) | Docker LAN deployment | `mvp`, `infra` |
| [EUP-017](tickets/EUP-017.md) | MVP smoke test checklist | `mvp`, `chore` |

### Phase 2

| ID | Title | Labels |
|----|-------|--------|
| EUP-005 | Optional account auth | `phase-2`, `feature` |
| EUP-020 | Eurovision year JSON datasets | `phase-2`, `chore` |
| EUP-021 | Import party from year | `phase-2`, `feature` |
| EUP-022 | Auto-reveal presentation mode | `phase-2`, `feature` |
| EUP-023 | Custom reveal order | `phase-2`, `feature` |
| EUP-024 | Party history list | `phase-2`, `feature` |
| EUP-025 | Party detail replay | `phase-2`, `feature` |
| EUP-026 | Cross-party stats | `phase-2`, `feature` |
| EUP-027 | Participant accounts linking | `phase-2`, `feature` |
| EUP-028 | Spectator mode | `phase-2`, `feature` |

### Phase 3

| ID | Title | Labels |
|----|-------|--------|
| EUP-030 | Raspberry Pi deployment guide | `phase-3`, `infra` |
| EUP-031 | Caddy reverse proxy + HTTPS | `phase-3`, `infra` |
| EUP-032 | Cloudflare DNS + Tunnel | `phase-3`, `infra` |
| EUP-033 | DNS subdomain setup | `phase-3`, `infra` |
| EUP-034 | Rate limiting & basic security | `phase-3`, `feature` |
| EUP-035 | Advanced responsive polish | `phase-3`, `feature` |
| EUP-036 | YouTube performance links | `phase-3`, `feature` |
| EUP-037 | Embedded media player | `phase-3`, `feature` |
| EUP-038 | Current-year quick entry tool | `phase-3`, `feature` |
| EUP-039 | Export results | `phase-3`, `feature` |
| EUP-040 | Jury profile avatars | `phase-3`, `feature` |

## Build order (MVP)

EUP-001 → EUP-002 → EUP-003 → EUP-004 → EUP-006 → EUP-006D → EUP-007A/EUP-007B → EUP-007 → EUP-008 → EUP-009 → EUP-010 → EUP-011 → EUP-012 → EUP-013 → EUP-014 → EUP-015 → EUP-016 → EUP-017
