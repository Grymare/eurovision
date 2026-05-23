import { PresentationPageClient } from "@/components/presentation-page-client";
import { getHostSessionToken } from "@/lib/auth/cookies";
import {
  getPartyByRef,
  getPresentationHostView,
  listEntries,
  serializeEntry,
  serializeParty,
} from "@/lib/party/service";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PresentationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const party = await getPartyByRef(code);

  if (!party) {
    notFound();
  }

  const hostToken = await getHostSessionToken();
  const isHost = Boolean(hostToken) && party.hostSessionToken === hostToken;

  if (!isHost) {
    redirect(`/party/${party.code}`);
  }

  if (
    party.state !== "voting_closed" &&
    party.state !== "presenting" &&
    party.state !== "finished"
  ) {
    redirect(`/party/${party.code}`);
  }

  const entries = await listEntries(party.id);
  const presentation =
    party.state === "presenting" || party.state === "finished" ?
      await getPresentationHostView(party)
    : null;

  return (
    <main id="main-content" className="presentation-page-shell">
      <PresentationPageClient
        partyCode={party.code}
        initialEntries={entries.map(serializeEntry)}
        initialPresentation={presentation}
        initialPartyState={party.state}
      />
    </main>
  );
}
