import type { MockEntrySet, MockPartyEntry } from "@/lib/party/mock-data/types";

/** Vienna 2026 — 25 Grand Final countries (semi-final qualifiers + Big 4 + host). */
export const EUROVISION_2026_PARTICIPANTS = [
  { name: "Albania", flagEmoji: "🇦🇱" },
  { name: "Australia", flagEmoji: "🇦🇺" },
  { name: "Austria", flagEmoji: "🇦🇹" },
  { name: "Belgium", flagEmoji: "🇧🇪" },
  { name: "Bulgaria", flagEmoji: "🇧🇬" },
  { name: "Croatia", flagEmoji: "🇭🇷" },
  { name: "Cyprus", flagEmoji: "🇨🇾" },
  { name: "Czechia", flagEmoji: "🇨🇿" },
  { name: "Denmark", flagEmoji: "🇩🇰" },
  { name: "Finland", flagEmoji: "🇫🇮" },
  { name: "France", flagEmoji: "🇫🇷" },
  { name: "Germany", flagEmoji: "🇩🇪" },
  { name: "Greece", flagEmoji: "🇬🇷" },
  { name: "Israel", flagEmoji: "🇮🇱" },
  { name: "Italy", flagEmoji: "🇮🇹" },
  { name: "Lithuania", flagEmoji: "🇱🇹" },
  { name: "Malta", flagEmoji: "🇲🇹" },
  { name: "Moldova", flagEmoji: "🇲🇩" },
  { name: "Norway", flagEmoji: "🇳🇴" },
  { name: "Poland", flagEmoji: "🇵🇱" },
  { name: "Romania", flagEmoji: "🇷🇴" },
  { name: "Serbia", flagEmoji: "🇷🇸" },
  { name: "Sweden", flagEmoji: "🇸🇪" },
  { name: "Ukraine", flagEmoji: "🇺🇦" },
  { name: "United Kingdom", flagEmoji: "🇬🇧" },
] as const satisfies readonly MockPartyEntry[];

export const EUROVISION_2026_ENTRY_SET: MockEntrySet = {
  id: "eurovision-2026",
  label: "Eurovision 2026 Grand Final (Vienna)",
  entries: EUROVISION_2026_PARTICIPANTS,
};
