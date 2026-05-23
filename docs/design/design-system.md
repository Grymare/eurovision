# Grymare Eurovision — Design System (EUP-006D)

Agreed in design session. Implements **WCAG 2.2 AA** contrast targets on core UI pairs.

## Creative direction

| Decision | Choice |
|----------|--------|
| Mood | **Luxury minimal** — black stage, restrained gold, generous space |
| Color scheme | **Black / charcoal + champagne gold** — no blue, no saturated yellow |
| Typography | **Playfair Display** (headlines) + **Geist Sans** (UI body) |
| Gold usage | **Sparingly** — party code, one hero accent, primary CTAs, thin borders |
| Presentation | **Fullscreen dark scoreboard** — serif gold type, soft glow only |
| Motion | **Subtle**; optional sparkle ring on 12-point reveals |

Inspired by luxury black-and-gold UI: thin gradient borders, ghost buttons, matte backgrounds with soft radial light.

## Color palette

| Token | Hex / value | Usage |
|-------|-------------|-------|
| `--stage` | `#080808` | Page background |
| `--stage-elevated` | `#101010` | Cards (semi-transparent) |
| `--stage-border` | `gold @ 14% opacity` | Thin elegant borders |
| `--foreground` | `#FAFAFA` | Primary text |
| `--muted` | `#A3A3A3` | Secondary text |
| `--gold-light` | `#D4AF37` | Focus rings, border highlights |
| `--on-gold` | `#14110A` | Text on filled gold buttons |

### Metallic gold (champagne gradients)

Multi-stop **bronze → highlight → bronze** — never flat `#FFD54F`.

| Token | Usage |
|-------|--------|
| `--gold-gradient-text` | Party code, hero accent phrase only |
| `--gold-gradient-surface` | Primary filled buttons (soft, not loud) |
| `--gold-gradient-border` | Ghost button rings, panel edges |
| `--gold-gradient-line` | Hero divider line |

### Where gold appears (intentional restraint)

- Hero: **one phrase** in gradient gold; rest white serif
- Party code: gradient serif
- Primary button: soft metallic fill
- Secondary button: **ghost** with thin gradient border, white text
- Everything else: white or grey text

## Typography

| Role | Font |
|------|------|
| Headlines | Playfair Display (`.display-serif`, `.display-serif-gold`) |
| Body / UI | Geist Sans |
| Party code | Playfair + `.gold-code` |
| Data / codes | Geist Mono |

## Components

- **Panel:** thin gold-tinted border, dark glass background, generous padding
- **Primary button:** pill, champagne gradient, dark text, minimal shadow
- **Secondary button:** ghost pill, gradient border, white label
- **Hero divider:** 1px horizontal gold gradient line
- **Lists:** `.list-row` with bottom border only — no heavy boxes

## Motion

See prior motion table. Sparkle burst uses thin gradient ring, not thick glow.

## Brand notes

Fan project for `eurovision.grymare.com` — avoid official Eurovision logo assets.
