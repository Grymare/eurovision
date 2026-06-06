/**
 * Import a finished party from a legacy spreadsheet matrix (TSV).
 *
 * Usage:
 *   pnpm import:legacy -- --file data/legacy/example-2024.tsv --year 2024 --overwrite
 *   pnpm import:legacy -- --file path.tsv --year 2023 --title "Eurovision 2023 Grand Final"
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildLegacyImportPreview,
  importLegacyParty,
} from "@/lib/party/legacy-import/import-legacy-party";

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);

  if (index < 0) {
    return undefined;
  }

  return process.argv[index + 1];
}

function hasFlag(name: string) {
  return process.argv.includes(name);
}

async function main() {
  const file = readArg("--file");
  const yearRaw = readArg("--year");
  const title = readArg("--title");
  const finishedAt = readArg("--finished-at");
  const overwrite = hasFlag("--overwrite");
  const strictTotals = hasFlag("--strict-totals");
  const previewOnly = hasFlag("--preview");

  if (!file || !yearRaw) {
    console.error(
      "Usage: pnpm import:legacy -- --file <path.tsv> --year <yyyy> [--title \"...\"] [--overwrite] [--strict-totals] [--preview]",
    );
    process.exit(1);
  }

  const year = Number.parseInt(yearRaw, 10);

  if (!Number.isInteger(year) || year < 1956 || year > 2100) {
    console.error("Invalid --year");
    process.exit(1);
  }

  const matrixText = readFileSync(resolve(file), "utf8");

  if (previewOnly) {
    const preview = buildLegacyImportPreview({
      matrixText,
      year,
      title,
      strictTotals,
    });

    console.log(JSON.stringify(preview, null, 2));
    process.exit(preview.canImport ? 0 : 1);
  }

  const preview = buildLegacyImportPreview({
    matrixText,
    year,
    title,
    strictTotals,
  });

  if (!preview.canImport) {
    console.error("Import blocked:");
    for (const error of preview.errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  if (preview.warnings.length > 0) {
    console.warn("Warnings:");
    for (const warning of preview.warnings) {
      console.warn(`- ${warning}`);
    }
  }

  const result = await importLegacyParty({
    matrixText,
    year,
    title,
    overwrite,
    strictTotals,
    finishedAt,
  });

  console.log(
    `Imported ${result.title} as party ${result.partyCode} (${result.entryCount} countries, ${result.voteCount} jurors)${result.overwritten ? " — replaced previous import" : ""}.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
