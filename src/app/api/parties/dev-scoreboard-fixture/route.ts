import {
  setHostSessionCookie,
  setParticipantSessionCookie,
} from "@/lib/auth/cookies";
import { assertDevMockDataEnabled } from "@/lib/dev/mock-data";
import { toErrorResponse } from "@/lib/http/errors";
import { parseJsonBody } from "@/lib/http/validation";
import {
  createDevScoreboardFixtureParty,
  serializeParticipant,
  serializeParty,
} from "@/lib/party/service";
import { broadcastVotingStatus } from "@/lib/socket/party-broadcast";
import { NextResponse } from "next/server";
import { z } from "zod";

const devScoreboardFixtureSchema = z.object({
  hostNickname: z.string().trim().min(2).max(24).default("Dev Host"),
  title: z.string().trim().max(80).optional(),
  voteCount: z.number().int().min(1).max(24).default(10),
  nearEnd: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    assertDevMockDataEnabled();

    const body = parseJsonBody(
      devScoreboardFixtureSchema,
      await request.json().catch(() => ({})),
    );
    const result = await createDevScoreboardFixtureParty(body);

    await setHostSessionCookie(result.hostSessionToken);
    await setParticipantSessionCookie(result.participantSessionToken);
    await broadcastVotingStatus(result.party.id);

    return NextResponse.json({
      party: serializeParty(result.party),
      participant: result.participant
        ? serializeParticipant(result.participant)
        : null,
      mockSetId: result.mockSetId,
      votesSeeded: result.votesSeeded,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Mock data is only available in development") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return toErrorResponse(error);
  }
}
