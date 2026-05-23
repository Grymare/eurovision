"use client";

import { EurovisionScoreboard } from "@/components/eurovision-scoreboard";
import { JuryHeader } from "@/components/jury-header";
import type { ScoreboardRowVisualState } from "@/components/scoreboard-row";
import { WinnerOverlay } from "@/components/winner-overlay";
import {
  prefersReducedMotion,
  useScoreboardReorder,
  wait,
  waitForNextPaint,
} from "@/hooks/use-scoreboard-reorder";
import type { PresentationAction, PresentationHostView } from "@/lib/party/presentation";
import { rankScoreboardEntries } from "@/lib/party/presentation";
import { PRESENTATION_TIMING } from "@/lib/party/presentation-config";
import type { SerializedEntry } from "@/lib/party/types";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";

type PresentationCeremonyProps = {
  partyCode: string;
  initialEntries: SerializedEntry[];
  initialPresentation: PresentationHostView | null;
  initialPartyState: string;
};

type PresentationResponse = {
  party: { state: string };
  entries: SerializedEntry[];
  presentation: PresentationHostView;
};

export function PresentationCeremony({
  partyCode,
  initialEntries,
  initialPresentation,
  initialPartyState,
}: PresentationCeremonyProps) {
  const containerRef = useRef<HTMLElement>(null);
  const [entries, setEntries] = useState(initialEntries);
  const [presentation, setPresentation] = useState<PresentationHostView | null>(
    initialPresentation,
  );
  const [partyState, setPartyState] = useState(initialPartyState);
  const [displayTotals, setDisplayTotals] = useState<Record<string, number>>(
    initialPresentation?.runningTotals ??
      Object.fromEntries(initialEntries.map((entry) => [entry.id, 0])),
  );
  const [rowVisualStates, setRowVisualStates] = useState<
    Record<string, ScoreboardRowVisualState>
  >({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialPresentation);
  const [error, setError] = useState<string | null>(null);
  const [showWinnerOverlay, setShowWinnerOverlay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const reducedMotion = useMemo(
    () => (typeof window !== "undefined" ? prefersReducedMotion() : false),
    [],
  );

  const { containerRef: scoreboardContainerRef, runFlipUpdate } = useScoreboardReorder(!reducedMotion);

  const applyResponse = useCallback((data: PresentationResponse) => {
    setPresentation(data.presentation);
    setEntries(data.entries);
    setPartyState(data.party.state);
    setDisplayTotals(data.presentation.runningTotals);
  }, []);

  const patchPresentation = useCallback(
    async (action: PresentationAction) => {
      const response = await fetch(`/api/parties/${partyCode}/presentation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await response.json()) as PresentationResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not update presentation");
      }

      applyResponse(data);

      return data;
    },
    [applyResponse, partyCode],
  );

  const loadPresentation = useCallback(async () => {
    setError(null);

    try {
      const response = await fetch(`/api/parties/${partyCode}/presentation`);
      const data = (await response.json()) as {
        party: { state: string };
        entries: SerializedEntry[];
        presentation: PresentationHostView | null;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not load presentation");
      }

      if (data.presentation) {
        applyResponse({
          party: data.party,
          entries: data.entries,
          presentation: data.presentation,
        });
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load presentation");
    } finally {
      setIsLoading(false);
    }
  }, [applyResponse, partyCode]);

  useEffect(() => {
    if (!initialPresentation) {
      void loadPresentation();
    }
  }, [initialPresentation, loadPresentation]);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const winner = useMemo(() => {
    const ranked = rankScoreboardEntries(entries, displayTotals);

    return ranked[0] ?? null;
  }, [displayTotals, entries]);

  const clearRowVisuals = useCallback(() => {
    setRowVisualStates({});
  }, []);

  const runWinnerFinale = useCallback(() => {
    setShowWinnerOverlay(true);
  }, []);

  const dismissWinnerOverlay = useCallback(async () => {
    setShowWinnerOverlay(false);

    if (partyState === "finished") {
      return;
    }

    try {
      await patchPresentation("finish");
    } catch (finishError) {
      setError(finishError instanceof Error ? finishError.message : "Could not finish presentation");
    }
  }, [partyState, patchPresentation]);

  const runLowPointReveal = useCallback(
    async (lowReveal: NonNullable<PresentationHostView["lowReveal"]>) => {
      setIsAnimating(true);
      clearRowVisuals();

      const localTotals = { ...displayTotals };

      for (const allocation of lowReveal) {
        localTotals[allocation.entryId] =
          (localTotals[allocation.entryId] ?? 0) + allocation.points;

        if (reducedMotion) {
          setRowVisualStates((previous) => ({
            ...previous,
            [allocation.entryId]: { activePoints: allocation.points },
          }));
          continue;
        }

        setRowVisualStates((previous) => ({
          ...previous,
          [allocation.entryId]: { activePoints: allocation.points },
        }));

        await wait(PRESENTATION_TIMING.pointRevealDurationMs);
        await wait(PRESENTATION_TIMING.pointRevealStaggerMs);
      }

      await wait(PRESENTATION_TIMING.lowRevealSettleMs);

      await runFlipUpdate(
        () => {
          flushSync(() => {
            setDisplayTotals({ ...localTotals });
          });
        },
        { frontEntryIds: lowReveal.map((allocation) => allocation.entryId) },
      );
      await patchPresentation("commit_low");
      setIsAnimating(false);
    },
    [clearRowVisuals, displayTotals, patchPresentation, reducedMotion, runFlipUpdate],
  );

  const runTwelvePointReveal = useCallback(
    async (
      twelveReveal: NonNullable<PresentationHostView["twelveReveal"]>,
      isLastJury: boolean,
    ) => {
      setIsAnimating(true);

      if (reducedMotion) {
        setRowVisualStates((previous) => ({
          ...previous,
          [twelveReveal.entryId]: {
            ...previous[twelveReveal.entryId],
            activePoints: twelveReveal.points,
            goldCard: true,
          },
        }));

        await runFlipUpdate(
          () => {
            flushSync(() => {
              setDisplayTotals((previous) => ({
                ...previous,
                [twelveReveal.entryId]:
                  (previous[twelveReveal.entryId] ?? 0) + twelveReveal.points,
              }));
            });
          },
          { frontEntryIds: [twelveReveal.entryId] },
        );

        const data = await patchPresentation("commit_twelve");

        if (data.presentation.phase === "winner") {
          await runWinnerFinale();
        }

        setIsAnimating(false);
        return;
      }

      await wait(PRESENTATION_TIMING.twelvePreRevealDelayMs);

      setRowVisualStates((previous) => ({
        ...previous,
        [twelveReveal.entryId]: {
          ...previous[twelveReveal.entryId],
          activePoints: twelveReveal.points,
          goldCard: true,
          goldAnimating: true,
        },
      }));

      await waitForNextPaint();
      await wait(PRESENTATION_TIMING.twelveGoldSweepMs + PRESENTATION_TIMING.twelveGlitterMs);

      setRowVisualStates((previous) => ({
        ...previous,
        [twelveReveal.entryId]: {
          ...previous[twelveReveal.entryId],
          activePoints: twelveReveal.points,
          goldCard: true,
          goldAnimating: false,
        },
      }));

      await runFlipUpdate(
        () => {
          flushSync(() => {
            setDisplayTotals((previous) => ({
              ...previous,
              [twelveReveal.entryId]:
                (previous[twelveReveal.entryId] ?? 0) + twelveReveal.points,
            }));
          });
        },
        { frontEntryIds: [twelveReveal.entryId] },
      );

      await patchPresentation("commit_twelve");
      setIsAnimating(false);

      if (isLastJury) {
        await runWinnerFinale();
      }
    },
    [patchPresentation, reducedMotion, runFlipUpdate, runWinnerFinale],
  );

  async function handleOpenPresentation() {
    setIsLoading(true);
    setError(null);

    try {
      await patchPresentation("open");
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : "Could not open presentation");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleBeginLowReveal() {
    setError(null);

    try {
      const data = await patchPresentation("begin_low_reveal");
      const lowReveal = data.presentation.lowReveal;

      if (!lowReveal?.length) {
        throw new Error("No point allocations to reveal");
      }

      await runLowPointReveal(lowReveal);
    } catch (revealError) {
      setError(revealError instanceof Error ? revealError.message : "Could not reveal points");
      setIsAnimating(false);
    }
  }

  async function handleBeginTwelveReveal() {
    setError(null);

    try {
      const data = await patchPresentation("begin_twelve_reveal");
      const twelveReveal = data.presentation.twelveReveal;

      if (!twelveReveal) {
        throw new Error("No 12-point allocation to reveal");
      }

      await runTwelvePointReveal(twelveReveal, data.presentation.isLastJury);
    } catch (revealError) {
      setError(revealError instanceof Error ? revealError.message : "Could not reveal 12 points");
      setIsAnimating(false);
    }
  }

  async function handleNextJury() {
    setError(null);

    try {
      clearRowVisuals();
      await patchPresentation("next_jury");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not move to next jury");
    }
  }

  async function toggleFullscreen() {
    if (!containerRef.current) {
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await containerRef.current.requestFullscreen();
      }
    } catch {
      setError("Fullscreen is not available in this browser.");
    }
  }

  const phase = presentation?.phase;

  const juryNumber = (presentation?.juryIndex ?? 0) + 1;
  const juryCount = presentation?.juryCount ?? 0;
  const currentJury = presentation?.currentJury;
  const showJuryHeader = Boolean(currentJury && presentation && partyState === "presenting");

  const primaryAction =
    !presentation ? { label: "Start presentation", onClick: handleOpenPresentation }
    : phase === "jury_intro" ?
      { label: "Give points 1–10", onClick: handleBeginLowReveal }
    : phase === "awaiting_twelve" ?
      { label: "Give 12 points", onClick: handleBeginTwelveReveal }
    : phase === "jury_handoff" ?
      { label: "Next jury", onClick: handleNextJury }
    : phase === "winner" && !showWinnerOverlay ?
      { label: "Reveal winner", onClick: runWinnerFinale }
    : null;

  return (
    <section
      ref={containerRef}
      className="presentation-page"
      aria-labelledby="presentation-page-heading"
    >
      <h1 id="presentation-page-heading" className="sr-only">
        Presentation scoreboard
      </h1>

      <div className="presentation-page__toolbar">
        {showJuryHeader && currentJury ?
          <JuryHeader
            key={currentJury.id}
            nickname={currentJury.nickname}
            isHost={currentJury.isHost}
            juryNumber={juryNumber}
            juryCount={juryCount}
          />
        : <div className="presentation-page__toolbar-main" />}
        <div className="presentation-page__toolbar-actions">
          <button type="button" className="btn-ghost" onClick={toggleFullscreen}>
            {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>

      {isLoading ? <p className="text-sm text-muted">Loading presentation…</p> : null}

      <div
        ref={scoreboardContainerRef}
        className="presentation-page__scoreboard"
        style={
          {
            ["--point-reveal-pop-duration" as string]: `${PRESENTATION_TIMING.pointRevealPopMs}ms`,
          } as CSSProperties
        }
      >
        <EurovisionScoreboard
          entries={entries}
          runningTotals={displayTotals}
          rowVisualStates={rowVisualStates}
          reordering={isAnimating}
        />
      </div>

      {primaryAction ?
        <div className="presentation-page__controls">
          <button
            type="button"
            className="btn-primary"
            disabled={isAnimating || isLoading || partyState === "finished"}
            onClick={primaryAction.onClick}
          >
            {primaryAction.label}
          </button>
        </div>
      : null}

      {winner ?
        <WinnerOverlay
          name={winner.name}
          flagEmoji={winner.flagEmoji}
          totalPoints={winner.totalPoints}
          visible={showWinnerOverlay}
          onDismiss={() => {
            void dismissWinnerOverlay();
          }}
        />
      : null}

      {partyState === "finished" ?
        <p role="status" className="text-center text-sm text-success">
          Presentation complete. Final results are saved.
        </p>
      : null}

      {error ?
        <p role="alert" className="text-center text-sm text-danger">
          {error}
        </p>
      : null}
    </section>
  );
}
