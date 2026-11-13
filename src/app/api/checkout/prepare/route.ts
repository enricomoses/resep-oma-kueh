import { NextResponse } from 'next/server';
import { CHECKOUT_COPY, CHECKOUT_LIMITS } from '@/constants/checkout.constant';
import { ERROR_COPY } from '@/constants/copy.constant';
import { CheckoutError } from '@/features/checkout/errors.server';
import { prepareCheckoutQuote } from '@/features/checkout/service.server';
import { apiErrorSchema, apiSuccessSchema } from '@/validations/api.schema';
import {
  checkoutPrepareRequestSchema,
  checkoutPrepareResponseSchema,
} from '@/validations/checkout.schema';

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  // 1. Enforce payload byte limit (32 KiB)
  const contentLength = request.headers.get('content-length');
  if (
    contentLength &&
    parseInt(contentLength, 10) > CHECKOUT_LIMITS.MAX_REQUEST_BYTES
  ) {
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: {
          code: 'REQUEST_TOO_LARGE',
          message: CHECKOUT_COPY.ERROR_TOO_LARGE,
        },
        requestId,
      }),
      {
        status: 413,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      },
    );
  }

  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await request.arrayBuffer();
  } catch {
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: {
          code: 'INVALID_REQUEST',
          message: CHECKOUT_COPY.ERROR_INVALID_REQUEST,
        },
        requestId,
      }),
      {
        status: 400,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      },
    );
  }

  if (arrayBuffer.byteLength > CHECKOUT_LIMITS.MAX_REQUEST_BYTES) {
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: {
          code: 'REQUEST_TOO_LARGE',
          message: CHECKOUT_COPY.ERROR_TOO_LARGE,
        },
        requestId,
      }),
      {
        status: 413,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      },
    );
  }

  // 2. Parse JSON body
  const text = new TextDecoder('utf-8').decode(arrayBuffer);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: {
          code: 'INVALID_REQUEST',
          message: CHECKOUT_COPY.ERROR_INVALID_REQUEST,
        },
        requestId,
      }),
      {
        status: 400,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      },
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
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
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

    return NextResponse.json(successEnvelope, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err) {
    if (err instanceof CheckoutError) {
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
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        },
      );
    }

    if (err instanceof Error && err.name === 'AbortError') {
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
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        },
      );
    }

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
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      },
    );
  }
}
