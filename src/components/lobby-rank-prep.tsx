"use client";

import { BallotRankHelper } from "@/components/ballot-rank-helper";
import { MIN_PARTY_ENTRIES } from "@/lib/party/constants";
import type { SerializedEntry } from "@/lib/party/types";
import { useState } from "react";

type LobbyRankPrepProps = {
  partyCode: string;
  entries: SerializedEntry[];
};

export function LobbyRankPrep({ partyCode, entries }: LobbyRankPrepProps) {
  const [message, setMessage] = useState<string | null>(null);

  if (entries.length < MIN_PARTY_ENTRIES) {
    return null;
  }

  return (
    <div className="space-y-3">
      <BallotRankHelper
        key={entries.map((entry) => entry.id).join("-")}
        partyCode={partyCode}
        entries={entries}
        lobbyPrep
        alwaysOpen
        fullSize
        applyLabel="Save my ranking"
        onApply={() => {
          setMessage("Ranking saved — it will pre-fill your ballot when voting opens.");
        }}
      />
      {message ?
        <p role="status" className="text-sm text-gold-light">
          {message}
        </p>
      : null}
    </div>
  );
}
