"use client";

import { CountryFlag } from "@/components/country-flag";
import "@/components/design/scoreboard-variants.css";
import type { ScoreboardEntry } from "@/lib/party/presentation";

export type ScoreboardRowVisualState = {
  activePoints?: number | null;
  goldAnimating?: boolean;
  goldCard?: boolean;
};

type ScoreboardRowProps = {
  entry: ScoreboardEntry;
  layoutId?: string;
  visualState?: ScoreboardRowVisualState;
};

function rowClassName(visualState?: ScoreboardRowVisualState) {
  const classes = ["sb-var__row"];

  if (visualState?.goldCard) {
    classes.push("sb-var__row--gold");
  }

  if (visualState?.goldAnimating) {
    classes.push("sb-var__row--celebrating");
  }

  return classes.join(" ");
}

export function ScoreboardRow({ entry, layoutId, visualState }: ScoreboardRowProps) {
  const activePoints = visualState?.activePoints;
  const showRound = activePoints != null && activePoints > 0;

  return (
    <div
      className="sb-var"
      data-variant="A"
      data-entry-id={entry.entryId}
      data-layout-id={layoutId ?? entry.entryId}
    >
      <div className={rowClassName(visualState)}>
        {visualState?.goldAnimating ?
          <div className="sb-var__celebration" aria-hidden="true">
            <span className="sb-var__gold-sweep" />
            <span className="sb-var__glitter" />
          </div>
        : null}
        <div className="sb-var__flag">
          <CountryFlag
            name={entry.name}
            flagEmoji={entry.flagEmoji}
            className="sb-var__flag-icon"
          />
        </div>
        <div className="sb-var__body">
          <span className="sb-var__name">{entry.name}</span>
          <span className="sb-var__score-wrap">
            {showRound ?
              <span className="sb-var__round">{activePoints}</span>
            : <span aria-hidden="true" className="sb-var__round sb-var__round--empty" />}
            <span aria-hidden="true" className="sb-var__score-divider" />
            <span className="sb-var__score">{entry.totalPoints}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
