import { getAppBaseUrl, isEmailConfigured, sendAppEmail } from "@/lib/auth/email";
import { createPasswordResetToken } from "@/lib/auth/password-reset";
import { AppError, toErrorResponse } from "@/lib/http/errors";
import { assertRateLimit } from "@/lib/http/rate-limit";
import { parseJsonBody } from "@/lib/http/validation";
import { NextResponse } from "next/server";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(254),
});

const GENERIC_MESSAGE =
  "If an account with that email exists and uses a password, we sent reset instructions.";

export async function POST(request: Request) {
  try {
    if (!isEmailConfigured()) {
      throw new AppError("Password reset email is not configured", 503, "EMAIL_NOT_CONFIGURED");
    }

    const body = parseJsonBody(forgotPasswordSchema, await request.json());
    const email = body.email.trim().toLowerCase();

    assertRateLimit(`forgot-password:${email}`, 3, 60 * 60 * 1000);

    const token = await createPasswordResetToken(email);

    if (token) {
      const resetUrl = `${getAppBaseUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`;

      await sendAppEmail({
        to: email,
        subject: "Reset your Grymare Eurovision password",
        text: [
          "You requested a password reset for Grymare Eurovision.",
          "",
          `Open this link within one hour to choose a new password:`,
          resetUrl,
          "",
          "If you did not request this, you can ignore this email.",
        ].join("\n"),
      });
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    return toErrorResponse(error);
  }
}
