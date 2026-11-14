import { NextResponse } from 'next/server';
import { ERROR_COPY } from '@/constants/copy.constant';
import { getPublicPromotions } from '@/features/promotions/service.server';
import { logServerEvent } from '@/lib/logger.server';
import { createSuccessResponse } from '@/lib/response.server';
import { apiErrorSchema } from '@/validations/api.schema';
import {
  publicPromotionsQuerySchema,
  publicPromotionsResponseSchema,
} from '@/validations/promotion.schema';

const ALLOWED_PARAM_KEYS = new Set<string>(['branch']);

export async function GET(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  const params = new URL(request.url).searchParams;

  for (const key of params.keys()) {
    if (!ALLOWED_PARAM_KEYS.has(key) || params.getAll(key).length > 1) {
      logServerEvent({
        requestId,
        route: '/api/promotions',
        operation: 'list_promotions',
        status: 400,
        durationMs: Date.now() - startedAt,
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
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }
  }

  const rawEntries: Record<string, string> = {};
  params.forEach((value, key) => {
    if (value.trim().length > 0) {
      rawEntries[key] = value;
    }
  });

  const parsed = publicPromotionsQuerySchema.safeParse(rawEntries);
  if (!parsed.success) {
    logServerEvent({
      requestId,
      route: '/api/promotions',
      operation: 'list_promotions',
      status: 400,
      durationMs: Date.now() - startedAt,
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
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const data = await getPublicPromotions(
      parsed.data,
      new Date(),
      request.signal,
    );
    logServerEvent({
      requestId,
      route: '/api/promotions',
      operation: 'list_promotions',
      status: 200,
      durationMs: Date.now() - startedAt,
      branchCode: parsed.data.branch ?? null,
      count: data.promotions.length,
    });
    return createSuccessResponse(
      publicPromotionsResponseSchema,
      data,
      requestId,
    );
  } catch {
    logServerEvent({
      requestId,
      route: '/api/promotions',
      operation: 'list_promotions',
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
