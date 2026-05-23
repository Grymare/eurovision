import { CreatePartyForm } from "@/components/create-party-form";
import { DevQuickStartForm } from "@/components/dev-quick-start-form";
import { JoinPartyForm } from "@/components/join-party-form";
import { isDevMockDataEnabled } from "@/lib/dev/mock-data";

export const dynamic = "force-dynamic";

export default function Home() {
  const devMockDataEnabled = isDevMockDataEnabled();

  return (
    <main id="main-content" className="page-main section-stack max-w-5xl">
      <header className="section-block space-y-5">
        <p className="eyebrow">Private voting parties</p>
        <h1 className="display-heading-gold max-w-3xl text-4xl leading-tight sm:text-5xl">
          Grymare Eurovision
        </h1>
        <p className="max-w-xl text-base leading-7 text-muted">
          Host a voting party for friends on your network. Classic 12-point
          scoring, live jury status, and a ceremony when you are ready to reveal
          the winner.
        </p>
      </header>

      <div className="section-block grid gap-10 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-8">
          <CreatePartyForm />
          {devMockDataEnabled ? <DevQuickStartForm /> : null}
        </div>
        <JoinPartyForm />
      </div>
    </main>
  );
}
