"use client";

import { PresentationCeremony } from "@/components/presentation-ceremony";
import type { PresentationHostView } from "@/lib/party/presentation";
import type { SerializedEntry } from "@/lib/party/types";

type PresentationPageClientProps = {
  partyCode: string;
  initialEntries: SerializedEntry[];
  initialPresentation: PresentationHostView | null;
  initialPartyState: string;
};

export function PresentationPageClient(props: PresentationPageClientProps) {
  return <PresentationCeremony {...props} />;
}
