/**
 * Delete all party-related rows (parties cascade to entries, participants, votes, results).
 *
 * Usage:
 *   pnpm exec tsx scripts/wipe-party-data.ts --confirm
 */
import { db } from "@/db";
import { parties } from "@/db/schema";
import { count } from "drizzle-orm";

async function main() {
  const confirmed = process.argv.includes("--confirm");

  if (!confirmed) {
    console.error("Refusing to wipe without --confirm");
    process.exit(1);
  }

  const [partyCount] = await db.select({ value: count() }).from(parties).all();

  console.log(`Deleting ${partyCount?.value ?? 0} parties (cascades to entries, jurors, votes, results)…`);

  await db.delete(parties);

  const [remaining] = await db.select({ value: count() }).from(parties).all();

  console.log(`Done. Parties remaining: ${remaining?.value ?? 0}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
