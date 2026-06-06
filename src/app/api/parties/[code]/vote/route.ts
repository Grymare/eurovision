import { getParticipantSessionToken } from "@/lib/auth/cookies";
import { toErrorResponse } from "@/lib/http/errors";
import { assertRateLimit } from "@/lib/http/rate-limit";
import {
  getParticipantVote,
  parseVoteAllocations,
  requireParticipantForParty,
  resolvePartyRef,
  submitParticipantVote,
} from "@/lib/party/service";
import { broadcastVoteSubmitted } from "@/lib/socket/party-broadcast";
import type { VoteAllocations } from "@/db/schema";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const party = await resolvePartyRef(code);
    const participantToken = await getParticipantSessionToken();
    const participant = await requireParticipantForParty(participantToken, code);
    const vote = await getParticipantVote(participant.id, party.id);

    if (!vote) {
      return NextResponse.json({ hasVoted: false, allocations: null });
    }

    return NextResponse.json({
      hasVoted: participant.hasVoted,
      allocations: parseVoteAllocations(vote),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const party = await resolvePartyRef(code);
    const participantToken = await getParticipantSessionToken();
    const participant = await requireParticipantForParty(participantToken, code);

    assertRateLimit(`vote:${participantToken}`, 30, 10 * 60 * 1000);

    const body = (await request.json()) as { allocations?: VoteAllocations };

    if (!body.allocations || typeof body.allocations !== "object") {
      return NextResponse.json({ error: "allocations is required" }, { status: 400 });
    }

    const vote = await submitParticipantVote({
      partyId: party.id,
      participantId: participant.id,
      allocations: body.allocations,
    });

    if (!vote) {
      return NextResponse.json({ error: "Failed to save vote" }, { status: 500 });
    }

    await broadcastVoteSubmitted(party.id, participant.id, participant.nickname);

    return NextResponse.json({
      hasVoted: true,
      allocations: parseVoteAllocations(vote),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
