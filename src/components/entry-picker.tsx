"use client";

import { MIN_PARTY_ENTRIES } from "@/lib/party/constants";
import type { SerializedEntry } from "@/lib/party/types";
import { useState } from "react";

type EntryPickerProps = {
  partyId: string;
  initialEntries: SerializedEntry[];
  canEdit: boolean;
  onChange?: () => void;
};

export function EntryPicker({
  partyId,
  initialEntries,
  canEdit,
  onChange,
}: EntryPickerProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [name, setName] = useState("");
  const [flagEmoji, setFlagEmoji] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function refreshEntries() {
    const response = await fetch(`/api/parties/${partyId}/entries`);
    const data = await response.json();
    if (response.ok) {
      setEntries(data.entries);
    }
  }

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/parties/${partyId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, flagEmoji }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not add country");
      }

      setName("");
      setFlagEmoji("");
      await refreshEntries();
      onChange?.();
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Could not add country");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(entryId: string) {
    setError(null);

    const response = await fetch(`/api/parties/${partyId}/entries/${entryId}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Could not remove country");
      return;
    }

    await refreshEntries();
    onChange?.();
  }

  return (
    <section aria-labelledby="entries-heading" className="panel space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="entries-heading" className="text-lg font-semibold">
            Countries
          </h2>
          <p className="mt-1 text-sm text-muted">
            Add at least {MIN_PARTY_ENTRIES} countries before opening voting.
          </p>
        </div>
        <p className="text-sm font-medium text-gold-bright">
          {entries.length} / {MIN_PARTY_ENTRIES} minimum
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted">No countries yet.</p>
      ) : (
        <ul className="divide-y divide-stage-border rounded-md border border-stage-border">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-3 px-3 py-2"
            >
              <span className="flex items-center gap-2 text-base">
                <span aria-hidden="true">{entry.flagEmoji}</span>
                <span>{entry.name}</span>
              </span>
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  className="btn-danger"
                >
                  Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canEdit ? (
        <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="space-y-2">
            <label htmlFor="entry-name" className="field-label">
              Country name
            </label>
            <input
              id="entry-name"
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="field-input"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="entry-flag" className="field-label">
              Flag emoji
            </label>
            <input
              id="entry-flag"
              type="text"
              required
              maxLength={8}
              value={flagEmoji}
              onChange={(event) => setFlagEmoji(event.target.value)}
              className="field-input"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full sm:w-auto"
            >
              Add country
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </section>
  );
}
