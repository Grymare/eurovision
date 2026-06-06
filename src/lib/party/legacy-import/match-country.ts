import {
  COUNTRY_CATALOG,
  findCountryCatalogEntry,
  type CountryCatalogEntry,
} from "@/lib/countries/catalog";
import { resolveCountryIsoCode } from "@/lib/countries/resolve-iso-code";
import { getEurovisionCountryFlag } from "@/lib/eurovision/eurovision-api-countries";

const LEADING_ORDER_PATTERN = /^\d+[.)]\s*/;

export function normalizeLegacyCountryLabel(label: string): string {
  return label.trim().replace(LEADING_ORDER_PATTERN, "").trim();
}

export function resolveCountryForLegacyImport(label: string): CountryCatalogEntry | null {
  const normalizedName = normalizeLegacyCountryLabel(label);

  if (!normalizedName) {
    return null;
  }

  const exact = findCountryCatalogEntry(normalizedName);

  if (exact) {
    return exact;
  }

  const isoCode = resolveCountryIsoCode({ name: normalizedName });

  if (isoCode) {
    const byIso = COUNTRY_CATALOG.find((entry) => entry.isoCode === isoCode);

    if (byIso) {
      return byIso;
    }

    return {
      name: normalizedName,
      isoCode,
      flagEmoji: getEurovisionCountryFlag(isoCode),
    };
  }

  const lower = normalizedName.toLowerCase();
  const fuzzy = COUNTRY_CATALOG.find(
    (entry) =>
      entry.name.toLowerCase() === lower ||
      entry.name.toLowerCase().includes(lower) ||
      lower.includes(entry.name.toLowerCase()),
  );

  return fuzzy ?? null;
}
