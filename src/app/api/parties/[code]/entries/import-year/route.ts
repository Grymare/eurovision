import { getHostSessionToken } from "@/lib/auth/cookies";
import { toErrorResponse } from "@/lib/http/errors";
import { parseJsonBody } from "@/lib/http/validation";
import {
  importYearEntries,
  requireHostParty,
  serializeEntry,
} from "@/lib/party/service";
import { broadcastVotingStatus } from "@/lib/socket/party-broadcast";
import { NextResponse } from "next/server";
import { z } from "zod";

const importYearSchema = z.object({
  year: z.number().int().min(1956).max(2100),
  clearVotes: z.boolean().optional(),
});

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const hostToken = await getHostSessionToken();
    const party = await requireHostParty(hostToken, code);
    const body = parseJsonBody(importYearSchema, await request.json());
    const result = await importYearEntries(party, body.year, {
      clearVotes: body.clearVotes,
    });

    await broadcastVotingStatus(party.id);

    return NextResponse.json({
      year: result.year,
      label: result.label,
      added: result.added,
      skipped: result.skipped,
      entries: result.entries.map(serializeEntry),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
