import { auth } from "@/lib/auth";
import { isSiteAdmin } from "@/lib/auth/admin";
import { AppError } from "@/lib/http/errors";

export async function requireSiteAdminSession() {
  const session = await auth();

  if (!isSiteAdmin(session?.user?.email)) {
    throw new AppError("Admin access required", 403, "ADMIN_REQUIRED");
  }

  return session;
}
