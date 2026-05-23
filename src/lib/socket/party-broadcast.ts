import {
  getPartyOverview,
  serializeEntry,
  serializeParticipant,
} from "@/lib/party/service";
import { getSocketServer } from "@/lib/socket-server";
import {
  partyRoomId,
  SERVER_EVENTS,
  type VoteSubmittedPayload,
  type VotingStatusPayload,
} from "@/lib/socket/party-events";

export async function buildVotingStatusPayload(
  partyId: string,
): Promise<VotingStatusPayload> {
  const overview = await getPartyOverview(partyId);

  return {
    partyId,
    party: {
      id: overview.party.id,
      state: overview.party.state,
      updatedAt: overview.party.updatedAt,
    },
    participants: overview.participants.map(serializeParticipant),
    entries: overview.entries.map(serializeEntry),
    at: new Date().toISOString(),
  };
}

function emitToPartyRoom(partyId: string, event: string, payload: unknown) {
  try {
    const io = getSocketServer();
    io.to(partyRoomId(partyId)).emit(event, payload);
  } catch {
    // Socket server unavailable outside the custom Node entrypoint.
  }
}

export async function emitVotingStatusToSocket(
  socketId: string,
  partyId: string,
) {
  try {
    const io = getSocketServer();
    const payload = await buildVotingStatusPayload(partyId);
    io.to(socketId).emit(SERVER_EVENTS.votingStatus, payload);
  } catch {
    // Socket server unavailable outside the custom Node entrypoint.
  }
}

export async function broadcastVotingStatus(partyId: string) {
  const payload = await buildVotingStatusPayload(partyId);
  emitToPartyRoom(partyId, SERVER_EVENTS.votingStatus, payload);
}

export async function broadcastVoteSubmitted(
  partyId: string,
  participantId: string,
  nickname: string,
) {
  const payload: VoteSubmittedPayload = {
    partyId,
    participantId,
    nickname,
    hasVoted: true,
    at: new Date().toISOString(),
  };

  emitToPartyRoom(partyId, SERVER_EVENTS.voteSubmitted, payload);
  await broadcastVotingStatus(partyId);
}
