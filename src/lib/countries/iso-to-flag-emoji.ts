export function isoToFlagEmoji(isoCode: string): string {
  const iso = isoCode.trim().toUpperCase();

  if (iso.length !== 2 || !/^[A-Z]{2}$/.test(iso)) {
    return "🏳️";
  }

  return String.fromCodePoint(
    ...[...iso].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65),
  );
}
