export const PARTY_CODE_LENGTH = 6;

/** Minimum countries required to join a party, run a ballot, and start voting. */
export const MIN_PARTY_ENTRIES = 10;

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

export function canRemoveParticipant(state: PartyState): boolean {
  return state === "draft" || state === "lobby" || state === "voting_open";
}

export function canJoinParty(state: PartyState): boolean {
  return state === "draft" || state === "lobby" || state === "voting_open";
}

export function joinPartyBlockedMessage(state: PartyState): string {
  switch (state) {
    case "voting_closed":
      return "Voting is closed — new guests can't join.";
    case "presenting":
      return "The presentation has started — new guests can't join.";
    case "finished":
      return "This party has finished.";
    default:
      return "You can't join this party right now.";
  }
}

export function joinPartyNeedsMoreEntriesMessage(entryCount: number): string {
  const remaining = MIN_PARTY_ENTRIES - entryCount;

  return `The host is still setting up — ${remaining} more ${
    remaining === 1 ? "country is" : "countries are"
  } needed before guests can join (need at least ${MIN_PARTY_ENTRIES}).`;
}
