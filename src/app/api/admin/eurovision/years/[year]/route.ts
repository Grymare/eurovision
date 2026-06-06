import { requireSiteAdminSession } from "@/lib/auth/require-site-admin";
import { AppError, toErrorResponse } from "@/lib/http/errors";
import { parseJsonBody } from "@/lib/http/validation";
import {
  deleteEurovisionYear,
  loadEurovisionYear,
  saveEurovisionYear,
  type EurovisionYearDataset,
} from "@/lib/eurovision/datasets";
import { NextResponse } from "next/server";
import { z } from "zod";

const saveDatasetSchema = z.object({
  label: z.string().trim().min(1),
  hostCity: z.string().trim().min(1).optional(),
  source: z.enum(["manual", "api"]).default("manual"),
  entries: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        flagEmoji: z.string().trim().min(1),
      }),
    )
    .min(1),
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

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireSiteAdminSession();

    const { year: yearParam } = await context.params;
    const year = parseYearParam(yearParam);
    const dataset = loadEurovisionYear(year);

    if (!dataset) {
      throw new AppError("Dataset not found", 404, "DATASET_NOT_FOUND");
    }

    return NextResponse.json({ dataset });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireSiteAdminSession();

    const { year: yearParam } = await context.params;
    const year = parseYearParam(yearParam);
    const body = parseJsonBody(saveDatasetSchema, await request.json());

    const dataset: EurovisionYearDataset = {
      year,
      label: body.label,
      hostCity: body.hostCity,
      source: body.source,
      entries: body.entries,
    };

    const saved = saveEurovisionYear(dataset);

    return NextResponse.json({ dataset: saved });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireSiteAdminSession();

    const { year: yearParam } = await context.params;
    const year = parseYearParam(yearParam);
    const deleted = deleteEurovisionYear(year);

    if (!deleted) {
      throw new AppError("Dataset not found", 404, "DATASET_NOT_FOUND");
    }

    return NextResponse.json({ deleted: true, year });
  } catch (error) {
    return toErrorResponse(error);
  }
}
