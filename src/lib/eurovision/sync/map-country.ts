import { findCountryCatalogEntry } from "@/lib/countries/catalog";
import type { EurovisionEntry } from "@/lib/eurovision/datasets";
import { getEurovisionCatalogEntry } from "@/lib/eurovision/eurovision-api-countries";

const ISO_ALIASES: Record<string, string> = {
  GB: "United Kingdom",
  UK: "United Kingdom",
  CZ: "Czechia",
  MK: "North Macedonia",
  "GB-WLS": "Wales",
};

const NAME_ALIASES: Record<string, string> = {
  "czech republic": "Czechia",
  "the netherlands": "Netherlands",
  uk: "United Kingdom",
  "great britain": "United Kingdom",
  "north macedonia": "North Macedonia",
  "former yugoslav republic of macedonia": "North Macedonia",
  fyrom: "North Macedonia",
  "bosnia and herzegovina": "Bosnia and Herzegovina",
  türkiye: "Turkey",
  turkiye: "Turkey",
};

export function mapApiCountryToEntry(input: {
  isoCode: string;
  apiName: string;
}): { entry: EurovisionEntry | null; unmappedLabel: string | null } {
  const iso = input.isoCode.trim().toUpperCase();
  const aliasName = ISO_ALIASES[iso];
  const normalizedApiName = NAME_ALIASES[input.apiName.trim().toLowerCase()] ?? input.apiName.trim();

  const catalogEntry =
    (aliasName ? findCountryCatalogEntry(aliasName) : null) ??
    findCountryCatalogEntry(iso) ??
    findCountryCatalogEntry(normalizedApiName) ??
    findCountryCatalogEntry(input.apiName) ??
    getEurovisionCatalogEntry(iso);

  if (!catalogEntry) {
    return {
      entry: null,
      unmappedLabel: `${input.apiName} (${iso})`,
    };
  }

  return {
    entry: {
      name: catalogEntry.name,
      flagEmoji: catalogEntry.flagEmoji,
    },
    unmappedLabel: null,
  };
}
