import { createUser, getUserByEmail } from "@/lib/auth/users";
import { AppError, toErrorResponse } from "@/lib/http/errors";
import { parseJsonBody } from "@/lib/http/validation";
import { NextResponse } from "next/server";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(2).max(24),
});

export async function POST(request: Request) {
  try {
    const body = parseJsonBody(registerSchema, await request.json());

    const existing = await getUserByEmail(body.email);

    if (existing) {
      throw new AppError("An account with this email already exists", 409, "EMAIL_TAKEN");
    }

    const user = await createUser(body);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
