import { getHostSessionToken } from "@/lib/auth/cookies";
import { assertDevMockDataEnabled } from "@/lib/dev/mock-data";
import { toErrorResponse } from "@/lib/http/errors";
import { parseJsonBody } from "@/lib/http/validation";
import { EUROVISION_2026_ENTRY_SET } from "@/lib/party/mock-data";
import {
  requireHostParty,
  seedMockEntries,
  serializeEntry,
} from "@/lib/party/service";
import { broadcastVotingStatus } from "@/lib/socket/party-broadcast";
import { NextResponse } from "next/server";
import { z } from "zod";

const seedSchema = z.object({
  setId: z.string().trim().min(1).default(EUROVISION_2026_ENTRY_SET.id),
  clearVotes: z.boolean().optional(),
});

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    assertDevMockDataEnabled();

    const { code } = await context.params;
    const hostToken = await getHostSessionToken();
    const party = await requireHostParty(hostToken, code);
    const body = parseJsonBody(seedSchema, await request.json().catch(() => ({})));
    const result = await seedMockEntries(party, body.setId, { clearVotes: body.clearVotes });

    await broadcastVotingStatus(party.id);

    return NextResponse.json({
      setId: result.setId,
      label: result.label,
      added: result.added,
      skipped: result.skipped,
      entries: result.entries.map(serializeEntry),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Mock data is only available in development") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return toErrorResponse(error);
  }
}
