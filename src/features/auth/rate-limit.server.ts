import 'server-only';

import { createHash } from 'node:crypto';

interface RateLimitBucket {
  timestamps: number[];
}

const MAX_BUCKETS = 1000;
const buckets = new Map<string, RateLimitBucket>();

function pruneOldBuckets(nowMs: number, maxWindowMs: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets.entries()) {
    const latest = bucket.timestamps.at(-1) ?? 0;
    if (nowMs - latest > maxWindowMs) {
      buckets.delete(key);
    }
  }
  while (buckets.size >= MAX_BUCKETS) {
    const oldestKey = buckets.keys().next().value;
    if (!oldestKey) break;
    buckets.delete(oldestKey);
  }
}

export function hashRateLimitKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

export function extractClientIpHash(request: Request): string {
  const forwarded = request.headers
    .get('x-forwarded-for')
    ?.split(',')[0]
    ?.trim();
  const realIp = request.headers.get('x-real-ip')?.trim();
  const rawIp = forwarded || realIp || 'unknown-client';
  return hashRateLimitKey(rawIp);
}

/**
 * Sliding-window per-process limiter. Single-instance baseline: production
 * deployments across multiple instances require a shared store at ingress/edge.
 */
export function consumeAuthRateLimit(
  bucketKey: string,
  maxAttempts: number,
  windowMs: number,
  nowMs: number = Date.now(),
): { allowed: boolean; retryAfterSeconds: number } {
  pruneOldBuckets(nowMs, windowMs);
  const existing = buckets.get(bucketKey);
  const activeTimestamps = (existing?.timestamps ?? []).filter(
    (ts) => nowMs - ts < windowMs,
  );

  if (activeTimestamps.length >= maxAttempts) {
    const oldest = activeTimestamps[0] ?? nowMs;
    const retryAfterMs = Math.max(1000, windowMs - (nowMs - oldest));
    buckets.set(bucketKey, { timestamps: activeTimestamps });
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  activeTimestamps.push(nowMs);
  buckets.set(bucketKey, { timestamps: activeTimestamps });
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetAuthRateLimitsForTest(): void {
  buckets.clear();
}
