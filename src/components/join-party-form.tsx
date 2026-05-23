"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type JoinPartyFormProps = {
  initialCode?: string;
};

export function JoinPartyForm({ initialCode = "" }: JoinPartyFormProps) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/parties/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, nickname }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not join party");
      }

      router.push(`/party/${data.party.id}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Could not join party",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="panel space-y-4"
      aria-labelledby="join-party-heading"
    >
      <div>
        <h2 id="join-party-heading" className="text-lg font-semibold">
          Join a party
        </h2>
        <p className="mt-1 text-sm text-muted">
          Enter the party code from your host and pick a unique nickname.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="party-code" className="field-label">
          Party code
        </label>
        <input
          id="party-code"
          name="code"
          type="text"
          required
          minLength={4}
          maxLength={8}
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          className="field-input font-mono uppercase tracking-[0.25em]"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="guest-nickname" className="field-label">
          Your nickname
        </label>
        <input
          id="guest-nickname"
          name="nickname"
          type="text"
          required
          minLength={2}
          maxLength={24}
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          className="field-input"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={isSubmitting} className="btn-secondary">
        <span className="btn-label">
          {isSubmitting ? "Joining..." : "Join party"}
        </span>
      </button>
    </form>
  );
}
