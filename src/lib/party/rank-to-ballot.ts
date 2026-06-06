import type { VoteAllocations } from "@/db/schema";
import { BALLOT_POINT_ORDER } from "@/lib/party/vote-validation";

/** Map a best-to-worst ranking to classic Eurovision ballot slots (top 10 only). */
export function rankedEntryIdsToBallotSlots(
  rankedEntryIds: string[],
): Record<number, string> {
  const slots: Record<number, string> = {};

  for (const points of BALLOT_POINT_ORDER) {
    slots[points] = "";
  }

  rankedEntryIds.slice(0, BALLOT_POINT_ORDER.length).forEach((entryId, index) => {
    const points = BALLOT_POINT_ORDER[index];
    if (points !== undefined) {
      slots[points] = entryId;
    }
  });

  return slots;
}

export function rankedEntryIdsToAllocations(rankedEntryIds: string[]): VoteAllocations {
  const allocations: VoteAllocations = {};

  rankedEntryIds.slice(0, BALLOT_POINT_ORDER.length).forEach((entryId, index) => {
    const points = BALLOT_POINT_ORDER[index];
    if (points !== undefined) {
      allocations[entryId] = points;
    }
  });

  return allocations;
}

/** Eurovision points awarded for a 0-based rank index (best = 12, etc.). */
export function pointsForRankIndex(rankIndex: number): number | null {
  const points = BALLOT_POINT_ORDER[rankIndex];
  return points ?? null;
}
