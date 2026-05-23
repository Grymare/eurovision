import { db } from "@/db";
import { getDatabasePath } from "@/db/index";
import { appMeta } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const existing = db
    .select()
    .from(appMeta)
    .where(eq(appMeta.key, "health"))
    .get();

  if (!existing) {
    db.insert(appMeta)
      .values({ key: "health", value: "ok" })
      .run();
  }

  return NextResponse.json({
    status: "ok",
    service: "grymare-eurovision",
    database: getDatabasePath(),
    timestamp: new Date().toISOString(),
  });
}
