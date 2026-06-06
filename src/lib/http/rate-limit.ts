import { AppError } from "@/lib/http/errors";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function pruneExpiredBuckets(now: number) {
  if (buckets.size < 500) {
    return;
  }

  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) {
      buckets.delete(key);
    }
  }
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  pruneExpiredBuckets(now);

  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: Math.max(bucket.resetAt - now, 0) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

export function assertRateLimit(key: string, limit: number, windowMs: number) {
  const result = checkRateLimit(key, limit, windowMs);

  if (!result.allowed) {
    throw new AppError("Too many requests. Try again shortly.", 429, "RATE_LIMITED");
  }
}
