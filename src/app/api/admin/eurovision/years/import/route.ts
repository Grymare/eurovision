import { requireSiteAdminSession } from "@/lib/auth/require-site-admin";
import { toErrorResponse } from "@/lib/http/errors";
import {
  parseEurovisionYearDataset,
  saveEurovisionYear,
} from "@/lib/eurovision/datasets";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await requireSiteAdminSession();

    const raw = (await request.json()) as unknown;
    const dataset = parseEurovisionYearDataset(raw);
    const saved = saveEurovisionYear(dataset);

    return NextResponse.json({ dataset: saved });
  } catch (error) {
    return toErrorResponse(error);
  }
}
