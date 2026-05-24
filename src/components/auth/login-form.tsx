"use client";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type LoginFormProps = {
  googleEnabled: boolean;
  magicLinkEnabled: boolean;
};

export function LoginForm({ googleEnabled, magicLinkEnabled }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const authError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicEmail, setMagicEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handlePasswordLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  async function handleMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    const result = await signIn("nodemailer", {
      email: magicEmail,
      redirect: false,
      callbackUrl,
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError("Could not send magic link. Check email settings or use password login.");
      return;
    }

    setMessage("Check your email for a sign-in link.");
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handlePasswordLogin} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="login-email" className="field-label">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field-input"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="login-password" className="field-label">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field-input"
          />
        </div>

        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : authError === "no_account" ?
          <p role="alert" className="text-sm text-danger">
            No account found for that Google email. Register first.
          </p>
        : authError === "OAuthAccountNotLinked" ?
          <p role="alert" className="text-sm text-danger">
            That Google email could not be linked to an existing account. Try email and password
            instead.
          </p>
        : null}

        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {googleEnabled ?
        <>
          <p className="text-center text-xs uppercase tracking-[0.2em] text-muted">Or continue with Google</p>
          <GoogleSignInButton intent="login" callbackUrl={callbackUrl} disabled={isSubmitting} />
        </>
      : null}

      {magicLinkEnabled ?
        <form onSubmit={handleMagicLink} className="space-y-5 border-t border-stage-border pt-8">
          <div className="space-y-2">
            <h3 className="text-sm font-medium uppercase tracking-[0.16em] text-foreground">
              Magic link
            </h3>
            <p className="text-sm text-muted">
              We will email you a one-time sign-in link — no password needed.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="magic-email" className="field-label">
              Email
            </label>
            <input
              id="magic-email"
              type="email"
              autoComplete="email"
              required
              value={magicEmail}
              onChange={(event) => setMagicEmail(event.target.value)}
              className="field-input"
            />
          </div>

          {message ? <p className="text-sm text-foreground">{message}</p> : null}

          <button type="submit" disabled={isSubmitting} className="btn-secondary">
            Email me a link
          </button>
        </form>
      : null}

      <p className="text-sm text-muted">
        No account?{" "}
        <Link href="/auth/register" className="text-foreground underline-offset-4 hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
