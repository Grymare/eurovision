import { getHostSessionToken } from "@/lib/auth/cookies";
import { toErrorResponse } from "@/lib/http/errors";
import { parseJsonBody } from "@/lib/http/validation";
import {
  addEntry,
  clearAllEntries,
  listEntries,
  requireHostParty,
  resolvePartyRef,
  serializeEntry,
} from "@/lib/party/service";
import { broadcastVotingStatus } from "@/lib/socket/party-broadcast";
import { NextResponse } from "next/server";
import { z } from "zod";

const entrySchema = z.object({
  name: z.string().trim().min(1).max(80),
  flagEmoji: z.string().trim().min(1).max(8).optional(),
  clearVotes: z.boolean().optional(),
});

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const party = await resolvePartyRef(code);
    const entries = await listEntries(party.id);

    return NextResponse.json({
      entries: entries.map(serializeEntry),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const hostToken = await getHostSessionToken();
    const party = await requireHostParty(hostToken, code);
    const body = parseJsonBody(entrySchema, await request.json());
    const entry = await addEntry(
      party,
      { name: body.name, flagEmoji: body.flagEmoji },
      { clearVotes: body.clearVotes },
    );

    await broadcastVotingStatus(party.id);

    return NextResponse.json({ entry: serializeEntry(entry) }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const hostToken = await getHostSessionToken();
    const party = await requireHostParty(hostToken, code);
    const clearVotes = new URL(request.url).searchParams.get("clearVotes") === "true";

    await clearAllEntries(party, { clearVotes });
    await broadcastVotingStatus(party.id);

    return NextResponse.json({ cleared: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
