import { z } from "zod";
import { AppError } from "@/lib/http/errors";

export function parseJsonBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown,
): T {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw new AppError("Invalid request body", 400, "INVALID_BODY");
  }

  return result.data;
}
