import { NextResponse } from 'next/server';
import { CATALOG_QUERY_PARAMS } from '@/constants/catalog.constant';
import { ERROR_COPY } from '@/constants/copy.constant';
import { getCatalog } from '@/features/catalog/service.server';
import { createSuccessResponse } from '@/lib/response.server';
import { apiErrorSchema } from '@/validations/api.schema';
import {
  catalogDirectorySchema,
  catalogQuerySchema,
} from '@/validations/catalog.schema';

const ALLOWED_PARAM_KEYS = new Set<string>(Object.values(CATALOG_QUERY_PARAMS));

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const params = new URL(request.url).searchParams;

  for (const key of params.keys()) {
    if (!ALLOWED_PARAM_KEYS.has(key) || params.getAll(key).length > 1) {
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
    return createSuccessResponse(
      catalogDirectorySchema,
      await getCatalog(parsed.data, {}, request.signal),
      requestId,
    );
  } catch {
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
