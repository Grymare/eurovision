import { JoinPartyForm } from "@/components/join-party-form";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <div className="page-shell">
      <main id="main-content" className="page-main max-w-xl">
        <header className="space-y-2">
          <p className="eyebrow">Join the jury</p>
          <h1 className="text-3xl font-semibold tracking-tight">Join party</h1>
          <p className="text-base text-muted">
            You were invited to party code{" "}
            <strong className="font-mono tracking-[0.2em] text-gold-bright">
              {code.toUpperCase()}
            </strong>
            .
          </p>
        </header>
        <JoinPartyForm initialCode={code.toUpperCase()} />
      </main>
    </div>
  );
}
