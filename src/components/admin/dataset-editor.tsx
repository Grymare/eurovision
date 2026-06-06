"use client";

import { CountryAutocomplete } from "@/components/country-autocomplete";
import { CountryFlag } from "@/components/country-flag";
import { findCountryCatalogEntry } from "@/lib/countries/catalog";
import type { EurovisionEntry, EurovisionYearDataset } from "@/lib/eurovision/datasets";
import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type YearSummary = {
  year: number;
  label: string;
  hostCity: string | null;
  entryCount: number;
  source: "manual" | "api";
};

type SyncPreview = {
  year: number;
  label: string;
  hostCity: string | null;
  source: "api" | "manual";
  entries: EurovisionEntry[];
  unmapped: string[];
  provider: "eurovision-api" | "bundled-seed";
  providerNote: string | null;
};

function emptyDraft(year: number): EurovisionYearDataset {
  return {
    year,
    label: `Eurovision ${year} Grand Final`,
    hostCity: undefined,
    source: "manual",
    entries: [],
  };
}

function parseYearInput(value: string) {
  const year = Number.parseInt(value.trim(), 10);

  if (!Number.isInteger(year) || year < 1956 || year > 2100) {
    return null;
  }

  return year;
}

export function DatasetEditor() {
  const currentCalendarYear = new Date().getFullYear();
  const [years, setYears] = useState<YearSummary[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(currentCalendarYear);
  const [yearInput, setYearInput] = useState(String(currentCalendarYear));
  const [draft, setDraft] = useState<EurovisionYearDataset>(() => emptyDraft(currentCalendarYear));
  const [newCountry, setNewCountry] = useState("");
  const [syncPreview, setSyncPreview] = useState<SyncPreview | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadYears = useCallback(async () => {
    const response = await fetch("/api/admin/eurovision/years");
    const data = (await response.json()) as { years?: YearSummary[]; error?: string };

    if (!response.ok) {
      throw new Error(data.error ?? "Could not load datasets");
    }

    return data.years ?? [];
  }, []);

  useEffect(() => {
    let cancelled = false;

    void loadYears()
      .then((nextYears) => {
        if (!cancelled) {
          setYears(nextYears);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load datasets");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loadYears]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(`/api/admin/eurovision/years/${selectedYear}`);
        const data = (await response.json()) as {
          dataset?: EurovisionYearDataset;
          error?: string;
        };

        if (cancelled) {
          return;
        }

        if (response.status === 404) {
          setDraft(emptyDraft(selectedYear));
          return;
        }

        if (!response.ok) {
          throw new Error(data.error ?? "Could not load dataset");
        }

        setDraft(data.dataset ?? emptyDraft(selectedYear));
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load dataset");
          setDraft(emptyDraft(selectedYear));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedYear]);

  function applyYearInput() {
    const year = parseYearInput(yearInput);

    if (!year) {
      setError("Enter a valid year between 1956 and 2100");
      return;
    }

    setError(null);
    setSyncPreview(null);
    setIsLoading(true);
    setSelectedYear(year);
  }

  function applyPreview(preview: SyncPreview) {
    setDraft({
      year: preview.year,
      label: preview.label,
      hostCity: preview.hostCity ?? undefined,
      source: preview.source,
      entries: preview.entries,
    });
  }

  async function handleSync(save: boolean) {
    setIsSyncing(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/eurovision/years/${selectedYear}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ save }),
      });

      const data = (await response.json()) as {
        preview?: SyncPreview;
        dataset?: EurovisionYearDataset;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Sync failed");
      }

      if (data.preview) {
        setSyncPreview(data.preview);
        applyPreview(data.preview);
      }

      if (save && data.dataset) {
        setDraft(data.dataset);
        setMessage(`Saved ${data.dataset.entries.length} countries from sync.`);
        const nextYears = await loadYears();
        setYears(nextYears);
      } else if (data.preview) {
        const providerMessage =
          data.preview.providerNote ??
          (data.preview.unmapped.length > 0 ?
            `Preview loaded with ${data.preview.unmapped.length} unmapped countries — fix before saving.`
          : `Preview loaded ${data.preview.entries.length} Grand Final countries.`);

        setMessage(providerMessage);
      }
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (draft.entries.length === 0) {
        throw new Error("Add at least one country before saving");
      }

      const response = await fetch(`/api/admin/eurovision/years/${selectedYear}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: draft.label,
          hostCity: draft.hostCity,
          source: draft.source,
          entries: draft.entries,
        }),
      });

      const data = (await response.json()) as {
        dataset?: EurovisionYearDataset;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Save failed");
      }

      setDraft(data.dataset ?? draft);
      setSyncPreview(null);
      setMessage("Dataset saved.");
      const nextYears = await loadYears();
      setYears(nextYears);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  function handleAddCountry() {
    const catalogEntry = findCountryCatalogEntry(newCountry);

    if (!catalogEntry) {
      setError("Pick a country from the suggestions list");
      return;
    }

    if (draft.entries.some((entry) => entry.name === catalogEntry.name)) {
      setError("That country is already in the list");
      return;
    }

    setDraft((current) => ({
      ...current,
      entries: [
        ...current.entries,
        { name: catalogEntry.name, flagEmoji: catalogEntry.flagEmoji },
      ],
    }));
    setNewCountry("");
    setError(null);
  }

  function handleRemoveCountry(name: string) {
    setDraft((current) => ({
      ...current,
      entries: current.entries.filter((entry) => entry.name !== name),
    }));
  }

  async function handleImportJson(file: File) {
    setError(null);
    setMessage(null);

    try {
      const text = await file.text();

      const response = await fetch("/api/admin/eurovision/years/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: text,
      });

      const data = (await response.json()) as {
        dataset?: EurovisionYearDataset;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Import failed");
      }

      if (data.dataset) {
        setYearInput(String(data.dataset.year));
        setSelectedYear(data.dataset.year);
        setDraft(data.dataset);
        setMessage(`Imported ${data.dataset.year} dataset.`);
        const nextYears = await loadYears();
        setYears(nextYears);
      }
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Import failed");
    }
  }

  async function handleDelete(yearToDelete = selectedYear) {
    const published = years.find((year) => year.year === yearToDelete);

    if (!published) {
      setError("This year is not saved yet — nothing to remove.");
      return;
    }

    const confirmed = window.confirm(
      `Remove the ${yearToDelete} dataset (${published.entryCount} countries)? Parties will no longer be able to import this year until you sync or save it again.`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/eurovision/years/${yearToDelete}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not remove dataset");
      }

      const nextYears = await loadYears();
      setYears(nextYears);
      setSyncPreview(null);

      if (yearToDelete === selectedYear) {
        setDraft(emptyDraft(selectedYear));
      }

      setMessage(`Removed ${yearToDelete} dataset.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not remove dataset");
    } finally {
      setIsDeleting(false);
    }
  }

  const publishedYear = years.find((year) => year.year === selectedYear);
  const hasMetadata = draft.entries.length > 0 || draft.hostCity;

  return (
    <div className="section-stack max-w-3xl">
      <div className="section-block space-y-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[8rem] flex-1 space-y-2">
            <label htmlFor="dataset-year" className="field-label">
              Year
            </label>
            <input
              id="dataset-year"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={yearInput}
              onChange={(event) => setYearInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyYearInput();
                }
              }}
              className="field-input"
            />
          </div>
          <button type="button" className="btn-secondary" onClick={applyYearInput}>
            Load from db
          </button>
        </div>

        {hasMetadata ?
          <div className="space-y-1 text-sm">
            <p className="text-foreground">{draft.label}</p>
            {draft.hostCity ?
              <p className="text-muted">Host city: {draft.hostCity}</p>
            : null}
            <p className="text-muted">
              Label and host city come from API sync or imported JSON — edit countries below, then
              save.
            </p>
          </div>
        : <p className="text-sm text-muted">
            No dataset metadata yet. Sync from API, import JSON, or add countries manually.
          </p>
        }

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-secondary"
            disabled={isSyncing}
            onClick={() => void handleSync(false)}
          >
            {isSyncing ? "Syncing…" : "Sync from API"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={isSyncing || (syncPreview?.unmapped.length ?? 0) > 0}
            onClick={() => void handleSync(true)}
          >
            Save API sync
          </button>
          <a
            href={`/api/admin/eurovision/years/${selectedYear}/export`}
            className="btn-secondary inline-flex items-center"
          >
            Export JSON
          </a>
          <label className="btn-secondary inline-flex cursor-pointer items-center">
            Import JSON
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) {
                  void handleImportJson(file);
                }

                event.target.value = "";
              }}
            />
          </label>
        </div>

        {syncPreview?.unmapped.length ?
          <p role="alert" className="text-sm text-danger">
            Unmapped from API: {syncPreview.unmapped.join(", ")}. Add them manually or extend the
            catalog mapper.
          </p>
        : null}

        {message ?
          <p role="status" className="text-sm text-gold-light">
            {message}
          </p>
        : null}

        {error ?
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        : null}
      </div>

      <section className="section-block space-y-5">
        <div className="space-y-2">
          <h2 className="section-heading">Countries ({draft.entries.length})</h2>
          <p className="text-sm text-muted">
            Grand Final list used by party import. Source: {draft.source}.
          </p>
        </div>

        {isLoading ?
          <p className="text-sm text-muted">Loading…</p>
        : draft.entries.length === 0 ?
          <p className="text-sm text-muted">No countries yet — sync from API or add manually.</p>
        : <ul className="space-y-2">
            {draft.entries.map((entry) => (
              <li
                key={entry.name}
                className="flex items-center justify-between gap-3 border border-stage-border/50 px-3 py-2"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <CountryFlag
                    name={entry.name}
                    flagEmoji={entry.flagEmoji}
                    className="h-5 w-5 shrink-0"
                  />
                  <span className="truncate">{entry.name}</span>
                </span>
                <button
                  type="button"
                  className="btn-icon"
                  aria-label={`Remove ${entry.name}`}
                  onClick={() => handleRemoveCountry(entry.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        }

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <label htmlFor="dataset-add-country" className="field-label">
              Add country
            </label>
            <CountryAutocomplete
              id="dataset-add-country"
              value={newCountry}
              onChange={setNewCountry}
              placeholder="Search country…"
            />
          </div>
          <button type="button" className="btn-secondary shrink-0" onClick={handleAddCountry}>
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-primary" disabled={isSaving} onClick={() => void handleSave()}>
            {isSaving ? "Saving…" : "Save dataset"}
          </button>

          {publishedYear ?
            <button
              type="button"
              className="btn-danger"
              disabled={isDeleting}
              onClick={() => void handleDelete()}
            >
              {isDeleting ? "Removing…" : "Remove dataset"}
            </button>
          : null}
        </div>
      </section>

      {years.length > 0 ?
        <section className="section-block space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-[0.16em] text-foreground">
            Published years
          </h2>
          <ul className="space-y-2 text-sm text-muted">
            {years.map((year) => (
              <li key={year.year} className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left underline-offset-4 hover:text-foreground hover:underline"
                  onClick={() => {
                    setYearInput(String(year.year));
                    setIsLoading(true);
                    setSyncPreview(null);
                    setSelectedYear(year.year);
                  }}
                >
                  {year.year} — {year.label} ({year.entryCount} countries, {year.source})
                </button>
                <button
                  type="button"
                  className="btn-icon shrink-0"
                  disabled={isDeleting}
                  aria-label={`Remove ${year.year} dataset`}
                  onClick={() => void handleDelete(year.year)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      : null}
    </div>
  );
}
