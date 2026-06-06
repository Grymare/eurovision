import { requireSiteAdminSession } from "@/lib/auth/require-site-admin";
import { AppError, toErrorResponse } from "@/lib/http/errors";
import { exportEurovisionYearJson } from "@/lib/eurovision/datasets";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ year: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireSiteAdminSession();

    const { year: yearParam } = await context.params;
    const year = Number.parseInt(yearParam, 10);

    if (!Number.isInteger(year)) {
      throw new AppError("Invalid year", 400, "INVALID_YEAR");
    }

    const json = exportEurovisionYearJson(year);

    if (!json) {
      throw new AppError("Dataset not found", 404, "DATASET_NOT_FOUND");
    }

    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${year}.json"`,
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
