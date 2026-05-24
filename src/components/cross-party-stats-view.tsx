import { CountryFlag } from "@/components/country-flag";
import type { CrossPartyPointsGivenCountry, CrossPartyStats } from "@/lib/party/history";

type CrossPartyStatsViewProps = {
  stats: CrossPartyStats;
  showVoterLeaderboard: boolean;
};

type PointsGivenAccordionProps = {
  id: string;
  title: string;
  meta: string;
  hint?: string;
  topCountry?: CrossPartyPointsGivenCountry | null;
  countries: CrossPartyPointsGivenCountry[];
  emptyMessage?: string;
};

function PointsGivenAccordion({
  id,
  title,
  meta,
  hint,
  topCountry,
  countries,
  emptyMessage = "No votes recorded yet.",
}: PointsGivenAccordionProps) {
  return (
    <details className="replay-accordion stats-points-accordion">
      <summary className="replay-accordion__summary" aria-labelledby={`${id}-title`}>
        <span className="replay-accordion__eyebrow">{meta}</span>
        <span id={`${id}-title`} className="replay-accordion__title">
          {title}
        </span>
        {topCountry ?
          <span className="stats-points-accordion__preview">
            Top:{" "}
            <CountryFlag name={topCountry.name} flagEmoji={topCountry.flagEmoji} />
            <span>{topCountry.name}</span>
            <span className="text-muted">· {topCountry.totalPoints} pts</span>
          </span>
        : null}
        {hint ?
          <span className="replay-accordion__hint">{hint}</span>
        : null}
      </summary>

      <div className="replay-accordion__content">
        {countries.length === 0 ?
          <p className="text-sm text-muted">{emptyMessage}</p>
        : <ol className="stats-points-list" aria-label={`${title} top countries`}>
            {countries.map((country, index) => (
              <li key={`${country.name}-${country.flagEmoji}`} className="stats-points-list__row">
                <span className="stats-points-list__rank">{index + 1}</span>
                <span className="stats-points-list__country">
                  <CountryFlag name={country.name} flagEmoji={country.flagEmoji} />
                  <span>{country.name}</span>
                </span>
                <span className="stats-points-list__points">{country.totalPoints} pts</span>
              </li>
            ))}
          </ol>
        }
      </div>
    </details>
  );
}

export function CrossPartyStatsView({ stats, showVoterLeaderboard }: CrossPartyStatsViewProps) {
  if (stats.finishedPartyCount === 0) {
    return (
      <p className="text-sm text-muted">
        No finished parties yet. Complete a ceremony to start building stats.
      </p>
    );
  }

  return (
    <div className="section-stack">
      {stats.personal ?
        <section className="section-block space-y-3">
          <p className="eyebrow">Your stats</p>
          <h2 className="section-heading">Points you gave</h2>
          <PointsGivenAccordion
            id="personal-points"
            title="Your top countries"
            meta={`${stats.personal.partiesParticipated} ${
              stats.personal.partiesParticipated === 1 ? "party" : "parties"
            }`}
            hint="Top 10 countries by total points across parties you joined"
            topCountry={stats.personal.topCountries[0] ?? null}
            countries={stats.personal.topCountries}
          />
        </section>
      : null}

      <section className="section-block space-y-4">
        <div className="space-y-2">
          <p className="eyebrow">Countries</p>
          <h2 className="section-heading">Leaderboard</h2>
          <p className="text-sm text-muted">
            Aggregated across {stats.finishedPartyCount} finished{" "}
            {stats.finishedPartyCount === 1 ? "party" : "parties"}.
          </p>
        </div>

        <ol className="stats-table" aria-label="Country leaderboard">
          {stats.countries.slice(0, 25).map((country, index) => (
            <li key={country.key} className="stats-table__row">
              <span className="stats-table__rank">{index + 1}</span>
              <span className="stats-table__label">
                <CountryFlag name={country.name} flagEmoji={country.flagEmoji} />
                <span>{country.name}</span>
              </span>
              <span className="stats-table__metric">
                {country.wins} {country.wins === 1 ? "win" : "wins"}
              </span>
              <span className="stats-table__metric">{country.totalPoints} pts</span>
              <span className="stats-table__metric">{country.douzeReceived} douze</span>
            </li>
          ))}
        </ol>
      </section>

      {showVoterLeaderboard ?
        <section className="section-block space-y-4">
          <div className="space-y-2">
            <p className="eyebrow">Juries</p>
            <h2 className="section-heading">Regular jurors</h2>
            <p className="text-sm text-muted">
              Open a juror to see their top 10 countries by total points given.
            </p>
          </div>

          <ul className="stats-voter-list">
            {stats.voters.map((voter) => (
              <li key={voter.key}>
                <PointsGivenAccordion
                  id={`voter-${voter.key}`}
                  title={voter.nickname}
                  meta={`${voter.partiesVoted} ${voter.partiesVoted === 1 ? "party" : "parties"}`}
                  topCountry={voter.topCountries[0] ?? null}
                  countries={voter.topCountries}
                />
              </li>
            ))}
          </ul>
        </section>
      : null}
    </div>
  );
}
