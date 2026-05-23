"use client";

import {
  STAGE_BACKGROUND_CONFIG,
  STAGE_VIEWBOX_HEIGHT,
  type StaffGroupConfig,
  type StageBackgroundConfig,
} from "@/lib/design/stage-background-config";
import { useSyncExternalStore } from "react";

const CONTENT_CENTER = STAGE_VIEWBOX_HEIGHT / 2;

type StaffLinesProps = StaffGroupConfig;

function buildStaffTransform({
  translateX = 0,
  translateY = 0,
  rotate = 0,
  scale = 1,
}: Pick<StaffGroupConfig, "translateX" | "translateY" | "rotate" | "scale">) {
  const parts: string[] = [];

  if (translateX || translateY) {
    parts.push(`translate(${translateX} ${translateY})`);
  }

  if (rotate) {
    parts.push(`rotate(${rotate} ${CONTENT_CENTER} ${CONTENT_CENTER})`);
  }

  if (scale !== 1) {
    parts.push(
      `translate(${CONTENT_CENTER} ${CONTENT_CENTER}) scale(${scale}) translate(${-CONTENT_CENTER} ${-CONTENT_CENTER})`,
    );
  }

  return parts.length > 0 ? parts.join(" ") : undefined;
}

function StaffLines({
  path,
  lineCount = 5,
  spacing = 1.3,
  strokeWidth = 0.15,
  opacity = 1,
  rotate = 0,
  scale = 1,
  translateX = 0,
  translateY = 0,
}: StaffLinesProps) {
  const offsets = Array.from({ length: lineCount }, (_, index) => {
    return index - (lineCount - 1) / 2;
  });

  return (
    <g
      opacity={opacity}
      transform={buildStaffTransform({ translateX, translateY, rotate, scale })}
      stroke="currentColor"
      fill="none"
      vectorEffect="non-scaling-stroke"
    >
      {offsets.map((offset) => (
        <path
          key={offset}
          d={path}
          transform={`translate(0 ${offset * spacing})`}
          strokeWidth={strokeWidth}
        />
      ))}
    </g>
  );
}

function subscribeToViewport(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getViewportAspect() {
  return window.innerWidth / window.innerHeight;
}

function useViewportAspect() {
  return useSyncExternalStore(subscribeToViewport, getViewportAspect, () => 1);
}

type StaffBackgroundProps = {
  config?: StageBackgroundConfig;
  className?: string;
};

export function StaffBackground({
  config = STAGE_BACKGROUND_CONFIG,
  className,
}: StaffBackgroundProps) {
  const aspect = useViewportAspect();
  const viewBoxWidth = STAGE_VIEWBOX_HEIGHT * aspect;
  const viewBoxString = `0 0 ${viewBoxWidth} ${STAGE_VIEWBOX_HEIGHT}`;

  return (
    <div
      className={className ?? "staff-bg"}
      aria-hidden="true"
      style={{ ["--staff-bg-opacity" as string]: config.opacity }}
    >
      <svg
        className="staff-bg__svg"
        viewBox={viewBoxString}
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform={`scale(${aspect} 1)`}>
          {config.staves.map((staff, index) => (
            <StaffLines key={`staff-${index}`} {...staff} />
          ))}
        </g>
      </svg>
    </div>
  );
}
