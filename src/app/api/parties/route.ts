import {
  setHostSessionCookie,
  setParticipantSessionCookie,
} from "@/lib/auth/cookies";
import { toErrorResponse } from "@/lib/http/errors";
import { parseJsonBody } from "@/lib/http/validation";
import {
  createParty,
  serializeParty,
  serializeParticipant,
} from "@/lib/party/service";
import { NextResponse } from "next/server";
import { z } from "zod";

const createPartySchema = z.object({
  hostNickname: z.string().trim().min(2).max(24),
  title: z.string().trim().max(80).optional(),
});

export async function POST(request: Request) {
  try {
    const body = parseJsonBody(createPartySchema, await request.json());
    const result = await createParty(body);

    await setHostSessionCookie(result.hostSessionToken);
    await setParticipantSessionCookie(result.participantSessionToken);

    return NextResponse.json({
      party: serializeParty(result.party),
      participant: result.participant
        ? serializeParticipant(result.participant)
        : null,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
