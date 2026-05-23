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
    <div className="flex min-h-full flex-col bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6"
      >
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300">
            Grymare Eurovision
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Eurovision party voting
          </h1>
          <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
            Host a party, invite friends on your LAN, and run your own
            Eurovision-style 12-point voting night.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <CreatePartyForm />
          <JoinPartyForm />
        </div>

        <section
          aria-labelledby="health-heading"
          className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2
            id="health-heading"
            className="text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300"
          >
            System status
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Database: <span className="break-all">{databasePath}</span>
          </p>
        </section>

        <SocketStatus />
      </main>
    </div>
  );
}
