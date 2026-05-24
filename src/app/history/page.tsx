import Link from "next/link";
import { redirect } from "next/navigation";
import { PartyHistoryList } from "@/components/party-history-list";
import { auth } from "@/lib/auth";
import { isSiteAdmin } from "@/lib/auth/admin";
import {
  listFinishedPartiesForAdmin,
  listFinishedPartiesForUser,
} from "@/lib/party/history";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/history");
  }

  const isAdmin = isSiteAdmin(session.user.email);
  const parties =
    isAdmin ?
      await listFinishedPartiesForAdmin()
    : await listFinishedPartiesForUser(session.user.id!);

  return (
    <main id="main-content" className="page-main section-stack max-w-4xl">
      <header className="section-block space-y-3">
        <p className="eyebrow">Past parties</p>
        <h1 className="section-heading">Party history</h1>
        <p className="text-sm text-muted">
          {isAdmin ?
            "All finished parties on this server."
          : "Parties you joined with your account after signing in."}
        </p>
        <p className="text-sm text-muted">
          <Link href="/stats" className="nav-link">
            View cross-party stats
          </Link>
        </p>
      </header>

      <section className="section-block">
        <PartyHistoryList
          parties={parties}
          emptyMessage={
            isAdmin ?
              "No finished parties yet."
            : "You have not finished any parties while signed in. Join a party with your account to build history."
          }
        />
      </section>
    </main>
  );
}
