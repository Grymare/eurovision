"use client";

import { CountryFlag } from "@/components/country-flag";

export type ScoreboardRow = {
  entry: {
    id: string;
    name: string;
    flagEmoji: string;
    sortOrder: number;
  };
  totalPoints: number;
  pointReceipts: Record<string, number>;
};

type PartyScoreboardProps = {
  rows: ScoreboardRow[];
  snapshot?: boolean;
};

export function PartyScoreboard({ rows, snapshot = false }: PartyScoreboardProps) {
  const winner = rows[0];

  return (
    <section aria-labelledby="scoreboard-heading" className="presentation-scoreboard">
      <div className="presentation-scoreboard__header">
        <p className="eyebrow">{snapshot ? "Final results" : "Scoreboard"}</p>
        <h2 id="scoreboard-heading" className="presentation-scoreboard__title">
          {winner && winner.totalPoints > 0 ? (
            <>
              <span className="sr-only">Winner: </span>
              <CountryFlag name={winner.entry.name} flagEmoji={winner.entry.flagEmoji} />
              <span>{winner.entry.name}</span>
              <span className="presentation-scoreboard__winner-points">
                {winner.totalPoints} points
              </span>
            </>
          ) : (
            "Scoreboard"
          )}
        </h2>
      </div>

      <ol className="presentation-scoreboard__list" aria-label="Ranked countries">
        {rows.map((row, index) => (
          <li
            key={row.entry.id}
            className={
              index === 0 && row.totalPoints > 0 ?
                "presentation-scoreboard__row presentation-scoreboard__row--winner"
              : "presentation-scoreboard__row"
            }
          >
            <span className="presentation-scoreboard__rank" aria-hidden="true">
              {index + 1}
            </span>
            <span className="presentation-scoreboard__country">
              <CountryFlag name={row.entry.name} flagEmoji={row.entry.flagEmoji} />
              <span>{row.entry.name}</span>
            </span>
            <span className="presentation-scoreboard__points">
              <span className="sr-only">Total points: </span>
              {row.totalPoints}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
