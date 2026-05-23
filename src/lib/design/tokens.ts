/**
 * Design tokens — keep in sync with docs/design/design-system.md and globals.css
 */
export const designTokens = {
  colors: {
    stage: "#0B0F1A",
    stageElevated: "#151B2B",
    stageBorder: "#2A3548",
    foreground: "#F4F4F5",
    muted: "#A8B0C2",
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
