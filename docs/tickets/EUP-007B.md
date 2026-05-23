# EUP-007B — WCAG 2.2 AA baseline

**Status:** Done  
**Phase:** MVP  
**Labels:** mvp, feature

## Summary

Establish accessibility baseline: eslint jsx-a11y, focus styles, semantic HTML patterns, aria-live for live regions.

## Acceptance criteria

- [x] eslint-plugin-jsx-a11y enabled in CI/dev (already in scaffold — extend ruleset as needed)
- [x] Visible focus indicators on all interactive elements
- [x] Skip link present (layout)
- [x] Document aria-live pattern for voting status
- [x] axe check on home/health flow in EUP-017

## Dependencies

- EUP-001 (scaffold)
- EUP-007

## Implementation notes

- `eslint-plugin-jsx-a11y` recommended rules in `eslint.config.mjs`
- Global `:focus-visible` outline in `globals.css` `@layer base`
- Skip link in `src/app/layout.tsx`
- Live region patterns documented in `docs/accessibility.md`
- Manual axe spot-check steps in `docs/deploy/smoke-test-checklist.md`
