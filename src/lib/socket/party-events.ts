import type { SerializedEntry, SerializedParticipant, SerializedParty } from "@/lib/party/types";

export const CLIENT_EVENTS = {
  joinParty: "client:join_party",
  ping: "client:ping",
} as const;

export const SERVER_EVENTS = {
  ready: "server:ready",
  pong: "server:pong",
  votingStatus: "voting_status",
  voteSubmitted: "vote_submitted",
  error: "server:error",
} as const;

export type JoinPartyPayload = {
  partyId: string;
};

export type VotingStatusPayload = {
  partyId: string;
  party: Pick<SerializedParty, "id" | "state" | "updatedAt">;
  participants: SerializedParticipant[];
  entries: SerializedEntry[];
  at: string;
};

export type VoteSubmittedPayload = {
  partyId: string;
  participantId: string;
  nickname: string;
  hasVoted: true;
  at: string;
};

export type ServerErrorPayload = {
  code: string;
  message?: string;
};

export function partyRoomId(partyId: string) {
  return `party:${partyId}`;
}
