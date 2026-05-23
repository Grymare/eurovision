export type MockPartyEntry = {
  name: string;
  flagEmoji: string;
};

export type MockEntrySet = {
  id: string;
  label: string;
  entries: readonly MockPartyEntry[];
};
