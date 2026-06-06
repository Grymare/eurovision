import { EUROVISION_POINT_VALUES } from "@/lib/party/constants";
import { normalizeLegacyCountryLabel } from "@/lib/party/legacy-import/match-country";
import type { LegacyMatrixCountryRow, ParsedLegacyMatrix } from "@/lib/party/legacy-import/types";

const VALID_POINTS = new Set<number>(EUROVISION_POINT_VALUES);
const TOTAL_HEADER_PATTERN = /^total/i;
const SCORE_HEADER_PATTERN = /^score/i;
const COUNTRY_HEADER_PATTERN = /country/i;

function fixCommonMojibake(text: string): string {
  return text.replace(/JÃ¶/g, "Jö").replace(/jÃ¶/g, "jö");
}

function splitMatrixLine(line: string): string[] {
  if (line.includes("\t")) {
    return line.split("\t").map((cell) => cell.trim());
  }

  if (line.includes(";")) {
    return line.split(";").map((cell) => cell.trim());
  }

  return line.split(",").map((cell) => cell.trim());
}

function parsePointCell(raw: string): number | null {
  const trimmed = raw.trim();

  if (!trimmed || trimmed === "-" || trimmed === "—") {
    return null;
  }

  const value = Number.parseInt(trimmed, 10);

  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return value;
}

function looksLikeCountryLabel(label: string): boolean {
  const trimmed = label.trim();

  if (!trimmed || TOTAL_HEADER_PATTERN.test(trimmed)) {
    return false;
  }

  return /^\d+[.)\s]/.test(trimmed) || normalizeLegacyCountryLabel(trimmed).length >= 3;
}

function isCountryHeaderCell(label: string): boolean {
  const normalized = label.trim().toLowerCase();

  return normalized === "" || COUNTRY_HEADER_PATTERN.test(normalized);
}

function detectTotalColumn(headerCells: string[]): boolean {
  return headerCells.some((cell) => TOTAL_HEADER_PATTERN.test(cell));
}

function normalizeMatrixLines(lines: string[]): string[] {
  const trimmed = lines.map((line) => line.trim()).filter((line) => line.length > 0);

  if (trimmed.length < 2) {
    return trimmed;
  }

  const firstCountryIndex = trimmed.findIndex((line) =>
    looksLikeCountryLabel(splitMatrixLine(line)[0] ?? ""),
  );

  if (firstCountryIndex <= 0) {
    return trimmed;
  }

  const headerLines = trimmed.slice(0, firstCountryIndex);
  const dataLines = trimmed.slice(firstCountryIndex);
  const usesSingleColumnHeader = headerLines.every(
    (line) => !line.includes("\t") && !line.includes(";") && !line.includes(","),
  );

  if (!usesSingleColumnHeader) {
    return trimmed;
  }

  const headerCells = [...headerLines];

  if (
    headerCells.length >= 2 &&
    TOTAL_HEADER_PATTERN.test(headerCells[headerCells.length - 2] ?? "") &&
    SCORE_HEADER_PATTERN.test(headerCells[headerCells.length - 1] ?? "")
  ) {
    headerCells.splice(headerCells.length - 2, 2, "TOTAL SCORE");
  }

  return [headerCells.join("\t"), ...dataLines];
}

function resolveHeader(lines: string[]): {
  headerIndex: number;
  headerCells: string[];
  juryNicknames: string[];
  hasTotalColumn: boolean;
} {
  for (let index = 0; index < Math.min(lines.length, 8); index += 1) {
    const cells = splitMatrixLine(lines[index]!);
    const nextLine = lines[index + 1];
    const nextCells = nextLine ? splitMatrixLine(nextLine) : [];
    const hasTotalColumn = detectTotalColumn(cells);

    if (!nextLine || !looksLikeCountryLabel(nextCells[0] ?? "")) {
      continue;
    }

    if (isCountryHeaderCell(cells[0] ?? "")) {
      const juryNicknames = cells
        .slice(1)
        .filter((cell) => cell && !TOTAL_HEADER_PATTERN.test(cell) && !SCORE_HEADER_PATTERN.test(cell));

      if (juryNicknames.length > 0) {
        return { headerIndex: index, headerCells: cells, juryNicknames, hasTotalColumn };
      }
    }

    const juryNicknames = cells.filter(
      (cell) => cell && !TOTAL_HEADER_PATTERN.test(cell) && !SCORE_HEADER_PATTERN.test(cell),
    );

    if (juryNicknames.length >= 2) {
      return { headerIndex: index, headerCells: cells, juryNicknames, hasTotalColumn };
    }
  }

  throw new Error(
    "Could not find a header row. Use a first row of juror names (Hen, Jö, …) and country rows below (01 Sweden, …).",
  );
}

function resolveDeclaredTotal(input: {
  cells: string[];
  juryNicknames: string[];
  hasTotalColumn: boolean;
}): number | null {
  if (!input.hasTotalColumn) {
    return null;
  }

  const expectedColumns = input.juryNicknames.length + 2;

  if (input.cells.length >= expectedColumns) {
    const declaredRaw = input.cells[input.cells.length - 1]?.trim() ?? "";

    if (!declaredRaw) {
      return null;
    }

    const declaredTotal = Number.parseInt(declaredRaw, 10);

    return Number.isFinite(declaredTotal) ? declaredTotal : null;
  }

  if (input.cells.length === input.juryNicknames.length + 1) {
    const shiftedRaw = input.cells[input.cells.length - 1]?.trim() ?? "";
    const shiftedTotal = Number.parseInt(shiftedRaw, 10);

    if (
      shiftedRaw &&
      Number.isFinite(shiftedTotal) &&
      !VALID_POINTS.has(shiftedTotal)
    ) {
      return shiftedTotal;
    }
  }

  return null;
}

function resolveJuryColumnCount(input: {
  cells: string[];
  juryNicknames: string[];
  hasTotalColumn: boolean;
}): number {
  if (
    input.hasTotalColumn &&
    input.cells.length === input.juryNicknames.length + 1 &&
    resolveDeclaredTotal(input) !== null
  ) {
    return input.juryNicknames.length - 1;
  }

  return input.juryNicknames.length;
}

function parseLegacyMatrixLines(lines: string[]): {
  matrix: ParsedLegacyMatrix | null;
  errors: string[];
} {
  if (lines.length < 2) {
    return { matrix: null, errors: ["Matrix must include a header row and at least one country row."] };
  }

  let header;

  try {
    header = resolveHeader(lines);
  } catch (error) {
    return {
      matrix: null,
      errors: [error instanceof Error ? error.message : "Could not parse matrix."],
    };
  }

  const { headerIndex, juryNicknames, hasTotalColumn } = header;

  if (juryNicknames.length === 0) {
    return { matrix: null, errors: ["Header row must include at least one juror column."] };
  }

  const countries: LegacyMatrixCountryRow[] = [];
  const errors: string[] = [];

  for (const line of lines.slice(headerIndex + 1)) {
    const cells = splitMatrixLine(line);
    const label = cells[0]?.trim() ?? "";

    if (!label || TOTAL_HEADER_PATTERN.test(label)) {
      continue;
    }

    const juryColumnCount = resolveJuryColumnCount({ cells, juryNicknames, hasTotalColumn });
    const juryPoints: Record<string, number> = {};
    let computedTotal = 0;

    for (let index = 0; index < juryColumnCount; index += 1) {
      const nickname = juryNicknames[index]!;

      if (!nickname) {
        continue;
      }

      const points = parsePointCell(cells[index + 1] ?? "");

      if (points === null) {
        continue;
      }

      if (!VALID_POINTS.has(points)) {
        errors.push(
          `${label} / ${nickname}: invalid point value ${points} (use 1–8, 10, or 12).`,
        );
        continue;
      }

      if (juryPoints[nickname] !== undefined) {
        errors.push(`${label} / ${nickname}: duplicate point assignment.`);
        continue;
      }

      juryPoints[nickname] = points;
      computedTotal += points;
    }

    countries.push({
      label,
      normalizedName: normalizeLegacyCountryLabel(label),
      juryPoints,
      declaredTotal: resolveDeclaredTotal({ cells, juryNicknames, hasTotalColumn }),
      computedTotal,
    });
  }

  if (countries.length === 0) {
    return { matrix: null, errors: ["No country rows found in matrix."] };
  }

  if (errors.length > 0) {
    return { matrix: null, errors };
  }

  return {
    matrix: {
      juryNicknames,
      countries,
      hasTotalColumn,
    },
    errors: [],
  };
}

export function parseLegacyMatrixText(text: string): ParsedLegacyMatrix {
  const normalizedText = fixCommonMojibake(text);
  const rawLines = normalizedText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const lines = normalizeMatrixLines(rawLines);
  const result = parseLegacyMatrixLines(lines);

  if (!result.matrix) {
    throw new Error(result.errors[0] ?? "Could not parse matrix.");
  }

  return result.matrix;
}

export function parseLegacyMatrixTextWithErrors(text: string): {
  matrix: ParsedLegacyMatrix | null;
  errors: string[];
} {
  const normalizedText = fixCommonMojibake(text);
  const rawLines = normalizedText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const lines = normalizeMatrixLines(rawLines);

  return parseLegacyMatrixLines(lines);
}
