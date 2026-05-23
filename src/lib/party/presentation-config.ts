export const PRESENTATION_TIMING = {
  pointRevealDurationMs: 0,
  pointRevealStaggerMs: 360,
  pointRevealPopMs: 1100,
  lowRevealSettleMs: 1400,
  reorderDurationMs: 1500,
  twelvePreRevealDelayMs: 500,
  twelveGoldSweepMs: 1200,
  twelveGlitterMs: 600,
  cardColorRevertDelayMs: 500,
  juryIntroDurationMs: 2000,
  winnerOverlayDurationMs: 4000,
} as const;

export type PresentationTimingKey = keyof typeof PRESENTATION_TIMING;
