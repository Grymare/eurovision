import { PartyLobby } from "@/components/party-lobby";
import {
  getHostSessionToken,
  getParticipantSessionToken,
} from "@/lib/auth/cookies";
import {
  getParticipantBySessionToken,
  getPartyById,
  listEntries,
  listParticipants,
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

  return (
    <div className="page-shell">
      <main id="main-content" className="page-main max-w-3xl">
        <header className="space-y-3">
          <p className="eyebrow">Party lobby</p>
          <h1 className="display-serif text-3xl sm:text-4xl">
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
                participant && participant.partyId === partyId
                  ? serializeParticipant(participant)
                  : null,
            },
          }}
        />
      </main>
    </div>
  );
}
