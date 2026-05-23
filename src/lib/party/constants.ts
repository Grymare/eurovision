export const PARTY_CODE_LENGTH = 6;

export const MIN_PARTY_ENTRIES = 5;

/** Each jury assigns 10 point slots — need at least this many countries to vote. */
export const MIN_BALLOT_ENTRIES = 10;

export const EUROVISION_POINT_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12] as const;

export const PARTY_STATES = [
  "draft",
  "lobby",
  "voting_open",
  "voting_closed",
  "presenting",
  "finished",
] as const;

export type PartyState = (typeof PARTY_STATES)[number];

export const HOST_COOKIE = "eurovision_host_token";
export const PARTICIPANT_COOKIE = "eurovision_participant_token";

export function isPartyState(value: string): value is PartyState {
  return (PARTY_STATES as readonly string[]).includes(value);
}

export function canEditEntries(state: PartyState): boolean {
  return state === "draft" || state === "lobby";
}

export function canJoinParty(state: PartyState): boolean {
  return state === "lobby" || state === "voting_open";
}
