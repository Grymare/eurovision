import {
  setHostSessionCookie,
  setParticipantSessionCookie,
} from "@/lib/auth/cookies";
import { assertDevMockDataEnabled } from "@/lib/dev/mock-data";
import { toErrorResponse } from "@/lib/http/errors";
import { parseJsonBody } from "@/lib/http/validation";
import {
  createDevQuickStartParty,
  serializeParticipant,
  serializeParty,
} from "@/lib/party/service";
import { broadcastVotingStatus } from "@/lib/socket/party-broadcast";
import { NextResponse } from "next/server";
import { z } from "zod";

const devQuickStartSchema = z.object({
  hostNickname: z.string().trim().min(2).max(24).default("Dev Host"),
  title: z.string().trim().max(80).optional(),
});

export async function POST(request: Request) {
  try {
    assertDevMockDataEnabled();

    const body = parseJsonBody(devQuickStartSchema, await request.json().catch(() => ({})));
    const result = await createDevQuickStartParty(body);

    await setHostSessionCookie(result.hostSessionToken);
    await setParticipantSessionCookie(result.participantSessionToken);
    await broadcastVotingStatus(result.party.id);

    return NextResponse.json({
      party: serializeParty(result.party),
      participant: result.participant
        ? serializeParticipant(result.participant)
        : null,
      mockSetId: result.mockSetId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Mock data is only available in development") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return toErrorResponse(error);
  }
}
