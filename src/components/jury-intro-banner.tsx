"use client";

type JuryIntroBannerProps = {
  nickname: string;
  isHost: boolean;
  juryNumber: number;
  juryCount: number;
  visible: boolean;
};

export function JuryIntroBanner({
  nickname,
  isHost,
  juryNumber,
  juryCount,
  visible,
}: JuryIntroBannerProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="jury-intro-banner jury-intro-banner--enter" aria-live="polite">
      <p className="eyebrow">
        Jury {juryNumber} of {juryCount}
      </p>
      <p className="jury-intro-banner__name">{nickname}</p>
      {isHost ? <p className="jury-intro-banner__meta text-muted">· host</p> : null}
    </div>
  );
}
