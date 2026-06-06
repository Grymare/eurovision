import type { CountryCatalogEntry } from "@/lib/countries/catalog";

export type LegacyMatrixCountryRow = {
  label: string;
  normalizedName: string;
  juryPoints: Record<string, number>;
  declaredTotal: number | null;
  computedTotal: number;
};

export type ParsedLegacyMatrix = {
  juryNicknames: string[];
  countries: LegacyMatrixCountryRow[];
  hasTotalColumn: boolean;
};

export type LegacyCountryMatch = {
  row: LegacyMatrixCountryRow;
  catalogEntry: CountryCatalogEntry | null;
};

export type LegacyJuryBallotPreview = {
  nickname: string;
  allocations: Record<string, number>;
  validationError: string | null;
};

export type LegacyImportPreview = {
  year: number;
  title: string;
  juryNicknames: string[];
  countryMatches: LegacyCountryMatch[];
  juryBallots: LegacyJuryBallotPreview[];
  totalScoreMismatches: Array<{
    country: string;
    declared: number;
    computed: number;
  }>;
  unmappedCountries: string[];
  errors: string[];
  warnings: string[];
  canImport: boolean;
};

export type LegacyImportResult = {
  partyId: string;
  partyCode: string;
  title: string;
  year: number;
  voteCount: number;
  entryCount: number;
  overwritten: boolean;
};
