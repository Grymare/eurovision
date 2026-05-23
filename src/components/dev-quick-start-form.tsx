"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DevQuickStartForm() {
  const router = useRouter();
  const [hostNickname, setHostNickname] = useState("Dev Host");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      router.push(`/party/${data.party.id}`);
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
          Creates a party, loads Eurovision 2026 mock countries, and opens voting
          immediately.
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

      <button
        type="button"
        disabled={isSubmitting || hostNickname.trim().length < 2}
        onClick={handleQuickStart}
        className="btn-secondary"
      >
        {isSubmitting ? "Setting up…" : "Dev: mock countries + open voting"}
      </button>
    </section>
  );
}
