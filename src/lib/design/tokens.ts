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
  gradients: {
    text: "180deg: #fff9e6 → #ffd54f → #e8b923 → #fff3b0 → #c9a227",
    surface: "165deg multi-stop bronze-gold highlight",
    border: "135deg deep gold shimmer ring",
  },
  motion: {
    fast: "150ms",
    normal: "250ms",
    slow: "350ms",
  },
  touchTargetMinPx: 44,
} as const;
