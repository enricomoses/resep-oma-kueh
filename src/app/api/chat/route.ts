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
import {
  chatRequestSchema,
  chatResponseDataSchema,
} from '@/validations/chat.schema';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

const chatSuccessResponseSchema = apiSuccessSchema(chatResponseDataSchema);

async function readBoundedUtf8Body(
  request: Request,
  maxBytes: number,
): Promise<
  { ok: true; text: string } | { ok: false; reason: 'too_large' | 'read_error' }
> {
  if (!request.body) {
    try {
      const buffer = await request.arrayBuffer();
      if (buffer.byteLength > maxBytes) {
        return { ok: false, reason: 'too_large' };
      }
      return { ok: true, text: new TextDecoder('utf-8').decode(buffer) };
    } catch {
      return { ok: false, reason: 'read_error' };
    }
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => {});
        return { ok: false, reason: 'too_large' };
      }
      chunks.push(value);
    }
  } catch {
    await reader.cancel().catch(() => {});
    return { ok: false, reason: 'read_error' };
  }

  const combined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { ok: true, text: new TextDecoder('utf-8').decode(combined) };
}

function logChatOutcome(params: {
  requestId: string;
  operation: string;
  status: number;
  durationMs: number;
  itemCount: number;
  hasBranch: boolean;
  mode?: string;
  fallbackReason?: string;
}) {
  // Never log message text, chat history, cookies, tokens, or customer PII.
  console.info('[ask-oma-chat]', params);
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();

  const contentLength = request.headers.get('content-length');
  if (
    contentLength &&
    Number.parseInt(contentLength, 10) > CHAT_LIMITS.MAX_REQUEST_BYTES
  ) {
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: {
          code: 'REQUEST_TOO_LARGE',
          message: ERROR_COPY.REQUEST_TOO_LARGE,
        },
        requestId,
      }),
      { status: 413, headers: NO_STORE_HEADERS },
    );
  }

  const clientKey = resolveChatRateLimitKey(request);
  try {
    enforceChatRateLimit(clientKey);
  } catch (err) {
    const retryAfter =
      err instanceof ChatServerError && err.retryAfterSeconds
        ? err.retryAfterSeconds
        : 60;
    logChatOutcome({
      requestId,
      operation: 'rate_limit',
      status: 429,
      durationMs: Date.now() - startedAt,
      itemCount: 0,
      hasBranch: false,
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

    logChatOutcome({
      requestId,
      operation: data.operation,
      status: 200,
      durationMs: Date.now() - startedAt,
      itemCount: data.items.length,
      hasBranch: Boolean(parsed.data.branchId),
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

    logChatOutcome({
      requestId,
      operation: code.toLowerCase(),
      status,
      durationMs: Date.now() - startedAt,
      itemCount: 0,
      hasBranch: Boolean(parsed.data.branchId),
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
