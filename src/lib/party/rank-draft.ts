const STORAGE_PREFIX = "grymare-rank-draft:";

type RankDraft = {
  orderedIds: string[];
};

export function mergeRankOrder(saved: string[], entryIds: string[]): string[] {
  const entryIdSet = new Set(entryIds);
  const merged = saved.filter((id) => entryIdSet.has(id));

  for (const id of entryIds) {
    if (!merged.includes(id)) {
      merged.push(id);
    }
  }

  return merged;
}

export function getRankDraft(partyCode: string): RankDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${partyCode}`);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as RankDraft;

    if (!Array.isArray(parsed.orderedIds)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function setRankDraft(partyCode: string, orderedIds: string[]): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(
    `${STORAGE_PREFIX}${partyCode}`,
    JSON.stringify({ orderedIds } satisfies RankDraft),
  );
}

export function clearRankDraft(partyCode: string): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(`${STORAGE_PREFIX}${partyCode}`);
}
