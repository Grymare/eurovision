"use client";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type RegisterFormProps = {
  googleEnabled: boolean;
};

export function RegisterForm({ googleEnabled }: RegisterFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not register");
      }

      router.push("/auth/login?registered=1");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not register");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="register-name" className="field-label">
            Display name
          </label>
          <input
            id="register-name"
            type="text"
            required
            minLength={2}
            maxLength={24}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="field-input"
          />
          <p className="text-sm text-muted">Used when you join parties while signed in.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="register-email" className="field-label">
            Email
          </label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field-input"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="register-password" className="field-label">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field-input"
          />
        </div>

        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      {googleEnabled ?
        <>
          <p className="text-center text-xs uppercase tracking-[0.2em] text-muted">Or register with Google</p>
          <GoogleSignInButton intent="register" disabled={isSubmitting} label="Continue with Google" />
        </>
      : null}

      <p className="text-sm text-muted">
        Already registered?{" "}
        <Link href="/auth/login" className="text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
