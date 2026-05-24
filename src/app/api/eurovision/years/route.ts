import { listEurovisionYearSummaries } from "@/lib/eurovision/datasets";
import { toErrorResponse } from "@/lib/http/errors";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({
      years: listEurovisionYearSummaries(),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
