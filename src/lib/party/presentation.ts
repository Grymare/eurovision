import { EUROVISION_POINT_VALUES } from "@/lib/party/constants";
import type { VoteAllocations } from "@/db/schema";

export const LOW_POINT_VALUES = EUROVISION_POINT_VALUES.filter((points) => points !== 12);

export type PresentationPhase =
  | "idle"
  | "jury_intro"
  | "awaiting_low"
  | "revealing_low"
  | "reordering_low"
  | "awaiting_twelve"
  | "revealing_twelve"
  | "reordering_twelve"
  | "jury_handoff"
  | "winner"
  | "complete";

export type PresentationState = {
  version: 2;
  participantIds: string[];
  juryIndex: number;
  phase: PresentationPhase;
  runningTotals: Record<string, number>;
};

export type PresentationAllocation = {
  entryId: string;
  name: string;
  flagEmoji: string;
  points: number;
};

export type PresentationJury = {
  id: string;
  nickname: string;
  isHost: boolean;
};

export type PresentationHostView = {
  phase: PresentationPhase;
  juryIndex: number;
  juryCount: number;
  runningTotals: Record<string, number>;
  currentJury: PresentationJury | null;
  juryOrder: PresentationJury[];
  lowReveal: PresentationAllocation[] | null;
  twelveReveal: PresentationAllocation | null;
  isLastJury: boolean;
};

export type PresentationAction =
  | "open"
  | "begin_low_reveal"
  | "commit_low"
  | "begin_twelve_reveal"
  | "commit_twelve"
  | "next_jury"
  | "finish";

export function createInitialPresentationState(
  participantIds: string[],
  entryIds: string[],
): PresentationState {
  const runningTotals: Record<string, number> = {};

  for (const entryId of entryIds) {
    runningTotals[entryId] = 0;
  }

  return {
    version: 2,
    participantIds,
    juryIndex: 0,
    phase: "jury_intro",
    runningTotals,
  };
}

export function parsePresentationState(revealOrderJson: string | null): PresentationState | null {
  if (!revealOrderJson) {
    return null;
  }

  const parsed = JSON.parse(revealOrderJson) as PresentationState;

  if (parsed.version !== 2) {
    return null;
  }

  if (
    !Array.isArray(parsed.participantIds) ||
    typeof parsed.juryIndex !== "number" ||
    typeof parsed.phase !== "string" ||
    !parsed.runningTotals ||
    typeof parsed.runningTotals !== "object"
  ) {
    throw new Error("Invalid presentation state");
  }

  return parsed;
}

export function serializePresentationState(state: PresentationState): string {
  return JSON.stringify(state);
}

export function shuffleParticipantIds(participantIds: string[]): string[] {
  const shuffled = [...participantIds];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function extractLowPointAllocations(
  allocations: VoteAllocations,
  entryById: Map<string, { name: string; flagEmoji: string }>,
): PresentationAllocation[] {
  return Object.entries(allocations)
    .filter(([, points]) => points !== 12)
    .map(([entryId, points]) => {
      const entry = entryById.get(entryId);

      return {
        entryId,
        name: entry?.name ?? "Unknown",
        flagEmoji: entry?.flagEmoji ?? "",
        points,
      };
    })
    .sort((left, right) => left.points - right.points || left.name.localeCompare(right.name));
}

export function extractTwelvePointAllocation(
  allocations: VoteAllocations,
  entryById: Map<string, { name: string; flagEmoji: string }>,
): PresentationAllocation | null {
  for (const [entryId, points] of Object.entries(allocations)) {
    if (points !== 12) {
      continue;
    }

    const entry = entryById.get(entryId);

    return {
      entryId,
      name: entry?.name ?? "Unknown",
      flagEmoji: entry?.flagEmoji ?? "",
      points: 12,
    };
  }

  return null;
}

export function applyAllocationsToTotals(
  runningTotals: Record<string, number>,
  allocations: Array<{ entryId: string; points: number }>,
): Record<string, number> {
  const nextTotals = { ...runningTotals };

  for (const allocation of allocations) {
    nextTotals[allocation.entryId] = (nextTotals[allocation.entryId] ?? 0) + allocation.points;
  }

  return nextTotals;
}

export type ScoreboardEntry = {
  entryId: string;
  name: string;
  flagEmoji: string;
  sortOrder: number;
  totalPoints: number;
};

export function rankScoreboardEntries(
  entries: Array<{ id: string; name: string; flagEmoji: string; sortOrder: number }>,
  runningTotals: Record<string, number>,
): ScoreboardEntry[] {
  return [...entries]
    .map((entry) => ({
      entryId: entry.id,
      name: entry.name,
      flagEmoji: entry.flagEmoji,
      sortOrder: entry.sortOrder,
      totalPoints: runningTotals[entry.id] ?? 0,
    }))
    .sort(
      (left, right) =>
        right.totalPoints - left.totalPoints ||
        left.sortOrder - right.sortOrder ||
        left.name.localeCompare(right.name),
    );
}

export function splitIntoColumns<T>(items: T[]): [T[], T[]] {
  const midpoint = Math.ceil(items.length / 2);

  return [items.slice(0, midpoint), items.slice(midpoint)];
}
