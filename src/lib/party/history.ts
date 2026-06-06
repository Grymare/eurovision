import { db } from "@/db";
import { parties, participants, partyResults } from "@/db/schema";
import type { VoteAllocations } from "@/db/schema";
import {
  parsePartyScoreboardSnapshot,
  type PartyScoreboardRow,
} from "@/lib/party/score-aggregation";
import {
  listEntries,
  listParticipants,
  listPartyVotes,
  parseVoteAllocations,
} from "@/lib/party/service";
import { and, count, desc, eq, inArray } from "drizzle-orm";

export type FinishedPartyWinner = {
  name: string;
  flagEmoji: string;
  totalPoints: number;
};

export type FinishedPartySummary = {
  id: string;
  code: string;
  title: string | null;
  finishedAt: string;
  participantCount: number;
  voteCount: number;
  winner: FinishedPartyWinner | null;
};

export type CrossPartyCountryStat = {
  key: string;
  name: string;
  flagEmoji: string;
  totalPoints: number;
  wins: number;
  douzeReceived: number;
  partiesAppeared: number;
};

export type CrossPartyPointsGivenCountry = {
  name: string;
  flagEmoji: string;
  totalPoints: number;
};

export const TOP_POINTS_GIVEN_COUNTRIES = 10;

export type CrossPartyVoterStat = {
  key: string;
  nickname: string;
  userId: string | null;
  partiesVoted: number;
  topCountries: CrossPartyPointsGivenCountry[];
};

export type CrossPartyStats = {
  finishedPartyCount: number;
  countries: CrossPartyCountryStat[];
  voters: CrossPartyVoterStat[];
  personal: {
    partiesParticipated: number;
    topCountries: CrossPartyPointsGivenCountry[];
  } | null;
};

function winnerFromRows(rows: PartyScoreboardRow[]): FinishedPartyWinner | null {
  const winner = rows[0];

  if (!winner || winner.totalPoints <= 0) {
    return null;
  }

  return {
    name: winner.name,
    flagEmoji: winner.flagEmoji,
    totalPoints: winner.totalPoints,
  };
}

function summaryFromSnapshot(input: {
  party: typeof parties.$inferSelect;
  result: typeof partyResults.$inferSelect;
  participantCount: number;
}): FinishedPartySummary {
  const snapshot = parsePartyScoreboardSnapshot(input.result.scoreboardJson);

  return {
    id: input.party.id,
    code: input.party.code,
    title: input.party.title,
    finishedAt: input.result.computedAt,
    participantCount: input.participantCount,
    voteCount: snapshot.voteCount,
    winner: winnerFromRows(snapshot.rows),
  };
}

async function participantCountsByPartyId(partyIds: string[]) {
  if (partyIds.length === 0) {
    return new Map<string, number>();
  }

  const rows = await db
    .select({
      partyId: participants.partyId,
      participantCount: count(),
    })
    .from(participants)
    .where(inArray(participants.partyId, partyIds))
    .groupBy(participants.partyId);

  return new Map(rows.map((row) => [row.partyId, row.participantCount]));
}

async function loadFinishedPartyRows(partyIds: string[]) {
  if (partyIds.length === 0) {
    return [];
  }

  return db
    .select({
      party: parties,
      result: partyResults,
    })
    .from(parties)
    .innerJoin(partyResults, eq(partyResults.partyId, parties.id))
    .where(and(eq(parties.state, "finished"), inArray(parties.id, partyIds)))
    .orderBy(desc(parties.updatedAt));
}

export async function listFinishedPartiesForAdmin(): Promise<FinishedPartySummary[]> {
  const rows = await db
    .select({
      party: parties,
      result: partyResults,
    })
    .from(parties)
    .innerJoin(partyResults, eq(partyResults.partyId, parties.id))
    .where(eq(parties.state, "finished"))
    .orderBy(desc(parties.updatedAt));

  const counts = await participantCountsByPartyId(rows.map((row) => row.party.id));

  return rows.map((row) =>
    summaryFromSnapshot({
      party: row.party,
      result: row.result,
      participantCount: counts.get(row.party.id) ?? 0,
    }),
  );
}

export async function listFinishedPartiesForUser(userId: string): Promise<FinishedPartySummary[]> {
  const memberships = await db
    .selectDistinct({ partyId: participants.partyId })
    .from(participants)
    .where(eq(participants.userId, userId));

  const partyIds = memberships.map((row) => row.partyId);

  if (partyIds.length === 0) {
    return [];
  }

  const rows = await loadFinishedPartyRows(partyIds);
  const counts = await participantCountsByPartyId(rows.map((row) => row.party.id));

  return rows.map((row) =>
    summaryFromSnapshot({
      party: row.party,
      result: row.result,
      participantCount: counts.get(row.party.id) ?? 0,
    }),
  );
}

export async function deleteFinishedPartyByCode(code: string) {
  const normalizedCode = code.trim().toUpperCase();

  const deleted = await db
    .delete(parties)
    .where(and(eq(parties.code, normalizedCode), eq(parties.state, "finished")))
    .returning({ id: parties.id });

  return deleted.length > 0;
}

function countryKey(name: string, flagEmoji: string) {
  return `${name}::${flagEmoji}`;
}

function voterKey(nickname: string, userId: string | null) {
  return userId ?? `nickname:${nickname.toLowerCase()}`;
}

type VoterAccumulator = {
  key: string;
  nickname: string;
  userId: string | null;
  partiesVoted: number;
  pointsGivenByCountry: Map<string, CrossPartyPointsGivenCountry>;
};

function recordPointsGiven(
  allocations: VoteAllocations,
  entriesById: Map<string, { name: string; flagEmoji: string }>,
  targets: Map<string, CrossPartyPointsGivenCountry>,
) {
  for (const [entryId, points] of Object.entries(allocations)) {
    const entry = entriesById.get(entryId);

    if (!entry || points <= 0) {
      continue;
    }

    const key = countryKey(entry.name, entry.flagEmoji);
    const existing =
      targets.get(key) ??
      ({
        name: entry.name,
        flagEmoji: entry.flagEmoji,
        totalPoints: 0,
      } satisfies CrossPartyPointsGivenCountry);

    existing.totalPoints += points;
    targets.set(key, existing);
  }
}

function topCountriesByPointsGiven(
  targets: Map<string, CrossPartyPointsGivenCountry>,
  limit = TOP_POINTS_GIVEN_COUNTRIES,
): CrossPartyPointsGivenCountry[] {
  return [...targets.values()]
    .sort(
      (left, right) =>
        right.totalPoints - left.totalPoints || left.name.localeCompare(right.name),
    )
    .slice(0, limit);
}

export async function computeCrossPartyStats(userId?: string): Promise<CrossPartyStats> {
  const finishedRows = await db
    .select({
      party: parties,
      result: partyResults,
    })
    .from(parties)
    .innerJoin(partyResults, eq(partyResults.partyId, parties.id))
    .where(eq(parties.state, "finished"))
    .orderBy(desc(parties.updatedAt));

  const countryStats = new Map<string, CrossPartyCountryStat>();
  const voterStats = new Map<string, VoterAccumulator>();
  const countryAppearances = new Map<string, Set<string>>();

  let personalParties = 0;
  const personalPointsByCountry = new Map<string, CrossPartyPointsGivenCountry>();

  for (const row of finishedRows) {
    const snapshot = parsePartyScoreboardSnapshot(row.result.scoreboardJson);
    const winner = winnerFromRows(snapshot.rows);

    if (winner) {
      const winnerKey = countryKey(winner.name, winner.flagEmoji);
      const existing =
        countryStats.get(winnerKey) ??
        ({
          key: winnerKey,
          name: winner.name,
          flagEmoji: winner.flagEmoji,
          totalPoints: 0,
          wins: 0,
          douzeReceived: 0,
          partiesAppeared: 0,
        } satisfies CrossPartyCountryStat);

      existing.wins += 1;
      countryStats.set(winnerKey, existing);
    }

    for (const scoreRow of snapshot.rows) {
      const key = countryKey(scoreRow.name, scoreRow.flagEmoji);
      const appearances = countryAppearances.get(key) ?? new Set<string>();
      appearances.add(row.party.id);
      countryAppearances.set(key, appearances);

      const existing =
        countryStats.get(key) ??
        ({
          key,
          name: scoreRow.name,
          flagEmoji: scoreRow.flagEmoji,
          totalPoints: 0,
          wins: 0,
          douzeReceived: 0,
          partiesAppeared: 0,
        } satisfies CrossPartyCountryStat);

      existing.totalPoints += scoreRow.totalPoints;
      existing.douzeReceived += scoreRow.pointReceipts["12"] ?? 0;
      countryStats.set(key, existing);
    }

    const [voteRecords, participantList, entryRows] = await Promise.all([
      listPartyVotes(row.party.id),
      listParticipants(row.party.id),
      listEntries(row.party.id),
    ]);

    const entriesById = new Map(
      entryRows.map((entry) => [entry.id, { name: entry.name, flagEmoji: entry.flagEmoji }]),
    );
    const participantsById = new Map(participantList.map((participant) => [participant.id, participant]));

    for (const vote of voteRecords) {
      const participant = participantsById.get(vote.participantId);

      if (!participant) {
        continue;
      }

      const key = voterKey(participant.nickname, participant.userId);
      const voterStat =
        voterStats.get(key) ??
        ({
          key,
          nickname: participant.nickname,
          userId: participant.userId,
          partiesVoted: 0,
          pointsGivenByCountry: new Map<string, CrossPartyPointsGivenCountry>(),
        } satisfies VoterAccumulator);

      voterStat.partiesVoted += 1;

      const allocations = parseVoteAllocations(vote);
      recordPointsGiven(allocations, entriesById, voterStat.pointsGivenByCountry);

      voterStats.set(key, voterStat);

      if (userId && participant.userId === userId) {
        personalParties += 1;
        recordPointsGiven(allocations, entriesById, personalPointsByCountry);
      }
    }
  }

  for (const [key, appearances] of countryAppearances) {
    const stat = countryStats.get(key);

    if (stat) {
      stat.partiesAppeared = appearances.size;
    }
  }

  const countries = [...countryStats.values()].sort((left, right) => {
    if (right.wins !== left.wins) {
      return right.wins - left.wins;
    }

    if (right.totalPoints !== left.totalPoints) {
      return right.totalPoints - left.totalPoints;
    }

    return left.name.localeCompare(right.name);
  });

  const voters = [...voterStats.values()]
    .map((voter) => ({
      key: voter.key,
      nickname: voter.nickname,
      userId: voter.userId,
      partiesVoted: voter.partiesVoted,
      topCountries: topCountriesByPointsGiven(voter.pointsGivenByCountry),
    }))
    .sort((left, right) => {
      if (right.partiesVoted !== left.partiesVoted) {
        return right.partiesVoted - left.partiesVoted;
      }

      return left.nickname.localeCompare(right.nickname);
    });

  return {
    finishedPartyCount: finishedRows.length,
    countries,
    voters,
    personal:
      userId ?
        {
          partiesParticipated: personalParties,
          topCountries: topCountriesByPointsGiven(personalPointsByCountry),
        }
      : null,
  };
}

export async function getFinishedPartyReplay(partyId: string) {
  const [party, result, participantList, voteRecords, entryRows] = await Promise.all([
    db.query.parties.findFirst({ where: eq(parties.id, partyId) }),
    db.query.partyResults.findFirst({ where: eq(partyResults.partyId, partyId) }),
    listParticipants(partyId),
    listPartyVotes(partyId),
    listEntries(partyId),
  ]);

  if (!party || !result) {
    return null;
  }

  const snapshot = parsePartyScoreboardSnapshot(result.scoreboardJson);
  const entriesById = new Map(entryRows.map((entry) => [entry.id, entry]));
  const participantsById = new Map(participantList.map((participant) => [participant.id, participant]));

  const juryVotes = voteRecords
    .map((vote) => {
      const participant = participantsById.get(vote.participantId);

      if (!participant) {
        return null;
      }

      return {
        participant: {
          id: participant.id,
          nickname: participant.nickname,
          isHost: participant.isHost,
        },
        allocations: parseVoteAllocations(vote),
      };
    })
    .filter((vote): vote is NonNullable<typeof vote> => vote !== null)
    .sort((left, right) => left.participant.nickname.localeCompare(right.participant.nickname));

  return {
    party,
    snapshot,
    winner: winnerFromRows(snapshot.rows),
    participantCount: participantList.length,
    entriesById,
    juryVotes,
  };
}
