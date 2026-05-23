"use client";

import { ScoreboardRow, type ScoreboardRowVisualState } from "@/components/scoreboard-row";
import {
  rankScoreboardEntries,
  splitIntoColumns,
  type ScoreboardEntry,
} from "@/lib/party/presentation";
import { useMemo } from "react";

type EurovisionScoreboardProps = {
  entries: Array<{
    id: string;
    name: string;
    flagEmoji: string;
    sortOrder: number;
  }>;
  runningTotals: Record<string, number>;
  rowVisualStates?: Record<string, ScoreboardRowVisualState>;
  reordering?: boolean;
};

export function EurovisionScoreboard({
  entries,
  runningTotals,
  rowVisualStates = {},
  reordering = false,
}: EurovisionScoreboardProps) {
  const rankedEntries = useMemo(
    () => rankScoreboardEntries(entries, runningTotals),
    [entries, runningTotals],
  );
  const [leftColumn, rightColumn] = useMemo(
    () => splitIntoColumns(rankedEntries),
    [rankedEntries],
  );

  return (
    <section
      aria-label="Eurovision scoreboard"
      className={reordering ? "ev-scoreboard ev-scoreboard--reordering" : "ev-scoreboard"}
    >
      <div className="ev-scoreboard__column">
        {leftColumn.map((entry) => (
          <ScoreboardRow
            key={entry.entryId}
            entry={entry}
            layoutId={entry.entryId}
            visualState={rowVisualStates[entry.entryId]}
          />
        ))}
      </div>
      <div className="ev-scoreboard__column">
        {rightColumn.map((entry) => (
          <ScoreboardRow
            key={entry.entryId}
            entry={entry}
            layoutId={entry.entryId}
            visualState={rowVisualStates[entry.entryId]}
          />
        ))}
      </div>
    </section>
  );
}

export type { ScoreboardEntry };
