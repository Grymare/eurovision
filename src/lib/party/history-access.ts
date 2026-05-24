import { db } from "@/db";
import { participants } from "@/db/schema";
import { isSiteAdmin } from "@/lib/auth/admin";
import { AppError } from "@/lib/http/errors";
import {
  getParticipantBySessionToken,
  getPartyByCode,
  getPartyById,
} from "@/lib/party/service";
import { and, eq } from "drizzle-orm";

export async function assertCanViewFinishedPartyReplay(input: {
  partyRef: string;
  userId: string | undefined;
  email: string | null | undefined;
  participantSessionToken?: string | null;
  hostSessionToken?: string | null;
}) {
  const party =
    (await getPartyByCode(input.partyRef.trim())) ??
    (await getPartyById(input.partyRef.trim()));

  if (!party) {
    throw new AppError("Party not found", 404, "PARTY_NOT_FOUND");
  }

  if (party.state !== "finished") {
    throw new AppError("This party is not finished yet", 403, "PARTY_NOT_FINISHED");
  }

  if (isSiteAdmin(input.email)) {
    return party;
  }

  if (input.hostSessionToken && party.hostSessionToken === input.hostSessionToken) {
    return party;
  }

  if (input.participantSessionToken) {
    const participant = await getParticipantBySessionToken(input.participantSessionToken);

    if (participant?.partyId === party.id) {
      return party;
    }
  }

  if (input.userId) {
    const membership = await db.query.participants.findFirst({
      where: and(
        eq(participants.partyId, party.id),
        eq(participants.userId, input.userId),
      ),
    });

    if (membership) {
      return party;
    }

    throw new AppError("You did not participate in this party", 403, "PARTY_ACCESS_DENIED");
  }

  throw new AppError("Sign in to view party history", 403, "AUTH_REQUIRED");
}
