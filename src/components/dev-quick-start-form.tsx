"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DevQuickStartForm() {
  const router = useRouter();
  const [hostNickname, setHostNickname] = useState("Dev Host");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScoreboardSubmitting, setIsScoreboardSubmitting] = useState(false);
  const [isNearEndSubmitting, setIsNearEndSubmitting] = useState(false);

  async function handleQuickStart() {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/parties/dev-quick-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostNickname,
          title: "Dev quick start",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not create dev party");
      }

      router.push(`/party/${data.party.code}`);
    } catch (quickStartError) {
      setError(
        quickStartError instanceof Error
          ? quickStartError.message
          : "Could not create dev party",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleScoreboardFixture() {
    setIsScoreboardSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/parties/dev-scoreboard-fixture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostNickname,
          title: "Dev scoreboard fixture",
          voteCount: 10,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not create scoreboard fixture");
      }

      router.push(`/party/${data.party.code}`);
    } catch (fixtureError) {
      setError(
        fixtureError instanceof Error
          ? fixtureError.message
          : "Could not create scoreboard fixture",
      );
    } finally {
      setIsScoreboardSubmitting(false);
    }
  }

  async function handleNearEndFixture() {
    setIsNearEndSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/parties/dev-scoreboard-fixture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostNickname,
          title: "Dev near-end fixture",
          voteCount: 10,
          nearEnd: true,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not create near-end fixture");
      }

      router.push(`/party/${data.party.code}/presentation`);
    } catch (fixtureError) {
      setError(
        fixtureError instanceof Error
          ? fixtureError.message
          : "Could not create near-end fixture",
      );
    } finally {
      setIsNearEndSubmitting(false);
    }
  }

  const isBusy = isSubmitting || isScoreboardSubmitting || isNearEndSubmitting;

  return (
    <section
      className="section-block space-y-4 border border-gold-light/20 bg-stage-elevated/40 p-5"
      aria-labelledby="dev-quick-start-heading"
    >
      <div className="space-y-2">
        <h2 id="dev-quick-start-heading" className="section-heading">
          Dev quick start
        </h2>
        <p className="text-sm leading-6 text-muted">
          Shortcuts for local testing. Mock countries, voting, and scoreboard fixtures
          are dev-only.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="dev-host-nickname" className="field-label">
          Host nickname
        </label>
        <input
          id="dev-host-nickname"
          type="text"
          minLength={2}
          maxLength={24}
          value={hostNickname}
          onChange={(event) => setHostNickname(event.target.value)}
          className="field-input max-w-sm"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={isBusy || hostNickname.trim().length < 2}
          onClick={handleQuickStart}
          className="btn-secondary"
        >
          {isSubmitting ? "Setting up…" : "Dev: mock countries + open voting"}
        </button>
        <button
          type="button"
          disabled={isBusy || hostNickname.trim().length < 2}
          onClick={handleScoreboardFixture}
          className="btn-secondary"
        >
          {isScoreboardSubmitting ?
            "Setting up…"
          : "Dev: 10 mock votes + presentation"}
        </button>
        <button
          type="button"
          disabled={isBusy || hostNickname.trim().length < 2}
          onClick={handleNearEndFixture}
          className="btn-secondary"
        >
          {isNearEndSubmitting ?
            "Setting up…"
          : "Dev: skip to last jury (10/10)"}
        </button>
        <p className="text-xs text-muted">
          Scoreboard fixture seeds the host plus nine jurors, closes voting, and opens
          presentation so <code className="text-foreground">/api/parties/CODE/scores</code>{" "}
          works immediately. Last-jury shortcut lands on jury 10 of 10 with totals from the
          first nine jurors already applied.
        </p>
      </div>
    </section>
  );
}
