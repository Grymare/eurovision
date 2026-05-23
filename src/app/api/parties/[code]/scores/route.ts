import { getHostSessionToken, getParticipantSessionToken } from "@/lib/auth/cookies";
import { toErrorResponse } from "@/lib/http/errors";
import {
  getPartyScoresForPresentation,
  requirePartyViewer,
} from "@/lib/party/service";
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

    const scoreboard = await getPartyScoresForPresentation(party.id, party.state);

    return NextResponse.json({
      computedAt: scoreboard.computedAt,
      voteCount: scoreboard.voteCount,
      scores: scoreboard.rows.map((row) => ({
        entry: {
          id: row.entryId,
          partyId: party.id,
          name: row.name,
          flagEmoji: row.flagEmoji,
          sortOrder: row.sortOrder,
        },
        totalPoints: row.totalPoints,
        pointReceipts: row.pointReceipts,
      })),
      totals: scoreboard.totals,
      snapshot: party.state === "finished",
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
