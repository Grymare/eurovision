"use client";

import { GoogleIcon } from "@/components/auth/google-icon";
import { useState } from "react";
import "./google-button-variants.css";

export type GoogleButtonVariationId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I";

type Variation = {
  id: GoogleButtonVariationId;
  title: string;
  notes: string;
};

const variations: Variation[] = [
  {
    id: "A",
    title: "Light neutral (current)",
    notes: "Google’s recommended light button on dark backgrounds — white fill, dark label.",
  },
  {
    id: "B",
    title: "Gold outline",
    notes: "Transparent with a gold border — sits closer to field inputs and secondary actions.",
  },
  {
    id: "C",
    title: "Gold gradient frame",
    notes: "Same metallic border treatment as the primary Sign in button.",
  },
  {
    id: "D",
    title: "Dark fill",
    notes: "Charcoal button with light text — Google’s dark variant, tuned for stage black.",
  },
  {
    id: "E",
    title: "Ghost",
    notes: "Minimal weight — muted label, no box. Lowest visual competition with Sign in.",
  },
  {
    id: "F",
    title: "Gold wash",
    notes: "Soft gold tint fill — clearly secondary but still on-brand.",
  },
  {
    id: "G",
    title: "Dark + gold label",
    notes: "Deep background with gold type — reads as a themed OAuth action.",
  },
  {
    id: "H",
    title: "Bottom gold rule",
    notes: "Matches btn-secondary — underline accent only, no full border.",
  },
  {
    id: "I",
    title: "Frosted glass",
    notes: "Semi-transparent fill with a cool white border — lighter than A, still dark-native.",
  },
];

function GoogleButtonVariant({ id }: { id: GoogleButtonVariationId }) {
  return (
    <button type="button" className={`gbtn-var gbtn-var--${id}`}>
      <GoogleIcon className="h-5 w-5 shrink-0" />
      Continue with Google
    </button>
  );
}

function LoginContextPreview({ id }: { id: GoogleButtonVariationId }) {
  return (
    <div className="gbtn-var-preview">
      <div className="gbtn-var-preview__mock">
        <div className="gbtn-context-panel__field" aria-hidden="true" />
        <div className="gbtn-context-panel__field" aria-hidden="true" />
        <div className="gbtn-context-panel__submit">Sign in</div>
      </div>
      <p className="gbtn-var-preview__divider">Or continue with Google</p>
      <GoogleButtonVariant id={id} />
    </div>
  );
}

export function GoogleButtonVariationsShowcase() {
  const [choice, setChoice] = useState<GoogleButtonVariationId | null>("B");

  return (
    <main id="main-content" className="page-main section-stack max-w-6xl">
      <header className="section-block space-y-4">
        <p className="eyebrow">Auth · OAuth</p>
        <h1 className="display-heading-gold text-3xl sm:text-4xl">Google button · nine variants</h1>
        <p className="max-w-3xl text-muted">
          The live app uses <strong>A</strong> (white neutral). Pick a direction that fits the dark
          gold stage without overpowering Sign in. Each card shows the button in a mini login
          context.
        </p>
      </header>

      <section className="section-block gbtn-var-grid">
        {variations.map((variation) => {
          const selected = choice === variation.id;

          return (
            <article
              key={variation.id}
              className={selected ? "gbtn-var-card gbtn-var-card--selected" : "gbtn-var-card"}
            >
              <div className="gbtn-var-card__head">
                <div>
                  <h2 className="gbtn-var-card__title">
                    {variation.id}. {variation.title}
                  </h2>
                  <p className="gbtn-var-card__notes">{variation.notes}</p>
                </div>
                {selected ?
                  <span className="gbtn-var-card__picked">Selected</span>
                : null}
              </div>

              <LoginContextPreview id={variation.id} />

              <button
                type="button"
                className={selected ? "btn-primary" : "btn-secondary"}
                onClick={() => setChoice(variation.id)}
              >
                {selected ? "Selected" : "Select this style"}
              </button>
            </article>
          );
        })}
      </section>

      {choice ?
        <section className="section-block space-y-5">
          <div className="space-y-2">
            <h2 className="section-heading">Full login stack preview · {choice}</h2>
            <p className="text-sm text-muted">
              How the chosen button reads below email/password sign-in on the real login page.
            </p>
          </div>

          <div className="gbtn-context-panel">
            <div className="auth-segment">
              <button type="button" className="auth-segment__option auth-segment__option--active">
                Password
              </button>
              <button type="button" className="auth-segment__option">
                Magic link
              </button>
            </div>
            <div className="gbtn-context-panel__mock">
              <div className="gbtn-context-panel__field" aria-hidden="true" />
              <div className="gbtn-context-panel__field" aria-hidden="true" />
              <div className="gbtn-context-panel__submit">Sign in</div>
            </div>
            <p className="gbtn-var-preview__divider">Or continue with Google</p>
            <GoogleButtonVariant id={choice} />
          </div>
        </section>
      : null}
    </main>
  );
}
