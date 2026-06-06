"use client";

import { ConfirmPanel } from "@/components/confirm-panel";
import { LobbyRankPrep } from "@/components/lobby-rank-prep";
import { EntryPicker } from "@/components/entry-picker";
import { Toast } from "@/components/toast";
import { VoteBallot } from "@/components/vote-ballot";
import { usePartySocket } from "@/hooks/use-party-socket";
import { canRemoveParticipant, isPartyState, MIN_PARTY_ENTRIES } from "@/lib/party/constants";
import type { PartyOverviewResponse } from "@/lib/party/types";
import type { SerializedVote } from "@/lib/party/types";
import type {
  VoteSubmittedPayload,
  VotingStatusPayload,
} from "@/lib/socket/party-events";
import Link from "next/link";
import { UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type PartyLobbyProps = {
  initialData: PartyOverviewResponse;
  devMockDataEnabled?: boolean;
};

const STATE_LABELS: Record<string, string> = {
  draft: "Lobby",
  lobby: "Lobby",
  voting_open: "Voting open",
  voting_closed: "Voting closed",
  presenting: "Presentation",
  finished: "Finished",
};

export function PartyLobby({ initialData, devMockDataEnabled = false }: PartyLobbyProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const partyCode = data.party.code;
  const partyId = data.party.id;
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [removingParticipantId, setRemovingParticipantId] = useState<string | null>(null);
  const [pendingStateChange, setPendingStateChange] = useState<{
    nextState: string;
    title: string;
    message: string;
    confirmLabel: string;
  } | null>(null);
  const [pendingEditCountries, setPendingEditCountries] = useState(false);
  const [isEditingCountries, setIsEditingCountries] = useState(false);
  const [copyToastOpen, setCopyToastOpen] = useState(false);

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

  useEffect(() => {
    if (data.party.state === "finished") {
      router.replace(`/history/${partyCode}`);
    }
  }, [data.party.state, partyCode, router]);

  const joinPath = `/join/${data.party.code}`;
  const presentationPath = `/party/${partyCode}/presentation`;

  async function copyJoinLink() {
    setError(null);
    setMessage(null);

    try {
      await navigator.clipboard.writeText(`${window.location.origin}${joinPath}`);
      setCopyToastOpen(true);
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
    setPendingStateChange(null);
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

      if (nextState === "lobby") {
        setIsEditingCountries(false);
      }

      if (nextState === "voting_open") {
        setIsEditingCountries(false);
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

  function requestStateChange(
    nextState: string,
    confirmation?: {
      title: string;
      message: string;
      confirmLabel?: string;
    },
  ) {
    if (confirmation) {
      setPendingStateChange({
        nextState,
        title: confirmation.title,
        message: confirmation.message,
        confirmLabel: confirmation.confirmLabel ?? "Continue",
      });
      return;
    }

    void updateState(nextState);
  }

  const hasSubmittedVotes = data.participants.some((participant) => participant.hasVoted);

  async function confirmEditCountries() {
    setIsUpdating(true);
    setError(null);
    setMessage(null);

    try {
      if (hasSubmittedVotes) {
        const response = await fetch(`/api/parties/${partyCode}/votes/reset`, {
          method: "POST",
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error ?? "Could not clear submitted votes");
        }
      }

      setPendingEditCountries(false);
      setIsEditingCountries(true);
      await refresh();
    } catch (editError) {
      setError(
        editError instanceof Error ? editError.message : "Could not edit countries",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  function requestEditCountries() {
    if (hasSubmittedVotes) {
      setPendingEditCountries(true);
      return;
    }

    setIsEditingCountries(true);
  }

  function finishEditingCountries() {
    setIsEditingCountries(false);
    setMessage("Country list saved.");
    setError(null);
  }

  const inSetupPhase = data.party.state === "draft" || data.party.state === "lobby";
  const autoEditCountries = inSetupPhase && data.entries.length === 0;

  const canEditEntries =
    data.viewer.isHost && inSetupPhase && (isEditingCountries || autoEditCountries);

  const showHostEntryPicker = data.viewer.isHost && inSetupPhase && canEditEntries;

  const showBallot =
    data.viewer.participant &&
    (data.party.state === "voting_open" ||
      data.party.state === "voting_closed" ||
      data.party.state === "presenting");

  const showLobbyRanker =
    data.entries.length >= MIN_PARTY_ENTRIES && !showBallot;

  const votingLocked = data.party.state !== "voting_open";

  const canRemoveJuryMembers =
    data.viewer.isHost &&
    isPartyState(data.party.state) &&
    canRemoveParticipant(data.party.state);

  if (data.party.state === "finished") {
    return null;
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
              <button
                type="button"
                onClick={copyJoinLink}
                disabled={data.entries.length < MIN_PARTY_ENTRIES}
                className="btn-secondary shrink-0"
              >
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

      {showLobbyRanker ? (
        <section className="section-block">
          <LobbyRankPrep partyCode={partyCode} entries={data.entries} />
        </section>
      ) : null}

      {data.viewer.isHost ? (
        <section aria-labelledby="host-controls-heading" className="section-block space-y-4">
          <h2 id="host-controls-heading" className="section-heading">
            Host controls
          </h2>
          {pendingStateChange ?
            <ConfirmPanel
              title={pendingStateChange.title}
              message={pendingStateChange.message}
              confirmLabel={pendingStateChange.confirmLabel}
              isBusy={isUpdating}
              onConfirm={() => updateState(pendingStateChange.nextState)}
              onCancel={() => setPendingStateChange(null)}
            />
          : pendingEditCountries ?
            <ConfirmPanel
              title="Clear submitted votes?"
              message="Editing countries will delete all submitted votes."
              confirmLabel="Yes, edit countries"
              isBusy={isUpdating}
              onConfirm={() => confirmEditCountries()}
              onCancel={() => setPendingEditCountries(false)}
            />
          : <>
          <div className="flex flex-wrap items-center gap-3">
            {data.party.state === "draft" || data.party.state === "lobby" ?
              <>
                <button
                  type="button"
                  disabled={isUpdating || data.entries.length < MIN_PARTY_ENTRIES}
                  onClick={() => updateState("voting_open")}
                  className="btn-primary"
                >
                  Start voting
                </button>
                {canEditEntries && data.entries.length > 0 ?
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={finishEditingCountries}
                    className="btn-secondary"
                  >
                    Save countries
                  </button>
                : !canEditEntries && data.entries.length > 0 ?
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={requestEditCountries}
                    className="btn-secondary"
                  >
                    Edit countries
                  </button>
                : null}
              </>
            : data.party.state === "voting_open" ?
              <>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => updateState("voting_closed")}
                  className="btn-primary"
                >
                  Close voting
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() =>
                    requestStateChange("lobby", {
                      title: "Back to setup?",
                      message:
                        "Return to setup? Use Edit countries when you are ready to change the list.",
                      confirmLabel: "Yes, go back",
                    })
                  }
                  className="btn-secondary"
                >
                  Back to setup
                </button>
              </>
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
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() =>
                    requestStateChange("lobby", {
                      title: "Back to setup?",
                      message:
                        "Return to setup? Use Edit countries when you are ready to change the list.",
                      confirmLabel: "Yes, go back",
                    })
                  }
                  className="btn-secondary"
                >
                  Back to setup
                </button>
              </>
            : data.party.state === "presenting" ?
              <>
                <Link href={presentationPath} className="btn-primary">
                  Return to presentation
                </Link>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() =>
                    requestStateChange("voting_closed", {
                      title: "Back to closed voting?",
                      message: "Presentation progress will be reset.",
                      confirmLabel: "Yes, go back",
                    })
                  }
                  className="btn-secondary"
                >
                  Back to closed voting
                </button>
              </>
            : null}
          </div>
          {(data.party.state === "draft" || data.party.state === "lobby") &&
          data.entries.length < MIN_PARTY_ENTRIES ?
            <p className="text-sm text-muted">
              Add {MIN_PARTY_ENTRIES - data.entries.length} more{" "}
              {MIN_PARTY_ENTRIES - data.entries.length === 1 ? "country" : "countries"}{" "}
              before guests can join and voting can start (need {MIN_PARTY_ENTRIES}).
            </p>
          : null}
          </>}
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

      {showHostEntryPicker ?
        <EntryPicker
          partyCode={partyCode}
          initialEntries={data.entries}
          canEdit
          devMockDataEnabled={devMockDataEnabled}
          onChange={refresh}
        />
      : null}

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
                    <span className="text-gold-light">Voted</span>
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
        <p role="status" className="text-center text-sm text-gold-light">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-center text-sm text-danger">
          {error}
        </p>
      ) : null}
      {copyToastOpen ?
        <Toast message="Join link copied" onDismiss={() => setCopyToastOpen(false)} />
      : null}
    </>
  );
}
