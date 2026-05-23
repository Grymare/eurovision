import type { VoteAllocations } from "@/db/schema";
import { EUROVISION_POINT_VALUES, MIN_BALLOT_ENTRIES } from "@/lib/party/constants";

export function buildDevBallotAllocations(entryIds: string[]): VoteAllocations | null {
  if (entryIds.length < MIN_BALLOT_ENTRIES) {
    return null;
  }

  const allocations: VoteAllocations = {};
  const pointValues = [...EUROVISION_POINT_VALUES];

  for (let index = 0; index < pointValues.length; index += 1) {
    allocations[entryIds[index]] = pointValues[index];
  }

  return allocations;
}
