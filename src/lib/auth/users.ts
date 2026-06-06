import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function getUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();

  return db.select().from(users).where(eq(users.email, normalized)).get();
}

export async function createUser(input: {
  email: string;
  password: string;
  name: string;
}) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const passwordHash = await bcrypt.hash(input.password, 12);

  const [user] = await db
    .insert(users)
    .values({
      email,
      name,
      passwordHash,
    })
    .returning();

  if (!user) {
    throw new Error("Failed to create user");
  }

  return user;
}

export async function verifyUserPassword(
  email: string,
  password: string,
): Promise<{ id: string; email: string; name: string | null } | null> {
  const user = await getUserByEmail(email);

  if (!user?.passwordHash) {
    return null;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

export async function updateUserPassword(email: string, password: string) {
  const user = await getUserByEmail(email);

  if (!user) {
    return null;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  db.update(users)
    .set({ passwordHash })
    .where(eq(users.id, user.id))
    .run();

  return user;
}
