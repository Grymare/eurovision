"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CreatePartyFormProps = {
  defaultHostNickname?: string;
};

export function CreatePartyForm({ defaultHostNickname = "" }: CreatePartyFormProps) {
  const router = useRouter();
  const [hostNickname, setHostNickname] = useState(defaultHostNickname);
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

      router.push(`/party/${data.party.code}`);
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
      id="host"
      onSubmit={handleSubmit}
      className="scroll-mt-28 space-y-5"
      aria-labelledby="create-party-heading"
    >
      <div className="space-y-2">
        <h2 id="create-party-heading" className="section-heading">
          Host a party
        </h2>
        <p className="text-sm leading-6 text-muted">
          You will join the jury too — same ballot as your guests.
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
          Party title <span className="normal-case tracking-normal text-muted">(optional)</span>
        </label>
        <input
          id="party-title"
          name="title"
          type="text"
          maxLength={80}
          placeholder="Saturday night final"
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
        {isSubmitting ? "Creating…" : "Create party"}
      </button>
    </form>
  );
}
