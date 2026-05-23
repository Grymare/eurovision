import { PartyLobby } from "@/components/party-lobby";
import {
  getHostSessionToken,
  getParticipantSessionToken,
} from "@/lib/auth/cookies";
import { isDevMockDataEnabled } from "@/lib/dev/mock-data";
import {
  getParticipantBySessionToken,
  getParticipantVote,
  getPartyByRef,
  listEntries,
  listParticipants,
  parseVoteAllocations,
  serializeEntry,
  serializeParticipant,
  serializeParty,
} from "@/lib/party/service";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PartyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const party = await getPartyByRef(code);

  if (!party) {
    notFound();
  }

  const [entries, participants, hostToken, participantToken] = await Promise.all([
    listEntries(party.id),
    listParticipants(party.id),
    getHostSessionToken(),
    getParticipantSessionToken(),
  ]);

  const participant = participantToken
    ? await getParticipantBySessionToken(participantToken)
    : null;
  const isHost = Boolean(hostToken) && party.hostSessionToken === hostToken;
  const viewerParticipant =
    participant && participant.partyId === party.id ? participant : null;
  const voteRecord =
    viewerParticipant ?
      await getParticipantVote(viewerParticipant.id, party.id)
    : null;

  return (
    <main id="main-content" className="page-main section-stack max-w-3xl">
      <header className="section-block section-block--head space-y-4">
        <p className="eyebrow">Party lobby</p>
        <h1 className="display-heading text-3xl sm:text-4xl">
          {party.title ?? "Eurovision party"}
        </h1>
      </header>

      <PartyLobby
        devMockDataEnabled={isDevMockDataEnabled()}
        initialData={{
          party: serializeParty(party),
          entries: entries.map(serializeEntry),
          participants: participants.map(serializeParticipant),
          viewer: {
            isHost,
            participant:
              viewerParticipant ? serializeParticipant(viewerParticipant) : null,
            vote:
              viewerParticipant ?
                {
                  hasVoted: viewerParticipant.hasVoted,
                  allocations: voteRecord ? parseVoteAllocations(voteRecord) : null,
                }
              : null,
          },
        }}
      />
    </main>
  );
}
