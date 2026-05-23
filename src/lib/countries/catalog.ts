import { isoToFlagEmoji } from "@/lib/countries/iso-to-flag-emoji";
import { resolveCountryIsoCode } from "@/lib/countries/resolve-iso-code";
import { EUROVISION_2026_PARTICIPANTS } from "@/lib/party/mock-data/eurovision-2026-participants";

export type CountryCatalogEntry = {
  name: string;
  isoCode: string;
  flagEmoji: string;
};

const ISO_DISPLAY_NAMES: Record<string, string> = {
  AL: "Albania",
  AM: "Armenia",
  AU: "Australia",
  AT: "Austria",
  AZ: "Azerbaijan",
  BE: "Belgium",
  BG: "Bulgaria",
  HR: "Croatia",
  CY: "Cyprus",
  CZ: "Czechia",
  DK: "Denmark",
  EE: "Estonia",
  FI: "Finland",
  FR: "France",
  GE: "Georgia",
  DE: "Germany",
  GR: "Greece",
  IE: "Ireland",
  IS: "Iceland",
  IL: "Israel",
  IT: "Italy",
  LV: "Latvia",
  LT: "Lithuania",
  LU: "Luxembourg",
  MT: "Malta",
  MD: "Moldova",
  ME: "Montenegro",
  NL: "Netherlands",
  NO: "Norway",
  PL: "Poland",
  PT: "Portugal",
  RO: "Romania",
  SM: "San Marino",
  RS: "Serbia",
  SK: "Slovakia",
  SI: "Slovenia",
  ES: "Spain",
  SE: "Sweden",
  CH: "Switzerland",
  UA: "Ukraine",
  GB: "United Kingdom",
};

function buildCatalog(): CountryCatalogEntry[] {
  const byIso = new Map<string, CountryCatalogEntry>();

  for (const entry of EUROVISION_2026_PARTICIPANTS) {
    const isoCode = resolveCountryIsoCode(entry);

    if (!isoCode) {
      continue;
    }

    byIso.set(isoCode, {
      name: entry.name,
      isoCode,
      flagEmoji: entry.flagEmoji,
    });
  }

  for (const [isoCode, name] of Object.entries(ISO_DISPLAY_NAMES)) {
    if (byIso.has(isoCode)) {
      continue;
    }

    byIso.set(isoCode, {
      name,
      isoCode,
      flagEmoji: isoToFlagEmoji(isoCode),
    });
  }

  return [...byIso.values()].sort((left, right) => left.name.localeCompare(right.name));
}

export const COUNTRY_CATALOG = buildCatalog();

export function findCountryCatalogEntry(query: string): CountryCatalogEntry | null {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  return (
    COUNTRY_CATALOG.find((entry) => entry.name.toLowerCase() === normalized) ??
    COUNTRY_CATALOG.find((entry) => entry.isoCode.toLowerCase() === normalized) ??
    null
  );
}

export function filterCountryCatalog(query: string, limit = 8): CountryCatalogEntry[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return COUNTRY_CATALOG.slice(0, limit);
  }

  return COUNTRY_CATALOG.filter((entry) => entry.name.toLowerCase().includes(normalized))
    .slice(0, limit);
}
