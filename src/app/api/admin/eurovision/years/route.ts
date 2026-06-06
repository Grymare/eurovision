import { requireSiteAdminSession } from "@/lib/auth/require-site-admin";
import { toErrorResponse } from "@/lib/http/errors";
import { listEurovisionYearSummaries } from "@/lib/eurovision/datasets";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireSiteAdminSession();

    return NextResponse.json({ years: listEurovisionYearSummaries() });
  } catch (error) {
    return toErrorResponse(error);
  }
}
