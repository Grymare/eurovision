import { EUROVISION_2026_ENTRY_SET } from "@/lib/party/mock-data/eurovision-2026-participants";
import type { MockEntrySet } from "@/lib/party/mock-data/types";

export {
  EUROVISION_2026_ENTRY_SET,
  EUROVISION_2026_PARTICIPANTS,
} from "@/lib/party/mock-data/eurovision-2026-participants";
export type { MockEntrySet, MockPartyEntry } from "@/lib/party/mock-data/types";

const MOCK_ENTRY_SETS: Record<string, MockEntrySet> = {
  [EUROVISION_2026_ENTRY_SET.id]: EUROVISION_2026_ENTRY_SET,
};

export function getMockEntrySet(setId: string): MockEntrySet | null {
  return MOCK_ENTRY_SETS[setId] ?? null;
}

export function listMockEntrySets(): MockEntrySet[] {
  return Object.values(MOCK_ENTRY_SETS);
}
