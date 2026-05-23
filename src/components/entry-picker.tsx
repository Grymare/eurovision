"use client";

import { CountryFlag } from "@/components/country-flag";
import { MIN_PARTY_ENTRIES } from "@/lib/party/constants";
import type { SerializedEntry } from "@/lib/party/types";
import { useState } from "react";

type EntryPickerProps = {
  partyId: string;
  initialEntries: SerializedEntry[];
  canEdit: boolean;
  devMockDataEnabled?: boolean;
  onChange?: () => void;
};

export function EntryPicker({
  partyId,
  initialEntries,
  canEdit,
  devMockDataEnabled = false,
  onChange,
}: EntryPickerProps) {
  const entries = initialEntries;
  const [name, setName] = useState("");
  const [flagEmoji, setFlagEmoji] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const showEntryMinimumHint = canEdit;
  const showEntryCount = entries.length < MIN_PARTY_ENTRIES;

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
      onChange?.();
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Could not add country");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSeedMockEntries() {
    setIsSeeding(true);
    setError(null);

    try {
      const response = await fetch(`/api/parties/${partyId}/entries/seed-mock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setId: "eurovision-2026" }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not load mock countries");
      }

      onChange?.();
    } catch (seedError) {
      setError(seedError instanceof Error ? seedError.message : "Could not load mock countries");
    } finally {
      setIsSeeding(false);
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

    onChange?.();
  }

  return (
    <section aria-labelledby="entries-heading" className="section-block space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="entries-heading" className="section-heading">
            Countries
          </h2>
          {showEntryMinimumHint ?
            <p className="mt-1 text-sm text-muted">
              At least {MIN_PARTY_ENTRIES} entries before voting opens.
            </p>
          : null}
        </div>
        {showEntryCount ?
          <p className="text-sm text-muted">
            <span className="text-foreground">{entries.length}</span> / {MIN_PARTY_ENTRIES}
          </p>
        : null}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted">No countries added yet.</p>
      ) : (
        <ul>
          {entries.map((entry) => (
            <li key={entry.id} className="list-row">
              <span className="flex items-center gap-3 text-base">
                <CountryFlag name={entry.name} flagEmoji={entry.flagEmoji} />
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

      {canEdit && devMockDataEnabled ? (
        <div className="border-t border-stage-border pt-5">
          <button
            type="button"
            onClick={handleSeedMockEntries}
            disabled={isSeeding || isSubmitting}
            className="btn-secondary"
          >
            {isSeeding ? "Loading…" : "Load Eurovision 2026 final countries (dev)"}
          </button>
          <p className="mt-2 text-xs text-muted">
            Dev-only shortcut. Adds all 25 Vienna 2026 Grand Final countries; skips names already in the list.
          </p>
        </div>
      ) : null}

      {canEdit ? (
        <form onSubmit={handleAdd} className="grid gap-4 border-t border-stage-border pt-5 sm:grid-cols-[1fr_auto_auto]">
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
              Flag
            </label>
            <input
              id="entry-flag"
              type="text"
              required
              maxLength={8}
              value={flagEmoji}
              onChange={(event) => setFlagEmoji(event.target.value)}
              className="field-input sm:w-24"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-secondary w-full sm:w-auto"
            >
              Add
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
