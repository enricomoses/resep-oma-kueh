import { NextResponse } from 'next/server';
import { CART_LIMITS } from '@/constants/cart.constant';
import { ERROR_COPY } from '@/constants/copy.constant';
import { validateCartItems } from '@/features/cart/service.server';
import { logServerEvent } from '@/lib/logger.server';
import { readBoundedUtf8Body } from '@/lib/request-body.server';
import { createSuccessResponse } from '@/lib/response.server';
import { apiErrorSchema } from '@/validations/api.schema';
import {
  cartValidationRequestSchema,
  cartValidationResponseSchema,
} from '@/validations/cart.schema';

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();

  const bounded = await readBoundedUtf8Body(
    request,
    CART_LIMITS.MAX_REQUEST_BYTES,
  );
  if (!bounded.ok) {
    const isTooLarge = bounded.reason === 'too_large';
    const status = isTooLarge ? 413 : 400;
    const code = isTooLarge ? 'REQUEST_TOO_LARGE' : 'INVALID_REQUEST';
    logServerEvent({
      requestId,
      route: '/api/cart/validate',
      operation: 'validate_cart',
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
            ? ERROR_COPY.REQUEST_TOO_LARGE
            : ERROR_COPY.INVALID_REQUEST,
        },
        requestId,
      }),
      { status, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(bounded.text);
  } catch {
    logServerEvent({
      requestId,
      route: '/api/cart/validate',
      operation: 'validate_cart',
      status: 400,
      durationMs: Date.now() - startedAt,
      errorCode: 'INVALID_REQUEST',
    });
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: { code: 'INVALID_REQUEST', message: ERROR_COPY.INVALID_REQUEST },
        requestId,
      }),
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const parsed = cartValidationRequestSchema.safeParse(body);
  if (!parsed.success) {
    logServerEvent({
      requestId,
      route: '/api/cart/validate',
      operation: 'validate_cart',
      status: 422,
      durationMs: Date.now() - startedAt,
      errorCode: 'INVALID_REQUEST',
    });
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: { code: 'INVALID_REQUEST', message: ERROR_COPY.INVALID_REQUEST },
        requestId,
      }),
      { status: 422, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const result = await validateCartItems(
      parsed.data,
      new Date(),
      request.signal,
    );
    logServerEvent({
      requestId,
      route: '/api/cart/validate',
      operation: 'validate_cart',
      status: 200,
      durationMs: Date.now() - startedAt,
      branchId: result.branchId,
      count: result.lines.length,
    });
    return createSuccessResponse(
      cartValidationResponseSchema,
      result,
      requestId,
    );
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.toLowerCase().includes('not found')
    ) {
      logServerEvent({
        requestId,
        route: '/api/cart/validate',
        operation: 'validate_cart',
        status: 404,
        durationMs: Date.now() - startedAt,
        errorCode: 'NOT_FOUND',
      });
      return NextResponse.json(
        apiErrorSchema.parse({
          ok: false,
          error: { code: 'NOT_FOUND', message: 'Cabang tidak ditemukan' },
          requestId,
        }),
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    logServerEvent({
      requestId,
      route: '/api/cart/validate',
      operation: 'validate_cart',
      status: 503,
      durationMs: Date.now() - startedAt,
      errorCode: 'UPSTREAM_ERROR',
    });
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: { code: 'UPSTREAM_ERROR', message: ERROR_COPY.UPSTREAM_ERROR },
        requestId,
      }),
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
