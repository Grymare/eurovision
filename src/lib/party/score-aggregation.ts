import type { PartyEntry, Vote, VoteAllocations } from "@/db/schema";
import { EUROVISION_POINT_VALUES } from "@/lib/party/constants";

/**
 * Eurovision tie-break (for EUP-013 ranking):
 * When two or more countries share the same total points, compare in order:
 * 1. Most sets of 12 points received
 * 2. Most sets of 10 points received
 * 3. Then 8, 7, 6, 5, 4, 3, 2, and 1 points
 * If still tied after all point values, countries remain tied.
 *
 * Host votes count the same as guest votes in every total and tie-break count.
 */
export const EUROVISION_TIEBREAK_POINT_ORDER = [...EUROVISION_POINT_VALUES].sort(
  (left, right) => right - left,
);

export type PointReceiptCounts = Record<string, number>;

export type CountryScoreTotal = {
  entryId: string;
  totalPoints: number;
};

export type PartyScoreboardRow = {
  entryId: string;
  name: string;
  flagEmoji: string;
  sortOrder: number;
  totalPoints: number;
  pointReceipts: PointReceiptCounts;
};

export type PartyScoreboardSnapshot = {
  version: 1;
  computedAt: string;
  voteCount: number;
  rows: PartyScoreboardRow[];
  totals: CountryScoreTotal[];
};

function readAllocations(vote: Vote): VoteAllocations {
  return JSON.parse(vote.allocationsJson) as VoteAllocations;
}

export function emptyPointReceiptCounts(): PointReceiptCounts {
  const counts: PointReceiptCounts = {};

  for (const points of EUROVISION_POINT_VALUES) {
    counts[String(points)] = 0;
  }

  return counts;
}

export function countPointReceiptsForEntry(
  voteRecords: Vote[],
  entryId: string,
  validEntryIds: Set<string>,
): PointReceiptCounts {
  const counts = emptyPointReceiptCounts();

  for (const vote of voteRecords) {
    const allocations = readAllocations(vote);

    for (const [votedEntryId, points] of Object.entries(allocations)) {
      if (votedEntryId !== entryId || !validEntryIds.has(votedEntryId)) {
        continue;
      }

      const key = String(points);
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }

  return counts;
}

export function aggregatePartyScores(
  voteRecords: Vote[],
  validEntryIds: Set<string>,
): CountryScoreTotal[] {
  const totals = new Map<string, number>();

  for (const vote of voteRecords) {
    const allocations = readAllocations(vote);

    for (const [entryId, points] of Object.entries(allocations)) {
      if (!validEntryIds.has(entryId)) {
        continue;
      }

      totals.set(entryId, (totals.get(entryId) ?? 0) + points);
    }
  }

  return [...totals.entries()]
    .map(([entryId, totalPoints]) => ({ entryId, totalPoints }))
    .sort((left, right) => right.totalPoints - left.totalPoints);
}

export function compareScoreboardRows(
  left: PartyScoreboardRow,
  right: PartyScoreboardRow,
): number {
  if (right.totalPoints !== left.totalPoints) {
    return right.totalPoints - left.totalPoints;
  }

  for (const points of EUROVISION_TIEBREAK_POINT_ORDER) {
    const key = String(points);
    const diff = (right.pointReceipts[key] ?? 0) - (left.pointReceipts[key] ?? 0);

    if (diff !== 0) {
      return diff;
    }
  }

  return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name);
}

export function buildPartyScoreboardSnapshot(input: {
  entries: PartyEntry[];
  voteRecords: Vote[];
  computedAt?: string;
}): PartyScoreboardSnapshot {
  const validEntryIds = new Set(input.entries.map((entry) => entry.id));
  const totals = aggregatePartyScores(input.voteRecords, validEntryIds);
  const totalsByEntryId = new Map(totals.map((row) => [row.entryId, row.totalPoints]));

  const rows = input.entries
    .map((entry) => ({
      entryId: entry.id,
      name: entry.name,
      flagEmoji: entry.flagEmoji,
      sortOrder: entry.sortOrder,
      totalPoints: totalsByEntryId.get(entry.id) ?? 0,
      pointReceipts: countPointReceiptsForEntry(
        input.voteRecords,
        entry.id,
        validEntryIds,
      ),
    }))
    .sort((left, right) => compareScoreboardRows(left, right));

  return {
    version: 1,
    computedAt: input.computedAt ?? new Date().toISOString(),
    voteCount: input.voteRecords.length,
    rows,
    totals,
  };
}

export function parsePartyScoreboardSnapshot(
  scoreboardJson: string,
): PartyScoreboardSnapshot {
  const parsed = JSON.parse(scoreboardJson) as PartyScoreboardSnapshot;

  if (parsed.version !== 1 || !Array.isArray(parsed.rows)) {
    throw new Error("Invalid party scoreboard snapshot");
  }

  return parsed;
}

export function serializeVoteDetail(vote: Vote, allocations: VoteAllocations) {
  return {
    id: vote.id,
    partyId: vote.partyId,
    participantId: vote.participantId,
    allocations,
    createdAt: vote.createdAt,
    updatedAt: vote.updatedAt,
  };
}
