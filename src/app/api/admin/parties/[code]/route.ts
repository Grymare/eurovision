import { requireSiteAdminSession } from "@/lib/auth/require-site-admin";
import { AppError, toErrorResponse } from "@/lib/http/errors";
import { deleteFinishedPartyByCode } from "@/lib/party/history";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireSiteAdminSession();

    const { code } = await context.params;
    const deleted = await deleteFinishedPartyByCode(code);

    if (!deleted) {
      throw new AppError("Finished party not found", 404, "PARTY_NOT_FOUND");
    }

    return NextResponse.json({ deleted: true, code: code.toUpperCase() });
  } catch (error) {
    return toErrorResponse(error);
  }
}
