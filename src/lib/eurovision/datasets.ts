import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const eurovisionEntrySchema = z.object({
  name: z.string().trim().min(1),
  flagEmoji: z.string().trim().min(1),
});

const eurovisionYearDatasetSchema = z.object({
  year: z.number().int(),
  label: z.string().trim().min(1),
  hostCity: z.string().trim().min(1).optional(),
  source: z.enum(["manual", "api"]).default("manual"),
  entries: z.array(eurovisionEntrySchema).min(1),
});

export type EurovisionEntry = z.infer<typeof eurovisionEntrySchema>;
export type EurovisionYearDataset = z.infer<typeof eurovisionYearDatasetSchema>;

function datasetsDirectory() {
  const bundledPath = path.join(process.cwd(), "eurovision-datasets");
  const localPath = path.join(process.cwd(), "data", "eurovision");

  // Docker mounts a volume at /app/data, so bundled datasets live outside it.
  if (fs.existsSync(bundledPath)) {
    return bundledPath;
  }

  return localPath;
}

export function listEurovisionYears(): number[] {
  const directory = datasetsDirectory();

  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter((filename) => filename.endsWith(".json"))
    .map((filename) => Number.parseInt(filename.replace(/\.json$/, ""), 10))
    .filter((year) => Number.isInteger(year))
    .sort((left, right) => right - left);
}

export function loadEurovisionYear(year: number): EurovisionYearDataset | null {
  const filePath = path.join(datasetsDirectory(), `${year}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as unknown;
  const dataset = eurovisionYearDatasetSchema.parse(raw);

  if (dataset.year !== year) {
    throw new Error(`Eurovision dataset file ${year}.json has mismatched year field`);
  }

  return dataset;
}

export function listEurovisionYearSummaries() {
  return listEurovisionYears()
    .map((year) => loadEurovisionYear(year))
    .filter((dataset): dataset is EurovisionYearDataset => dataset !== null)
    .map((dataset) => ({
      year: dataset.year,
      label: dataset.label,
      hostCity: dataset.hostCity ?? null,
      entryCount: dataset.entries.length,
      source: dataset.source,
    }));
}
