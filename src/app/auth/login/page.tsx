import { LoginForm } from "@/components/auth/login-form";
import { isEmailConfigured } from "@/lib/auth/email";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );
  const emailEnabled = isEmailConfigured();

  return (
    <main id="main-content" className="page-main section-stack max-w-md">
      <header className="section-block space-y-3">
        <p className="eyebrow">Account</p>
        <h1 className="section-heading">Sign in</h1>
        <p className="text-sm text-muted">
          Hosts sign in with an admin account. Everyone else can join parties as a guest or with
          their own account.
        </p>
      </header>

      <section className="section-block">
        <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
          <LoginForm
            googleEnabled={googleEnabled}
            magicLinkEnabled={emailEnabled}
            passwordResetEnabled={emailEnabled}
          />
        </Suspense>
      </section>
    </main>
  );
}
