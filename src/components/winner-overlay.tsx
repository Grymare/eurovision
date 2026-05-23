"use client";

import { CountryFlag } from "@/components/country-flag";
import { WinnerConfetti } from "@/components/winner-confetti";
import { X } from "lucide-react";

type WinnerOverlayProps = {
  name: string;
  flagEmoji: string;
  totalPoints: number;
  visible: boolean;
  onDismiss: () => void;
};

export function WinnerOverlay({
  name,
  flagEmoji,
  totalPoints,
  visible,
  onDismiss,
}: WinnerOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="winner-overlay winner-overlay--enter" role="dialog" aria-modal="true">
      <WinnerConfetti />
      <div className="winner-overlay__content">
        <button
          type="button"
          className="winner-overlay__close"
          onClick={onDismiss}
          aria-label="Close winner announcement"
        >
          <X aria-hidden="true" size={20} strokeWidth={2.25} />
        </button>
        <p className="eyebrow">Winner</p>
        <p className="winner-overlay__title">
          <CountryFlag name={name} flagEmoji={flagEmoji} />
          <span>{name}</span>
        </p>
        <p className="winner-overlay__points">{totalPoints} points</p>
      </div>
    </div>
  );
}
