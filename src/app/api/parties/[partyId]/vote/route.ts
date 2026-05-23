import { getParticipantSessionToken } from "@/lib/auth/cookies";
import { toErrorResponse } from "@/lib/http/errors";
import {
  getParticipantVote,
  parseVoteAllocations,
  requireParticipantForParty,
  submitParticipantVote,
} from "@/lib/party/service";
import type { VoteAllocations } from "@/db/schema";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ partyId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { partyId } = await context.params;
    const participantToken = await getParticipantSessionToken();
    const participant = await requireParticipantForParty(participantToken, partyId);
    const vote = await getParticipantVote(participant.id, partyId);

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
    const { partyId } = await context.params;
    const participantToken = await getParticipantSessionToken();
    const participant = await requireParticipantForParty(participantToken, partyId);
    const body = (await request.json()) as { allocations?: VoteAllocations };

    if (!body.allocations || typeof body.allocations !== "object") {
      return NextResponse.json({ error: "allocations is required" }, { status: 400 });
    }

    const vote = await submitParticipantVote({
      partyId,
      participantId: participant.id,
      allocations: body.allocations,
    });

    if (!vote) {
      return NextResponse.json({ error: "Failed to save vote" }, { status: 500 });
    }

    return NextResponse.json({
      hasVoted: true,
      allocations: parseVoteAllocations(vote),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
