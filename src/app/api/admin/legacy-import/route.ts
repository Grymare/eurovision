import { requireSiteAdminSession } from "@/lib/auth/require-site-admin";
import { toErrorResponse } from "@/lib/http/errors";
import { parseJsonBody } from "@/lib/http/validation";
import { importLegacyParty } from "@/lib/party/legacy-import/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const importSchema = z.object({
  matrixText: z.string().min(1),
  year: z.coerce.number().int().min(1956).max(2100),
  title: z.string().trim().max(80).optional(),
  overwrite: z.boolean().optional(),
  strictTotals: z.boolean().optional(),
  finishedAt: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    await requireSiteAdminSession();
    const body = parseJsonBody(importSchema, await request.json());
    const result = await importLegacyParty(body);

    return NextResponse.json({ result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
