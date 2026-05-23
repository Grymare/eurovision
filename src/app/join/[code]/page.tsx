import { JoinPartyForm } from "@/components/join-party-form";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <main id="main-content" className="page-main section-stack max-w-md">
      <header className="section-block section-block--head space-y-4">
        <p className="eyebrow">Join the jury</p>
        <h1 className="display-heading text-3xl">Enter the party</h1>
        <p className="text-sm leading-6 text-muted">
          Code{" "}
          <span className="font-mono tracking-[0.25em] text-foreground">
            {code.toUpperCase()}
          </span>
        </p>
      </header>
      <JoinPartyForm initialCode={code.toUpperCase()} />
    </main>
  );
}
