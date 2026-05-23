import { getHostSessionToken } from "@/lib/auth/cookies";
import { toErrorResponse } from "@/lib/http/errors";
import type { PresentationAction } from "@/lib/party/presentation";
import {
  advancePresentation,
  getPresentationHostView,
  listEntries,
  openPresentation,
  requireHostParty,
  serializeEntry,
  serializeParty,
} from "@/lib/party/service";
import { broadcastVotingStatus } from "@/lib/socket/party-broadcast";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ code: string }>;
};

const PRESENTATION_ACTIONS = new Set<PresentationAction>([
  "open",
  "begin_low_reveal",
  "commit_low",
  "begin_twelve_reveal",
  "commit_twelve",
  "next_jury",
  "finish",
]);

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const hostToken = await getHostSessionToken();
    const party = await requireHostParty(hostToken, code);
    const entries = await listEntries(party.id);

    if (party.state === "voting_closed") {
      return NextResponse.json({
        party: serializeParty(party),
        entries: entries.map(serializeEntry),
        presentation: null,
        ready: true,
      });
    }

    const presentation = await getPresentationHostView(party);

    return NextResponse.json({
      party: serializeParty(party),
      entries: entries.map(serializeEntry),
      presentation,
      ready: true,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const hostToken = await getHostSessionToken();
    let party = await requireHostParty(hostToken, code);
    const body = (await request.json()) as { action?: string };

    if (!body.action || !PRESENTATION_ACTIONS.has(body.action as PresentationAction)) {
      return NextResponse.json({ error: "Invalid presentation action" }, { status: 400 });
    }

    const action = body.action as PresentationAction;

    let view;

    if (action === "open") {
      party = await openPresentation(party);
      view = await getPresentationHostView(party);
    } else {
      const result = await advancePresentation(party, action);
      party = result.party;
      view = result.view;
    }

    const entries = await listEntries(party.id);

    if (action === "finish" || action === "open") {
      await broadcastVotingStatus(party.id);
    }

    return NextResponse.json({
      party: serializeParty(party),
      entries: entries.map(serializeEntry),
      presentation: view,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
