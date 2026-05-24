import { RegisterForm } from "@/components/auth/register-form";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );

  return (
    <main id="main-content" className="page-main section-stack max-w-md">
      <header className="section-block space-y-3">
        <p className="eyebrow">Account</p>
        <h1 className="section-heading">Register</h1>
        <p className="text-sm text-muted">
          Create an account to reuse your display name when joining parties. Only the site admin
          can create new parties.
        </p>
      </header>

      <section className="section-block">
        <RegisterForm googleEnabled={googleEnabled} />
      </section>
    </main>
  );
}
