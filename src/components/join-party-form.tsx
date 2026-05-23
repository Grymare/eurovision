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
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      aria-labelledby="join-party-heading"
    >
      <div>
        <h2 id="join-party-heading" className="text-lg font-semibold">
          Join a party
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Enter the party code from your host and pick a unique nickname.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="party-code" className="block text-sm font-medium">
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
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base uppercase tracking-widest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="guest-nickname" className="block text-sm font-medium">
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
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        {isSubmitting ? "Joining..." : "Join party"}
      </button>
    </form>
  );
}
