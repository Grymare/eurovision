"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreatePartyForm() {
  const router = useRouter();
  const [hostNickname, setHostNickname] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostNickname, title: title || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not create party");
      }

      router.push(`/party/${data.party.id}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not create party",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      aria-labelledby="create-party-heading"
    >
      <div>
        <h2 id="create-party-heading" className="text-lg font-semibold">
          Host a party
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Create a new Eurovision-style voting party. You will vote too.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="host-nickname" className="block text-sm font-medium">
          Your nickname
        </label>
        <input
          id="host-nickname"
          name="hostNickname"
          type="text"
          required
          minLength={2}
          maxLength={24}
          value={hostNickname}
          onChange={(event) => setHostNickname(event.target.value)}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="party-title" className="block text-sm font-medium">
          Party title (optional)
        </label>
        <input
          id="party-title"
          name="title"
          type="text"
          maxLength={80}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
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
        className="inline-flex min-h-11 items-center justify-center rounded-md bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-60"
      >
        {isSubmitting ? "Creating..." : "Create party"}
      </button>
    </form>
  );
}
