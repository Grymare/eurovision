"use client";

import { useMemo, type CSSProperties } from "react";

type ConfettiPiece = {
  id: number;
  burstX: number;
  burstY: number;
  spin: number;
  delayMs: number;
  durationMs: number;
  size: number;
  tone: "light" | "mid" | "deep";
  shape: "rect" | "dot";
};

function buildBurstPieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, id) => {
    const angle = Math.random() * Math.PI * 2;
    const tier = Math.random();

    const velocity =
      tier > 0.82 ? 420 + Math.random() * 340
      : tier > 0.45 ? 180 + Math.random() * 280
      : 90 + Math.random() * 160;

    const burstX = Math.cos(angle) * velocity;
    const burstY = Math.sin(angle) * velocity * 0.92 - 18;

    return {
      id,
      burstX,
      burstY,
      spin: Math.random() * 900 - 450,
      delayMs: Math.random() * 520,
      durationMs: 1300 + Math.random() * 1100,
      size: 3 + Math.random() * 7,
      tone: (["light", "mid", "deep"] as const)[Math.floor(Math.random() * 3)],
      shape: Math.random() > 0.32 ? "rect" : "dot",
    };
  });
}

export function WinnerConfetti() {
  const pieces = useMemo(() => buildBurstPieces(210), []);

  return (
    <div className="winner-confetti" aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className={[
            "winner-confetti__piece",
            `winner-confetti__piece--${piece.tone}`,
            piece.shape === "dot" ? "winner-confetti__piece--dot" : null,
          ]
            .filter(Boolean)
            .join(" ")}
          style={
            {
              width: `${piece.size}px`,
              height: `${piece.shape === "dot" ? piece.size : piece.size * 0.55}px`,
              animationDelay: `${piece.delayMs}ms`,
              animationDuration: `${piece.durationMs}ms`,
              ["--burst-x" as string]: `${piece.burstX}px`,
              ["--burst-y" as string]: `${piece.burstY}px`,
              ["--burst-spin" as string]: `${piece.spin}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
