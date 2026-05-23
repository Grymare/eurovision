# Accessibility (EUP-007B)

Baseline patterns for Grymare Eurovision. Target: **WCAG 2.2 AA** for core MVP flows (home, join, lobby, ballot, presentation).

## Focus indicators

All interactive elements use visible `:focus-visible` styles:

- Global gold outline in `src/app/globals.css` (`@layer base`) for links, buttons, and form controls
- Component classes (`btn-*`, `field-input`, `nav-link`, etc.) add stronger outlines where needed

Keyboard users should always see which control is focused when tabbing through a page.

## Skip link

The root layout includes a skip link as the first focusable element:

```tsx
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
```

Each page’s primary `<main>` must set `id="main-content"`.

## Live regions (`aria-live`)

Use **`aria-live="polite"`** for non-critical status updates that should be announced without interrupting the user.

| Area | Element | When it updates |
|------|---------|-----------------|
| Party lobby jury list | `<ul aria-live="polite">` in `party-lobby.tsx` | Guest joins/leaves, vote submitted status |
| Socket connection | `<p className="sr-only" aria-live="polite">` in `socket-status.tsx` | Connected / reconnecting / disconnected |
| Jury intro banner | `<div aria-live="polite">` in `jury-intro-banner.tsx` | Host advances to next jury intro |

**Do not** put `aria-live` on large containers that re-render entire page sections — only on the specific status text or list that changes.

For errors, prefer **`role="alert"`** (assertive) on validation or fetch failures.

## Linting

`eslint-plugin-jsx-a11y` is enabled in `eslint.config.mjs` with the recommended ruleset. Run:

```bash
pnpm lint
```

## Manual checks (EUP-017 smoke test)

1. Tab through home → join → ballot primary actions
2. Confirm visible focus on buttons and inputs
3. Run axe DevTools on home, lobby, and ballot — no **critical** violations

## Reduced motion

Presentation animations respect `prefers-reduced-motion` via `use-scoreboard-reorder` and related hooks.
