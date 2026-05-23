import { db } from "@/db";
import {
  parties,
  partyEntries,
  participants,
  votes,
  type Party,
  type PartyEntry,
  type Participant,
  type VoteAllocations,
} from "@/db/schema";
import { AppError } from "@/lib/http/errors";
import {
  canEditEntries,
  canJoinParty,
  MIN_BALLOT_ENTRIES,
  type PartyState,
} from "@/lib/party/constants";
import { validateVoteAllocations } from "@/lib/party/vote-validation";
import { createId, createPartyCode, createSessionToken } from "@/lib/party/tokens";
import { and, asc, count, eq, sql } from "drizzle-orm";

function nowIso() {
  return new Date().toISOString();
}

export function serializeParty(party: Party) {
  return {
    id: party.id,
    code: party.code,
    title: party.title,
    state: party.state,
    hostParticipantId: party.hostParticipantId,
    createdAt: party.createdAt,
    updatedAt: party.updatedAt,
  };
}

export function serializeParticipant(participant: Participant) {
  return {
    id: participant.id,
    partyId: participant.partyId,
    nickname: participant.nickname,
    isHost: participant.isHost,
    hasVoted: participant.hasVoted,
    joinedAt: participant.joinedAt,
  };
}

export function serializeEntry(entry: PartyEntry) {
  return {
    id: entry.id,
    partyId: entry.partyId,
    name: entry.name,
    flagEmoji: entry.flagEmoji,
    sortOrder: entry.sortOrder,
  };
}

export async function getPartyById(partyId: string) {
  return db.query.parties.findFirst({
    where: eq(parties.id, partyId),
  });
}

export async function getPartyByCode(code: string) {
  return db.query.parties.findFirst({
    where: eq(parties.code, code.toUpperCase()),
  });
}

export async function getParticipantBySessionToken(token: string) {
  return db.query.participants.findFirst({
    where: eq(participants.sessionToken, token),
  });
}

export async function requireHostParty(hostToken: string | null, partyId: string) {
  if (!hostToken) {
    throw new AppError("Host authentication required", 401, "HOST_AUTH_REQUIRED");
  }

  const party = await getPartyById(partyId);

  if (!party || party.hostSessionToken !== hostToken) {
    throw new AppError("Host access denied", 403, "HOST_ACCESS_DENIED");
  }

  return party;
}

export async function listParticipants(partyId: string) {
  return db
    .select()
    .from(participants)
    .where(eq(participants.partyId, partyId))
    .orderBy(asc(participants.joinedAt))
    .all();
}

export async function listEntries(partyId: string) {
  return db
    .select()
    .from(partyEntries)
    .where(eq(partyEntries.partyId, partyId))
    .orderBy(asc(partyEntries.sortOrder), asc(partyEntries.name))
    .all();
}

export async function countEntries(partyId: string) {
  const [result] = await db
    .select({ value: count() })
    .from(partyEntries)
    .where(eq(partyEntries.partyId, partyId))
    .all();

  return result?.value ?? 0;
}

export async function createParty(input: {
  hostNickname: string;
  title?: string;
}) {
  const nickname = input.hostNickname.trim();

  if (nickname.length < 2 || nickname.length > 24) {
    throw new AppError("Nickname must be 2–24 characters", 400, "INVALID_NICKNAME");
  }

  const partyId = createId();
  const hostParticipantId = createId();
  const hostSessionToken = createSessionToken();
  const participantSessionToken = createSessionToken();

  let code = createPartyCode();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await getPartyByCode(code);
    if (!existing) {
      break;
    }
    code = createPartyCode();
  }

  db.insert(parties)
    .values({
      id: partyId,
      code,
      title: input.title?.trim() || null,
      state: "draft",
      hostSessionToken,
      hostParticipantId,
    })
    .run();

  db.insert(participants)
    .values({
      id: hostParticipantId,
      partyId,
      nickname,
      sessionToken: participantSessionToken,
      isHost: true,
    })
    .run();

  const party = await getPartyById(partyId);

  if (!party) {
    throw new AppError("Failed to create party", 500, "PARTY_CREATE_FAILED");
  }

  return {
    party,
    hostSessionToken,
    participantSessionToken,
    participant: await getParticipantBySessionToken(participantSessionToken),
  };
}

export async function joinParty(input: { code: string; nickname: string }) {
  const party = await getPartyByCode(input.code.trim());

  if (!party) {
    throw new AppError("Party not found", 404, "PARTY_NOT_FOUND");
  }

  if (!canJoinParty(party.state)) {
    throw new AppError("This party is no longer accepting guests", 409, "PARTY_CLOSED");
  }

  const nickname = input.nickname.trim();

  if (nickname.length < 2 || nickname.length > 24) {
    throw new AppError("Nickname must be 2–24 characters", 400, "INVALID_NICKNAME");
  }

  const participantId = createId();
  const sessionToken = createSessionToken();

  try {
    db.insert(participants)
      .values({
        id: participantId,
        partyId: party.id,
        nickname,
        sessionToken,
        isHost: false,
      })
      .run();
  } catch {
    throw new AppError("That nickname is already taken in this party", 409, "NICKNAME_TAKEN");
  }

  const participant = await getParticipantBySessionToken(sessionToken);

  if (!participant) {
    throw new AppError("Failed to join party", 500, "PARTY_JOIN_FAILED");
  }

  return { party, participant, participantSessionToken: sessionToken };
}

export async function updatePartyState(party: Party, nextState: PartyState) {
  const allowed: Record<PartyState, PartyState[]> = {
    draft: ["lobby"],
    lobby: ["voting_open", "draft"],
    voting_open: ["voting_closed"],
    voting_closed: ["presenting", "voting_open"],
    presenting: ["finished"],
    finished: [],
  };

  if (!allowed[party.state].includes(nextState)) {
    throw new AppError(
      `Cannot move party from ${party.state} to ${nextState}`,
      409,
      "INVALID_STATE_TRANSITION",
    );
  }

  if (nextState === "voting_open") {
    const entryCount = await countEntries(party.id);
    if (entryCount < MIN_BALLOT_ENTRIES) {
      throw new AppError(
        `Add at least ${MIN_BALLOT_ENTRIES} countries before opening voting`,
        409,
        "NOT_ENOUGH_ENTRIES",
      );
    }
  }

  db.update(parties)
    .set({ state: nextState, updatedAt: nowIso() })
    .where(eq(parties.id, party.id))
    .run();

  return getPartyById(party.id);
}

export async function addEntry(
  party: Party,
  input: { name: string; flagEmoji: string },
) {
  if (!canEditEntries(party.state)) {
    throw new AppError("Entries cannot be edited in the current party state", 409, "ENTRIES_LOCKED");
  }

  const name = input.name.trim();
  const flagEmoji = input.flagEmoji.trim();

  if (!name) {
    throw new AppError("Country name is required", 400, "INVALID_ENTRY_NAME");
  }

  if (!flagEmoji) {
    throw new AppError("Flag emoji is required", 400, "INVALID_ENTRY_FLAG");
  }

  const [sortResult] = await db
    .select({ maxSort: sql<number>`coalesce(max(${partyEntries.sortOrder}), -1)` })
    .from(partyEntries)
    .where(eq(partyEntries.partyId, party.id))
    .all();

  const entryId = createId();

  db.insert(partyEntries)
    .values({
      id: entryId,
      partyId: party.id,
      name,
      flagEmoji,
      sortOrder: (sortResult?.maxSort ?? -1) + 1,
    })
    .run();

  const entry = await db.query.partyEntries.findFirst({
    where: eq(partyEntries.id, entryId),
  });

  if (!entry) {
    throw new AppError("Failed to add entry", 500, "ENTRY_CREATE_FAILED");
  }

  return entry;
}

export async function updateEntry(
  party: Party,
  entryId: string,
  input: { name?: string; flagEmoji?: string },
) {
  if (!canEditEntries(party.state)) {
    throw new AppError("Entries cannot be edited in the current party state", 409, "ENTRIES_LOCKED");
  }

  const entry = await db.query.partyEntries.findFirst({
    where: and(eq(partyEntries.id, entryId), eq(partyEntries.partyId, party.id)),
  });

  if (!entry) {
    throw new AppError("Entry not found", 404, "ENTRY_NOT_FOUND");
  }

  const name = input.name?.trim() ?? entry.name;
  const flagEmoji = input.flagEmoji?.trim() ?? entry.flagEmoji;

  if (!name || !flagEmoji) {
    throw new AppError("Name and flag are required", 400, "INVALID_ENTRY");
  }

  db.update(partyEntries)
    .set({ name, flagEmoji, updatedAt: nowIso() })
    .where(eq(partyEntries.id, entryId))
    .run();

  return db.query.partyEntries.findFirst({
    where: eq(partyEntries.id, entryId),
  });
}

export async function deleteEntry(party: Party, entryId: string) {
  if (!canEditEntries(party.state)) {
    throw new AppError("Entries cannot be edited in the current party state", 409, "ENTRIES_LOCKED");
  }

  const result = db
    .delete(partyEntries)
    .where(and(eq(partyEntries.id, entryId), eq(partyEntries.partyId, party.id)))
    .run();

  if (result.changes === 0) {
    throw new AppError("Entry not found", 404, "ENTRY_NOT_FOUND");
  }
}

export async function getPartyOverview(partyId: string) {
  const party = await getPartyById(partyId);

  if (!party) {
    throw new AppError("Party not found", 404, "PARTY_NOT_FOUND");
  }

  const [entryList, participantList] = await Promise.all([
    listEntries(partyId),
    listParticipants(partyId),
  ]);

  return {
    party,
    entries: entryList,
    participants: participantList,
  };
}

export async function requireParticipantForParty(
  participantToken: string | null,
  partyId: string,
) {
  if (!participantToken) {
    throw new AppError("Participant authentication required", 401, "PARTICIPANT_AUTH_REQUIRED");
  }

  const participant = await getParticipantBySessionToken(participantToken);

  if (!participant || participant.partyId !== partyId) {
    throw new AppError("Participant access denied", 403, "PARTICIPANT_ACCESS_DENIED");
  }

  return participant;
}

export async function getParticipantVote(participantId: string, partyId: string) {
  return db.query.votes.findFirst({
    where: and(eq(votes.partyId, partyId), eq(votes.participantId, participantId)),
  });
}

export async function submitParticipantVote(input: {
  partyId: string;
  participantId: string;
  allocations: VoteAllocations;
}) {
  const party = await getPartyById(input.partyId);

  if (!party) {
    throw new AppError("Party not found", 404, "PARTY_NOT_FOUND");
  }

  if (party.state !== "voting_open") {
    throw new AppError("Voting is not open", 409, "VOTING_CLOSED");
  }

  const entries = await listEntries(party.id);
  const validationError = validateVoteAllocations(input.allocations, entries);

  if (validationError) {
    throw new AppError(validationError, 400, "INVALID_BALLOT");
  }

  const existing = await getParticipantVote(input.participantId, party.id);
  const timestamp = nowIso();
  const allocationsJson = JSON.stringify(input.allocations);

  if (existing) {
    db.update(votes)
      .set({ allocationsJson, updatedAt: timestamp })
      .where(eq(votes.id, existing.id))
      .run();
  } else {
    db.insert(votes)
      .values({
        id: createId(),
        partyId: party.id,
        participantId: input.participantId,
        allocationsJson,
      })
      .run();
  }

  db.update(participants)
    .set({ hasVoted: true })
    .where(eq(participants.id, input.participantId))
    .run();

  return getParticipantVote(input.participantId, party.id);
}

export function parseVoteAllocations(vote: { allocationsJson: string }): VoteAllocations {
  return JSON.parse(vote.allocationsJson) as VoteAllocations;
}
