export type StaffGroupConfig = {
  path: string;
  lineCount?: number;
  spacing?: number;
  strokeWidth?: number;
  opacity?: number;
  rotate?: number;
  scale?: number;
  translateX?: number;
  translateY?: number;
};

export type StageBackgroundConfig = {
  opacity: number;
  staves: StaffGroupConfig[];
};

/** Authoring height — width is this × viewport aspect at runtime. */
export const STAGE_VIEWBOX_HEIGHT = 100;

const CLASSIC = "M -6 90 C 34 8, 66 92, 106 16";
const SERPENT = "M -8 94 C 28 6, 72 98, 108 8";

/**
 * Lower S — authored to x=0..100 and y≈88..100 so it meets left, right, and bottom
 * borders after the responsive aspect scale.
 */
const AF_LOWER_S_PATH = "M 0 96 C 32 10, 68 90, 100 58";

/** AL · AF + Lower S — production stage background. */
export const STAGE_BACKGROUND_CONFIG: StageBackgroundConfig = {
  opacity: 0.068,
  staves: [
    {
      path: CLASSIC,
      lineCount: 5,
      spacing: 1.5,
      strokeWidth: 0.17,
      opacity: 0.5,
      scale: 1.4,
      rotate: -138,
      translateX: -30,
      translateY: -30,
    },
    {
      path: SERPENT,
      lineCount: 5,
      spacing: 1.5,
      strokeWidth: 0.17,
      opacity: 0.48,
      scale: 1.38,
      rotate: 132,
      translateX: 30,
      translateY: 32,
    },
    {
      path: AF_LOWER_S_PATH,
      lineCount: 5,
      spacing: 1.35,
      strokeWidth: 0.15,
      opacity: 0.42,
      scale: 1,
      rotate: 4,
      translateX: 0,
      translateY: 0,
    },
  ],
};
