import { EUROVISION_POINT_VALUES } from "@/lib/party/constants";
import { resolveCountryForLegacyImport } from "@/lib/party/legacy-import/match-country";
import { parseLegacyMatrixTextWithErrors } from "@/lib/party/legacy-import/parse-matrix";
import type {
  LegacyImportPreview,
  LegacyJuryBallotPreview,
} from "@/lib/party/legacy-import/types";

export function defaultLegacyPartyTitle(year: number): string {
  return `Eurovision ${year} Grand Final`;
}

export function previewLegacyImport(input: {
  matrixText: string;
  year: number;
  title?: string;
  strictTotals?: boolean;
}): LegacyImportPreview {
  const errors: string[] = [];
  const warnings: string[] = [];
  const title = input.title?.trim() || defaultLegacyPartyTitle(input.year);

  const parsed = parseLegacyMatrixTextWithErrors(input.matrixText);

  if (!parsed.matrix) {
    return {
      year: input.year,
      title,
      juryNicknames: [],
      countryMatches: [],
      juryBallots: [],
      totalScoreMismatches: [],
      unmappedCountries: [],
      errors: parsed.errors,
      warnings,
      canImport: false,
    };
  }

  const matrix = parsed.matrix;

  const countryMatches = matrix.countries.map((row) => ({
    row,
    catalogEntry: resolveCountryForLegacyImport(row.label),
  }));

  const unmappedCountries = countryMatches
    .filter((match) => !match.catalogEntry)
    .map((match) => match.row.label);

  if (unmappedCountries.length > 0) {
    errors.push(
      `Could not map ${unmappedCountries.length} ${unmappedCountries.length === 1 ? "country" : "countries"}: ${unmappedCountries.join(", ")}`,
    );
  }

  const totalScoreMismatches = matrix.countries
    .filter(
      (row) =>
        row.declaredTotal !== null &&
        row.declaredTotal !== row.computedTotal,
    )
    .map((row) => ({
      country: row.label,
      declared: row.declaredTotal!,
      computed: row.computedTotal,
    }));

  if (totalScoreMismatches.length > 0) {
    const message = `TOTAL SCORE mismatch on ${totalScoreMismatches.length} ${totalScoreMismatches.length === 1 ? "row" : "rows"}.`;

    if (input.strictTotals) {
      errors.push(message);
    } else {
      warnings.push(message);
    }
  }

  const juryBallots: LegacyJuryBallotPreview[] = matrix.juryNicknames.map((nickname) => ({
    nickname,
    allocations: {},
    validationError: null,
  }));

  return {
    year: input.year,
    title,
    juryNicknames: matrix.juryNicknames,
    countryMatches,
    juryBallots,
    totalScoreMismatches,
    unmappedCountries,
    errors,
    warnings,
    canImport: errors.length === 0,
  };
}
