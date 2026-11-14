import { NextResponse } from 'next/server';
import { CATALOG_QUERY_PARAMS } from '@/constants/catalog.constant';
import { ERROR_COPY } from '@/constants/copy.constant';
import { getCatalog } from '@/features/catalog/service.server';
import { logServerEvent } from '@/lib/logger.server';
import { createSuccessResponse } from '@/lib/response.server';
import { apiErrorSchema } from '@/validations/api.schema';
import {
  catalogDirectorySchema,
  catalogQuerySchema,
} from '@/validations/catalog.schema';

const ALLOWED_PARAM_KEYS = new Set<string>(Object.values(CATALOG_QUERY_PARAMS));

export async function GET(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  const params = new URL(request.url).searchParams;

  for (const key of params.keys()) {
    if (!ALLOWED_PARAM_KEYS.has(key) || params.getAll(key).length > 1) {
      logServerEvent({
        requestId,
        route: '/api/catalog',
        operation: 'list_catalog',
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

  const parsed = catalogQuerySchema.safeParse(rawEntries);
  if (!parsed.success) {
    logServerEvent({
      requestId,
      route: '/api/catalog',
      operation: 'list_catalog',
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

  try {
    const data = await getCatalog(parsed.data, {}, request.signal);
    logServerEvent({
      requestId,
      route: '/api/catalog',
      operation: 'list_catalog',
      status: 200,
      durationMs: Date.now() - startedAt,
      branchId: data.resolvedBranchId,
      branchCode: data.appliedFilters.branch,
      count: data.items.length,
    });
    return createSuccessResponse(catalogDirectorySchema, data, requestId);
  } catch {
    logServerEvent({
      requestId,
      route: '/api/catalog',
      operation: 'list_catalog',
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
