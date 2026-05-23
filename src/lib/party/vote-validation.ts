import { EUROVISION_POINT_VALUES } from "@/lib/party/constants";
import type { VoteAllocations } from "@/db/schema";

export function validateVoteAllocations(
  allocations: VoteAllocations,
  entries: Array<{ id: string }>,
): string | null {
  const entryIds = new Set(entries.map((entry) => entry.id));
  const pairs = Object.entries(allocations);

  if (pairs.length !== EUROVISION_POINT_VALUES.length) {
    return `Assign exactly ${EUROVISION_POINT_VALUES.length} countries.`;
  }

  const usedPoints: number[] = [];
  const usedEntries = new Set<string>();

  for (const [entryId, points] of pairs) {
    if (!entryIds.has(entryId)) {
      return "One or more countries are invalid for this party.";
    }

    if (usedEntries.has(entryId)) {
      return "Each country can only receive points once.";
    }

    usedEntries.add(entryId);

    if (!EUROVISION_POINT_VALUES.includes(points as (typeof EUROVISION_POINT_VALUES)[number])) {
      return "Use only valid Eurovision point values.";
    }

    usedPoints.push(points);
  }

  const expected = [...EUROVISION_POINT_VALUES].sort((a, b) => a - b);
  const actual = [...usedPoints].sort((a, b) => a - b);

  for (let index = 0; index < expected.length; index += 1) {
    if (expected[index] !== actual[index]) {
      return "Use each point value exactly once: 1, 2, 3, 4, 5, 6, 7, 8, 10, 12.";
    }
  }

  return null;
}

export const BALLOT_POINT_ORDER = [...EUROVISION_POINT_VALUES].sort((a, b) => b - a);
