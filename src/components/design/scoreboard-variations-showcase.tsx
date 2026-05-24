"use client";

import { CountryFlag } from "@/components/country-flag";
import { useState } from "react";
import "./scoreboard-variants.css";

export type ScoreboardVariationId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I";

type Variation = {
  id: ScoreboardVariationId;
  title: string;
  notes: string;
};

const variations: Variation[] = [
  {
    id: "A",
    title: "Full-height flag column",
    notes:
      "Refined H baseline. Flag spans the row; round points and total sit side by side with a short gold rule between them.",
  },
  {
    id: "B",
    title: "Flag outside · matched height",
    notes: "Flag sits outside the frame but stretches to the same height as the row body.",
  },
  {
    id: "C",
    title: "Primary gold frame",
    notes: "Strong metallic border with gold-tinted type. Same score split as H.",
  },
  {
    id: "D",
    title: "Flag overlap · tucked",
    notes: "Flag overlaps the frame edge; name gets extra breathing room from the flag.",
  },
  {
    id: "E",
    title: "Compact one-screen",
    notes: "Shorter rows to fit more countries on a TV without scrolling.",
  },
  {
    id: "F",
    title: "Flag cell · name divider",
    notes: "Flag in its own cell with a vertical gold rule before the country name.",
  },
  {
    id: "G",
    title: "Score panel tint",
    notes: "Darker strip behind round points and total; divider stays short and centered.",
  },
  {
    id: "H",
    title: "Open lines · muted frame",
    notes: "Your preferred direction. Muted gold border, generous name spacing, balanced score pair.",
  },
  {
    id: "I",
    title: "Wide score rail",
    notes: "Extra horizontal room for the round/total pair; divider slightly thinner.",
  },
];

const sample = {
  name: "Germany",
  flagEmoji: "🇩🇪",
  total: 42,
  roundPoints: 10,
};

const densityPreview = [
  { name: "Germany", flagEmoji: "🇩🇪", total: 42, roundPoints: 8 },
  { name: "Norway", flagEmoji: "🇳🇴", total: 38, roundPoints: 6 },
  { name: "Italy", flagEmoji: "🇮🇹", total: 35, roundPoints: 10 },
  { name: "France", flagEmoji: "🇫🇷", total: 31, roundPoints: 4 },
  { name: "Spain", flagEmoji: "🇪🇸", total: 28, roundPoints: 7 },
  { name: "Sweden", flagEmoji: "🇸🇪", total: 24, roundPoints: 3 },
  { name: "Greece", flagEmoji: "🇬🇷", total: 21, roundPoints: 5 },
  { name: "Portugal", flagEmoji: "🇵🇹", total: 18, roundPoints: 2 },
  { name: "Austria", flagEmoji: "🇦🇹", total: 14, roundPoints: 1 },
  { name: "Switzerland", flagEmoji: "🇨🇭", total: 10, roundPoints: 0 },
];

function VariationRow({
  id,
  compact = false,
  name,
  flagEmoji,
  total,
  roundPoints,
}: {
  id: ScoreboardVariationId;
  compact?: boolean;
  name: string;
  flagEmoji: string;
  total: number;
  roundPoints?: number | null;
}) {
  const awarded = roundPoints ?? sample.roundPoints;
  const showRound = awarded > 0;

  return (
    <div
      className={compact ? "sb-var sb-var--compact" : "sb-var"}
      data-variant={id}
    >
      <div className="sb-var__row">
        <div className="sb-var__flag">
          <CountryFlag
            name={name}
            flagEmoji={flagEmoji}
            className="sb-var__flag-icon"
          />
        </div>
        <div className="sb-var__body">
          <span className="sb-var__name">{name}</span>
          <span className="sb-var__score-wrap">
            {showRound ?
              <span className="sb-var__round">{awarded}</span>
            : <span aria-hidden="true" className="sb-var__round sb-var__round--empty" />}
            <span aria-hidden="true" className="sb-var__score-divider" />
            <span className="sb-var__score">{total}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export function ScoreboardVariationsShowcase() {
  const [choice, setChoice] = useState<ScoreboardVariationId | null>("A");

  return (
    <main id="main-content" className="page-main section-stack max-w-6xl">
      <header className="section-block space-y-4">
        <p className="eyebrow">Scoreboard rows</p>
        <h1 className="display-heading-gold text-3xl sm:text-4xl">Nine H-based variations</h1>
        <p className="max-w-3xl text-muted">
          All variants share the same score layout: one boxed round value on the left, a short
          vertical gold rule, and the running total on the right — never stacked badges. Flag height
          matches the row; country names sit further from the flag.
        </p>
        <p className="text-sm text-muted">
          Sample shows total <strong>42</strong> with <strong>10</strong> points awarded this
          round. After you choose, we&apos;ll apply the style to the live presentation scoreboard
          and fix reveal behavior (round points persist until the next jury; one reorder after
          1–10).
        </p>
      </header>

      <section className="section-block sb-var-grid">
        {variations.map((variation) => {
          const selected = choice === variation.id;

          return (
            <article
              key={variation.id}
              className={selected ? "sb-var-card sb-var-card--selected" : "sb-var-card"}
            >
              <div className="sb-var-card__head">
                <div>
                  <h2 className="sb-var-card__title">
                    {variation.id}. {variation.title}
                  </h2>
                  <p className="sb-var-card__notes">{variation.notes}</p>
                </div>
                {selected ?
                  <span className="sb-var-card__picked">Selected</span>
                : null}
              </div>

              <VariationRow
                id={variation.id}
                compact={variation.id === "E"}
                name={sample.name}
                flagEmoji={sample.flagEmoji}
                total={sample.total}
              />

              <button
                type="button"
                className={selected ? "btn-primary" : "btn-secondary"}
                onClick={() => setChoice(variation.id)}
              >
                {selected ? "Selected" : "Select this style"}
              </button>
            </article>
          );
        })}
      </section>

      <section className="section-block space-y-5">
        <div className="space-y-2">
          <h2 className="section-heading">
            Two-column density preview{choice ? ` · ${choice}` : ""}
          </h2>
          <p className="text-sm text-muted">
            Ten countries at {choice === "E" ? "compact" : "standard"} row height — target is one
            screen on a TV without scrolling when possible.
          </p>
        </div>

        <div className={choice === "E" ? "sb-var-board sb-var-board--compact" : "sb-var-board"}>
          <div className="sb-var-board__column">
            {densityPreview.slice(0, 5).map((entry) => (
              <VariationRow
                key={entry.name}
                id={choice ?? "A"}
                compact={choice === "E"}
                name={entry.name}
                flagEmoji={entry.flagEmoji}
                total={entry.total}
                roundPoints={entry.roundPoints}
              />
            ))}
          </div>
          <div className="sb-var-board__column">
            {densityPreview.slice(5).map((entry) => (
              <VariationRow
                key={entry.name}
                id={choice ?? "A"}
                compact={choice === "E"}
                name={entry.name}
                flagEmoji={entry.flagEmoji}
                total={entry.total}
                roundPoints={entry.roundPoints}
              />
            ))}
          </div>
        </div>
      </section>

      {choice ?
        <p role="status" className="section-block text-center text-sm text-gold-light">
          Current pick: <strong>{choice}</strong> — reply in chat with that letter (or a mix, e.g.
          &quot;H frame + E height&quot;) to continue implementation.
        </p>
      : null}
    </main>
  );
}
