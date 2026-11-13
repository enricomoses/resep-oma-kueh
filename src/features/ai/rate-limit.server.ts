import 'server-only';

import { CHAT_LIMITS } from '@/constants/chat.constant';
import { ChatRateLimitError } from '@/features/ai/errors.server';

interface RateLimitBucket {
  count: number;
  resetAtMs: number;
}

/**
 * Baseline in-memory sliding/fixed-window limiter for deterministic F22 chat.
 * For serverless multi-instance production, external edge/Redis rate limiting
 * is recommended and mandatory before any generative provider (F23) is enabled.
 */
const buckets = new Map<string, RateLimitBucket>();

export function resolveChatRateLimitKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0]?.trim();
    if (firstIp) {
      return `ip:${firstIp.slice(0, 64)}`;
    }
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) {
    return `ip:${realIp.slice(0, 64)}`;
  }
  return 'ip:local-anon';
}

export function enforceChatRateLimit(
  clientKey: string,
  nowMs: number = Date.now(),
  maxRequests: number = CHAT_LIMITS.RATE_LIMIT_MAX_REQUESTS,
  windowMs: number = CHAT_LIMITS.RATE_LIMIT_WINDOW_MS,
): void {
  if (buckets.size >= CHAT_LIMITS.MAX_RATE_LIMIT_BUCKETS) {
    for (const [key, entry] of buckets) {
      if (entry.resetAtMs <= nowMs) {
        buckets.delete(key);
      }
    }
    if (buckets.size >= CHAT_LIMITS.MAX_RATE_LIMIT_BUCKETS) {
      const oldestKey = buckets.keys().next().value;
      if (oldestKey !== undefined) {
        buckets.delete(oldestKey);
      }
    }
  }

  const existing = buckets.get(clientKey);
  if (!existing || existing.resetAtMs <= nowMs) {
    buckets.set(clientKey, {
      count: 1,
      resetAtMs: nowMs + windowMs,
    });
    return;
  }

  if (existing.count >= maxRequests) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.resetAtMs - nowMs) / 1000),
    );
    throw new ChatRateLimitError(retryAfterSeconds);
  }

  existing.count += 1;
}

export function resetChatRateLimiterForTests(): void {
  buckets.clear();
}
