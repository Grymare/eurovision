const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  albania: "AL",
  armenia: "AM",
  australia: "AU",
  austria: "AT",
  azerbaijan: "AZ",
  belgium: "BE",
  bulgaria: "BG",
  croatia: "HR",
  cyprus: "CY",
  czechia: "CZ",
  "czech republic": "CZ",
  denmark: "DK",
  estonia: "EE",
  finland: "FI",
  france: "FR",
  georgia: "GE",
  germany: "DE",
  greece: "GR",
  israel: "IL",
  italy: "IT",
  latvia: "LV",
  lithuania: "LT",
  luxembourg: "LU",
  malta: "MT",
  moldova: "MD",
  montenegro: "ME",
  norway: "NO",
  poland: "PL",
  portugal: "PT",
  romania: "RO",
  "san marino": "SM",
  serbia: "RS",
  slovakia: "SK",
  slovenia: "SI",
  spain: "ES",
  sweden: "SE",
  switzerland: "CH",
  ukraine: "UA",
  "united kingdom": "GB",
  uk: "GB",
  "great britain": "GB",
  ireland: "IE",
  iceland: "IS",
  netherlands: "NL",
  "the netherlands": "NL",
};

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
    return byName;
  }

  if (input.flagEmoji) {
    return isoFromFlagEmoji(input.flagEmoji);
  }

  return null;
}
