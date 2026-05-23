/**
 * Design tokens — keep in sync with docs/design/design-system.md and globals.css
 */
export const designTokens = {
  colors: {
    stage: "#080808",
    stageElevated: "#101010",
    foreground: "#FAFAFA",
    muted: "#A3A3A3",
    goldLight: "#D4AF37",
    goldMid: "#B38728",
    goldDeep: "#8B6914",
    onGold: "#14110A",
    success: "#86EFAC",
    danger: "#FCA5A5",
  },
  fonts: {
    display: "Playfair Display",
    body: "Geist Sans",
    mono: "Geist Mono",
  },
  motion: {
    fast: "150ms",
    normal: "250ms",
  },
  touchTargetMinPx: 44,
} as const;
