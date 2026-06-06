import { AppError } from "@/lib/http/errors";
import type { EurovisionEntry, EurovisionYearDataset } from "@/lib/eurovision/datasets";
import { loadSeedEurovisionYear } from "@/lib/eurovision/datasets";
import { mapApiCountryToEntry } from "@/lib/eurovision/sync/map-country";
import { getContestantIsoMapForYear } from "@/lib/eurovision/sync/senior-release-cache";

const DATASET_REPO = "EurovisionAPI/dataset";
const DATASET_BRANCH = "main";
const RAW_BASE = `https://raw.githubusercontent.com/${DATASET_REPO}/${DATASET_BRANCH}`;

const FETCH_HEADERS = {
  Accept: "application/json",
  "User-Agent": "grymare-eurovision",
};

type ApiContest = {
  city?: string;
  country?: string;
  slogan?: string;
};

type ApiFinalPerformance = {
  contestantId: number;
  running: number;
};

type ApiFinalRound = {
  performances: ApiFinalPerformance[];
};

export type EurovisionSyncPreview = {
  year: number;
  label: string;
  hostCity: string | null;
  source: "api" | "manual";
  entries: EurovisionEntry[];
  unmapped: string[];
  provider: "eurovision-api" | "bundled-seed";
  providerNote: string | null;
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: FETCH_HEADERS,
    next: { revalidate: 0 },
  });

  if (response.status === 404) {
    throw new AppError("Eurovision year not found in API dataset", 404, "ESC_YEAR_NOT_FOUND");
  }

  if (response.status === 403) {
    throw new AppError(
      "Eurovision dataset download was rate-limited by GitHub. Try again in a few minutes.",
      503,
      "ESC_SYNC_RATE_LIMITED",
    );
  }

  if (!response.ok) {
    throw new AppError("Could not reach Eurovision API dataset", 503, "ESC_SYNC_UNAVAILABLE");
  }

  return (await response.json()) as T;
}

function previewFromSeedDataset(dataset: EurovisionYearDataset): EurovisionSyncPreview {
  return {
    year: dataset.year,
    label: dataset.label,
    hostCity: dataset.hostCity ?? null,
    source: dataset.source,
    entries: dataset.entries,
    unmapped: [],
    provider: "bundled-seed",
    providerNote:
      "EurovisionAPI does not publish this year yet. Loaded from the bundled seed file shipped with the app.",
  };
}

async function syncFromEurovisionApi(year: number): Promise<EurovisionSyncPreview> {
  const [countries, contest, finalRound, contestantIso] = await Promise.all([
    fetchJson<Record<string, string>>(`${RAW_BASE}/data/countries.json`),
    fetchJson<ApiContest>(`${RAW_BASE}/data/senior/${year}/contest.json`),
    fetchJson<ApiFinalRound>(`${RAW_BASE}/data/senior/${year}/rounds/final.json`),
    getContestantIsoMapForYear(year),
  ]);

  if (!finalRound.performances?.length) {
    throw new AppError("Grand Final round not found for this year", 404, "ESC_FINAL_NOT_FOUND");
  }

  const unmapped: string[] = [];
  const entries: EurovisionEntry[] = [];

  const performances = [...finalRound.performances].sort((left, right) => left.running - right.running);

  for (const performance of performances) {
    const isoCode = contestantIso.get(performance.contestantId);

    if (!isoCode) {
      unmapped.push(`Contestant #${performance.contestantId}`);
      continue;
    }

    const apiName = countries[isoCode] ?? isoCode;
    const mapped = mapApiCountryToEntry({ isoCode, apiName });

    if (!mapped.entry) {
      if (mapped.unmappedLabel) {
        unmapped.push(mapped.unmappedLabel);
      }
      continue;
    }

    if (!entries.some((entry) => entry.name === mapped.entry!.name)) {
      entries.push(mapped.entry);
    }
  }

  if (entries.length === 0) {
    throw new AppError("No mappable Grand Final countries found", 422, "ESC_SYNC_EMPTY");
  }

  const hostCity = contest.city?.trim() || null;
  const hostCountry = contest.country ? countries[contest.country] : null;
  const label =
    hostCity ?
      `Eurovision ${year} Grand Final (${hostCity})`
    : hostCountry ?
      `Eurovision ${year} Grand Final (${hostCountry})`
    : `Eurovision ${year} Grand Final`;

  return {
    year,
    label,
    hostCity,
    source: "api",
    entries,
    unmapped,
    provider: "eurovision-api",
    providerNote: null,
  };
}

export async function syncGrandFinalYear(year: number): Promise<EurovisionSyncPreview> {
  try {
    return await syncFromEurovisionApi(year);
  } catch (error) {
    if (!(error instanceof AppError) || error.code !== "ESC_YEAR_NOT_FOUND") {
      throw error;
    }

    const seed = loadSeedEurovisionYear(year);

    if (!seed) {
      throw error;
    }

    return previewFromSeedDataset(seed);
  }
}

export function syncPreviewToDataset(preview: EurovisionSyncPreview): EurovisionYearDataset {
  return {
    year: preview.year,
    label: preview.label,
    hostCity: preview.hostCity ?? undefined,
    source: preview.source,
    entries: preview.entries,
  };
}
