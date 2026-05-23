# EUP-007A — Responsive layout foundation

**Status:** Done  
**Phase:** MVP  
**Labels:** mvp, feature

## Summary

Mobile-first responsive layouts and touch targets before vote UI styling.

## Acceptance criteria

- [x] Breakpoints defined (320 / 768 / 1280)
- [x] Touch targets >= 44px on primary actions (mobile)
- [x] Presentation layout works landscape on tablet/TV widths
- [x] No horizontal scroll on 320px viewport for core pages

## Dependencies

- EUP-006D (design tokens)
- EUP-007

## Implementation notes

- Breakpoints in `src/app/globals.css` `@theme`: `--breakpoint-xs` (320px), `--breakpoint-md` (768px), `--breakpoint-xl` (1280px)
- `min-h-11` (44px) on buttons, inputs, nav links, and combobox triggers
- `overflow-x: clip` on body, page shell, and main content areas
- Presentation scoreboard landscape + XL TV sizing in media queries
- Presentation ceremony capped at `max-w-[75rem]` (1200px), centered; page scrolls as a whole when needed (no inner list scrollbar)
