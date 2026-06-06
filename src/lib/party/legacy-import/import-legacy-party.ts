import { db } from "@/db";
import {
  appMeta,
  parties,
  partyEntries,
  partyResults,
  participants,
  votes,
  type VoteAllocations,
} from "@/db/schema";
import { AppError } from "@/lib/http/errors";
import { resolveCountryForLegacyImport } from "@/lib/party/legacy-import/match-country";
import { parseLegacyMatrixText } from "@/lib/party/legacy-import/parse-matrix";
import {
  defaultLegacyPartyTitle,
  previewLegacyImport,
} from "@/lib/party/legacy-import/preview-import";
import type { LegacyImportPreview, LegacyImportResult } from "@/lib/party/legacy-import/types";
import { buildPartyScoreboardSnapshot } from "@/lib/party/score-aggregation";
import { createId, createPartyCode, createSessionToken } from "@/lib/party/tokens";
import { validateVoteAllocations } from "@/lib/party/vote-validation";
import { and, eq } from "drizzle-orm";

const LEGACY_META_PREFIX = "legacy-import:";

function legacyMetaKey(year: number) {
  return `${LEGACY_META_PREFIX}${year}`;
}

function nowIso() {
  return new Date().toISOString();
}

async function getPartyById(partyId: string) {
  return db.query.parties.findFirst({ where: eq(parties.id, partyId) });
}

export async function findLegacyImportPartyId(year: number): Promise<string | null> {
  const meta = await db.query.appMeta.findFirst({
    where: eq(appMeta.key, legacyMetaKey(year)),
  });

  if (meta?.value) {
    const party = await getPartyById(meta.value);

    if (party) {
      return party.id;
    }
  }

  const title = defaultLegacyPartyTitle(year);
  const party = await db.query.parties.findFirst({
    where: and(eq(parties.state, "finished"), eq(parties.title, title)),
  });

  return party?.id ?? null;
}

export async function deleteLegacyImportParty(year: number): Promise<boolean> {
  const partyId = await findLegacyImportPartyId(year);

  if (!partyId) {
    return false;
  }

  await db.delete(parties).where(eq(parties.id, partyId));
  await db.delete(appMeta).where(eq(appMeta.key, legacyMetaKey(year)));

  return true;
}

function invertMatrixToBallots(
  matrix: ReturnType<typeof parseLegacyMatrixText>,
  entryIdByCountryKey: Map<string, string>,
): Map<string, VoteAllocations> {
  const ballots = new Map<string, VoteAllocations>();

  for (const nickname of matrix.juryNicknames) {
    ballots.set(nickname, {});
  }

  for (const row of matrix.countries) {
    const entryId = entryIdByCountryKey.get(row.normalizedName.toLowerCase());

    if (!entryId) {
      throw new AppError(`Missing entry for ${row.label}`, 400, "LEGACY_IMPORT_UNMAPPED");
    }

    for (const [nickname, points] of Object.entries(row.juryPoints)) {
      const ballot = ballots.get(nickname);

      if (!ballot) {
        continue;
      }

      ballot[entryId] = points;
    }
  }

  return ballots;
}

export async function importLegacyParty(input: {
  matrixText: string;
  year: number;
  title?: string;
  overwrite?: boolean;
  strictTotals?: boolean;
  finishedAt?: string;
}): Promise<LegacyImportResult> {
  const preview = buildLegacyImportPreview({
    matrixText: input.matrixText,
    year: input.year,
    title: input.title,
    strictTotals: input.strictTotals ?? false,
  });

  if (!preview.canImport) {
    throw new AppError(preview.errors.join(" "), 400, "LEGACY_IMPORT_INVALID");
  }

  const existingPartyId = await findLegacyImportPartyId(input.year);

  if (existingPartyId && !input.overwrite) {
    throw new AppError(
      `A legacy import already exists for ${input.year}. Pass overwrite to replace it.`,
      409,
      "LEGACY_IMPORT_EXISTS",
    );
  }

  if (existingPartyId && input.overwrite) {
    await deleteLegacyImportParty(input.year);
  }

  const matrix = parseLegacyMatrixText(input.matrixText);
  const finishedAt = input.finishedAt ?? `${input.year}-05-01T20:00:00.000Z`;
  const partyId = createId();
  const hostSessionToken = createSessionToken();

  let code = createPartyCode();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const existing = await db.query.parties.findFirst({ where: eq(parties.code, code) });

    if (!existing) {
      break;
    }

    code = createPartyCode();
  }

  const entryIdByCountryKey = new Map<string, string>();
  const entryRecords: Array<{
    id: string;
    partyId: string;
    name: string;
    flagEmoji: string;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
  }> = [];

  preview.countryMatches.forEach((match, index) => {
    if (!match.catalogEntry) {
      return;
    }

    const entryId = createId();
    const key = match.row.normalizedName.toLowerCase();

    entryIdByCountryKey.set(key, entryId);
    entryRecords.push({
      id: entryId,
      partyId,
      name: match.catalogEntry.name,
      flagEmoji: match.catalogEntry.flagEmoji,
      sortOrder: index,
      createdAt: finishedAt,
      updatedAt: finishedAt,
    });
  });

  const ballots = invertMatrixToBallots(matrix, entryIdByCountryKey);
  const participantRecords: Array<typeof participants.$inferInsert> = [];
  const voteRecords: Array<typeof votes.$inferInsert> = [];

  for (const nickname of matrix.juryNicknames) {
    const participantId = createId();
    const allocations = ballots.get(nickname) ?? {};
    const validationError = validateVoteAllocations(
      allocations,
      entryRecords.map((entry) => ({ id: entry.id })),
    );

    if (validationError) {
      throw new AppError(`${nickname}: ${validationError}`, 400, "LEGACY_IMPORT_INVALID");
    }

    participantRecords.push({
      id: participantId,
      partyId,
      nickname,
      userId: null,
      sessionToken: createSessionToken(),
      isHost: false,
      hasVoted: true,
      joinedAt: finishedAt,
    });

    voteRecords.push({
      id: createId(),
      partyId,
      participantId,
      allocationsJson: JSON.stringify(allocations),
      createdAt: finishedAt,
      updatedAt: finishedAt,
    });
  }

  const scoreboard = buildPartyScoreboardSnapshot({
    entries: entryRecords.map((entry) => ({
      id: entry.id,
      partyId: entry.partyId,
      name: entry.name,
      flagEmoji: entry.flagEmoji,
      sortOrder: entry.sortOrder,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    })),
    voteRecords: voteRecords.map((vote) => ({
      id: vote.id!,
      partyId: vote.partyId!,
      participantId: vote.participantId!,
      allocationsJson: vote.allocationsJson!,
      createdAt: vote.createdAt!,
      updatedAt: vote.updatedAt!,
    })),
    computedAt: finishedAt,
  });

  db.transaction((tx) => {
    tx.insert(parties)
      .values({
        id: partyId,
        code,
        title: preview.title,
        state: "finished",
        hostSessionToken,
        hostParticipantId: null,
        revealOrderJson: null,
        createdAt: finishedAt,
        updatedAt: finishedAt,
      })
      .run();

    if (entryRecords.length > 0) {
      tx.insert(partyEntries).values(entryRecords).run();
    }

    if (participantRecords.length > 0) {
      tx.insert(participants).values(participantRecords).run();
    }

    if (voteRecords.length > 0) {
      tx.insert(votes).values(voteRecords).run();
    }

    tx.insert(partyResults)
      .values({
        id: createId(),
        partyId,
        scoreboardJson: JSON.stringify(scoreboard),
        computedAt: finishedAt,
      })
      .run();

    tx.insert(appMeta)
      .values({
        key: legacyMetaKey(input.year),
        value: partyId,
        updatedAt: nowIso(),
      })
      .run();
  });

  return {
    partyId,
    partyCode: code,
    title: preview.title,
    year: input.year,
    voteCount: voteRecords.length,
    entryCount: entryRecords.length,
    overwritten: Boolean(existingPartyId),
  };
}

export function buildLegacyImportPreview(input: {
  matrixText: string;
  year: number;
  title?: string;
  strictTotals?: boolean;
}): LegacyImportPreview {
  const preview = previewLegacyImport(input);

  if (
    preview.unmappedCountries.length > 0 ||
    preview.juryNicknames.length === 0 ||
    preview.countryMatches.length === 0
  ) {
    return preview;
  }

  let matrix;

  try {
    matrix = parseLegacyMatrixText(input.matrixText);
  } catch (error) {
    return {
      ...preview,
      errors: [
        ...preview.errors,
        error instanceof Error ? error.message : "Could not parse matrix.",
      ],
      canImport: false,
    };
  }
  const entryIdByCountryKey = new Map<string, string>();

  for (const match of preview.countryMatches) {
    if (!match.catalogEntry) {
      continue;
    }

    entryIdByCountryKey.set(
      match.row.normalizedName.toLowerCase(),
      `preview-${match.row.normalizedName.toLowerCase().replace(/\s+/g, "-")}`,
    );
  }

  let ballots: Map<string, VoteAllocations>;

  try {
    ballots = invertMatrixToBallots(matrix, entryIdByCountryKey);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not build juror ballots.";

    return {
      ...preview,
      errors: [...preview.errors, message],
      canImport: false,
    };
  }

  const juryBallots = preview.juryNicknames.map((nickname) => {
    const allocations = ballots.get(nickname) ?? {};
    const validationError = validateVoteAllocations(
      allocations,
      [...entryIdByCountryKey.values()].map((id) => ({ id })),
    );

    return {
      nickname,
      allocations,
      validationError,
    };
  });

  const errors = preview.errors.filter((error) => !error.startsWith("Could not map"));
  const warnings = [...preview.warnings];

  for (const ballot of juryBallots) {
    if (ballot.validationError) {
      const scoredCount = Object.keys(ballot.allocations).length;
      errors.push(
        `${ballot.nickname}: ${ballot.validationError} (scored ${scoredCount} countries).`,
      );
    }
  }

  return {
    ...preview,
    juryBallots,
    errors,
    warnings,
    canImport: errors.length === 0,
  };
}

export { resolveCountryForLegacyImport };
