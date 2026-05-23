import { getHostSessionToken, getParticipantSessionToken } from "@/lib/auth/cookies";
import { toErrorResponse } from "@/lib/http/errors";
import {
  getParticipantVote,
  listParticipants,
  parseVoteAllocations,
  requirePartyViewer,
} from "@/lib/party/service";
import { serializeVoteDetail } from "@/lib/party/score-aggregation";
import { assertVoteDetailsRevealable } from "@/lib/party/vote-secrecy";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ partyId: string; participantId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { partyId, participantId } = await context.params;
    const hostToken = await getHostSessionToken();
    const participantToken = await getParticipantSessionToken();
    const { party } = await requirePartyViewer(hostToken, participantToken, partyId);

    assertVoteDetailsRevealable(party.state);

    const vote = await getParticipantVote(participantId, partyId);

    if (!vote) {
      return NextResponse.json({ error: "Vote not found" }, { status: 404 });
    }

    const participantList = await listParticipants(partyId);
    const participant = participantList.find((entry) => entry.id === participantId) ?? null;

    return NextResponse.json({
      vote: serializeVoteDetail(vote, parseVoteAllocations(vote)),
      participant:
        participant ?
          {
            id: participant.id,
            nickname: participant.nickname,
            isHost: participant.isHost,
          }
        : null,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
