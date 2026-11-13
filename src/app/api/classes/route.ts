import { NextResponse } from 'next/server';

import { CATALOG_QUERY_PARAMS } from '@/constants/catalog.constant';
import { ERROR_COPY } from '@/constants/copy.constant';
import { PublicClassError } from '@/features/classes/errors.server';
import { getPublicClassesDirectory } from '@/features/classes/service.server';
import { apiErrorSchema } from '@/validations/api.schema';
import {
  publicClassQuerySchema,
  publicClassesListResponseSchema,
} from '@/validations/classes.schema';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const searchParams = new URL(request.url).searchParams;

  for (const key of searchParams.keys()) {
    if (
      key !== CATALOG_QUERY_PARAMS.BRANCH ||
      searchParams.getAll(key).length > 1
    ) {
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
  }

  const branchRaw = searchParams.get(CATALOG_QUERY_PARAMS.BRANCH);
  const parsed = publicClassQuerySchema.safeParse({
    branch:
      branchRaw && branchRaw.trim().length > 0 ? branchRaw.trim() : undefined,
  });

  if (!parsed.success) {
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

  try {
    const data = await getPublicClassesDirectory(parsed.data, request.signal);
    const payload = publicClassesListResponseSchema.parse({
      ok: true,
      data,
      requestId,
    });
    return NextResponse.json(payload, {
      status: 200,
      headers: NO_STORE_HEADERS,
    });
  } catch (err) {
    const status = err instanceof PublicClassError ? err.statusCode : 503;
    const code =
      err instanceof PublicClassError ? err.apiCode : 'UPSTREAM_ERROR';
    const message =
      err instanceof PublicClassError ? err.message : ERROR_COPY.UPSTREAM_ERROR;
    return NextResponse.json(
      apiErrorSchema.parse({
        ok: false,
        error: { code, message },
        requestId,
      }),
      { status, headers: NO_STORE_HEADERS },
    );
  }
}
