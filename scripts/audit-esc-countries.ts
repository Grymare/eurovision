import { findCountryCatalogEntry } from "../src/lib/countries/catalog";
import { mapApiCountryToEntry } from "../src/lib/eurovision/sync/map-country";
import {
  EUROVISION_API_COUNTRIES,
  listEurovisionApiCountryCodes,
} from "../src/lib/eurovision/eurovision-api-countries";

function main() {
  const unmappedApi: string[] = [];
  const catalogMissing: string[] = [];

  for (const isoCode of listEurovisionApiCountryCodes()) {
    const apiName = EUROVISION_API_COUNTRIES[isoCode];
    const mapped = mapApiCountryToEntry({ isoCode, apiName });

    if (!mapped.entry) {
      unmappedApi.push(`${apiName} (${isoCode})`);
    }

    if (!findCountryCatalogEntry(isoCode)) {
      catalogMissing.push(isoCode);
    }
  }

  console.log("EurovisionAPI countries:", listEurovisionApiCountryCodes().length);
  console.log("Unmapped via mapApiCountryToEntry:", unmappedApi.join(", ") || "(none)");
  console.log("Missing from party catalog lookup:", catalogMissing.join(", ") || "(none)");

  if (unmappedApi.length > 0 || catalogMissing.length > 0) {
    process.exit(1);
  }
}

main();
