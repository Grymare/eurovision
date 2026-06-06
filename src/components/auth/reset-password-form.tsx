"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not reset password");
      }

      router.push("/auth/login?reset=1");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not reset password");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="reset-password" className="field-label">
          New password
        </label>
        <input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="field-input"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="reset-confirm-password" className="field-label">
          Confirm password
        </label>
        <input
          id="reset-confirm-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="field-input"
        />
      </div>

      {error ?
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      : null}

      <button type="submit" disabled={isSubmitting} className="btn-primary">
        {isSubmitting ? "Saving…" : "Set new password"}
      </button>

      <p className="text-sm text-muted">
        <Link href="/auth/login" className="text-foreground underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
