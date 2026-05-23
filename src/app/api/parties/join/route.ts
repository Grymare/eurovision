import { setParticipantSessionCookie } from "@/lib/auth/cookies";
import { toErrorResponse } from "@/lib/http/errors";
import { parseJsonBody } from "@/lib/http/validation";
import {
  joinParty,
  serializeParticipant,
  serializeParty,
} from "@/lib/party/service";
import { NextResponse } from "next/server";
import { z } from "zod";

const joinPartySchema = z.object({
  code: z.string().trim().min(4).max(8),
  nickname: z.string().trim().min(2).max(24),
});

export async function POST(request: Request) {
  try {
    const body = parseJsonBody(joinPartySchema, await request.json());
    const result = await joinParty(body);

    await setParticipantSessionCookie(result.participantSessionToken);

    return NextResponse.json({
      party: serializeParty(result.party),
      participant: serializeParticipant(result.participant),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
