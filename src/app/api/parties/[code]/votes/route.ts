import { getHostSessionToken, getParticipantSessionToken } from "@/lib/auth/cookies";
import { toErrorResponse } from "@/lib/http/errors";
import {
  listParticipants,
  listPartyVotes,
  parseVoteAllocations,
  requirePartyViewer,
  serializeParticipant,
} from "@/lib/party/service";
import { serializeVoteDetail } from "@/lib/party/score-aggregation";
import { assertVoteDetailsRevealable } from "@/lib/party/vote-secrecy";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const hostToken = await getHostSessionToken();
    const participantToken = await getParticipantSessionToken();
    const { party } = await requirePartyViewer(hostToken, participantToken, code);

    assertVoteDetailsRevealable(party.state);

    const [voteRecords, participantList] = await Promise.all([
      listPartyVotes(party.id),
      listParticipants(party.id),
    ]);

    const participantsById = new Map(
      participantList.map((participant) => [participant.id, participant]),
    );

    return NextResponse.json({
      votes: voteRecords.map((vote) => {
        const participant = participantsById.get(vote.participantId);

        return {
          ...serializeVoteDetail(vote, parseVoteAllocations(vote)),
          participant:
            participant ?
              {
                id: participant.id,
                nickname: participant.nickname,
                isHost: participant.isHost,
              }
            : null,
        };
      }),
      participants: participantList.map(serializeParticipant),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
