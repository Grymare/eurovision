"use client";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type LoginFormProps = {
  googleEnabled: boolean;
  magicLinkEnabled: boolean;
  passwordResetEnabled: boolean;
};

type LoginMethod = "password" | "magic-link";

export function LoginForm({
  googleEnabled,
  magicLinkEnabled,
  passwordResetEnabled,
}: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const authError = searchParams.get("error");
  const passwordResetSuccess = searchParams.get("reset") === "1";
  const [method, setMethod] = useState<LoginMethod>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function switchMethod(nextMethod: LoginMethod) {
    setMethod(nextMethod);
    setError(null);
    if (nextMethod === "password") {
      setMessage(null);
    }
  }

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
      email,
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

  const usingPassword = !magicLinkEnabled || method === "password";

  return (
    <div className="space-y-8">
      {magicLinkEnabled ?
        <div role="tablist" aria-label="Sign-in method" className="auth-segment">
          <button
            type="button"
            role="tab"
            id="login-tab-password"
            aria-selected={usingPassword}
            aria-controls="login-panel"
            className={
              usingPassword ?
                "auth-segment__option auth-segment__option--active"
              : "auth-segment__option"
            }
            onClick={() => switchMethod("password")}
          >
            Password
          </button>
          <button
            type="button"
            role="tab"
            id="login-tab-magic-link"
            aria-selected={!usingPassword}
            aria-controls="login-panel"
            className={
              !usingPassword ?
                "auth-segment__option auth-segment__option--active"
              : "auth-segment__option"
            }
            onClick={() => switchMethod("magic-link")}
          >
            Magic link
          </button>
        </div>
      : null}

      <form
        id="login-panel"
        role="tabpanel"
        aria-labelledby={usingPassword ? "login-tab-password" : "login-tab-magic-link"}
        onSubmit={usingPassword ? handlePasswordLogin : handleMagicLink}
        className="space-y-5"
      >
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
          {!usingPassword ?
            <p className="text-sm text-muted">
              We will email you a one-time sign-in link — no password needed.
            </p>
          : null}
        </div>

        {usingPassword ?
          <div className="space-y-2">
            <div className="flex items-end justify-between gap-3">
              <label htmlFor="login-password" className="field-label">
                Password
              </label>
              {passwordResetEnabled ?
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-muted underline-offset-4 hover:text-foreground hover:underline"
                >
                  Forgot password?
                </Link>
              : null}
            </div>
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
        : null}

        {passwordResetSuccess && usingPassword ?
          <p role="status" className="text-sm text-gold-light">
            Password updated. Sign in with your new password.
          </p>
        : null}

        {message ?
          <p role="status" className="text-sm text-gold-light">
            {message}
          </p>
        : null}

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
          {usingPassword ?
            isSubmitting ?
              "Signing in…"
            : "Sign in"
          : isSubmitting ?
            "Sending link…"
          : "Email me a link"}
        </button>
      </form>

      {googleEnabled ?
        <>
          <p className="text-center text-xs uppercase tracking-[0.2em] text-muted">Or continue with Google</p>
          <GoogleSignInButton intent="login" callbackUrl={callbackUrl} disabled={isSubmitting} />
        </>
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
