"use client";

import { PRESENTATION_TIMING } from "@/lib/party/presentation-config";
import { useCallback, useRef } from "react";

const REORDER_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const REORDER_Z_INDEX = {
  moving: 5,
  front: 20,
} as const;

export type FlipUpdateOptions = {
  /** Ordered list — later entries stack above earlier ones during the reorder. */
  frontEntryIds?: string[];
};

export function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export function useScoreboardReorder(enabled: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousPositions = useRef<Map<string, DOMRect>>(new Map());

  const capturePositions = useCallback(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const nextPositions = new Map<string, DOMRect>();

    container.querySelectorAll<HTMLElement>("[data-entry-id]").forEach((element) => {
      nextPositions.set(element.dataset.entryId!, element.getBoundingClientRect());
    });

    previousPositions.current = nextPositions;
  }, []);

  const animateReorder = useCallback(
    async (frontEntryIds: string[] = []) => {
      if (!enabled) {
        return;
      }

      const container = containerRef.current;

      if (!container) {
        return;
      }

      const frontEntries = new Map(
        frontEntryIds.map((entryId, index) => [entryId, REORDER_Z_INDEX.front + index]),
      );
      const previous = previousPositions.current;
      const rows = Array.from(container.querySelectorAll<HTMLElement>("[data-entry-id]"));
      const moving: Array<{
        element: HTMLElement;
        entryId: string;
        deltaX: number;
        deltaY: number;
      }> = [];

      rows.forEach((element) => {
        const entryId = element.dataset.entryId!;
        const first = previous.get(entryId);
        const last = element.getBoundingClientRect();

        if (!first) {
          return;
        }

        const deltaX = first.left - last.left;
        const deltaY = first.top - last.top;

        if (deltaX === 0 && deltaY === 0) {
          return;
        }

        moving.push({ element, entryId, deltaX, deltaY });
      });

      if (moving.length === 0) {
        return;
      }

      moving.forEach(({ element, entryId, deltaX, deltaY }) => {
        element.style.willChange = "transform";
        element.style.zIndex = String(frontEntries.get(entryId) ?? REORDER_Z_INDEX.moving);
        element.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
      });

      container.getBoundingClientRect();

      const duration = PRESENTATION_TIMING.reorderDurationMs;
      const animations = moving.map(({ element, deltaX, deltaY }) =>
        element.animate(
          [
            { transform: `translate3d(${deltaX}px, ${deltaY}px, 0)` },
            { transform: "translate3d(0, 0, 0)" },
          ],
          {
            duration,
            easing: REORDER_EASING,
            fill: "forwards",
          },
        ),
      );

      await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));

      moving.forEach(({ element }) => {
        element.style.willChange = "";
        element.style.zIndex = "";
        element.style.transform = "";
      });

      animations.forEach((animation) => animation.cancel());
    },
    [enabled],
  );

  const runFlipUpdate = useCallback(
    async (update: () => void, options?: FlipUpdateOptions) => {
      capturePositions();
      update();
      await waitForNextPaint();
      await animateReorder(options?.frontEntryIds ?? []);
    },
    [animateReorder, capturePositions],
  );

  return {
    containerRef,
    capturePositions,
    animateReorder,
    runFlipUpdate,
  };
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
