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
      setMessage("Join link copied.");
    } catch {
      setError("Could not copy link. Copy the URL below manually.");
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
      setMessage(`Now: ${STATE_LABELS[nextState] ?? nextState}.`);
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
    <div className="space-y-8">
      <section className="panel space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3">
            <p className="eyebrow">Party code</p>
            <p className="gold-code">{data.party.code}</p>
            <p className="text-sm text-muted">
              Status{" "}
              <span className="text-foreground">
                {STATE_LABELS[data.party.state] ?? data.party.state}
              </span>
            </p>
            {data.viewer.participant ? (
              <p className="text-sm text-muted">
                Signed in as{" "}
                <span className="text-foreground">
                  {data.viewer.participant.nickname}
                </span>
                {data.viewer.participant.isHost ? " · host" : ""}
              </p>
            ) : null}
          </div>

          {data.viewer.isHost ? (
            <div className="flex min-w-[12rem] flex-col gap-3">
              <button type="button" onClick={copyJoinLink} className="btn-secondary">
                Copy join link
              </button>
              <p className="break-all text-xs leading-5 text-muted">{joinUrl}</p>
            </div>
          ) : null}
        </div>
      </section>

      {data.viewer.isHost ? (
        <section aria-labelledby="host-controls-heading" className="panel space-y-4">
          <h2 id="host-controls-heading" className="display-serif text-2xl">
            Host controls
          </h2>
          <div className="flex flex-wrap gap-3">
            {data.party.state === "draft" ? (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => updateState("lobby")}
                className="btn-secondary"
              >
                Open lobby
              </button>
            ) : null}
            {data.party.state === "lobby" ? (
              <button
                type="button"
                disabled={isUpdating || data.entries.length < MIN_PARTY_ENTRIES}
                onClick={() => updateState("voting_open")}
                className="btn-primary"
              >
                Start voting
              </button>
            ) : null}
          </div>
          {data.party.state === "lobby" &&
          data.entries.length < MIN_PARTY_ENTRIES ? (
            <p className="text-sm text-muted">
              Add {MIN_PARTY_ENTRIES - data.entries.length} more{" "}
              {MIN_PARTY_ENTRIES - data.entries.length === 1 ? "country" : "countries"}.
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
        <section className="panel">
          <h2 className="display-serif text-2xl">Countries</h2>
          <ul className="mt-4">
            {data.entries.map((entry) => (
              <li key={entry.id} className="list-row">
                <span className="flex items-center gap-3">
                  <span aria-hidden="true">{entry.flagEmoji}</span>
                  <span>{entry.name}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="participants-heading" className="panel">
        <h2 id="participants-heading" className="display-serif text-2xl">
          Jury
        </h2>
        <ul className="mt-2" aria-live="polite">
          {data.participants.map((participant) => (
            <li key={participant.id} className="list-row">
              <span className="text-foreground">
                {participant.nickname}
                {participant.isHost ? (
                  <span className="text-muted"> · host</span>
                ) : null}
              </span>
              <span className="text-sm text-muted">
                {participant.hasVoted ? (
                  <span className="text-success">Voted</span>
                ) : (
                  "Waiting"
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {message ? (
        <p role="status" className="text-center text-sm text-success">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-center text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
