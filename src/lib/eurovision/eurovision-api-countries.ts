import { isoToFlagEmoji } from "@/lib/countries/iso-to-flag-emoji";

export type EurovisionCountryEntry = {
  name: string;
  isoCode: string;
  flagEmoji: string;
};

/**
 * Country codes and names from EurovisionAPI `data/countries.json`.
 * Keep in sync when upstream adds entries.
 * @see https://github.com/EurovisionAPI/dataset/blob/main/data/countries.json
 */
export const EUROVISION_API_COUNTRIES = {
  AL: "Albania",
  AD: "Andorra",
  AM: "Armenia",
  AU: "Australia",
  AT: "Austria",
  AZ: "Azerbaijan",
  BY: "Belarus",
  BE: "Belgium",
  BA: "Bosnia and Herzegovina",
  BG: "Bulgaria",
  HR: "Croatia",
  CY: "Cyprus",
  CZ: "Czechia",
  CS: "Serbia and Montenegro",
  DK: "Denmark",
  EE: "Estonia",
  FI: "Finland",
  FR: "France",
  GE: "Georgia",
  DE: "Germany",
  GR: "Greece",
  HU: "Hungary",
  IS: "Iceland",
  IE: "Ireland",
  IL: "Israel",
  IT: "Italy",
  KZ: "Kazakhstan",
  LV: "Latvia",
  LT: "Lithuania",
  LU: "Luxembourg",
  MT: "Malta",
  MD: "Moldova",
  MC: "Monaco",
  ME: "Montenegro",
  MA: "Morocco",
  MK: "North Macedonia",
  NL: "Netherlands",
  NO: "Norway",
  PL: "Poland",
  PT: "Portugal",
  RO: "Romania",
  RU: "Russia",
  SM: "San Marino",
  RS: "Serbia",
  SK: "Slovakia",
  SI: "Slovenia",
  ES: "Spain",
  SE: "Sweden",
  CH: "Switzerland",
  TR: "Turkey",
  UA: "Ukraine",
  GB: "United Kingdom",
  "GB-WLS": "Wales",
  YU: "Yugoslavia",
} as const;

export type EurovisionApiCountryCode = keyof typeof EUROVISION_API_COUNTRIES;

const FLAG_OVERRIDES: Partial<Record<EurovisionApiCountryCode, string>> = {
  "GB-WLS": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  CS: "🇷🇸",
};

export function normalizeEurovisionApiCountryCode(isoCode: string) {
  return isoCode.trim().toUpperCase();
}

export function getEurovisionApiCountryName(isoCode: string): string | null {
  const normalized = normalizeEurovisionApiCountryCode(isoCode);

  return EUROVISION_API_COUNTRIES[normalized as EurovisionApiCountryCode] ?? null;
}

export function getEurovisionCountryFlag(isoCode: string): string {
  const normalized = normalizeEurovisionApiCountryCode(isoCode);
  const override = FLAG_OVERRIDES[normalized as EurovisionApiCountryCode];

  if (override) {
    return override;
  }

  if (normalized.length === 2) {
    return isoToFlagEmoji(normalized);
  }

  return "🏳️";
}

export function getEurovisionCatalogEntry(isoCode: string): EurovisionCountryEntry | null {
  const normalized = normalizeEurovisionApiCountryCode(isoCode);
  const name = getEurovisionApiCountryName(normalized);

  if (!name) {
    return null;
  }

  return {
    name,
    isoCode: normalized,
    flagEmoji: getEurovisionCountryFlag(normalized),
  };
}

export function listEurovisionApiCountryCodes(): EurovisionApiCountryCode[] {
  return Object.keys(EUROVISION_API_COUNTRIES) as EurovisionApiCountryCode[];
}
