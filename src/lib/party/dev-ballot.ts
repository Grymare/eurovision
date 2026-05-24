import type { VoteAllocations } from "@/db/schema";
import { EUROVISION_POINT_VALUES, MIN_PARTY_ENTRIES } from "@/lib/party/constants";

function shuffleEntryIds(entryIds: string[]): string[] {
  const shuffled = [...entryIds];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

/** Deterministic rotation — useful for dev ballot fill in the vote UI. */
export function buildDevBallotAllocations(
  entryIds: string[],
  rotation = 0,
): VoteAllocations | null {
  if (entryIds.length < MIN_PARTY_ENTRIES) {
    return null;
  }

  const allocations: VoteAllocations = {};
  const pointValues = [...EUROVISION_POINT_VALUES];

  for (let index = 0; index < pointValues.length; index += 1) {
    const entryIndex = (index + rotation) % pointValues.length;
    allocations[entryIds[entryIndex]] = pointValues[index];
  }

  return allocations;
}

/** Random country assignment per point slot — used for dev scoreboard fixtures. */
export function buildRandomDevBallotAllocations(entryIds: string[]): VoteAllocations | null {
  if (entryIds.length < MIN_PARTY_ENTRIES) {
    return null;
  }

  const recipients = shuffleEntryIds(entryIds).slice(0, EUROVISION_POINT_VALUES.length);
  const allocations: VoteAllocations = {};

  for (let index = 0; index < EUROVISION_POINT_VALUES.length; index += 1) {
    allocations[recipients[index]] = EUROVISION_POINT_VALUES[index];
  }

  return allocations;
}
