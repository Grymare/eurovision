import { getHostSessionToken, getParticipantSessionToken } from "@/lib/auth/cookies";
import { toErrorResponse } from "@/lib/http/errors";
import {
  listEntries,
  listPartyVotes,
  requirePartyViewer,
  serializeEntry,
} from "@/lib/party/service";
import { aggregatePartyScores } from "@/lib/party/score-aggregation";
import { assertVoteDetailsRevealable } from "@/lib/party/vote-secrecy";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ partyId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { partyId } = await context.params;
    const hostToken = await getHostSessionToken();
    const participantToken = await getParticipantSessionToken();
    const { party } = await requirePartyViewer(hostToken, participantToken, partyId);

    assertVoteDetailsRevealable(party.state);

    const [entries, voteRecords] = await Promise.all([
      listEntries(partyId),
      listPartyVotes(partyId),
    ]);

    const entryIds = new Set(entries.map((entry) => entry.id));
    const totals = aggregatePartyScores(voteRecords, entryIds);
    const totalsByEntryId = new Map(totals.map((row) => [row.entryId, row.totalPoints]));

    return NextResponse.json({
      scores: entries.map((entry) => ({
        entry: serializeEntry(entry),
        totalPoints: totalsByEntryId.get(entry.id) ?? 0,
      })),
      totals,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
