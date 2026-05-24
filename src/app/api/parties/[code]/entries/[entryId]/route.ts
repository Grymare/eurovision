import { getHostSessionToken } from "@/lib/auth/cookies";
import { toErrorResponse } from "@/lib/http/errors";
import { parseJsonBody } from "@/lib/http/validation";
import {
  deleteEntry,
  requireHostParty,
  serializeEntry,
  updateEntry,
} from "@/lib/party/service";
import { broadcastVotingStatus } from "@/lib/socket/party-broadcast";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateEntrySchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  flagEmoji: z.string().trim().min(1).max(8).optional(),
  clearVotes: z.boolean().optional(),
});

type RouteContext = {
  params: Promise<{ code: string; entryId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { code, entryId } = await context.params;
    const hostToken = await getHostSessionToken();
    const party = await requireHostParty(hostToken, code);
    const body = parseJsonBody(updateEntrySchema, await request.json());
    const entry = await updateEntry(
      party,
      entryId,
      { name: body.name, flagEmoji: body.flagEmoji },
      { clearVotes: body.clearVotes },
    );

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    await broadcastVotingStatus(party.id);

    return NextResponse.json({ entry: serializeEntry(entry) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { code, entryId } = await context.params;
    const hostToken = await getHostSessionToken();
    const party = await requireHostParty(hostToken, code);
    const clearVotes = new URL(request.url).searchParams.get("clearVotes") === "true";
    await deleteEntry(party, entryId, { clearVotes });
    await broadcastVotingStatus(party.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
