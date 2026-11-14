import { NextResponse } from 'next/server';

import { CHAT_COPY, CHAT_LIMITS } from '@/constants/chat.constant';
import { ERROR_COPY } from '@/constants/copy.constant';
import { answerAskOmaChatWithMeta } from '@/features/ai/chat.server';
import { ChatServerError } from '@/features/ai/errors.server';
import {
  enforceChatRateLimit,
  resolveChatRateLimitKey,
} from '@/features/ai/rate-limit.server';
import { apiErrorSchema, apiSuccessSchema } from '@/validations/api.schema';
import { logServerEvent } from '@/lib/logger.server';
import { readBoundedUtf8Body } from '@/lib/request-body.server';
import {
  chatRequestSchema,
  chatResponseDataSchema,
} from '@/validations/chat.schema';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

const chatSuccessResponseSchema = apiSuccessSchema(chatResponseDataSchema);

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();

  const clientKey = resolveChatRateLimitKey(request);
  try {
    enforceChatRateLimit(clientKey);
  } catch (err) {
    const retryAfter =
      err instanceof ChatServerError && err.retryAfterSeconds
        ? err.retryAfterSeconds
        : 60;
    logServerEvent({
      requestId,
      route: '/api/chat',
      operation: 'rate_limit',
      status: 429,
      durationMs: Date.now() - startedAt,
      count: 0,
      errorCode: 'RATE_LIMITED',
    });
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: {
          code: 'RATE_LIMITED',
          message: CHAT_COPY.RATE_LIMIT_MESSAGE,
        },
        requestId,
      }),
      {
        status: 429,
        headers: {
          ...NO_STORE_HEADERS,
          'Retry-After': String(retryAfter),
        },
      },
    );
  }

  const bounded = await readBoundedUtf8Body(
    request,
    CHAT_LIMITS.MAX_REQUEST_BYTES,
  );
  if (!bounded.ok) {
    const status = bounded.reason === 'too_large' ? 413 : 400;
    const code =
      bounded.reason === 'too_large' ? 'REQUEST_TOO_LARGE' : 'INVALID_REQUEST';
    const message =
      bounded.reason === 'too_large'
        ? ERROR_COPY.REQUEST_TOO_LARGE
        : ERROR_COPY.INVALID_REQUEST;
    logServerEvent({
      requestId,
      route: '/api/chat',
      operation: 'ask_oma_chat',
      status,
      durationMs: Date.now() - startedAt,
      count: 0,
      errorCode: code,
    });
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: { code, message },
        requestId,
      }),
      { status, headers: NO_STORE_HEADERS },
    );
  }

  let jsonBody: unknown;
  try {
    jsonBody = JSON.parse(bounded.text);
  } catch {
    logServerEvent({
      requestId,
      route: '/api/chat',
      operation: 'ask_oma_chat',
      status: 400,
      durationMs: Date.now() - startedAt,
      count: 0,
      errorCode: 'INVALID_REQUEST',
    });
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: {
          code: 'INVALID_REQUEST',
          message: ERROR_COPY.INVALID_REQUEST,
        },
        requestId,
      }),
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const parsed = chatRequestSchema.safeParse(jsonBody);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || 'root';
      if (!fieldErrors[key]) {
        fieldErrors[key] = [];
      }
      fieldErrors[key].push(issue.message);
    }

    logServerEvent({
      requestId,
      route: '/api/chat',
      operation: 'ask_oma_chat',
      status: 422,
      durationMs: Date.now() - startedAt,
      count: 0,
      errorCode: 'VALIDATION_ERROR',
    });
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: ERROR_COPY.VALIDATION_ERROR,
          fieldErrors,
        },
        requestId,
      }),
      { status: 422, headers: NO_STORE_HEADERS },
    );
  }

  try {
    // Intentionally never forwards incoming admin cookies or Authorization headers.
    const { data, meta } = await answerAskOmaChatWithMeta(parsed.data, {
      signal: request.signal,
      clientKey,
    });
    const payload = chatSuccessResponseSchema.parse({
      ok: true,
      data,
      requestId,
    });

    logServerEvent({
      requestId,
      route: '/api/chat',
      operation: data.operation,
      status: 200,
      durationMs: Date.now() - startedAt,
      count: data.items.length,
      branchId: parsed.data.branchId ?? null,
      mode: meta.mode,
      fallbackReason: meta.fallbackReason,
    });

    return NextResponse.json(payload, {
      status: 200,
      headers: NO_STORE_HEADERS,
    });
  } catch (err) {
    const status = err instanceof ChatServerError ? err.statusCode : 503;
    const code = err instanceof ChatServerError ? err.code : 'UPSTREAM_ERROR';
    const message =
      err instanceof ChatServerError ? err.message : CHAT_COPY.OUTAGE_MESSAGE;
    const headers: Record<string, string> =
      status === 429 && err instanceof ChatServerError && err.retryAfterSeconds
        ? { ...NO_STORE_HEADERS, 'Retry-After': String(err.retryAfterSeconds) }
        : NO_STORE_HEADERS;

    logServerEvent({
      requestId,
      route: '/api/chat',
      operation: code.toLowerCase(),
      status,
      durationMs: Date.now() - startedAt,
      count: 0,
      errorCode: code,
      branchId: parsed.data.branchId ?? null,
    });

    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: { code, message },
        requestId,
      }),
      { status, headers },
    );
  }
}
