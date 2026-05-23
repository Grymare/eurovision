import { getHostSessionToken, getParticipantSessionToken } from "@/lib/auth/cookies";
import { toErrorResponse } from "@/lib/http/errors";
import { isPartyState } from "@/lib/party/constants";
import {
  getParticipantBySessionToken,
  getParticipantVote,
  getPartyOverview,
  parseVoteAllocations,
  requireHostParty,
  serializeEntry,
  serializeParticipant,
  serializeParty,
  updatePartyState,
} from "@/lib/party/service";
import { broadcastVotingStatus } from "@/lib/socket/party-broadcast";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const overview = await getPartyOverview(code);
    const hostToken = await getHostSessionToken();
    const participantToken = await getParticipantSessionToken();
    const participant = participantToken
      ? await getParticipantBySessionToken(participantToken)
      : null;

    const isHost =
      Boolean(hostToken) &&
      overview.party.hostSessionToken === hostToken;

    const viewerParticipant =
      participant && participant.partyId === overview.party.id ? participant : null;

    const voteRecord =
      viewerParticipant ?
        await getParticipantVote(viewerParticipant.id, overview.party.id)
      : null;

    return NextResponse.json({
      party: serializeParty(overview.party),
      entries: overview.entries.map(serializeEntry),
      participants: overview.participants.map(serializeParticipant),
      viewer: {
        isHost,
        participant:
          viewerParticipant ? serializeParticipant(viewerParticipant) : null,
        vote:
          viewerParticipant ?
            {
              hasVoted: viewerParticipant.hasVoted,
              allocations: voteRecord ? parseVoteAllocations(voteRecord) : null,
            }
          : null,
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const hostToken = await getHostSessionToken();
    const party = await requireHostParty(hostToken, code);
    const body = (await request.json()) as { state?: string };

    if (!body.state) {
      return NextResponse.json({ error: "state is required" }, { status: 400 });
    }

    if (!isPartyState(body.state)) {
      return NextResponse.json({ error: "Invalid party state" }, { status: 400 });
    }

    const updated = await updatePartyState(party, body.state);

    if (!updated) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    await broadcastVotingStatus(party.id);

    return NextResponse.json({ party: serializeParty(updated) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
