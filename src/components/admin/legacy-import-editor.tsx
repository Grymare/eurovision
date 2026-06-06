"use client";

import { defaultLegacyPartyTitle } from "@/lib/party/legacy-import/preview-import";
import type { LegacyImportPreview } from "@/lib/party/legacy-import/types";
import { useState } from "react";

export function LegacyImportEditor() {
  const currentYear = new Date().getFullYear();
  const [yearInput, setYearInput] = useState(String(currentYear - 1));
  const [title, setTitle] = useState("");
  const [matrixText, setMatrixText] = useState("");
  const [strictTotals, setStrictTotals] = useState(false);
  const [overwrite, setOverwrite] = useState(true);
  const [preview, setPreview] = useState<LegacyImportPreview | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  function parseYear() {
    const year = Number.parseInt(yearInput.trim(), 10);

    if (!Number.isInteger(year) || year < 1956 || year > 2100) {
      throw new Error("Enter a valid Eurovision year (1956–2100).");
    }

    return year;
  }

  async function handlePreview() {
    setIsPreviewing(true);
    setError(null);
    setMessage(null);

    try {
      const year = parseYear();
      const response = await fetch("/api/admin/legacy-import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matrixText,
          year,
          title: title.trim() || undefined,
          strictTotals,
        }),
      });
      const data = (await response.json()) as {
        preview?: LegacyImportPreview;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Preview failed");
      }

      setPreview(data.preview ?? null);
    } catch (previewError) {
      setPreview(null);
      setError(
        previewError instanceof Error ? previewError.message : "Preview failed",
      );
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleImport() {
    setIsImporting(true);
    setError(null);
    setMessage(null);

    try {
      const year = parseYear();
      const response = await fetch("/api/admin/legacy-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matrixText,
          year,
          title: title.trim() || undefined,
          strictTotals,
          overwrite,
        }),
      });
      const data = (await response.json()) as {
        result?: { partyCode: string; title: string; overwritten: boolean };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Import failed");
      }

      setMessage(
        data.result ?
          `Imported ${data.result.title} as party ${data.result.partyCode}${data.result.overwritten ? " (replaced previous import for this year)" : ""}.`
        : "Import completed.",
      );
    } catch (importError) {
      setError(
        importError instanceof Error ? importError.message : "Import failed",
      );
    } finally {
      setIsImporting(false);
    }
  }

  const parsedYear = Number.parseInt(yearInput.trim(), 10);
  const suggestedTitle =
    Number.isInteger(parsedYear) ?
      defaultLegacyPartyTitle(parsedYear)
    : "Eurovision YYYY Grand Final";

  return (
    <section className="section-block space-y-5">
      <div className="space-y-2">
        <h2 className="section-heading">Legacy results import</h2>
        <p className="text-sm leading-6 text-muted">
          Paste a tab-separated matrix: country rows, juror columns, optional TOTAL SCORE
          column. Creates a finished party with unclaimed juror rows for the claim flow.
          When copying from Excel, select the full grid including empty cells so columns stay
          aligned.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="legacy-year" className="field-label">
            Eurovision year
          </label>
          <input
            id="legacy-year"
            type="number"
            min={1956}
            max={2100}
            value={yearInput}
            onChange={(event) => setYearInput(event.target.value)}
            className="field-input"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="legacy-title" className="field-label">
            Party title
          </label>
          <input
            id="legacy-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={suggestedTitle}
            className="field-input"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="legacy-matrix" className="field-label">
          Matrix (TSV)
        </label>
        <textarea
          id="legacy-matrix"
          value={matrixText}
          onChange={(event) => setMatrixText(event.target.value)}
          rows={16}
          spellCheck={false}
          className="field-input min-h-[16rem] font-mono text-sm"
          placeholder={"Country\tHen\tJö\tNL\tPav\tTOTAL SCORE\n01 Sweden\t12\t10\t..."}
        />
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={strictTotals}
            onChange={(event) => setStrictTotals(event.target.checked)}
          />
          Reject TOTAL SCORE mismatches
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={overwrite}
            onChange={(event) => setOverwrite(event.target.checked)}
          />
          Overwrite existing import for this year
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="btn-secondary"
          disabled={isPreviewing || isImporting || !matrixText.trim()}
          onClick={() => void handlePreview()}
        >
          {isPreviewing ? "Previewing…" : "Preview import"}
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={isImporting || isPreviewing || !matrixText.trim()}
          onClick={() => void handleImport()}
        >
          {isImporting ? "Importing…" : "Import finished party"}
        </button>
      </div>

      {preview ?
        <div className="space-y-3 border border-stage-border/60 bg-stage-elevated/30 p-4 text-sm">
          <p className="text-foreground">
            Preview: {preview.title} · {preview.juryNicknames.length} jurors ·{" "}
            {preview.countryMatches.length} countries
          </p>
          {preview.canImport ?
            <p className="text-gold-light">Ready to import.</p>
          : <p className="text-danger">Import blocked until errors are fixed.</p>}
          {preview.errors.length > 0 ?
            <ul className="space-y-1 text-danger">
              {preview.errors.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          : null}
          {preview.warnings.length > 0 ?
            <ul className="space-y-1 text-muted">
              {preview.warnings.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          : null}
        </div>
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
    </section>
  );
}
