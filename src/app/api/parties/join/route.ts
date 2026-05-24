import { auth } from "@/lib/auth";
import { setParticipantSessionCookie } from "@/lib/auth/cookies";
import { AppError, toErrorResponse } from "@/lib/http/errors";
import { parseJsonBody } from "@/lib/http/validation";
import {
  joinParty,
  serializeParticipant,
  serializeParty,
} from "@/lib/party/service";
import { broadcastVotingStatus } from "@/lib/socket/party-broadcast";
import { NextResponse } from "next/server";
import { z } from "zod";

const joinPartySchema = z.object({
  code: z.string().trim().min(4).max(8),
  nickname: z.string().trim().min(2).max(24).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = parseJsonBody(joinPartySchema, await request.json());

    const nickname =
      session?.user?.name?.trim() ||
      body.nickname?.trim() ||
      "";

    if (!nickname) {
      throw new AppError("Nickname is required", 400, "INVALID_NICKNAME");
    }

    const result = await joinParty({
      code: body.code,
      nickname,
      userId: session?.user?.id,
    });

    await setParticipantSessionCookie(result.participantSessionToken);
    await broadcastVotingStatus(result.party.id);

    return NextResponse.json({
      party: serializeParty(result.party),
      participant: serializeParticipant(result.participant),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
