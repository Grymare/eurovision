import { CreatePartyForm } from "@/components/create-party-form";
import { JoinPartyForm } from "@/components/join-party-form";
import { SocketStatus } from "@/components/socket-status";
import { db } from "@/db";
import { getDatabasePath } from "@/db/index";
import { appMeta } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default function Home() {
  const existing = db
    .select()
    .from(appMeta)
    .where(eq(appMeta.key, "health"))
    .get();

  if (!existing) {
    db.insert(appMeta)
      .values({ key: "health", value: "ok" })
      .run();
  }

  const databasePath = getDatabasePath();

  return (
    <div className="page-shell">
      <main id="main-content" className="page-main max-w-5xl gap-8">
        <header className="space-y-3">
          <p className="eyebrow">Grymare Eurovision</p>
          <h1 className="display-title text-5xl leading-none sm:text-6xl">
            Party voting night
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted">
            Host a party, invite friends on your LAN, and run your own
            Eurovision-style 12-point voting night.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <CreatePartyForm />
          <JoinPartyForm />
        </div>

        <section aria-labelledby="health-heading" className="panel">
          <h2 id="health-heading" className="text-sm font-semibold uppercase tracking-wide text-muted">
            System status
          </h2>
          <p className="mt-2 text-sm text-muted">
            Database: <span className="break-all text-foreground">{databasePath}</span>
          </p>
        </section>

        <SocketStatus />
      </main>
    </div>
  );
}
