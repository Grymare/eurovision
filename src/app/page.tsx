import { CreatePartyForm } from "@/components/create-party-form";
import { JoinPartyForm } from "@/components/join-party-form";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="page-shell">
      <main id="main-content" className="page-main max-w-4xl">
        <header className="space-y-5">
          <p className="eyebrow">Grymare Eurovision</p>
          <h1 className="display-serif max-w-2xl text-4xl leading-tight sm:text-5xl">
            An elegant evening of{" "}
            <span className="display-serif-gold">douze points</span>
          </h1>
          <hr className="hero-divider" aria-hidden="true" />
          <p className="max-w-xl text-base leading-7 text-muted">
            Host a private voting party for friends on your network. Classic
            12-point scoring, live results, and a ceremony when you are ready
            to reveal.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <CreatePartyForm />
          <JoinPartyForm />
        </div>
      </main>
    </div>
  );
}
