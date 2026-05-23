/**
 * Design tokens — keep in sync with docs/design/design-system.md and globals.css
 */
export const designTokens = {
  colors: {
    stage: "#0A0A0A",
    stageElevated: "#141414",
    stageBorder: "#2E2E2E",
    foreground: "#F5F5F5",
    muted: "#A1A1AA",
    gold: "#E8B923",
    goldBright: "#FFD54F",
    goldDeep: "#A67C00",
    onGold: "#1A1408",
    success: "#4ADE80",
    danger: "#F87171",
  },
  motion: {
    fast: "150ms",
    normal: "250ms",
    slow: "350ms",
  },
  touchTargetMinPx: 44,
} as const;
