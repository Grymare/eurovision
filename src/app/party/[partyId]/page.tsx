import { PartyLobby } from "@/components/party-lobby";
import {
  getHostSessionToken,
  getParticipantSessionToken,
} from "@/lib/auth/cookies";
import {
  getParticipantBySessionToken,
  getParticipantVote,
  getPartyById,
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
  params: Promise<{ partyId: string }>;
}) {
  const { partyId } = await params;
  const party = await getPartyById(partyId);

  if (!party) {
    notFound();
  }

  const [entries, participants, hostToken, participantToken] = await Promise.all([
    listEntries(partyId),
    listParticipants(partyId),
    getHostSessionToken(),
    getParticipantSessionToken(),
  ]);

  const participant = participantToken
    ? await getParticipantBySessionToken(participantToken)
    : null;
  const isHost = Boolean(hostToken) && party.hostSessionToken === hostToken;
  const viewerParticipant =
    participant && participant.partyId === partyId ? participant : null;
  const voteRecord =
    viewerParticipant ?
      await getParticipantVote(viewerParticipant.id, partyId)
    : null;

  return (
    <main id="main-content" className="page-main section-stack max-w-3xl">
      <header className="section-block space-y-4">
        <p className="eyebrow">Party lobby</p>
        <h1 className="display-heading text-3xl sm:text-4xl">
          {party.title ?? "Eurovision party"}
        </h1>
        <hr className="hero-divider" aria-hidden="true" />
      </header>

      <PartyLobby
        partyId={partyId}
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
