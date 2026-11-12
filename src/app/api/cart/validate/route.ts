import { NextResponse } from 'next/server';
import { ERROR_COPY } from '@/constants/copy.constant';
import { validateCartItems } from '@/features/cart/service.server';
import { createSuccessResponse } from '@/lib/response.server';
import { apiErrorSchema } from '@/validations/api.schema';
import {
  cartValidationRequestSchema,
  cartValidationResponseSchema,
} from '@/validations/cart.schema';

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
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
      return NextResponse.json(
        apiErrorSchema.parse({
          ok: false,
          error: { code: 'NOT_FOUND', message: 'Cabang tidak ditemukan' },
          requestId,
        }),
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      );
    }

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
