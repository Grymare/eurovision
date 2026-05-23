"use client";

import { EntryPicker } from "@/components/entry-picker";
import { CountryFlag } from "@/components/country-flag";
import { GuestFinalScoreboard } from "@/components/guest-final-scoreboard";
import { VoteBallot } from "@/components/vote-ballot";
import { usePartySocket } from "@/hooks/use-party-socket";
import { canRemoveParticipant, isPartyState, MIN_BALLOT_ENTRIES } from "@/lib/party/constants";
import type { PartyOverviewResponse } from "@/lib/party/types";
import type { SerializedVote } from "@/lib/party/types";
import type {
  VoteSubmittedPayload,
  VotingStatusPayload,
} from "@/lib/socket/party-events";
import Link from "next/link";
import { UserMinus } from "lucide-react";
import { useCallback, useState } from "react";

type PartyLobbyProps = {
  initialData: PartyOverviewResponse;
  devMockDataEnabled?: boolean;
};

const STATE_LABELS: Record<string, string> = {
  draft: "Draft",
  lobby: "Lobby open",
  voting_open: "Voting open",
  voting_closed: "Voting closed",
  presenting: "Presentation",
  finished: "Finished",
};

export function PartyLobby({ initialData, devMockDataEnabled = false }: PartyLobbyProps) {
  const [data, setData] = useState(initialData);
  const partyCode = data.party.code;
  const partyId = data.party.id;
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [removingParticipantId, setRemovingParticipantId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/parties/${partyCode}`);
    const nextData = await response.json();

    if (response.ok) {
      setData(nextData);
    }
  }, [partyCode]);

  const applyVotingStatus = useCallback((payload: VotingStatusPayload) => {
    setData((prev) => {
      const viewerParticipant =
        prev.viewer.participant ?
          payload.participants.find(
            (participant) => participant.id === prev.viewer.participant!.id,
          ) ?? prev.viewer.participant
        : null;

      return {
        ...prev,
        party: {
          ...prev.party,
          state: payload.party.state,
          updatedAt: payload.party.updatedAt,
        },
        entries: payload.entries,
        participants: payload.participants,
        viewer: {
          ...prev.viewer,
          participant: viewerParticipant,
          vote:
            viewerParticipant && prev.viewer.vote ?
              { ...prev.viewer.vote, hasVoted: viewerParticipant.hasVoted }
            : prev.viewer.vote,
        },
      };
    });
  }, []);

  const applyVoteSubmitted = useCallback((payload: VoteSubmittedPayload) => {
    setData((prev) => ({
      ...prev,
      participants: prev.participants.map((participant) =>
        participant.id === payload.participantId ?
          { ...participant, hasVoted: true }
        : participant,
      ),
      viewer: {
        ...prev.viewer,
        participant:
          prev.viewer.participant?.id === payload.participantId ?
            { ...prev.viewer.participant, hasVoted: true }
          : prev.viewer.participant,
      },
    }));
  }, []);

  const handleVoteSubmitted = useCallback((vote: SerializedVote) => {
    setData((prev) => {
      const participantId = prev.viewer.participant?.id;

      return {
        ...prev,
        participants: prev.participants.map((participant) =>
          participant.id === participantId ?
            { ...participant, hasVoted: true }
          : participant,
        ),
        viewer: {
          ...prev.viewer,
          participant:
            prev.viewer.participant ?
              { ...prev.viewer.participant, hasVoted: true }
            : null,
          vote,
        },
      };
    });
  }, []);

  usePartySocket({
    partyId,
    onVotingStatus: applyVotingStatus,
    onVoteSubmitted: applyVoteSubmitted,
  });

  const joinPath = `/join/${data.party.code}`;
  const presentationPath = `/party/${partyCode}/presentation`;

  async function copyJoinLink() {
    setError(null);
    setMessage(null);

    try {
      await navigator.clipboard.writeText(`${window.location.origin}${joinPath}`);
      setMessage("Join link copied.");
    } catch {
      setError("Could not copy link.");
    }
  }

  async function removeParticipant(participantId: string, nickname: string) {
    const confirmed = window.confirm(
      `Remove ${nickname} from the jury? They will lose access to this party.`,
    );

    if (!confirmed) {
      return;
    }

    setRemovingParticipantId(participantId);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/parties/${partyCode}/participants/${participantId}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Could not remove jury member");
      }

      await refresh();
      setMessage(`${nickname} was removed from the jury.`);
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Could not remove jury member",
      );
    } finally {
      setRemovingParticipantId(null);
    }
  }

  async function updateState(nextState: string) {
    setIsUpdating(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/parties/${partyCode}`, {
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

  const showBallot =
    data.viewer.participant &&
    (data.party.state === "voting_open" || data.party.state === "voting_closed");
  const votingLocked = data.party.state !== "voting_open";

  const canRemoveJuryMembers =
    data.viewer.isHost &&
    isPartyState(data.party.state) &&
    canRemoveParticipant(data.party.state);

  if (data.party.state === "presenting" && !data.viewer.isHost) {
    return (
      <section className="section-block space-y-4 text-center">
        <h2 className="section-heading">Presentation in progress</h2>
        <p className="text-muted">
          The host is revealing votes on the presentation screen. Final results will appear here
          when the show is over.
        </p>
      </section>
    );
  }

  if (data.party.state === "finished") {
    return (
      <section className="section-block space-y-6">
        <div className="space-y-3 text-center">
          <p className="eyebrow">Final results</p>
          <h2 className="section-heading">The party is finished</h2>
        </div>
        <GuestFinalScoreboard partyCode={partyCode} partyId={partyId} />
      </section>
    );
  }

  return (
    <>
      <section className="section-block space-y-6">
        <div className="space-y-3">
          <p className="eyebrow">Party code</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p
              className={
                data.viewer.isHost ?
                  "gold-code"
                : "font-mono text-lg font-medium uppercase tracking-[0.18em] text-foreground sm:text-xl"
              }
            >
              {data.party.code}
            </p>
            {data.viewer.isHost ?
              <button type="button" onClick={copyJoinLink} className="btn-secondary shrink-0">
                Copy join link
              </button>
            : null}
          </div>
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
      </section>

      {data.viewer.isHost ? (
        <section aria-labelledby="host-controls-heading" className="section-block space-y-4">
          <h2 id="host-controls-heading" className="section-heading">
            Host controls
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            {data.party.state === "draft" ?
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => updateState("lobby")}
                className="btn-primary"
              >
                Open lobby
              </button>
            : data.party.state === "lobby" ?
              <button
                type="button"
                disabled={isUpdating || data.entries.length < MIN_BALLOT_ENTRIES}
                onClick={() => updateState("voting_open")}
                className="btn-primary"
              >
                Start voting
              </button>
            : data.party.state === "voting_open" ?
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => updateState("voting_closed")}
                className="btn-primary"
              >
                Close voting
              </button>
            : data.party.state === "voting_closed" ?
              <>
                <Link href={presentationPath} className="btn-primary">
                  Open presentation
                </Link>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => updateState("voting_open")}
                  className="btn-secondary"
                >
                  Reopen voting
                </button>
              </>
            : data.party.state === "presenting" ?
              <Link href={presentationPath} className="btn-primary">
                Return to presentation
              </Link>
            : null}
          </div>
          {data.party.state === "lobby" &&
          data.entries.length < MIN_BALLOT_ENTRIES ? (
            <p className="text-sm text-muted">
              Add {MIN_BALLOT_ENTRIES - data.entries.length} more{" "}
              {MIN_BALLOT_ENTRIES - data.entries.length === 1 ? "country" : "countries"}{" "}
              before voting (need {MIN_BALLOT_ENTRIES} for a full ballot).
            </p>
          ) : null}
        </section>
      ) : null}

      {showBallot ? (
        <section className="section-block">
          <VoteBallot
            partyCode={partyCode}
            entries={data.entries}
            initialVote={data.viewer.vote}
            votingLocked={votingLocked}
            devMockDataEnabled={devMockDataEnabled}
            onSubmitted={handleVoteSubmitted}
          />
        </section>
      ) : null}

      {data.viewer.isHost ? (
        <EntryPicker
          partyCode={partyCode}
          initialEntries={data.entries}
          canEdit={canEditEntries}
          devMockDataEnabled={devMockDataEnabled}
          onChange={refresh}
        />
      ) : (
        <section className="section-block">
          <h2 className="section-heading">Countries</h2>
          <ul className="mt-4">
            {data.entries.map((entry) => (
              <li key={entry.id} className="list-row">
                <span className="flex items-center gap-3">
                  <CountryFlag name={entry.name} flagEmoji={entry.flagEmoji} />
                  <span>{entry.name}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="participants-heading" className="section-block">
        <h2 id="participants-heading" className="section-heading">
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
              <span className="flex items-center gap-3">
                <span className="text-sm text-muted">
                  {participant.hasVoted ? (
                    <span className="text-success">Voted</span>
                  ) : (
                    "Waiting"
                  )}
                </span>
                {canRemoveJuryMembers && !participant.isHost ?
                  <button
                    type="button"
                    onClick={() => removeParticipant(participant.id, participant.nickname)}
                    disabled={removingParticipantId === participant.id}
                    className="btn-icon"
                    aria-label={`Remove ${participant.nickname} from jury`}
                  >
                    <UserMinus aria-hidden="true" className="h-4 w-4" />
                  </button>
                : null}
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
    </>
  );
}
