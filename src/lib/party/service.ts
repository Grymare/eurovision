import { db } from "@/db";
import {
  parties,
  partyEntries,
  partyResults,
  participants,
  votes,
  type Party,
  type PartyEntry,
  type Participant,
  type VoteAllocations,
} from "@/db/schema";
import { findCountryCatalogEntry } from "@/lib/countries/catalog";
import { AppError } from "@/lib/http/errors";
import {
  canEditEntries,
  canJoinParty,
  canRemoveParticipant,
  joinPartyBlockedMessage,
  MIN_BALLOT_ENTRIES,
  type PartyState,
} from "@/lib/party/constants";
import { EUROVISION_2026_ENTRY_SET, getMockEntrySet } from "@/lib/party/mock-data";
import type { MockPartyEntry } from "@/lib/party/mock-data/types";
import { buildRandomDevBallotAllocations } from "@/lib/party/dev-ballot";
import {
  applyAllocationsToTotals,
  createInitialPresentationState,
  extractLowPointAllocations,
  extractTwelvePointAllocation,
  parsePresentationState,
  serializePresentationState,
  shuffleParticipantIds,
  type PresentationAction,
  type PresentationHostView,
  type PresentationState,
} from "@/lib/party/presentation";
import { validateVoteAllocations } from "@/lib/party/vote-validation";
import {
  buildPartyScoreboardSnapshot,
  parsePartyScoreboardSnapshot,
  type PartyScoreboardSnapshot,
} from "@/lib/party/score-aggregation";
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

export async function getPartyByRef(ref: string) {
  const trimmed = ref.trim();

  if (!trimmed) {
    return undefined;
  }

  const byCode = await getPartyByCode(trimmed);

  if (byCode) {
    return byCode;
  }

  return getPartyById(trimmed);
}

export async function resolvePartyRef(ref: string) {
  const party = await getPartyByRef(ref);

  if (!party) {
    throw new AppError("Party not found", 404, "PARTY_NOT_FOUND");
  }

  return party;
}

export async function getParticipantBySessionToken(token: string) {
  return db.query.participants.findFirst({
    where: eq(participants.sessionToken, token),
  });
}

export async function requireHostParty(hostToken: string | null, partyRef: string) {
  if (!hostToken) {
    throw new AppError("Host authentication required", 401, "HOST_AUTH_REQUIRED");
  }

  const party = await getPartyByRef(partyRef);

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

export async function createDevQuickStartParty(input: {
  hostNickname: string;
  title?: string;
  mockSetId?: string;
}) {
  const result = await createParty(input);
  let party = result.party;
  const mockSetId = input.mockSetId ?? EUROVISION_2026_ENTRY_SET.id;

  await seedMockEntries(party, mockSetId);

  const lobbyParty = await updatePartyState(party, "lobby");
  if (!lobbyParty) {
    throw new AppError("Failed to open lobby", 500, "PARTY_STATE_UPDATE_FAILED");
  }

  party = lobbyParty;

  const votingParty = await updatePartyState(party, "voting_open");
  if (!votingParty) {
    throw new AppError("Failed to open voting", 500, "PARTY_STATE_UPDATE_FAILED");
  }

  return {
    ...result,
    party: votingParty,
    mockSetId,
  };
}

function insertDevMockParticipantVote(
  partyId: string,
  nickname: string,
  allocations: VoteAllocations,
) {
  const participantId = createId();

  db.insert(participants)
    .values({
      id: participantId,
      partyId,
      nickname,
      sessionToken: createSessionToken(),
      isHost: false,
      hasVoted: true,
    })
    .run();

  db.insert(votes)
    .values({
      id: createId(),
      partyId,
      participantId,
      allocationsJson: JSON.stringify(allocations),
    })
    .run();

  return participantId;
}

export async function createDevScoreboardFixtureParty(input: {
  hostNickname: string;
  title?: string;
  mockSetId?: string;
  voteCount?: number;
  nearEnd?: boolean;
}) {
  const voteCount = input.voteCount ?? 10;

  if (voteCount < 1 || voteCount > 24) {
    throw new AppError("voteCount must be between 1 and 24", 400, "INVALID_VOTE_COUNT");
  }

  const result = await createDevQuickStartParty(input);
  let party = result.party;
  const entries = await listEntries(party.id);
  const entryIds = entries.map((entry) => entry.id);

  if (entryIds.length < MIN_BALLOT_ENTRIES) {
    throw new AppError("Not enough countries for mock ballots", 500, "DEV_FIXTURE_FAILED");
  }

  let votesSeeded = 0;

  if (result.participant) {
    const hostAllocations = buildRandomDevBallotAllocations(entryIds);

    if (!hostAllocations) {
      throw new AppError("Could not build host ballot", 500, "DEV_FIXTURE_FAILED");
    }

    await submitParticipantVote({
      partyId: party.id,
      participantId: result.participant.id,
      allocations: hostAllocations,
    });
    votesSeeded += 1;
  }

  for (let index = votesSeeded; index < voteCount; index += 1) {
    const allocations = buildRandomDevBallotAllocations(entryIds);

    if (!allocations) {
      throw new AppError("Could not build mock ballot", 500, "DEV_FIXTURE_FAILED");
    }

    insertDevMockParticipantVote(party.id, `Jury ${index}`, allocations);
    votesSeeded += 1;
  }

  const closedParty = await updatePartyState(party, "voting_closed");
  if (!closedParty) {
    throw new AppError("Failed to close voting", 500, "PARTY_STATE_UPDATE_FAILED");
  }

  party = closedParty;

  const presentingParty = await updatePartyState(party, "presenting");
  if (!presentingParty) {
    throw new AppError("Failed to start presentation", 500, "PARTY_STATE_UPDATE_FAILED");
  }

  party = presentingParty;

  await initializePresentation(party.id);
  party = (await getPartyById(party.id)) ?? party;

  if (input.nearEnd) {
    await skipPresentationToLastJury(party.id);
    party = (await getPartyById(party.id)) ?? party;
  }

  return {
    ...result,
    party,
    mockSetId: input.mockSetId ?? EUROVISION_2026_ENTRY_SET.id,
    votesSeeded,
  };
}

export async function joinParty(input: { code: string; nickname: string }) {
  const party = await getPartyByCode(input.code.trim());

  if (!party) {
    throw new AppError("Party not found", 404, "PARTY_NOT_FOUND");
  }

  if (!canJoinParty(party.state)) {
    throw new AppError(joinPartyBlockedMessage(party.state), 409, "PARTY_CLOSED");
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

  if (nextState === "presenting") {
    await initializePresentation(party.id);
  }

  db.update(parties)
    .set({ state: nextState, updatedAt: nowIso() })
    .where(eq(parties.id, party.id))
    .run();

  if (nextState === "finished") {
    await snapshotPartyResults(party.id);
  }

  return getPartyById(party.id);
}

export async function addEntry(
  party: Party,
  input: { name: string; flagEmoji?: string },
) {
  if (!canEditEntries(party.state)) {
    throw new AppError("Entries cannot be edited in the current party state", 409, "ENTRIES_LOCKED");
  }

  const catalogEntry = findCountryCatalogEntry(input.name);

  if (!catalogEntry) {
    throw new AppError("Pick a country from the suggestions list", 400, "UNKNOWN_COUNTRY");
  }

  const name = catalogEntry.name;
  const flagEmoji = catalogEntry.flagEmoji;

  const existingEntries = await listEntries(party.id);
  const normalizedName = normalizeEntryName(name);

  if (existingEntries.some((entry) => normalizeEntryName(entry.name) === normalizedName)) {
    throw new AppError("That country is already in the list", 409, "ENTRY_ALREADY_EXISTS");
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

function normalizeEntryName(name: string) {
  return name.trim().toLocaleLowerCase();
}

export async function seedMockEntries(
  party: Party,
  setId: string,
  options: { skipExisting?: boolean } = {},
) {
  if (!canEditEntries(party.state)) {
    throw new AppError("Entries cannot be edited in the current party state", 409, "ENTRIES_LOCKED");
  }

  const mockSet = getMockEntrySet(setId);
  if (!mockSet) {
    throw new AppError("Unknown mock entry set", 400, "UNKNOWN_MOCK_ENTRY_SET");
  }

  const skipExisting = options.skipExisting ?? true;
  const existingEntries = await listEntries(party.id);
  const existingNames = new Set(existingEntries.map((entry) => normalizeEntryName(entry.name)));

  const toAdd: MockPartyEntry[] = [];
  for (const mockEntry of mockSet.entries) {
    const normalizedName = normalizeEntryName(mockEntry.name);
    if (skipExisting && existingNames.has(normalizedName)) {
      continue;
    }
    toAdd.push(mockEntry);
    existingNames.add(normalizedName);
  }

  const addedEntries = [];
  for (const mockEntry of toAdd) {
    addedEntries.push(await addEntry(party, mockEntry));
  }

  return {
    setId: mockSet.id,
    label: mockSet.label,
    added: addedEntries.length,
    skipped: mockSet.entries.length - addedEntries.length,
    entries: await listEntries(party.id),
  };
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

export async function removeParticipant(party: Party, participantId: string) {
  if (!canRemoveParticipant(party.state)) {
    throw new AppError(
      "Participants cannot be removed in the current party state",
      409,
      "PARTICIPANTS_LOCKED",
    );
  }

  const participant = await db.query.participants.findFirst({
    where: and(eq(participants.id, participantId), eq(participants.partyId, party.id)),
  });

  if (!participant) {
    throw new AppError("Participant not found", 404, "PARTICIPANT_NOT_FOUND");
  }

  if (participant.isHost) {
    throw new AppError("The host cannot be removed from the jury", 400, "CANNOT_REMOVE_HOST");
  }

  db.delete(votes)
    .where(and(eq(votes.partyId, party.id), eq(votes.participantId, participantId)))
    .run();

  const result = db
    .delete(participants)
    .where(and(eq(participants.id, participantId), eq(participants.partyId, party.id)))
    .run();

  if (result.changes === 0) {
    throw new AppError("Participant not found", 404, "PARTICIPANT_NOT_FOUND");
  }
}

export async function getPartyOverview(partyRef: string) {
  const party = await resolvePartyRef(partyRef);

  const [entryList, participantList] = await Promise.all([
    listEntries(party.id),
    listParticipants(party.id),
  ]);

  return {
    party,
    entries: entryList,
    participants: participantList,
  };
}

export async function requireParticipantForParty(
  participantToken: string | null,
  partyRef: string,
) {
  if (!participantToken) {
    throw new AppError("Participant authentication required", 401, "PARTICIPANT_AUTH_REQUIRED");
  }

  const party = await resolvePartyRef(partyRef);
  const participant = await getParticipantBySessionToken(participantToken);

  if (!participant || participant.partyId !== party.id) {
    throw new AppError("Participant access denied", 403, "PARTICIPANT_ACCESS_DENIED");
  }

  return participant;
}

export async function requirePartyViewer(
  hostToken: string | null,
  participantToken: string | null,
  partyRef: string,
) {
  if (hostToken) {
    const party = await requireHostParty(hostToken, partyRef);
    return { party, participant: null, isHost: true as const };
  }

  const participant = await requireParticipantForParty(participantToken, partyRef);
  const party = await resolvePartyRef(partyRef);

  return { party, participant, isHost: false as const };
}

export async function listPartyVotes(partyId: string) {
  return db
    .select()
    .from(votes)
    .where(eq(votes.partyId, partyId))
    .all();
}

export async function computePartyScoreboard(
  partyId: string,
): Promise<PartyScoreboardSnapshot> {
  const [entries, voteRecords] = await Promise.all([
    listEntries(partyId),
    listPartyVotes(partyId),
  ]);

  return buildPartyScoreboardSnapshot({ entries, voteRecords });
}

export async function initializePresentation(partyId: string) {
  const votedParticipants = (await listParticipants(partyId)).filter(
    (participant) => participant.hasVoted,
  );

  if (votedParticipants.length === 0) {
    throw new AppError(
      "At least one vote is required before starting presentation",
      409,
      "NO_VOTES",
    );
  }

  const entries = await listEntries(partyId);
  const state = createInitialPresentationState(
    shuffleParticipantIds(votedParticipants.map((participant) => participant.id)),
    entries.map((entry) => entry.id),
  );

  db.update(parties)
    .set({
      revealOrderJson: serializePresentationState(state),
      updatedAt: nowIso(),
    })
    .where(eq(parties.id, partyId))
    .run();
}

export async function skipPresentationToLastJury(partyId: string) {
  const state = parsePresentationState(
    (await getPartyById(partyId))?.revealOrderJson ?? null,
  );

  if (!state) {
    throw new AppError("Presentation has not started", 409, "PRESENTATION_NOT_INITIALIZED");
  }

  const juryCount = state.participantIds.length;

  if (juryCount < 1) {
    throw new AppError("At least one juror is required", 409, "PRESENTATION_REVEAL_FAILED");
  }

  const juryIndex = juryCount - 1;
  let runningTotals = { ...state.runningTotals };

  for (let index = 0; index < juryIndex; index += 1) {
    const participantId = state.participantIds[index];
    const vote = await getParticipantVote(participantId, partyId);

    if (!vote) {
      throw new AppError("Jury vote not found", 500, "PRESENTATION_REVEAL_FAILED");
    }

    const allocations = parseVoteAllocations(vote);

    runningTotals = applyAllocationsToTotals(
      runningTotals,
      Object.entries(allocations).map(([entryId, points]) => ({ entryId, points })),
    );
  }

  savePresentationState(partyId, {
    ...state,
    juryIndex,
    phase: "jury_intro",
    runningTotals,
  });
}

async function getCurrentJuryVote(partyId: string, state: PresentationState) {
  const participantId = state.participantIds[state.juryIndex];

  if (!participantId) {
    throw new AppError("Invalid jury index", 500, "PRESENTATION_REVEAL_FAILED");
  }

  const vote = await getParticipantVote(participantId, partyId);

  if (!vote) {
    throw new AppError("Jury vote not found", 500, "PRESENTATION_REVEAL_FAILED");
  }

  return vote;
}

async function buildPresentationHostView(partyId: string, state: PresentationState) {
  const [participantsList, entries, vote] = await Promise.all([
    listParticipants(partyId),
    listEntries(partyId),
    getCurrentJuryVote(partyId, state).catch(() => null),
  ]);

  const participantById = new Map(participantsList.map((participant) => [participant.id, participant]));
  const entryById = new Map(
    entries.map((entry) => [entry.id, { name: entry.name, flagEmoji: entry.flagEmoji }]),
  );

  const juryOrder = state.participantIds.map((participantId) => {
    const participant = participantById.get(participantId);

    return {
      id: participantId,
      nickname: participant?.nickname ?? "Unknown jury",
      isHost: participant?.isHost ?? false,
    };
  });

  const currentParticipant = participantById.get(state.participantIds[state.juryIndex] ?? "");
  const currentJury =
    currentParticipant ?
      {
        id: currentParticipant.id,
        nickname: currentParticipant.nickname,
        isHost: currentParticipant.isHost,
      }
    : null;

  let lowReveal = null;
  let twelveReveal = null;

  if (vote && (state.phase === "revealing_low" || state.phase === "reordering_low")) {
    lowReveal = extractLowPointAllocations(parseVoteAllocations(vote), entryById);
  }

  if (
    vote &&
    (state.phase === "revealing_twelve" || state.phase === "reordering_twelve")
  ) {
    twelveReveal = extractTwelvePointAllocation(parseVoteAllocations(vote), entryById);
  }

  return {
    phase: state.phase,
    juryIndex: state.juryIndex,
    juryCount: state.participantIds.length,
    runningTotals: state.runningTotals,
    currentJury,
    juryOrder,
    lowReveal,
    twelveReveal,
    isLastJury: state.juryIndex >= state.participantIds.length - 1,
  } satisfies PresentationHostView;
}

function savePresentationState(partyId: string, state: PresentationState) {
  db.update(parties)
    .set({
      revealOrderJson: serializePresentationState(state),
      updatedAt: nowIso(),
    })
    .where(eq(parties.id, partyId))
    .run();
}

export async function openPresentation(party: Party) {
  if (party.state !== "voting_closed" && party.state !== "presenting") {
    throw new AppError("Presentation cannot be opened yet", 409, "PRESENTATION_INACTIVE");
  }

  let currentParty = party;

  if (party.state === "voting_closed") {
    const updated = await updatePartyState(party, "presenting");

    if (!updated) {
      throw new AppError("Failed to start presentation", 500, "PARTY_STATE_UPDATE_FAILED");
    }

    currentParty = updated;
  } else if (!parsePresentationState(currentParty.revealOrderJson)) {
    await initializePresentation(currentParty.id);
    const refreshed = await getPartyById(currentParty.id);

    if (!refreshed) {
      throw new AppError("Party not found", 404, "PARTY_NOT_FOUND");
    }

    currentParty = refreshed;
  }

  return currentParty;
}

export async function getPresentationHostView(party: Party): Promise<PresentationHostView> {
  if (party.state !== "presenting" && party.state !== "finished") {
    throw new AppError("Presentation is not active", 409, "PRESENTATION_INACTIVE");
  }

  if (party.state === "finished") {
    const scoreboard = await getPartyScoresForPresentation(party.id, party.state);
    const winner = scoreboard.rows[0];

    return {
      phase: "complete",
      juryIndex: 0,
      juryCount: 0,
      runningTotals: Object.fromEntries(
        scoreboard.rows.map((row) => [row.entryId, row.totalPoints]),
      ),
      currentJury: null,
      juryOrder: [],
      lowReveal: null,
      twelveReveal: null,
      isLastJury: true,
    };
  }

  const state = parsePresentationState(party.revealOrderJson);

  if (!state) {
    throw new AppError("Presentation has not started", 409, "PRESENTATION_NOT_INITIALIZED");
  }

  return buildPresentationHostView(party.id, state);
}

export async function advancePresentation(
  party: Party,
  action: PresentationAction,
): Promise<{ party: Party; view: PresentationHostView }> {
  if (action === "open") {
    const opened = await openPresentation(party);
    const view = await getPresentationHostView(opened);

    return { party: opened, view };
  }

  if (party.state !== "presenting") {
    throw new AppError("Presentation is not active", 409, "PRESENTATION_INACTIVE");
  }

  if (action === "finish") {
    const updated = await updatePartyState(party, "finished");

    if (!updated) {
      throw new AppError("Failed to finish presentation", 500, "PARTY_STATE_UPDATE_FAILED");
    }

    const view = await getPresentationHostView(updated);

    return { party: updated, view };
  }

  const state = parsePresentationState(party.revealOrderJson);

  if (!state) {
    throw new AppError("Presentation has not started", 409, "PRESENTATION_NOT_INITIALIZED");
  }

  const vote = await getCurrentJuryVote(party.id, state);
  const allocations = parseVoteAllocations(vote);
  const entries = await listEntries(party.id);
  const entryById = new Map(
    entries.map((entry) => [entry.id, { name: entry.name, flagEmoji: entry.flagEmoji }]),
  );

  let nextState = state;

  switch (action) {
    case "begin_low_reveal":
      if (state.phase !== "jury_intro" && state.phase !== "awaiting_low") {
        throw new AppError("Cannot reveal low points now", 409, "INVALID_PRESENTATION_PHASE");
      }

      nextState = { ...state, phase: "revealing_low" };
      break;
    case "commit_low": {
      if (state.phase !== "revealing_low" && state.phase !== "reordering_low") {
        throw new AppError("Low points are not being revealed", 409, "INVALID_PRESENTATION_PHASE");
      }

      const lowAllocations = extractLowPointAllocations(allocations, entryById);

      nextState = {
        ...state,
        phase: "awaiting_twelve",
        runningTotals: applyAllocationsToTotals(state.runningTotals, lowAllocations),
      };
      break;
    }
    case "begin_twelve_reveal":
      if (state.phase !== "awaiting_twelve") {
        throw new AppError("Cannot reveal 12 points now", 409, "INVALID_PRESENTATION_PHASE");
      }

      nextState = { ...state, phase: "revealing_twelve" };
      break;
    case "commit_twelve": {
      if (state.phase !== "revealing_twelve" && state.phase !== "reordering_twelve") {
        throw new AppError("12 points are not being revealed", 409, "INVALID_PRESENTATION_PHASE");
      }

      const twelveAllocation = extractTwelvePointAllocation(allocations, entryById);

      if (!twelveAllocation) {
        throw new AppError("12-point allocation not found", 500, "PRESENTATION_REVEAL_FAILED");
      }

      const isLastJury = state.juryIndex >= state.participantIds.length - 1;

      nextState = {
        ...state,
        phase: isLastJury ? "winner" : "jury_handoff",
        runningTotals: applyAllocationsToTotals(state.runningTotals, [twelveAllocation]),
      };
      break;
    }
    case "next_jury":
      if (state.phase !== "jury_handoff") {
        throw new AppError("Cannot advance to the next jury yet", 409, "INVALID_PRESENTATION_PHASE");
      }

      nextState = {
        ...state,
        juryIndex: state.juryIndex + 1,
        phase: "jury_intro",
      };
      break;
    default:
      throw new AppError("Invalid presentation action", 400, "INVALID_PRESENTATION_ACTION");
  }

  savePresentationState(party.id, nextState);

  const updated = await getPartyById(party.id);

  if (!updated) {
    throw new AppError("Party not found", 404, "PARTY_NOT_FOUND");
  }

  const view = await buildPresentationHostView(updated.id, nextState);

  return { party: updated, view };
}

export async function getPartyResultSnapshot(partyId: string) {
  return db.query.partyResults.findFirst({
    where: eq(partyResults.partyId, partyId),
  });
}

export async function snapshotPartyResults(partyId: string) {
  const scoreboard = await computePartyScoreboard(partyId);
  const existing = await getPartyResultSnapshot(partyId);
  const scoreboardJson = JSON.stringify(scoreboard);

  if (existing) {
    db.update(partyResults)
      .set({
        scoreboardJson,
        computedAt: scoreboard.computedAt,
      })
      .where(eq(partyResults.id, existing.id))
      .run();
  } else {
    db.insert(partyResults)
      .values({
        id: createId(),
        partyId,
        scoreboardJson,
        computedAt: scoreboard.computedAt,
      })
      .run();
  }

  return scoreboard;
}

export async function getPartyScoresForPresentation(partyId: string, state: PartyState) {
  if (state === "finished") {
    const stored = await getPartyResultSnapshot(partyId);

    if (stored) {
      return parsePartyScoreboardSnapshot(stored.scoreboardJson);
    }
  }

  return computePartyScoreboard(partyId);
}

export async function getParticipantVote(participantId: string, partyId: string) {
  return db
    .select()
    .from(votes)
    .where(and(eq(votes.partyId, partyId), eq(votes.participantId, participantId)))
    .get();
}

export async function submitParticipantVote(input: {
  partyId: string;
  participantId: string;
  allocations: VoteAllocations;
}) {
  return db.transaction((tx) => {
    const party = tx
      .select()
      .from(parties)
      .where(eq(parties.id, input.partyId))
      .get();

    if (!party) {
      throw new AppError("Party not found", 404, "PARTY_NOT_FOUND");
    }

    if (party.state !== "voting_open") {
      throw new AppError("Voting is not open", 409, "VOTING_CLOSED");
    }

    const participant = tx
      .select()
      .from(participants)
      .where(
        and(eq(participants.id, input.participantId), eq(participants.partyId, party.id)),
      )
      .get();

    if (!participant) {
      throw new AppError("Participant not found", 404, "PARTICIPANT_NOT_FOUND");
    }

    const entryRows = tx
      .select()
      .from(partyEntries)
      .where(eq(partyEntries.partyId, party.id))
      .all();

    const validationError = validateVoteAllocations(input.allocations, entryRows);

    if (validationError) {
      throw new AppError(validationError, 400, "INVALID_BALLOT");
    }

    const existing = tx
      .select()
      .from(votes)
      .where(
        and(eq(votes.partyId, party.id), eq(votes.participantId, input.participantId)),
      )
      .get();

    const timestamp = nowIso();
    const allocationsJson = JSON.stringify(input.allocations);

    if (existing) {
      tx.update(votes)
        .set({ allocationsJson, updatedAt: timestamp })
        .where(eq(votes.id, existing.id))
        .run();
    } else {
      tx.insert(votes)
        .values({
          id: createId(),
          partyId: party.id,
          participantId: input.participantId,
          allocationsJson,
        })
        .run();
    }

    tx.update(participants)
      .set({ hasVoted: true })
      .where(eq(participants.id, input.participantId))
      .run();

    return tx
      .select()
      .from(votes)
      .where(
        and(eq(votes.partyId, party.id), eq(votes.participantId, input.participantId)),
      )
      .get();
  });
}

export function parseVoteAllocations(vote: { allocationsJson: string }): VoteAllocations {
  return JSON.parse(vote.allocationsJson) as VoteAllocations;
}
