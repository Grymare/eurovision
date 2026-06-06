import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

export const eurovisionEntrySchema = z.object({
  name: z.string().trim().min(1),
  flagEmoji: z.string().trim().min(1),
});

export const eurovisionYearDatasetSchema = z.object({
  year: z.number().int(),
  label: z.string().trim().min(1),
  hostCity: z.string().trim().min(1).optional(),
  source: z.enum(["manual", "api"]).default("manual"),
  entries: z.array(eurovisionEntrySchema).min(1),
});

export type EurovisionEntry = z.infer<typeof eurovisionEntrySchema>;
export type EurovisionYearDataset = z.infer<typeof eurovisionYearDatasetSchema>;

function seedDirectory() {
  if (process.env.EUROVISION_DATASETS_SEED_DIR) {
    return process.env.EUROVISION_DATASETS_SEED_DIR;
  }

  const dockerSeed = path.join(process.cwd(), "eurovision-datasets-seed");

  if (fs.existsSync(dockerSeed)) {
    return dockerSeed;
  }

  return path.join(process.cwd(), "data", "eurovision");
}

let datasetsSeeded = false;

export function loadSeedEurovisionYear(year: number): EurovisionYearDataset | null {
  const filePath = path.join(seedDirectory(), `${year}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as unknown;
  const dataset = eurovisionYearDatasetSchema.parse(raw);

  if (dataset.year !== year) {
    throw new Error(`Eurovision seed file ${year}.json has mismatched year field`);
  }

  return dataset;
}

export function datasetsDirectory() {
  if (process.env.EUROVISION_DATASETS_DIR) {
    return process.env.EUROVISION_DATASETS_DIR;
  }

  const dockerPath = path.join(process.cwd(), "eurovision-datasets");

  if (fs.existsSync(dockerPath)) {
    return dockerPath;
  }

  return path.join(process.cwd(), "data", "eurovision");
}

function copySeedFile(sourceDir: string, targetDir: string, filename: string) {
  const sourcePath = path.join(sourceDir, filename);
  const targetPath = path.join(targetDir, filename);

  if (!fs.existsSync(sourcePath) || fs.existsSync(targetPath)) {
    return;
  }

  fs.copyFileSync(sourcePath, targetPath);
}

export function ensureEurovisionDatasetsSeeded() {
  if (datasetsSeeded) {
    return;
  }

  datasetsSeeded = true;

  const targetDir = datasetsDirectory();
  const sourceDir = seedDirectory();

  if (sourceDir === targetDir) {
    fs.mkdirSync(targetDir, { recursive: true });
    return;
  }

  fs.mkdirSync(targetDir, { recursive: true });

  if (!fs.existsSync(sourceDir)) {
    return;
  }

  const existing = fs.readdirSync(targetDir).filter((filename) => filename.endsWith(".json"));

  if (existing.length > 0) {
    return;
  }

  for (const filename of fs.readdirSync(sourceDir)) {
    if (!filename.endsWith(".json")) {
      continue;
    }

    copySeedFile(sourceDir, targetDir, filename);
  }
}

export function listEurovisionYears(): number[] {
  ensureEurovisionDatasetsSeeded();

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
  ensureEurovisionDatasetsSeeded();

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

export function parseEurovisionYearDataset(raw: unknown): EurovisionYearDataset {
  return eurovisionYearDatasetSchema.parse(raw);
}

export function saveEurovisionYear(dataset: EurovisionYearDataset) {
  ensureEurovisionDatasetsSeeded();

  const parsed = eurovisionYearDatasetSchema.parse(dataset);
  const directory = datasetsDirectory();

  fs.mkdirSync(directory, { recursive: true });

  const filePath = path.join(directory, `${parsed.year}.json`);
  const tempPath = `${filePath}.tmp`;

  fs.writeFileSync(tempPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf-8");
  fs.renameSync(tempPath, filePath);

  return parsed;
}

export function deleteEurovisionYear(year: number) {
  ensureEurovisionDatasetsSeeded();

  const filePath = path.join(datasetsDirectory(), `${year}.json`);

  if (!fs.existsSync(filePath)) {
    return false;
  }

  fs.unlinkSync(filePath);
  return true;
}

export function exportEurovisionYearJson(year: number) {
  const dataset = loadEurovisionYear(year);

  if (!dataset) {
    return null;
  }

  return `${JSON.stringify(dataset, null, 2)}\n`;
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
