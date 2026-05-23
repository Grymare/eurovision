import { getHostSessionToken } from "@/lib/auth/cookies";
import { toErrorResponse } from "@/lib/http/errors";
import { parseJsonBody } from "@/lib/http/validation";
import {
  deleteEntry,
  requireHostParty,
  serializeEntry,
  updateEntry,
} from "@/lib/party/service";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateEntrySchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  flagEmoji: z.string().trim().min(1).max(8).optional(),
});

type RouteContext = {
  params: Promise<{ partyId: string; entryId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { partyId, entryId } = await context.params;
    const hostToken = await getHostSessionToken();
    const party = await requireHostParty(hostToken, partyId);
    const body = parseJsonBody(updateEntrySchema, await request.json());
    const entry = await updateEntry(party, entryId, body);

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({ entry: serializeEntry(entry) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { partyId, entryId } = await context.params;
    const hostToken = await getHostSessionToken();
    const party = await requireHostParty(hostToken, partyId);
    await deleteEntry(party, entryId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
