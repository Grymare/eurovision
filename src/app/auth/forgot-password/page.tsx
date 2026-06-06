import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { isEmailConfigured } from "@/lib/auth/email";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  if (!isEmailConfigured()) {
    return (
      <main id="main-content" className="page-main section-stack max-w-md">
        <header className="section-block space-y-3">
          <p className="eyebrow">Account</p>
          <h1 className="section-heading">Forgot password</h1>
          <p className="text-sm text-muted">
            Password reset email is not configured on this server. Use Google sign-in, or ask the
            host to set `EMAIL_SERVER` and `EMAIL_FROM`.
          </p>
        </header>
        <p className="text-sm text-muted">
          <Link href="/auth/login" className="text-foreground underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main id="main-content" className="page-main section-stack max-w-md">
      <header className="section-block space-y-3">
        <p className="eyebrow">Account</p>
        <h1 className="section-heading">Forgot password</h1>
        <p className="text-sm text-muted">
          Enter your email and we will send a link to choose a new password. Google-only accounts
          do not use passwords.
        </p>
      </header>

      <section className="section-block">
        <ForgotPasswordForm />
      </section>
    </main>
  );
}
