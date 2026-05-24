import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { JuryVoteBreakdown } from "@/components/jury-vote-breakdown";
import { PartyReplayScoreboard } from "@/components/party-replay-scoreboard";
import {
  buildVoteOverviewData,
  VoteOverviewMatrix,
} from "@/components/vote-overview-matrix";
import { auth } from "@/lib/auth";
import { assertCanViewFinishedPartyReplay } from "@/lib/party/history-access";
import { getFinishedPartyReplay } from "@/lib/party/history";

export const dynamic = "force-dynamic";

type HistoryPartyPageProps = {
  params: Promise<{ code: string }>;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function HistoryPartyPage({ params }: HistoryPartyPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/history");
  }

  const { code } = await params;

  let party;

  try {
    party = await assertCanViewFinishedPartyReplay({
      partyRef: code,
      userId: session.user.id,
      email: session.user.email,
    });
  } catch {
    notFound();
  }

  const replay = await getFinishedPartyReplay(party.id);

  if (!replay) {
    notFound();
  }

  const overview = buildVoteOverviewData({
    rows: replay.snapshot.rows.map((row) => ({
      entryId: row.entryId,
      name: row.name,
      flagEmoji: row.flagEmoji,
      totalPoints: row.totalPoints,
    })),
    juryVotes: replay.juryVotes,
  });

  const pageTitle = replay.party.title?.trim() || "Party replay";

  return (
    <main id="main-content" className="page-main section-stack max-w-[75rem]">
      <header className="section-block space-y-3">
        <p className="eyebrow">
          <Link href="/history" className="nav-link">
            Party history
          </Link>
        </p>
        <h1 className="section-heading">{pageTitle}</h1>
        <p className="text-sm text-muted">
          Finished {formatDate(replay.snapshot.computedAt)} · {replay.participantCount} jurors ·{" "}
          {replay.snapshot.voteCount} ballots
        </p>
      </header>

      <section className="section-block space-y-4">
        <div className="space-y-2">
          <p className="eyebrow">Final results</p>
          <h2 className="section-heading">Scoreboard</h2>
        </div>
        <PartyReplayScoreboard rows={replay.snapshot.rows} />
      </section>

      <VoteOverviewMatrix countries={overview.countries} juries={overview.juries} />

      <section className="section-block">
        <JuryVoteBreakdown juryVotes={replay.juryVotes} entriesById={replay.entriesById} />
      </section>
    </main>
  );
}
