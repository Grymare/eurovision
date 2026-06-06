import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { findPasswordResetEmail } from "@/lib/auth/password-reset";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  if (!token) {
    notFound();
  }

  const email = findPasswordResetEmail(token);

  if (!email) {
    return (
      <main id="main-content" className="page-main section-stack max-w-md">
        <header className="section-block space-y-3">
          <p className="eyebrow">Account</p>
          <h1 className="section-heading">Link expired</h1>
          <p className="text-sm text-muted">
            This password reset link is invalid or has expired. Request a new one from the sign-in
            page.
          </p>
        </header>
        <p className="text-sm text-muted">
          <Link
            href="/auth/forgot-password"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Request a new reset link
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main id="main-content" className="page-main section-stack max-w-md">
      <header className="section-block space-y-3">
        <p className="eyebrow">Account</p>
        <h1 className="section-heading">Choose a new password</h1>
        <p className="text-sm text-muted">Resetting password for {email}</p>
      </header>

      <section className="section-block">
        <ResetPasswordForm token={token} />
      </section>
    </main>
  );
}
