export const dynamic = "force-dynamic";

import { SocketStatus } from "@/components/socket-status";
import { db } from "@/db";
import { getDatabasePath } from "@/db/index";
import { appMeta } from "@/db/schema";
import { eq } from "drizzle-orm";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6"
      >
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300">
            Grymare Eurovision
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Party voting scaffold
          </h1>
          <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
            LAN-first Eurovision-style voting parties for you and your friends.
            This health page confirms the app, SQLite database, and Socket.io
            server are running.
          </p>
        </header>

        <HealthPanel />
        <SocketStatus />
      </main>
    </div>
  );
}

function HealthPanel() {
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
    <section
      aria-labelledby="health-heading"
      className="w-full rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2
        id="health-heading"
        className="text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300"
      >
        API health
      </h2>
      <dl className="mt-3 grid gap-2 text-sm">
        <div className="flex gap-2">
          <dt className="font-medium">Status</dt>
          <dd>ok</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium">Service</dt>
          <dd>grymare-eurovision</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium">Database</dt>
          <dd className="break-all">{databasePath}</dd>
        </div>
      </dl>
    </section>
  );
}

