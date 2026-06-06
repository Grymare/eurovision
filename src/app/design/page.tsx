import Link from "next/link";

export default function DesignPage() {
  return (
    <main id="main-content" className="page-main section-stack max-w-5xl">
      <header className="section-block space-y-4">
        <p className="eyebrow">Development only</p>
        <h1 className="display-heading-gold text-3xl sm:text-4xl">Design lab</h1>
        <p className="max-w-2xl text-muted">
          Compare UI directions in the running app before wiring them into the party flow.
          These routes are hidden in production builds.
        </p>
      </header>

      <section className="section-block space-y-4">
        <h2 className="section-heading">Pages</h2>
        <ul className="design-index">
          <li>
            <Link href="/design/scoreboard" className="design-index__link">
              <span className="design-index__title">Scoreboard row variations</span>
              <span className="design-index__meta">
                Nine Eurovision scoreboard row styles — pick one before presentation polish.
              </span>
            </Link>
          </li>
          <li>
            <Link href="/design/google-button" className="design-index__link">
              <span className="design-index__title">Google sign-in button</span>
              <span className="design-index__meta">
                Nine OAuth button styles for the dark gold login page — current white neutral plus
                themed alternatives.
              </span>
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
