import {
  EUROVISION_API_COUNTRIES,
  normalizeEurovisionApiCountryCode,
} from "@/lib/eurovision/eurovision-api-countries";

const EXTRA_NAME_ALIASES: Record<string, string> = {
  "czech republic": "CZ",
  "the netherlands": "NL",
  uk: "GB",
  "great britain": "GB",
  "north macedonia": "MK",
  "former yugoslav republic of macedonia": "MK",
  "fyrom": "MK",
  türkiye: "TR",
  turkiye: "TR",
};

function buildCountryNameToIso(): Record<string, string> {
  const byName: Record<string, string> = { ...EXTRA_NAME_ALIASES };

  for (const [isoCode, name] of Object.entries(EUROVISION_API_COUNTRIES)) {
    byName[name.toLowerCase()] = isoCode;
  }

  return byName;
}

const COUNTRY_NAME_TO_ISO = buildCountryNameToIso();

function isoFromFlagEmoji(flagEmoji: string): string | null {
  const chars = [...flagEmoji.trim()];
  if (chars.length < 2) {
    return null;
  }

  const regionalBase = 0x1f1e6;
  const first = chars[0].codePointAt(0);
  const second = chars[1].codePointAt(0);

  if (
    first === undefined ||
    second === undefined ||
    first < regionalBase ||
    first > regionalBase + 25 ||
    second < regionalBase ||
    second > regionalBase + 25
  ) {
    return null;
  }

  return (
    String.fromCharCode(65 + first - regionalBase) +
    String.fromCharCode(65 + second - regionalBase)
  );
}

export function resolveCountryIsoCode(input: {
  name: string;
  flagEmoji?: string;
}): string | null {
  const byName = COUNTRY_NAME_TO_ISO[input.name.trim().toLowerCase()];
  if (byName) {
    return normalizeEurovisionApiCountryCode(byName);
  }

  if (input.flagEmoji) {
    return isoFromFlagEmoji(input.flagEmoji);
  }

  return null;
}
