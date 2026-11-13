import 'server-only';

import { CHAT_LIMITS } from '@/constants/chat.constant';
import {
  ChatGenerativeQuotaError,
  ChatLimiterUnavailableError,
  ChatRateLimitError,
} from '@/features/ai/errors.server';

export interface ExternalLimiterStore {
  executeCommand(
    command: readonly (string | number)[],
    signal?: AbortSignal,
  ): Promise<unknown>;
}

export interface GenerativeLimiterConfig {
  storeUrl: string;
  storeToken: string;
  hashSalt?: string;
  clientKey: string;
  dailyQuota: number;
  rpmLimit?: number;
  globalRpmLimit?: number;
  maxConcurrency?: number;
  now?: Date;
  signal?: AbortSignal;
  store?: ExternalLimiterStore;
}

export interface GenerativeLimiterLease {
  dailyUsed: number;
  release(): Promise<void>;
}

const LUA_RESERVE_SCRIPT = `
local conc = tonumber(redis.call('GET', KEYS[1]) or '0')
if conc >= tonumber(ARGV[1]) then return {'DENIED', 'CONCURRENCY_LIMIT', 5} end
local clientRpm = tonumber(redis.call('GET', KEYS[2]) or '0')
if clientRpm >= tonumber(ARGV[2]) then return {'DENIED', 'RPM_LIMIT', 60} end
local globalRpm = tonumber(redis.call('GET', KEYS[3]) or '0')
if globalRpm >= tonumber(ARGV[3]) then return {'DENIED', 'GLOBAL_RPM_LIMIT', 60} end
local daily = tonumber(redis.call('GET', KEYS[4]) or '0')
if daily >= tonumber(ARGV[4]) then return {'DENIED', 'DAILY_QUOTA_EXCEEDED', 0} end

local newConc = redis.call('INCR', KEYS[1])
redis.call('EXPIRE', KEYS[1], tonumber(ARGV[5]))
local newClient = redis.call('INCR', KEYS[2])
if newClient == 1 then redis.call('EXPIRE', KEYS[2], tonumber(ARGV[6])) end
local newGlobal = redis.call('INCR', KEYS[3])
if newGlobal == 1 then redis.call('EXPIRE', KEYS[3], tonumber(ARGV[6])) end
local newDay = redis.call('INCR', KEYS[4])
if newDay == 1 then redis.call('EXPIRE', KEYS[4], tonumber(ARGV[7])) end

return {'OK', newDay}
`.trim();

const LUA_RELEASE_SCRIPT = `
local cur = tonumber(redis.call('GET', KEYS[1]) or '0')
if cur > 0 then return redis.call('DECR', KEYS[1]) end
return 0
`.trim();

function formatJakartaDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

/**
 * Hashes client identifier with HMAC-SHA256 before writing short-TTL counters
 * to the external metadata store. Raw IPs, prompts, and histories are never stored.
 */
export async function hashChatLimiterClientKey(
  clientKey: string,
  salt: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(salt),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await globalThis.crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(clientKey),
  );
  return Array.from(new Uint8Array(signature), (b) =>
    b.toString(16).padStart(2, '0'),
  )
    .join('')
    .slice(0, 24);
}

export function createUpstashRestLimiterStore(
  storeUrl: string,
  storeToken: string,
): ExternalLimiterStore {
  return {
    async executeCommand(command, signal) {
      const timeout = AbortSignal.timeout(CHAT_LIMITS.LIMITER_STORE_TIMEOUT_MS);
      const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

      let response: Response;
      try {
        response = await fetch(storeUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${storeToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(command),
          cache: 'no-store',
          signal: combined,
        });
      } catch {
        throw new ChatLimiterUnavailableError();
      }

      if (!response.ok) {
        throw new ChatLimiterUnavailableError();
      }

      let parsed: unknown;
      try {
        parsed = await response.json();
      } catch {
        throw new ChatLimiterUnavailableError();
      }

      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        'error' in parsed ||
        !('result' in parsed)
      ) {
        throw new ChatLimiterUnavailableError();
      }

      return (parsed as { result: unknown }).result;
    },
  };
}

/**
 * Acquires a fail-closed, multi-instance atomic reservation for F23 generative calls.
 * - Throws ChatLimiterUnavailableError (503) if the external store is unreachable or invalid.
 * - Throws ChatRateLimitError (429) on per-client RPM, global RPM, or global concurrency burst.
 * - Throws ChatGenerativeQuotaError if daily generative budget is reached so caller can fall back safely.
 */
export async function reserveGenerativeSlot(
  config: GenerativeLimiterConfig,
): Promise<GenerativeLimiterLease> {
  const now = config.now ?? new Date();
  const minuteBucket = Math.floor(now.getTime() / 60_000);
  const dayBucket = formatJakartaDateKey(now);
  const hashedClient = await hashChatLimiterClientKey(
    config.clientKey,
    config.hashSalt ?? config.storeToken,
  );

  const concurrencyKey = 'askoma:conc:global';
  const clientRpmKey = `askoma:rpm:client:${hashedClient}:${minuteBucket}`;
  const globalRpmKey = `askoma:rpm:global:${minuteBucket}`;
  const dailyKey = `askoma:day:global:${dayBucket}`;

  const rpmLimit = config.rpmLimit ?? CHAT_LIMITS.GENERATIVE_DEFAULT_RPM_LIMIT;
  const globalRpmLimit =
    config.globalRpmLimit ?? CHAT_LIMITS.GENERATIVE_DEFAULT_GLOBAL_RPM_LIMIT;
  const maxConcurrency =
    config.maxConcurrency ?? CHAT_LIMITS.GENERATIVE_DEFAULT_MAX_CONCURRENCY;

  const store =
    config.store ??
    createUpstashRestLimiterStore(config.storeUrl, config.storeToken);

  const rawResult = await store.executeCommand(
    [
      'EVAL',
      LUA_RESERVE_SCRIPT,
      4,
      concurrencyKey,
      clientRpmKey,
      globalRpmKey,
      dailyKey,
      maxConcurrency,
      rpmLimit,
      globalRpmLimit,
      config.dailyQuota,
      CHAT_LIMITS.LIMITER_CONCURRENCY_TTL_SECONDS,
      CHAT_LIMITS.LIMITER_RPM_TTL_SECONDS,
      CHAT_LIMITS.LIMITER_DAILY_TTL_SECONDS,
    ],
    config.signal,
  );

  if (!Array.isArray(rawResult) || rawResult.length < 2) {
    throw new ChatLimiterUnavailableError();
  }

  const status = rawResult[0];
  if (status === 'OK') {
    const dailyUsed = Number(rawResult[1]);
    let released = false;
    return {
      dailyUsed: Number.isFinite(dailyUsed) ? dailyUsed : 1,
      async release() {
        if (released) return;
        released = true;
        try {
          await store.executeCommand([
            'EVAL',
            LUA_RELEASE_SCRIPT,
            1,
            concurrencyKey,
          ]);
        } catch {
          // Best-effort decrement; safety TTL (60s) still guarantees lease recovery.
        }
      },
    };
  }

  if (status === 'DENIED') {
    const reason = String(rawResult[1]);
    const retryAfter = Math.max(1, Number(rawResult[2]) || 60);
    if (reason === 'DAILY_QUOTA_EXCEEDED') {
      throw new ChatGenerativeQuotaError();
    }
    throw new ChatRateLimitError(retryAfter);
  }

  throw new ChatLimiterUnavailableError();
}
