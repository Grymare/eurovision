"use client";

import { EntryPicker } from "@/components/entry-picker";
import { MIN_PARTY_ENTRIES } from "@/lib/party/constants";
import type { PartyOverviewResponse } from "@/lib/party/types";
import { useCallback, useEffect, useState } from "react";

type PartyLobbyProps = {
  partyId: string;
  initialData: PartyOverviewResponse;
};

const STATE_LABELS: Record<string, string> = {
  draft: "Draft",
  lobby: "Lobby open",
  voting_open: "Voting open",
  voting_closed: "Voting closed",
  presenting: "Presentation",
  finished: "Finished",
};

export function PartyLobby({ partyId, initialData }: PartyLobbyProps) {
  const [data, setData] = useState(initialData);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/parties/${partyId}`);
    const nextData = await response.json();

    if (response.ok) {
      setData(nextData);
    }
  }, [partyId]);

  useEffect(() => {
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${data.party.code}`
      : `/join/${data.party.code}`;

  async function copyJoinLink() {
    setError(null);
    setMessage(null);

    try {
      await navigator.clipboard.writeText(joinUrl);
      setMessage("Join link copied to clipboard.");
    } catch {
      setError("Could not copy link. You can copy it manually below.");
    }
  }

  async function updateState(nextState: string) {
    setIsUpdating(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/parties/${partyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: nextState }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Could not update party state");
      }

      await refresh();
      setMessage(`Party is now: ${STATE_LABELS[nextState] ?? nextState}.`);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Could not update party state",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  const canEditEntries =
    data.viewer.isHost &&
    (data.party.state === "draft" || data.party.state === "lobby");

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300">
              Party code
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-[0.25em]">
              {data.party.code}
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Status:{" "}
              <strong>{STATE_LABELS[data.party.state] ?? data.party.state}</strong>
            </p>
            {data.viewer.participant ? (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                You are logged in as{" "}
                <strong>{data.viewer.participant.nickname}</strong>
                {data.viewer.participant.isHost ? " (host)" : ""}.
              </p>
            ) : null}
          </div>

          {data.viewer.isHost ? (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={copyJoinLink}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
              >
                Copy join link
              </button>
              <p className="break-all text-xs text-zinc-500">{joinUrl}</p>
            </div>
          ) : null}
        </div>
      </section>

      {data.viewer.isHost ? (
        <section
          aria-labelledby="host-controls-heading"
          className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 id="host-controls-heading" className="text-lg font-semibold">
            Host controls
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.party.state === "draft" ? (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => updateState("lobby")}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Open lobby
              </button>
            ) : null}
            {data.party.state === "lobby" ? (
              <button
                type="button"
                disabled={isUpdating || data.entries.length < MIN_PARTY_ENTRIES}
                onClick={() => updateState("voting_open")}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-60"
              >
                Start voting
              </button>
            ) : null}
          </div>
          {data.party.state === "lobby" &&
          data.entries.length < MIN_PARTY_ENTRIES ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Add {MIN_PARTY_ENTRIES - data.entries.length} more{" "}
              {MIN_PARTY_ENTRIES - data.entries.length === 1 ? "country" : "countries"}{" "}
              to start voting.
            </p>
          ) : null}
        </section>
      ) : null}

      {data.viewer.isHost ? (
        <EntryPicker
          partyId={partyId}
          initialEntries={data.entries}
          canEdit={canEditEntries}
          onChange={refresh}
        />
      ) : (
        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">Countries</h2>
          <ul className="mt-3 space-y-2">
            {data.entries.map((entry) => (
              <li key={entry.id} className="flex items-center gap-2 text-base">
                <span aria-hidden="true">{entry.flagEmoji}</span>
                <span>{entry.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section
        aria-labelledby="participants-heading"
        className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 id="participants-heading" className="text-lg font-semibold">
          Participants
        </h2>
        <ul className="mt-3 space-y-2" aria-live="polite">
          {data.participants.map((participant) => (
            <li
              key={participant.id}
              className="flex items-center justify-between gap-3 rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-950"
            >
              <span>
                {participant.nickname}
                {participant.isHost ? " (host)" : ""}
              </span>
              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                {participant.hasVoted ? "Voted" : "Not voted yet"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {message ? (
        <p role="status" className="text-sm text-green-700 dark:text-green-300">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
