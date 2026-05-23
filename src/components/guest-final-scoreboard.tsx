"use client";

import { PartyScoreboard, type ScoreboardRow } from "@/components/party-scoreboard";
import { usePartySocket } from "@/hooks/use-party-socket";
import type { VotingStatusPayload } from "@/lib/socket/party-events";
import { useCallback, useEffect, useState } from "react";

type GuestFinalScoreboardProps = {
  partyCode: string;
  partyId: string;
};

export function GuestFinalScoreboard({ partyCode, partyId }: GuestFinalScoreboardProps) {
  const [rows, setRows] = useState<ScoreboardRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadScores = useCallback(async () => {
    const response = await fetch(`/api/parties/${partyCode}/scores`);
    const data = (await response.json()) as { scores: ScoreboardRow[]; error?: string };

    if (!response.ok) {
      throw new Error(data.error ?? "Could not load final results");
    }

    return data.scores;
  }, [partyCode]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const scores = await loadScores();
        if (!cancelled) {
          setRows(scores);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Could not load final results",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadScores]);

  usePartySocket({
    partyId,
    onVotingStatus: (payload: VotingStatusPayload) => {
      if (payload.party.state === "finished") {
        void loadScores()
          .then((scores) => {
            setRows(scores);
          })
          .catch((loadError) => {
            setError(
              loadError instanceof Error ? loadError.message : "Could not load final results",
            );
          });
      }
    },
  });

  if (error) {
    return (
      <p role="alert" className="text-center text-sm text-danger">
        {error}
      </p>
    );
  }

  if (!rows) {
    return <p className="text-sm text-muted">Loading final results…</p>;
  }

  return <PartyScoreboard rows={rows} snapshot />;
}
