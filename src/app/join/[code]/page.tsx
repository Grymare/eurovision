import { JoinPartyForm } from "@/components/join-party-form";
import { LobbyRankPrep } from "@/components/lobby-rank-prep";
import { auth } from "@/lib/auth";
import { canJoinParty, MIN_PARTY_ENTRIES } from "@/lib/party/constants";
import {
  getPartyByCode,
  listEntries,
  serializeEntry,
} from "@/lib/party/service";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const partyCode = code.trim().toUpperCase();
  const session = await auth();
  const displayName = session?.user?.name?.trim() ?? "";

  const party = await getPartyByCode(partyCode);

  if (!party) {
    notFound();
  }

  const entries = await listEntries(party.id);
  const showRankPrep =
    canJoinParty(party.state) && entries.length >= MIN_PARTY_ENTRIES;

  return (
    <main
      id="main-content"
      className={
        showRankPrep ?
          "page-main section-stack max-w-3xl"
        : "page-main section-stack max-w-md"
      }
    >
      <header className="section-block section-block--head space-y-4">
        <p className="eyebrow">Join the jury</p>
        <h1 className="display-heading text-3xl">Enter the party</h1>
        <p className="text-sm leading-6 text-muted">
          Code{" "}
          <span className="font-mono tracking-[0.25em] text-foreground">
            {partyCode}
          </span>
        </p>
      </header>

      {showRankPrep ?
        <section className="section-block">
          <LobbyRankPrep
            partyCode={partyCode}
            entries={entries.map(serializeEntry)}
          />
        </section>
      : null}

      <JoinPartyForm
        initialCode={partyCode}
        loggedInDisplayName={displayName || undefined}
        isLoggedIn={Boolean(session?.user)}
      />
    </main>
  );
}
