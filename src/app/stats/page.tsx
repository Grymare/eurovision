import Link from "next/link";
import { redirect } from "next/navigation";
import { CrossPartyStatsView } from "@/components/cross-party-stats-view";
import { auth } from "@/lib/auth";
import { isSiteAdmin } from "@/lib/auth/admin";
import { computeCrossPartyStats } from "@/lib/party/history";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/stats");
  }

  const isAdmin = isSiteAdmin(session.user.email);
  const stats = await computeCrossPartyStats(session.user.id);

  return (
    <main id="main-content" className="page-main section-stack max-w-4xl">
      <header className="section-block space-y-3">
        <p className="eyebrow">Fun aggregates</p>
        <h1 className="section-heading">Cross-party stats</h1>
            <p className="text-sm text-muted">
              Country wins, points, and douze counts across finished parties.
              {isAdmin ?
                " As admin you can open each juror to see where their points went."
              : ""}
            </p>
        <p className="text-sm text-muted">
          <Link href="/history" className="nav-link">
            Back to party history
          </Link>
        </p>
      </header>

      <CrossPartyStatsView stats={stats} showVoterLeaderboard={isAdmin} />
    </main>
  );
}
