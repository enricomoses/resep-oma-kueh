import { NextResponse } from 'next/server';
import { CHECKOUT_COPY, CHECKOUT_LIMITS } from '@/constants/checkout.constant';
import { ERROR_COPY } from '@/constants/copy.constant';
import { CheckoutError } from '@/features/checkout/errors.server';
import { prepareCheckoutQuote } from '@/features/checkout/service.server';
import { logServerEvent } from '@/lib/logger.server';
import { readBoundedUtf8Body } from '@/lib/request-body.server';
import { apiErrorSchema, apiSuccessSchema } from '@/validations/api.schema';
import {
  checkoutPrepareRequestSchema,
  checkoutPrepareResponseSchema,
} from '@/validations/checkout.schema';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();

  // 1. Enforce streaming payload byte limit (32 KiB)
  const bounded = await readBoundedUtf8Body(
    request,
    CHECKOUT_LIMITS.MAX_REQUEST_BYTES,
  );
  if (!bounded.ok) {
    const isTooLarge = bounded.reason === 'too_large';
    const status = isTooLarge ? 413 : 400;
    const code = isTooLarge ? 'REQUEST_TOO_LARGE' : 'INVALID_REQUEST';
    logServerEvent({
      requestId,
      route: '/api/checkout/prepare',
      operation: 'prepare_quote',
      status,
      durationMs: Date.now() - startedAt,
      errorCode: code,
    });
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: {
          code,
          message: isTooLarge
            ? CHECKOUT_COPY.ERROR_TOO_LARGE
            : CHECKOUT_COPY.ERROR_INVALID_REQUEST,
        },
        requestId,
      }),
      { status, headers: NO_STORE_HEADERS },
    );
  }

  // 2. Parse JSON body
  let body: unknown;
  try {
    body = JSON.parse(bounded.text);
  } catch {
    logServerEvent({
      requestId,
      route: '/api/checkout/prepare',
      operation: 'prepare_quote',
      status: 400,
      durationMs: Date.now() - startedAt,
      errorCode: 'INVALID_REQUEST',
    });
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: {
          code: 'INVALID_REQUEST',
          message: CHECKOUT_COPY.ERROR_INVALID_REQUEST,
        },
        requestId,
      }),
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  // 3. Schema validation with fieldErrors
  const parsed = checkoutPrepareRequestSchema.safeParse(body);
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
      route: '/api/checkout/prepare',
      operation: 'prepare_quote',
      status: 422,
      durationMs: Date.now() - startedAt,
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
      {
        status: 422,
        headers: NO_STORE_HEADERS,
      },
    );
  }

  // 4. Generate quote and handle domain errors
  try {
    const result = await prepareCheckoutQuote(parsed.data, {
      now: new Date(),
      signal: request.signal,
    });

    const successEnvelope = apiSuccessSchema(
      checkoutPrepareResponseSchema,
    ).parse({
      ok: true,
      data: result,
      requestId,
    });

    logServerEvent({
      requestId,
      route: '/api/checkout/prepare',
      operation: 'prepare_quote',
      status: 200,
      durationMs: Date.now() - startedAt,
      branchId: result.branch.id,
      count: result.lines.length,
    });
    return NextResponse.json(successEnvelope, {
      status: 200,
      headers: NO_STORE_HEADERS,
    });
  } catch (err) {
    if (err instanceof CheckoutError) {
      logServerEvent({
        requestId,
        route: '/api/checkout/prepare',
        operation: 'prepare_quote',
        status: err.status,
        durationMs: Date.now() - startedAt,
        errorCode: err.code,
      });
      return NextResponse.json(
        apiErrorSchema.parse({
          ok: false,
          error: {
            code: err.code,
            message: err.message,
            ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
          },
          requestId,
        }),
        {
          status: err.status,
          headers: NO_STORE_HEADERS,
        },
      );
    }

    if (err instanceof Error && err.name === 'AbortError') {
      logServerEvent({
        requestId,
        route: '/api/checkout/prepare',
        operation: 'prepare_quote',
        status: 504,
        durationMs: Date.now() - startedAt,
        errorCode: 'TIMEOUT',
      });
      return NextResponse.json(
        apiErrorSchema.parse({
          ok: false,
          error: {
            code: 'TIMEOUT',
            message: ERROR_COPY.TIMEOUT,
          },
          requestId,
        }),
        {
          status: 504,
          headers: NO_STORE_HEADERS,
        },
      );
    }

    logServerEvent({
      requestId,
      route: '/api/checkout/prepare',
      operation: 'prepare_quote',
      status: 503,
      durationMs: Date.now() - startedAt,
      errorCode: 'UPSTREAM_ERROR',
    });
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: {
          code: 'UPSTREAM_ERROR',
          message: ERROR_COPY.UPSTREAM_ERROR,
        },
        requestId,
      }),
      {
        status: 503,
        headers: NO_STORE_HEADERS,
      },
    );
  }
}
