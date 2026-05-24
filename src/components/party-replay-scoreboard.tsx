"use client";

import { ScoreboardRow } from "@/components/scoreboard-row";
import { splitIntoColumns } from "@/lib/party/presentation";
import type { PartyScoreboardRow } from "@/lib/party/score-aggregation";

type PartyReplayScoreboardProps = {
  rows: PartyScoreboardRow[];
};

export function PartyReplayScoreboard({ rows }: PartyReplayScoreboardProps) {
  const entries = rows.map((row) => ({
    entryId: row.entryId,
    name: row.name,
    flagEmoji: row.flagEmoji,
    sortOrder: row.sortOrder,
    totalPoints: row.totalPoints,
  }));

  const [leftColumn, rightColumn] = splitIntoColumns(entries);
  const winnerId = rows[0]?.totalPoints > 0 ? rows[0].entryId : undefined;

  return (
    <section aria-label="Final results" className="ev-scoreboard presentation-page__scoreboard">
      <div className="ev-scoreboard__column">
        {leftColumn.map((entry) => (
          <ScoreboardRow
            key={entry.entryId}
            entry={entry}
            visualState={entry.entryId === winnerId ? { goldCard: true } : undefined}
          />
        ))}
      </div>
      <div className="ev-scoreboard__column">
        {rightColumn.map((entry) => (
          <ScoreboardRow
            key={entry.entryId}
            entry={entry}
            visualState={entry.entryId === winnerId ? { goldCard: true } : undefined}
          />
        ))}
      </div>
    </section>
  );
}
