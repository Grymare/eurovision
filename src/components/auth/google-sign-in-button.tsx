"use client";

import { GoogleIcon } from "@/components/auth/google-icon";
import { AUTH_INTENT_COOKIE } from "@/lib/auth/constants";
import { signIn } from "next-auth/react";

type GoogleSignInButtonProps = {
  intent: "login" | "register";
  callbackUrl?: string;
  disabled?: boolean;
  label?: string;
};

export function GoogleSignInButton({
  intent,
  callbackUrl = "/",
  disabled = false,
  label = "Continue with Google",
}: GoogleSignInButtonProps) {
  return (
    <button
      type="button"
      className="btn-google"
      disabled={disabled}
      onClick={() => {
        document.cookie = `${AUTH_INTENT_COOKIE}=${intent}; path=/; max-age=300; SameSite=Lax`;
        void signIn("google", { callbackUrl });
      }}
    >
      <GoogleIcon className="h-5 w-5 shrink-0" />
      {label}
    </button>
  );
}
