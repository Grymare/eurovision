export type SerializedParty = {
  id: string;
  code: string;
  title: string | null;
  state: string;
  hostParticipantId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SerializedParticipant = {
  id: string;
  partyId: string;
  nickname: string;
  isHost: boolean;
  hasVoted: boolean;
  joinedAt: string;
};

export type SerializedEntry = {
  id: string;
  partyId: string;
  name: string;
  flagEmoji: string;
  sortOrder: number;
};

export type PartyOverviewResponse = {
  party: SerializedParty;
  entries: SerializedEntry[];
  participants: SerializedParticipant[];
  viewer: {
    isHost: boolean;
    participant: SerializedParticipant | null;
  };
};
