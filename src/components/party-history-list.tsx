import Link from "next/link";
import { CountryFlag } from "@/components/country-flag";
import type { FinishedPartySummary } from "@/lib/party/history";

type PartyHistoryListProps = {
  parties: FinishedPartySummary[];
  emptyMessage: string;
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

export function PartyHistoryList({ parties, emptyMessage }: PartyHistoryListProps) {
  if (parties.length === 0) {
    return <p className="text-sm text-muted">{emptyMessage}</p>;
  }

  return (
    <ul className="history-list" aria-label="Finished parties">
      {parties.map((party) => (
        <li key={party.id} className="history-list__item">
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
        </li>
      ))}
    </ul>
  );
}
