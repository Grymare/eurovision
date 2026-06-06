import { requireSiteAdminSession } from "@/lib/auth/require-site-admin";
import { AppError, toErrorResponse } from "@/lib/http/errors";
import { parseJsonBody } from "@/lib/http/validation";
import { saveEurovisionYear } from "@/lib/eurovision/datasets";
import {
  syncGrandFinalYear,
  syncPreviewToDataset,
} from "@/lib/eurovision/sync/sync-grand-final";
import { NextResponse } from "next/server";
import { z } from "zod";

const syncSchema = z.object({
  save: z.boolean().optional(),
});

type RouteContext = {
  params: Promise<{ year: string }>;
};

function parseYearParam(value: string) {
  const year = Number.parseInt(value, 10);

  if (!Number.isInteger(year) || year < 1956 || year > 2100) {
    throw new AppError("Invalid year", 400, "INVALID_YEAR");
  }

  return year;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireSiteAdminSession();

    const { year: yearParam } = await context.params;
    const year = parseYearParam(yearParam);
    const body = parseJsonBody(syncSchema, await request.json().catch(() => ({})));

    const preview = await syncGrandFinalYear(year);

    if (preview.unmapped.length > 0 && body.save) {
      throw new AppError(
        "Resolve unmapped countries before saving API sync",
        422,
        "ESC_SYNC_UNMAPPED",
      );
    }

    if (body.save) {
      const saved = saveEurovisionYear(syncPreviewToDataset(preview));
      return NextResponse.json({ preview, dataset: saved, saved: true });
    }

    return NextResponse.json({ preview, saved: false });
  } catch (error) {
    return toErrorResponse(error);
  }
}
