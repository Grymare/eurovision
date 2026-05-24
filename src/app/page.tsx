import { CreatePartyForm } from "@/components/create-party-form";
import { DevQuickStartForm } from "@/components/dev-quick-start-form";
import { JoinPartyForm } from "@/components/join-party-form";
import { auth } from "@/lib/auth";
import { isSiteAdmin } from "@/lib/auth/admin";
import { isDevMockDataEnabled } from "@/lib/dev/mock-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const devMockDataEnabled = isDevMockDataEnabled();
  const session = await auth();
  const canHost = isSiteAdmin(session?.user?.email);
  const isLoggedIn = Boolean(session?.user);
  const displayName = session?.user?.name?.trim() ?? "";

  return (
    <main id="main-content" className="page-main section-stack max-w-5xl">
      <header className="section-block space-y-5">
        <p className="eyebrow">Private voting parties</p>
        <h1 className="display-heading-gold max-w-3xl text-4xl leading-tight sm:text-5xl">
          Grymare Eurovision
        </h1>
        <p className="max-w-xl text-base leading-7 text-muted">
          Host a voting party for friends on your network. Classic 12-point scoring, live jury
          status, and a ceremony when you are ready to reveal the winner.
        </p>
      </header>

      <div
        className={
          canHost ?
            "section-block grid gap-10 lg:grid-cols-2 lg:gap-12"
          : "section-block grid max-w-md gap-10"
        }
      >
        {canHost ?
          <div className="space-y-8">
            <CreatePartyForm defaultHostNickname={displayName} />
            {devMockDataEnabled ? <DevQuickStartForm /> : null}
          </div>
        : null}
        <JoinPartyForm
          loggedInDisplayName={displayName || undefined}
          isLoggedIn={isLoggedIn}
        />
      </div>
    </main>
  );
}
