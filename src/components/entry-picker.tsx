"use client";

import { CountryAutocomplete } from "@/components/country-autocomplete";
import { CountryFlag } from "@/components/country-flag";
import { findCountryCatalogEntry } from "@/lib/countries/catalog";
import { MIN_PARTY_ENTRIES } from "@/lib/party/constants";
import type { SerializedEntry } from "@/lib/party/types";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type EurovisionYearSummary = {
  year: number;
  label: string;
  hostCity: string | null;
  entryCount: number;
  source: "manual" | "api";
};

type EntryPickerProps = {
  partyCode: string;
  initialEntries: SerializedEntry[];
  canEdit: boolean;
  devMockDataEnabled?: boolean;
  onChange?: () => void;
};

export function EntryPicker({
  partyCode,
  initialEntries,
  canEdit,
  devMockDataEnabled = false,
  onChange,
}: EntryPickerProps) {
  const entries = initialEntries;
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [availableYears, setAvailableYears] = useState<EurovisionYearSummary[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | "">("");
  const showEntryMinimumHint = canEdit;
  const showEntryCount = entries.length < MIN_PARTY_ENTRIES;

  useEffect(() => {
    if (!canEdit) {
      return;
    }

    let cancelled = false;

    void fetch("/api/eurovision/years")
      .then((response) => response.json())
      .then((data: { years?: EurovisionYearSummary[] }) => {
        if (cancelled) {
          return;
        }

        const years = data.years ?? [];
        setAvailableYears(years);
        setSelectedYear((current) => current || years[0]?.year || "");
      })
      .catch(() => {
        if (!cancelled) {
          setAvailableYears([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canEdit]);

  async function handleImportYear() {
    if (!selectedYear) {
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const response = await fetch(`/api/parties/${partyCode}/entries/import-year`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: selectedYear }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not import Eurovision countries");
      }

      onChange?.();
    } catch (importError) {
      setError(
        importError instanceof Error ? importError.message : "Could not import Eurovision countries",
      );
    } finally {
      setIsImporting(false);
    }
  }

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const catalogEntry = findCountryCatalogEntry(name);

    if (!catalogEntry) {
      setError("Pick a country from the suggestions list.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/parties/${partyCode}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catalogEntry.name }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not add country");
      }

      setName("");
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
      const response = await fetch(`/api/parties/${partyCode}/entries/seed-mock`, {
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

    const response = await fetch(`/api/parties/${partyCode}/entries/${entryId}`, {
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
              At least {MIN_PARTY_ENTRIES} countries before guests can join and voting can start.
            </p>
          : !canEdit && entries.length > 0 ?
            <p className="mt-1 text-sm text-muted">
              Use Edit countries in host controls to change this list.
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
              {canEdit ?
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  className="btn-icon"
                  aria-label={`Remove ${entry.name}`}
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </button>
              : null}
            </li>
          ))}
        </ul>
      )}

      {canEdit && availableYears.length > 0 ?
        <div className="space-y-3 border-t border-stage-border pt-5">
          <div className="space-y-2">
            <h3 className="text-sm font-medium uppercase tracking-[0.16em] text-foreground">
              Import from Eurovision
            </h3>
            <p className="text-sm text-muted">
              Pre-fill the country list from a year dataset. Existing countries with the same name
              are skipped.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[12rem] flex-1 space-y-2">
              <label htmlFor="import-year" className="field-label">
                Year
              </label>
              <select
                id="import-year"
                value={selectedYear}
                onChange={(event) => setSelectedYear(Number(event.target.value))}
                className="field-input"
                disabled={isImporting || isSubmitting || isSeeding}
              >
                {availableYears.map((yearOption) => (
                  <option key={yearOption.year} value={yearOption.year}>
                    {yearOption.label} ({yearOption.entryCount})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleImportYear}
              disabled={isImporting || isSubmitting || isSeeding || !selectedYear}
              className="btn-secondary"
            >
              {isImporting ? "Importing…" : "Import countries"}
            </button>
          </div>
        </div>
      : null}

      {canEdit && devMockDataEnabled ?
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
      : null}

      {canEdit ?
        <form
          onSubmit={handleAdd}
          className="grid gap-4 border-t border-stage-border pt-5 sm:grid-cols-[1fr_auto]"
        >
          <div className="space-y-2">
            <label htmlFor="entry-name" className="field-label">
              Add country
            </label>
            <CountryAutocomplete
              id="entry-name"
              value={name}
              onChange={setName}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmitting || !findCountryCatalogEntry(name)}
              className="btn-secondary w-full sm:w-auto"
            >
              Add
            </button>
          </div>
        </form>
      : null}

      {error ?
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      : null}
    </section>
  );
}
