import { auth } from "@/lib/auth";
import { isSiteAdmin } from "@/lib/auth/admin";
import {
  setHostSessionCookie,
  setParticipantSessionCookie,
} from "@/lib/auth/cookies";
import { AppError, toErrorResponse } from "@/lib/http/errors";
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
    const session = await auth();

    if (!isSiteAdmin(session?.user?.email)) {
      throw new AppError("Only the site admin can create parties", 403, "ADMIN_REQUIRED");
    }

    const body = parseJsonBody(createPartySchema, await request.json());
    const hostNickname = body.hostNickname || session?.user?.name?.trim() || "";

    const result = await createParty({
      hostNickname,
      title: body.title,
      userId: session?.user?.id,
    });

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
