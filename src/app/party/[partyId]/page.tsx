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
    <div className="flex min-h-full flex-col bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6"
      >
        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300">
            Party lobby
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {party.title ?? "Eurovision party"}
          </h1>
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
