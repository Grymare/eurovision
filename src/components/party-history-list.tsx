"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CountryFlag } from "@/components/country-flag";
import type { FinishedPartySummary } from "@/lib/party/history";
import { Trash2 } from "lucide-react";
import { useState } from "react";

type PartyHistoryListProps = {
  parties: FinishedPartySummary[];
  emptyMessage: string;
  allowRemove?: boolean;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function partyHeading(party: FinishedPartySummary) {
  const title = party.title?.trim();

  if (title) {
    return title;
  }

  if (party.winner) {
    return `${party.winner.name} wins`;
  }

  return "Finished party";
}

export function PartyHistoryList({
  parties,
  emptyMessage,
  allowRemove = false,
}: PartyHistoryListProps) {
  const router = useRouter();
  const [removingCode, setRemovingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove(party: FinishedPartySummary) {
    const label = partyHeading(party);
    const confirmed = window.confirm(
      `Remove "${label}" from history? This permanently deletes the party, votes, and results.`,
    );

    if (!confirmed) {
      return;
    }

    setRemovingCode(party.code);
    setError(null);

    try {
      const response = await fetch(`/api/admin/parties/${party.code}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not remove party");
      }

      router.refresh();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Could not remove party");
    } finally {
      setRemovingCode(null);
    }
  }

  if (parties.length === 0) {
    return <p className="text-sm text-muted">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {error ?
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      : null}

      <ul className="history-list" aria-label="Finished parties">
        {parties.map((party) => (
          <li key={party.id} className="history-list__item">
            <div className="history-list__row">
              <Link href={`/history/${party.code}`} className="history-list__link">
                <div className="history-list__primary">
                  <p className="history-list__title">{partyHeading(party)}</p>
                  <p className="history-list__meta">
                    {formatDate(party.finishedAt)} · {party.participantCount} jurors ·{" "}
                    {party.voteCount} ballots
                  </p>
                </div>
                <div className="history-list__winner">
                  {party.winner ?
                    <>
                      <span className="history-list__winner-label">Winner</span>
                      <span className="history-list__winner-country">
                        <CountryFlag name={party.winner.name} flagEmoji={party.winner.flagEmoji} />
                        <span>{party.winner.name}</span>
                      </span>
                      <span className="history-list__winner-points">
                        {party.winner.totalPoints} pts
                      </span>
                    </>
                  : <span className="text-sm text-muted">No winner recorded</span>}
                </div>
              </Link>

              {allowRemove ?
                <button
                  type="button"
                  className="btn-icon history-list__remove"
                  disabled={removingCode === party.code}
                  aria-label={`Remove ${partyHeading(party)} from history`}
                  onClick={() => void handleRemove(party)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
