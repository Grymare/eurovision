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
      className="panel space-y-4"
      aria-labelledby="create-party-heading"
    >
      <div>
        <h2 id="create-party-heading" className="text-lg font-semibold">
          Host a party
        </h2>
        <p className="mt-1 text-sm text-muted">
          Create a new Eurovision-style voting party. You will vote too.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="host-nickname" className="field-label">
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
          className="field-input"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="party-title" className="field-label">
          Party title (optional)
        </label>
        <input
          id="party-title"
          name="title"
          type="text"
          maxLength={80}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="field-input"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={isSubmitting} className="btn-primary">
        {isSubmitting ? "Creating..." : "Create party"}
      </button>
    </form>
  );
}
