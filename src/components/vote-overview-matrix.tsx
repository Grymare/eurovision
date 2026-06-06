import { CountryFlag } from "@/components/country-flag";
import { resolveCountryIsoCode } from "@/lib/countries/resolve-iso-code";

export type VoteOverviewJury = {
  id: string;
  nickname: string;
  isHost: boolean;
};

export type VoteOverviewCountry = {
  rank: number;
  entryId: string;
  name: string;
  flagEmoji: string;
  totalPoints: number;
  juryPoints: Record<string, number | null>;
};

type VoteOverviewMatrixProps = {
  countries: VoteOverviewCountry[];
  juries: VoteOverviewJury[];
};

function juryLabel(jury: VoteOverviewJury) {
  const trimmed = jury.nickname.trim();

  if (trimmed.length <= 4) {
    return trimmed;
  }

  return trimmed.slice(0, 3);
}

function countryIsoCode(country: Pick<VoteOverviewCountry, "name" | "flagEmoji">) {
  return (
    resolveCountryIsoCode(country) ??
    country.name
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  );
}

function cellClassName(points: number | null) {
  if (points == null || points <= 0) {
    return "vote-matrix__cell vote-matrix__cell--empty";
  }

  if (points === 12) {
    return "vote-matrix__cell vote-matrix__cell--12";
  }

  if (points === 10) {
    return "vote-matrix__cell vote-matrix__cell--10";
  }

  if (points >= 8) {
    return "vote-matrix__cell vote-matrix__cell--high";
  }

  if (points >= 4) {
    return "vote-matrix__cell vote-matrix__cell--mid";
  }

  return "vote-matrix__cell vote-matrix__cell--low";
}

export function VoteOverviewMatrix({ countries, juries }: VoteOverviewMatrixProps) {
  if (countries.length === 0 || juries.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="vote-overview-heading" className="section-block space-y-4">
      <div className="space-y-2">
        <p className="eyebrow">All votes</p>
        <h2 id="vote-overview-heading" className="section-heading">
          Points by jury
        </h2>
      </div>

      <div className="vote-matrix-scroll">
        <table className="vote-matrix">
          <thead>
            <tr>
              <th scope="col" className="vote-matrix__th vote-matrix__th--rank">
                <span className="sr-only">Rank</span>
              </th>
              <th scope="col" className="vote-matrix__th vote-matrix__th--country">
                <span className="sr-only">Country</span>
              </th>
              {juries.map((jury) => (
                <th
                  key={jury.id}
                  scope="col"
                  className="vote-matrix__th vote-matrix__th--jury"
                  title={jury.nickname}
                >
                  <span className="vote-matrix__jury-label">{juryLabel(jury)}</span>
                </th>
              ))}
              <th scope="col" className="vote-matrix__th vote-matrix__th--total">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {countries.map((country) => (
              <tr key={country.entryId} className="vote-matrix__row">
                <th scope="row" className="vote-matrix__rank">
                  {String(country.rank).padStart(2, "0")}
                </th>
                <td className="vote-matrix__country" title={country.name}>
                  <CountryFlag
                    name={country.name}
                    flagEmoji={country.flagEmoji}
                    className="vote-matrix__country-flag"
                  />
                  <span className="vote-matrix__country-code">{countryIsoCode(country)}</span>
                  <span className="sr-only">{country.name}</span>
                </td>
                {juries.map((jury) => {
                  const points = country.juryPoints[jury.id] ?? null;

                  return (
                    <td key={jury.id} className={cellClassName(points)}>
                      {points && points > 0 ? points : null}
                    </td>
                  );
                })}
                <td className="vote-matrix__total">{country.totalPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function buildVoteOverviewData(input: {
  rows: Array<{
    entryId: string;
    name: string;
    flagEmoji: string;
    totalPoints: number;
  }>;
  juryVotes: Array<{
    participant: { id: string; nickname: string; isHost: boolean };
    allocations: Record<string, number>;
  }>;
}): { countries: VoteOverviewCountry[]; juries: VoteOverviewJury[] } {
  const juries = input.juryVotes
    .map((vote) => ({
      id: vote.participant.id,
      nickname: vote.participant.nickname,
      isHost: vote.participant.isHost,
    }))
    .sort((left, right) => left.nickname.localeCompare(right.nickname));

  const countries = input.rows.map((row, index) => {
    const juryPoints: Record<string, number | null> = {};

    for (const jury of juries) {
      const vote = input.juryVotes.find((item) => item.participant.id === jury.id);
      const points =
        vote ?
          (Object.entries(vote.allocations).find(([entryId]) => entryId === row.entryId)?.[1] ??
          null)
        : null;

      juryPoints[jury.id] = points;
    }

    return {
      rank: index + 1,
      entryId: row.entryId,
      name: row.name,
      flagEmoji: row.flagEmoji,
      totalPoints: row.totalPoints,
      juryPoints,
    };
  });

  return { countries, juries };
}
