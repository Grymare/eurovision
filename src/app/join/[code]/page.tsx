import { JoinPartyForm } from "@/components/join-party-form";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <div className="flex min-h-full flex-col bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6"
      >
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Join party</h1>
          <p className="text-base text-zinc-600 dark:text-zinc-300">
            You were invited to party code{" "}
            <strong className="tracking-widest">{code.toUpperCase()}</strong>.
          </p>
        </header>
        <JoinPartyForm initialCode={code.toUpperCase()} />
      </main>
    </div>
  );
}
