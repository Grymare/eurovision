"use client";

import { signOut } from "next-auth/react";

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className = "btn-ghost" }: SignOutButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        void signOut({ callbackUrl: "/" });
      }}
    >
      Sign out
    </button>
  );
}
