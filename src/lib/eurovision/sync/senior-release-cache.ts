import fs from "node:fs";
import path from "node:path";
import { datasetsDirectory } from "@/lib/eurovision/datasets";
import { AppError } from "@/lib/http/errors";

const SENIOR_RELEASE_URL =
  "https://github.com/EurovisionAPI/dataset/releases/latest/download/senior.json";
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const FETCH_HEADERS = {
  Accept: "application/json",
  "User-Agent": "grymare-eurovision",
};

type SeniorReleaseContestant = {
  Id: number;
  Country: string;
};

export type SeniorReleaseEdition = {
  Year: number;
  City?: string;
  Country?: string;
  Contestants: SeniorReleaseContestant[];
};

let parsedEditions: SeniorReleaseEdition[] | null = null;

function cachePath() {
  return path.join(datasetsDirectory(), ".cache", "senior-release.json");
}

function isCacheFresh(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const ageMs = Date.now() - fs.statSync(filePath).mtimeMs;
  return ageMs < CACHE_MAX_AGE_MS;
}

async function fetchSeniorReleaseJson() {
  const response = await fetch(SENIOR_RELEASE_URL, {
    headers: FETCH_HEADERS,
    next: { revalidate: 0 },
  });

  if (response.status === 403) {
    throw new AppError(
      "Eurovision dataset download was rate-limited by GitHub. Try again in a few minutes.",
      503,
      "ESC_SYNC_RATE_LIMITED",
    );
  }

  if (!response.ok) {
    throw new AppError("Could not download Eurovision dataset release", 503, "ESC_SYNC_UNAVAILABLE");
  }

  return response.text();
}

async function readSeniorReleaseJson() {
  const cachedFile = cachePath();

  if (isCacheFresh(cachedFile)) {
    return fs.readFileSync(cachedFile, "utf-8");
  }

  try {
    const json = await fetchSeniorReleaseJson();

    fs.mkdirSync(path.dirname(cachedFile), { recursive: true });
    fs.writeFileSync(cachedFile, json, "utf-8");

    return json;
  } catch (error) {
    if (fs.existsSync(cachedFile)) {
      return fs.readFileSync(cachedFile, "utf-8");
    }

    throw error;
  }
}

async function loadSeniorReleaseEditions() {
  if (parsedEditions) {
    return parsedEditions;
  }

  const raw = await readSeniorReleaseJson();
  parsedEditions = JSON.parse(raw) as SeniorReleaseEdition[];

  return parsedEditions;
}

export async function getContestantIsoMapForYear(year: number) {
  const editions = await loadSeniorReleaseEditions();
  const edition = editions.find((entry) => entry.Year === year);

  if (!edition) {
    throw new AppError("Eurovision year not found in API dataset", 404, "ESC_YEAR_NOT_FOUND");
  }

  const map = new Map<number, string>();

  for (const contestant of edition.Contestants) {
    map.set(contestant.Id, contestant.Country.trim().toUpperCase());
  }

  return map;
}

/** Clears in-process cache (for tests). */
export function resetSeniorReleaseCacheForTests() {
  parsedEditions = null;
}
