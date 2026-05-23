import { getHostSessionToken, getParticipantSessionToken } from "@/lib/auth/cookies";
import { toErrorResponse } from "@/lib/http/errors";
import { isPartyState } from "@/lib/party/constants";
import {
  getParticipantBySessionToken,
  getPartyOverview,
  requireHostParty,
  serializeEntry,
  serializeParticipant,
  serializeParty,
  updatePartyState,
} from "@/lib/party/service";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ partyId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { partyId } = await context.params;
    const overview = await getPartyOverview(partyId);
    const hostToken = await getHostSessionToken();
    const participantToken = await getParticipantSessionToken();
    const participant = participantToken
      ? await getParticipantBySessionToken(participantToken)
      : null;

    const isHost =
      Boolean(hostToken) &&
      overview.party.hostSessionToken === hostToken;

    return NextResponse.json({
      party: serializeParty(overview.party),
      entries: overview.entries.map(serializeEntry),
      participants: overview.participants.map(serializeParticipant),
      viewer: {
        isHost,
        participant:
          participant && participant.partyId === partyId
            ? serializeParticipant(participant)
            : null,
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { partyId } = await context.params;
    const hostToken = await getHostSessionToken();
    const party = await requireHostParty(hostToken, partyId);
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

    return NextResponse.json({ party: serializeParty(updated) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
