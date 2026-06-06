import { requireSiteAdminSession } from "@/lib/auth/require-site-admin";
import { toErrorResponse } from "@/lib/http/errors";
import { parseJsonBody } from "@/lib/http/validation";
import { buildLegacyImportPreview } from "@/lib/party/legacy-import/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const previewSchema = z.object({
  matrixText: z.string().min(1),
  year: z.coerce.number().int().min(1956).max(2100),
  title: z.string().trim().max(80).optional(),
  strictTotals: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    await requireSiteAdminSession();
    const body = parseJsonBody(previewSchema, await request.json());
    const preview = buildLegacyImportPreview(body);

    return NextResponse.json({ preview });
  } catch (error) {
    return toErrorResponse(error);
  }
}
