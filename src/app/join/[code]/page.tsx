import { JoinPartyForm } from "@/components/join-party-form";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <div className="page-shell">
      <main id="main-content" className="page-main max-w-md">
        <header className="space-y-4">
          <p className="eyebrow">Join the jury</p>
          <h1 className="display-serif text-3xl">Enter the party</h1>
          <p className="text-sm leading-6 text-muted">
            Code{" "}
            <span className="font-mono tracking-[0.25em] text-foreground">
              {code.toUpperCase()}
            </span>
          </p>
          <hr className="hero-divider" aria-hidden="true" />
        </header>
        <JoinPartyForm initialCode={code.toUpperCase()} />
      </main>
    </div>
  );
}
