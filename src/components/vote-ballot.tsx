"use client";

import { CountrySelect } from "@/components/country-select";
import { CountryFlag } from "@/components/country-flag";
import { MIN_PARTY_ENTRIES } from "@/lib/party/constants";
import { buildDevBallotAllocations } from "@/lib/party/dev-ballot";
import type { VoteAllocations } from "@/db/schema";
import type { SerializedVote } from "@/lib/party/types";
import {
  BALLOT_POINT_ORDER,
  validateVoteAllocations,
} from "@/lib/party/vote-validation";
import type { SerializedEntry } from "@/lib/party/types";
import { useState } from "react";

type VoteBallotProps = {
  partyCode: string;
  entries: SerializedEntry[];
  initialVote: SerializedVote | null;
  votingLocked?: boolean;
  devMockDataEnabled?: boolean;
  onSubmitted?: (vote: SerializedVote) => void;
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

function BallotSummary({
  slots,
  entries,
}: {
  slots: Record<number, string>;
  entries: SerializedEntry[];
}) {
  const entryById = new Map(entries.map((entry) => [entry.id, entry]));

  return (
    <ol className="mt-4 space-y-2">
      {BALLOT_POINT_ORDER.map((points) => {
        const entryId = slots[points];
        const entry = entryId ? entryById.get(entryId) : null;

        if (!entry) {
          return null;
        }

        return (
          <li key={points} className="list-row">
            <span className="flex min-w-[3rem] items-center gap-3">
              <span className="text-sm font-semibold tracking-[0.18em] text-gold-light">
                {points}
              </span>
              <CountryFlag name={entry.name} flagEmoji={entry.flagEmoji} />
              <span>{entry.name}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function VoteBallot({
  partyCode,
  entries,
  initialVote,
  votingLocked = false,
  devMockDataEnabled = false,
  onSubmitted,
}: VoteBallotProps) {
  const [mode, setMode] = useState<BallotMode>(() => initialMode(initialVote));
  const [slots, setSlots] = useState(() => initialSlots(initialVote));
  const [submittedSlots, setSubmittedSlots] = useState(() => initialSlots(initialVote));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasSubmittedVote = Boolean(initialVote?.hasVoted);
  const showWaitingView = mode === "waiting" || (votingLocked && hasSubmittedVote);

  function updateSlot(points: number, entryId: string) {
    setSlots((current) => ({ ...current, [points]: entryId }));
    setError(null);
  }

  async function submitAllocations(allocations: VoteAllocations) {
    setIsSubmitting(true);
    setError(null);

    const clientError = validateVoteAllocations(allocations, entries);

    if (clientError) {
      setError(clientError);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/parties/${partyCode}/vote`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocations }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Could not submit vote");
      }

      const submittedVote: SerializedVote = {
        hasVoted: true,
        allocations: result.allocations,
      };

      setSlots(slotsFromAllocations(allocations));
      setSubmittedSlots(slotsFromAllocations(allocations));
      setMode("waiting");
      onSubmitted?.(submittedVote);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Could not submit vote",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitAllocations(allocationsFromSlots(slots));
  }

  async function handleDevFillAndSubmit() {
    const allocations = buildDevBallotAllocations(entries.map((entry) => entry.id));

    if (!allocations) {
      setError(`Need at least ${MIN_PARTY_ENTRIES} countries for a dev ballot.`);
      return;
    }

    setSlots(slotsFromAllocations(allocations));
    await submitAllocations(allocations);
  }

  if (entries.length < MIN_PARTY_ENTRIES) {
    return (
      <p className="text-sm text-muted">
        Waiting for at least {MIN_PARTY_ENTRIES} countries before ballots open.
      </p>
    );
  }

  if (votingLocked && !hasSubmittedVote) {
    return (
      <p className="text-sm text-muted">Voting is closed.</p>
    );
  }

  if (showWaitingView) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="section-heading text-base">Your ballot</h3>
          <p role="status" className="text-sm text-success">
            {votingLocked ?
              "Your vote is in. Ballots are locked."
            : "Your vote is in. Waiting for the rest of the jury."}
          </p>
        </div>
        <BallotSummary slots={slots} entries={entries} />
        {!votingLocked ?
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setMode("confirm-edit")}
          >
            Edit my vote
          </button>
        : null}
      </div>
    );
  }

  if (mode === "confirm-edit") {
    return (
      <div className="space-y-4" role="dialog" aria-labelledby="confirm-edit-heading">
        <div className="space-y-2">
          <h3 className="section-heading text-base">Current vote</h3>
          <BallotSummary slots={submittedSlots} entries={entries} />
        </div>
        <h3 id="confirm-edit-heading" className="section-heading text-base">
          Edit your vote?
        </h3>
        <p className="text-sm leading-6 text-muted">
          You will replace your current ballot. This only affects your own scores.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setSlots(submittedSlots);
              setMode("editing");
            }}
          >
            Yes, edit ballot
          </button>
          <button type="button" className="btn-secondary" onClick={() => setMode("waiting")}>
            Keep current vote
          </button>
        </div>
      </div>
    );
  }

  const isEditingSubmittedVote = hasSubmittedVote && mode === "editing";

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-labelledby="ballot-heading">
      <div className="space-y-2">
        <h3 id="ballot-heading" className="section-heading">
          {isEditingSubmittedVote ? "Edit your vote" : "Your ballot"}
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
                <CountrySelect
                  id={`vote-${points}`}
                  value={slots[points] ?? ""}
                  onChange={(entryId) => updateSlot(points, entryId)}
                  entries={entries}
                  disabledEntryIds={selectedElsewhere}
                />
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

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ?
            "Submitting…"
          : isEditingSubmittedVote ?
            "Save changes"
          : "Submit vote"}
        </button>

        {isEditingSubmittedVote ?
          <button
            type="button"
            disabled={isSubmitting}
            className="btn-secondary"
            onClick={() => {
              setSlots(submittedSlots);
              setMode("waiting");
            }}
          >
            Cancel
          </button>
        : null}

        {devMockDataEnabled ?
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleDevFillAndSubmit}
            className="btn-secondary"
          >
            {isSubmitting ? "Submitting…" : "Dev: fill & submit ballot"}
          </button>
        : null}
      </div>
    </form>
  );
}
