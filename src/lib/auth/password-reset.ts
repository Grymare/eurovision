import { randomBytes } from "node:crypto";
import { db } from "@/db";
import { verificationTokens } from "@/db/schema";
import { getUserByEmail } from "@/lib/auth/users";
import { eq } from "drizzle-orm";

const RESET_PREFIX = "password-reset:";
const RESET_TTL_MS = 60 * 60 * 1000;

function resetIdentifier(email: string) {
  return `${RESET_PREFIX}${email.trim().toLowerCase()}`;
}

export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await getUserByEmail(email);

  if (!user?.passwordHash) {
    return null;
  }

  const token = randomBytes(32).toString("hex");
  const identifier = resetIdentifier(user.email);
  const expires = new Date(Date.now() + RESET_TTL_MS);

  db.delete(verificationTokens).where(eq(verificationTokens.identifier, identifier)).run();

  db.insert(verificationTokens)
    .values({
      identifier,
      token,
      expires,
    })
    .run();

  return token;
}

export function findPasswordResetEmail(token: string): string | null {
  const row = db
    .select()
    .from(verificationTokens)
    .where(eq(verificationTokens.token, token))
    .get();

  if (!row?.identifier.startsWith(RESET_PREFIX)) {
    return null;
  }

  if (row.expires.getTime() <= Date.now()) {
    return null;
  }

  return row.identifier.slice(RESET_PREFIX.length);
}

export function consumePasswordResetToken(token: string): string | null {
  const email = findPasswordResetEmail(token);

  if (!email) {
    return null;
  }

  db.delete(verificationTokens).where(eq(verificationTokens.token, token)).run();

  return email;
}
