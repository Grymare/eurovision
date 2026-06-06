"use client";

import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not send reset email");
      }

      setMessage(data.message ?? "Check your email for reset instructions.");
      setEmail("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not send reset email");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="forgot-email" className="field-label">
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field-input"
          />
        </div>

        {error ?
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        : null}
        {message ?
          <p role="status" className="text-sm text-gold-light">
            {message}
          </p>
        : null}

        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="text-sm text-muted">
        Remember your password?{" "}
        <Link href="/auth/login" className="text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
