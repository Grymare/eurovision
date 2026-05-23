import { getHostSessionToken } from "@/lib/auth/cookies";
import { toErrorResponse } from "@/lib/http/errors";
import { removeParticipant, requireHostParty } from "@/lib/party/service";
import { broadcastVotingStatus } from "@/lib/socket/party-broadcast";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ code: string; participantId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { code, participantId } = await context.params;
    const hostToken = await getHostSessionToken();
    const party = await requireHostParty(hostToken, code);

    await removeParticipant(party, participantId);
    await broadcastVotingStatus(party.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
