import type { Vote, VoteAllocations } from "@/db/schema";

export type CountryScoreTotal = {
  entryId: string;
  totalPoints: number;
};

function readAllocations(vote: Vote): VoteAllocations {
  return JSON.parse(vote.allocationsJson) as VoteAllocations;
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
