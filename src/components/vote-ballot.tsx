"use client";

import { MIN_BALLOT_ENTRIES } from "@/lib/party/constants";
import type { VoteAllocations } from "@/db/schema";
import type { SerializedVote } from "@/lib/party/types";
import {
  BALLOT_POINT_ORDER,
  validateVoteAllocations,
} from "@/lib/party/vote-validation";
import type { SerializedEntry } from "@/lib/party/types";
import { useState } from "react";

type VoteBallotProps = {
  partyId: string;
  entries: SerializedEntry[];
  initialVote: SerializedVote | null;
  onSubmitted?: () => void;
};

type BallotMode = "waiting" | "confirm-edit" | "editing";

function slotsFromAllocations(allocations: VoteAllocations): Record<number, string> {
  const slots: Record<number, string> = {};

  for (const points of BALLOT_POINT_ORDER) {
    slots[points] = "";
  }

  for (const [entryId, points] of Object.entries(allocations)) {
    slots[points] = entryId;
  }

  return slots;
}

function emptySlots(): Record<number, string> {
  return slotsFromAllocations({});
}

function allocationsFromSlots(slots: Record<number, string>): VoteAllocations {
  const allocations: VoteAllocations = {};

  for (const [pointsKey, entryId] of Object.entries(slots)) {
    if (entryId) {
      allocations[entryId] = Number(pointsKey);
    }
  }

  return allocations;
}

function initialMode(vote: SerializedVote | null): BallotMode {
  return vote?.hasVoted ? "waiting" : "editing";
}

function initialSlots(vote: SerializedVote | null): Record<number, string> {
  if (vote?.allocations) {
    return slotsFromAllocations(vote.allocations);
  }

  return emptySlots();
}

export function VoteBallot({
  partyId,
  entries,
  initialVote,
  onSubmitted,
}: VoteBallotProps) {
  const [mode, setMode] = useState<BallotMode>(() => initialMode(initialVote));
  const [slots, setSlots] = useState(() => initialSlots(initialVote));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateSlot(points: number, entryId: string) {
    setSlots((current) => ({ ...current, [points]: entryId }));
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const allocations = allocationsFromSlots(slots);
    const clientError = validateVoteAllocations(allocations, entries);

    if (clientError) {
      setError(clientError);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/parties/${partyId}/vote`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocations }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Could not submit vote");
      }

      setMode("waiting");
      onSubmitted?.();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Could not submit vote",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (entries.length < MIN_BALLOT_ENTRIES) {
    return (
      <p className="text-sm text-muted">
        Waiting for at least {MIN_BALLOT_ENTRIES} countries before ballots open.
      </p>
    );
  }

  if (mode === "waiting") {
    return (
      <div className="space-y-4">
        <p role="status" className="text-sm text-success">
          Your vote is in. Waiting for the rest of the jury.
        </p>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setMode("confirm-edit")}
        >
          Edit my vote
        </button>
      </div>
    );
  }

  if (mode === "confirm-edit") {
    return (
      <div className="space-y-4" role="dialog" aria-labelledby="confirm-edit-heading">
        <h3 id="confirm-edit-heading" className="section-heading text-base">
          Edit your vote?
        </h3>
        <p className="text-sm leading-6 text-muted">
          You will replace your current ballot. This only affects your own scores.
        </p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={() => setMode("editing")}>
            Yes, edit ballot
          </button>
          <button type="button" className="btn-secondary" onClick={() => setMode("waiting")}>
            Keep current vote
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-labelledby="ballot-heading">
      <div className="space-y-2">
        <h3 id="ballot-heading" className="section-heading">
          Your ballot
        </h3>
        <p className="text-sm leading-6 text-muted">
          Assign 1, 2, 3, 4, 5, 6, 7, 8, 10, and 12 points to ten different countries.
        </p>
      </div>

      <ol className="space-y-3">
        {BALLOT_POINT_ORDER.map((points) => {
          const selectedElsewhere = new Set(
            Object.entries(slots)
              .filter(([value, entryId]) => Number(value) !== points && entryId)
              .map(([, entryId]) => entryId),
          );

          return (
            <li key={points} className="grid gap-3 sm:grid-cols-[4rem_1fr] sm:items-center">
              <span className="text-sm font-semibold tracking-[0.18em] text-gold-light">
                {points}
              </span>
              <div className="space-y-1">
                <label htmlFor={`vote-${points}`} className="sr-only">
                  Country for {points} points
                </label>
                <select
                  id={`vote-${points}`}
                  required
                  value={slots[points] ?? ""}
                  onChange={(event) => updateSlot(points, event.target.value)}
                  className="field-input min-h-11"
                >
                  <option value="">Select country</option>
                  {entries.map((entry) => (
                    <option
                      key={entry.id}
                      value={entry.id}
                      disabled={selectedElsewhere.has(entry.id)}
                    >
                      {entry.flagEmoji} {entry.name}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          );
        })}
      </ol>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={isSubmitting} className="btn-primary">
        {isSubmitting ? "Submitting…" : "Submit vote"}
      </button>
    </form>
  );
}
