import { getHostSessionToken } from "@/lib/auth/cookies";
import { AppError, toErrorResponse } from "@/lib/http/errors";
import { canEditEntries } from "@/lib/party/constants";
import {
  clearPartyVotes,
  clearPresentationState,
  requireHostParty,
} from "@/lib/party/service";
import { broadcastVotingStatus } from "@/lib/socket/party-broadcast";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const hostToken = await getHostSessionToken();
    const party = await requireHostParty(hostToken, code);

    if (!canEditEntries(party.state)) {
      throw new AppError("Votes cannot be reset in the current party state", 409, "VOTES_LOCKED");
    }

    clearPartyVotes(party.id);
    clearPresentationState(party.id);
    await broadcastVotingStatus(party.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
