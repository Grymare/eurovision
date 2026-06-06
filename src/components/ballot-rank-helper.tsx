"use client";

import { CountryFlag } from "@/components/country-flag";
import {
  getRankDraft,
  mergeRankOrder,
  setRankDraft,
} from "@/lib/party/rank-draft";
import {
  pointsForRankIndex,
  rankedEntryIdsToBallotSlots,
} from "@/lib/party/rank-to-ballot";
import type { SerializedEntry } from "@/lib/party/types";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type BallotRankHelperProps = {
  entries: SerializedEntry[];
  onApply: (slots: Record<number, string>) => void;
  partyCode?: string;
  applyLabel?: string;
  defaultOpen?: boolean;
  lobbyPrep?: boolean;
  alwaysOpen?: boolean;
  fullSize?: boolean;
};

function initialOrder(entries: SerializedEntry[], partyCode?: string): string[] {
  const entryIds = entries.map((entry) => entry.id);

  if (partyCode) {
    const draft = getRankDraft(partyCode);

    if (draft) {
      return mergeRankOrder(draft.orderedIds, entryIds);
    }
  }

  return entryIds;
}

function pointsLabelForRankIndex(rankIndex: number): string | null {
  const points = pointsForRankIndex(rankIndex);

  if (points === null) {
    return null;
  }

  return points === 1 ? "1 point" : `${points} points`;
}

function pointsLabelShortForRankIndex(rankIndex: number): string | null {
  const points = pointsForRankIndex(rankIndex);

  if (points === null) {
    return null;
  }

  return points === 1 ? "1 pt" : `${points} pts`;
}

export function BallotRankHelper({
  entries,
  onApply,
  partyCode,
  applyLabel = "Use as my ballot",
  defaultOpen = false,
  lobbyPrep = false,
  alwaysOpen = false,
  fullSize = false,
}: BallotRankHelperProps) {
  const [open, setOpen] = useState(alwaysOpen || defaultOpen);
  const [orderedIds, setOrderedIds] = useState<string[]>(() => initialOrder(entries, partyCode));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const orderedIdsRef = useRef(orderedIds);
  const draggingIdRef = useRef<string | null>(null);

  orderedIdsRef.current = orderedIds;
  draggingIdRef.current = draggingId;

  const entryById = new Map(entries.map((entry) => [entry.id, entry]));

  function moveEntry(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
      return;
    }

    setOrderedIds((current) => {
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) {
        return current;
      }
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function moveUp(index: number) {
    moveEntry(index, index - 1);
  }

  function moveDown(index: number) {
    moveEntry(index, index + 1);
  }

  function reorderByPointer(clientY: number) {
    const list = listRef.current;
    const activeId = draggingIdRef.current;

    if (!list || !activeId) {
      return;
    }

    const rows = Array.from(
      list.querySelectorAll<HTMLElement>("[data-rank-entry-id]"),
    );
    const current = orderedIdsRef.current;
    const fromIndex = current.indexOf(activeId);

    if (fromIndex < 0 || rows.length === 0) {
      return;
    }

    let toIndex = rows.length - 1;

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      if (!row) {
        continue;
      }

      const rect = row.getBoundingClientRect();

      if (clientY < rect.top + rect.height / 2) {
        toIndex = index;
        break;
      }
    }

    if (fromIndex !== toIndex) {
      moveEntry(fromIndex, toIndex);
    }
  }

  function startDrag(entryId: string, event: React.PointerEvent<HTMLLIElement>) {
    const target = event.target as HTMLElement;

    if (target.closest(".ballot-rank__move-btn")) {
      return;
    }

    // Touch: only the grip starts a drag so the rest of the row can scroll normally.
    if (event.pointerType === "touch" && !target.closest(".ballot-rank__handle")) {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    event.preventDefault();
    draggingIdRef.current = entryId;
    setDraggingId(entryId);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  useEffect(() => {
    if (!draggingId) {
      return;
    }

    const previousTouchAction = document.body.style.touchAction;
    document.body.style.touchAction = "none";

    function handleWindowPointerMove(event: PointerEvent) {
      if (!draggingIdRef.current) {
        return;
      }

      event.preventDefault();
      reorderByPointer(event.clientY);
    }

    function handleWindowPointerUp() {
      draggingIdRef.current = null;
      setDraggingId(null);
    }

    window.addEventListener("pointermove", handleWindowPointerMove, { passive: false });
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);

    return () => {
      document.body.style.touchAction = previousTouchAction;
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);
    };
  }, [draggingId]);

  function handleApply() {
    if (partyCode) {
      setRankDraft(partyCode, orderedIds);
    }

    onApply(rankedEntryIdsToBallotSlots(orderedIds));

    if (!alwaysOpen) {
      setOpen(false);
    }
  }

  if (entries.length < 10) {
    return null;
  }

  return (
    <div
      className={
        fullSize ?
          "ballot-rank ballot-rank--full space-y-3 border border-stage-border/60 bg-stage-elevated/40 p-4"
        : "ballot-rank space-y-3 border border-stage-border/60 bg-stage-elevated/40 p-4"
      }
    >
      <div className="space-y-1">
        <h4 className="text-sm font-medium uppercase tracking-[0.14em] text-foreground">
          Help me rank
        </h4>
        <p className="text-sm text-muted">
          {lobbyPrep ?
            "Drag countries best → worst while you wait. Your top 10 will pre-fill the ballot when voting opens."
          : "Drag countries best → worst. Your top 10 will pre-fill the ballot (12 down to 1 point)."}
        </p>
      </div>

      {open || alwaysOpen ?
        <>
          <ol ref={listRef} className="ballot-rank__list space-y-1">
            {orderedIds.map((entryId, index) => {
              const entry = entryById.get(entryId);
              if (!entry) {
                return null;
              }

              const pointsLabel = pointsLabelForRankIndex(index);
              const pointsLabelShort = pointsLabelShortForRankIndex(index);

              return (
                <li
                  key={entryId}
                  data-rank-entry-id={entryId}
                  onPointerDown={(event) => startDrag(entryId, event)}
                  className={
                    draggingId === entryId ?
                      "ballot-rank__item ballot-rank__item--dragging"
                    : "ballot-rank__item"
                  }
                >
                  <span className="ballot-rank__handle" aria-hidden="true">
                    <GripVertical className="h-4 w-4" />
                  </span>
                  <span className="ballot-rank__position">{index + 1}</span>
                  <CountryFlag name={entry.name} flagEmoji={entry.flagEmoji} />
                  <span className="ballot-rank__name">{entry.name}</span>
                  {pointsLabel && pointsLabelShort ?
                    <span className="ballot-rank__points">
                      <span className="ballot-rank__points-full">{pointsLabel}</span>
                      <span className="ballot-rank__points-short">{pointsLabelShort}</span>
                    </span>
                  : null}
                  <div className="ballot-rank__move-buttons">
                    <button
                      type="button"
                      className="ballot-rank__move-btn"
                      aria-label={`Move ${entry.name} up`}
                      disabled={index === 0}
                      onClick={() => moveUp(index)}
                    >
                      <ChevronUp className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="ballot-rank__move-btn"
                      aria-label={`Move ${entry.name} down`}
                      disabled={index === orderedIds.length - 1}
                      onClick={() => moveDown(index)}
                    >
                      <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="ballot-rank__actions flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={handleApply}>
              {applyLabel}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setOrderedIds(entries.map((entry) => entry.id))}
            >
              Reset order
            </button>
          </div>
        </>
      : null}
    </div>
  );
}
