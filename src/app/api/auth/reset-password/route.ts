import { consumePasswordResetToken } from "@/lib/auth/password-reset";
import { updateUserPassword } from "@/lib/auth/users";
import { AppError, toErrorResponse } from "@/lib/http/errors";
import { parseJsonBody } from "@/lib/http/validation";
import { NextResponse } from "next/server";
import { z } from "zod";

const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  try {
    const body = parseJsonBody(resetPasswordSchema, await request.json());
    const email = consumePasswordResetToken(body.token);

    if (!email) {
      throw new AppError("This reset link is invalid or has expired", 400, "INVALID_RESET_TOKEN");
    }

    const user = await updateUserPassword(email, body.password);

    if (!user) {
      throw new AppError("Account not found", 404, "USER_NOT_FOUND");
    }

    return NextResponse.json({ message: "Password updated. You can sign in now." });
  } catch (error) {
    return toErrorResponse(error);
  }
}
