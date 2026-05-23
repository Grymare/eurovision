# Grymare Eurovision — Design System (EUP-006D)

Agreed in design session. Implements **WCAG 2.2 AA** contrast targets on core UI pairs.

## Creative direction

| Decision | Choice |
|----------|--------|
| Mood | **TV broadcast** — black stage, gold spotlight, Eurovision night energy |
| Color scheme | **Black / grey + gold** — neutral darks, no blue tint |
| Default theme | **Dark** (no light mode in MVP; add toggle later if needed) |
| Accent | **Gold / amber** — “douze points” trophy moments |
| Presentation | **Fullscreen dark scoreboard** — huge type, minimal chrome, TV/projector first |
| Motion | **Subtle** fades/slides; optional **gold sparkles** on 12-point reveals with `prefers-reduced-motion` fallback |

## Color palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--stage` | `#0A0A0A` | Page background (near-black) |
| `--stage-elevated` | `#141414` | Cards, panels |
| `--stage-border` | `#2E2E2E` | Borders, dividers |
| `--foreground` | `#F5F5F5` | Primary text on dark surfaces |
| `--muted` | `#A1A1AA` | Secondary text, hints (neutral grey) |
| `--gold` | `#E8B923` | Primary buttons, key accents |
| `--gold-bright` | `#FFD54F` | Highlights, 12-point emphasis |
| `--gold-deep` | `#A67C00` | Borders on gold elements |
| `--on-gold` | `#1A1408` | Text/icons on gold buttons |
| `--success` | `#4ADE80` | Status confirmations |
| `--danger` | `#F87171` | Errors, destructive actions |

### Contrast checks (WCAG 2.2 AA)

| Pair | Ratio | Pass |
|------|-------|------|
| `--foreground` on `--stage` | ~19:1 | AA / AAA |
| `--muted` on `--stage` | ~7.5:1 | AA / AAA |
| `--on-gold` on `--gold` | ~8.4:1 | AA / AAA |
| `--gold-bright` on `--stage` (large text) | ~12:1 | AA large+ |
| `--danger` on `--stage-elevated` | ~5.5:1 | AA |

## Typography

| Role | Font | Sizes |
|------|------|-------|
| UI body | Geist Sans | 16px base, 14px sm, 18px lg |
| UI headings | Geist Sans semibold | H1 28–32px mobile, 36–40px desktop |
| Presentation / scores | Bebas Neue | Points 72–120px TV; country 40–64px |
| Monospace (codes) | Geist Mono | Party code, tabular data |

### Scale reference

- **Mobile voting UI:** 16px labels, 44px min touch targets
- **Host dashboard:** same as mobile; wider layout on desktop
- **Presentation fullscreen:** clamp typography — e.g. points `clamp(4rem, 12vw, 7.5rem)`

## Layout patterns

- **Phone:** single column, sticky primary action where helpful
- **Desktop host:** max-width ~48rem content; host controls grouped in elevated panel
- **Presentation:** true fullscreen route (`/party/[id]/present`) — black stage, centered reveal, scoreboard list below or overlay

## Motion

| Interaction | Default | Reduced motion |
|-------------|---------|----------------|
| Page/panel enter | 200ms fade + 8px slide | Instant / opacity only |
| Score reveal step | 300ms fade scale 0.98→1 | Instant swap |
| 12-point moment | Optional gold sparkle burst (CSS) | Disabled — show static gold ring |
| Live “who voted” | No animation on list reorder | Same |

## Components (semantic)

- **Primary button:** gold background, dark text, visible focus ring (2px gold-bright offset)
- **Secondary button:** transparent, gold border, gold-bright text
- **Card:** stage-elevated, stage-border, rounded-xl
- **Live region:** polite `aria-live` for vote status (no motion required)
- **Flag + name:** always paired; never flag-only

## Brand notes

- Fan project for `eurovision.grymare.com` — avoid official Eurovision logo assets
- Word “Eurovision” in copy is fine; visual identity is **broadcast-inspired**, not official
