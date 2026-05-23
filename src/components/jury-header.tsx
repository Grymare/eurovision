type JuryHeaderProps = {
  nickname: string;
  isHost: boolean;
  juryNumber: number;
  juryCount: number;
};

export function JuryHeader({
  nickname,
  isHost,
  juryNumber,
  juryCount,
}: JuryHeaderProps) {
  const juriesLeft = Math.max(juryCount - juryNumber, 0);

  return (
    <div className="presentation-page__jury-header presentation-page__jury-header--enter">
      <p className="presentation-page__jury-name">{nickname}</p>
      <p className="presentation-page__jury-meta presentation-page__jury-meta--enter">
        Jury {juryNumber} of {juryCount}
        <span aria-hidden="true"> · </span>
        {juriesLeft === 1 ? "1 jury left" : `${juriesLeft} juries left`}
        {isHost ? " · host" : ""}
      </p>
    </div>
  );
}
