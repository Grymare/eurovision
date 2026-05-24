import { CountryFlag } from "@/components/country-flag";
import { BALLOT_POINT_ORDER } from "@/lib/party/vote-validation";

type JuryVoteBreakdownProps = {
  juryVotes: Array<{
    participant: {
      id: string;
      nickname: string;
      isHost: boolean;
    };
    allocations: Record<string, number>;
  }>;
  entriesById: Map<
    string,
    {
      name: string;
      flagEmoji: string;
    }
  >;
};

export function JuryVoteBreakdown({ juryVotes, entriesById }: JuryVoteBreakdownProps) {
  if (juryVotes.length === 0) {
    return <p className="text-sm text-muted">No ballots were submitted for this party.</p>;
  }

  return (
    <details className="replay-accordion">
      <summary className="replay-accordion__summary">
        <span className="replay-accordion__eyebrow">Vote breakdown</span>
        <span className="replay-accordion__title">Jury ballots</span>
        <span className="replay-accordion__hint">
          Full ballots — scores were secret during voting
        </span>
      </summary>

      <div className="replay-accordion__content">
        <ul className="jury-breakdown-list">
          {juryVotes.map((vote) => {
            const slots = BALLOT_POINT_ORDER.map((points) => {
              const entryId = Object.entries(vote.allocations).find(
                ([, value]) => value === points,
              )?.[0];
              const entry = entryId ? entriesById.get(entryId) : undefined;

              return { points, entry };
            });

            return (
              <li key={vote.participant.id} className="jury-breakdown-list__item">
                <div className="jury-breakdown-list__header">
                  <h3 className="jury-breakdown-list__name">{vote.participant.nickname}</h3>
                  {vote.participant.isHost ?
                    <span className="jury-breakdown-list__meta">host</span>
                  : null}
                </div>
                <ol
                  className="jury-breakdown-list__ballot"
                  aria-label={`${vote.participant.nickname} ballot`}
                >
                  {slots.map(({ points, entry }) => (
                    <li key={points} className="jury-breakdown-list__slot">
                      <span className="jury-breakdown-list__points">{points}</span>
                      <span className="jury-breakdown-list__country">
                        {entry ?
                          <>
                            <CountryFlag name={entry.name} flagEmoji={entry.flagEmoji} />
                            <span>{entry.name}</span>
                          </>
                        : <span className="text-muted">—</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
