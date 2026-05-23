import type { PartyState } from "@/lib/party/constants";
import { AppError } from "@/lib/http/errors";

const REVEAL_STATES = new Set<PartyState>(["presenting", "finished"]);

export function canRevealVoteDetails(state: PartyState): boolean {
  return REVEAL_STATES.has(state);
}

export function assertVoteDetailsRevealable(state: PartyState): void {
  if (!canRevealVoteDetails(state)) {
    throw new AppError(
      "Vote details and scores are hidden until the presentation",
      403,
      "VOTE_SECRECY_ACTIVE",
    );
  }
}
